/**
 * Energy Optimization Engine
 * Implements Smart Load Shifting for industrial furnace scheduling
 * Demonstrates how AI can reduce energy costs by moving consumption to off-peak hours
 */

// Electricity Tariff Rates (TL/kWh) - 24 hour pricing
export const TARIFF_RATES = [
    { hour: 0, rate: 1.5, zone: 'night' as const },
    { hour: 1, rate: 1.5, zone: 'night' as const },
    { hour: 2, rate: 1.5, zone: 'night' as const },
    { hour: 3, rate: 1.5, zone: 'night' as const },
    { hour: 4, rate: 1.8, zone: 'night' as const },
    { hour: 5, rate: 2.0, zone: 'night' as const },
    { hour: 6, rate: 3.5, zone: 'peak' as const },
    { hour: 7, rate: 4.0, zone: 'peak' as const },
    { hour: 8, rate: 4.5, zone: 'peak' as const },
    { hour: 9, rate: 5.0, zone: 'peak' as const },
    { hour: 10, rate: 5.0, zone: 'peak' as const },
    { hour: 11, rate: 4.8, zone: 'peak' as const },
    { hour: 12, rate: 4.5, zone: 'peak' as const },
    { hour: 13, rate: 4.8, zone: 'peak' as const },
    { hour: 14, rate: 5.0, zone: 'peak' as const },
    { hour: 15, rate: 4.8, zone: 'peak' as const },
    { hour: 16, rate: 4.5, zone: 'peak' as const },
    { hour: 17, rate: 3.5, zone: 'evening' as const },
    { hour: 18, rate: 3.0, zone: 'evening' as const },
    { hour: 19, rate: 2.8, zone: 'evening' as const },
    { hour: 20, rate: 2.5, zone: 'evening' as const },
    { hour: 21, rate: 2.2, zone: 'evening' as const },
    { hour: 22, rate: 2.0, zone: 'evening' as const },
    { hour: 23, rate: 1.8, zone: 'night' as const },
];

export type TariffZone = 'night' | 'peak' | 'evening';

export interface EnergyState {
    startHour: number;          // When furnace starts heating (0-23)
    targetTemperature: number;  // Target temperature in °C (500-1200)
    heatingDuration: number;    // Hours needed to reach and maintain temp
    deadline: number;           // Production must complete by this hour
    isOptimized: boolean;       // Whether AI optimization has been applied
}

export interface ChartDataPoint {
    hour: string;
    tariffRate: number;
    tariffZone: TariffZone;
    consumption: number;
    isActive: boolean;
}

/**
 * Calculate heating duration based on target temperature
 * Higher temperature = longer heating time (thermal inertia)
 */
export function calculateHeatingDuration(targetTemp: number): number {
    // Base duration: 2 hours for 500°C, up to 5 hours for 1200°C
    const baseDuration = 2;
    const tempFactor = (targetTemp - 500) / 700; // 0 to 1 scale
    return Math.ceil(baseDuration + tempFactor * 3);
}

/**
 * Calculate power consumption based on target temperature
 * Returns kW consumption per hour
 */
export function calculatePowerConsumption(targetTemp: number): number {
    // Base: 100 kW at 500°C, up to 350 kW at 1200°C
    const basePower = 100;
    const tempFactor = (targetTemp - 500) / 700;
    return Math.round(basePower + tempFactor * 250);
}

/**
 * Calculate total cost for a given schedule
 */
export function calculateCost(startHour: number, duration: number, powerKW: number): number {
    let totalCost = 0;

    for (let i = 0; i < duration; i++) {
        const currentHour = (startHour + i) % 24;
        const rate = TARIFF_RATES[currentHour].rate;
        totalCost += powerKW * rate;
    }

    return Math.round(totalCost);
}

/**
 * AI Optimization: Find the optimal start hour that minimizes cost
 * while ensuring production completes before the deadline
 */
export function findOptimalStartHour(duration: number, deadline: number): number {
    let minCost = Infinity;
    let optimalStart = 0;

    // Search all possible start hours that allow completion before deadline
    for (let start = 0; start < 24; start++) {
        const endHour = (start + duration) % 24;

        // Check if this schedule respects the deadline
        // Handle wrap-around case (e.g., start at 22, end at 03)
        let respectsDeadline = false;
        if (start + duration <= 24) {
            // No wrap-around
            respectsDeadline = endHour <= deadline;
        } else {
            // Wrap-around case - production ends next day
            // Only valid if deadline is after midnight
            respectsDeadline = endHour <= deadline;
        }

        if (respectsDeadline || deadline === 24) {
            const cost = calculateCost(start, duration, 100); // Normalize to 100kW for comparison
            if (cost < minCost) {
                minCost = cost;
                optimalStart = start;
            }
        }
    }

    return optimalStart;
}

/**
 * Generate chart data for visualization
 */
export function generateChartData(
    startHour: number,
    duration: number,
    powerKW: number
): ChartDataPoint[] {
    return TARIFF_RATES.map((tariff) => {
        const isActive =
            startHour + duration <= 24
                ? tariff.hour >= startHour && tariff.hour < startHour + duration
                : tariff.hour >= startHour || tariff.hour < (startHour + duration) % 24;

        return {
            hour: `${tariff.hour.toString().padStart(2, '0')}:00`,
            tariffRate: tariff.rate,
            tariffZone: tariff.zone,
            consumption: isActive ? powerKW : 0,
            isActive,
        };
    });
}

/**
 * Calculate carbon footprint from energy consumption
 * Average grid emission factor: ~0.4 kg CO2 per kWh
 */
export function calculateCarbonFootprint(totalKWh: number): number {
    const emissionFactor = 0.4; // kg CO2 per kWh
    return Math.round(totalKWh * emissionFactor * 10) / 10;
}

/**
 * Get current simulated spot price (with small fluctuation)
 */
export function getCurrentSpotPrice(hour: number): number {
    const baseRate = TARIFF_RATES[hour].rate;
    const fluctuation = (Math.random() - 0.5) * 0.2;
    return Math.round((baseRate + fluctuation) * 100) / 100;
}

/**
 * Create initial state for the energy optimization module
 */
export function createInitialEnergyState(): EnergyState {
    return {
        startHour: 8,           // Default: starts with shift at 08:00
        targetTemperature: 850, // Default target temp
        heatingDuration: calculateHeatingDuration(850),
        deadline: 17,           // Default: must be ready by 17:00
        isOptimized: false,
    };
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('tr-TR', {
        style: 'decimal',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}
