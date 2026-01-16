import React, { useState, useEffect } from 'react';
import MachineModel3D from './MachineModel3D';
import {
    ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { simulatePredictiveMaintenance } from '../api/client';


interface PredictiveMaintenanceModuleProps {
    onClose: () => void;
}

interface SimulationData {
    expected_vibration: number;
    actual_vibration: number;
    expected_temperature: number;
    actual_temperature: number;
    actual_rpm: number;
    anomaly_score: number;
    rul: number;
    root_cause: string;
    ai_confidence: number;
}

const PredictiveMaintenanceModule: React.FC<PredictiveMaintenanceModuleProps> = ({ onClose }) => {
    // Initial values set to produce NORMAL state (anomaly < 0.2)
    const [vibrationInput, setVibrationInput] = useState(0.5);
    const [temperatureInput, setTemperatureInput] = useState(62); // Default 62 for normal start
    const [rpmInput, setRpmInput] = useState(3000);

    const [dataHistory, setDataHistory] = useState<any[]>([]);
    const [currentSim, setCurrentSim] = useState<SimulationData | null>(null);
    const [latency, setLatency] = useState(12);

    // Simulation Loop - runs locally, no async needed
    useEffect(() => {
        const interval = setInterval(() => {
            const start = performance.now();
            const result = simulatePredictiveMaintenance(vibrationInput, temperatureInput, rpmInput);
            const end = performance.now();
            setLatency(Math.round(end - start));
            setCurrentSim(result);

            setDataHistory(prev => {
                const newData = [...prev, {
                    time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                    actual: result.actual_vibration,
                    expected: result.expected_vibration,
                    temp_actual: result.actual_temperature,
                    temp_expected: result.expected_temperature,
                    rpm: result.actual_rpm,
                    range: [result.expected_vibration, result.actual_vibration],
                    anomaly: result.anomaly_score
                }];
                if (newData.length > 30) return newData.slice(newData.length - 30);
                return newData;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [vibrationInput, temperatureInput, rpmInput]);


    // Determine status step
    const getStatus = (): 'normal' | 'warning' | 'critical' => {
        if (!currentSim) return 'normal';
        if (currentSim.anomaly_score < 0.2) return 'normal';
        if (currentSim.anomaly_score < 1.0) return 'warning';
        return 'critical';
    };

    const status = getStatus();

    const getStatusText = () => {
        switch (status) {
            case 'critical': return { text: 'KRİTİK ANOMALİ. Kök neden analizi başlatıldı.', color: '#ef4444' };
            case 'warning': return { text: 'Sapma Tespit Edildi. Sinyal sağlıklı durumdan uzaklaşıyor.', color: '#fbbf24' };
            default: return { text: 'Normal Operasyon. Yeniden yapılandırma hatası minimum (%99 eşleşme).', color: '#4ade80' };
        }
    };

    const getStatusLabel = () => {
        switch (status) {
            case 'critical': return 'KRİTİK';
            case 'warning': return 'UYARI';
            default: return 'NORMAL';
        }
    };

    const statusInfo = getStatusText();

    const handleReset = () => {
        setVibrationInput(0.5);
        setTemperatureInput(62);
        setRpmInput(3000);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content demo-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '1400px', height: '95vh', display: 'flex', flexDirection: 'column' }}>
                {/* Header */}
                <div className="modal-header" style={{ flexShrink: 0 }}>
                    <div>
                        <h2>🔮 Kestirimci Bakım Modülü</h2>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Anomali Tespiti ile Öngörülü Bakım</div>
                    </div>
                    <div className="modal-header-right">
                        <div className="inference-badge">
                            <span className="pulse-dot"></span>
                            Çıkarım Süresi: {latency}ms
                        </div>
                        <button onClick={onClose} className="close-btn">✕</button>
                    </div>
                </div>

                <div className="module-content" style={{ padding: '0.75rem', flex: 1, overflow: 'hidden', display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '1rem' }}>

                    {/* LEFT COLUMN - Charts & Visuals */}
                    <div className="module-left" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'hidden', height: '100%' }}>

                        {/* Status Banner - Compact */}
                        <div className="status-banner" style={{ borderColor: statusInfo.color, padding: '0.5rem 0.75rem', fontSize: '0.9rem' }}>
                            <span className="status-indicator" style={{ background: statusInfo.color, width: '8px', height: '8px' }}></span>
                            <strong>Sistem Durumu:</strong> {statusInfo.text}
                        </div>

                        {/* Chart Grid - Compact */}
                        <div className="chart-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', flexShrink: 0 }}>

                            {/* Vibration Chart - Full Width, Reduced Height */}
                            <div className="chart-wrapper" style={{ gridColumn: '1 / -1', marginBottom: 0 }}>
                                <div className="chart-header-small" style={{ marginBottom: '0.25rem' }}>
                                    <h4 style={{ fontSize: '0.8rem' }}>Titreşim Analizi (Vibration)</h4>
                                </div>
                                <ResponsiveContainer width="100%" height={140}>
                                    <ComposedChart data={dataHistory}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                        <XAxis dataKey="time" hide />
                                        <YAxis domain={[0, 5]} tick={{ fill: '#9ca3af', fontSize: 9 }} width={25} />
                                        <Tooltip contentStyle={{ backgroundColor: '#1f2937', fontSize: '11px', padding: '5px' }} />
                                        <Legend wrapperStyle={{ fontSize: '10px' }} iconSize={8} />
                                        <Area type="monotone" dataKey="range" fill="#ef4444" stroke="none" fillOpacity={0.2} name="Sapma" />
                                        <Line type="monotone" dataKey="expected" stroke="#3b82f6" strokeDasharray="3 3" dot={false} strokeWidth={2} name="Beklenen" />
                                        <Line type="monotone" dataKey="actual" stroke="#ffffff" dot={false} strokeWidth={2} name="Gerçek" />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Temperature Chart - Half Width, Compact */}
                            <div className="chart-wrapper" style={{ marginBottom: 0 }}>
                                <div className="chart-header-small" style={{ marginBottom: '0.25rem' }}>
                                    <h4 style={{ fontSize: '0.8rem' }}>Sıcaklık (Temperature)</h4>
                                </div>
                                <ResponsiveContainer width="100%" height={100}>
                                    <ComposedChart data={dataHistory}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                        <XAxis dataKey="time" hide />
                                        <YAxis domain={['auto', 'auto']} tick={{ fill: '#9ca3af', fontSize: 9 }} width={25} />
                                        <Tooltip contentStyle={{ backgroundColor: '#1f2937', fontSize: '11px', padding: '5px' }} />
                                        <Line type="monotone" dataKey="temp_expected" stroke="#fbbf24" strokeDasharray="3 3" dot={false} strokeWidth={2} name="Beklenen" />
                                        <Line type="monotone" dataKey="temp_actual" stroke="#f87171" dot={false} strokeWidth={2} name="Gerçek" />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </div>

                            {/* RPM Chart - Half Width, Compact */}
                            <div className="chart-wrapper" style={{ marginBottom: 0 }}>
                                <div className="chart-header-small" style={{ marginBottom: '0.25rem' }}>
                                    <h4 style={{ fontSize: '0.8rem' }}>RPM (Devir)</h4>
                                </div>
                                <ResponsiveContainer width="100%" height={100}>
                                    <ComposedChart data={dataHistory}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                        <XAxis dataKey="time" hide />
                                        <YAxis domain={[0, 6000]} tick={{ fill: '#9ca3af', fontSize: 9 }} width={25} />
                                        <Tooltip contentStyle={{ backgroundColor: '#1f2937', fontSize: '11px', padding: '5px' }} />
                                        <Line type="monotone" dataKey="rpm" stroke="#34d399" dot={false} strokeWidth={2} name="RPM" />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* 3D Model - Adjusted to fill remaining space with overlay specs */}
                        <div className="model-section" style={{ flex: 1, minHeight: 0, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 10 }}>
                                <h3 style={{ fontSize: '0.9rem', margin: 0, textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>🏭 Makine Görselleştirmesi</h3>
                            </div>

                            {/* Integrated Machine Specs Overlay */}
                            <div className="machine-specs-overlay" style={{
                                position: 'absolute',
                                bottom: 10,
                                left: 10,
                                right: 10,
                                background: 'rgba(15, 23, 42, 0.85)',
                                backdropFilter: 'blur(4px)',
                                padding: '0.5rem 0.75rem',
                                borderRadius: '8px',
                                border: '1px solid rgba(255,255,255,0.1)',
                                zIndex: 10,
                                display: 'flex',
                                justifyContent: 'space-between',
                                fontSize: '0.75rem',
                                color: '#cbd5e1'
                            }}>
                                <div><span style={{ color: '#64748b' }}>Makine:</span> <strong style={{ color: '#fff' }}>CNC-01 (Mazak QT-250)</strong></div>
                                <div><span style={{ color: '#64748b' }}>Sensörler:</span> <strong style={{ color: '#fff' }}>Titreşim, Sıcaklık, RPM</strong></div>
                                <div><span style={{ color: '#64748b' }}>Durum:</span> <strong style={{ color: statusInfo.color }}>{getStatusLabel()}</strong></div>
                            </div>

                            <MachineModel3D status={status} />
                        </div>

                    </div>

                    {/* RIGHT COLUMN - Stats & Controls - Compacted */}
                    <div className="module-right" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto' }}>

                        {/* 1. AI Analysis Results */}
                        <div className="info-card highlight-card" style={{ padding: '1rem' }}>
                            <div className="card-header" style={{ marginBottom: '0.75rem' }}>
                                <h3 style={{ fontSize: '1rem' }}>📊 AI Analiz Sonuçları</h3>
                            </div>
                            <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="stat-item">
                                    <label style={{ fontSize: '0.7rem', color: '#9ca3af', display: 'block', marginBottom: '0.2rem' }}>ANOMALİ SKORU</label>
                                    <div className="stat-value" style={{
                                        fontSize: '1.4rem', fontWeight: 'bold',
                                        color: currentSim?.anomaly_score && currentSim.anomaly_score > 0.5 ? '#ef4444' : '#4ade80'
                                    }}>
                                        {currentSim?.anomaly_score.toFixed(2) || '0.00'}
                                    </div>
                                </div>
                                <div className="stat-item">
                                    <label style={{ fontSize: '0.7rem', color: '#9ca3af', display: 'block', marginBottom: '0.2rem' }}>AI GÜVEN ORANI</label>
                                    <div className="stat-value" style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>{currentSim?.ai_confidence.toFixed(0) || '100'}%</div>
                                </div>
                            </div>

                            <div className="rul-section" style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                                <label style={{ fontSize: '0.7rem', color: '#9ca3af', display: 'block', marginBottom: '0.2rem' }}>KALAN FAYDALI ÖMÜR (RUL)</label>
                                <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                                    {currentSim?.rul || 2000} Saat
                                </div>
                            </div>
                        </div>

                        {/* 2. Controls */}
                        <div className="control-panel info-card" style={{ padding: '1rem' }}>
                            <div className="card-header" style={{ marginBottom: '0.5rem' }}>
                                <h3 style={{ fontSize: '1rem' }}>🎛 Simülasyon Kontrolleri</h3>
                            </div>
                            <p className="control-desc" style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.75rem' }}>Anomali oluşturmak için kaydırıcıları ayarlayın</p>

                            <div className="controls-grid" style={{ display: 'grid', gap: '0.75rem' }}>
                                <div className="control-group">
                                    <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem', fontSize: '0.85rem' }}>
                                        <span>Titreşim</span>
                                        <span className="val" style={{ fontWeight: 'bold' }}>{vibrationInput.toFixed(2)} mm/s</span>
                                    </label>
                                    <input
                                        type="range"
                                        min="0" max="5" step="0.1"
                                        value={vibrationInput}
                                        onChange={(e) => setVibrationInput(parseFloat(e.target.value))}
                                        style={{ width: '100%', height: '4px' }}
                                    />
                                </div>

                                <div className="control-group">
                                    <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem', fontSize: '0.85rem' }}>
                                        <span>Sıcaklık</span>
                                        <span className="val" style={{ fontWeight: 'bold' }}>{temperatureInput.toFixed(0)} °C</span>
                                    </label>
                                    <input
                                        type="range"
                                        min="20" max="150" step="1"
                                        value={temperatureInput}
                                        onChange={(e) => setTemperatureInput(parseFloat(e.target.value))}
                                        style={{ width: '100%', height: '4px' }}
                                    />
                                </div>

                                <div className="control-group full-width">
                                    <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem', fontSize: '0.85rem' }}>
                                        <span>RPM</span>
                                        <span className="val" style={{ fontWeight: 'bold' }}>{rpmInput}</span>
                                    </label>
                                    <input
                                        type="range"
                                        min="0" max="6000" step="100"
                                        value={rpmInput}
                                        onChange={(e) => setRpmInput(parseInt(e.target.value))}
                                        style={{ width: '100%', height: '4px' }}
                                    />
                                </div>
                            </div>

                            <button className="reset-btn" onClick={handleReset} style={{
                                marginTop: '1rem',
                                width: '100%',
                                padding: '0.5rem',
                                borderRadius: '0.375rem',
                                background: '#3b82f6',
                                color: 'white',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '0.9rem',
                                fontWeight: 500
                            }}>
                                🔄 Sıfırla
                            </button>
                        </div>

                        {/* 3. AI Model Info - Compact Footer */}
                        <div className="info-card" style={{ padding: '1rem', marginTop: 'auto' }}>
                            <div className="card-header" style={{ marginBottom: '0.5rem' }}>
                                <h3 style={{ fontSize: '1rem' }}>🧠 AI Model Bilgisi</h3>
                            </div>
                            <div className="info-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.8rem' }}>
                                <span style={{ color: '#9ca3af' }}>Mimari:</span>
                                <strong>LSTM-Autoencoder</strong>
                            </div>
                            <div className="info-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.8rem' }}>
                                <span style={{ color: '#9ca3af' }}>Veri:</span>
                                <strong>NASA C-MAPSS</strong>
                            </div>

                            <div className="info-note" style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', lineHeight: '1.4' }}>
                                💡 <strong>Çalışma Prensibi:</strong> Autoencoder, normal sistem davranışını öğrenir. Sapma arttığında anomali skoru yükselir.
                            </div>
                        </div>

                        {/* XAI Panel (only in critical) */}
                        {status === 'critical' && currentSim && (
                            <div className="info-card xai-panel">
                                <h4>💡 Kök Neden Teşhisi</h4>
                                <p className="xai-text" style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>
                                    {currentSim.root_cause === 'Vibration'
                                        ? 'Titreşim sensörü sapması > 3σ. Mekanik gevşeklik tespit edildi.'
                                        : 'Sıcaklık anomalisi tespit edildi. Olası aşırı ısınma.'}
                                </p>
                                <div className="feature-bars">
                                    <div className="feature-bar">
                                        <div className="feature-header">
                                            <span>Titreşim</span>
                                            <span>{currentSim.root_cause === 'Vibration' ? '85%' : '15%'}</span>
                                        </div>
                                        <div className="feature-track">
                                            <div className="feature-fill red" style={{ width: currentSim.root_cause === 'Vibration' ? '85%' : '15%' }}></div>
                                        </div>
                                    </div>
                                    <div className="feature-bar">
                                        <div className="feature-header">
                                            <span>Sıcaklık</span>
                                            <span>{currentSim.root_cause === 'Temperature' ? '85%' : '15%'}</span>
                                        </div>
                                        <div className="feature-track">
                                            <div className="feature-fill yellow" style={{ width: currentSim.root_cause === 'Temperature' ? '85%' : '15%' }}></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
};

export default PredictiveMaintenanceModule;
