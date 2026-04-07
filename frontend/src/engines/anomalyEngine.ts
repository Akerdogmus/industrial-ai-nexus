/**
 * Anomaly Detection Engine
 * Implements signal generation and anomaly detection for industrial sensor monitoring
 * Demonstrates unsupervised learning concept with Z-Score based detection
 */

// Noise types for signal sabotage
export type NoiseType = 'none' | 'random' | 'spike' | 'flat';

// Sensor types
export type SensorType = 'pressure' | 'temperature' | 'vibration';

// Per-sensor configuration
export interface SensorConfig {
    id: SensorType;
    label: string;
    shortLabel: string;
    unit: string;
    color: string;
    amplitude: number;
    timeMultiplier: number;
    baselineOffset: number;
    anomalyThreshold: number;
    yDomain: [number, number];
    noiseMultiplier: number;
    normalNoiseAmp: number;
}

export const SENSOR_CONFIGS: Record<SensorType, SensorConfig> = {
    pressure: {
        id: 'pressure',
        label: 'Basınç Sensörü',
        shortLabel: 'Basınç',
        unit: 'MPa',
        color: '#00ff00',
        amplitude: 10,
        timeMultiplier: 1,
        baselineOffset: 0,
        anomalyThreshold: 11,
        yDomain: [-25, 35],
        noiseMultiplier: 1,
        normalNoiseAmp: 0.3,
    },
    temperature: {
        id: 'temperature',
        label: 'Sıcaklık Sensörü',
        shortLabel: 'Sıcaklık',
        unit: '°C',
        color: '#f97316',
        amplitude: 4,
        timeMultiplier: 0.25,
        baselineOffset: 65,
        anomalyThreshold: 7,
        yDomain: [48, 88],
        noiseMultiplier: 0.6,
        normalNoiseAmp: 0.15,
    },
    vibration: {
        id: 'vibration',
        label: 'Titreşim Sensörü',
        shortLabel: 'Titreşim',
        unit: 'mm/s',
        color: '#06b6d4',
        amplitude: 2.5,
        timeMultiplier: 4,
        baselineOffset: 0,
        anomalyThreshold: 4,
        yDomain: [-12, 12],
        noiseMultiplier: 2,
        normalNoiseAmp: 0.5,
    },
};

// Data point structure for signal chart
export interface SignalDataPoint {
    time: number;
    value: number;
    isAnomaly: boolean;
    anomalyScore: number;
}

// Cluster point for scatter plot visualization
export interface ClusterPoint {
    x: number;
    y: number;
    isAnomaly: boolean;
    id: number;
}

// Detection result with all metrics
export interface DetectionResult {
    signal: SignalDataPoint;
    cluster: ClusterPoint;
    status: 'normal' | 'anomaly';
    message: string;
    confidence: number;
}

// Module state
let time = 0;
let clusterPointId = 0;
const FLATLINE_THRESHOLD = 0.1;

// Rolling statistics for Z-Score calculation
let recentValues: number[] = [];
const WINDOW_SIZE = 50;

