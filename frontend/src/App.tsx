import { useState, useEffect } from 'react';
import { ShieldCheck, Zap } from 'lucide-react';
import {
  fetchOEE, fetchCopilot
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
// CHANGELOG MODAL
// ============================================
function ChangelogModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content demo-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', height: 'auto' }}>
        <div className="modal-header">
          <div>
            <h2>📢 Sürüm Notları (v1.1.1)</h2>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>16 Ocak 2026 - Güvenlik Güncellemesi</div>
          </div>
          <button onClick={onClose} className="close-btn">✕</button>
        </div>
        <div className="module-content" style={{ padding: '1.5rem' }}>

          <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldCheck size={20} />
            Güvenlik Yaması (v1.1.1)
          </h3>
          <ul style={{ lineHeight: '1.6', listStyleType: 'disc', paddingLeft: '1.5rem', color: '#e2e8f0', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
            <li><strong>XSS Koruması:</strong> AI Chatbot modülünde kullanıcı girdileri için HTML sanitization eklendi.</li>
            <li><strong>Input Validation:</strong> Dışarıdan kod yürütülmesini engelleyen güvenlik kontrolleri artırıldı.</li>
            <li><strong>UI Fixes:</strong> Changelog ikonları düzeltildi ve Kalite Kontrol modülü görsel yolları güncellendi.</li>
          </ul>

          <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Zap size={20} />
            Modül 1: Kestirimci Bakım (v1.1.0)
          </h3>
          <ul style={{ lineHeight: '1.6', listStyleType: 'disc', paddingLeft: '1.5rem', color: '#e2e8f0', fontSize: '0.95rem' }}>
            <li style={{ marginBottom: '0.5rem' }}><strong>Gelişmiş Grafikler:</strong> Titreşim analizine ek olarak <em>Sıcaklık</em> ve <em>RPM</em> grafikleri eklendi.</li>
            <li style={{ marginBottom: '0.5rem' }}><strong>Premium 3D Model:</strong> Makine görselleştirmesi endüstriyel standartlarda tamamen yenilendi.</li>
            <li style={{ marginBottom: '0.5rem' }}><strong>Single-Screen Layout:</strong> Tüm veriler tek ekranda. Scroll gerektirmez.</li>
          </ul>

          <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: '0.8rem', color: '#64748b', textAlign: 'center' }}>
            Industrial AI Nexus v1.1.1 <br /> Developed by A. Kerem Erdogmus
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// ANA UYGULAMA
// ============================================
function App() {
  const [activeModule, setActiveModule] = useState<ModuleType | null>(null);
  const [showChangelog, setShowChangelog] = useState(false);

  return (
    <div className="app-container">
      {/* Version Badge */}
      <div
        onClick={() => setShowChangelog(true)}
        style={{
          position: 'absolute',
          top: '1.5rem',
          right: '2rem',
          background: 'rgba(255, 255, 255, 0.05)',
          padding: '0.5rem 1rem',
          borderRadius: '99px',
          cursor: 'pointer',
          fontSize: '0.85rem',
          color: 'rgba(255, 255, 255, 0.6)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          transition: 'all 0.2s ease',
          zIndex: 100,
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
          e.currentTarget.style.color = '#fff';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
          e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
        }}
      >
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80' }}></span>
        v1.1.1
      </div>

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

      {/* Changelog Modal */}
      {showChangelog && <ChangelogModal onClose={() => setShowChangelog(false)} />}
    </div>
  );
}



export default App;
