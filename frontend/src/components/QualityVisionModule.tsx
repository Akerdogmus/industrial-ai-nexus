import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Eye, ScanLine, AlertTriangle, CheckCircle2, Camera, Settings2,
    Crosshair, ChevronLeft, ChevronRight, Package, Cpu, BarChart2, ShieldAlert
} from 'lucide-react';
import {
    INSPECTION_SAMPLES,
    THRESHOLD_PRESETS,
    getDetectionColor,
    getTypeLabel,
    type Detection,
    type InspectionSample
} from '../data/visionMockData';

interface QualityVisionModuleProps {
    onClose: () => void;
}

// ============================================
// SESSION STATS
// ============================================
interface SessionStats {
    scanned: number;
    passed: number;
    rejected: number;
    totalDefects: number;
}

// ============================================
// SEVERITY SCORE CALCULATOR
// Returns 0–100, weighted by detection types
// ============================================
function calcSeverityScore(detections: Detection[], threshold: number): number {
    const visible = detections.filter(d => d.confidence >= threshold);
    if (visible.length === 0) return 0;
    const raw = visible.reduce((sum, d) => {
        const w = d.type === 'critical' ? 40 : d.type === 'minor' ? 15 : 5;
        return sum + w * d.confidence;
    }, 0);
    return Math.min(100, Math.round(raw));
}

// ============================================
// BOUNDING BOX COMPONENT
// ============================================
const BoundingBox: React.FC<{
    detection: Detection;
    isHovered: boolean;
    onHover: (id: number | null) => void;
}> = ({ detection, isHovered, onHover }) => {
    const color = getDetectionColor(detection.type);

    return (
        <motion.div
            className={`vision-bounding-box ${detection.type} ${isHovered ? 'hovered' : ''}`}
            style={{
                top: `${detection.box.top}%`,
                left: `${detection.box.left}%`,
                width: `${detection.box.width}%`,
                height: `${detection.box.height}%`,
                '--box-color': color,
            } as React.CSSProperties}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3 }}
            onMouseEnter={() => onHover(detection.id)}
            onMouseLeave={() => onHover(null)}
        >
            <div className="box-corner top-left" />
            <div className="box-corner top-right" />
            <div className="box-corner bottom-left" />
            <div className="box-corner bottom-right" />
            <div className="box-crosshair"><Crosshair size={12} /></div>
            <div className="box-label">
                <span className="label-text">{detection.label}</span>
                <span className="confidence-badge">{Math.round(detection.confidence * 100)}%</span>
            </div>
            <AnimatePresence>
                {isHovered && (
                    <motion.div
                        className="box-tooltip"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                    >
                        <div className="tooltip-header">
                            <span className="tooltip-type">{getTypeLabel(detection.type)}</span>
                            <span className="tooltip-area">{detection.area}</span>
                        </div>
                        <p className="tooltip-desc">{detection.description}</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

// ============================================
// CANVAS LASER SCAN ANIMATION
// ============================================
const ScanAnimation: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const onCompleteRef = useRef(onComplete);
    onCompleteRef.current = onComplete;

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const parent = canvas.parentElement;
        if (!parent) return;
        canvas.width = parent.offsetWidth;
        canvas.height = parent.offsetHeight;

        const duration = 2000;
        const start = performance.now();
        let animId: number;

        const draw = (now: number) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const x = progress * (canvas.width + 20) - 10;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Trailing afterglow
            const trailW = Math.min(100, x);
            if (trailW > 0) {
                const trail = ctx.createLinearGradient(x - trailW, 0, x, 0);
                trail.addColorStop(0, 'rgba(0,255,180,0)');
                trail.addColorStop(1, 'rgba(0,255,180,0.12)');
                ctx.fillStyle = trail;
                ctx.fillRect(x - trailW, 0, trailW, canvas.height);
            }

            // Main laser beam
            const beam = ctx.createLinearGradient(x - 4, 0, x + 4, 0);
            beam.addColorStop(0, 'rgba(0,255,180,0)');
            beam.addColorStop(0.5, 'rgba(0,255,180,0.95)');
            beam.addColorStop(1, 'rgba(0,255,180,0)');
            ctx.fillStyle = beam;
            ctx.fillRect(x - 4, 0, 8, canvas.height);

            if (progress < 1) {
                animId = requestAnimationFrame(draw);
            } else {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                onCompleteRef.current();
            }
        };

        animId = requestAnimationFrame(draw);
        return () => cancelAnimationFrame(animId);
    }, []);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'absolute', top: 0, left: 0,
                width: '100%', height: '100%',
                pointerEvents: 'none', zIndex: 10, borderRadius: 'inherit',
            }}
        />
    );
};

