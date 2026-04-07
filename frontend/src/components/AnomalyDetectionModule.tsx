import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, AlertTriangle, Zap, Radio, Volume2, VolumeX, Thermometer, Gauge, Waves } from 'lucide-react';
import {
    ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, ReferenceArea,
} from 'recharts';
import type { NoiseType, SensorType, SignalDataPoint, ClusterPoint } from '../engines/anomalyEngine';
import {
    generateSignal, generateClusterPoint, calculateConfidence,
    resetEngine, createInitialClusterData, playAlertBeep,
    SENSOR_CONFIGS, type SensorConfig,
} from '../engines/anomalyEngine';

interface AnomalyDetectionModuleProps {
    onClose: () => void;
}

interface ChartDataPoint extends SignalDataPoint {
    displayTime: string;
}

interface AnomalyEvent {
    id: number;
    timestamp: string;
    sensorLabel: string;
    severity: 'low' | 'medium' | 'critical';
    score: number;
    typeName: string;
    noiseType: NoiseType;
}

// ── Reasoning step templates per noise type ──────────────────────────────────
const REASONING_STEPS_MAP: Record<NoiseType, (c: SensorConfig) => string[]> = {
    random: (c) => [
        `${c.shortLabel} sinyal varyasyonu analiz ediliyor...`,
        `Z-Score: 3.82 → eşik aşıldı (σ > 2.5)`,
        `⚠️ Rastgele Parazit tespit edildi! Skor: 0.87`,
    ],
    spike: (c) => [
        `Ani genlik artışı algılandı — ${c.unit} kritik seviyede`,
        `Değer baseline'dan +${(c.anomalyThreshold + 12).toFixed(0)} ${c.unit} saptı`,
        `⚠️ Ani Sinyal Sıçraması teyit edildi! Skor: 0.94`,
    ],
    flat: (c) => [
        `${c.shortLabel} sinyal aktivitesi durdu...`,
        `Flatline süresi > 0.5s — İletişim kesildi?`,
        `⚠️ Sensör Donması teyit edildi! Skor: 0.98`,
    ],
    none: (_c) => [
        'Sinyal inceleniyor...',
        'Tüm parametreler beklenen aralıkta',
        '✓ Normal operasyon teyit edildi',
    ],
};

const NOISE_TYPE_NAMES: Record<NoiseType, string> = {
    random: 'Rastgele Parazit',
    spike: 'Ani Spike',
    flat: 'Sensör Donması',
    none: 'Bilinmeyen',
};

const SENSOR_ICONS: Record<SensorType, React.ReactNode> = {
    pressure: <Gauge size={12} />,
    temperature: <Thermometer size={12} />,
    vibration: <Waves size={12} />,
};

// ── Confidence Badge (replaces arc gauge) ─────────────────────────────────────
const ConfidenceBadge: React.FC<{ confidence: number }> = ({ confidence }) => {
    const color = confidence > 70 ? '#10b981' : confidence > 40 ? '#f59e0b' : '#ef4444';
    return (
        <div className="confidence-badge-display">
            <span className="confidence-badge-label">GÜVEN</span>
            <span className="confidence-badge-value" style={{ color }}>{confidence}%</span>
        </div>
    );
};

// ── Anomaly Timeline Strip ────────────────────────────────────────────────────
const AnomalyTimeline: React.FC<{ data: number[] }> = ({ data }) => {
    const getColor = (score: number) => {
        if (score === 0) return 'rgba(255,255,255,0.05)';
        if (score < 0.2) return 'rgba(16,185,129,0.65)';
        if (score < 0.6) return 'rgba(245,158,11,0.8)';
        return 'rgba(239,68,68,0.9)';
    };

    return (
        <div className="anomaly-timeline">
            <span className="timeline-label">60s</span>
            <div className="timeline-track">
                {Array.from({ length: 60 }).map((_, i) => {
                    const score = data[data.length - 60 + i] ?? 0;
                    return (
                        <div
                            key={i}
                            className="timeline-seg"
                            style={{ background: getColor(score) }}
                            title={`Skor: ${(score * 100).toFixed(0)}%`}
                        />
                    );
                })}
            </div>
            <span className="timeline-label">şimdi</span>
        </div>
    );
};

