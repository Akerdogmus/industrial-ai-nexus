/**
 * Anomaly Detection Engine
 * Implements signal generation and anomaly detection for industrial sensor monitoring
 * Demonstrates unsupervised learning concept with Z-Score based detection
 */

// Noise types for signal sabotage
export type NoiseType = 'none' | 'random' | 'spike' | 'flat';

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
const SIGNAL_AMPLITUDE = 10;
const ANOMALY_THRESHOLD = 11; // Values outside +-11 are anomalies
const FLATLINE_THRESHOLD = 0.1; // Flatline detection threshold

// Rolling statistics for Z-Score calculation
let recentValues: number[] = [];
const WINDOW_SIZE = 50;

/**
 * Calculate mean of an array
 */
function calculateMean(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/**
 * Calculate standard deviation of an array
 */
function calculateStdDev(values: number[], mean: number): number {
    if (values.length === 0) return 1;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    return Math.sqrt(squaredDiffs.reduce((sum, v) => sum + v, 0) / values.length) || 1;
}

/**
 * Generate a signal data point with optional sabotage
 */
export function generateSignal(noiseType: NoiseType): SignalDataPoint {
    time += 0.1;

    // Base sine wave
    let value = Math.sin(time) * SIGNAL_AMPLITUDE;
    let isAnomaly = false;
    let anomalyScore = 0;

    // Apply sabotage based on noise type
    switch (noiseType) {
        case 'random':
            // Add random jitter noise
            value += (Math.random() - 0.5) * 8;
            break;
        case 'spike':
            // Sudden spike - add large value
            value += 15 + Math.random() * 10;
            break;
        case 'flat':
            // Flatline - sensor freeze simulation
            value = 0;
            break;
        case 'none':
        default:
            // Normal operation - just tiny natural variation
            value += (Math.random() - 0.5) * 0.3;
            break;
    }

    // Calculate Z-Score for anomaly detection based on history
    // We calculate stats BEFORE adding the new value to prevent the anomaly 
    // from corrupting the "normal" baseline immediately
    const mean = calculateMean(recentValues);
    const stdDev = calculateStdDev(recentValues, mean);

    // Default to 0 if history is empty
    const zScore = stdDev === 0 ? 0 : Math.abs((value - mean) / stdDev);

    // Anomaly detection logic
    // 1. Value outside normal sine range
    // 2. Flatline detection (unexpected constant value)
    // 3. High Z-Score (statistical outlier)
    const outsideRange = Math.abs(value) > ANOMALY_THRESHOLD;
    const isFlatline = noiseType === 'flat' && Math.abs(value) < FLATLINE_THRESHOLD;
    const highZScore = zScore > 2.5;

    isAnomaly = outsideRange || isFlatline || (noiseType !== 'none' && highZScore);

    // Anomaly score: normalized measure of deviation (0-1 scale capped at 1)
    if (outsideRange) {
        anomalyScore = Math.min(1, (Math.abs(value) - ANOMALY_THRESHOLD) / 10);
    } else if (isFlatline) {
        anomalyScore = 0.98;
    } else if (highZScore) {
        anomalyScore = Math.min(1, zScore / 5);
    } else {
        anomalyScore = Math.min(0.15, zScore / 10);
    }

    // Only update rolling window if the value is NOT an anomaly
    // This prevents the model from "learning" that the sabotage is normal (which causes flickering)
    // However, we allow small deviations to update the model to handle drift
    if (!isAnomaly) {
        recentValues.push(value);
        if (recentValues.length > WINDOW_SIZE) {
            recentValues.shift();
        }
    }

    return {
        time,
        value,
        isAnomaly,
        anomalyScore
    };
}

/**
 * Generate cluster point for scatter plot visualization
 * Normal points cluster near origin, anomalies scatter far
 */
export function generateClusterPoint(signal: SignalDataPoint): ClusterPoint {
    if (signal.isAnomaly) {
        // Anomaly: scatter far from center
        const angle = Math.random() * Math.PI * 2;
        const distance = 3 + Math.random() * 2;
        return {
            x: Math.cos(angle) * distance,
            y: Math.sin(angle) * distance,
            isAnomaly: true
        };
    } else {
        // Normal: cluster near center
        return {
            x: (Math.random() - 0.5) * 1.5,
            y: (Math.random() - 0.5) * 1.5,
            isAnomaly: false
        };
    }
}

/**
 * Get detection message based on noise type and anomaly state
 */
export function getDetectionMessage(noiseType: NoiseType, isAnomaly: boolean, anomalyScore: number): string {
    if (!isAnomaly) {
        return 'Sinyal Normal. Tüm parametreler beklenen aralıkta.';
    }

    switch (noiseType) {
        case 'random':
            return `Bilinmeyen Desen Tespit Edildi! (Tür: Rastgele Parazit - Skor: ${anomalyScore.toFixed(2)})`;
        case 'spike':
            return `Bilinmeyen Desen Tespit Edildi! (Tür: Ani Sinyal Sıçraması - Skor: ${anomalyScore.toFixed(2)})`;
        case 'flat':
            return `Bilinmeyen Desen Tespit Edildi! (Tür: Sinyal Kaybı/Donma - Skor: ${anomalyScore.toFixed(2)})`;
        default:
            return `Anomali Tespit Edildi! (Skor: ${anomalyScore.toFixed(2)})`;
    }
}

/**
 * Calculate confidence score (inverse of anomaly score for normal state)
 */
export function calculateConfidence(anomalyScore: number): number {
    return Math.round((1 - anomalyScore) * 100);
}

/**
 * Reset engine state (for component remounting)
 */
export function resetEngine(): void {
    time = 0;
    recentValues = [];
}

/**
 * Create initial cluster data with normal distribution
 */
export function createInitialClusterData(count: number = 30): ClusterPoint[] {
    const clusters: ClusterPoint[] = [];
    for (let i = 0; i < count; i++) {
        clusters.push({
            x: (Math.random() - 0.5) * 2,
            y: (Math.random() - 0.5) * 2,
            isAnomaly: false
        });
    }
    return clusters;
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

        oscillator.frequency.value = 800; // Frequency in Hz
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
    } catch (error) {
        // Audio not supported or blocked
        console.log('Audio playback not available');
    }
}