// ============================================
// SEVERITY SCORE GAUGE
// ============================================
const SeverityGauge: React.FC<{ score: number }> = ({ score }) => {
    const color = score === 0 ? '#10b981' : score < 30 ? '#f59e0b' : '#ef4444';
    const label = score === 0 ? 'TEMİZ' : score < 30 ? 'DİKKAT' : 'KRİTİK';

    return (
        <div className="severity-gauge-row">
            <div className="severity-gauge-label">
                <ShieldAlert size={14} />
                <span>Hata Şiddeti</span>
            </div>
            <div className="severity-gauge-bar-wrap">
                <motion.div
                    className="severity-gauge-bar"
                    style={{ background: color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${score}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                />
                <div className="severity-gauge-track" />
            </div>
            <span className="severity-score-value" style={{ color }}>
                {score}/100 <span className="severity-tag" style={{ background: color }}>{label}</span>
            </span>
        </div>
    );
};

// ============================================
// VERDICT PANEL COMPONENT
// ============================================
const VerdictPanel: React.FC<{
    visibleDetections: Detection[];
    threshold: number;
    sample: InspectionSample;
    inferenceMs: number;
}> = ({ visibleDetections, sample, inferenceMs }) => {
    const hasCritical = visibleDetections.some(d => d.type === 'critical');
    const hasMinor = visibleDetections.some(d => d.type === 'minor');
    const isPass = !hasCritical && (sample.detections.length === 0 || visibleDetections.length === 0);

    return (
        <motion.div
            className={`vision-verdict ${isPass ? 'pass' : 'reject'}`}
            key={`${sample.id}-${visibleDetections.length}`}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
        >
            <div className="verdict-icon">
                {isPass ? <CheckCircle2 size={32} /> : <AlertTriangle size={32} />}
            </div>
            <div className="verdict-content">
                <h3 className="verdict-title">
                    {isPass ? '✓ KABUL (PASS)' : '✗ FİRE (REJECT)'}
                </h3>
                <p className="verdict-message">
                    {sample.detections.length === 0
                        ? 'Parça temiz. Hata tespit edilmedi.'
                        : hasCritical
                            ? 'Kritik hata tespit edildi! Ürün reddedildi.'
                            : hasMinor
                                ? 'Minör hatalar tespit edildi. Ürün kabul edilebilir.'
                                : 'Eşikte hata tespit edilmedi. Ürün temiz.'
                    }
                </p>
                <div className="verdict-meta">
                    <Cpu size={11} />
                    <span>YOLOv8-nano · GPU · {inferenceMs}ms</span>
                </div>
            </div>
        </motion.div>
    );
};

// ============================================
// SESSION STATS BAR
// ============================================
const SessionStatsBar: React.FC<{ stats: SessionStats }> = ({ stats }) => {
    const passRate = stats.scanned > 0
        ? Math.round((stats.passed / stats.scanned) * 100) : 0;

    return (
        <div className="vision-session-bar">
            <div className="session-stat">
                <span className="session-num">{stats.scanned}</span>
                <span className="session-lbl">Taranan</span>
            </div>
            <div className="session-divider" />
            <div className="session-stat pass">
                <span className="session-num">{stats.passed}</span>
                <span className="session-lbl">Kabul</span>
            </div>
            <div className="session-divider" />
            <div className="session-stat reject">
                <span className="session-num">{stats.rejected}</span>
                <span className="session-lbl">Fire</span>
            </div>
            <div className="session-divider" />
            <div className="session-stat defects">
                <span className="session-num">{stats.totalDefects}</span>
                <span className="session-lbl">Toplam Hata</span>
            </div>
            <div className="session-pass-rate" style={{
                '--rate-color': passRate >= 80 ? '#10b981' : passRate >= 60 ? '#f59e0b' : '#ef4444'
            } as React.CSSProperties}>
                <span className="rate-label">Geçiş Oranı</span>
                <span className="rate-value">{passRate}%</span>
            </div>
        </div>
    );
};

// ============================================
// SAMPLE NAVIGATOR COMPONENT
// ============================================
const SampleNavigator: React.FC<{
    samples: InspectionSample[];
    currentIndex: number;
    onNavigate: (index: number) => void;
}> = ({ samples, currentIndex, onNavigate }) => (
    <div className="sample-navigator">
        <button
            className="nav-btn prev"
            onClick={() => onNavigate(currentIndex - 1)}
            disabled={currentIndex === 0}
        >
            <ChevronLeft size={20} />
        </button>
        <div className="sample-indicators">
            {samples.map((sample, idx) => (
                <button
                    key={sample.id}
                    className={`sample-dot ${idx === currentIndex ? 'active' : ''} ${sample.expectedResult}`}
                    onClick={() => onNavigate(idx)}
                    title={sample.name}
                >
                    <Package size={14} />
                </button>
            ))}
        </div>
        <button
            className="nav-btn next"
            onClick={() => onNavigate(currentIndex + 1)}
            disabled={currentIndex === samples.length - 1}
        >
            <ChevronRight size={20} />
        </button>
        <span className="sample-counter">{currentIndex + 1} / {samples.length}</span>
    </div>
);

// ============================================
// MAIN COMPONENT
// ============================================
const QualityVisionModule: React.FC<QualityVisionModuleProps> = ({ onClose }) => {
    const [currentSampleIndex, setCurrentSampleIndex] = useState(0);
    const [threshold, setThreshold] = useState(0.5);
    const [isScanning, setIsScanning] = useState(true);
    const [scanComplete, setScanComplete] = useState(false);
    const [hoveredBox, setHoveredBox] = useState<number | null>(null);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [inferenceMs, setInferenceMs] = useState(0);
    const [sessionStats, setSessionStats] = useState<SessionStats>({
        scanned: 0, passed: 0, rejected: 0, totalDefects: 0
    });
    // Track which sample IDs have already been counted in session stats
    const countedSamples = useRef<Set<number>>(new Set());

    const currentSample = INSPECTION_SAMPLES[currentSampleIndex];
    const visibleDetections = scanComplete
        ? currentSample.detections.filter(d => d.confidence >= threshold)
        : [];
    const severityScore = scanComplete ? calcSeverityScore(currentSample.detections, threshold) : 0;

    const stats = {
        total: scanComplete ? currentSample.detections.length : 0,
        visible: visibleDetections.length,
        critical: visibleDetections.filter(d => d.type === 'critical').length,
        minor: visibleDetections.filter(d => d.type === 'minor').length,
        noise: visibleDetections.filter(d => d.type === 'noise').length,
    };

    const handleScanComplete = () => {
        // Fake realistic inference time 28–72ms
        setInferenceMs(28 + Math.floor(Math.random() * 45));
        setIsScanning(false);
        setScanComplete(true);

        // Update session stats once per unique sample
        if (!countedSamples.current.has(currentSample.id)) {
            countedSamples.current.add(currentSample.id);
            const hasCritical = currentSample.detections.some(d => d.confidence >= threshold && d.type === 'critical');
            const isPassed = !hasCritical;
            setSessionStats(prev => ({
                scanned: prev.scanned + 1,
                passed: isPassed ? prev.passed + 1 : prev.passed,
                rejected: !isPassed ? prev.rejected + 1 : prev.rejected,
                totalDefects: prev.totalDefects + currentSample.detections.filter(d => d.confidence >= threshold).length,
            }));
        }
    };

    const handleRescan = () => {
        setScanComplete(false);
        setIsScanning(true);
        setImageLoaded(prev => prev); // keep loaded
    };

    const handleNavigate = (index: number) => {
        if (index >= 0 && index < INSPECTION_SAMPLES.length) {
            setCurrentSampleIndex(index);
            setImageLoaded(false);
            setScanComplete(false);
            setIsScanning(true);
            setHoveredBox(null);
        }
    };

    useEffect(() => {
        setIsScanning(true);
        setScanComplete(false);
    }, [currentSampleIndex]);

    // Re-trigger scan when image loads if scan hasn't started yet
    useEffect(() => {
        if (imageLoaded && !scanComplete) {
            setIsScanning(true);
        }
    }, [imageLoaded]);

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="modal-content demo-modal vision-module"
                onClick={e => e.stopPropagation()}
                style={{ maxWidth: '1400px' }}
            >
                {/* Header */}
                <div className="modal-header">
                    <div>
                        <h2><Eye size={24} /> Kalite Kontrol AI</h2>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            Görüntü Analizi ve Defekt Tespiti
                        </div>
                    </div>
                    <div className="modal-header-right">
                        <div className="inference-badge">
                            <span className="pulse-dot" />
                            {isScanning ? 'Taranıyor...' : `Analiz Tamamlandı · ${inferenceMs}ms`}
                        </div>
                        <button onClick={onClose} className="close-btn">✕</button>
                    </div>
                </div>

                {/* Session Stats Bar */}
                <SessionStatsBar stats={sessionStats} />

                <div className="module-content vision-content">
                    {/* Left Panel - Image Container */}
                    <div className="vision-left-panel">
                        <SampleNavigator
                            samples={INSPECTION_SAMPLES}
                            currentIndex={currentSampleIndex}
                            onNavigate={handleNavigate}
                        />

                        <div className="vision-image-container">
                            {/* HUD Camera Frame */}
                            <div className="camera-frame-overlay">
                                <div className="hud-corner hud-top-left" />
                                <div className="hud-corner hud-top-right" />
                                <div className="hud-corner hud-bottom-left" />
                                <div className="hud-corner hud-bottom-right" />
                                <div className="frame-info-bar">
                                    <Camera size={12} style={{ opacity: 0.7 }} />
                                    <span className="frame-label">CAM-01 | {currentSample.name}</span>
                                    <span className="frame-live-dot" />
                                </div>
                            </div>

                            {/* Main image */}
                            <img
                                key={currentSample.id}
                                src={currentSample.imageUrl}
                                alt="Inspection Target"
                                className="vision-image"
                                onLoad={() => setImageLoaded(true)}
                                onError={(e) => {
                                    // Fallback: show a dark placeholder if image fails
                                    (e.target as HTMLImageElement).style.display = 'none';
                                    setImageLoaded(true);
                                }}
                            />

                            {/* Scan animation */}
                            {isScanning && imageLoaded && (
                                <ScanAnimation onComplete={handleScanComplete} />
                            )}

                            {/* Bounding boxes */}
                            <AnimatePresence>
                                {scanComplete && visibleDetections.map(detection => (
                                    <BoundingBox
                                        key={detection.id}
                                        detection={detection}
                                        isHovered={hoveredBox === detection.id}
                                        onHover={setHoveredBox}
                                    />
                                ))}
                            </AnimatePresence>

                            {/* No defects overlay */}
                            {scanComplete && currentSample.detections.length === 0 && (
                                <motion.div
                                    className="no-defects-overlay"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                >
                                    <CheckCircle2 size={48} />
                                    <span>Hata Bulunamadı</span>
                                </motion.div>
                            )}

                            {/* Grid overlay */}
                            <div className="vision-grid-overlay" />
                        </div>

                        {/* Action buttons */}
                        <div className="vision-actions">
                            <button className="btn-vision secondary" onClick={handleRescan}>
                                <ScanLine size={16} />
                                Yeniden Tara
                            </button>
                            <button
                                className="btn-vision primary"
                                onClick={() => handleNavigate(currentSampleIndex + 1)}
                                disabled={currentSampleIndex >= INSPECTION_SAMPLES.length - 1}
                            >
                                Sonraki Parça
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Right Panel - Controls & Results */}
                    <div className="vision-right-panel">
                        {/* Threshold Control */}
                        <div className="vision-control-card">
                            <div className="control-header">
                                <Settings2 size={18} />
                                <h4>AI Güven Eşiği</h4>
                            </div>

                            {/* Preset Buttons */}
                            <div className="threshold-presets">
                                {THRESHOLD_PRESETS.map(preset => (
                                    <button
                                        key={preset.value}
                                        className={`preset-btn ${threshold === preset.value ? 'active' : ''}`}
                                        onClick={() => setThreshold(preset.value)}
                                        title={preset.description}
                                    >
                                        {preset.label}
                                    </button>
                                ))}
                            </div>

                            <div className="threshold-display">
                                <span className="threshold-value">{Math.round(threshold * 100)}%</span>
                                <span className="threshold-label">
                                    {threshold < 0.4 ? 'Hassas (Yüksek Duyarlılık)' :
                                        threshold < 0.7 ? 'Dengeli' : 'Kesin (Düşük Yanlış Pozitif)'}
                                </span>
                            </div>

                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={threshold * 100}
                                onChange={e => setThreshold(parseInt(e.target.value) / 100)}
                                className="vision-slider"
                            />

                            <div className="slider-labels">
                                <span>0% (Her şeyi yakala)</span>
                                <span>100% (Sadece kesinler)</span>
                            </div>

                            <div className="threshold-explanation">
                                <p><strong>Düşük eşik:</strong> Daha fazla tespit, daha fazla yanlış alarm</p>
                                <p><strong>Yüksek eşik:</strong> Daha az tespit, hatalar kaçabilir</p>
                            </div>
                        </div>

                        {/* Statistics */}
                        <div className="vision-stats-card">
                            <div className="stats-card-header">
                                <BarChart2 size={16} />
                                <h4>Tespit İstatistikleri</h4>
                            </div>
                            <div className="stats-grid">
                                <div className="stat-item">
                                    <span className="stat-value">{stats.visible}/{stats.total}</span>
                                    <span className="stat-label">Görünen Tespit</span>
                                </div>
                                <div className="stat-item critical">
                                    <span className="stat-value">{stats.critical}</span>
                                    <span className="stat-label">Kritik</span>
                                </div>
                                <div className="stat-item minor">
                                    <span className="stat-value">{stats.minor}</span>
                                    <span className="stat-label">Minör</span>
                                </div>
                                <div className="stat-item noise">
                                    <span className="stat-value">{stats.noise}</span>
                                    <span className="stat-label">Gürültü</span>
                                </div>
                            </div>

                            {/* Severity Score */}
                            <SeverityGauge score={severityScore} />
                        </div>

                        {/* Verdict Panel */}
                        <AnimatePresence>
                            {scanComplete && (
                                <VerdictPanel
                                    visibleDetections={visibleDetections}
                                    threshold={threshold}
                                    sample={currentSample}
                                    inferenceMs={inferenceMs}
                                />
                            )}
                        </AnimatePresence>

                        {/* Detection List */}
                        <div className="vision-detections-card">
                            <h4>Tespit Listesi</h4>
                            {!scanComplete ? (
                                <div className="no-detections-message">
                                    <ScanLine size={24} style={{ opacity: 0.5 }} />
                                    <p style={{ opacity: 0.5 }}>Tarama bekleniyor...</p>
                                </div>
                            ) : currentSample.detections.length === 0 ? (
                                <div className="no-detections-message">
                                    <CheckCircle2 size={24} />
                                    <p>Bu parçada hata tespit edilmedi</p>
                                </div>
                            ) : (
                                <div className="detections-list">
                                    {currentSample.detections.map(detection => {
                                        const isVisible = detection.confidence >= threshold;
                                        const color = getDetectionColor(detection.type);
                                        return (
                                            <div
                                                key={detection.id}
                                                className={`detection-item ${detection.type} ${isVisible ? 'visible' : 'filtered'}`}
                                                onMouseEnter={() => isVisible && setHoveredBox(detection.id)}
                                                onMouseLeave={() => setHoveredBox(null)}
                                            >
                                                <div className="detection-color" style={{ background: color }} />
                                                <div className="detection-info">
                                                    <div className="detection-top-row">
                                                        <span className="detection-label">{detection.label}</span>
                                                        <span className={`detection-status ${isVisible ? 'active' : 'inactive'}`}>
                                                            {isVisible ? '● Görünür' : '○ Filtrelendi'}
                                                        </span>
                                                    </div>
                                                    {/* Confidence bar */}
                                                    <div className="detection-conf-row">
                                                        <div className="detection-conf-bar-bg">
                                                            <div
                                                                className="detection-conf-bar-fill"
                                                                style={{
                                                                    width: `${detection.confidence * 100}%`,
                                                                    background: color,
                                                                    opacity: isVisible ? 1 : 0.35,
                                                                }}
                                                            />
                                                        </div>
                                                        <span className="detection-conf">{Math.round(detection.confidence * 100)}%</span>
                                                    </div>
                                                    {detection.area && (
                                                        <span className="detection-area">{detection.area} · {getTypeLabel(detection.type)}</span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QualityVisionModule;
