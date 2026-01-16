/**
 * API Client - Static Frontend Version
 * No backend required - uses local engines and mock data
 */

import { simulatePredictiveMaintenance as runSimulation } from '../engines/predictiveEngine';
import {
    predictiveMaintenanceData,
    oeeData,
    energyData,
    qualityData,
    planningData,
    anomalyData,
    copilotData,
    getCopilotResponse
} from '../engines/mockData';

// Simulate network delay for realistic UX
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function fetchPredictiveMaintenance() {
    await delay(100);
    return predictiveMaintenanceData;
}

export async function fetchOEE() {
    await delay(100);
    return oeeData;
}

export async function fetchEnergy() {
    await delay(100);
    return energyData;
}

export async function fetchQuality() {
    await delay(100);
    return qualityData;
}

export async function fetchPlanning() {
    await delay(100);
    return planningData;
}

export async function fetchAnomaly() {
    await delay(100);
    return anomalyData;
}

export async function fetchCopilot() {
    await delay(100);
    return copilotData;
}

export async function fetchROISummary() {
    await delay(100);
    return {
        total_savings: 65500,
        roi_percentage: 285,
        payback_months: 4.2
    };
}

// Predictive Maintenance Simulation - runs locally in browser
export function simulatePredictiveMaintenance(vibration: number, temperature: number, rpm: number) {
    return runSimulation(vibration, temperature, rpm);
}

// Chat function - uses scenario-based responses
export async function sendChatMessage(message: string, _conversationHistory: Array<{ role: string, content: string }> = []) {
    // Simulate AI "thinking" time
    await delay(800 + Math.random() * 700);

    return {
        response: getCopilotResponse(message),
        timestamp: new Date().toISOString()
    };
}
