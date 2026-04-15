import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Zap, Network, Database, Search, Cpu, ChevronRight } from 'lucide-react';
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
// HOOKS
// ============================================
function useCountUp(target: number, duration = 2000, decimals = 0): number {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (target === 0) { setValue(0); return; }
    const start = performance.now();
    let rafId: number;
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setValue(parseFloat((target * eased).toFixed(decimals)));
      if (progress < 1) rafId = requestAnimationFrame(animate);
    };
    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [target, duration, decimals]);
  return value;
}

// ============================================
// PARTICLE BACKGROUND
// ============================================
function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const count = window.innerWidth > 768 ? 80 : 40;

    type Particle = { x: number; y: number; vx: number; vy: number; r: number };
    let particles: Particle[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        r: Math.random() * 1.2 + 0.4,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(59,130,246,${0.12 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(96,165,250,0.5)';
        ctx.fill();
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
      }
      animId = requestAnimationFrame(draw);
    };

    draw();
    window.addEventListener('resize', resize);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0, left: 0,
        width: '100%', height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
        opacity: 0.35,
      }}
    />
  );
}

// ============================================
// CURSOR GLOW
// ============================================
function CursorGlow() {
  const glowRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const posRef = useRef({ x: -200, y: -200 });

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      posRef.current = { x: e.clientX, y: e.clientY };
      if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(() => {
          if (glowRef.current) {
            glowRef.current.style.transform =
              `translate(${posRef.current.x - 40}px, ${posRef.current.y - 40}px)`;
          }
          rafRef.current = 0;
        });
      }
    };
    document.addEventListener('mousemove', onMove);
    return () => document.removeEventListener('mousemove', onMove);
  }, []);

  return (
    <div
      ref={glowRef}
      style={{
        position: 'fixed',
        width: '80px',
        height: '80px',
        background: 'radial-gradient(circle, rgba(59,130,246,0.07) 0%, transparent 70%)',
        borderRadius: '50%',
        pointerEvents: 'none',
        zIndex: 9998,
        transform: 'translate(-200px, -200px)',
        willChange: 'transform',
      }}
    />
  );
}

// ============================================
// ROI TICKER
// ============================================
function ROITicker() {
  const [dataRate, setDataRate] = useState(12340);
  const [anomalies, setAnomalies] = useState(156);
  const [oeeGain, setOeeGain] = useState(12.3);
  const [carbon, setCarbon] = useState(1.24);

  useEffect(() => {
    const interval = setInterval(() => {
      setDataRate(prev => prev + Math.floor(Math.random() * 80 + 20));
      if (Math.random() < 0.12) setAnomalies(prev => prev + 1);
      setOeeGain(prev => {
        const next = prev + (Math.random() - 0.3) * 0.08;
        return parseFloat(Math.max(10, Math.min(25, next)).toFixed(1));
      });
      setCarbon(prev => parseFloat((prev + Math.random() * 0.01).toFixed(2)));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="roi-ticker">
      <div className="roi-live-badge">
        <span className="roi-live-dot" />
        CANLI
      </div>
      <div className="roi-metrics">
        <div className="roi-item">
          <span className="roi-label">Canlı Veri Noktası</span>
          <span className="roi-value roi-data">{dataRate.toLocaleString('tr-TR')} <span className="roi-unit">/dk</span></span>
        </div>
        <div className="roi-divider" />
        <div className="roi-item">
          <span className="roi-label">Önlenen Anomali</span>
          <span className="roi-value roi-success">{anomalies}</span>
        </div>
        <div className="roi-divider" />
        <div className="roi-item">
          <span className="roi-label">OEE İyileşmesi</span>
          <span className="roi-value roi-success">+{oeeGain.toFixed(1)}%</span>
        </div>
        <div className="roi-divider" />
        <div className="roi-item">
          <span className="roi-label">Tasarruf Edilen CO₂</span>
          <span className="roi-value roi-eco">{carbon.toFixed(2)}t</span>
        </div>
      </div>
    </div>
  );
}

// ============================================
// HERO STATS
// ============================================
function HeroStats() {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const modules7 = useCountUp(visible ? 7 : 0, 1500);
  const maxSaving = useCountUp(visible ? 30 : 0, 2000);
  const savingsM = useCountUp(visible ? 2.4 : 0, 2500, 1);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setVisible(true);
    }, { threshold: 0.3 });
    const el = ref.current;
    if (el) observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="hero-stats">
      <div className="hero-stat">
        <span className="hero-stat-value">{modules7}</span>
        <span className="hero-stat-label">AI Modülü</span>
      </div>
      <div className="hero-stat-divider" />
      <div className="hero-stat">
        <span className="hero-stat-value">%{maxSaving}+</span>
        <span className="hero-stat-label">Maks. Verimlilik Artışı</span>
      </div>
      <div className="hero-stat-divider" />
      <div className="hero-stat">
        <span className="hero-stat-value">₺{savingsM}M+</span>
        <span className="hero-stat-label">Yıllık Tasarruf Potansiyeli</span>
      </div>
    </div>
  );
}

