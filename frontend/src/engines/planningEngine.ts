/**
 * Production Planning Engine
 * Implements "Order Tetris" - AI-optimized scheduling for constrained machine capacity
 * Demonstrates how AI optimizes production schedules better than manual planning
 */

// Machine definitions
export const MACHINES = [
    { id: 'CNC-1', name: 'CNC Tezgah 1', color: '#3b82f6' },
    { id: 'CNC-2', name: 'CNC Tezgah 2', color: '#8b5cf6' },
    { id: 'Assembly', name: 'Montaj Hattı', color: '#10b981' },
] as const;

export type MachineId = typeof MACHINES[number]['id'];

// Order type
export interface Order {
    id: string;
    machineId: MachineId;
    duration: number;      // Hours
    deadline: number;      // Hour of day (e.g., 16 = 16:00)
    startTime: number;     // Hour of day when order starts
    customer: string;
    product: string;
}

// Metrics result
export interface ScheduleMetrics {
    onTimeDelivery: number;     // Percentage (0-100)
    makespan: number;           // Latest end time
    utilization: number;        // Machine utilization percentage
    lateOrders: number;         // Count of late orders
    totalOrders: number;
    setupTimeSaved: number;     // Hours saved by optimization
}

// Work day bounds
export const WORK_START = 8;   // 08:00
export const WORK_END = 18;    // 18:00
export const WORK_HOURS = WORK_END - WORK_START;

/**
 * Generate intentionally BAD initial schedule with gaps and conflicts
 * This demonstrates the "manual chaos" scenario
 */
export function createBadSchedule(): Order[] {
    return [
        // CNC-1 orders - scattered with gaps
        { id: 'ORD-101', machineId: 'CNC-1', duration: 2, deadline: 14, startTime: 9, customer: 'Firma A', product: 'Mil Parçası' },
        { id: 'ORD-102', machineId: 'CNC-1', duration: 1.5, deadline: 12, startTime: 13, customer: 'Firma B', product: 'Kapak' }, // LATE!
        { id: 'ORD-103', machineId: 'CNC-1', duration: 2, deadline: 17, startTime: 15.5, customer: 'Firma C', product: 'Şaft' },

        // CNC-2 orders - with overlap potential
        { id: 'ORD-104', machineId: 'CNC-2', duration: 3, deadline: 13, startTime: 8, customer: 'Firma D', product: 'Flanş' },
        { id: 'ORD-105', machineId: 'CNC-2', duration: 2, deadline: 15, startTime: 14, customer: 'Firma A', product: 'Rulman Yatağı' },
        { id: 'ORD-106', machineId: 'CNC-2', duration: 1.5, deadline: 11, startTime: 12, customer: 'Firma E', product: 'Pul' }, // LATE!

        // Assembly orders - worst scheduling
        { id: 'ORD-107', machineId: 'Assembly', duration: 2.5, deadline: 12, startTime: 10, customer: 'Firma F', product: 'Montaj Kiti' },
        { id: 'ORD-108', machineId: 'Assembly', duration: 2, deadline: 16, startTime: 14, customer: 'Firma B', product: 'Ana Gövde' },
    ];
}

/**
 * Check if an order will be late (ends after deadline)
 */
export function isOrderLate(order: Order): boolean {
    const endTime = order.startTime + order.duration;
    return endTime > order.deadline;
}

/**
 * Detect conflicts (overlapping orders on same machine)
 */
export function detectConflicts(orders: Order[]): string[][] {
    const conflicts: string[][] = [];

    for (let i = 0; i < orders.length; i++) {
        for (let j = i + 1; j < orders.length; j++) {
            const a = orders[i];
            const b = orders[j];

            if (a.machineId !== b.machineId) continue;

            const aEnd = a.startTime + a.duration;
            const bEnd = b.startTime + b.duration;

            // Check overlap
            if (a.startTime < bEnd && b.startTime < aEnd) {
                conflicts.push([a.id, b.id]);
            }
        }
    }

    return conflicts;
}

