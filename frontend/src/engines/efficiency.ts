/**
 * Production Efficiency Engine
 * Pure TypeScript implementation of Queue Theory simulation
 * Demonstrates bottleneck analysis in a 3-stage production line
 */

export interface Station {
    id: string;
    name: string;
    speed: number;          // 0-100 (processing rate per tick)
    bufferIn: number;       // Items waiting in input queue
    bufferCapacity: number; // Max buffer size
    processed: number;      // Total items processed
}

export interface ProductionLineState {
    stations: Station[];
    totalProduced: number;
    tickCount: number;
}

/**
 * Creates initial production line with 3 stations
 */
export function createInitialState(): ProductionLineState {
    return {
        stations: [
            {
                id: 'cutting',
                name: 'Kesim',
                speed: 70,
                bufferIn: 0,
                bufferCapacity: 50,
                processed: 0,
            },
            {
                id: 'assembly',
                name: 'Montaj',
                speed: 70,
                bufferIn: 0,
                bufferCapacity: 50,
                processed: 0,
            },
            {
                id: 'packing',
                name: 'Paketleme',
                speed: 70,
                bufferIn: 0,
                bufferCapacity: 50,
                processed: 0,
            },
        ],
        totalProduced: 0,
        tickCount: 0,
    };
}

/**
 * Simulates one tick of the production line
 * Queue Theory: If upstream station is faster than downstream, buffer grows
 * 
 * @param state Current production line state
 * @returns New state after processing one tick
 */
export function processTick(state: ProductionLineState): ProductionLineState {
    const { stations, totalProduced, tickCount } = state;

    // Clone stations to maintain immutability
    const newStations = stations.map(s => ({ ...s }));

    // Process from last station to first (pull-based flow)
    for (let i = newStations.length - 1; i >= 0; i--) {
        const station = newStations[i];

        // Calculate items to process this tick (speed / 10 gives reasonable numbers)
        const processingCapacity = Math.floor(station.speed / 10);

        if (i === 0) {
            // First station: always has raw materials available (infinite supply)
            const itemsToProcess = processingCapacity;
            station.processed += itemsToProcess;

            // Push processed items to next station's buffer
            if (i < newStations.length - 1) {
                const nextStation = newStations[i + 1];
                nextStation.bufferIn = Math.min(
                    nextStation.bufferIn + itemsToProcess,
                    nextStation.bufferCapacity
                );
            }
        } else {
            // Subsequent stations: process from buffer
            const itemsAvailable = station.bufferIn;
            const itemsToProcess = Math.min(processingCapacity, itemsAvailable);

            station.bufferIn -= itemsToProcess;
            station.processed += itemsToProcess;

            // Push to next station or count as finished product
            if (i < newStations.length - 1) {
                const nextStation = newStations[i + 1];
                nextStation.bufferIn = Math.min(
                    nextStation.bufferIn + itemsToProcess,
                    nextStation.bufferCapacity
                );
            }
        }
    }

    // Count finished products from last station
    const lastStation = newStations[newStations.length - 1];
    const newTotalProduced = totalProduced + Math.floor(lastStation.speed / 10);

    return {
        stations: newStations,
        totalProduced: newTotalProduced,
        tickCount: tickCount + 1,
    };
}

/**
 * Updates a single station's speed
 */
export function updateStationSpeed(
    state: ProductionLineState,
    stationId: string,
    newSpeed: number
): ProductionLineState {
    return {
        ...state,
        stations: state.stations.map(s =>
            s.id === stationId ? { ...s, speed: Math.max(0, Math.min(100, newSpeed)) } : s
        ),
    };
}

/**
 * Auto-optimize: Balance all stations to a uniform speed
 * This clears bottlenecks by ensuring no station is faster than others
 */
export function autoOptimize(state: ProductionLineState): ProductionLineState {
    // Set all to 80% (balanced, efficient throughput)
    const balancedSpeed = 80;

    return {
        ...state,
        stations: state.stations.map(s => ({
            ...s,
            speed: balancedSpeed,
            bufferIn: 0, // Clear buffers when optimizing
        })),
    };
}

/**
 * Get buffer fill percentage
 */
export function getBufferPercentage(station: Station): number {
    return (station.bufferIn / station.bufferCapacity) * 100;
}

/**
 * Check if buffer is in critical state (>80% capacity)
 */
export function isBufferCritical(station: Station): boolean {
    return getBufferPercentage(station) > 80;
}

/**
 * Get the bottleneck station (slowest one causing upstream buffers to fill)
 */
export function findBottleneck(stations: Station[]): Station | null {
    let minSpeed = Infinity;
    let bottleneck: Station | null = null;

    for (const station of stations) {
        if (station.speed < minSpeed) {
            minSpeed = station.speed;
            bottleneck = station;
        }
    }

    return bottleneck;
}

/**
 * Check if a station is starved (waiting for material from upstream)
 * A station is starved if its buffer is empty and it's not the first station
 */
