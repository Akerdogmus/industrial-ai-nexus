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
 * Creates initial production line in a deliberately unoptimized state.
 *
 * Scenario: Kesim çok hızlı (95%) → Montaj dar boğaz (35%) → Paketleme aç kalıyor (88%)
 *   - Montaj tamponu dolmuş (70%) — upstream baskısı görünür
 *   - OEE ≈ 30 % (Düşük) — "Otomatik Optimize Et" ile 80 %'e çıkarmak dramatik etki yaratır
 */
export function createInitialState(): ProductionLineState {
    return {
        stations: [
            {
                id: 'cutting',
                name: 'Kesim',
                speed: 95,          // Çok hızlı → Montaj tamponunu dolduruyor
                bufferIn: 0,
                bufferCapacity: 50,
                processed: 0,
            },
            {
                id: 'assembly',
                name: 'Montaj',
                speed: 35,          // Darboğaz — tüm hattı kısıtlıyor
                bufferIn: 35,       // Tampon %70 dolu — görsel uyarı
                bufferCapacity: 50,
                processed: 0,
            },
            {
                id: 'packing',
                name: 'Paketleme',
                speed: 88,          // Hızlı ama malzeme gelmiyor → açlık
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

    // Track last station's processed count BEFORE this tick
    const lastStationPrevProcessed = stations[stations.length - 1].processed;

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

    // FIX: Count only items actually processed by last station this tick,
    // NOT its theoretical capacity (which over-counts when buffer is starved)
    const lastStation = newStations[newStations.length - 1];
    const producedThisTick = lastStation.processed - lastStationPrevProcessed;
    const newTotalProduced = totalProduced + producedThisTick;

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
 * Auto-optimize: Set each station to the OEE-optimal speed band (85 %).
 *
 * Why 85 %?  OEE = Availability × Performance × Quality.
 * All three factors form a concave curve — peak is at ~85 % slider:
 *   - Below 85 %: Performance (throughput) is the limiting factor
 *   - Above 85 %: Availability and Quality degrade faster than Performance gains
 *
 * Upstream station runs 2 % faster → maintains a small healthy buffer
 * (~15-25 %) between stations, preventing starvation bursts without overflow.
 */
export function autoOptimize(state: ProductionLineState): ProductionLineState {
    const OPTIMAL_SPEED = 85;

    return {
        ...state,
        stations: state.stations.map((s, i) => ({
            ...s,
            // Upstream gets +2 % to pre-fill buffer; last station is the pace-setter
            speed: OPTIMAL_SPEED + (state.stations.length - 1 - i) * 2,
            bufferIn: 0,
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
 * OEE Breakdown — the three individual factors plus the composite score.
 */
export interface OEEBreakdown {
    oee: number;          // 0-100 integer
    availability: number; // 0-100 integer (%)
    performance: number;  // 0-100 integer (%)
    quality: number;      // 0-100 integer (%)
}

/**
 * Calculate OEE with a concave model — OEE peaks sharply at the 85 % sweet-spot.
 *
 * Demo calibration targets:
 *   85 % (auto-optimize) → OEE ≈ 80 %  "Dünya Sınıfı"  ✓ impressive result
 *   80 % (balanced)      → OEE ≈ 76 %  "İyi"
 *   100 % (all max)      → OEE ≈ 43 %  "Düşük"          ✗ clear problem shown
 *
 * Why the concave curve?
 *   - Performance (P): throughput scales linearly with speed (bounded by bottleneck)
 *   - Availability (A): above 85 % machines overheat → parabolic breakdown increase
 *   - Quality (Q): above 85 % less inspection time → parabolic defect rate rise
 *   A × Q drops faster than P rises once you exceed 85 %, making OEE fall.
 *
 * OEE bands for this factory:
 *   ≥ 78 %  → Dünya Sınıfı  (≈ 83–90 % speed window)
 *   ≥ 63 %  → İyi
 *   ≥ 45 %  → Orta
 *   <  45 % → Düşük
 */
export function calculateOEEBreakdown(stations: Station[]): OEEBreakdown {
    if (stations.length === 0) return { oee: 0, availability: 0, performance: 0, quality: 0 };

    const minSpeedPct = Math.min(...stations.map(s => s.speed));
    const maxSpeedPct = Math.max(...stations.map(s => s.speed));
    const avgSpeedRatio = stations.reduce((sum, s) => sum + s.speed, 0) / stations.length / 100;
    const hasRealBottleneck = (maxSpeedPct - minSpeedPct) >= 15;

    // ── PERFORMANCE — Queue Theory: throughput = slowest station ─────────────
    const performancePct = Math.round(minSpeedPct);  // 1:1 with slider (no artificial ceiling)

    // ── AVAILABILITY — parabolic stress penalty above 85 % average speed ──────
    // Physical model: thermal expansion, bearing wear, unplanned stops spike above 85 %
    //   At avg = 85 %: A = 97 %   (peak — optimal band)
    //   At avg = 90 %: A ≈ 93 %   At avg = 95 %: A ≈ 81 %   At avg = 100 %: A ≈ 60 %
    const K_AVAIL = 16.4;
    const availStress = Math.max(0, avgSpeedRatio - 0.85);
    let availabilityRaw = Math.max(0.40, 0.97 - availStress * availStress * K_AVAIL);
    // Bottleneck: chronically starved downstream stations lose additional run-time
    if (hasRealBottleneck) {
        const bottleneckIdx = stations.findIndex(s => s.speed === minSpeedPct);
        for (let i = bottleneckIdx + 1; i < stations.length; i++) {
            if (getBufferPercentage(stations[i]) < 10) availabilityRaw -= 0.05;
        }
        availabilityRaw = Math.max(0.40, availabilityRaw);
    }
    const availabilityPct = Math.round(availabilityRaw * 100);

    // ── QUALITY — parabolic defect penalty above 85 % average speed ───────────
    // Physical model: faster cycle → less inspection time → more escaped defects
    //   At avg = 85 %: Q = 98 %   At avg = 90 %: Q ≈ 95 %   At avg = 100 %: Q ≈ 72 %
    const K_QUAL = 11.6;
    const qualStress = Math.max(0, avgSpeedRatio - 0.85);
    const qualityRaw = Math.max(0.70, 0.98 - qualStress * qualStress * K_QUAL);
    const qualityPct = Math.round(
        (hasRealBottleneck ? Math.max(0.70, qualityRaw - 0.015) : qualityRaw) * 100
    );

    const oee = Math.round(
        (availabilityPct / 100) * (performancePct / 100) * (qualityPct / 100) * 100
    );

    return { oee, availability: availabilityPct, performance: performancePct, quality: qualityPct };
}

/**
 * Calculate OEE (Overall Equipment Effectiveness) percentage
 */
export function calculateOEE(stations: Station[]): number {
    return calculateOEEBreakdown(stations).oee;
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

    // Balanced line — check if speed is in the optimal band
    const avgSpeed = stations.reduce((sum, s) => sum + s.speed, 0) / stations.length;
    const minSpd = Math.min(...stations.map(s => s.speed));
    const maxSpd = Math.max(...stations.map(s => s.speed));
    const isBalanced = (maxSpd - minSpd) < 15;

    if (isBalanced && avgSpeed > 87) {
        return `Analiz: Hat %${Math.round(avgSpeed)} hızda dengeli çalışıyor ancak makine stresi kritik seviyede. ` +
            `Öneri: Yüksek hız kalite kaybına ve planlanmamış duruşlara neden olur — optimal bant %83-87 arasındadır.`;
    }

    if (isBalanced && avgSpeed >= 82 && avgSpeed <= 87) {
        return `Analiz: Hat optimal hız bandında (%${Math.round(avgSpeed)}) dengeli çalışıyor. ` +
            `OEE maksimum seviyede — mevcut ayarlar dünya sınıfı performansı destekliyor.`;
    }

    if (avgSpeed < 70) {
        return `Analiz: Ortalama hat hızı düşük (%${Math.round(avgSpeed)}). ` +
            `Öneri: Optimal verimlilik için "Otomatik Optimize Et" butonu ile %85 bandına geçin.`;
    }

    return `Analiz: Hat dengeli (%${Math.round(avgSpeed)} ort.) ancak optimal %83-87 bandının dışında. ` +
        `Öneri: "Otomatik Optimize Et" ile OEE'yi maksimize edin.`;
}