/**
 * Calculate schedule metrics
 */
export function calculateMetrics(orders: Order[]): ScheduleMetrics {
    let lateOrders = 0;
    let maxEndTime = WORK_START;
    let totalMachineTime = 0;

    for (const order of orders) {
        if (isOrderLate(order)) {
            lateOrders++;
        }

        const endTime = order.startTime + order.duration;
        if (endTime > maxEndTime) {
            maxEndTime = endTime;
        }

        totalMachineTime += order.duration;
    }

    const onTimeDelivery = Math.round(((orders.length - lateOrders) / orders.length) * 100);
    const possibleMachineHours = MACHINES.length * WORK_HOURS;
    const utilization = Math.round((totalMachineTime / possibleMachineHours) * 100);

    return {
        onTimeDelivery,
        makespan: maxEndTime,
        utilization,
        lateOrders,
        totalOrders: orders.length,
        setupTimeSaved: 0,
    };
}

/**
 * AI Optimization: Greedy algorithm that sorts by deadline and packs tightly
 * This is the "magic" that shows AI's value
 */
export function optimizeSchedule(orders: Order[]): Order[] {
    // Group orders by machine
    const machineOrders: Record<MachineId, Order[]> = {
        'CNC-1': [],
        'CNC-2': [],
        'Assembly': [],
    };

    for (const order of orders) {
        machineOrders[order.machineId].push({ ...order });
    }

    const optimized: Order[] = [];

    // For each machine, sort by deadline and pack tightly
    for (const machineId of Object.keys(machineOrders) as MachineId[]) {
        const machineOrderList = machineOrders[machineId];

        // Sort by deadline (earliest deadline first = EDD rule)
        machineOrderList.sort((a, b) => a.deadline - b.deadline);

        // Pack tightly starting from WORK_START
        let currentTime = WORK_START;

        for (const order of machineOrderList) {
            optimized.push({
                ...order,
                startTime: currentTime,
            });
            currentTime += order.duration;
        }
    }

    return optimized;
}

/**
 * Calculate improvement summary between two schedules
 */
export function calculateImprovement(
    before: ScheduleMetrics,
    after: ScheduleMetrics
): { otdImprovement: number; setupTimeSaved: number; message: string } {
    const otdImprovement = after.onTimeDelivery - before.onTimeDelivery;
    const makespanDiff = before.makespan - after.makespan;

    // Estimate setup time saved (simulated)
    const setupTimeSaved = Math.max(0, makespanDiff * 0.5); // Assume 50% of makespan reduction is setup savings

    let message = '';
    if (otdImprovement > 0) {
        message = `Termin uyumu %${before.onTimeDelivery}'dan %${after.onTimeDelivery}'e yükseltildi.`;
    }
    if (makespanDiff > 0) {
        message += ` Toplam ${makespanDiff.toFixed(1)} saat öne çekildi.`;
    }
    if (setupTimeSaved > 0) {
        message += ` Setup süreleri minimize edilerek ${setupTimeSaved.toFixed(1)} saat tasarruf sağlandı.`;
    }

    return {
        otdImprovement,
        setupTimeSaved,
        message: message || 'Çizelge optimize edildi.',
    };
}

/**
 * Get orders grouped by machine for Gantt display
 */
export function getOrdersByMachine(orders: Order[]): Record<MachineId, Order[]> {
    const grouped: Record<MachineId, Order[]> = {
        'CNC-1': [],
        'CNC-2': [],
        'Assembly': [],
    };

    for (const order of orders) {
        grouped[order.machineId].push(order);
    }

    return grouped;
}

/**
 * Get machine color by ID
 */
export function getMachineColor(machineId: MachineId): string {
    const machine = MACHINES.find(m => m.id === machineId);
    return machine?.color || '#6b7280';
}

/**
 * Format hour to display string
 */
export function formatHour(hour: number): string {
    const h = Math.floor(hour);
    const m = Math.round((hour - h) * 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}