function calculateMean(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function calculateStdDev(values: number[], mean: number): number {
    if (values.length === 0) return 1;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    return Math.sqrt(squaredDiffs.reduce((sum, v) => sum + v, 0) / values.length) || 1;
}

/**
 * Generate a signal data point with optional sabotage, adapted to the active sensor
 */
export function generateSignal(noiseType: NoiseType, sensorType: SensorType = 'pressure'): SignalDataPoint {
    const cfg = SENSOR_CONFIGS[sensorType];
    time += 0.1;

    // Base signal: sine wave adapted to sensor characteristics
    let value = Math.sin(time * cfg.timeMultiplier) * cfg.amplitude + cfg.baselineOffset;

    // Apply sabotage
    switch (noiseType) {
        case 'random':
            value += (Math.random() - 0.5) * 8 * cfg.noiseMultiplier;
            break;
        case 'spike':
            value += (15 + Math.random() * 10) * (cfg.noiseMultiplier * 0.75);
            break;
        case 'flat':
            value = cfg.baselineOffset; // flatline at baseline
            break;
        case 'none':
        default:
            value += (Math.random() - 0.5) * cfg.normalNoiseAmp;
            break;
    }

    // Z-Score based detection
    const mean = calculateMean(recentValues);
    const stdDev = calculateStdDev(recentValues, mean);
    const zScore = stdDev === 0 ? 0 : Math.abs((value - mean) / stdDev);

    const deviation = Math.abs(value - cfg.baselineOffset);
    const outsideRange = deviation > cfg.anomalyThreshold;
    const isFlatline = noiseType === 'flat' && Math.abs(value - cfg.baselineOffset) < FLATLINE_THRESHOLD;
    const highZScore = zScore > 2.5;

    const isAnomaly = outsideRange || isFlatline || (noiseType !== 'none' && highZScore);

    let anomalyScore = 0;
    if (outsideRange) {
        anomalyScore = Math.min(1, (deviation - cfg.anomalyThreshold) / 10);
    } else if (isFlatline) {
        anomalyScore = 0.98;
    } else if (highZScore) {
        anomalyScore = Math.min(1, zScore / 5);
    } else {
        anomalyScore = Math.min(0.15, zScore / 10);
    }

    if (!isAnomaly) {
        recentValues.push(value);
        if (recentValues.length > WINDOW_SIZE) recentValues.shift();
    }

    return { time, value, isAnomaly, anomalyScore };
}

/**
 * Generate cluster point — anomalies spring outward with a stable ID
 */
export function generateClusterPoint(signal: SignalDataPoint): ClusterPoint {
    const id = clusterPointId++;
    if (signal.isAnomaly) {
        const angle = Math.random() * Math.PI * 2;
        const distance = 3 + Math.random() * 2.5;
        return {
            x: Math.cos(angle) * distance,
            y: Math.sin(angle) * distance,
            isAnomaly: true,
            id,
        };
    }
    return {
        x: (Math.random() - 0.5) * 1.5,
        y: (Math.random() - 0.5) * 1.5,
        isAnomaly: false,
        id,
    };
}

/**
 * Get detection message based on noise type and anomaly state
 */
export function getDetectionMessage(noiseType: NoiseType, isAnomaly: boolean, anomalyScore: number): string {
    if (!isAnomaly) return 'Sinyal Normal. Tüm parametreler beklenen aralıkta.';
    switch (noiseType) {
        case 'random': return `Bilinmeyen Desen Tespit Edildi! (Tür: Rastgele Parazit — Skor: ${anomalyScore.toFixed(2)})`;
        case 'spike': return `Bilinmeyen Desen Tespit Edildi! (Tür: Ani Sinyal Sıçraması — Skor: ${anomalyScore.toFixed(2)})`;
        case 'flat': return `Bilinmeyen Desen Tespit Edildi! (Tür: Sinyal Kaybı/Donma — Skor: ${anomalyScore.toFixed(2)})`;
        default: return `Anomali Tespit Edildi! (Skor: ${anomalyScore.toFixed(2)})`;
    }
}

export function calculateConfidence(anomalyScore: number): number {
    return Math.round((1 - anomalyScore) * 100);
}

export function resetEngine(): void {
    time = 0;
    recentValues = [];
}

export function createInitialClusterData(count: number = 30): ClusterPoint[] {
    return Array.from({ length: count }, () => ({
        x: (Math.random() - 0.5) * 2,
        y: (Math.random() - 0.5) * 2,
        isAnomaly: false,
        id: clusterPointId++,
    }));
}

/**
 * Play beep sound for anomaly alert (Web Audio API)
 */
export function playAlertBeep(): void {
    try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
    } catch {
        console.log('Audio playback not available');
    }
}
