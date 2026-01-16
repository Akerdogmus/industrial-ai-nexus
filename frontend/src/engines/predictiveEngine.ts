/**
 * Predictive Maintenance Engine
 * Pure TypeScript implementation of AI simulation logic
 * No backend required - runs entirely in browser
 */

export interface SimulationResult {
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

/**
 * Simulates an Autoencoder's Reconstruction Error logic with realistic physics.
 * Port of the Python backend logic to TypeScript.
 */
export function simulatePredictiveMaintenance(
    vibration: number,
    temperature: number,
    rpm: number
): SimulationResult {
    // ============================================
    // PHYSICS-BASED EXPECTED VALUES
    // ============================================

    // Expected vibration: Healthy motor vibration increases with RPM
    // At 1000 RPM: ~0.17 mm/s, at 3000 RPM: ~0.5 mm/s, at 6000 RPM: ~1.0 mm/s
    const expected_vibration = (rpm / 3000) * 0.5;

    // Expected temperature: Base 35°C + RPM effect + vibration-induced heat
    const base_temp = 35;
    const rpm_heat = (rpm / 1000) * 8;  // Each 1000 RPM adds ~8°C
    const vib_heat = vibration * 5;     // Each 1 mm/s vibration adds ~5°C
    const expected_temperature = base_temp + rpm_heat + vib_heat;

    // ============================================
    // ERROR CALCULATIONS
    // ============================================

    const vib_error = Math.abs(vibration - expected_vibration);
    const temp_error = Math.abs(temperature - expected_temperature) / 10;  // Normalize

    // ============================================
    // ANOMALY DETECTION
    // ============================================

    // Weighted anomaly score (Vibration 70%, Temperature 30%)
    let anomaly_score = (vib_error * 0.7) + (temp_error * 0.3);
    anomaly_score = Math.min(anomaly_score, 5.0);  // Clamp

    // AI Confidence: 100% when anomaly=0, drops as anomaly increases
    const ai_confidence = Math.max(0, 100 - (anomaly_score * 18));

    // ============================================
    // ROOT CAUSE ANALYSIS
    // ============================================

    const vib_contribution = (vib_error * 0.7) / Math.max(anomaly_score, 0.01) * 100;
    const temp_contribution = (temp_error * 0.3) / Math.max(anomaly_score, 0.01) * 100;
    const root_cause = vib_contribution > temp_contribution ? "Vibration" : "Temperature";

    // ============================================
    // REMAINING USEFUL LIFE (RUL)
    // ============================================

    const base_rul = 2000;  // Hours
    let current_rul: number;

    if (anomaly_score < 0.2) {
        current_rul = base_rul;
    } else if (anomaly_score < 0.5) {
        current_rul = Math.floor(base_rul * (1 - anomaly_score * 0.3));
    } else if (anomaly_score < 1.5) {
        const decay_factor = Math.exp(anomaly_score * 0.8);
        current_rul = Math.floor(base_rul / decay_factor);
    } else {
        const decay_factor = Math.exp(anomaly_score);
        current_rul = Math.max(1, Math.floor(base_rul / decay_factor));
    }

    return {
        expected_vibration: Math.round(expected_vibration * 1000) / 1000,
        actual_vibration: Math.round(vibration * 1000) / 1000,
        expected_temperature: Math.round(expected_temperature * 10) / 10,
        actual_temperature: Math.round(temperature * 10) / 10,
        actual_rpm: rpm,
        anomaly_score: Math.round(anomaly_score * 100) / 100,
        rul: current_rul,
        root_cause,
        ai_confidence: Math.round(ai_confidence * 10) / 10
    };
}
