import React, { useState, useEffect } from 'react';
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
    anomaly_score: number;
    rul: number;
    root_cause: string;
    ai_confidence: number;
}

const PredictiveMaintenanceModule: React.FC<PredictiveMaintenanceModuleProps> = ({ onClose }) => {
    // Initial values set to produce NORMAL state (anomaly < 0.2)
    const [vibrationInput, setVibrationInput] = useState(0.5);
    const [temperatureInput, setTemperatureInput] = useState(70);
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

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content demo-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '1400px' }}>
                {/* Header */}
                <div className="modal-header">
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

                <div className="module-content" style={{ padding: '1.5rem' }}>
                    {/* LEFT COLUMN */}
                    <div className="module-left">

                        {/* Status Banner */}
                        <div className="status-banner" style={{ borderColor: statusInfo.color }}>
                            <span className="status-indicator" style={{ background: statusInfo.color }}></span>
                            <strong>Sistem Durumu:</strong> {statusInfo.text}
                        </div>

                        {/* Chart Section */}
                        <div className="chart-section">
                            <div className="chart-header">
                                <h3>📈 Yeniden Yapılandırma Hatası Analizi</h3>
                                <p className="chart-subtitle">Gerçek Sensör vs AI Beklenen Değer (Sağlıklı Taban Çizgisi)</p>
                            </div>
                            <div className="chart-container">
                                <ResponsiveContainer width="100%" height={300}>
                                    <ComposedChart data={dataHistory}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                        <XAxis dataKey="time" tick={{ fill: '#9ca3af', fontSize: 10 }} />
                                        <YAxis domain={[0, 5]} tick={{ fill: '#9ca3af', fontSize: 10 }} label={{ value: 'Titreşim (mm/s)', angle: -90, position: 'insideLeft', fill: '#9ca3af', fontSize: 12 }} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                                            labelStyle={{ color: '#fff' }}
                                        />
                                        <Legend
                                            wrapperStyle={{ paddingTop: '10px' }}
                                            formatter={(value) => <span style={{ color: '#9ca3af' }}>{value}</span>}
                                        />
                                        <Area type="monotone" dataKey="range" fill="#ef4444" stroke="none" fillOpacity={0.3} name="Anomali Bölgesi" />
                                        <Line type="monotone" dataKey="expected" stroke="#3b82f6" strokeDasharray="5 5" strokeWidth={2} dot={false} name="AI Beklenen (Normal)" />
                                        <Line type="monotone" dataKey="actual" stroke="#ffffff" strokeWidth={3} dot={false} name="Gerçek Sensör" />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="chart-legend-custom">
                                <div className="legend-item"><span className="legend-line solid white"></span> Gerçek Sensör Okuması</div>
                                <div className="legend-item"><span className="legend-line dashed blue"></span> AI Beklenen (Sağlıklı Durum)</div>
                                <div className="legend-item"><span className="legend-area red"></span> Anomali Skoru (Sapma)</div>
                            </div>
                        </div>

                        {/* 3D Model Replacement - Video */}
                        <div className="model-section">
                            <h3>🏭 Makine Görselleştirmesi</h3>
                            <div className="video-container" style={{
                                width: '100%',
                                height: '250px',
                                borderRadius: '12px',
                                overflow: 'hidden',
                                background: '#000',
                                border: '1px solid rgba(255, 255, 255, 0.1)'
                            }}>
                                <video
                                    src="/assets/videos/Futuristic_Motor_Assembly_Visualization.mp4"
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover'
                                    }}
                                />
                            </div>
                        </div>

                    </div>

                    {/* RIGHT COLUMN */}
                    <div className="module-right">

                        {/* Machine Specs Card */}
                        <div className="info-card machine-specs">
                            <h4>🔧 Makine Özellikleri</h4>
                            <div className="spec-row"><span>Makine:</span><strong>CNC-01 (Mazak QT-250)</strong></div>
                            <div className="spec-row"><span>Tip:</span><strong>Turbofan Motor Simülatörü</strong></div>
                            <div className="spec-row"><span>Sensörler:</span><strong>Titreşim, Sıcaklık, RPM</strong></div>
                            <div className="spec-row"><span>Örnekleme:</span><strong>1000ms aralık</strong></div>
                            <div className="spec-row"><span>Durum:</span><strong style={{ color: statusInfo.color }}>{getStatusLabel()}</strong></div>
                        </div>

                        {/* AI Model Info Card */}
                        <div className="info-card ai-model-info">
                            <h4>🧠 AI Model Bilgisi</h4>
                            <div className="spec-row"><span>Mimari:</span><strong>LSTM-Autoencoder</strong></div>
                            <div className="spec-row"><span>Eğitim Verisi:</span><strong>NASA C-MAPSS</strong></div>
                            <div className="spec-row"><span>Tespit Yöntemi:</span><strong>Yeniden Yapılandırma Hatası</strong></div>
                            <div className="spec-row"><span>Eşik Değer:</span><strong>0.2 (3σ tabanlı)</strong></div>
                            <div className="model-explanation">
                                <p>💡 <strong>Nasıl çalışır:</strong> Autoencoder makinenin "sağlıklı" örüntüsünü öğrenir. Yeni veri bu örüntüden saptığında, yeniden yapılandırma hatası artar ve anomali sinyali verir.</p>
                            </div>
                        </div>

                        {/* Simulation Controls */}
                        <div className="info-card simulation-controls">
                            <h4>🎛 Simülasyon Kontrolleri</h4>
                            <p className="control-hint">Anomali oluşturmak için kaydırıcıları ayarlayın</p>

                            <div className="control-group">
                                <div className="control-label">
                                    <span>Titreşim</span>
                                    <span className="control-value">{vibrationInput.toFixed(2)} mm/s</span>
                                </div>
                                <input
                                    type="range" min="0" max="5" step="0.1"
                                    value={vibrationInput}
                                    onChange={(e) => setVibrationInput(parseFloat(e.target.value))}
                                />
                            </div>

                            <div className="control-group">
                                <div className="control-label">
                                    <span>Sıcaklık</span>
                                    <span className="control-value">{temperatureInput} °C</span>
                                </div>
                                <input
                                    type="range" min="20" max="100" step="1"
                                    value={temperatureInput}
                                    onChange={(e) => setTemperatureInput(parseFloat(e.target.value))}
                                />
                            </div>

                            <div className="control-group">
                                <div className="control-label">
                                    <span>RPM</span>
                                    <span className="control-value">{rpmInput}</span>
                                </div>
                                <input
                                    type="range" min="1000" max="6000" step="100"
                                    value={rpmInput}
                                    onChange={(e) => setRpmInput(parseFloat(e.target.value))}
                                />
                            </div>

                            <button
                                className="reset-button"
                                onClick={() => {
                                    setVibrationInput(0.5);
                                    setTemperatureInput(62);
                                    setRpmInput(3000);
                                    setDataHistory([]);
                                }}
                            >
                                🔄 Sıfırla (Optimal Değerler)
                            </button>
                        </div>

                        {/* AI Insight Card */}
                        <div className="info-card ai-insight">
                            <h4>📊 AI Analiz Sonuçları</h4>
                            <div className="insight-metrics">
                                <div className="metric">
                                    <div className="metric-label">Anomali Skoru</div>
                                    <div className="metric-value" style={{ color: statusInfo.color }}>
                                        {currentSim?.anomaly_score.toFixed(2) || '0.00'}
                                    </div>
                                </div>
                                <div className="metric">
                                    <div className="metric-label">AI Güven Oranı</div>
                                    <div className="metric-value">
                                        {currentSim?.ai_confidence.toFixed(0) || '100'}%
                                    </div>
                                </div>
                            </div>
                            <div className="rul-display">
                                <div className="metric-label">Kalan Faydalı Ömür (RUL)</div>
                                <div className="rul-value">{currentSim?.rul || 2000} Saat</div>
                            </div>
                        </div>

                        {/* XAI Panel (only in critical) */}
                        {status === 'critical' && currentSim && (
                            <div className="info-card xai-panel">
                                <h4>💡 Kök Neden Teşhisi</h4>
                                <p className="xai-text">
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
