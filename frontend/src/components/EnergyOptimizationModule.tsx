import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Zap, Leaf, Clock, TrendingDown, BrainCircuit, Award } from 'lucide-react';
import {
    ComposedChart, Bar, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts';
import {
    TARIFF_RATES,
    calculateHeatingDuration,
    calculatePowerConsumption,
    calculateCost,
    findOptimalStartHour,
    generateChartData,
    calculateTimedCarbonFootprint,
    calculatePlanningScore,
    getCurrentSpotPrice,
    createInitialEnergyState,
    formatCurrency,
} from '../engines/energyEngine';
import type { EnergyState, ChartDataPoint } from '../engines/energyEngine';

interface EnergyOptimizationModuleProps {
    onClose: () => void;
}

type MergedDataPoint = ChartDataPoint & { previousConsumption: number };

// ── Animated number counter ───────────────────────────────────────────────────
function useCountUp(target: number, ms = 1200): number {
    const [display, setDisplay] = useState(target);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const prevRef = useRef(target);
    useEffect(() => {
        if (prevRef.current === target) { setDisplay(target); return; }
        const from = prevRef.current;
        prevRef.current = target;
        if (timerRef.current) clearInterval(timerRef.current);
        let step = 0;
        const steps = 60;
        timerRef.current = setInterval(() => {
            step++;
            const t = step / steps;
            const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
            setDisplay(Math.round(from + (target - from) * eased));
            if (step >= steps) { clearInterval(timerRef.current!); setDisplay(target); }
        }, ms / steps);
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [target, ms]);
    return display;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function getZoneLabel(hour: number): string {
    switch (TARIFF_RATES[hour].zone) {
        case 'night': return 'Gece (Ucuz)';
        case 'peak': return 'Pik (Pahalı)';
        case 'evening': return 'Akşam (Orta)';
    }
}
function zoneColor(zone: string): string {
    return zone === 'night' ? '#10b981' : zone === 'peak' ? '#ef4444' : '#f59e0b';
}

// ── Live Ticker ───────────────────────────────────────────────────────────────
const LiveTicker: React.FC<{
    spotPrice: number; carbonRate: number; liveCostRate: number; zone: string;
}> = ({ spotPrice, carbonRate, liveCostRate, zone }) => (
    <div className="energy-ticker">
        <div className="ticker-content">
            <span className="ticker-item"><Zap size={14} /> Spot Elektrik: <strong>{spotPrice.toFixed(2)} TL/kWh</strong></span>
            <span className="ticker-separator">•</span>
            <span className="ticker-item"><Leaf size={14} /> CO₂ Emisyonu: <strong>{carbonRate} kg/kWh</strong></span>
            <span className="ticker-separator">•</span>
            <span className="ticker-item"><Clock size={14} /> Tarife Bölgesi: <strong>{zone}</strong></span>
            <span className="ticker-separator">•</span>
            <span className="ticker-item" style={{ color: '#fbbf24' }}>
                ⚡ Anlık Tüketim Maliyeti: <strong style={{ color: '#fbbf24' }}>{liveCostRate} TL/saat</strong>
            </span>
            <span className="ticker-separator">•</span>
            <span className="ticker-item"><Zap size={14} /> Spot Elektrik: <strong>{spotPrice.toFixed(2)} TL/kWh</strong></span>
            <span className="ticker-separator">•</span>
            <span className="ticker-item"><Leaf size={14} /> CO₂ Emisyonu: <strong>{carbonRate} kg/kWh</strong></span>
        </div>
    </div>
);

// ── Power Flow Diagram (enhanced) ─────────────────────────────────────────────
const PowerFlowDiagram: React.FC<{
    isOptimized: boolean; powerKW: number; currentHour: number;
}> = ({ isOptimized, powerKW, currentHour }) => {
    const zone = TARIFF_RATES[currentHour].zone;
    const col = zoneColor(zone);
    const speed = isOptimized ? 1.5 : 0.7;
    const rate = TARIFF_RATES[currentHour].rate;

    return (
        <div className="power-flow-diagram">
            <svg viewBox="0 0 440 68" xmlns="http://www.w3.org/2000/svg"
                className="power-flow-svg" style={{ height: 68 }}>
                {/* Grid node */}
                <rect x="4" y="18" width="80" height="32" rx="8"
                    fill="rgba(59,130,246,0.15)" stroke="rgba(59,130,246,0.5)" strokeWidth="1.5" />
                <text x="44" y="31" textAnchor="middle" fill="#93c5fd" fontSize="9" fontWeight="700">ŞEBEKE</text>
                <text x="44" y="43" textAnchor="middle" fill="#60a5fa" fontSize="8">Grid • 380V</text>

                {/* Trafo node */}
                <rect x="180" y="18" width="80" height="32" rx="8"
                    fill="rgba(139,92,246,0.15)" stroke="rgba(139,92,246,0.5)" strokeWidth="1.5" />
                <text x="220" y="31" textAnchor="middle" fill="#c4b5fd" fontSize="9" fontWeight="700">TRAFO</text>
                <text x="220" y="43" textAnchor="middle" fill="#a78bfa" fontSize="8">34kV / 400V</text>

                {/* Factory node */}
                <rect x="356" y="18" width="80" height="32" rx="8"
                    fill={isOptimized ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)'}
                    stroke={isOptimized ? 'rgba(16,185,129,0.5)' : 'rgba(245,158,11,0.5)'}
                    strokeWidth="1.5" />
                <text x="396" y="31" textAnchor="middle"
                    fill={isOptimized ? '#6ee7b7' : '#fcd34d'} fontSize="9" fontWeight="700">FABRİKA</text>
                <text x="396" y="43" textAnchor="middle"
                    fill={isOptimized ? '#34d399' : '#fbbf24'} fontSize="8">{powerKW} kW</text>

                {/* Grid → Trafo path */}
                <path d="M84,34 Q132,34 180,34" fill="none" stroke="rgba(59,130,246,0.25)" strokeWidth="3" />
                <circle r="4" fill="rgba(59,130,246,0.9)">
                    <animateMotion path="M84,34 Q132,34 180,34" dur={`${2.5 / speed}s`} repeatCount="indefinite" />
                </circle>

                {/* Trafo → Factory path (zone-colored) */}
                <path d="M260,34 Q308,34 356,34" fill="none" stroke={`${col}33`} strokeWidth="3" />
                <circle r="4" fill={col} style={{ filter: `drop-shadow(0 0 4px ${col})` }}>
                    <animateMotion path="M260,34 Q308,34 356,34" dur={`${2 / speed}s`} repeatCount="indefinite" />
                </circle>
                <circle r="3" fill={`${col}99`}>
                    <animateMotion path="M260,34 Q308,34 356,34" dur={`${2 / speed}s`}
                        repeatCount="indefinite" begin={`${1 / speed}s`} />
                </circle>
            </svg>

            <div className="power-flow-labels">
                <span className="pf-label" style={{ color: isOptimized ? '#10b981' : '#f59e0b' }}>
                    {isOptimized ? '🟢 Optimize mod' : '🟡 Normal mod'}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{
                        background: `${col}22`, border: `1px solid ${col}55`,
                        color: col, borderRadius: '5px', padding: '2px 8px',
                        fontSize: '0.68rem', fontWeight: 700,
                    }}>
                        ⚡ {Math.round(powerKW * rate)} TL/saat
                    </span>
                    <span style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                        {(powerKW / 1000).toFixed(2)} MWh birim
                    </span>
                </div>
            </div>
        </div>
    );
};

// ── Furnace Visual (3-state: waiting → heating → holding) ─────────────────────
type FurnacePhase = 'waiting' | 'heating' | 'holding';

const FurnaceVisual: React.FC<{
    temperature: number; phase: FurnacePhase;
}> = ({ temperature, phase }) => {
    const [displayTemp, setDisplayTemp] = useState(phase === 'waiting' ? 120 : temperature);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        // waiting → cool idle  |  heating → climb to target  |  holding → jump to target
        const target = phase === 'waiting' ? 120 : temperature;
        if (timerRef.current) clearInterval(timerRef.current);

        if (phase === 'holding') {
            // Immediately show target temperature — furnace already reached it
            setDisplayTemp(temperature);
            return;
        }

        timerRef.current = setInterval(() => {
            setDisplayTemp(prev => {
                const diff = target - prev;
                if (Math.abs(diff) < 4) { clearInterval(timerRef.current!); return target; }
                return Math.round(prev + diff * 0.07);
            });
        }, 50);
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [phase, temperature]);

    const intensity = Math.max(0, (displayTemp - 120) / Math.max(1, temperature - 120));
    const g = Math.round(Math.max(0, 140 - intensity * 140));
    const isHot = phase !== 'waiting';
    const glowColor = isHot ? `rgba(255,${g},0,${0.15 + intensity * 0.55})` : 'transparent';

    const statusLabel =
        phase === 'heating' ? '● ÇALIŞIYOR' :
        phase === 'holding' ? '● HAZIR' :
        '○ BEKLEMEDE';
    const statusClass = phase === 'waiting' ? 'off' : 'on';

    return (
        <div className={`furnace-card ${isHot ? 'active' : ''}`}
            style={{ borderColor: isHot ? `rgba(255,${g},0,0.45)` : undefined }}>
            <div className="furnace-header">
                <h4><Flame size={18} /> Isıl İşlem Fırını</h4>
                <span className={`furnace-status ${statusClass}`}>{statusLabel}</span>
            </div>
            <div className="furnace-body">
                <div className="furnace-visual" style={{
                    '--heat-intensity': intensity,
                    '--glow-color': glowColor,
                } as React.CSSProperties}>
                    <div className="furnace-chamber">
                        {isHot && (
                            <>
                                <div className="heat-wave wave-1" />
                                <div className="heat-wave wave-2" />
                                <div className="heat-wave wave-3" />
                            </>
                        )}
                    </div>
                    <div className="furnace-temp-display">
                        <span className="temp-value" style={{
                            color: isHot ? `rgb(255,${g},0)` : '#888',
                            filter: isHot
                                ? `drop-shadow(0 0 ${Math.round(8 + intensity * 14)}px rgba(255,${g},0,0.9))`
                                : 'none',
                            transition: 'color 0.4s ease, filter 0.4s ease',
                        }}>
                            {displayTemp}
                        </span>
                        <span className="temp-unit">°C</span>
                    </div>
                </div>
                <div className="furnace-info">
                    <div className="info-row"><span>Hedef Sıcaklık</span><span>{temperature}°C</span></div>
                    <div className="info-row">
                        <span>Isınma Süresi</span>
                        <span>{calculateHeatingDuration(temperature)} saat</span>
                    </div>
                    <div className="info-row">
                        <span>Güç Tüketimi</span>
                        <span>{phase === 'holding' ? Math.round(calculatePowerConsumption(temperature) * 0.15) : calculatePowerConsumption(temperature)} kW
                            {phase === 'holding' && <span style={{ color: '#22c55e', fontSize: '0.65rem', marginLeft: 4 }}>tutma modu</span>}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ── Planning Score Gauge ───────────────────────────────────────────────────────
const PlanningScoreGauge: React.FC<{ score: number }> = ({ score }) => {
    const displayed = useCountUp(score, 1000);
    const col = score >= 80 ? '#22c55e' : score >= 55 ? '#facc15' : score >= 30 ? '#f59e0b' : '#ef4444';
    const label = score >= 80 ? 'Optimal' : score >= 55 ? 'İyi' : score >= 30 ? 'Orta' : 'Düşük';

    // SVG arc: 240° sweep from bottom-left (150°) clockwise to bottom-right (30°)
    const R = 34; const cx = 48; const cy = 50;
    const arcLen = 2 * Math.PI * R * (240 / 360);
    const sx = cx + R * Math.cos(150 * Math.PI / 180);
    const sy = cy + R * Math.sin(150 * Math.PI / 180);
    const ex = cx + R * Math.cos(30 * Math.PI / 180);
    const ey = cy + R * Math.sin(30 * Math.PI / 180);
    const arcD = `M ${sx.toFixed(1)} ${sy.toFixed(1)} A ${R} ${R} 0 1 1 ${ex.toFixed(1)} ${ey.toFixed(1)}`;
    const dashOffset = arcLen - (displayed / 100) * arcLen;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
            <div style={{ fontSize: '0.62rem', color: '#6b7280', marginBottom: '2px', letterSpacing: '0.5px' }}>
                PLANLAMA SKORU
            </div>
            <svg width="96" height="70" viewBox="0 0 96 70">
                <path d={arcD} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="7" strokeLinecap="round" />
                <path d={arcD} fill="none" stroke={col} strokeWidth="7" strokeLinecap="round"
                    strokeDasharray={`${arcLen} ${arcLen}`}
                    strokeDashoffset={dashOffset}
                    style={{
                        transition: 'stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1), stroke 0.6s ease',
                        filter: `drop-shadow(0 0 5px ${col}88)`,
                    }}
                />
                <text x={cx} y={cy - 4} textAnchor="middle" fill="white" fontSize="18" fontWeight="800">
                    {displayed}
                </text>
                <text x={cx} y={cy + 10} textAnchor="middle" fill="#6b7280" fontSize="7.5">PUAN</text>
            </svg>
            <div style={{ fontSize: '0.65rem', color: col, fontWeight: 700 }}>{label}</div>
        </div>
    );
};

// ── Optimization Summary Card ─────────────────────────────────────────────────
const OptimizationSummaryCard: React.FC<{
    beforeCost: number; afterCost: number;
    savings: number; savingsPct: number;
    carbonBefore: number; carbonAfter: number;
    optimalHour: number;
}> = ({ beforeCost, afterCost, savings, savingsPct, carbonBefore, carbonAfter, optimalHour }) => {
    const displayedCost = useCountUp(afterCost, 1200);
    const carbonSaved = carbonBefore - carbonAfter;

    return (
        <motion.div
            initial={{ opacity: 0, y: -14, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            style={{
                background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(5,150,105,0.05))',
                border: '1px solid rgba(16,185,129,0.35)',
                borderRadius: '12px',
                padding: '0.9rem 1.1rem',
                marginBottom: '0.75rem',
            }}
        >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.7rem' }}>
                <Award size={15} color="#10b981" />
                <span style={{ color: '#10b981', fontWeight: 700, fontSize: '0.78rem', letterSpacing: '0.5px' }}>
                    OPTİMİZASYON TAMAMLANDI
                </span>
                <span style={{
                    marginLeft: 'auto',
                    background: 'rgba(16,185,129,0.18)', color: '#34d399',
                    fontSize: '0.63rem', fontWeight: 700, padding: '2px 9px',
                    borderRadius: '20px', border: '1px solid rgba(16,185,129,0.3)',
                }}>
                    ✓ {optimalHour.toString().padStart(2, '0')}:00 başlangıç
                </span>
            </div>

            {/* Before → After */}
            <div style={{
                display: 'grid', gridTemplateColumns: '1fr 28px 1fr',
                alignItems: 'center', gap: '6px', marginBottom: '0.7rem',
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.6rem', color: '#9ca3af', marginBottom: '3px' }}>ÖNCEKİ PLAN</div>
                    <div style={{
                        fontSize: '1.05rem', color: '#ef4444', fontWeight: 700,
                        textDecoration: 'line-through', opacity: 0.65,
                    }}>
                        {formatCurrency(beforeCost)} TL
                    </div>
                </div>
                <div style={{ textAlign: 'center', fontSize: '1.2rem', color: '#34d399' }}>→</div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.6rem', color: '#9ca3af', marginBottom: '3px' }}>OPTİMAL PLAN</div>
                    <div style={{
                        fontSize: '1.25rem', color: '#10b981', fontWeight: 800,
                        filter: 'drop-shadow(0 0 8px rgba(16,185,129,0.55))',
                    }}>
                        {formatCurrency(displayedCost)} TL
                    </div>
                </div>
            </div>

            {/* Savings pills */}
            <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap' }}>
                <div style={{
                    background: 'rgba(16,185,129,0.14)', border: '1px solid rgba(16,185,129,0.3)',
                    borderRadius: '20px', padding: '3px 10px',
                    fontSize: '0.7rem', color: '#34d399', fontWeight: 700,
                    display: 'flex', alignItems: 'center', gap: '4px',
                }}>
                    <TrendingDown size={11} />
                    {formatCurrency(savings)} TL tasarruf ({savingsPct}%)
                </div>
                {carbonSaved > 0 && (
                    <div style={{
                        background: 'rgba(34,197,94,0.10)', border: '1px solid rgba(34,197,94,0.28)',
                        borderRadius: '20px', padding: '3px 10px',
                        fontSize: '0.7rem', color: '#4ade80', fontWeight: 700,
                    }}>
                        🌱 {carbonSaved} kg CO₂ daha az
                    </div>
                )}
            </div>
        </motion.div>
    );
};

// ── Custom Tooltip ─────────────────────────────────────────────────────────────
const CustomTooltip: React.FC<{
    active?: boolean;
    payload?: Array<{ value: number; dataKey: string; payload: MergedDataPoint }>;
    label?: string;
}> = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
        <div className="energy-chart-tooltip">
            <p className="tooltip-hour">{label}</p>
            <p className="tooltip-rate">Tarife: <strong>{d.tariffRate.toFixed(2)} TL/kWh</strong></p>
            {d.consumption > 0 && (
                <p style={{ color: '#10b981', margin: '2px 0' }}>
                    Yeni Plan: <strong>{d.consumption} kW</strong>
                </p>
            )}
            {d.previousConsumption > 0 && (
                <p style={{ color: '#ef444499', margin: '2px 0', fontSize: '0.75rem' }}>
                    Eski Plan: <strong>{d.previousConsumption} kW</strong>
                </p>
            )}
            <p className={`tooltip-zone zone-${d.tariffZone}`}>
                {getZoneLabel(parseInt(label?.split(':')[0] ?? '0'))}
            </p>
        </div>
    );
};

// ── Main Component ─────────────────────────────────────────────────────────────
const EnergyOptimizationModule: React.FC<EnergyOptimizationModuleProps> = ({ onClose }) => {
    const [state, setState] = useState<EnergyState>(createInitialEnergyState);
    const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [spotPrice, setSpotPrice] = useState(4.2);
    const [previousCost, setPreviousCost] = useState<number | null>(null);
    const [previousStartHour, setPreviousStartHour] = useState<number | null>(null);
    const [currentSimHour, setCurrentSimHour] = useState(8);
    const [showSummary, setShowSummary] = useState(false);

    // Derived
    const power = calculatePowerConsumption(state.targetTemperature);
    const duration = calculateHeatingDuration(state.targetTemperature);
    const totalCost = calculateCost(state.startHour, duration, power);
    const totalKWh = power * duration;
    const carbonFootprint = calculateTimedCarbonFootprint(state.startHour, duration, power);
    const planningScore = calculatePlanningScore(state.startHour, duration, power, state.deadline);

    // Previous plan for chart comparison
    const previousChartData = previousStartHour !== null
        ? generateChartData(previousStartHour, duration, power)
        : null;
    const mergedData: MergedDataPoint[] = chartData.map((d, i) => ({
        ...d,
        previousConsumption: previousChartData ? previousChartData[i].consumption : 0,
    }));

    // Carbon before (for savings calculation)
    const carbonBefore = previousStartHour !== null
        ? calculateTimedCarbonFootprint(previousStartHour, duration, power)
        : carbonFootprint;

    // Live cost rate in current sim hour
    const liveCostRate = Math.round(power * TARIFF_RATES[currentSimHour].rate);

    // Furnace phase based on simulation clock
    // waiting: before start | heating: during ramp-up | holding: after target reached (stable at temp)
    const furnacePhase: FurnacePhase =
        currentSimHour < state.startHour ? 'waiting' :
        currentSimHour < state.startHour + duration ? 'heating' :
        'holding';

    // Effects
    useEffect(() => {
        setChartData(generateChartData(state.startHour, duration, power));
    }, [state.startHour, duration, power]);

    useEffect(() => {
        const id = setInterval(() => setSpotPrice(getCurrentSpotPrice(new Date().getHours())), 5000);
        return () => clearInterval(id);
    }, []);

    useEffect(() => {
        const id = setInterval(() => setCurrentSimHour(h => (h + 1) % 24), 3000);
        return () => clearInterval(id);
    }, []);

    // Handlers
    const reset = useCallback(() => {
        setPreviousCost(null);
        setPreviousStartHour(null);
        setShowSummary(false);
    }, []);

    const handleTemperatureChange = useCallback((temp: number) => {
        setState(prev => ({ ...prev, targetTemperature: temp, heatingDuration: calculateHeatingDuration(temp), isOptimized: false }));
        reset();
    }, [reset]);

    const handleStartHourChange = useCallback((hour: number) => {
        setState(prev => ({ ...prev, startHour: hour, isOptimized: false }));
        reset();
    }, [reset]);

    const handleDeadlineChange = useCallback((deadline: number) => {
        setState(prev => ({ ...prev, deadline, isOptimized: false }));
        reset();
    }, [reset]);

    const handleOptimize = useCallback(() => {
        setIsOptimizing(true);
        setPreviousCost(totalCost);
        setPreviousStartHour(state.startHour);
        setShowSummary(false);
        setTimeout(() => {
            const optimalStart = findOptimalStartHour(duration, state.deadline);
            setState(prev => ({ ...prev, startHour: optimalStart, isOptimized: true }));
            setIsOptimizing(false);
            setTimeout(() => setShowSummary(true), 500);
        }, 1500);
    }, [duration, state.deadline, totalCost, state.startHour]);

    const savings = previousCost ? previousCost - totalCost : 0;
    const savingsPct = previousCost ? Math.round((savings / previousCost) * 100) : 0;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content demo-modal energy-module"
                onClick={e => e.stopPropagation()} style={{ maxWidth: '1400px' }}>

                {/* Header */}
                <div className="modal-header">
                    <div>
                        <h2>⚡ Enerji Optimizasyonu</h2>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            Akıllı Yük Kaydırma ile Maliyet Azaltma
                        </div>
                    </div>
                    <div className="modal-header-right">
                        <div className="inference-badge">
                            <span className="pulse-dot"></span>
                            Simülasyon Aktif
                        </div>
                        <button onClick={onClose} className="close-btn">✕</button>
                    </div>
                </div>

                {/* Live Ticker */}
                <LiveTicker
                    spotPrice={spotPrice}
                    carbonRate={0.4}
                    liveCostRate={liveCostRate}
                    zone={getZoneLabel(currentSimHour)}
                />

                {/* Power Flow */}
                <PowerFlowDiagram
                    isOptimized={state.isOptimized}
                    powerKW={power}
                    currentHour={currentSimHour}
                />

                <div className="module-content energy-content">
                    {/* Left Panel */}
                    <div className="energy-left-panel">
                        <FurnaceVisual temperature={state.targetTemperature} phase={furnacePhase} />

                        <div className="energy-controls">
                            <div className="control-group">
                                <label>Hedef Sıcaklık: <strong>{state.targetTemperature}°C</strong></label>
                                <input type="range" min="500" max="1200" step="50"
                                    value={state.targetTemperature}
                                    onChange={e => handleTemperatureChange(parseInt(e.target.value))}
                                    className="energy-slider" />
                                <div className="slider-labels"><span>500°C</span><span>1200°C</span></div>
                            </div>

                            <div className="control-group">
                                <label>Başlangıç Saati: <strong>{state.startHour.toString().padStart(2, '0')}:00</strong></label>
                                <input type="range" min="0" max="23"
                                    value={state.startHour}
                                    onChange={e => handleStartHourChange(parseInt(e.target.value))}
                                    className="energy-slider" />
                                <div className="slider-labels"><span>00:00</span><span>23:00</span></div>
                            </div>

                            <div className="control-group">
                                <label>Termin Saati: <strong>{state.deadline.toString().padStart(2, '0')}:00</strong></label>
                                <input type="range" min="6" max="23"
                                    value={state.deadline}
                                    onChange={e => handleDeadlineChange(parseInt(e.target.value))}
                                    className="energy-slider deadline-slider" />
                                <div className="slider-labels"><span>06:00</span><span>23:00</span></div>
                            </div>

                            <button
                                className={`btn-eco-optimize ${isOptimizing ? 'loading' : ''} ${state.isOptimized ? 'optimized' : ''}`}
                                onClick={handleOptimize}
                                disabled={isOptimizing}
                            >
                                {isOptimizing
                                    ? <><span className="loading-spinner" />AI Hesaplıyor...</>
                                    : state.isOptimized
                                        ? <>✓ Optimize Edildi</>
                                        : <><BrainCircuit size={18} /> Eco-Smart Planla</>
                                }
                            </button>
                        </div>
                    </div>

                    {/* Right Panel */}
                    <div className="energy-right-panel">

                        {/* Metrics + Planning Score */}
                        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem', alignItems: 'stretch' }}>
                            <div className="energy-metrics" style={{ flex: 1, marginBottom: 0 }}>
                                <div className={`metric-card cost ${state.isOptimized ? 'optimized' : 'expensive'}`}>
                                    <div className="metric-icon"><Zap size={24} /></div>
                                    <div className="metric-content">
                                        <span className="metric-label">Tahmini Fatura</span>
                                        <span className="metric-value">{formatCurrency(totalCost)} TL</span>
                                        <AnimatePresence>
                                            {state.isOptimized && savings > 0 && (
                                                <motion.span className="savings-badge"
                                                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                                                    <TrendingDown size={14} /> {savingsPct}% tasarruf
                                                </motion.span>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>

                                <div className="metric-card carbon">
                                    <div className="metric-icon"><Leaf size={24} /></div>
                                    <div className="metric-content">
                                        <span className="metric-label">Karbon Ayak İzi</span>
                                        <span className="metric-value">{carbonFootprint} kg CO₂</span>
                                        {state.isOptimized && carbonBefore > carbonFootprint && (
                                            <span style={{
                                                fontSize: '0.62rem', color: '#4ade80', fontWeight: 700,
                                                display: 'flex', alignItems: 'center', gap: '3px', marginTop: '2px',
                                            }}>
                                                🌱 -{carbonBefore - carbonFootprint} kg azaltma
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="metric-card energy">
                                    <div className="metric-icon"><Clock size={24} /></div>
                                    <div className="metric-content">
                                        <span className="metric-label">Toplam Enerji</span>
                                        <span className="metric-value">{totalKWh} kWh</span>
                                    </div>
                                </div>
                            </div>

                            {/* Planning Score Gauge */}
                            <div style={{
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                borderRadius: '12px', padding: '0.75rem 0.6rem',
                                display: 'flex', flexDirection: 'column',
                                alignItems: 'center', justifyContent: 'center',
                                minWidth: '108px',
                            }}>
                                <PlanningScoreGauge score={planningScore} />
                            </div>
                        </div>

                        {/* Optimization Summary (slide-in after optimize) */}
                        <AnimatePresence>
                            {showSummary && previousCost !== null && (
                                <OptimizationSummaryCard
                                    beforeCost={previousCost}
                                    afterCost={totalCost}
                                    savings={savings}
                                    savingsPct={savingsPct}
                                    carbonBefore={carbonBefore}
                                    carbonAfter={carbonFootprint}
                                    optimalHour={state.startHour}
                                />
                            )}
                        </AnimatePresence>

                        {/* Chart with before/after bars */}
                        <div className="energy-chart-container">
                            <h4 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                24 Saatlik Tarife ve Tüketim Planı
                                {previousStartHour !== null && (
                                    <span style={{ fontSize: '0.62rem', color: '#9ca3af', fontWeight: 400 }}>
                                        <span style={{ color: '#ef4444aa', marginRight: '3px' }}>■</span>Eski plan
                                        <span style={{ color: '#10b981', margin: '0 3px 0 10px' }}>■</span>Yeni plan
                                    </span>
                                )}
                            </h4>
                            <ResponsiveContainer width="100%" height={250}>
                                <ComposedChart data={mergedData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                    <defs>
                                        <linearGradient id="tariffGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="var(--accent-primary)" stopOpacity={0.3} />
                                            <stop offset="100%" stopColor="var(--accent-primary)" stopOpacity={0.05} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                                    <XAxis dataKey="hour" stroke="#9ca3af" fontSize={11} tickLine={false} interval={2} />
                                    <YAxis yAxisId="tariff" orientation="left" stroke="#9ca3af" fontSize={11} tickLine={false}
                                        label={{ value: 'TL/kWh', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#9ca3af' }} />
                                    <YAxis yAxisId="consumption" orientation="right" stroke="#9ca3af" fontSize={11} tickLine={false}
                                        label={{ value: 'kW', angle: 90, position: 'insideRight', fontSize: 10, fill: '#9ca3af' }} />
                                    <Tooltip content={<CustomTooltip />} />

                                    <Area yAxisId="tariff" type="stepAfter" dataKey="tariffRate"
                                        stroke="transparent" fill="url(#tariffGradient)" />

                                    <ReferenceLine
                                        x={`${state.deadline.toString().padStart(2, '0')}:00`}
                                        yAxisId="tariff" stroke="#ef4444" strokeDasharray="5 5"
                                        label={{ value: 'Termin', position: 'top', fill: '#ef4444', fontSize: 10 }}
                                    />

                                    {/* Old plan — faded red bars */}
                                    {previousStartHour !== null && (
                                        <Bar yAxisId="consumption" dataKey="previousConsumption"
                                            maxBarSize={26} radius={[3, 3, 0, 0]} opacity={0.32}>
                                            {mergedData.map((_, i) => <Cell key={`prev-${i}`} fill="#ef4444" />)}
                                        </Bar>
                                    )}

                                    {/* New / current plan */}
                                    <Bar yAxisId="consumption" dataKey="consumption"
                                        maxBarSize={26} radius={[3, 3, 0, 0]}>
                                        {mergedData.map((entry, i) => (
                                            <Cell key={`cell-${i}`}
                                                fill={entry.tariffZone === 'night' ? '#10b981'
                                                    : entry.tariffZone === 'peak' ? '#ef4444' : '#f59e0b'}
                                                fillOpacity={entry.isActive ? 0.9 : 0}
                                            />
                                        ))}
                                    </Bar>
                                </ComposedChart>
                            </ResponsiveContainer>

                            <div className="chart-legend">
                                <div className="legend-item"><span className="legend-color night" />Gece (Ucuz)</div>
                                <div className="legend-item"><span className="legend-color peak" />Pik (Pahalı)</div>
                                <div className="legend-item"><span className="legend-color evening" />Akşam (Orta)</div>
                            </div>
                        </div>

                        {/* Explanation */}
                        <div className="energy-explanation">
                            <h4>🎓 Nasıl Çalışır?</h4>
                            <p>
                                <strong>Problem:</strong> Geleneksel planlama fırını vardiya başında (08:00 — pik tarife) açar.
                            </p>
                            <p>
                                <strong>Çözüm:</strong> AI, fırının termal ataletini bilir ve ısınma fazını gece ucuz tarifesine kaydırır.
                                Hem maliyet hem karbon emisyonu düşer.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EnergyOptimizationModule;