// ============================================
// LIVE CARD PREVIEWS
// ============================================
function PredictiveWavePreview() {
  return (
    <div className="card-preview">
      <div className="preview-label">Sensör Sinyali</div>
      <div className="signal-bars">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className={`signal-bar signal-bar-${i}`} />
        ))}
      </div>
    </div>
  );
}

function OEEPreview() {
  const [oee, setOee] = useState(85.2);
  useEffect(() => {
    const iv = setInterval(() => {
      setOee(prev => {
        const next = prev + (Math.random() - 0.4) * 0.3;
        return parseFloat(Math.max(81, Math.min(89, next)).toFixed(1));
      });
    }, 2000);
    return () => clearInterval(iv);
  }, []);
  const r = 14;
  const circ = 2 * Math.PI * r;
  const dash = (oee / 100) * circ;
  return (
    <div className="card-preview">
      <div className="preview-label">OEE Skoru</div>
      <div className="oee-mini-gauge">
        <svg width="40" height="40" viewBox="0 0 40 40">
          <circle cx="20" cy="20" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="3" />
          <circle
            cx="20" cy="20" r={r}
            fill="none"
            stroke="#22c55e"
            strokeWidth="3"
            strokeDasharray={`${dash} ${circ}`}
            strokeLinecap="round"
            transform="rotate(-90 20 20)"
            style={{ transition: 'stroke-dasharray 0.9s cubic-bezier(0.4,0,0.2,1)', filter: 'drop-shadow(0 0 4px #22c55e88)' }}
          />
        </svg>
        <span className="oee-mini-value">{oee.toFixed(1)}%</span>
      </div>
    </div>
  );
}

const ENERGY_BAR_HEIGHTS = [0.55, 0.82, 0.38, 0.70, 0.45, 0.90, 0.60];

function EnergyPreview() {
  return (
    <div className="card-preview">
      <div className="preview-label">Enerji Tasarrufu</div>
      <div className="energy-mini-eq">
        {ENERGY_BAR_HEIGHTS.map((h, i) => (
          <div
            key={i}
            className="energy-mini-bar"
            style={{ '--bar-base': h, animationDelay: `${i * 0.11}s` } as React.CSSProperties}
          />
        ))}
        <span className="energy-mini-badge">↓22%</span>
      </div>
    </div>
  );
}

function QualityPreview() {
  const [stream, setStream] = useState<boolean[]>([true, true, true, true, true, true]);
  useEffect(() => {
    const iv = setInterval(() => {
      const pass = Math.random() > 0.06;
      setStream(prev => [...prev.slice(1), pass]);
    }, 650);
    return () => clearInterval(iv);
  }, []);
  return (
    <div className="card-preview">
      <div className="preview-label">Kalite Akışı</div>
      <div className="quality-stream">
        {stream.map((pass, i) => (
          <span key={i} className={`quality-chip ${pass ? 'pass' : 'fail'}`}>
            {pass ? '✓' : '✗'}
          </span>
        ))}
      </div>
    </div>
  );
}

