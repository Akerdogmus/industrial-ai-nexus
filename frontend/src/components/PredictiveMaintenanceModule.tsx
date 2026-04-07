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

// ============================================
// ANOMALY GAUGE — SVG kadran göstergesi
// strokeDashoffset + CSS rotate kullanır (large-arc-flag flip sorunu yok)
// ============================================
function gaugePoint(v: number, r: number, cx: number, cy: number) {
    // 240° sweep: v=0 → sol alt (210° math), v=1 → sağ alt (330° math)
    const θ = (210 - Math.min(v, 1) * 240) * Math.PI / 180;
    return { x: cx + r * Math.cos(θ), y: cy - r * Math.sin(θ) };
}

function AnomalyGauge({ score }: { score: number }) {
    const cx = 80, cy = 80, R = 60;
    const MAX_SCORE = 2.0;
    const v = Math.min(score / MAX_SCORE, 1);
    // Tam 240° yay uzunluğu — statik, değişmez
    const arcLen = (240 / 360) * 2 * Math.PI * R; // ≈ 251.3

    // Tek statik yay path — baştan sona (v=0 → v=1), large-arc-flag=1 sabit
    const sp = gaugePoint(0, R, cx, cy);
    const ep = gaugePoint(1, R, cx, cy);
    const arcD = `M ${sp.x.toFixed(1)} ${sp.y.toFixed(1)} A ${R} ${R} 0 1 1 ${ep.x.toFixed(1)} ${ep.y.toFixed(1)}`;

    const needleColor = score < 0.2 ? '#22c55e' : score < 0.6 ? '#f59e0b' : '#ef4444';
    // İbre: merkez etrafında CSS rotate, -120° (sol) → +120° (sağ), 240° sweep
    const needleRotation = -120 + v * 240;

    // Bölge arka planları: dashoffset formülü → segment [start, start+len]
    // Formül: dashoffset = (len + BIG) - start, index=0 için 0
    const BIG = 9999;
    const ZONES = [
        { start: 0,              len: 0.1 * arcLen, color: '#22c55e', opacity: 0.18 },
        { start: 0.1 * arcLen,  len: 0.4 * arcLen, color: '#f59e0b', opacity: 0.15 },
        { start: 0.5 * arcLen,  len: 0.5 * arcLen, color: '#ef4444', opacity: 0.15 },
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <svg width="160" height="115" viewBox="0 0 160 115">
                {/* Arka plan track */}
                <path d={arcD} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="9" strokeLinecap="round" />

                {/* Bölge arka planları — hepsi aynı statik arcD, sadece dashoffset değişir */}
                {ZONES.map((z, i) => (
                    <path key={i} d={arcD} fill="none"
                        stroke={z.color} strokeWidth="9" strokeOpacity={z.opacity}
                        strokeDasharray={`${z.len} ${BIG}`}
                        strokeDashoffset={i === 0 ? 0 : (z.len + BIG) - z.start}
                    />
                ))}

                {/* Aktif dolgu — sadece strokeDashoffset değişir, path hiç değişmez */}
                <path d={arcD} fill="none"
                    stroke={needleColor} strokeWidth="9" strokeLinecap="round"
                    strokeDasharray={`${arcLen} ${arcLen}`}
                    strokeDashoffset={(1 - v) * arcLen}
                    style={{
                        transition: 'stroke-dashoffset 0.45s cubic-bezier(0.4,0,0.2,1), stroke 0.5s ease',
                        filter: `drop-shadow(0 0 5px ${needleColor}99)`,
                    }}
                />

                {/* Bölge sınır çizgileri */}
                {[0, 0.1, 0.5, 1].map(tv => {
                    const o = gaugePoint(tv, R + 7, cx, cy);
                    const inn = gaugePoint(tv, R - 1, cx, cy);
                    return <line key={tv}
                        x1={o.x.toFixed(1)} y1={o.y.toFixed(1)}
                        x2={inn.x.toFixed(1)} y2={inn.y.toFixed(1)}
                        stroke="rgba(255,255,255,0.28)" strokeWidth="1.5" />;
                })}

                {/* İbre — CSS transform rotate, SVG x2/y2 geçişi yok */}
                <g style={{
                    transformOrigin: `${cx}px ${cy}px`,
                    transform: `rotate(${needleRotation}deg)`,
                    transition: 'transform 0.45s cubic-bezier(0.4,0,0.2,1)',
                }}>
                    <line x1={cx} y1={cy + 8} x2={cx} y2={cy - 50}
                        stroke={needleColor} strokeWidth="2.5" strokeLinecap="round"
                        style={{ transition: 'stroke 0.5s ease', filter: `drop-shadow(0 0 4px ${needleColor})` }}
                    />
                </g>
                {/* Hub */}
                <circle cx={cx} cy={cy} r="5" fill={needleColor}
                    style={{ filter: `drop-shadow(0 0 6px ${needleColor})`, transition: 'fill 0.5s ease' }}
                />

                {/* Skor metni */}
                <text x={cx} y={cy + 24} textAnchor="middle"
                    fill={needleColor} fontSize="20" fontWeight="800" fontFamily="monospace"
                    style={{ transition: 'fill 0.5s ease' }}>
                    {score.toFixed(2)}
                </text>
                <text x={cx} y={cy + 37} textAnchor="middle"
                    fill="rgba(156,163,175,0.7)" fontSize="8" letterSpacing="1.2">
                    ANOMALİ SKORU
                </text>

                <text x="10" y="112" fill="rgba(34,197,94,0.5)" fontSize="8">0</text>
                <text x="138" y="112" fill="rgba(239,68,68,0.5)" fontSize="8">2.0</text>
            </svg>

            {/* Durum rozeti */}
            <div style={{
                padding: '3px 14px', borderRadius: '20px', fontSize: '0.68rem',
                fontWeight: 700, letterSpacing: '1.5px', color: needleColor,
                border: `1px solid ${needleColor}55`, background: `${needleColor}12`,
                transition: 'all 0.5s ease', marginTop: '-4px',
            }}>
                {score < 0.2 ? 'NORMAL' : score < 0.6 ? 'UYARI' : 'KRİTİK'}
            </div>
        </div>
    );
}

