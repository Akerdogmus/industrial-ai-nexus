import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cog, ArrowRight, Zap, TrendingUp, BrainCircuit } from 'lucide-react';
import {
    createInitialState,
    processTick,
    updateStationSpeed,
    getBufferPercentage,
    findBottleneck,
    isStarved,
    calculateOEE,
    getCycleTime,
    formatShiftTime,
    getBufferStatus,
    getAIRecommendation,
} from '../engines/efficiency';
import type { ProductionLineState } from '../engines/efficiency';

interface ProductionEfficiencyModuleProps {
    onClose: () => void;
}

// Particle Flow Component - Animated particles between stations
const ParticleFlow: React.FC<{
    speed: number;
    bufferPercent: number;
    isRunning: boolean;
}> = ({ speed, bufferPercent, isRunning }) => {
    const particleCount = 5;
    const baseDelay = 3 - (speed / 50); // Faster speed = shorter delay
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

// OEE Gauge Component with descriptive labels
const OEEGauge: React.FC<{ value: number }> = ({ value }) => {
    const getColor = () => {
        if (value >= 85) return '#4ade80'; // Green - World class
        if (value >= 70) return '#facc15'; // Yellow - Good
        if (value >= 50) return '#fb923c'; // Orange - Needs improvement
        return '#ef4444'; // Red - Poor
    };

    const getStatusLabel = () => {
        if (value >= 85) return 'Dünya Sınıfı';
        if (value >= 70) return 'İyi';
        if (value >= 50) return 'Orta';
        return 'Düşük';
    };

    const circumference = 2 * Math.PI * 45;
    const strokeDashoffset = circumference - (value / 100) * circumference;

    return (
        <div className="oee-gauge-wrapper">
            <div className="oee-gauge">
                <svg viewBox="0 0 100 100" className="oee-gauge-svg">
                    <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="rgba(255,255,255,0.1)"
                        strokeWidth="8"
                    />
                    <motion.circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke={getColor()}
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        style={{
                            transform: 'rotate(-90deg)',
                            transformOrigin: '50% 50%',
                        }}
                    />
                </svg>
                <div className="oee-gauge-value">
                    <span className="oee-number">{value}</span>
                    <span className="oee-percent">%</span>
                </div>
            </div>
            <div className="oee-info">
                <div className="oee-title">Genel Ekipman Verimliliği (OEE)</div>
                <div className="oee-status" style={{ color: getColor() }}>{getStatusLabel()}</div>
                <div className="oee-description">Kullanılabilirlik × Performans × Kalite</div>
            </div>
        </div>
    );
};


const ProductionEfficiencyModule: React.FC<ProductionEfficiencyModuleProps> = ({ onClose }) => {
    const [state, setState] = useState<ProductionLineState>(createInitialState);
    const [isRunning, setIsRunning] = useState(true);
    const [latency, setLatency] = useState(0);
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [targetSpeeds, setTargetSpeeds] = useState<Record<string, number>>({});

    // Simulation loop
    useEffect(() => {
        if (!isRunning) return;

        const interval = setInterval(() => {
            const start = performance.now();
            setState(prev => processTick(prev));
            setLatency(Math.round(performance.now() - start));
        }, 500);

        return () => clearInterval(interval);
    }, [isRunning]);

    // Smooth slider animation - interpolate towards target speeds
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

                if (!hasChanges) {
                    setTargetSpeeds({});
                }

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

        // Delay to show "calculating" state
        setTimeout(() => {
            // Set target speeds for smooth animation
            const targets: Record<string, number> = {};
            state.stations.forEach(s => {
                targets[s.id] = 80;
            });
            setTargetSpeeds(targets);

            // Clear buffers after animation
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
    const oeeValue = calculateOEE(state.stations);
    const aiRecommendation = getAIRecommendation(state);

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

                <div className="module-content" style={{
                    padding: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem'
                }}>
                    {/* Compact Status Strip */}
                    <div className="efficiency-status-strip" style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '10px 16px',
                        background: bottleneck && bottleneck.speed < 50
                            ? 'rgba(239, 68, 68, 0.1)'
                            : 'rgba(74, 222, 128, 0.1)',
                        borderLeft: `4px solid ${bottleneck && bottleneck.speed < 50 ? '#ef4444' : '#4ade80'}`,
                        borderRadius: '8px',
                    }}>
                        <span style={{
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            background: bottleneck && bottleneck.speed < 50 ? '#ef4444' : '#4ade80',
                            animation: 'pulse 2s ease-in-out infinite'
                        }}></span>
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                            <strong>Hat Durumu:</strong>{' '}
                            {bottleneck && bottleneck.speed < 50
                                ? `Darboğaz tespit edildi: ${bottleneck.name} İstasyonu (${bottleneck.speed}% hız)`
                                : 'Üretim hattı dengeli çalışıyor'
                            }
                        </span>
                    </div>

                    {/* Production Line Visualization */}
                    <div className="production-line-container">
                        {state.stations.map((station, index) => {
                            const nextStation = state.stations[index + 1];
                            const bufferPercent = nextStation ? getBufferPercentage(nextStation) : 0;
                            const bufferStatus = nextStation ? getBufferStatus(nextStation) : 'low';
                            const stationIsStarved = isStarved(station, index);
                            const cycleTime = getCycleTime(station.speed);

                            return (
                                <React.Fragment key={station.id}>
                                    {/* Station Card */}
                                    <div className={`station-card ${station.id === bottleneck?.id ? 'bottleneck' : ''} ${stationIsStarved ? 'starved' : ''}`}>
                                        {/* Starved Banner */}
                                        <AnimatePresence>
                                            {stationIsStarved && (
                                                <motion.div
                                                    className="starved-banner"
                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.8 }}
                                                >
                                                    ⚠️ MALZEME BEKLİYOR
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        <div className="station-header">
                                            <h4>{station.name}</h4>
                                            <div
                                                className={`gear-container ${!isRunning || stationIsStarved ? 'stopped' : ''} ${station.id === bottleneck?.id ? 'bottleneck-gear' : ''}`}
                                                style={{
                                                    animationDuration: isRunning && !stationIsStarved
                                                        ? `${Math.max(0.5, 3 - (station.speed / 50))}s`
                                                        : '0s'
                                                }}
                                            >
                                                <Cog className="gear-icon" size={32} />
                                            </div>
                                        </div>

                                        <div className="station-stats">
                                            <div className="stat-row">
                                                <span>Çevrim Süresi (Cycle Time)</span>
                                                <span className="stat-value">{cycleTime}s</span>
                                            </div>
                                            <div className="stat-row">
                                                <span>İşlenen</span>
                                                <span className="stat-value">{station.processed.toLocaleString('tr-TR')}</span>
                                            </div>
                                        </div>

                                        <div className="speed-control">
                                            <input
                                                type="range"
                                                min="10"
                                                max="100"
                                                value={station.speed}
                                                onChange={e => handleSpeedChange(station.id, parseInt(e.target.value))}
                                                className="speed-slider"
                                            />
                                            <div className="speed-labels">
                                                <span>Yavaş</span>
                                                <span className="speed-current">{station.speed}%</span>
                                                <span>Hızlı</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Buffer Bar and Particles between stations */}
                                    {index < state.stations.length - 1 && (
                                        <div className="buffer-section">
                                            <ParticleFlow
                                                speed={station.speed}
                                                bufferPercent={bufferPercent}
                                                isRunning={isRunning}
                                            />
                                            <ArrowRight className="flow-arrow" size={24} />
                                            <div className={`buffer-container buffer-${bufferStatus}`}>
                                                <motion.div
                                                    className={`buffer-bar ${bufferStatus}`}
                                                    initial={{ height: 0 }}
                                                    animate={{ height: `${bufferPercent}%` }}
                                                    transition={{ type: 'spring', stiffness: 100, damping: 15 }}
                                                />
                                                <div className="buffer-label">{Math.round(bufferPercent)}%</div>
                                            </div>
                                            <ArrowRight className="flow-arrow" size={24} />
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
                                            <span className="metric-value" style={{ color: bottleneck && bottleneck.speed < 50 ? '#ef4444' : '#4ade80' }}>
                                                {bottleneck ? bottleneck.name : 'Yok'}
                                            </span>
                                            <span className="metric-unit">{bottleneck ? `en yavaş: %${bottleneck.speed} hız` : 'tüm istasyonlar dengeli'}</span>
                                        </div>
                                    </div>
                                    <OEEGauge value={oeeValue} />
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
                                            <>
                                                <span className="loading-spinner"></span>
                                                Kısıtlamalar Çözülüyor...
                                            </>
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
                                    </div>
                                    <p className="ai-recommendation-text">{aiRecommendation}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Explanation */}
                    <div className="info-card explanation-card">
                        <h4>🎓 Kuyruk Teorisi Nasıl Çalışır?</h4>
                        <p>
                            Eğer bir istasyon sonraki istasyondan <strong>hızlı</strong> çalışıyorsa,
                            aradaki tampon (buffer) kuyruk dolmaya başlar. %80'i aştığında <strong style={{ color: '#ef4444' }}>kırmızı</strong> uyarı
                            görürsünüz - bu bir <strong>darboğaz</strong> göstergesidir.
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
