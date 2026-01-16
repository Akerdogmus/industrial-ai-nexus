import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrainCircuit, Clock, Target, Activity, AlertTriangle, CheckCircle2, Package } from 'lucide-react';
import {
    MACHINES,
    WORK_START,
    WORK_HOURS,
    createBadSchedule,
    optimizeSchedule,
    calculateMetrics,
    isOrderLate,
    getOrdersByMachine,
    getMachineColor,
    formatHour,
    calculateImprovement,
    type Order,
    type MachineId,
    type ScheduleMetrics,
} from '../engines/planningEngine';

interface ProductionPlanningModuleProps {
    onClose: () => void;
}

// Time slot labels for the Gantt chart
const TIME_SLOTS = Array.from({ length: WORK_HOURS + 1 }, (_, i) => WORK_START + i);

// Order Block Component with Framer Motion
const OrderBlock: React.FC<{
    order: Order;
    isLate: boolean;
    isOptimized: boolean;
}> = ({ order, isLate, isOptimized }) => {
    const machineColor = getMachineColor(order.machineId);
    const widthPercent = (order.duration / WORK_HOURS) * 100;
    const leftPercent = ((order.startTime - WORK_START) / WORK_HOURS) * 100;

    return (
        <motion.div
            layout
            layoutId={order.id}
            className={`order-block ${isLate ? 'late' : ''} ${isOptimized ? 'optimized' : ''}`}
            style={{
                left: `${leftPercent}%`,
                width: `${widthPercent}%`,
                '--order-color': machineColor,
            } as React.CSSProperties}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
                layout: { type: 'spring', stiffness: 300, damping: 30 },
                opacity: { duration: 0.3 },
            }}
        >
            <div className="order-block-content">
                <span className="order-id">{order.id}</span>
                <span className="order-product">{order.product}</span>
            </div>
            <div className="order-time-range">
                {formatHour(order.startTime)} - {formatHour(order.startTime + order.duration)}
            </div>
            {isLate && (
                <div className="order-late-indicator">
                    <AlertTriangle size={12} />
                </div>
            )}
        </motion.div>
    );
};

// KPI Metric Card Component
const MetricCard: React.FC<{
    icon: React.ReactNode;
    label: string;
    value: string | number;
    suffix?: string;
    status?: 'good' | 'warning' | 'bad';
    description?: string;
}> = ({ icon, label, value, suffix, status = 'good', description }) => (
    <div className={`planning-metric-card ${status}`}>
        <div className="metric-icon">{icon}</div>
        <div className="metric-content">
            <span className="metric-label">{label}</span>
            <span className="metric-value">
                {value}{suffix && <span className="metric-suffix">{suffix}</span>}
            </span>
            {description && <span className="metric-description">{description}</span>}
        </div>
    </div>
);

// Machine Row Component
const MachineRow: React.FC<{
    machine: typeof MACHINES[number];
    orders: Order[];
    isOptimized: boolean;
}> = ({ machine, orders, isOptimized }) => (
    <div className="gantt-machine-row">
        <div className="machine-label" style={{ '--machine-color': machine.color } as React.CSSProperties}>
            <span className="machine-id">{machine.id}</span>
            <span className="machine-name">{machine.name}</span>
        </div>
        <div className="machine-timeline">
            {/* Background grid lines */}
            {TIME_SLOTS.map((hour) => (
                <div
                    key={hour}
                    className="timeline-grid-line"
                    style={{ left: `${((hour - WORK_START) / WORK_HOURS) * 100}%` }}
                />
            ))}

            {/* Order blocks */}
            <AnimatePresence mode="popLayout">
                {orders.map((order) => (
                    <OrderBlock
                        key={order.id}
                        order={order}
                        isLate={isOrderLate(order)}
                        isOptimized={isOptimized}
                    />
                ))}
            </AnimatePresence>
        </div>
    </div>
);