// ── Animated SVG Cluster Map ──────────────────────────────────────────────────
// NOTE: cx/cy are plain SVG attributes (instant update, no spring).
// Only opacity animates via motion.g — keeps GPU load minimal.
const AnimatedCluster: React.FC<{ data: ClusterPoint[] }> = ({ data }) => {
    const W = 260, H = 170;
    const domain = 6;

    const toSVG = (x: number, y: number) => ({
        cx: ((x + domain) / (2 * domain)) * W,
        cy: ((domain - y) / (2 * domain)) * H,
    });

    return (
        <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} className="cluster-svg">
            {/* Grid lines */}
            <line x1={W / 2} y1={0} x2={W / 2} y2={H} stroke="rgba(99,102,241,0.12)" strokeWidth="1" />
            <line x1={0} y1={H / 2} x2={W} y2={H / 2} stroke="rgba(99,102,241,0.12)" strokeWidth="1" />
            {/* Normal zone */}
            <circle
                cx={W / 2} cy={H / 2}
                r={(1.5 / (2 * domain)) * W}
                fill="rgba(59,130,246,0.05)"
                stroke="rgba(59,130,246,0.18)"
                strokeWidth="1"
                strokeDasharray="4 3"
            />
            {/* Outer alert ring */}
            <circle
                cx={W / 2} cy={H / 2}
                r={(4 / (2 * domain)) * W}
                fill="none"
                stroke="rgba(239,68,68,0.08)"
                strokeWidth="1"
                strokeDasharray="4 4"
            />
            {/* Data points — motion.g handles enter/exit opacity only, no position spring */}
            <AnimatePresence>
                {data.map((pt) => {
                    const pos = toSVG(pt.x, pt.y);
                    return (
                        <motion.g
                            key={pt.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.28, ease: 'easeOut' }}
                        >
                            <circle
                                cx={pos.cx}
                                cy={pos.cy}
                                r={pt.isAnomaly ? 5 : 3.5}
                                fill={pt.isAnomaly ? '#ef4444' : '#3b82f6'}
                                opacity={pt.isAnomaly ? 0.88 : 0.52}
                            />
                        </motion.g>
                    );
                })}
            </AnimatePresence>
        </svg>
    );
};

// ── AI Reasoning Panel ────────────────────────────────────────────────────────
const ReasoningPanel: React.FC<{ steps: string[]; isAnomaly: boolean }> = ({ steps, isAnomaly }) => (
    <motion.div
        className={`anomaly-reasoning-panel ${isAnomaly ? 'is-anomaly' : ''}`}
        initial={{ opacity: 0, y: -6, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -6, scale: 0.98 }}
        transition={{ duration: 0.2 }}
    >
        <div className="reasoning-panel-header">
            <span className="reasoning-dots">
                <span /><span /><span />
            </span>
            <span className="reasoning-panel-title">AI Analiz</span>
        </div>
        <div className="reasoning-lines">
            {steps.map((step, i) => (
                <motion.div
                    key={i}
                    className={`reasoning-line ${step.startsWith('⚠️') ? 'alert' : step.startsWith('✓') ? 'ok' : ''}`}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <span className="reasoning-step-num">[{i + 1}/3]</span>
                    {step}
                </motion.div>
            ))}
            {steps.length < 3 && (
                <span className="reasoning-cursor">▋</span>
            )}
        </div>
    </motion.div>
);

