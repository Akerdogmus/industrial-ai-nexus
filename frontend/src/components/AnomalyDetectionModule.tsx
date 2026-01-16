import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Activity, AlertTriangle, Zap, Radio, Volume2, VolumeX } from 'lucide-react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    ReferenceArea, ScatterChart, Scatter, Cell
} from 'recharts';
import type {
    NoiseType,
    SignalDataPoint,
    ClusterPoint
} from '../engines/anomalyEngine';
import {
    generateSignal,
    generateClusterPoint,
    getDetectionMessage,
    calculateConfidence,
    resetEngine,
    createInitialClusterData,
    playAlertBeep
} from '../engines/anomalyEngine';

interface AnomalyDetectionModuleProps {
    onClose: () => void;
}

interface ChartDataPoint extends SignalDataPoint {
    displayTime: string;
}

const AnomalyDetectionModule: React.FC<AnomalyDetectionModuleProps> = ({ onClose }) => {
    // State
    const [signalData, setSignalData] = useState<ChartDataPoint[]>([]);
    const [clusterData, setClusterData] = useState<ClusterPoint[]>(createInitialClusterData());
    const [activeNoise, setActiveNoise] = useState<NoiseType>('none');
    const [isAnomalyActive, setIsAnomalyActive] = useState(false);
    const [currentStatus, setCurrentStatus] = useState<'normal' | 'anomaly'>('normal');
    const [confidence, setConfidence] = useState(99);
    const [aiLog, setAiLog] = useState<string[]>(['Sistem başlatıldı. Sinyal izleme aktif.']);
    const [soundEnabled, setSoundEnabled] = useState(true);

    // Refs
    const anomalyStartRef = useRef<number | null>(null);
    const lastBeepTimeRef = useRef<number>(0);
    const anomalyDebounceRef = useRef<boolean>(false);
    const lastAnomalyTimeRef = useRef<number>(0);

    // Reset engine on mount
    useEffect(() => {
        resetEngine();
        return () => resetEngine();
    }, []);

    // Signal generation loop - 100ms refresh rate
    useEffect(() => {
        const interval = setInterval(() => {
            const signal = generateSignal(activeNoise);
            const cluster = generateClusterPoint(signal);

            const displayTime = new Date().toLocaleTimeString('tr-TR', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });

            // Update signal data (rolling window of 50 points)
            setSignalData(prev => {
                const newData = [...prev, { ...signal, displayTime }];
                if (newData.length > 50) return newData.slice(-50);
                return newData;
            });

            // Update cluster data
            setClusterData(prev => {
                const newData = [...prev, cluster];
                // Keep 50 points for better density
                if (newData.length > 50) return newData.slice(-50);
                return newData;
            });

            // Track anomaly regions with debounce to prevent flickering
            const now = Date.now();
            if (signal.isAnomaly) {
                if (anomalyStartRef.current === null) {
                    anomalyStartRef.current = signal.time;
                }
                lastAnomalyTimeRef.current = now;

                // Only update state if not already in anomaly mode
                if (!anomalyDebounceRef.current) {
                    anomalyDebounceRef.current = true;
                    setIsAnomalyActive(true);
                    setCurrentStatus('anomaly');
                }

                // Play beep (max once per second)
                if (soundEnabled && now - lastBeepTimeRef.current > 1000) {
                    playAlertBeep();
                    lastBeepTimeRef.current = now;
                }
            } else {
                anomalyStartRef.current = null;
                // Debounce: only switch to normal if no anomaly for 500ms
                if (anomalyDebounceRef.current && now - lastAnomalyTimeRef.current > 500) {
                    anomalyDebounceRef.current = false;
                    setIsAnomalyActive(false);
                    setCurrentStatus('normal');
                }
            }

            // Update confidence
            setConfidence(calculateConfidence(signal.anomalyScore));

            // Update AI log for anomalies
            if (signal.isAnomaly && signal.anomalyScore > 0.5) {
                const message = getDetectionMessage(activeNoise, true, signal.anomalyScore);
                setAiLog(prev => {
                    const newLog = [`[${displayTime}] ${message}`, ...prev];
                    if (newLog.length > 5) return newLog.slice(0, 5);
                    return newLog;
                });
            }

        }, 100);

        return () => clearInterval(interval);
    }, [activeNoise, soundEnabled]);

    // Handle sabotage button click
    const handleSabotage = useCallback((type: NoiseType) => {
        if (activeNoise === type) {
            setActiveNoise('none');
            setAiLog(prev => [`[${new Date().toLocaleTimeString('tr-TR')}] Sabotaj devre dışı. Normal moda dönüş.`, ...prev.slice(0, 4)]);
        } else {
            setActiveNoise(type);
            const typeNames: Record<string, string> = { random: 'Gürültü Enjeksiyonu', spike: 'Ani Spike', flat: 'Sensör Donması', none: '' };
            setAiLog(prev => [`[${new Date().toLocaleTimeString('tr-TR')}] ${typeNames[type] || 'Mod'} aktif edildi.`, ...prev.slice(0, 4)]);
        }
    }, [activeNoise]);

    // Find anomaly regions for ReferenceArea
    const getAnomalyRegions = useCallback(() => {
        const regions: { start: number; end: number }[] = [];
        let currentStart: number | null = null;

        signalData.forEach((point, index) => {
            if (point.isAnomaly) {
                if (currentStart === null) {
                    currentStart = index;
                }
            } else {
                if (currentStart !== null) {
                    regions.push({ start: currentStart, end: index - 1 });
                    currentStart = null;
                }
            }
        });

        // Handle case where anomaly extends to end
        if (currentStart !== null) {
            regions.push({ start: currentStart, end: signalData.length - 1 });
        }

        return regions;
    }, [signalData]);

    return (
        <div className="modal-overlay" onClick={onClose}>
            <motion.div
                className={`modal-content anomaly-module ${isAnomalyActive ? 'anomaly-active' : ''}`}
                onClick={e => e.stopPropagation()}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
            >
                {/* Red Flash Overlay - CSS only, no AnimatePresence to prevent remounting */}
                {isAnomalyActive && (
                    <div className="anomaly-flash-overlay" />
                )}

                {/* Header */}
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
                                <>
                                    <span className="status-dot normal"></span>
                                    DURUM: NORMAL
                                </>
                            ) : (
                                <>
                                    <AlertTriangle size={14} />
                                    ANOMALİ TESPİT EDİLDİ
                                </>
                            )}
                        </div>
                        <div className="confidence-badge">
                            Güven: <span className={confidence > 80 ? 'high' : confidence > 50 ? 'medium' : 'low'}>{confidence}%</span>
                        </div>
                        <button
                            className="sound-toggle"
                            onClick={() => setSoundEnabled(!soundEnabled)}
                            title={soundEnabled ? 'Sesi Kapat' : 'Sesi Aç'}
                        >
                            {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                        </button>
                        <button onClick={onClose} className="close-btn">✕</button>
                    </div>
                </div>

                <div className="anomaly-content">
                    {/* Left Side - Live Scope */}
                    <div className="anomaly-left">
                        <div className="scope-container">
                            <div className="scope-header">
                                <h3><Radio size={16} /> Canlı Sinyal Akışı</h3>
                                <span className="scope-label">Basınç Sensörü (MPa)</span>
                            </div>
                            <div className="live-scope-chart">
                                <ResponsiveContainer width="100%" height={280}>
                                    <LineChart data={signalData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            stroke="rgba(0, 255, 0, 0.1)"
                                            vertical={false}
                                        />
                                        <XAxis
                                            dataKey="displayTime"
                                            stroke="#00ff00"
                                            tick={{ fill: '#00ff00', fontSize: 10 }}
                                            axisLine={{ stroke: 'rgba(0, 255, 0, 0.3)' }}
                                            interval="preserveStartEnd"
                                        />
                                        <YAxis
                                            domain={[-25, 35]}
                                            stroke="#00ff00"
                                            tick={{ fill: '#00ff00', fontSize: 10 }}
                                            axisLine={{ stroke: 'rgba(0, 255, 0, 0.3)' }}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                background: 'rgba(0, 0, 0, 0.9)',
                                                border: '1px solid #00ff00',
                                                borderRadius: '4px',
                                                color: '#00ff00'
                                            }}
                                            formatter={(value) => [typeof value === 'number' ? value.toFixed(2) + ' MPa' : value, 'Değer']}
                                        />
                                        {/* Anomaly Regions */}
                                        {getAnomalyRegions().map((region, idx) => (
                                            <ReferenceArea
                                                key={idx}
                                                x1={signalData[region.start]?.displayTime}
                                                x2={signalData[region.end]?.displayTime}
                                                fill="rgba(255, 0, 0, 0.2)"
                                                stroke="rgba(255, 0, 0, 0.5)"
                                            />
                                        ))}
                                        <Line
                                            type="monotone"
                                            dataKey="value"
                                            stroke="#00ff00"
                                            strokeWidth={2}
                                            dot={false}
                                            isAnimationActive={false}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Sabotage Controls */}
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

                    {/* Right Side - Cluster Map & AI Log */}
                    <div className="anomaly-right">
                        {/* Cluster Map */}
                        <div className="cluster-container">
                            <h3>Kümeleme Haritası</h3>
                            <p className="cluster-hint">Normal veri merkezde toplanır, anomaliler dışarı fırlar</p>
                            <div className="cluster-map">
                                <ResponsiveContainer width="100%" height={200}>
                                    <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            stroke="rgba(59, 130, 246, 0.2)"
                                        />
                                        <XAxis
                                            type="number"
                                            dataKey="x"
                                            domain={[-6, 6]}
                                            tick={{ fill: '#64748b', fontSize: 10 }}
                                            axisLine={{ stroke: 'rgba(59, 130, 246, 0.3)' }}
                                        />
                                        <YAxis
                                            type="number"
                                            dataKey="y"
                                            domain={[-6, 6]}
                                            tick={{ fill: '#64748b', fontSize: 10 }}
                                            axisLine={{ stroke: 'rgba(59, 130, 246, 0.3)' }}
                                        />
                                        <Scatter data={clusterData} isAnimationActive={false}>
                                            {clusterData.map((entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={entry.isAnomaly ? '#ef4444' : '#3b82f6'}
                                                    opacity={entry.isAnomaly ? 0.9 : 0.6}
                                                />
                                            ))}
                                        </Scatter>
                                    </ScatterChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="cluster-legend">
                                <span className="legend-item"><span className="dot normal"></span> Normal Veri</span>
                                <span className="legend-item"><span className="dot anomaly"></span> Anomali</span>
                            </div>
                        </div>

                        {/* AI Log */}
                        <div className="ai-log-container">
                            <h3>🤖 AI Tespit Kaydı</h3>
                            <div className="ai-log">
                                {aiLog.map((log, idx) => (
                                    <motion.div
                                        key={idx}
                                        className={`log-entry ${log.includes('Bilinmeyen') || log.includes('Anomali') ? 'alert' : ''}`}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        {log}
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        {/* Info Card */}
                        <div className="info-card anomaly-info">
                            <h4>💡 Nasıl Çalışır?</h4>
                            <p>
                                Bu modül <strong>denetimsiz öğrenme</strong> (Unsupervised Learning) prensibini gösterir.
                                AI, "normal" sinyal örüntüsünü öğrenir ve bu örüntüden sapan her veriyi anomali olarak işaretler.
                            </p>
                            <p className="tech-note">
                                🧪 <strong>Algoritma:</strong> Z-Score tabanlı istatistiksel anomali tespiti
                            </p>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default AnomalyDetectionModule;
