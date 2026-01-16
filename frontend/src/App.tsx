import { useState, useEffect, useRef } from 'react';
import {
  AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  fetchOEE,
  fetchQuality, fetchPlanning, fetchAnomaly, fetchCopilot, sendChatMessage
} from './api/client';
import type { ModuleType, PredictiveMaintenanceData, OEEMetrics, EnergyData, QualityData, ProductionPlan, AnomalyData, CopilotInsight } from './types';
import './App.css';
import PredictiveMaintenanceModule from './components/PredictiveMaintenanceModule';
import ProductionEfficiencyModule from './components/ProductionEfficiencyModule';
import EnergyOptimizationModule from './components/EnergyOptimizationModule';
import QualityVisionModule from './components/QualityVisionModule';
import ProductionPlanningModule from './components/ProductionPlanningModule';
import AnomalyDetectionModule from './components/AnomalyDetectionModule';
import AICopilotModule from './components/AICopilotModule';

// ============================================
// CANLI VERİ SİMÜLASYONU HOOK
// ============================================
function useLiveData<T>(initialValue: T, updateFn: (prev: T) => T, intervalMs: number = 2000) {
  const [data, setData] = useState<T>(initialValue);

  useEffect(() => {
    const interval = setInterval(() => {
      setData(prev => updateFn(prev));
    }, intervalMs);
    return () => clearInterval(interval);
  }, [updateFn, intervalMs]);

  return data;
}

// ============================================
// CANLI BADGE BİLEŞENİ
// ============================================
function LiveBadge() {
  return (
    <span className="live-badge">
      <span className="live-dot"></span>
      CANLI
    </span>
  );
}

// ============================================
// TIMESTAMP BİLEŞENİ
// ============================================
function LiveTimestamp() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <span className="live-timestamp">
      Son güncelleme: {time.toLocaleTimeString('tr-TR')}
    </span>
  );
}

// ============================================
// AI CHATBOT BİLEŞENİ
// ============================================
function AIChatbot({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<Array<{ role: string, content: string }>>([
    { role: 'assistant', content: 'Merhaba! ACD Endüstriyel AI Platformu asistanıyım. Size nasıl yardımcı olabilirim?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const conversationHistory = messages.slice(1).map(m => ({ role: m.role, content: m.content }));
      const response = await sendChatMessage(userMessage, conversationHistory);

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response.response || 'Yanıt alınamadı.'
      }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Bağlantı hatası. Lütfen tekrar deneyin.'
      }]);
    }
    setIsLoading(false);
  };

  const quickQuestions = [
    "Kestirimci bakım nedir?",
    "En kritik makine hangisi?",
    "Enerji tasarrufu nasıl yapılır?"
  ];

  return (
    <div className="chatbot-modal">
      <div className="chatbot-header">
        <div className="chatbot-title">
          <span className="chatbot-icon">🤖</span>
          <span>AI Asistan</span>
          <LiveBadge />
        </div>
        <button className="chatbot-close" onClick={onClose}>✕</button>
      </div>

      <div className="chatbot-messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={`chat-message ${msg.role}`}>
            <div className="message-content">{msg.content}</div>
          </div>
        ))}
        {isLoading && (
          <div className="chat-message assistant">
            <div className="message-content typing">
              <span></span><span></span><span></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {messages.length === 1 && (
        <div className="quick-questions">
          {quickQuestions.map((q, idx) => (
            <button key={idx} onClick={() => { setInput(q); }} className="quick-question">
              {q}
            </button>
          ))}
        </div>
      )}

      <div className="chatbot-input">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Sorunuzu yazın..."
          disabled={isLoading}
        />
        <button onClick={sendMessage} disabled={isLoading || !input.trim()}>
          Gönder
        </button>
      </div>
    </div>
  );
}