// Backlog Order Item
const BacklogItem: React.FC<{ order: Order; isLate: boolean }> = ({ order, isLate }) => (
    <div className={`backlog-item ${isLate ? 'late' : ''}`}>
        <Package size={14} />
        <span className="backlog-id">{order.id}</span>
        <span className="backlog-deadline">Son: {formatHour(order.deadline)}</span>
    </div>
);

const ProductionPlanningModule: React.FC<ProductionPlanningModuleProps> = ({ onClose }) => {
    const [orders, setOrders] = useState<Order[]>(createBadSchedule);
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [isOptimized, setIsOptimized] = useState(false);
    const [aiMessage, setAiMessage] = useState<string | null>(null);
    const [previousMetrics, setPreviousMetrics] = useState<ScheduleMetrics | null>(null);

    // Calculate current metrics
    const metrics = useMemo(() => calculateMetrics(orders), [orders]);

    // Group orders by machine for Gantt display
    const ordersByMachine = useMemo(() => getOrdersByMachine(orders), [orders]);

    // Count late orders
    const lateOrderIds = useMemo(
        () => orders.filter(o => isOrderLate(o)).map(o => o.id),
        [orders]
    );

    // Handle AI Optimization
    const handleOptimize = useCallback(() => {
        if (isOptimized) return;

        setIsOptimizing(true);
        setPreviousMetrics(metrics);
        setAiMessage(null);

        // Simulate AI "thinking" time
        setTimeout(() => {
            const optimizedOrders = optimizeSchedule(orders);
            const newMetrics = calculateMetrics(optimizedOrders);
            const improvement = calculateImprovement(previousMetrics || metrics, newMetrics);

            setOrders(optimizedOrders);
            setIsOptimized(true);
            setIsOptimizing(false);
            setAiMessage(improvement.message);
        }, 1500);
    }, [orders, metrics, isOptimized]);

    // Handle Reset
    const handleReset = useCallback(() => {
        setOrders(createBadSchedule());
        setIsOptimized(false);
        setAiMessage(null);
        setPreviousMetrics(null);
    }, []);

    // Determine OTD status
    const getOtdStatus = (value: number): 'good' | 'warning' | 'bad' => {
        if (value >= 90) return 'good';
        if (value >= 70) return 'warning';
        return 'bad';
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="modal-content demo-modal planning-module"
                onClick={e => e.stopPropagation()}
                style={{ maxWidth: '1400px' }}
            >
                {/* Header */}
                <div className="modal-header">
                    <div>
                        <h2>📅 Üretim Planlama</h2>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            Sipariş Tetrisi - AI ile Çizelge Optimizasyonu
                        </div>
                    </div>
                    <div className="modal-header-right">
                        <div className="inference-badge">
                            <span className="pulse-dot"></span>
                            {isOptimized ? 'Optimize Edildi' : 'Manuel Mod'}
                        </div>
                        <button onClick={onClose} className="close-btn">✕</button>
                    </div>
                </div>

                <div className="module-content planning-content">
                    {/* KPI Metrics Header */}
                    <div className="planning-metrics-header">
                        <MetricCard
                            icon={<Target size={20} />}
                            label="Termin Uyumu (OTD)"
                            value={metrics.onTimeDelivery}
                            suffix="%"
                            status={getOtdStatus(metrics.onTimeDelivery)}
                            description={`${metrics.totalOrders - metrics.lateOrders}/${metrics.totalOrders} sipariş zamanında`}
                        />
                        <MetricCard
                            icon={<Clock size={20} />}
                            label="Toplam Süre (Makespan)"
                            value={formatHour(metrics.makespan)}
                            status={metrics.makespan <= 16 ? 'good' : 'warning'}
                            description="En geç siparişin bitiş saati"
                        />
                        <MetricCard
                            icon={<Activity size={20} />}
                            label="Makine Doluluk"
                            value={metrics.utilization}
                            suffix="%"
                            status={metrics.utilization >= 80 ? 'good' : metrics.utilization >= 60 ? 'warning' : 'bad'}
                            description="Toplam makine kullanım oranı"
                        />
                        <div className="planning-action-cell">
                            <button
                                className={`btn-ai-optimize ${isOptimizing ? 'loading' : ''} ${isOptimized ? 'optimized' : ''}`}
                                onClick={handleOptimize}
                                disabled={isOptimizing || isOptimized}
                            >
                                {isOptimizing ? (
                                    <>
                                        <span className="loading-spinner"></span>
                                        AI Hesaplıyor...
                                    </>
                                ) : isOptimized ? (
                                    <>
                                        <CheckCircle2 size={18} />
                                        Optimize Edildi
                                    </>
                                ) : (
                                    <>
                                        <BrainCircuit size={18} />
                                        AI ile Çizelgele
                                    </>
                                )}
                            </button>
                            {isOptimized && (
                                <button className="btn-reset" onClick={handleReset}>
                                    Sıfırla
                                </button>
                            )}
                        </div>
                    </div>

                    {/* AI Message */}
                    <AnimatePresence>
                        {aiMessage && (
                            <motion.div
                                className="ai-optimization-message"
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                            >
                                <BrainCircuit size={18} />
                                <span>{aiMessage}</span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Main Content Grid */}
                    <div className="planning-main-grid">
                        {/* Left: Order Backlog */}
                        <div className="planning-backlog">
                            <h4>
                                <Package size={16} />
                                Sipariş Havuzu
                            </h4>
                            <div className="backlog-list">
                                {orders.map(order => (
                                    <BacklogItem
                                        key={order.id}
                                        order={order}
                                        isLate={lateOrderIds.includes(order.id)}
                                    />
                                ))}
                            </div>
                            {lateOrderIds.length > 0 && !isOptimized && (
                                <div className="backlog-warning">
                                    <AlertTriangle size={14} />
                                    {lateOrderIds.length} sipariş termin aşıyor!
                                </div>
                            )}
                        </div>

                        {/* Right: Gantt Chart */}
                        <div className="gantt-container">
                            <h4>Üretim Çizelgesi (Gantt)</h4>

                            {/* Time Axis */}
                            <div className="gantt-time-axis">
                                <div className="axis-label-spacer"></div>
                                <div className="axis-ticks">
                                    {TIME_SLOTS.map((hour) => (
                                        <div
                                            key={hour}
                                            className="axis-tick"
                                            style={{ left: `${((hour - WORK_START) / WORK_HOURS) * 100}%` }}
                                        >
                                            {formatHour(hour)}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Machine Rows */}
                            <div className="gantt-body">
                                {MACHINES.map((machine) => (
                                    <MachineRow
                                        key={machine.id}
                                        machine={machine}
                                        orders={ordersByMachine[machine.id as MachineId]}
                                        isOptimized={isOptimized}
                                    />
                                ))}
                            </div>

                            {/* Legend */}
                            <div className="gantt-legend">
                                {MACHINES.map((machine) => (
                                    <div key={machine.id} className="legend-item">
                                        <span
                                            className="legend-color"
                                            style={{ background: machine.color }}
                                        ></span>
                                        {machine.name}
                                    </div>
                                ))}
                                <div className="legend-item">
                                    <span className="legend-color late"></span>
                                    Gecikmiş
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Explanation */}
                    <div className="planning-explanation">
                        <h4>🎓 Nasıl Çalışır?</h4>
                        <p>
                            <strong>Problem:</strong> Manuel planlama ile siparişler rastgele yerleştirilir.
                            Bazıları termin tarihini aşar, makineler arasında boşluklar oluşur.
                        </p>
                        <p>
                            <strong>Çözüm:</strong> AI, siparişleri öncelik sırasına göre (termin tarihi en yakın olan önce)
                            sıralar ve boşluksuz yerleştirir. Setup süreleri minimize edilir, tüm siparişler zamanında teslim edilir.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductionPlanningModule;