export function isStarved(station: Station, stationIndex: number): boolean {
    // First station has infinite supply, never starved
    if (stationIndex === 0) return false;
    // Starved if buffer is empty (no material to process)
    return station.bufferIn === 0;
}

/**
 * Calculate OEE (Overall Equipment Effectiveness) percentage
 * Simplified calculation based on station speeds and buffer states
 * OEE = Availability × Performance × Quality
 * For simulation: we use average speed as performance, and buffer efficiency as availability
 */
export function calculateOEE(stations: Station[]): number {
    if (stations.length === 0) return 0;

    // Performance: average of all station speeds
    const avgSpeed = stations.reduce((sum, s) => sum + s.speed, 0) / stations.length;
    const performance = avgSpeed / 100;

    // Availability: based on buffer health (not starved, not overflowing)
    let availabilityScore = 0;
    for (let i = 0; i < stations.length; i++) {
        const station = stations[i];
        const bufferPercent = getBufferPercentage(station);

        // Station is fully available if buffer is in healthy range (20-80%)
        if (i === 0) {
            availabilityScore += 1; // First station always available
        } else if (bufferPercent > 10 && bufferPercent < 80) {
            availabilityScore += 1;
        } else if (bufferPercent <= 10) {
            availabilityScore += 0.5; // Partially available (starving risk)
        } else {
            availabilityScore += 0.7; // Partially available (congestion risk)
        }
    }
    const availability = availabilityScore / stations.length;

    // Quality: assume 98% for simulation (fixed)
    const quality = 0.98;

    return Math.round(availability * performance * quality * 100);
}

/**
 * Convert speed percentage to cycle time in seconds
 * Higher speed = lower cycle time
 * At 100% speed: 10 seconds cycle time (baseline)
 * At 50% speed: 20 seconds cycle time
 */
export function getCycleTime(speed: number): number {
    if (speed <= 0) return 999;
    return Math.round((1000 / speed) * 10) / 10; // e.g., 80% speed = 12.5 seconds
}

/**
 * Format tick count as shift time (HH:MM:SS)
 * Each tick represents 0.5 seconds of simulation time
 */
export function formatShiftTime(tickCount: number): string {
    const totalSeconds = Math.floor(tickCount * 0.5);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Get buffer status for color coding
 * Returns: 'low' (<50%), 'medium' (50-80%), 'critical' (>80%)
 */
export function getBufferStatus(station: Station): 'low' | 'medium' | 'critical' {
    const percent = getBufferPercentage(station);
    if (percent < 50) return 'low';
    if (percent < 80) return 'medium';
    return 'critical';
}

/**
 * Generate AI recommendation based on current production line state
 */
export function getAIRecommendation(state: ProductionLineState): string {
    const { stations } = state;
    const bottleneck = findBottleneck(stations);

    if (!bottleneck) {
        return 'Üretim hattı dengeli çalışıyor. Mevcut ayarlar optimal.';
    }

    // Find stations with high buffer (upstream congestion)
    const congestedBuffers: string[] = [];
    const starvedStations: string[] = [];

    for (let i = 1; i < stations.length; i++) {
        const station = stations[i];
        const bufferPercent = getBufferPercentage(station);

        if (bufferPercent > 70) {
            congestedBuffers.push(station.name);
        }
        if (isStarved(station, i)) {
            starvedStations.push(station.name);
        }
    }

    // Generate recommendation
    if (congestedBuffers.length > 0) {
        const upstreamIndex = stations.findIndex(s => s.id === bottleneck.id) - 1;
        const upstreamStation = upstreamIndex >= 0 ? stations[upstreamIndex] : null;

        if (upstreamStation) {
            const speedDiff = upstreamStation.speed - bottleneck.speed;
            return `Analiz: ${bottleneck.name} istasyonu %${bottleneck.speed} kapasiteyle darboğaz yaratıyor. ` +
                `Öneri: ${upstreamStation.name} hızını %${Math.round(speedDiff / 2)} düşürerek ara stok maliyetini azaltın.`;
        }
    }

    if (starvedStations.length > 0) {
        return `Analiz: ${starvedStations.join(', ')} istasyonları malzeme bekliyor. ` +
            `Öneri: Önceki istasyonların hızını artırın veya darboğazı giderin.`;
    }

    // Default recommendation
    const avgSpeed = stations.reduce((sum, s) => sum + s.speed, 0) / stations.length;
    if (avgSpeed < 70) {
        return `Analiz: Ortalama hat hızı düşük (%${Math.round(avgSpeed)}). ` +
            `Öneri: Tüm istasyonları %80 hıza dengelemek için "Otomatik Optimize Et" butonunu kullanın.`;
    }

    return `Analiz: Hat dengeli ancak ${bottleneck.name} en yavaş istasyon. ` +
        `Öneri: Bu istasyonun hızını artırarak toplam verimi yükseltebilirsiniz.`;
}