// ============================================
// MODÜL TANIMI - BAĞIMSIZ SENARYOLAR
// ============================================
// ============================================
// MODÜL TANIMI - BAĞIMSIZ SENARYOLAR
// ============================================
const modules = [
  {
    id: 'predictive-maintenance' as ModuleType,
    title: 'Kestirimci Bakım',
    description: 'Arıza öncesi risk tespiti ve bakım zamanı optimizasyonu',
    icon: 'speed', // Will map to icon in render
    scenario: 'Canlı sensör akışı ile arıza tahmini',
  },
  {
    id: 'oee' as ModuleType,
    title: 'Üretim Verimliliği',
    description: 'OEE optimizasyonu ve darboğaz analizi',
    icon: 'bar_chart',
    scenario: 'Gerçek zamanlı performans takibi',
  },
  {
    id: 'energy' as ModuleType,
    title: 'Enerji Optimizasyonu',
    description: 'Enerji maliyeti düşürme ve karbon yönetimi',
    icon: 'bolt',
    scenario: 'Akıllı sayaç entegrasyonu',
  },
  {
    id: 'quality' as ModuleType,
    title: 'Kalite & Fire',
    description: 'Kalite riski tahmini ve fire azaltma',
    icon: 'check_circle',
    scenario: 'Kamera tabanlı defekt algılama',
  },
  {
    id: 'planning' as ModuleType,
    title: 'Üretim Planlama',
    description: 'Senaryo simülasyonu ve kapasite optimizasyonu',
    icon: 'calendar_today',
    scenario: 'Dinamik sipariş yönetimi',
  },
  {
    id: 'anomaly' as ModuleType,
    title: 'Anomali Tespiti',
    description: 'Operasyonel risk yönetimi ve erken uyarı',
    icon: 'warning',
    scenario: 'Çoklu sensör izleme',
  },
  {
    id: 'copilot' as ModuleType,
    title: 'AI Copilot',
    description: 'Yönetici karar destek sistemi',
    icon: 'smart_toy',
    scenario: 'Doğal dil ile sorgulama',
  },
];

// ============================================
// CANLI SENSÖR GÖSTERGELERİ
// ============================================
// function LiveSensorGauge moved or unused


// ============================================
// KEStiRiMCi BAKIM DEMO
// ============================================
// PredictiveMaintenanceDemo replaced by module component