function PlanningPreview() {
  return (
    <div className="card-preview">
      <div className="preview-label">Kapasite Kullanımı</div>
      <div className="planning-preview-bars">
        {[88, 72, 95].map((w, i) => (
          <div key={i} className="planning-preview-bar-wrap">
            <div
              className="planning-preview-bar"
              style={{ width: `${w}%`, animationDelay: `${i * 0.15}s` }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function AnomalyPreview() {
  const [count, setCount] = useState(3);
  const [active, setActive] = useState(false);
  useEffect(() => {
    const iv = setInterval(() => {
      if (Math.random() < 0.15) {
        setCount(prev => prev + 1);
        setActive(true);
        setTimeout(() => setActive(false), 1500);
      }
    }, 4000);
    return () => clearInterval(iv);
  }, []);
  return (
    <div className="card-preview">
      <div className="preview-label">Aktif Uyarı</div>
      <div className={`preview-metric preview-warning${active ? ' preview-flash' : ''}`}>
        <span className="anomaly-preview-dot" />
        {count} uyarı
      </div>
    </div>
  );
}

function CopilotPreview() {
  return (
    <div className="card-preview">
      <div className="preview-label">Asistan</div>
      <div className="copilot-typing-preview">
        <span className="typing-dot-preview" style={{ animationDelay: '0s' }} />
        <span className="typing-dot-preview" style={{ animationDelay: '0.2s' }} />
        <span className="typing-dot-preview" style={{ animationDelay: '0.4s' }} />
        <span className="typing-ready-label">Hazır</span>
      </div>
    </div>
  );
}

function LivePreview({ moduleId }: { moduleId: ModuleType }) {
  switch (moduleId) {
    case 'predictive-maintenance': return <PredictiveWavePreview />;
    case 'oee': return <OEEPreview />;
    case 'energy': return <EnergyPreview />;
    case 'quality': return <QualityPreview />;
    case 'planning': return <PlanningPreview />;
    case 'anomaly': return <AnomalyPreview />;
    case 'copilot': return <CopilotPreview />;
    default: return null;
  }
}

// ============================================
// MODÜL TANIMI - BAĞIMSIZ SENARYOLAR
// ============================================
const modules = [
  {
    id: 'predictive-maintenance' as ModuleType,
    title: 'Kestirimci Bakım',
    description: 'Arıza öncesi risk tespiti ve bakım zamanı optimizasyonu',
    icon: 'speed',
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
// AI COPILOT DEMO
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
            setLoading(false);
            return;
          case 'oee':
            result = await fetchOEE();
            break;
          case 'energy':
            setLoading(false);
            return;
          case 'quality':
            setLoading(false);
            return;
          case 'planning':
            setLoading(false);
            return;
          case 'anomaly':
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

  if (moduleId === 'copilot') return <CopilotDemo onClose={onClose} />;
  if (moduleId === 'predictive-maintenance') return <PredictiveMaintenanceModule onClose={onClose} />;
  if (moduleId === 'oee') return <ProductionEfficiencyModule onClose={onClose} />;
  if (moduleId === 'energy') return <EnergyOptimizationModule onClose={onClose} />;
  if (moduleId === 'quality') return <QualityVisionModule onClose={onClose} />;
  if (moduleId === 'planning') return <ProductionPlanningModule onClose={onClose} />;
  if (moduleId === 'anomaly') return <AnomalyDetectionModule onClose={onClose} />;

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
  return null;
}

// ============================================
// CHANGELOG MODAL
// ============================================
function ChangelogModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content demo-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '620px', height: 'auto' }}>
        <div className="modal-header">
          <div>
            <h2>Sürüm Notları (v2.1.0)</h2>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>2026 — Platform Tanıtımı</div>
          </div>
          <button onClick={onClose} className="close-btn">✕</button>
        </div>
        <div className="module-content" style={{ padding: '1.5rem' }}>

          <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem', color: '#4ade80', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Network size={20} />
            v2.1.0 — Platform Tanıtım Bölümü
          </h3>
          <ul style={{ lineHeight: '1.7', listStyleType: 'disc', paddingLeft: '1.5rem', color: '#e2e8f0', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
            <li><strong>"Industrial AI Nexus Nedir?" Kartı:</strong> Landing page'e platform tanıtım bölümü eklendi.</li>
            <li><strong>3 Aşamalı Süreç Gösterimi:</strong> Veri Toplama → Saha Analizi → AI Çözüm adımları görselleştirildi.</li>
            <li><strong>7 Aktif Çözüm Alanı:</strong> Domain badge'leri ile mevcut modüller tanıtıldı.</li>
          </ul>

          <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Zap size={20} />
            v2.0.0 — Görsel & Animasyon Yükseltmesi
          </h3>
          <ul style={{ lineHeight: '1.7', listStyleType: 'disc', paddingLeft: '1.5rem', color: '#e2e8f0', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
            <li><strong>Canvas Parçacık Arka Planı:</strong> Sensör ağ topolojisi animasyonu eklendi.</li>
            <li><strong>Cursor Glow:</strong> İmleç takip efekti ile premium hissi sağlandı.</li>
            <li><strong>Canlı ROI Ticker:</strong> Landing page'de anlık tasarruf göstergesi eklendi.</li>
            <li><strong>Kart Önizlemeleri:</strong> Her modül kartında canlı mini metrikler.</li>
            <li><strong>3D Kart Tilt:</strong> Hover'da holografik perspektif efekti.</li>
            <li><strong>Hero İstatistikleri:</strong> Animasyonlu sayaçlarla anahtar metrikler.</li>
            <li><strong>Modal Animasyonları:</strong> Framer Motion ile smooth enter/exit geçişleri.</li>
            <li><strong>Modül Görsel Yükseltmeleri:</strong> Anomali, enerji, kalite, OEE modülleri.</li>
          </ul>

          <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldCheck size={20} />
            v1.1.1 — Güvenlik Yaması
          </h3>
          <ul style={{ lineHeight: '1.6', listStyleType: 'disc', paddingLeft: '1.5rem', color: '#e2e8f0', fontSize: '0.95rem' }}>
            <li><strong>XSS Koruması:</strong> AI Chatbot modülünde HTML sanitization eklendi.</li>
            <li><strong>Input Validation:</strong> Güvenlik kontrolleri artırıldı.</li>
          </ul>

          <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: '0.8rem', color: '#64748b', textAlign: 'center' }}>
            Industrial AI Nexus v2.1.0 <br /> Developed by A. Kerem Erdogmus
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

  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const rx = ((e.clientY - cy) / (rect.height / 2)) * -5;
    const ry = ((e.clientX - cx) / (rect.width / 2)) * 5;
    card.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-4px)`;
  };

  const handleCardMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.transform = '';
  };

  return (
    <div className="app-container" style={{ position: 'relative', zIndex: 1 }}>
      <ParticleBackground />
      <CursorGlow />

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
          gap: '0.5rem',
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
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 6px #4ade80' }}></span>
        v2.1.0
      </div>

      {/* Hero Header */}
      <section className="hero-section">
        <h1 className="hero-title-shimmer">Industrial AI Nexus</h1>
        <p className="hero-subtitle">
          ACD, endüstri 4.0 dönüşümünüzü desteklemek için yedi stratejik AI çözüm alanı geliştirmiştir.
          Her proje alanı, üretim süreçlerinizin farklı bir kritik noktasına odaklanır ve ölçülebilir sonuçlar sunar.
        </p>
        <HeroStats />
      </section>

      {/* ROI Ticker */}
      <ROITicker />

      {/* What is Industrial AI Nexus? */}
      <div className="nexus-intro-card">
        <div className="nexus-intro-left">
          <div className="nexus-intro-header">
            <div className="nexus-intro-icon">
              <Network size={28} />
            </div>
            <div>
              <h2 className="nexus-intro-title">Industrial AI Nexus Nedir?</h2>
              <p className="nexus-intro-tagline">Endüstriyel use case'lere özel tailored AI çözüm sistemi</p>
            </div>
          </div>
          <p className="nexus-intro-desc">
            Industrial AI Nexus, üretim verimliliği ve kronik sorunların çözümü gibi endüstriyel
            alanlara özel entegre AI çözümler geliştiren bir platformdur. Her çözüm; sahadan
            toplanan gerçek veriler, yerinde saha analizi ve use case'e uygun AI destekli
            uygulama yaklaşımlarıyla şekillendirilir.
          </p>
          <div className="nexus-process-steps">
            <div className="nexus-step">
              <div className="nexus-step-icon"><Database size={18} /></div>
              <div>
                <div className="nexus-step-label">Veri Toplama</div>
                <div className="nexus-step-sub">Sahadan gerçek zamanlı veri</div>
              </div>
            </div>
            <ChevronRight size={16} className="nexus-step-arrow" />
            <div className="nexus-step">
              <div className="nexus-step-icon"><Search size={18} /></div>
              <div>
                <div className="nexus-step-label">Saha Analizi</div>
                <div className="nexus-step-sub">Use case bazlı problem tespiti</div>
              </div>
            </div>
            <ChevronRight size={16} className="nexus-step-arrow" />
            <div className="nexus-step">
              <div className="nexus-step-icon"><Cpu size={18} /></div>
              <div>
                <div className="nexus-step-label">AI Çözüm</div>
                <div className="nexus-step-sub">Platforma özel entegrasyon</div>
              </div>
            </div>
          </div>
        </div>
        <div className="nexus-intro-right">
          <div className="nexus-domains-label">Aktif Çözüm Alanları</div>
          <div className="nexus-domains-grid">
            {[
              'Prediktif Bakım',
              'Üretim Verimliliği',
              'Enerji Optimizasyonu',
              'Kalite Vizyonu',
              'Üretim Planlama',
              'Anomali Tespiti',
              'AI Copilot',
            ].map((domain, i) => (
              <div key={i} className="nexus-domain-badge">
                <span className="nexus-domain-dot" />
                {domain}
              </div>
            ))}
          </div>
          <div className="nexus-more-hint">
            + Farklı endüstriyel sorunlar için yeni çözümler geliştirilebilir
          </div>
        </div>
      </div>

      {/* Module Grid */}
      <div className="modules-layout">
        <div className="modules-grid-top">
          {modules.slice(0, 4).map((module, index) => (
            <div
              key={module.id}
              className="module-card"
              onClick={() => setActiveModule(module.id)}
              style={{ animationDelay: `${index * 0.05}s` }}
              onMouseMove={handleCardMouseMove}
              onMouseLeave={handleCardMouseLeave}
            >
              <div className="module-icon">{renderIcon(module.icon)}</div>
              <h3>{module.title}</h3>
              <p>{module.description}</p>
              <LivePreview moduleId={module.id} />
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
              onMouseMove={handleCardMouseMove}
              onMouseLeave={handleCardMouseLeave}
            >
              <div className="module-icon">{renderIcon(module.icon)}</div>
              <h3>{module.title}</h3>
              <p>{module.description}</p>
              <LivePreview moduleId={module.id} />
            </div>
          ))}
        </div>
      </div>

      {/* Demo Modal with AnimatePresence */}
      <AnimatePresence>
        {activeModule && (
          <motion.div
            key={activeModule}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {activeModule === 'predictive-maintenance'
              ? <PredictiveMaintenanceModule onClose={() => setActiveModule(null)} />
              : <DemoModal moduleId={activeModule} onClose={() => setActiveModule(null)} />
            }
          </motion.div>
        )}
      </AnimatePresence>

      {/* Changelog Modal */}
      <AnimatePresence>
        {showChangelog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChangelogModal onClose={() => setShowChangelog(false)} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