// ── Structured Event List ─────────────────────────────────────────────────────
const SEVERITY_INFO = {
    critical: { label: 'Kritik', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
    medium:   { label: 'Orta',   color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
    low:      { label: 'Düşük',  color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
} as const;

const EventList: React.FC<{ events: AnomalyEvent[]; onClear: () => void }> = ({ events, onClear }) => (
    <div className="anomaly-event-list-container">
        <div className="event-list-header">
            <span>📋 Anomali Kayıtları</span>
            {events.length > 0 && (
                <button className="event-clear-btn" onClick={onClear}>Temizle</button>
            )}
        </div>
        <div className="anomaly-event-list">
            <AnimatePresence initial={false}>
                {events.length === 0 ? (
                    <div key="empty" className="event-empty">Henüz anomali kaydedilmedi</div>
                ) : (
                    events.map(ev => {
                        const info = SEVERITY_INFO[ev.severity];
                        return (
                            <motion.div
                                key={ev.id}
                                className="anomaly-event-card"
                                style={{ borderLeftColor: info.color }}
                                initial={{ opacity: 0, x: 18 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -18 }}
                                transition={{ duration: 0.22 }}
                            >
                                <div className="event-card-top">
                                    <span className="event-card-time">{ev.timestamp}</span>
                                    <span className="event-card-sensor">{ev.sensorLabel}</span>
                                    <span
                                        className="event-card-severity"
                                        style={{ color: info.color, background: info.bg }}
                                    >
                                        {info.label}
                                    </span>
                                </div>
                                <div className="event-card-bottom">
                                    <span className="event-card-type">{ev.typeName}</span>
                                    <div className="event-score-bg">
                                        <div
                                            className="event-score-fill"
                                            style={{ width: `${(ev.score * 100).toFixed(0)}%`, background: info.color }}
                                        />
                                    </div>
                                    <span className="event-score-num">{(ev.score * 100).toFixed(0)}</span>
                                </div>
                            </motion.div>
                        );
                    })
                )}
            </AnimatePresence>
        </div>
    </div>
);

// ── Main Component ────────────────────────────────────────────────────────────
const AnomalyDetectionModule: React.FC<AnomalyDetectionModuleProps> = ({ onClose }) => {
    const [activeSensor, setActiveSensor] = useState<SensorType>('pressure');
    const [signalData, setSignalData] = useState<ChartDataPoint[]>([]);
    const [clusterData, setClusterData] = useState<ClusterPoint[]>(createInitialClusterData());
    const [activeNoise, setActiveNoise] = useState<NoiseType>('none');
    const [isAnomalyActive, setIsAnomalyActive] = useState(false);
    const [currentStatus, setCurrentStatus] = useState<'normal' | 'anomaly'>('normal');
    const [confidence, setConfidence] = useState(99);
    const [timeline, setTimeline] = useState<number[]>([]);
    const [reasoningSteps, setReasoningSteps] = useState<string[]>([]);
    const [showReasoning, setShowReasoning] = useState(false);
    const [events, setEvents] = useState<AnomalyEvent[]>([]);
    const [soundEnabled, setSoundEnabled] = useState(true);

    // Refs
    const anomalyDebounceRef = useRef(false);
    const lastAnomalyTimeRef = useRef(0);
    const lastBeepTimeRef = useRef(0);
    const currentScoreRef = useRef(0);
    const cycleCountRef = useRef(0);
    const maxScoreWindowRef = useRef(0);
    const reasoningShownRef = useRef(false);
    const reasoningTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
    const activeNoiseRef = useRef(activeNoise);
    const activeSensorRef = useRef(activeSensor);
    const eventIdRef = useRef(0);

    // Keep refs in sync
    useEffect(() => { activeNoiseRef.current = activeNoise; }, [activeNoise]);
    useEffect(() => { activeSensorRef.current = activeSensor; }, [activeSensor]);

    // Reset on mount
    useEffect(() => {
        resetEngine();
        return () => resetEngine();
    }, []);

    // Trigger reasoning when anomaly state changes
    useEffect(() => {
        if (isAnomalyActive && !reasoningShownRef.current && activeNoiseRef.current !== 'none') {
            reasoningShownRef.current = true;
            const noise = activeNoiseRef.current;
            const sensor = activeSensorRef.current;
            const config = SENSOR_CONFIGS[sensor];
            const steps = REASONING_STEPS_MAP[noise](config);

            setReasoningSteps([]);
            setShowReasoning(true);

            // Track all timeouts so they can be cancelled
            steps.forEach((step, i) => {
                const t = setTimeout(() => setReasoningSteps(p => [...p, step]), i * 380);
                reasoningTimeoutsRef.current.push(t);
            });

            // Add event after steps complete
            const t = setTimeout(() => {
                const score = currentScoreRef.current;
                const severity: AnomalyEvent['severity'] =
                    score > 0.7 ? 'critical' : score > 0.4 ? 'medium' : 'low';
                setEvents(prev => [{
                    id: ++eventIdRef.current,
                    timestamp: new Date().toLocaleTimeString('tr-TR'),
                    sensorLabel: config.shortLabel,
                    severity,
                    score,
                    typeName: NOISE_TYPE_NAMES[noise],
                    noiseType: noise,
                }, ...prev.slice(0, 4)]);
            }, steps.length * 380 + 400);
            reasoningTimeoutsRef.current.push(t);

        } else if (!isAnomalyActive) {
            // Cancel any in-flight reasoning timeouts before resetting
            reasoningTimeoutsRef.current.forEach(clearTimeout);
            reasoningTimeoutsRef.current = [];
            reasoningShownRef.current = false;
            setShowReasoning(false);
            setReasoningSteps([]);
        }
    }, [isAnomalyActive]);

    // Main signal generation loop (100ms)
    useEffect(() => {
        cycleCountRef.current = 0;
        maxScoreWindowRef.current = 0;

        const interval = setInterval(() => {
            const signal = generateSignal(activeNoise, activeSensor);
            const cluster = generateClusterPoint(signal);
            const displayTime = new Date().toLocaleTimeString('tr-TR', {
                hour: '2-digit', minute: '2-digit', second: '2-digit',
            });

            currentScoreRef.current = signal.anomalyScore;

            // Timeline: max score per second (every 10 cycles)
            cycleCountRef.current++;
            maxScoreWindowRef.current = Math.max(maxScoreWindowRef.current, signal.anomalyScore);
            if (cycleCountRef.current >= 10) {
                const score = maxScoreWindowRef.current;
                cycleCountRef.current = 0;
                maxScoreWindowRef.current = 0;
                setTimeline(prev => {
                    const next = [...prev, score];
                    return next.length > 60 ? next.slice(-60) : next;
                });
            }

            // Rolling signal window
            setSignalData(prev => {
                const n = [...prev, { ...signal, displayTime }];
                return n.length > 50 ? n.slice(-50) : n;
            });

            // Rolling cluster window
            setClusterData(prev => {
                const n = [...prev, cluster];
                return n.length > 50 ? n.slice(-50) : n;
            });

            // Anomaly debounce
            const now = Date.now();
            if (signal.isAnomaly) {
                lastAnomalyTimeRef.current = now;
                if (!anomalyDebounceRef.current) {
                    anomalyDebounceRef.current = true;
                    setIsAnomalyActive(true);
                    setCurrentStatus('anomaly');
                }
                if (soundEnabled && now - lastBeepTimeRef.current > 1000) {
                    playAlertBeep();
                    lastBeepTimeRef.current = now;
                }
            } else {
                if (anomalyDebounceRef.current && now - lastAnomalyTimeRef.current > 1500) {
                    anomalyDebounceRef.current = false;
                    setIsAnomalyActive(false);
                    setCurrentStatus('normal');
                }
            }

            setConfidence(calculateConfidence(signal.anomalyScore));
        }, 100);

        return () => clearInterval(interval);
    }, [activeNoise, activeSensor, soundEnabled]);

    // Switch sensor — full reset
    const handleSensorChange = useCallback((sensor: SensorType) => {
        if (sensor === activeSensor) return;
        setActiveSensor(sensor);
        setActiveNoise('none');
        setSignalData([]);
        setClusterData(createInitialClusterData());
        setTimeline([]);
        setReasoningSteps([]);
        setShowReasoning(false);
        anomalyDebounceRef.current = false;
        reasoningShownRef.current = false;
        setIsAnomalyActive(false);
        setCurrentStatus('normal');
        setConfidence(99);
        resetEngine();
    }, [activeSensor]);

    const handleSabotage = useCallback((type: NoiseType) => {
        setActiveNoise(prev => prev === type ? 'none' : type);
    }, []);

    // Build anomaly highlight regions for the chart
    const getAnomalyRegions = useCallback(() => {
        const regions: { start: number; end: number }[] = [];
        let start: number | null = null;
        signalData.forEach((pt, i) => {
            if (pt.isAnomaly) {
                if (start === null) start = i;
            } else if (start !== null) {
                regions.push({ start, end: i - 1 });
                start = null;
            }
        });
        if (start !== null) regions.push({ start, end: signalData.length - 1 });
        return regions;
    }, [signalData]);

    const sensor = SENSOR_CONFIGS[activeSensor];

    return (
        <div className="modal-overlay" onClick={onClose}>
            <motion.div
                className={`modal-content anomaly-module ${isAnomalyActive ? 'anomaly-active' : ''}`}
                onClick={e => e.stopPropagation()}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                style={{ maxWidth: '1160px' }}
            >
                {/* Anomaly border pulse only — no strobe overlay (causes flicker) */}

                {/* ── Header ───────────────────────────────────────────── */}
                <div className="modal-header anomaly-header">
                    <div className="header-left">
                        <Activity className="header-icon" />
                        <div>
                            <h2>Anomali Tespiti</h2>
                            <p className="header-subtitle">Denetimsiz Öğrenme ile Sinyal İzleme</p>
                        </div>
                    </div>
                    <div className="header-right">
                        <div className={`status-badge ${currentStatus}`}>
                            {currentStatus === 'normal' ? (
                                <><span className="status-dot normal" />DURUM: NORMAL</>
                            ) : (
                                <><AlertTriangle size={14} />ANOMALİ TESPİT EDİLDİ</>
                            )}
                        </div>
                        <ConfidenceBadge confidence={confidence} />
                        <button
                            className="sound-toggle"
                            onClick={() => setSoundEnabled(p => !p)}
                            title={soundEnabled ? 'Sesi Kapat' : 'Sesi Aç'}
                        >
                            {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                        </button>
                        <button onClick={onClose} className="close-btn">✕</button>
                    </div>
                </div>

                {/* ── Content ──────────────────────────────────────────── */}
                <div className="anomaly-content">

                    {/* LEFT — Chart + Timeline + Sabotage */}
                    <div className="anomaly-left">
                        <div className="scope-container">
                            {/* Scope header with sensor tabs */}
                            <div className="scope-header">
                                <div className="scope-header-row">
                                    <h3><Radio size={15} /> Canlı Sinyal Akışı</h3>
                                    {/* ① Sensor Selector Tabs */}
                                    <div className="sensor-tabs">
                                        {(['pressure', 'temperature', 'vibration'] as SensorType[]).map(s => {
                                            const cfg = SENSOR_CONFIGS[s];
                                            const isActive = activeSensor === s;
                                            return (
                                                <button
                                                    key={s}
                                                    className={`sensor-tab ${isActive ? 'active' : ''}`}
                                                    style={isActive ? {
                                                        borderColor: cfg.color,
                                                        color: cfg.color,
                                                        background: `${cfg.color}1a`,
                                                    } : {}}
                                                    onClick={() => handleSensorChange(s)}
                                                >
                                                    {SENSOR_ICONS[s]}
                                                    {cfg.shortLabel}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                                <span className="scope-label" style={{ color: sensor.color }}>
                                    {sensor.label} ({sensor.unit})
                                </span>
                            </div>

                            {/* Chart */}
                            <div className="live-scope-chart">
                                <ResponsiveContainer width="100%" height={260}>
                                    <ComposedChart data={signalData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="signalFill" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={sensor.color} stopOpacity={0.22} />
                                                <stop offset="95%" stopColor={sensor.color} stopOpacity={0.01} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke={`${sensor.color}18`} vertical={false} />
                                        <XAxis
                                            dataKey="displayTime"
                                            stroke={sensor.color}
                                            tick={{ fill: sensor.color, fontSize: 10 }}
                                            axisLine={{ stroke: `${sensor.color}40` }}
                                            interval="preserveStartEnd"
                                        />
                                        <YAxis
                                            domain={sensor.yDomain}
                                            stroke={sensor.color}
                                            tick={{ fill: sensor.color, fontSize: 10 }}
                                            axisLine={{ stroke: `${sensor.color}40` }}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                background: 'rgba(0,0,0,0.9)',
                                                border: `1px solid ${sensor.color}`,
                                                borderRadius: '4px',
                                                color: sensor.color,
                                            }}
                                            formatter={(v) => [
                                                typeof v === 'number' ? `${v.toFixed(2)} ${sensor.unit}` : v,
                                                'Değer',
                                            ]}
                                        />
                                        {/* Threshold bands */}
                                        <ReferenceArea
                                            y1={sensor.yDomain[1] * 0.8}
                                            y2={sensor.yDomain[1]}
                                            fill="rgba(239,68,68,0.05)"
                                            stroke="rgba(239,68,68,0.25)"
                                            strokeDasharray="4 4"
                                        />
                                        <ReferenceArea
                                            y1={sensor.yDomain[0]}
                                            y2={sensor.yDomain[0] * 0.8}
                                            fill="rgba(239,68,68,0.05)"
                                            stroke="rgba(239,68,68,0.25)"
                                            strokeDasharray="4 4"
                                        />
                                        {/* Anomaly highlight regions */}
                                        {getAnomalyRegions().map((region, idx) => (
                                            <ReferenceArea
                                                key={idx}
                                                x1={signalData[region.start]?.displayTime}
                                                x2={signalData[region.end]?.displayTime}
                                                fill="rgba(255,0,0,0.15)"
                                                stroke="rgba(255,0,0,0.35)"
                                            />
                                        ))}
                                        <Area
                                            type="monotone"
                                            dataKey="value"
                                            fill="url(#signalFill)"
                                            stroke="none"
                                            isAnimationActive={false}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="value"
                                            stroke={sensor.color}
                                            strokeWidth={2}
                                            dot={false}
                                            isAnimationActive={false}
                                        />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </div>

                            {/* ② Anomaly Timeline Strip */}
                            <AnomalyTimeline data={timeline} />
                        </div>

                        {/* Sabotage Panel */}
                        <div className="sabotage-controls">
                            <h3><Zap size={16} /> Sinyal Bozucular (Sabotaj Paneli)</h3>
                            <p className="controls-hint">Sinyale parazit ekleyerek AI'ın anomali tespit yeteneğini test edin</p>
                            <div className="sabotage-buttons">
                                <button
                                    className={`sabotage-btn noise ${activeNoise === 'random' ? 'active' : ''}`}
                                    onClick={() => handleSabotage('random')}
                                >
                                    <span className="btn-icon">📡</span>
                                    <span className="btn-label">Gürültü Ekle</span>
                                    <span className="btn-desc">Rastgele titreşim</span>
                                </button>
                                <button
                                    className={`sabotage-btn spike ${activeNoise === 'spike' ? 'active' : ''}`}
                                    onClick={() => handleSabotage('spike')}
                                >
                                    <span className="btn-icon">⚡</span>
                                    <span className="btn-label">Ani Spike</span>
                                    <span className="btn-desc">Anlık fırlama</span>
                                </button>
                                <button
                                    className={`sabotage-btn flat ${activeNoise === 'flat' ? 'active' : ''}`}
                                    onClick={() => handleSabotage('flat')}
                                >
                                    <span className="btn-icon">❄️</span>
                                    <span className="btn-label">Sensör Dondur</span>
                                    <span className="btn-desc">Veri kaybı</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT — Cluster + Reasoning + Events */}
                    <div className="anomaly-right">

                        {/* ⑤ Animated Cluster Map */}
                        <div className="cluster-container">
                            <div className="cluster-header-row">
                                <h3>Kümeleme Haritası</h3>
                                <span className="cluster-hint-badge">
                                    {clusterData.filter(p => p.isAnomaly).length > 0
                                        ? `${clusterData.filter(p => p.isAnomaly).length} anomali noktası`
                                        : 'Normal küme'}
                                </span>
                            </div>
                            <p className="cluster-hint">Normal veri merkezde toplanır, anomaliler dışarı fırlar</p>
                            <div className="cluster-map">
                                <AnimatedCluster data={clusterData} />
                            </div>
                            <div className="cluster-legend">
                                <span className="legend-item"><span className="dot normal" /> Normal Veri</span>
                                <span className="legend-item"><span className="dot anomaly" /> Anomali</span>
                            </div>
                        </div>

                        {/* ③ AI Reasoning Panel */}
                        <AnimatePresence>
                            {showReasoning && (
                                <ReasoningPanel steps={reasoningSteps} isAnomaly={isAnomalyActive} />
                            )}
                        </AnimatePresence>

                        {/* ⑥ Structured Event List */}
                        <EventList events={events} onClear={() => setEvents([])} />

                        {/* Compact info note */}
                        {!showReasoning && events.length === 0 && (
                            <div className="info-card anomaly-info">
                                <h4>💡 Nasıl Çalışır?</h4>
                                <p>AI, <strong>denetimsiz öğrenme</strong> ile normal sinyal örüntüsünü öğrenir ve Z-Score tabanlı istatistiksel sapmaları anomali olarak işaretler.</p>
                                <p className="tech-note">🧪 <strong>Algoritma:</strong> Z-Score + Eşik Tabanlı Hibrit Tespit</p>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default AnomalyDetectionModule;
