import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Cog, ArrowRight, Zap, TrendingUp, BrainCircuit } from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip,
} from 'recharts';
import {
    createInitialState,
    processTick,
    updateStationSpeed,
    getBufferPercentage,
    findBottleneck,
    isStarved,
    calculateOEEBreakdown,
    getCycleTime,
    formatShiftTime,
    getBufferStatus,
    getAIRecommendation,
} from '../engines/efficiency';
import type { ProductionLineState, OEEBreakdown } from '../engines/efficiency';

interface ProductionEfficiencyModuleProps {
    onClose: () => void;
}

// ============================================
// STATION EFFICIENCY RING — sadece görsel halka, metin YOK
// ============================================
function stationColor(speed: number, isBottleneck: boolean) {
    if (isBottleneck) return '#ef4444';
    if (speed > 70) return '#22c55e';
    if (speed > 40) return '#f59e0b';
    return '#ef4444';
}

const StationRing: React.FC<{ speed: number; isBottleneck: boolean; isRunning: boolean; isStarved: boolean }> = ({
    speed, isBottleneck, isRunning, isStarved,
}) => {
    const r = 28;
    const circ = 2 * Math.PI * r;
    const dash = (speed / 100) * circ;
    const color = stationColor(speed, isBottleneck);

    return (
        <svg width="68" height="68" viewBox="0 0 68 68" style={{ opacity: isStarved ? 0.45 : 1, display: 'block' }}>
            {/* Outer glow track */}
            <circle cx="34" cy="34" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
            {/* Fill arc — NO text inside */}
            <circle cx="34" cy="34" r={r} fill="none"
                stroke={color} strokeWidth="5"
                strokeDasharray={`${dash} ${circ}`}
                strokeLinecap="round"
                transform="rotate(-90 34 34)"
                style={{
                    transition: 'stroke-dasharray 0.6s cubic-bezier(0.4,0,0.2,1), stroke 0.5s ease',
                    filter: isRunning && !isStarved ? `drop-shadow(0 0 6px ${color}aa)` : 'none',
                }}
            />
        </svg>
    );
};

// ============================================
// PARTICLE FLOW
// ============================================
const ParticleFlow: React.FC<{
    speed: number;
    bufferPercent: number;
    isRunning: boolean;
}> = ({ speed, bufferPercent, isRunning }) => {
    const particleCount = 5;
    const baseDelay = 3 - (speed / 50);
    const isCongested = bufferPercent > 70;
    if (!isRunning) return null;
    return (
        <div className="particle-flow-container">
            {Array.from({ length: particleCount }).map((_, i) => (
                <motion.div
                    key={i}
                    className={`flow-particle ${isCongested ? 'congested' : ''}`}
                    initial={{ x: -10, opacity: 0 }}
                    animate={{
                        x: isCongested ? [0, 30, 35] : [0, 80, 100],
                        opacity: [0, 1, 1, 0],
                    }}
                    transition={{
                        duration: isCongested ? baseDelay * 2 : baseDelay,
                        repeat: Infinity,
                        delay: i * (baseDelay / particleCount),
                        ease: isCongested ? 'easeOut' : 'linear',
                    }}
                />
            ))}
        </div>
    );
};

