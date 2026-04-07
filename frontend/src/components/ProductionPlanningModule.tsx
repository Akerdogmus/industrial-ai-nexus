import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BrainCircuit, Clock, Target, Activity, AlertTriangle,
    CheckCircle2, Package, TrendingUp, Zap
} from 'lucide-react';
import {
    MACHINES,
    WORK_START,
    WORK_HOURS,
    createBadSchedule,
    optimizeSchedule,
    calculateMetrics,
    calculateMachineUtilization,
    findIdleGaps,
    isOrderLate,
    getOrdersByMachine,
    getMachineColor,
    formatHour,
    type Order,
    type MachineId,
    type ScheduleMetrics,
} from '../engines/planningEngine';

interface ProductionPlanningModuleProps {
    onClose: () => void;
}

const TIME_SLOTS = Array.from({ length: WORK_HOURS + 1 }, (_, i) => WORK_START + i);
const SIM_NOW = 12;

// ============================================
// AI REASONING STEPS
// ============================================
const REASONING_STEPS = [
    { icon: '🔍', text: 'Sipariş öncelikleri analiz ediliyor...' },
    { icon: '⚡', text: 'EDD algoritması çalıştırılıyor...' },
    { icon: '🧮', text: '40.320 permütasyon değerlendiriliyor...' },
    { icon: '⚙️', text: 'Çakışmalar ve boşluklar gideriliyor...' },
    { icon: '✅', text: 'Optimal çizelge bulundu!' },
];

// ============================================
// HOOKS
// ============================================
function useCountUp(target: number, durationMs = 900): number {
    const [current, setCurrent] = useState(target);
    const prevTarget = useRef(target);

    useEffect(() => {
        if (prevTarget.current === target) return;
        const from = prevTarget.current;
        prevTarget.current = target;
        const startTime = performance.now();
        let rafId: number;
        const step = (now: number) => {
            const t = Math.min((now - startTime) / durationMs, 1);
            const ease = 1 - Math.pow(1 - t, 3);
            setCurrent(from + (target - from) * ease);
            if (t < 1) rafId = requestAnimationFrame(step);
        };
        rafId = requestAnimationFrame(step);
        return () => cancelAnimationFrame(rafId);
    }, [target, durationMs]);

    return current;
}

// ============================================
// AI REASONING PANEL
// ============================================
const ReasoningPanel: React.FC<{ isActive: boolean }> = ({ isActive }) => {
    const [visibleSteps, setVisibleSteps] = useState<number[]>([]);

    useEffect(() => {
        if (!isActive) { setVisibleSteps([]); return; }
        let i = 0;
        const interval = setInterval(() => {
            setVisibleSteps(prev => [...prev, i]);
            i++;
            if (i >= REASONING_STEPS.length) clearInterval(interval);
        }, 280);
        return () => clearInterval(interval);
    }, [isActive]);

    return (
        <motion.div
            className="reasoning-panel"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
        >
            <div className="reasoning-header">
                <BrainCircuit size={13} />
                <span>AI Analiz</span>
                {isActive && <span className="reasoning-dots"><span /><span /><span /></span>}
            </div>
            <div className="reasoning-steps">
                {REASONING_STEPS.map((step, idx) => (
                    <AnimatePresence key={idx}>
                        {visibleSteps.includes(idx) && (
                            <motion.div
                                className={`reasoning-step ${idx === REASONING_STEPS.length - 1 ? 'final' : ''}`}
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                <span className="step-icon">{step.icon}</span>
                                <span className="step-text">{step.text}</span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                ))}
            </div>
        </motion.div>
    );
};

// ============================================
// OPTIMIZATION SUMMARY CARD
// ============================================
const OptimizationSummaryCard: React.FC<{
    before: ScheduleMetrics; after: ScheduleMetrics;
}> = ({ before, after }) => {
    const savedOrders = before.lateOrders - after.lateOrders;
    const timeSaved = before.makespan - after.makespan;
    const utilizationGain = after.utilization - before.utilization;
    const otdGain = after.onTimeDelivery - before.onTimeDelivery;

    return (
        <motion.div
            className="optimization-summary-card"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
        >
            <div className="summary-header">
                <CheckCircle2 size={14} />
                <span>Optimizasyon Tamamlandı</span>
            </div>
            <div className="summary-pills">
                {savedOrders > 0 && (
                    <motion.div className="summary-pill rescued" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.1 }}>
                        <TrendingUp size={11} />{savedOrders} sipariş kurtarıldı
                    </motion.div>
                )}
                {otdGain > 0 && (
                    <motion.div className="summary-pill otd" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2 }}>
                        <Target size={11} />OTD +%{otdGain}
                    </motion.div>
                )}
                {timeSaved > 0 && (
                    <motion.div className="summary-pill time" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3 }}>
                        <Clock size={11} />{timeSaved.toFixed(1)}s kazanıldı
                    </motion.div>
                )}
                {utilizationGain > 0 && (
                    <motion.div className="summary-pill util" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.4 }}>
                        <Zap size={11} />Doluluk +%{utilizationGain}
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
};

