import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, ScanLine, AlertTriangle, CheckCircle2, Camera, Settings2, Crosshair, ChevronLeft, ChevronRight, Package } from 'lucide-react';
import {
    INSPECTION_SAMPLES,
    getDetectionColor,
    getTypeLabel,
    type Detection,
    type InspectionSample
} from '../data/visionMockData';

interface QualityVisionModuleProps {
    onClose: () => void;
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
            {/* Corner brackets */}
            <div className="box-corner top-left" />
            <div className="box-corner top-right" />
            <div className="box-corner bottom-left" />
            <div className="box-corner bottom-right" />

            {/* Crosshair center */}
            <div className="box-crosshair">
                <Crosshair size={12} />
            </div>

            {/* Label */}
            <div className="box-label">
                <span className="label-text">{detection.label}</span>
                <span className="confidence-badge">{Math.round(detection.confidence * 100)}%</span>
            </div>

            {/* Hover tooltip */}
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
// SCAN ANIMATION COMPONENT
// ============================================
const ScanAnimation: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
    useEffect(() => {
        const timer = setTimeout(onComplete, 2000);
        return () => clearTimeout(timer);
    }, [onComplete]);

    return (
        <motion.div
            className="vision-scan-line"
            initial={{ left: '-5%' }}
            animate={{ left: '105%' }}
            transition={{ duration: 2, ease: 'linear' }}
        />
    );
};

// ============================================
// VERDICT PANEL COMPONENT
// ============================================
const VerdictPanel: React.FC<{
    visibleDetections: Detection[];
    threshold: number;
    sample: InspectionSample;
}> = ({ visibleDetections, sample }) => {
    const hasCritical = visibleDetections.some(d => d.type === 'critical');
    const hasMinor = visibleDetections.some(d => d.type === 'minor');
    const isPass = !hasCritical && sample.detections.length === 0 || (!hasCritical && visibleDetections.length === 0);
    const isCleanPart = sample.detections.length === 0;

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
                    {isCleanPart
                        ? 'Parça temiz. Hata tespit edilmedi.'
                        : hasCritical
                            ? `Kritik hata tespit edildi! Ürün reddedildi.`
                            : hasMinor
                                ? `Minör hatalar tespit edildi. Ürün kabul edilebilir.`
                                : visibleDetections.length === 0
                                    ? `Eşikte hata tespit edilmedi. Ürün temiz.`
                                    : `Sadece gürültü tespiti. Ürün kabul edildi.`
                    }
                </p>
            </div>
        </motion.div>
    );
};

// ============================================
// SAMPLE NAVIGATOR COMPONENT
// ============================================
const SampleNavigator: React.FC<{
    samples: InspectionSample[];
    currentIndex: number;
    onNavigate: (index: number) => void;
}> = ({ samples, currentIndex, onNavigate }) => {
    return (
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

            <span className="sample-counter">
                {currentIndex + 1} / {samples.length}
            </span>
        </div>
    );
};

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

    const currentSample = INSPECTION_SAMPLES[currentSampleIndex];

    // Filter detections by threshold
    const visibleDetections = currentSample.detections.filter(
        d => d.confidence >= threshold
    );

    // Calculate statistics
    const stats = {
        total: currentSample.detections.length,
        visible: visibleDetections.length,
        critical: visibleDetections.filter(d => d.type === 'critical').length,
        minor: visibleDetections.filter(d => d.type === 'minor').length,
        noise: visibleDetections.filter(d => d.type === 'noise').length,
    };

    const handleScanComplete = () => {
        setIsScanning(false);
        setScanComplete(true);
    };

    const handleRescan = () => {
        setScanComplete(false);
        setIsScanning(true);
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

    // Reset scan when sample changes
    useEffect(() => {
        setIsScanning(true);
        setScanComplete(false);
    }, [currentSampleIndex]);

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
                            <span className="pulse-dot"></span>
                            {isScanning ? 'Taranıyor...' : 'Analiz Tamamlandı'}
                        </div>
                        <button onClick={onClose} className="close-btn">✕</button>
                    </div>
                </div>

                <div className="module-content vision-content">
                    {/* Left Panel - Image Container */}
                    <div className="vision-left-panel">
                        {/* Sample Navigator */}
                        <SampleNavigator
                            samples={INSPECTION_SAMPLES}
                            currentIndex={currentSampleIndex}
                            onNavigate={handleNavigate}
                        />

                        <div className="vision-image-container">
                            {/* Camera frame effect */}
                            <div className="camera-frame-overlay">
                                <Camera size={16} className="corner-icon" />
                                <span className="frame-label">CAM-01 | {currentSample.name}</span>
                            </div>

                            {/* Main image */}
                            <img
                                key={currentSample.id}
                                src={currentSample.imageUrl}
                                alt="Inspection Target"
                                className="vision-image"
                                onLoad={() => setImageLoaded(true)}
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

                            <div className="threshold-display">
                                <span className="threshold-value">{Math.round(threshold * 100)}%</span>
                                <span className="threshold-label">
                                    {threshold < 0.4 ? 'Hassas (Yüksek Duyarlılık)' :
                                        threshold < 0.7 ? 'Dengeli' :
                                            'Kesin (Düşük Yanlış Pozitif)'}
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
                                <p>
                                    <strong>Düşük eşik:</strong> Daha fazla tespit, daha fazla yanlış alarm (fire artar)
                                </p>
                                <p>
                                    <strong>Yüksek eşik:</strong> Daha az tespit, hatalar kaçabilir (kalite riski)
                                </p>
                            </div>
                        </div>

                        {/* Statistics */}
                        <div className="vision-stats-card">
                            <h4>Tespit İstatistikleri</h4>
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
                        </div>

                        {/* Verdict Panel */}
                        {scanComplete && (
                            <VerdictPanel
                                visibleDetections={visibleDetections}
                                threshold={threshold}
                                sample={currentSample}
                            />
                        )}

                        {/* Detection List */}
                        <div className="vision-detections-card">
                            <h4>Tespit Listesi</h4>
                            {currentSample.detections.length === 0 ? (
                                <div className="no-detections-message">
                                    <CheckCircle2 size={24} />
                                    <p>Bu parçada hata tespit edilmedi</p>
                                </div>
                            ) : (
                                <div className="detections-list">
                                    {currentSample.detections.map(detection => {
                                        const isVisible = detection.confidence >= threshold;
                                        return (
                                            <div
                                                key={detection.id}
                                                className={`detection-item ${detection.type} ${isVisible ? 'visible' : 'filtered'}`}
                                                onMouseEnter={() => isVisible && setHoveredBox(detection.id)}
                                                onMouseLeave={() => setHoveredBox(null)}
                                            >
                                                <div className="detection-color" style={{ background: getDetectionColor(detection.type) }} />
                                                <div className="detection-info">
                                                    <span className="detection-label">{detection.label}</span>
                                                    <span className="detection-conf">{Math.round(detection.confidence * 100)}% güven</span>
                                                </div>
                                                <span className={`detection-status ${isVisible ? 'active' : 'inactive'}`}>
                                                    {isVisible ? '● Görünür' : '○ Filtrelendi'}
                                                </span>
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