// ============================================
// RUL BAR — Kalan Yaşam Çubuğu
// ============================================
function RULBar({ rul }: { rul: number }) {
    const MAX_RUL = 2000;
    const pct = Math.min(rul / MAX_RUL, 1);
    const color = pct > 0.5 ? '#22c55e' : pct > 0.2 ? '#f59e0b' : '#ef4444';
    const label = pct > 0.5 ? 'Sağlıklı' : pct > 0.2 ? 'İzle' : 'Acil Bakım';

    return (
        <div style={{ padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.7rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Kalan Faydali Ömür (RUL)</span>
                <span style={{ fontSize: '0.7rem', color, fontWeight: 600 }}>{label}</span>
            </div>
            <div style={{ position: 'relative', height: '8px', background: 'rgba(255,255,255,0.07)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{
                    height: '100%',
                    width: `${pct * 100}%`,
                    background: `linear-gradient(to right, ${color}99, ${color})`,
                    borderRadius: '4px',
                    boxShadow: `0 0 8px ${color}88`,
                    transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1), background 0.5s ease',
                }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.35rem' }}>
                <span style={{ fontSize: '1rem', fontWeight: 700, color, transition: 'color 0.5s ease' }}>{rul.toLocaleString('tr-TR')} saat</span>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>/ {MAX_RUL.toLocaleString('tr-TR')} saat</span>
            </div>
        </div>
    );
}

// ============================================
// COMPONENT HEALTH MATRIX
// ============================================
function healthColor(h: number) {
    if (h > 0.75) return '#22c55e';
    if (h > 0.45) return '#f59e0b';
    return '#ef4444';
}

function ComponentHealthMatrix({ vibration, temperature, rpm }: { vibration: number; temperature: number; rpm: number }) {
    const vNorm = Math.max(0, vibration - 0.5) / 4.5;
    const tNorm = Math.max(0, temperature - 70) / 80;
    const rNorm = rpm / 6000;

    const components = [
        {
            name: 'Rulman',
            icon: '⚙️',
            health: Math.max(0.04, 1 - vNorm * 0.85 - tNorm * 0.15),
            desc: 'Titreşime hassas',
        },
        {
            name: 'Dişli Kutusu',
            icon: '🔩',
            health: Math.max(0.04, 1 - vNorm * 0.50 - tNorm * 0.50),
            desc: 'Titreşim + Isı',
        },
        {
            name: 'Mil (Spindle)',
            icon: '🔄',
            health: Math.max(0.04, 1 - rNorm * 0.30 - vNorm * 0.25 - tNorm * 0.45),
            desc: 'RPM + Isı',
        },
        {
            name: 'Soğutma Sistemi',
            icon: '❄️',
            health: Math.max(0.04, 1 - tNorm * 0.90 - vNorm * 0.10),
            desc: 'Isıya hassas',
        },
    ];

    return (
        <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.07)', padding: '0.75rem' }}>
            <div style={{ fontSize: '0.7rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '0.6rem' }}>
                Bileşen Sağlık Matrisi
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                {components.map(c => {
                    const color = healthColor(c.health);
                    const pct = c.health * 100;
                    return (
                        <div key={c.name}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                                <span style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>{c.icon} {c.name}</span>
                                <span style={{ fontSize: '0.72rem', fontWeight: 700, color, transition: 'color 0.4s ease' }}>
                                    {pct.toFixed(0)}%
                                </span>
                            </div>
                            <div style={{ height: '5px', background: 'rgba(255,255,255,0.07)', borderRadius: '3px', overflow: 'hidden' }}>
                                <div style={{
                                    height: '100%',
                                    width: `${pct}%`,
                                    background: `linear-gradient(to right, ${color}88, ${color})`,
                                    borderRadius: '3px',
                                    boxShadow: `0 0 5px ${color}66`,
                                    transition: 'width 0.5s cubic-bezier(0.4,0,0.2,1), background 0.5s ease',
                                }} />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ============================================
// MAINTENANCE WORK ORDER (Critical)
// ============================================
function MaintenanceWorkOrder({ rootCause }: { rootCause: string }) {
    const [tick, setTick] = useState(0);
    useEffect(() => {
        const iv = setInterval(() => setTick(t => t + 1), 1000);
        return () => clearInterval(iv);
    }, []);

    const actions = rootCause === 'Vibration'
        ? ['Rulman kontrolü yap', 'Mekanik bağlantıları sık', 'Dengeleme ölçümü al']
        : ['Soğutucu sıvı seviyesi kontrol', 'Fan ve radyatör temizle', 'Termal pasta değiştir'];

    return (
        <div style={{
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.35)',
            borderRadius: '10px',
            padding: '0.75rem',
            animation: 'bottleneck-halo 1.5s ease-in-out infinite',
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#ef4444', letterSpacing: '0.5px' }}>
                    🚨 BAKIM İŞ EMRİ
                </span>
                <span style={{
                    fontSize: '0.65rem',
                    color: tick % 2 === 0 ? '#ef4444' : 'transparent',
                    fontWeight: 700,
                    letterSpacing: '1px',
                    transition: 'color 0.3s',
                }}>● CANLI</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#fca5a5', marginBottom: '0.5rem', fontStyle: 'italic' }}>
                Kök Neden: {rootCause === 'Vibration' ? 'Titreşim Sapması > 3σ' : 'Sıcaklık Anomalisi'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                {actions.map((a, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#f1f5f9' }}>
                        <span style={{ color: '#ef4444', fontWeight: 700, minWidth: '14px' }}>{i + 1}.</span>
                        {a}
                    </div>
                ))}
            </div>
        </div>
    );
}


// ============================================
// MAIN MODULE
// ============================================
const PredictiveMaintenanceModule: React.FC<PredictiveMaintenanceModuleProps> = ({ onClose }) => {
    const [vibrationInput, setVibrationInput] = useState(0.5);
    const [temperatureInput, setTemperatureInput] = useState(62);
    const [rpmInput, setRpmInput] = useState(3000);

    const [dataHistory, setDataHistory] = useState<any[]>([]);
    const [currentSim, setCurrentSim] = useState<SimulationData | null>(null);
    const [latency, setLatency] = useState(12);

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

    const getStatus = (): 'normal' | 'warning' | 'critical' => {
        if (!currentSim) return 'normal';
        if (currentSim.anomaly_score < 0.2) return 'normal';
        if (currentSim.anomaly_score < 1.0) return 'warning';
        return 'critical';
    };

    const status = getStatus();

    const getStatusInfo = () => {
        switch (status) {
            case 'critical': return { text: 'KRİTİK ANOMALİ — Kök neden analizi tamamlandı, bakım emri oluşturuldu.', color: '#ef4444' };
            case 'warning': return { text: 'Sapma Tespit Edildi — Sinyal sağlıklı bölgeden uzaklaşıyor, izleniyor.', color: '#f59e0b' };
            default: return { text: 'Normal Operasyon — Yeniden yapılandırma hatası minimum (%99 eşleşme).', color: '#4ade80' };
        }
    };

    const getStatusLabel = () => {
        switch (status) {
            case 'critical': return 'KRİTİK';
            case 'warning': return 'UYARI';
            default: return 'NORMAL';
        }
    };

    const statusInfo = getStatusInfo();

    const handleReset = () => {
        setVibrationInput(0.5);
        setTemperatureInput(62);
        setRpmInput(3000);
    };

    const vibGradColor = currentSim && currentSim.anomaly_score > 0.6 ? '#ef4444'
        : currentSim && currentSim.anomaly_score > 0.3 ? '#f59e0b'
        : '#3b82f6';

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

                    {/* LEFT COLUMN */}
                    <div className="module-left" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'hidden', height: '100%' }}>

                        {/* Status Banner */}
                        <div className="status-banner" style={{
                            borderColor: statusInfo.color,
                            padding: '0.5rem 0.75rem',
                            fontSize: '0.9rem',
                            background: `${statusInfo.color}0d`,
                            transition: 'border-color 0.5s ease, background 0.5s ease',
                        }}>
                            <span className="status-indicator" style={{ background: statusInfo.color, width: '8px', height: '8px', boxShadow: `0 0 8px ${statusInfo.color}` }}></span>
                            <strong>Sistem Durumu:</strong> {statusInfo.text}
                        </div>

                        {/* Charts */}
                        <div className="chart-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', flexShrink: 0 }}>
                            <div className="chart-wrapper" style={{ gridColumn: '1 / -1', marginBottom: 0 }}>
                                <div className="chart-header-small" style={{ marginBottom: '0.25rem' }}>
                                    <h4 style={{ fontSize: '0.8rem' }}>Titreşim Analizi (Vibration)</h4>
                                </div>
                                <ResponsiveContainer width="100%" height={140}>
                                    <ComposedChart data={dataHistory}>
                                        <defs>
                                            <linearGradient id="vibDeviationGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor={vibGradColor} stopOpacity={0.4} />
                                                <stop offset="100%" stopColor={vibGradColor} stopOpacity={0.02} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                        <XAxis dataKey="time" hide />
                                        <YAxis domain={[0, 5]} tick={{ fill: '#9ca3af', fontSize: 9 }} width={25} />
                                        <Tooltip contentStyle={{ backgroundColor: '#1f2937', fontSize: '11px', padding: '5px' }} />
                                        <Legend wrapperStyle={{ fontSize: '10px' }} iconSize={8} />
                                        <Area type="monotone" dataKey="range" fill="url(#vibDeviationGrad)" stroke="none" name="Sapma" />
                                        <Line type="monotone" dataKey="expected" stroke="#3b82f6" strokeDasharray="3 3" dot={false} strokeWidth={2} name="Beklenen" />
                                        <Line type="monotone" dataKey="actual" stroke="#ffffff" dot={false} strokeWidth={2} name="Gerçek" />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </div>

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

                        {/* 3D Machine */}
                        <div className="model-section" style={{ flex: 1, minHeight: 0, position: 'relative', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 10 }}>
                                <h3 style={{ fontSize: '0.9rem', margin: 0, textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>🏭 Makine Görselleştirmesi</h3>
                            </div>
                            <div style={{
                                position: 'absolute', bottom: 10, left: 10, right: 10,
                                background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(4px)',
                                padding: '0.5rem 0.75rem', borderRadius: '8px',
                                border: '1px solid rgba(255,255,255,0.1)',
                                zIndex: 10, display: 'flex', justifyContent: 'space-between',
                                fontSize: '0.75rem', color: '#cbd5e1'
                            }}>
                                <div><span style={{ color: '#64748b' }}>Makine:</span> <strong style={{ color: '#fff' }}>CNC-01 (Mazak QT-250)</strong></div>
                                <div><span style={{ color: '#64748b' }}>Sensörler:</span> <strong style={{ color: '#fff' }}>Titreşim, Sıcaklık, RPM</strong></div>
                                <div><span style={{ color: '#64748b' }}>Durum:</span> <strong style={{ color: statusInfo.color, transition: 'color 0.5s ease' }}>{getStatusLabel()}</strong></div>
                            </div>
                            <MachineModel3D status={status} height="100%" />
                        </div>
                    </div>

                    {/* RIGHT COLUMN */}
                    <div className="module-right" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto' }}>

                        {/* Anomaly Gauge + AI Confidence */}
                        <div className="info-card highlight-card" style={{ padding: '0.75rem' }}>
                            <div style={{ fontSize: '0.7rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '0.5rem' }}>
                                📊 AI Analiz Sonuçları
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                                <AnomalyGauge score={currentSim?.anomaly_score ?? 0} />
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', flex: 1 }}>
                                    <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '8px', padding: '0.5rem 0.75rem' }}>
                                        <div style={{ fontSize: '0.65rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '3px' }}>AI Güven</div>
                                        <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff' }}>{currentSim?.ai_confidence.toFixed(0) ?? 100}%</div>
                                    </div>
                                    <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '8px', padding: '0.5rem 0.75rem' }}>
                                        <div style={{ fontSize: '0.65rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '3px' }}>Mimari</div>
                                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#93c5fd' }}>LSTM-Autoencoder</div>
                                        <div style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '2px' }}>NASA C-MAPSS</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* RUL Bar */}
                        <RULBar rul={currentSim?.rul ?? 2000} />

                        {/* Component Health Matrix */}
                        <ComponentHealthMatrix
                            vibration={vibrationInput}
                            temperature={temperatureInput}
                            rpm={rpmInput}
                        />

                        {/* Maintenance Work Order (critical only) */}
                        {status === 'critical' && currentSim && (
                            <MaintenanceWorkOrder rootCause={currentSim.root_cause} />
                        )}

                        {/* Controls */}
                        <div className="control-panel info-card" style={{ padding: '1rem' }}>
                            <div className="card-header" style={{ marginBottom: '0.5rem' }}>
                                <h3 style={{ fontSize: '1rem' }}>🎛 Simülasyon Kontrolleri</h3>
                            </div>
                            <p className="control-desc" style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.75rem' }}>Kaydırıcıları hareket ettirin ve AI'ın tepkisini gözlemleyin</p>

                            <div className="controls-grid" style={{ display: 'grid', gap: '0.75rem' }}>
                                <div className="control-group">
                                    <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem', fontSize: '0.85rem' }}>
                                        <span>Titreşim</span>
                                        <span className="val" style={{ fontWeight: 'bold' }}>{vibrationInput.toFixed(2)} mm/s</span>
                                    </label>
                                    <input type="range" min="0" max="5" step="0.1" value={vibrationInput}
                                        onChange={(e) => setVibrationInput(parseFloat(e.target.value))}
                                        style={{ width: '100%', height: '4px' }} />
                                </div>

                                <div className="control-group">
                                    <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem', fontSize: '0.85rem' }}>
                                        <span>Sıcaklık</span>
                                        <span className="val" style={{ fontWeight: 'bold' }}>{temperatureInput.toFixed(0)} °C</span>
                                    </label>
                                    <input type="range" min="20" max="150" step="1" value={temperatureInput}
                                        onChange={(e) => setTemperatureInput(parseFloat(e.target.value))}
                                        style={{ width: '100%', height: '4px' }} />
                                </div>

                                <div className="control-group">
                                    <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem', fontSize: '0.85rem' }}>
                                        <span>RPM</span>
                                        <span className="val" style={{ fontWeight: 'bold' }}>{rpmInput}</span>
                                    </label>
                                    <input type="range" min="0" max="6000" step="100" value={rpmInput}
                                        onChange={(e) => setRpmInput(parseInt(e.target.value))}
                                        style={{ width: '100%', height: '4px' }} />
                                </div>
                            </div>

                            <button className="reset-btn" onClick={handleReset} style={{
                                marginTop: '1rem', width: '100%', padding: '0.5rem',
                                borderRadius: '0.375rem', background: '#3b82f6', color: 'white',
                                border: 'none', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 500
                            }}>
                                🔄 Sıfırla
                            </button>
                        </div>

                        {/* XAI Panel (warning+) */}
                        {status !== 'normal' && currentSim && (
                            <div className="info-card xai-panel">
                                <h4>💡 Kök Neden Teşhisi</h4>
                                <p className="xai-text" style={{ fontSize: '0.85rem', marginBottom: '0.75rem', color: '#fca5a5' }}>
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