// ============================================
// KPI METRIC CARD — compact vertical card
// ============================================
const MetricCard: React.FC<{
    icon: React.ReactNode;
    label: string;
    numericValue: number;
    suffix?: string;
    status: 'good' | 'warning' | 'bad';
    description?: string;
    previousValue?: number;
    previousDisplay?: string;
    isOptimized?: boolean;
    formatter?: (n: number) => string;
}> = ({ icon, label, numericValue, suffix, status, description,
    previousValue, previousDisplay, isOptimized, formatter }) => {
    const animated = useCountUp(numericValue, 1000);
    const display = formatter ? formatter(animated) : String(Math.round(animated));

    return (
        <div className={`planning-metric-card ${status}`}>
            <div className="metric-icon">{icon}</div>
            <div className="metric-content">
                <span className="metric-label">{label}</span>
                <div className="metric-value-row">
                    <span className="metric-value">
                        {display}{suffix && <span className="metric-suffix">{suffix}</span>}
                    </span>
                    {isOptimized && previousDisplay !== undefined && (
                        <span className="metric-before">← {previousDisplay}{suffix}</span>
                    )}
                </div>
                {description && <span className="metric-description">{description}</span>}
            </div>
        </div>
    );
};

// ============================================
// SETUP GAP BLOCK
// ============================================
const SetupGap: React.FC<{ start: number; end: number; isOptimized: boolean }> = ({ start, end, isOptimized }) => {
    const leftPct = ((start - WORK_START) / WORK_HOURS) * 100;
    const widthPct = ((end - start) / WORK_HOURS) * 100;
    if (widthPct < 0.5) return null;

    return (
        <AnimatePresence>
            {!isOptimized && (
                <motion.div
                    className="setup-gap-block"
                    style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, scaleX: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    {widthPct > 4 && <span className="gap-label">⚠ Boşta</span>}
                </motion.div>
            )}
        </AnimatePresence>
    );
};

// ============================================
// DEADLINE MARKER
// ============================================
const DeadlineMarker: React.FC<{ deadline: number; isMet: boolean; orderId: string }> = ({ deadline, isMet, orderId }) => {
    const leftPct = ((deadline - WORK_START) / WORK_HOURS) * 100;
    if (leftPct < 0 || leftPct > 100) return null;
    return (
        <div className={`deadline-marker ${isMet ? 'met' : 'missed'}`}
            style={{ left: `${leftPct}%` }}
            title={`${orderId} termini: ${formatHour(deadline)}`}>
            <div className="deadline-line" />
            <div className="deadline-triangle" />
        </div>
    );
};