// ============================================
// OEE GAUGE + A×P×Q BREAKDOWN
// ============================================
const OEEGauge: React.FC<{ value: number; availability: number; perf: number; quality: number }> = ({
    value, availability, perf, quality,
}) => {
    const getColor = () => {
        if (value >= 78) return '#4ade80';
        if (value >= 63) return '#facc15';
        if (value >= 45) return '#fb923c';
        return '#ef4444';
    };
    const getStatusLabel = () => {
        if (value >= 78) return 'Dünya Sınıfı';
        if (value >= 63) return 'İyi';
        if (value >= 45) return 'Orta';
        return 'Düşük';
    };
    const circumference = 2 * Math.PI * 45;
    const strokeDashoffset = circumference - (value / 100) * circumference;
    const color = getColor();

    const Breakdown = ({ label, pct, col }: { label: string; pct: number; col: string }) => (
        <div style={{ marginBottom: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', marginBottom: '3px' }}>
                <span style={{ color: '#9ca3af' }}>{label}</span>
                <span style={{ fontWeight: 700, color: col }}>{pct.toFixed(0)}%</span>
            </div>
            <div style={{ height: '4px', background: 'rgba(255,255,255,0.07)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{
                    height: '100%',
                    width: `${pct}%`,
                    background: `linear-gradient(to right, ${col}88, ${col})`,
                    borderRadius: '2px',
                    boxShadow: `0 0 4px ${col}66`,
                    transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)',
                }} />
            </div>
        </div>
    );

    return (
        <div className="oee-gauge-wrapper" style={{ flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div className="oee-gauge">
                    <svg viewBox="0 0 100 100" className="oee-gauge-svg">
                        <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
                        <motion.circle
                            cx="50" cy="50" r="45" fill="none"
                            stroke={color} strokeWidth="8" strokeLinecap="round"
                            strokeDasharray={circumference}
                            initial={{ strokeDashoffset: circumference }}
                            animate={{ strokeDashoffset }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                            style={{
                                transform: 'rotate(-90deg)',
                                transformOrigin: '50% 50%',
                                filter: `drop-shadow(0 0 ${Math.floor(value / 10)}px ${color})`,
                            }}
                        />
                    </svg>
                    <div className="oee-gauge-value">
                        <span className="oee-number">{value}</span>
                        <span className="oee-percent">%</span>
                    </div>
                </div>
                <div className="oee-info">
                    <div className="oee-title">Genel Ekipman Verimliliği</div>
                    <div className="oee-status" style={{ color }}>{getStatusLabel()}</div>
                    <div style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '2px' }}>A × P × K</div>
                </div>
            </div>

            {/* A/P/K Breakdown */}
            <div style={{ width: '100%', padding: '0.5rem 0.25rem' }}>
                <Breakdown label="Kullanılabilirlik (A)" pct={availability} col="#60a5fa" />
                <Breakdown label="Performans (P)" pct={perf} col="#a78bfa" />
                <Breakdown label="Kalite (K)" pct={quality} col="#34d399" />
            </div>
        </div>
    );
};

// ============================================
// THROUGHPUT SPARKLINE
// ============================================
const ThroughputChart: React.FC<{ data: { t: number; rate: number }[] }> = ({ data }) => {
    const maxRate = Math.max(...data.map(d => d.rate), 1);
    return (
        <div style={{ marginTop: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.68rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                    Anlık Üretim Hızı
                </span>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#22c55e' }}>
                    {data.length > 0 ? data[data.length - 1].rate : 0} adet/dk
                </span>
            </div>
            <ResponsiveContainer width="100%" height={55}>
                <AreaChart data={data} margin={{ top: 2, right: 0, left: -30, bottom: 0 }}>
                    <defs>
                        <linearGradient id="throughputGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <XAxis dataKey="t" hide />
                    <YAxis domain={[0, Math.ceil(maxRate * 1.3)]} tick={{ fill: '#9ca3af', fontSize: 8 }} />
                    <Tooltip
                        contentStyle={{ background: '#1f2937', border: 'none', fontSize: '10px', padding: '4px 8px' }}
                        formatter={(v: number | undefined) => [`${v ?? 0} adet/dk`, 'Hız']}
                        labelFormatter={() => ''}
                    />
                    <Area type="monotone" dataKey="rate" stroke="#22c55e" strokeWidth={1.5}
                        fill="url(#throughputGrad)" dot={false} />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};


// ============================================
// MAIN MODULE
// ============================================
const ProductionEfficiencyModule: React.FC<ProductionEfficiencyModuleProps> = ({ onClose }) => {
    const [state, setState] = useState<ProductionLineState>(createInitialState);
    const [isRunning, setIsRunning] = useState(true);
    const [latency, setLatency] = useState(0);
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [targetSpeeds, setTargetSpeeds] = useState<Record<string, number>>({});
    const [throughputHistory, setThroughputHistory] = useState<{ t: number; rate: number }[]>([]);
    const prevProducedRef = useRef(0);
    const tickRef = useRef(0);

    // Simulation loop
    useEffect(() => {
        if (!isRunning) return;
        const interval = setInterval(() => {
            const start = performance.now();
            setState(prev => {
                const next = processTick(prev);
                // Track throughput rate every 4 ticks (~2s)
                tickRef.current += 1;
                if (tickRef.current % 4 === 0) {
                    const rate = Math.max(0, next.totalProduced - prevProducedRef.current);
                    prevProducedRef.current = next.totalProduced;
                    const t = tickRef.current / 2;
                    setThroughputHistory(h => {
                        const next2 = [...h, { t, rate: rate * 30 }]; // scale to /min
                        return next2.length > 30 ? next2.slice(next2.length - 30) : next2;
                    });
                }
                return next;
            });
            setLatency(Math.round(performance.now() - start));
        }, 500);
        return () => clearInterval(interval);
    }, [isRunning]);

    // Smooth slider animation
    useEffect(() => {
        if (Object.keys(targetSpeeds).length === 0) return;
        const interval = setInterval(() => {
            setState(prev => {
                let hasChanges = false;
                const newStations = prev.stations.map(station => {
                    const target = targetSpeeds[station.id];
                    if (target !== undefined && station.speed !== target) {
                        hasChanges = true;
                        const diff = target - station.speed;
                        const step = Math.sign(diff) * Math.min(Math.abs(diff), 5);
                        return { ...station, speed: station.speed + step };
                    }
                    return station;
                });
                if (!hasChanges) setTargetSpeeds({});
                return { ...prev, stations: newStations };
            });
        }, 50);
        return () => clearInterval(interval);
    }, [targetSpeeds]);

    const handleSpeedChange = useCallback((stationId: string, speed: number) => {
        setState(prev => updateStationSpeed(prev, stationId, speed));
    }, []);

    const handleAutoOptimize = useCallback(() => {
        setIsOptimizing(true);
        setTimeout(() => {
            const targets: Record<string, number> = {};
            const OPTIMAL = 85;
            state.stations.forEach((s, i) => {
                // Upstream +2 % per station to pre-fill buffers; last station is pace-setter
                targets[s.id] = OPTIMAL + (state.stations.length - 1 - i) * 2;
            });
            setTargetSpeeds(targets);
            setTimeout(() => {
                setState(prev => ({
                    ...prev,
                    stations: prev.stations.map(s => ({ ...s, bufferIn: 0 })),
                }));
                setIsOptimizing(false);
            }, 1000);
        }, 1500);
    }, [state.stations]);

    const bottleneck = findBottleneck(state.stations);
    const oeeBreakdown: OEEBreakdown = calculateOEEBreakdown(state.stations);
    const oeeValue = oeeBreakdown.oee;
    const aiRecommendation = getAIRecommendation(state);

    // Gerçek darboğaz: en hızlı istasyondan en az 15 puan geride olmalı
    const maxSpeed = Math.max(...state.stations.map(s => s.speed));
    const isRealBottleneck = bottleneck !== null && (maxSpeed - bottleneck.speed) >= 15;

    // OEE A/P/K breakdown — realistic values from engine
    const availability = oeeBreakdown.availability;
    const performancePct = oeeBreakdown.performance;
    const quality = oeeBreakdown.quality;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content demo-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '1400px' }}>
                {/* Header */}
                <div className="modal-header">
                    <div>
                        <h2>📊 Üretim Verimliliği Modülü</h2>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            Kuyruk Teorisi ile Darboğaz Analizi
                        </div>
                    </div>
                    <div className="modal-header-right">
                        <div className="inference-badge">
                            <span className="pulse-dot"></span>
                            Simülasyon: {latency}ms
                        </div>
                        <button onClick={onClose} className="close-btn">✕</button>
                    </div>
                </div>

                <div className="module-content" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                    {/* Status Strip */}
                    <div className="efficiency-status-strip" style={{
                        display: 'flex', alignItems: 'center', gap: '12px',
                        padding: '10px 16px',
                        background: isRealBottleneck ? 'rgba(239,68,68,0.1)' : 'rgba(74,222,128,0.1)',
                        borderLeft: `4px solid ${isRealBottleneck ? '#ef4444' : '#4ade80'}`,
                        borderRadius: '8px',
                        transition: 'all 0.5s ease',
                    }}>
                        <span style={{
                            width: '10px', height: '10px', borderRadius: '50%', flexShrink: 0,
                            background: isRealBottleneck ? '#ef4444' : '#4ade80',
                            animation: 'pulse 2s ease-in-out infinite'
                        }} />
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', flex: 1 }}>
                            <strong>Hat Durumu:</strong>{' '}
                            {isRealBottleneck
                                ? `Darboğaz tespit edildi: ${bottleneck.name} İstasyonu (${bottleneck.speed}% hız)`
                                : 'Üretim hattı dengeli çalışıyor'}
                        </span>
                        {/* Quick stats in status bar */}
                        <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.78rem' }}>
                            <span style={{ color: '#9ca3af' }}>OEE <strong style={{ color: '#facc15' }}>{oeeValue}%</strong></span>
                            <span style={{ color: '#9ca3af' }}>Üretim <strong style={{ color: '#60a5fa' }}>{state.totalProduced}</strong></span>
                            <span style={{ color: '#9ca3af' }}>Süre <strong style={{ color: '#c4b5fd' }}>{formatShiftTime(state.tickCount)}</strong></span>
                        </div>
                    </div>

                    {/* Production Line Visualization */}
                    <div className="production-line-container">
                        {state.stations.map((station, index) => {
                            const nextStation = state.stations[index + 1];
                            const bufferPercent = nextStation ? getBufferPercentage(nextStation) : 0;
                            const bufferStatus = nextStation ? getBufferStatus(nextStation) : 'low';
                            const stationIsStarved = isStarved(station, index);
                            const cycleTime = getCycleTime(station.speed);
                            const isBottleneckStation = station.id === bottleneck?.id && isRealBottleneck;

                            const isOverloaded = station.speed > 90 && !isBottleneckStation && !stationIsStarved;
                            const ringColor = stationColor(station.speed, isBottleneckStation);
                            const statusLabel = isBottleneckStation ? 'DARBOĞAZ' : stationIsStarved ? 'BEKLİYOR' : isOverloaded ? 'AŞIRI YÜK' : 'ÇALIŞIYOR';
                            const statusColor = isBottleneckStation ? '#ef4444' : stationIsStarved ? '#f59e0b' : isOverloaded ? '#f97316' : '#22c55e';

                            return (
                                <React.Fragment key={station.id}>
                                    <div className={`station-card ${isBottleneckStation ? 'bottleneck' : ''} ${stationIsStarved && !isBottleneckStation ? 'starved' : ''}`}
                                        style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

                                        {/* Renkli durum şeridi */}
                                        <div style={{
                                            height: '4px',
                                            background: statusColor,
                                            transition: 'background 0.5s ease',
                                            boxShadow: `0 0 8px ${statusColor}88`,
                                        }} />

                                        <div style={{ padding: '0.85rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', flex: 1 }}>
                                            {/* Header: İsim + Durum rozeti */}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <div>
                                                    <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>{station.name}</h4>
                                                    <span style={{
                                                        display: 'inline-block', marginTop: '3px',
                                                        fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.8px',
                                                        color: statusColor,
                                                        border: `1px solid ${statusColor}44`,
                                                        background: `${statusColor}12`,
                                                        borderRadius: '4px', padding: '1px 6px',
                                                        transition: 'all 0.5s ease',
                                                    }}>
                                                        {stationIsStarved ? '⏸ ' : isBottleneckStation ? '⚠ ' : isOverloaded ? '▲ ' : '● '}{statusLabel}
                                                    </span>
                                                </div>

                                                {/* Ring + Gear — NO overlap */}
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                                                    <div style={{ position: 'relative', width: 68, height: 68 }}>
                                                        <StationRing
                                                            speed={station.speed}
                                                            isBottleneck={isBottleneckStation}
                                                            isRunning={isRunning}
                                                            isStarved={stationIsStarved}
                                                        />
                                                        {/* Gear centering: absolutely inside the 68x68 box */}
                                                        <div style={{
                                                            position: 'absolute', inset: 0,
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        }}>
                                                            <div
                                                                className={`gear-container ${!isRunning || stationIsStarved ? 'stopped' : ''} ${isBottleneckStation ? 'bottleneck-gear' : ''}`}
                                                                style={{
                                                                    animationDuration: isRunning && !stationIsStarved
                                                                        ? `${Math.max(0.5, 3 - (station.speed / 50))}s`
                                                                        : '0s',
                                                                    display: 'flex',
                                                                }}
                                                            >
                                                                <Cog className="gear-icon" size={20} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {/* Speed % — clearly below ring, no overlap */}
                                                    <span style={{
                                                        fontSize: '1.1rem', fontWeight: 800,
                                                        color: ringColor,
                                                        lineHeight: 1,
                                                        transition: 'color 0.5s ease',
                                                        filter: `drop-shadow(0 0 4px ${ringColor}66)`,
                                                    }}>
                                                        {station.speed}%
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Stats — 2 kutu yan yana */}
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                                                <div style={{
                                                    background: 'rgba(255,255,255,0.04)', borderRadius: '6px',
                                                    padding: '0.35rem 0.5rem',
                                                }}>
                                                    <div style={{ fontSize: '0.6rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Çevrim</div>
                                                    <div style={{ fontSize: '1rem', fontWeight: 700, color: '#e2e8f0' }}>{cycleTime}s</div>
                                                </div>
                                                <div style={{
                                                    background: 'rgba(255,255,255,0.04)', borderRadius: '6px',
                                                    padding: '0.35rem 0.5rem',
                                                }}>
                                                    <div style={{ fontSize: '0.6rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>İşlenen</div>
                                                    <div style={{ fontSize: '1rem', fontWeight: 700, color: '#e2e8f0' }}>{station.processed.toLocaleString('tr-TR')}</div>
                                                </div>
                                            </div>

                                            {/* Speed slider */}
                                            <div className="speed-control" style={{ marginTop: 'auto' }}>
                                                <input
                                                    type="range" min="10" max="100" value={station.speed}
                                                    onChange={e => handleSpeedChange(station.id, parseInt(e.target.value))}
                                                    className="speed-slider"
                                                />
                                                <div className="speed-labels">
                                                    <span>Yavaş</span>
                                                    <span className="speed-current" style={{ color: ringColor, transition: 'color 0.5s ease' }}>{station.speed}%</span>
                                                    <span>Hızlı</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Buffer connector */}
                                    {index < state.stations.length - 1 && (
                                        <div className="buffer-section" style={{ flexDirection: 'column', gap: '4px' }}>
                                            <ParticleFlow speed={station.speed} bufferPercent={bufferPercent} isRunning={isRunning} />
                                            <ArrowRight className="flow-arrow" size={20} style={{ opacity: 0.5 }} />
                                            <div className={`buffer-container buffer-${bufferStatus}`} style={{ position: 'relative' }}>
                                                <motion.div
                                                    className={`buffer-bar ${bufferStatus}`}
                                                    initial={{ height: 0 }}
                                                    animate={{ height: `${bufferPercent}%` }}
                                                    transition={{ type: 'spring', stiffness: 100, damping: 15 }}
                                                />
                                                <div className="buffer-label" style={{ fontSize: '0.65rem' }}>{Math.round(bufferPercent)}%</div>
                                            </div>
                                            <ArrowRight className="flow-arrow" size={20} style={{ opacity: 0.5 }} />
                                            {/* Buffer label */}
                                            <span style={{
                                                fontSize: '0.58rem', color: bufferPercent > 70 ? '#ef4444' : '#64748b',
                                                textAlign: 'center', fontWeight: 600, letterSpacing: '0.3px',
                                                transition: 'color 0.4s ease',
                                            }}>
                                                {bufferPercent > 70 ? 'DOLU' : 'TAMPON'}
                                            </span>
                                        </div>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </div>

                    {/* Control Panel */}
                    <div className="efficiency-controls">
                        <div className="control-panel-left">
                            <div className="info-card">
                                <h4><Zap size={18} /> Üretim Metrikleri</h4>
                                <div className="metrics-with-oee">
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0 }}>
                                        <div className="metrics-grid">
                                            <div className="metric-item">
                                                <span className="metric-label">Toplam Üretim</span>
                                                <span className="metric-value">{state.totalProduced.toLocaleString('tr-TR')}</span>
                                                <span className="metric-unit">adet (tamamlanan ürün)</span>
                                            </div>
                                            <div className="metric-item">
                                                <span className="metric-label">Vardiya Süresi</span>
                                                <span className="metric-value">{formatShiftTime(state.tickCount)}</span>
                                                <span className="metric-unit">saat:dakika:saniye</span>
                                            </div>
                                            <div className="metric-item">
                                                <span className="metric-label">Darboğaz İstasyonu</span>
                                                <span className="metric-value" style={{ color: isRealBottleneck ? '#ef4444' : '#4ade80' }}>
                                                    {bottleneck ? bottleneck.name : 'Yok'}
                                                </span>
                                                <span className="metric-unit">{bottleneck ? `en yavaş: %${bottleneck.speed} hız` : 'tüm istasyonlar dengeli'}</span>
                                            </div>
                                        </div>
                                        {/* Throughput sparkline */}
                                        <ThroughputChart data={throughputHistory} />
                                    </div>
                                    <OEEGauge value={oeeValue} availability={availability} perf={performancePct} quality={quality} />
                                </div>
                            </div>
                        </div>

                        <div className="control-panel-right">
                            <div className="info-card">
                                <h4><TrendingUp size={18} /> Hızlı Eylemler</h4>
                                <div className="action-buttons">
                                    <button
                                        className={`btn-optimize ${isOptimizing ? 'loading' : ''}`}
                                        onClick={handleAutoOptimize}
                                        disabled={isOptimizing}
                                    >
                                        {isOptimizing ? (
                                            <><span className="loading-spinner"></span>Kısıtlamalar Çözülüyor...</>
                                        ) : (
                                            <>🔄 Otomatik Optimize Et</>
                                        )}
                                    </button>
                                    <button
                                        className={`btn-toggle ${isRunning ? 'running' : 'paused'}`}
                                        onClick={() => setIsRunning(!isRunning)}
                                    >
                                        {isRunning ? '⏸ Durdur' : '▶ Başlat'}
                                    </button>
                                </div>

                                {/* AI Recommendation */}
                                <div className="ai-recommendation">
                                    <div className="ai-recommendation-header">
                                        <BrainCircuit size={16} />
                                        <span>AI Öneri</span>
                                        {isRealBottleneck && (
                                            <span style={{
                                                marginLeft: 'auto', fontSize: '0.62rem', fontWeight: 700,
                                                letterSpacing: '0.8px', color: '#ef4444',
                                                border: '1px solid rgba(239,68,68,0.4)',
                                                borderRadius: '4px', padding: '1px 6px',
                                                background: 'rgba(239,68,68,0.08)',
                                            }}>YÜKSEK ÖNCELİK</span>
                                        )}
                                    </div>
                                    <p className="ai-recommendation-text">{aiRecommendation}</p>
                                    {isRealBottleneck && bottleneck && (
                                        <div style={{
                                            marginTop: '0.5rem', padding: '0.4rem 0.6rem',
                                            background: 'rgba(96,165,250,0.06)', borderRadius: '6px',
                                            border: '1px solid rgba(96,165,250,0.15)',
                                            fontSize: '0.72rem', color: '#93c5fd',
                                        }}>
                                            💡 <strong>{bottleneck.name}</strong> hızını{' '}
                                            <strong style={{ color: '#4ade80' }}>%{Math.min(100, bottleneck.speed + 20)}</strong>'ye çıkarmak OEE'yi tahminen{' '}
                                            <strong style={{ color: '#4ade80' }}>+{Math.round((100 - oeeValue) * 0.4)}puan</strong> artırır.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Explanation */}
                    <div className="info-card explanation-card">
                        <h4>🎓 Kuyruk Teorisi Nasıl Çalışır?</h4>
                        <p>
                            Eğer bir istasyon sonraki istasyondan <strong>hızlı</strong> çalışıyorsa,
                            aradaki tampon (buffer) kuyruk dolmaya başlar. %80'i aştığında{' '}
                            <strong style={{ color: '#ef4444' }}>kırmızı</strong> uyarı görürsünüz - bu bir <strong>darboğaz</strong> göstergesidir.
                        </p>
                        <p>
                            <strong>Çözüm:</strong> Ya yavaş istasyonu hızlandırın, ya da hızlı istasyonu yavaşlatın.
                            "Otomatik Optimize Et" butonu tüm hızları dengeler.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductionEfficiencyModule;
