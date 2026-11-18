import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, Network, ShieldCheck, Zap } from 'lucide-react';
import type { ModuleType } from './types';
import './App.css';
import PredictiveMaintenanceModule from './components/PredictiveMaintenanceModule';
import ProductionEfficiencyModule from './components/ProductionEfficiencyModule';
import EnergyOptimizationModule from './components/EnergyOptimizationModule';
import QualityVisionModule from './components/QualityVisionModule';
import ProductionPlanningModule from './components/ProductionPlanningModule';
import AnomalyDetectionModule from './components/AnomalyDetectionModule';
import AICopilotModule from './components/AICopilotModule';
import Landing from './landing/Landing';

const APP_VERSION = '3.0.0';

// ============================================
// DEMO MODAL ROUTER
// ============================================
function DemoModal({ moduleId, onClose }: { moduleId: ModuleType; onClose: () => void }) {
  switch (moduleId) {
    case 'predictive-maintenance': return <PredictiveMaintenanceModule onClose={onClose} />;
    case 'oee': return <ProductionEfficiencyModule onClose={onClose} />;
    case 'energy': return <EnergyOptimizationModule onClose={onClose} />;
    case 'quality': return <QualityVisionModule onClose={onClose} />;
    case 'planning': return <ProductionPlanningModule onClose={onClose} />;
    case 'anomaly': return <AnomalyDetectionModule onClose={onClose} />;
    case 'copilot': return <AICopilotModule onClose={onClose} />;
    default: return null;
  }
}

// ============================================
// CHANGELOG MODAL
// ============================================
const sectionTitle = (color: string): React.CSSProperties => ({
  fontSize: '1rem', marginBottom: '0.75rem', color, display: 'flex', alignItems: 'center', gap: '0.5rem',
});
const listStyle: React.CSSProperties = {
  lineHeight: '1.7', listStyleType: 'disc', paddingLeft: '1.5rem', color: '#ECEDEF', fontSize: '0.95rem', marginBottom: '1.5rem',
};

function ChangelogModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content demo-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '620px', height: 'auto' }}>
        <div className="modal-header">
          <div>
            <h2>Sürüm Notları (v{APP_VERSION})</h2>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>2026 — Tailored, not packaged</div>
          </div>
          <button onClick={onClose} className="close-btn" aria-label="Kapat">✕</button>
        </div>
        <div className="module-content" style={{ padding: '1.5rem' }}>
          <h3 style={sectionTitle('#F07AA0')}>
            <Layers size={20} />
            v3.0.0 — Yeni anlatı ve marka
          </h3>
          <ul style={listStyle}>
            <li><strong>Yeni landing ("Blueprint"):</strong> Nx logosu, magenta/grafit marka renkleri, açık mühendislik estetiği.</li>
            <li><strong>Tailored anlatı:</strong> "Fabrikalar parmak izi gibidir" — hazır paket vs. use-case odaklı AI karşılaştırması.</li>
            <li><strong>Veriden değere yolculuk:</strong> Sahadan veri toplama → Darboğaz analizi → Özelleştirilmiş AI çözümü.</li>
            <li><strong>Use Case Konfigüratörü:</strong> Sektör, sorun ve mevcut veriye göre anlık çözüm taslağı ve saha keşfi talebi.</li>
            <li><strong>Çözüm Blokları:</strong> 7 demo modülü birleştirilebilir bloklar olarak yeniden konumlandı.</li>
            <li><strong>Sahadan uygulamalar:</strong> AgroPulse AI, PharmAI, RKVision Guard ve diğer örnekler.</li>
            <li><strong>Sanal PoC → On-Premise:</strong> Demo ile gerçek entegrasyon arasındaki fark netleştirildi.</li>
            <li><strong>Kaldırılanlar:</strong> Simüle ROI ticker'ı, hero istatistikleri, parçacık ve imleç efektleri.</li>
          </ul>
          <h3 style={sectionTitle('#4ade80')}>
            <Network size={20} />
            v2.1.0 — Platform Tanıtım Bölümü
          </h3>
          <ul style={listStyle}>
            <li><strong>"Industrial AI Nexus Nedir?" kartı</strong> ve 3 aşamalı süreç gösterimi.</li>
          </ul>
          <h3 style={sectionTitle('#F07AA0')}>
            <Zap size={20} />
            v2.0.0 — Görsel & Animasyon Yükseltmesi
          </h3>
          <ul style={listStyle}>
            <li>Kalite, Planlama ve Anomali modüllerinde tam yenileme; modal animasyonları.</li>
          </ul>
          <h3 style={sectionTitle('#f87171')}>
            <ShieldCheck size={20} />
            v1.1.1 — Güvenlik Yaması
          </h3>
          <ul style={{ ...listStyle, marginBottom: 0 }}>
            <li>AI Copilot girişlerinde XSS koruması (HTML sanitization).</li>
          </ul>
          <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: '0.8rem', color: '#7D838E', textAlign: 'center' }}>
            Industrial AI Nexus v{APP_VERSION} <br /> Developed by A. Kerem Erdogmus
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

  // Modal açıkken sayfa kaydırmasını kilitle
  useEffect(() => {
    const locked = activeModule !== null || showChangelog;
    document.body.style.overflow = locked ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [activeModule, showChangelog]);

  return (
    <>
      <Landing
        version={APP_VERSION}
        onOpenDemo={setActiveModule}
        onShowChangelog={() => setShowChangelog(true)}
      />

      <AnimatePresence>
        {activeModule && (
          <motion.div
            key={activeModule}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ position: 'relative', zIndex: 1000 }}
          >
            <DemoModal moduleId={activeModule} onClose={() => setActiveModule(null)} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showChangelog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ position: 'relative', zIndex: 1000 }}
          >
            <ChangelogModal onClose={() => setShowChangelog(false)} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default App;