// ============================================
// ORDER SCHEDULE TABLE
// ============================================
const OrderScheduleTable: React.FC<{ orders: Order[]; isOptimized: boolean }> = ({ orders, isOptimized }) => {
    const sorted = [...orders].sort((a, b) =>
        a.machineId.localeCompare(b.machineId) || a.startTime - b.startTime
    );

    return (
        <div className="schedule-table-wrap">
            <div className="schedule-table-header">
                <span className="schedule-table-title">📋 Sipariş Çizelgesi</span>
                <span className="schedule-table-count">{orders.length} sipariş</span>
            </div>
            <div className="schedule-table-scroll">
                <table className="schedule-table">
                    <thead>
                        <tr>
                            <th>Sipariş</th>
                            <th>Ürün</th>
                            <th>Makine</th>
                            <th>Başlangıç</th>
                            <th>Bitiş</th>
                            <th>Termin</th>
                            <th>Süre</th>
                            <th>Durum</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sorted.map(order => {
                            const endTime = order.startTime + order.duration;
                            const late = isOrderLate(order);
                            const machineColor = getMachineColor(order.machineId);
                            const slack = order.deadline - endTime;
                            return (
                                <tr key={order.id} className={late && !isOptimized ? 'row-late' : 'row-ok'}>
                                    <td>
                                        <span className="sched-order-chip"
                                            style={{ borderColor: machineColor, color: machineColor }}>
                                            {order.id}
                                        </span>
                                    </td>
                                    <td className="sched-product">{order.product}</td>
                                    <td>
                                        <span className="sched-machine-dot" style={{ background: machineColor }} />
                                        {order.machineId}
                                    </td>
                                    <td className="sched-time">{formatHour(order.startTime)}</td>
                                    <td className="sched-time">{formatHour(endTime)}</td>
                                    <td className="sched-time sched-deadline">{formatHour(order.deadline)}</td>
                                    <td className="sched-duration">{order.duration}s</td>
                                    <td>
                                        {late && !isOptimized ? (
                                            <span className="sched-status late">⚠ Gecikmeli</span>
                                        ) : slack <= 0.5 ? (
                                            <span className="sched-status tight">⚡ Sıkı</span>
                                        ) : (
                                            <span className="sched-status ok">✓ Zamanında</span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// ============================================
// ORDER BLOCK
// ============================================
const OrderBlock: React.FC<{ order: Order; isLate: boolean; isOptimized: boolean }> = ({ order, isLate, isOptimized }) => {
    const widthPct = (order.duration / WORK_HOURS) * 100;
    const leftPct = ((order.startTime - WORK_START) / WORK_HOURS) * 100;
    const elapsed = Math.max(0, SIM_NOW - order.startTime);
    const progressPct = Math.min(100, Math.round((elapsed / order.duration) * 100));

    return (
        <motion.div
            layout layoutId={order.id}
            className={`order-block ${isLate ? 'late' : ''} ${isOptimized ? 'optimized' : ''}`}
            style={{
                left: `${leftPct}%`, width: `${widthPct}%`,
                '--order-color': getMachineColor(order.machineId),
            } as React.CSSProperties}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ layout: { type: 'spring', stiffness: 300, damping: 30 }, opacity: { duration: 0.3 } }}
        >
            {progressPct > 0 && (
                <motion.div className="order-progress-fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPct}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
                />
            )}
            <div className="order-block-content">
                <span className="order-id">{order.id}</span>
                <span className="order-product">{order.product}</span>
            </div>
            <div className="order-time-range">
                {formatHour(order.startTime)}–{formatHour(order.startTime + order.duration)}
            </div>
            {isLate && <div className="order-late-indicator"><AlertTriangle size={11} /></div>}
        </motion.div>
    );
};

// ============================================
// MACHINE ROW
// ============================================
const MachineRow: React.FC<{
    machine: typeof MACHINES[number];
    orders: Order[];
    isOptimized: boolean;
    utilization: number;
    gaps: { start: number; end: number }[];
}> = ({ machine, orders, isOptimized, utilization, gaps }) => {
    const utilColor = utilization >= 75 ? '#10b981' : utilization >= 50 ? '#f59e0b' : '#ef4444';

    return (
        <div className="gantt-machine-row">
            <div className="machine-label" style={{ '--machine-color': machine.color } as React.CSSProperties}>
                <span className="machine-id">{machine.id}</span>
                <span className="machine-name">{machine.name}</span>
                <div className="machine-util-bar-wrap">
                    <motion.div className="machine-util-bar-fill" style={{ background: utilColor }}
                        initial={{ width: 0 }}
                        animate={{ width: `${utilization}%` }}
                        transition={{ duration: 0.7, ease: 'easeOut' }}
                    />
                    <span className="machine-util-label" style={{ color: utilColor }}>{utilization}%</span>
                </div>
            </div>
            <div className="machine-timeline">
                {TIME_SLOTS.map(hour => (
                    <div key={hour} className="timeline-grid-line"
                        style={{ left: `${((hour - WORK_START) / WORK_HOURS) * 100}%` }} />
                ))}
                <div className="current-time-line" style={{ left: `${((SIM_NOW - WORK_START) / WORK_HOURS) * 100}%` }}>
                    <div className="now-label">ŞİMDİ</div>
                </div>
                {gaps.map((gap, i) => (
                    <SetupGap key={i} start={gap.start} end={gap.end} isOptimized={isOptimized} />
                ))}
                {orders.map(order => (
                    <DeadlineMarker key={`dl-${order.id}`} deadline={order.deadline}
                        isMet={!isOrderLate(order)} orderId={order.id} />
                ))}
                <AnimatePresence mode="popLayout">
                    {orders.map(order => (
                        <OrderBlock key={order.id} order={order}
                            isLate={isOrderLate(order)} isOptimized={isOptimized} />
                    ))}
                </AnimatePresence>
                <CriticalPathOverlay orders={orders} isOptimized={isOptimized} />
            </div>
        </div>
    );
};

// ============================================
// CRITICAL PATH SVG
// ============================================
const CriticalPathOverlay: React.FC<{ orders: Order[]; isOptimized: boolean }> = ({ orders, isOptimized }) => {
    if (!isOptimized || orders.length < 2) return null;
    const sorted = [...orders].sort((a, b) => a.startTime - b.startTime);
    return (
        <svg className="critical-path-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
                <marker id="cpArrow" markerWidth="5" markerHeight="5" refX="2.5" refY="2.5" orient="auto">
                    <polygon points="0 0, 5 2.5, 0 5" fill="rgba(52,211,153,0.7)" />
                </marker>
            </defs>
            {sorted.slice(0, -1).map((order, i) => {
                const next = sorted[i + 1];
                const x1 = ((order.startTime + order.duration - WORK_START) / WORK_HOURS) * 100;
                const x2 = ((next.startTime - WORK_START) / WORK_HOURS) * 100;
                if (x2 - x1 < 0.5) return null;
                return (
                    <motion.line key={`cp-${order.id}`}
                        x1={`${x1}%`} y1="50%" x2={`${x2}%`} y2="50%"
                        stroke="rgba(52,211,153,0.5)" strokeWidth="0.4"
                        strokeDasharray="2 1" markerEnd="url(#cpArrow)"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: 0.6, delay: i * 0.05 }}
                    />
                );
            })}
        </svg>
    );
};

// ============================================
// BACKLOG ITEM
// ============================================
const BacklogItem: React.FC<{ order: Order; isLate: boolean; isOptimized: boolean }> = ({ order, isLate, isOptimized }) => {
    const machineColor = getMachineColor(order.machineId);
    const endTime = order.startTime + order.duration;
    const hoursUntilDeadline = order.deadline - endTime;
    const isUrgent = !isLate && hoursUntilDeadline < 1.5;
    const wasSaved = isLate && isOptimized;

    return (
        <motion.div
            className={`backlog-item ${isLate && !isOptimized ? 'late' : ''} ${isOptimized ? 'resolved' : ''}`}
            layout transition={{ duration: 0.3 }}
        >
            <div className="backlog-machine-dot" style={{ background: machineColor }} />
            <span className="backlog-id">{order.id}</span>
            <span className="backlog-product">{order.product}</span>
            <span className="backlog-deadline">Son: {formatHour(order.deadline)}</span>
            {wasSaved && <span className="backlog-badge saved"><CheckCircle2 size={9} /> Kurtarıldı</span>}
            {!isOptimized && isLate && <span className="backlog-badge late-badge"><AlertTriangle size={9} /> GEÇ</span>}
            {!isLate && isUrgent && !isOptimized && <span className="backlog-badge urgent">⚡ ACİL</span>}
        </motion.div>
    );
};

// ============================================
// MAIN COMPONENT
// ============================================
const ProductionPlanningModule: React.FC<ProductionPlanningModuleProps> = ({ onClose }) => {
    const [orders, setOrders] = useState<Order[]>(createBadSchedule);
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [isOptimized, setIsOptimized] = useState(false);
    const [previousMetrics, setPreviousMetrics] = useState<ScheduleMetrics | null>(null);

    const metrics = useMemo(() => calculateMetrics(orders), [orders]);
    const machineUtil = useMemo(() => calculateMachineUtilization(orders), [orders]);
    const ordersByMachine = useMemo(() => getOrdersByMachine(orders), [orders]);
    const idleGaps = useMemo(() => findIdleGaps(orders), [orders]);
    const lateOrderIds = useMemo(() => orders.filter(o => isOrderLate(o)).map(o => o.id), [orders]);

    const handleOptimize = useCallback(() => {
        if (isOptimized) return;
        setIsOptimizing(true);
        setPreviousMetrics(metrics);
        setTimeout(() => {
            setOrders(optimizeSchedule(orders));
            setIsOptimized(true);
            setIsOptimizing(false);
        }, REASONING_STEPS.length * 280 + 300);
    }, [orders, metrics, isOptimized]);

    const handleReset = useCallback(() => {
        setOrders(createBadSchedule());
        setIsOptimized(false);
        setPreviousMetrics(null);
    }, []);

    const otdStatus = (v: number): 'good' | 'warning' | 'bad' =>
        v >= 90 ? 'good' : v >= 70 ? 'warning' : 'bad';

    const gapsByMachine = useMemo(() => {
        const map: Record<MachineId, { start: number; end: number }[]> = {
            'CNC-1': [], 'CNC-2': [], 'Assembly': []
        };
        for (const gap of idleGaps) map[gap.machineId].push({ start: gap.start, end: gap.end });
        return map;
    }, [idleGaps]);

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="modal-content demo-modal planning-module"
                onClick={e => e.stopPropagation()}
                style={{ maxWidth: '1380px' }}
            >
                {/* Header */}
                <div className="modal-header">
                    <div>
                        <h2>📅 Üretim Planlama</h2>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            Sipariş Tetrisi · AI ile Çizelge Optimizasyonu
                        </div>
                    </div>
                    <div className="modal-header-right">
                        <div className="inference-badge">
                            <span className="pulse-dot" />
                            {isOptimizing ? 'AI Hesaplıyor...' : isOptimized ? 'Optimize Edildi' : 'Manuel Mod'}
                        </div>
                        <button onClick={onClose} className="close-btn">✕</button>
                    </div>
                </div>

                {/* ── Two-column layout ── */}
                <div className="planning-body">

                    {/* LEFT SIDEBAR: KPI + Controls + Backlog */}
                    <div className="planning-sidebar">
                        {/* KPI Metrics stacked */}
                        <div className="planning-kpi-stack">
                            <MetricCard icon={<Target size={16} />} label="Termin Uyumu (OTD)"
                                numericValue={metrics.onTimeDelivery} suffix="%"
                                status={otdStatus(metrics.onTimeDelivery)}
                                description={`${metrics.totalOrders - metrics.lateOrders}/${metrics.totalOrders} zamanında`}
                                previousValue={previousMetrics?.onTimeDelivery}
                                previousDisplay={previousMetrics?.onTimeDelivery?.toString()}
                                isOptimized={isOptimized} />
                            <MetricCard icon={<Clock size={16} />} label="Makespan"
                                numericValue={metrics.makespan}
                                formatter={n => formatHour(n)}
                                status={metrics.makespan <= 16 ? 'good' : 'warning'}
                                description="En geç bitiş saati"
                                previousValue={previousMetrics?.makespan}
                                previousDisplay={previousMetrics ? formatHour(previousMetrics.makespan) : undefined}
                                isOptimized={isOptimized} />
                            <MetricCard icon={<Activity size={16} />} label="Makine Doluluk"
                                numericValue={metrics.utilization} suffix="%"
                                status={metrics.utilization >= 80 ? 'good' : metrics.utilization >= 60 ? 'warning' : 'bad'}
                                description="Toplam kullanım oranı"
                                previousValue={previousMetrics?.utilization}
                                previousDisplay={previousMetrics?.utilization?.toString()}
                                isOptimized={isOptimized} />
                        </div>

                        {/* AI button */}
                        <div className="planning-action-cell">
                            <button
                                className={`btn-ai-optimize ${isOptimizing ? 'loading' : ''} ${isOptimized ? 'optimized' : ''}`}
                                onClick={handleOptimize}
                                disabled={isOptimizing || isOptimized}
                            >
                                {isOptimizing ? <><span className="loading-spinner" />AI Hesaplıyor...</>
                                    : isOptimized ? <><CheckCircle2 size={16} />Optimize Edildi</>
                                        : <><BrainCircuit size={16} />AI ile Çizelgele</>}
                            </button>
                            {isOptimized && (
                                <button className="btn-reset" onClick={handleReset}>Sıfırla</button>
                            )}
                        </div>

                        {/* Reasoning Panel */}
                        <AnimatePresence>
                            {isOptimizing && <ReasoningPanel isActive={isOptimizing} />}
                        </AnimatePresence>

                        {/* Summary Card */}
                        <AnimatePresence>
                            {isOptimized && previousMetrics && (
                                <OptimizationSummaryCard before={previousMetrics} after={metrics} />
                            )}
                        </AnimatePresence>

                        {/* Explanation */}
                        {!isOptimized && (
                            <div className="planning-explanation">
                                <h4>🎓 Nasıl Çalışır?</h4>
                                <p><strong>Problem:</strong> Manuel planlama ile siparişler rastgele yerleştirilir, terminler aşılır.</p>
                                <p><strong>Çözüm:</strong> AI, EDD algoritmasıyla siparişleri sıralar, boşlukları kapatır.</p>
                            </div>
                        )}
                    </div>

                    {/* RIGHT: Gantt Chart (hero) */}
                    <div className="gantt-container">
                        {/* Header row: title + legend */}
                        <div className="gantt-header-row">
                            <h4>Üretim Çizelgesi (Gantt)</h4>
                            <div className="gantt-legend">
                                {MACHINES.map(m => (
                                    <div key={m.id} className="legend-item">
                                        <span className="legend-color" style={{ background: m.color }} />
                                        {m.name}
                                    </div>
                                ))}
                                <div className="legend-item">
                                    <span className="legend-color late" />Gecikmiş
                                </div>
                                {!isOptimized && (
                                    <div className="legend-item">
                                        <span className="legend-color gap" />Boşta
                                    </div>
                                )}
                                <div className="legend-item">
                                    <span className="legend-deadline-triangle" />Termin
                                </div>
                            </div>
                        </div>

                        {/* Time Axis */}
                        <div className="gantt-time-axis">
                            <div className="axis-label-spacer" />
                            <div className="axis-ticks">
                                {TIME_SLOTS.map(hour => (
                                    <div key={hour} className="axis-tick"
                                        style={{ left: `${((hour - WORK_START) / WORK_HOURS) * 100}%` }}>
                                        {formatHour(hour)}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Machine Rows */}
                        <div className="gantt-body">
                            {MACHINES.map(machine => (
                                <MachineRow key={machine.id}
                                    machine={machine}
                                    orders={ordersByMachine[machine.id as MachineId]}
                                    isOptimized={isOptimized}
                                    utilization={machineUtil[machine.id as MachineId]}
                                    gaps={gapsByMachine[machine.id as MachineId]}
                                />
                            ))}
                        </div>

                        {/* Order Schedule Table — fills empty space below gantt */}
                        <OrderScheduleTable orders={orders} isOptimized={isOptimized} />

                        {/* Sipariş Havuzu — compact horizontal chips below table */}
                        <div className="planning-backlog">
                            <h4>
                                <Package size={14} />Sipariş Havuzu
                                {lateOrderIds.length > 0 && !isOptimized && (
                                    <motion.span className="backlog-late-badge"
                                        animate={{ opacity: [1, 0.5, 1] }}
                                        transition={{ repeat: Infinity, duration: 2 }}>
                                        <AlertTriangle size={11} />
                                        {lateOrderIds.length} gecikmiş
                                    </motion.span>
                                )}
                            </h4>
                            <div className="backlog-list">
                                {orders.map(order => (
                                    <BacklogItem key={order.id} order={order}
                                        isLate={lateOrderIds.includes(order.id)}
                                        isOptimized={isOptimized} />
                                ))}
                            </div>
                        </div>
                    </div>

                </div>{/* end planning-body */}
            </div>
        </div>
    );
};

export default ProductionPlanningModule;