// ============================================
// ENERJİ İZLEME DEMO
// ============================================
function EnergyDemo({ data, onClose }: { data: EnergyData; onClose: () => void }) {
  const liveConsumption = useLiveData(
    data.hourly_data.map(h => ({ ...h, current: h.current + (Math.random() - 0.5) * 20 })),
    (prev) => prev.map(h => ({ ...h, current: Math.max(100, h.current + (Math.random() - 0.5) * 15) })),
    3000
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content demo-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>⚡ Enerji İzleme</h2>
          <div className="modal-header-right">
            <LiveBadge />
            <button onClick={onClose} className="close-btn">✕</button>
          </div>
        </div>

        <div className="demo-section">
          <div className="section-header">
            <h3>Anlık Tüketim Grafiği</h3>
            <LiveTimestamp />
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={liveConsumption}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="hour" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid rgba(255,255,255,0.1)' }} />
                <Area type="monotone" dataKey="current" stroke="#3b82f6" fill="url(#grad)" strokeWidth={2} />
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="48" y2="48">
                    <stop stopColor="#e11d48" />
                    <stop offset="1" stopColor="#fb7185" />
                  </linearGradient>
                </defs>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="demo-section">
          <h3>Akıllı Sayaç Verileri</h3>
          <div className="energy-stats">
            <div className="energy-stat">
              <div className="stat-icon">🔌</div>
              <div className="stat-value">{data.current_consumption.toLocaleString()} kWh</div>
              <div className="stat-label">Anlık Tüketim</div>
            </div>
            <div className="energy-stat">
              <div className="stat-icon">🌱</div>
              <div className="stat-value">{data.carbon_reduction} ton</div>
              <div className="stat-label">CO2 Azaltma Potansiyeli</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// ANOMALİ TESPİTİ DEMO
// ============================================
function AnomalyDemo({ data, onClose }: { data: AnomalyData; onClose: () => void }) {
  const [alerts, setAlerts] = useState(data.alerts);

  // Yeni alarm simülasyonu
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        const newAlert = {
          id: Date.now(),
          timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
          machine: ['CNC-02', 'PRS-01', 'WLD-01'][Math.floor(Math.random() * 3)],
          type: ['Titreşim Sapması', 'Sıcaklık Uyarısı', 'Akım Dalgalanması'][Math.floor(Math.random() * 3)],
          severity: ['low', 'medium'][Math.floor(Math.random() * 2)] as 'low' | 'medium',
          message: 'Sistem tarafından otomatik tespit edildi.'
        };
        setAlerts(prev => [newAlert, ...prev.slice(0, 4)]);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content demo-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🚨 Anomali Tespiti</h2>
          <div className="modal-header-right">
            <LiveBadge />
            <button onClick={onClose} className="close-btn">✕</button>
          </div>
        </div>

        <div className="demo-section">
          <div className="section-header">
            <h3>Canlı Alarm Akışı</h3>
            <LiveTimestamp />
          </div>
          <div className="alerts-feed">
            {alerts.map((alert) => (
              <div key={alert.id} className={`alert-item ${alert.severity}`}>
                <div className="alert-time">{alert.timestamp}</div>
                <div className="alert-content">
                  <div className="alert-title">{alert.machine} - {alert.type}</div>
                  <div className="alert-message">{alert.message}</div>
                </div>
                <div className={`alert-severity ${alert.severity}`}>
                  {alert.severity === 'critical' ? '🔴' : alert.severity === 'high' ? '🟠' : alert.severity === 'medium' ? '🟡' : '🟢'}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="demo-section">
          <h3>Sensör Durumu</h3>
          <div className="sensors-status">
            {data.sensor_data.map((sensor, idx) => (
              <div key={idx} className={`sensor-item ${sensor.status}`}>
                <span className="sensor-name">{sensor.sensor}</span>
                <span className="sensor-value">{sensor.value} {sensor.unit}</span>
                <span className={`sensor-status ${sensor.status}`}>
                  {sensor.status === 'normal' ? '✓' : '⚠'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// OEEDemo replaced by ProductionEfficiencyModule

// ============================================
// KALİTE KONTROL DEMO
// ============================================
function QualityDemo({ data, onClose }: { data: QualityData; onClose: () => void }) {
  const [scanActive, setScanActive] = useState(false);
  const [defectFound, setDefectFound] = useState<string | null>(null);

  const simulateScan = () => {
    setScanActive(true);
    setDefectFound(null);
    setTimeout(() => {
      setScanActive(false);
      if (Math.random() > 0.7) {
        const defects = ['Boyutsal sapma tespit edildi', 'Yüzey çizigi görüldü', 'Çapak tespit edildi'];
        setDefectFound(defects[Math.floor(Math.random() * defects.length)]);
      } else {
        setDefectFound('Parça onaylandı ✓');
      }
    }, 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content demo-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>✅ Kalite Kontrol</h2>
          <div className="modal-header-right">
            <LiveBadge />
            <button onClick={onClose} className="close-btn">✕</button>
          </div>
        </div>

        <div className="demo-section">
          <div className="section-header">
            <h3>Görüntü Analizi Simülasyonu</h3>
          </div>
          <div className="camera-view">
            <div className={`camera-frame ${scanActive ? 'scanning' : ''}`}>
              <div className="camera-placeholder">
                📷 Kamera Görüntüsü
              </div>
              {scanActive && <div className="scan-line"></div>}
            </div>
            <button
              className="btn btn-primary"
              onClick={simulateScan}
              disabled={scanActive}
            >
              {scanActive ? 'Taranıyor...' : 'Parça Tara'}
            </button>
            {defectFound && (
              <div className={`scan-result ${defectFound.includes('onay') ? 'success' : 'warning'}`}>
                {defectFound}
              </div>
            )}
          </div>
        </div>

        <div className="demo-section">
          <h3>Tespit Doğruluğu</h3>
          <div className="accuracy-display">
            <div className="accuracy-value">{data.defect_detection_accuracy}%</div>
            <div className="accuracy-label">AI Model Doğruluğu</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// ÜRETİM PLANLAMA DEMO
// ============================================
function PlanningDemo({ data, onClose }: { data: ProductionPlan; onClose: () => void }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content demo-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>📅 Üretim Planlama</h2>
          <div className="modal-header-right">
            <LiveBadge />
            <button onClick={onClose} className="close-btn">✕</button>
          </div>
        </div>

        <div className="demo-section">
          <div className="section-header">
            <h3>Aktif Siparişler</h3>
            <LiveTimestamp />
          </div>
          <div className="orders-list">
            {data.schedule_data.map((order, idx) => (
              <div key={idx} className={`order-item ${order.status}`}>
                <div className="order-info">
                  <span className="order-id">{order.id}</span>
                  <span className="order-customer">{order.customer}</span>
                </div>
                <div className="order-product">{order.product}</div>
                <div className="order-time">{order.start} - {order.end}</div>
                <span className={`order-status ${order.status}`}>
                  {order.status === 'tamamlandı' ? '✓ Tamamlandı' :
                    order.status === 'devam' ? '▶ Devam Ediyor' :
                      order.status === 'bekliyor' ? '⏳ Bekliyor' : '📋 Planlandı'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="demo-section">
          <h3>Kapasite Kullanımı</h3>
          <div className="capacity-bars">
            <div className="capacity-item">
              <span>Mevcut</span>
              <div className="capacity-bar">
                <div className="capacity-fill" style={{ width: `${data.current_capacity_usage}%` }}></div>
              </div>
              <span>{data.current_capacity_usage}%</span>
            </div>
            <div className="capacity-item optimized">
              <span>Optimize</span>
              <div className="capacity-bar">
                <div className="capacity-fill" style={{ width: `${data.optimized_capacity_usage}%` }}></div>
              </div>
              <span>{data.optimized_capacity_usage}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// AI COPILOT DEMO - NEW MODULE
// ============================================
function CopilotDemo({ onClose }: { onClose: () => void }) {
  return <AICopilotModule onClose={onClose} />;
}

// ============================================
// DEMO MODAL ROUTER
// ============================================
function DemoModal({ moduleId, onClose }: { moduleId: ModuleType; onClose: () => void }) {
  const [data, setData] = useState<PredictiveMaintenanceData | OEEMetrics | EnergyData | QualityData | ProductionPlan | AnomalyData | CopilotInsight | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        let result;
        switch (moduleId) {

          case 'predictive-maintenance':
            // New Module handles its own data
            setLoading(false);
            return;
          case 'oee':
            result = await fetchOEE();
            break;
          case 'energy':
            // New Module handles its own data
            setLoading(false);
            return;
          case 'quality':
            // New Module handles its own data
            setLoading(false);
            return;
          case 'planning':
            // New Module handles its own data
            setLoading(false);
            return;
          case 'anomaly':
            // New Module handles its own data
            setLoading(false);
            return;
          case 'copilot':
            result = await fetchCopilot();
            break;
        }
        setData(result);
      } catch (err) {
        console.error('Error fetching data:', err);
      }
      setLoading(false);
    };
    fetchData();
  }, [moduleId]);

  if (moduleId === 'copilot') {
    return <CopilotDemo onClose={onClose} />;
  }

  if (moduleId === 'predictive-maintenance') {
    return <PredictiveMaintenanceModule onClose={onClose} />;
  }

  if (moduleId === 'oee') {
    return <ProductionEfficiencyModule onClose={onClose} />;
  }

  if (moduleId === 'energy') {
    return <EnergyOptimizationModule onClose={onClose} />;
  }

  if (moduleId === 'quality') {
    return <QualityVisionModule onClose={onClose} />;
  }

  if (moduleId === 'planning') {
    return <ProductionPlanningModule onClose={onClose} />;
  }

  if (moduleId === 'anomaly') {
    return <AnomalyDetectionModule onClose={onClose} />;
  }

  if (loading) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content demo-modal loading" onClick={(e) => e.stopPropagation()}>
          <div className="loading-spinner"></div>
          <p>Veri yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  switch (moduleId) {
    default:
      return null;
  }
}

// ============================================
// ANA UYGULAMA
// ============================================
// ============================================
// ICON RENDERER
// ============================================
function renderIcon(iconName: string) {
  switch (iconName) {
    case 'speed':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" />
          <path d="M19.071 4.929C23.068 8.926 23.068 15.407 19.071 19.404" strokeOpacity="0.5" />
          <path d="M4.929 4.929C0.932 8.926 0.932 15.407 4.929 19.404" strokeOpacity="0.5" />
          <path d="M12 2V4" strokeLinecap="round" />
          <path d="M12 20V22" strokeLinecap="round" />
          <path d="M20 12H22" strokeLinecap="round" />
          <path d="M2 12H4" strokeLinecap="round" />
          <path d="M12 12L14 10" strokeLinecap="round" />
        </svg>
      );
    case 'bar_chart':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M18 20V10" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 20V4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M6 20V14" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'bolt':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'check_circle':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10" />
          <path d="M9 12L11 14L15 10" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'calendar_today':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="4" width="18" height="18" rx="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M16 2V6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M8 2V6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M3 10H21" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M8 14H8.01" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 14H12.01" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M16 14H16.01" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M8 18H8.01" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 18H12.01" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M16 18H16.01" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'warning':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 9V14" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 18H12.01" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M10.29 3.86L1.82 18C1.64556 18.3024 1.55293 18.6453 1.55201 18.9945C1.55108 19.3437 1.64191 19.6871 1.81507 19.9902C1.98822 20.2933 2.23746 20.5457 2.53729 20.722C2.83713 20.8984 3.17684 20.9926 3.522 20.994H20.478C20.8232 20.9926 21.1629 20.8984 21.4627 20.722C21.7625 20.5457 22.0118 20.2933 22.1849 19.9902C22.3581 19.6871 22.4489 19.3437 22.448 18.9945C22.4471 18.6453 22.3544 18.3024 22.18 18L13.71 3.86C13.5317 3.56611 13.2807 3.32312 12.9812 3.15449C12.6817 2.98587 12.3437 2.89728 12 2.89728C11.6563 2.89728 11.3183 2.98587 11.0188 3.15449C10.7193 3.32312 10.4683 3.56611 10.29 3.86Z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'smart_toy':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 2C10.8954 2 10 2.89543 10 4C10 5.10457 10.8954 6 12 6C13.1046 6 14 5.10457 14 4C14 2.89543 13.1046 2 12 2Z" />
          <path d="M4 11V18C4 19.1046 4.89543 20 6 20H18C19.1046 20 20 19.1046 20 18V11" strokeLinecap="round" />
          <circle cx="9" cy="14" r="1.5" />
          <circle cx="15" cy="14" r="1.5" />
          <path d="M2.5 12.5C2.5 12.5 4 10.5 5 10.5" strokeLinecap="round" />
          <path d="M21.5 12.5C21.5 12.5 20 10.5 19 10.5" strokeLinecap="round" />
        </svg>
      );
    default:
      return null;
  }
}

// ============================================
// ANA UYGULAMA
// ============================================
function App() {
  const [activeModule, setActiveModule] = useState<ModuleType | null>(null);

  return (
    <div className="app-container">
      {/* Hero Header */}
      <section className="hero-section">
        <h1>Industrial AI Nexus</h1>
        <p className="hero-subtitle">
          ACD, endüstri 4.0 dönüşümünüzü desteklemek için yedi stratejik AI çözüm alanı geliştirmiştir.
          Her proje alanı, üretim süreçlerinizin farklı bir kritik noktasına odaklanır ve ölçülebilir sonuçlar sunar.
        </p>
      </section>

      {/* Module Grid */}
      <div className="modules-layout">
        <div className="modules-grid-top">
          {modules.slice(0, 4).map((module, index) => (
            <div
              key={module.id}
              className="module-card"
              onClick={() => setActiveModule(module.id)}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="module-icon">{renderIcon(module.icon)}</div>
              <h3>{module.title}</h3>
              <p>{module.description}</p>
            </div>
          ))}
        </div>
        <div className="modules-grid-bottom">
          {modules.slice(4).map((module, index) => (
            <div
              key={module.id}
              className="module-card"
              onClick={() => setActiveModule(module.id)}
              style={{ animationDelay: `${(index + 4) * 0.05}s` }}
            >
              <div className="module-icon">{renderIcon(module.icon)}</div>
              <h3>{module.title}</h3>
              <p>{module.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Demo Modal */}
      {activeModule && (
        activeModule === 'predictive-maintenance'
          ? <PredictiveMaintenanceModule onClose={() => setActiveModule(null)} />
          : <DemoModal moduleId={activeModule} onClose={() => setActiveModule(null)} />
      )}
    </div>
  );
}



export default App;
