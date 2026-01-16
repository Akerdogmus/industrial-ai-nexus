import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Zap, Leaf, Clock, TrendingDown, BrainCircuit } from 'lucide-react';
import {
    ComposedChart,
    Bar,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    ReferenceLine,
} from 'recharts';
import {
    TARIFF_RATES,
    calculateHeatingDuration,
    calculatePowerConsumption,
    calculateCost,
    findOptimalStartHour,
    generateChartData,
    calculateCarbonFootprint,
    getCurrentSpotPrice,
    createInitialEnergyState,
    formatCurrency,
} from '../engines/energyEngine';
import type { EnergyState, ChartDataPoint } from '../engines/energyEngine';

interface EnergyOptimizationModuleProps {
    onClose: () => void;
}

// Live Ticker Component - Scrolling price band
const LiveTicker: React.FC<{ spotPrice: number; carbonRate: number }> = ({ spotPrice, carbonRate }) => {
    return (
        <div className="energy-ticker">
            <div className="ticker-content">
                <span className="ticker-item">
                    <Zap size={14} />
                    Spot Elektrik Fiyatı: <strong>{spotPrice.toFixed(2)} TL/kWh</strong>
                </span>
                <span className="ticker-separator">•</span>
                <span className="ticker-item">
                    <Leaf size={14} />
                    Karbon Emisyonu: <strong>{carbonRate} kg CO₂/kWh</strong>
                </span>
                <span className="ticker-separator">•</span>
                <span className="ticker-item">
                    <Clock size={14} />
                    Tarife Bölgesi: <strong>{getZoneLabel(new Date().getHours())}</strong>
                </span>
                <span className="ticker-separator">•</span>
                <span className="ticker-item">
                    <Zap size={14} />
                    Spot Elektrik Fiyatı: <strong>{spotPrice.toFixed(2)} TL/kWh</strong>
                </span>
                <span className="ticker-separator">•</span>
                <span className="ticker-item">
                    <Leaf size={14} />
                    Karbon Emisyonu: <strong>{carbonRate} kg CO₂/kWh</strong>
                </span>
            </div>
        </div>
    );
};

function getZoneLabel(hour: number): string {
    const tariff = TARIFF_RATES[hour];
    switch (tariff.zone) {
        case 'night': return 'Gece (Ucuz)';
        case 'peak': return 'Pik (Pahalı)';
        case 'evening': return 'Akşam (Orta)';
    }
}

// Furnace Visual Component
const FurnaceVisual: React.FC<{
    temperature: number;
    isHeating: boolean;
    currentHour: number;
    startHour: number;
}> = ({ temperature, isHeating, currentHour, startHour }) => {
    const heatIntensity = (temperature - 500) / 700; // 0-1 scale
    const isActive = currentHour >= startHour;

    return (
        <div className={`furnace-card ${isActive && isHeating ? 'active' : ''}`}>
            <div className="furnace-header">
                <h4><Flame size={18} /> Isıl İşlem Fırını</h4>
                <span className={`furnace-status ${isActive ? 'on' : 'off'}`}>
                    {isActive ? '● ÇALIŞIYOR' : '○ BEKLEMEDE'}
                </span>
            </div>

            <div className="furnace-body">
                <div
                    className="furnace-visual"
                    style={{
                        '--heat-intensity': heatIntensity,
                        '--glow-color': isActive
                            ? `rgba(255, ${Math.round(150 - heatIntensity * 100)}, 0, ${0.3 + heatIntensity * 0.5})`
                            : 'transparent',
                    } as React.CSSProperties}
                >
                    <div className="furnace-chamber">
                        {isActive && (
                            <>
                                <div className="heat-wave wave-1" />
                                <div className="heat-wave wave-2" />
                                <div className="heat-wave wave-3" />
                            </>
                        )}
                    </div>
                    <div className="furnace-temp-display">
                        <span className="temp-value">{temperature}</span>
                        <span className="temp-unit">°C</span>
                    </div>
                </div>

                <div className="furnace-info">
                    <div className="info-row">
                        <span>Hedef Sıcaklık</span>
                        <span>{temperature}°C</span>
                    </div>
                    <div className="info-row">
                        <span>Isınma Süresi</span>
                        <span>{calculateHeatingDuration(temperature)} saat</span>
                    </div>
                    <div className="info-row">
                        <span>Güç Tüketimi</span>
                        <span>{calculatePowerConsumption(temperature)} kW</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Custom Tooltip for Chart
const CustomTooltip: React.FC<{
    active?: boolean;
    payload?: Array<{ value: number; dataKey: string; payload: ChartDataPoint }>;
    label?: string;
}> = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="energy-chart-tooltip">
                <p className="tooltip-hour">{label}</p>
                <p className="tooltip-rate">
                    Tarife: <strong>{data.tariffRate.toFixed(2)} TL/kWh</strong>
                </p>
                {data.consumption > 0 && (
                    <p className="tooltip-consumption">
                        Tüketim: <strong>{data.consumption} kW</strong>
                    </p>
                )}
                <p className={`tooltip-zone zone-${data.tariffZone}`}>
                    {getZoneLabel(parseInt(label || '0'))}
                </p>
            </div>
        );
    }
    return null;
};

const EnergyOptimizationModule: React.FC<EnergyOptimizationModuleProps> = ({ onClose }) => {
    const [state, setState] = useState<EnergyState>(createInitialEnergyState);
    const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [spotPrice, setSpotPrice] = useState(4.2);
    const [previousCost, setPreviousCost] = useState<number | null>(null);
    const [currentSimHour, setCurrentSimHour] = useState(8);

    // Calculate derived values
    const power = calculatePowerConsumption(state.targetTemperature);
    const duration = calculateHeatingDuration(state.targetTemperature);
    const totalCost = calculateCost(state.startHour, duration, power);
    const totalKWh = power * duration;
    const carbonFootprint = calculateCarbonFootprint(totalKWh);

    // Update chart data when state changes
    useEffect(() => {
        const data = generateChartData(state.startHour, duration, power);
        setChartData(data);
    }, [state.startHour, duration, power]);

    // Simulate live spot price updates
    useEffect(() => {
        const interval = setInterval(() => {
            const hour = new Date().getHours();
            setSpotPrice(getCurrentSpotPrice(hour));
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    // Simulate time progression
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentSimHour(prev => (prev + 1) % 24);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    // Handle temperature change
    const handleTemperatureChange = useCallback((temp: number) => {
        setState(prev => ({
            ...prev,
            targetTemperature: temp,
            heatingDuration: calculateHeatingDuration(temp),
            isOptimized: false,
        }));
        setPreviousCost(null);
    }, []);

    // Handle start hour change
    const handleStartHourChange = useCallback((hour: number) => {
        setState(prev => ({
            ...prev,
            startHour: hour,
            isOptimized: false,
        }));
        setPreviousCost(null);
    }, []);

    // Handle deadline change
    const handleDeadlineChange = useCallback((deadline: number) => {
        setState(prev => ({
            ...prev,
            deadline,
            isOptimized: false,
        }));
        setPreviousCost(null);
    }, []);

    // AI Optimization
    const handleOptimize = useCallback(() => {
        setIsOptimizing(true);
        setPreviousCost(totalCost);

        // Simulate AI "thinking"
        setTimeout(() => {
            const optimalStart = findOptimalStartHour(duration, state.deadline);

            setState(prev => ({
                ...prev,
                startHour: optimalStart,
                isOptimized: true,
            }));

            setIsOptimizing(false);
        }, 1500);
    }, [duration, state.deadline, totalCost]);

    // Calculate savings
    const savings = previousCost ? previousCost - totalCost : 0;
    const savingsPercent = previousCost ? Math.round((savings / previousCost) * 100) : 0;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="modal-content demo-modal energy-module"
                onClick={e => e.stopPropagation()}
                style={{ maxWidth: '1400px' }}
            >
                {/* Header */}
                <div className="modal-header">
                    <div>
                        <h2>⚡ Enerji Optimizasyonu</h2>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            Akıllı Yük Kaydırma ile Maliyet Azaltma
                        </div>
                    </div>
                    <div className="modal-header-right">
                        <div className="inference-badge">
                            <span className="pulse-dot"></span>
                            Simülasyon Aktif
                        </div>
                        <button onClick={onClose} className="close-btn">✕</button>
                    </div>
                </div>

                {/* Live Ticker */}
                <LiveTicker spotPrice={spotPrice} carbonRate={0.4} />

                <div className="module-content energy-content">
                    {/* Left Panel - Furnace & Controls */}
                    <div className="energy-left-panel">
                        <FurnaceVisual
                            temperature={state.targetTemperature}
                            isHeating={state.isOptimized || state.startHour <= currentSimHour}
                            currentHour={currentSimHour}
                            startHour={state.startHour}
                        />

                        {/* Controls */}
                        <div className="energy-controls">
                            <div className="control-group">
                                <label>
                                    Hedef Sıcaklık: <strong>{state.targetTemperature}°C</strong>
                                </label>
                                <input
                                    type="range"
                                    min="500"
                                    max="1200"
                                    step="50"
                                    value={state.targetTemperature}
                                    onChange={e => handleTemperatureChange(parseInt(e.target.value))}
                                    className="energy-slider"
                                />
                                <div className="slider-labels">
                                    <span>500°C</span>
                                    <span>1200°C</span>
                                </div>
                            </div>

                            <div className="control-group">
                                <label>
                                    Başlangıç Saati: <strong>{state.startHour.toString().padStart(2, '0')}:00</strong>
                                </label>
                                <input
                                    type="range"
                                    min="0"
                                    max="23"
                                    value={state.startHour}
                                    onChange={e => handleStartHourChange(parseInt(e.target.value))}
                                    className="energy-slider"
                                />
                                <div className="slider-labels">
                                    <span>00:00</span>
                                    <span>23:00</span>
                                </div>
                            </div>

                            <div className="control-group">
                                <label>
                                    Termin Saati: <strong>{state.deadline.toString().padStart(2, '0')}:00</strong>
                                </label>
                                <input
                                    type="range"
                                    min="6"
                                    max="23"
                                    value={state.deadline}
                                    onChange={e => handleDeadlineChange(parseInt(e.target.value))}
                                    className="energy-slider deadline-slider"
                                />
                                <div className="slider-labels">
                                    <span>06:00</span>
                                    <span>23:00</span>
                                </div>
                            </div>

                            <button
                                className={`btn-eco-optimize ${isOptimizing ? 'loading' : ''} ${state.isOptimized ? 'optimized' : ''}`}
                                onClick={handleOptimize}
                                disabled={isOptimizing}
                            >
                                {isOptimizing ? (
                                    <>
                                        <span className="loading-spinner"></span>
                                        AI Hesaplıyor...
                                    </>
                                ) : state.isOptimized ? (
                                    <>✓ Optimize Edildi</>
                                ) : (
                                    <>
                                        <BrainCircuit size={18} />
                                        Eco-Smart Planla
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Right Panel - Chart & Metrics */}
                    <div className="energy-right-panel">
                        {/* Metrics Cards */}
                        <div className="energy-metrics">
                            <div className={`metric-card cost ${state.isOptimized ? 'optimized' : 'expensive'}`}>
                                <div className="metric-icon">
                                    <Zap size={24} />
                                </div>
                                <div className="metric-content">
                                    <span className="metric-label">Tahmini Fatura</span>
                                    <span className="metric-value">
                                        {formatCurrency(totalCost)} TL
                                    </span>
                                    <AnimatePresence>
                                        {state.isOptimized && savings > 0 && (
                                            <motion.span
                                                className="savings-badge"
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0 }}
                                            >
                                                <TrendingDown size={14} />
                                                {savingsPercent}% tasarruf
                                            </motion.span>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>

                            <div className="metric-card carbon">
                                <div className="metric-icon">
                                    <Leaf size={24} />
                                </div>
                                <div className="metric-content">
                                    <span className="metric-label">Karbon Ayak İzi</span>
                                    <span className="metric-value">{carbonFootprint} kg CO₂</span>
                                </div>
                            </div>

                            <div className="metric-card energy">
                                <div className="metric-icon">
                                    <Clock size={24} />
                                </div>
                                <div className="metric-content">
                                    <span className="metric-label">Toplam Enerji</span>
                                    <span className="metric-value">{totalKWh} kWh</span>
                                </div>
                            </div>
                        </div>

                        {/* Chart */}
                        <div className="energy-chart-container">
                            <h4>24 Saatlik Tarife ve Tüketim Planı</h4>
                            <ResponsiveContainer width="100%" height={300}>
                                <ComposedChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                    <defs>
                                        <linearGradient id="tariffGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="var(--accent-primary)" stopOpacity={0.3} />
                                            <stop offset="100%" stopColor="var(--accent-primary)" stopOpacity={0.05} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                    <XAxis
                                        dataKey="hour"
                                        stroke="#9ca3af"
                                        fontSize={11}
                                        tickLine={false}
                                        interval={2}
                                    />
                                    <YAxis
                                        yAxisId="tariff"
                                        orientation="left"
                                        stroke="#9ca3af"
                                        fontSize={11}
                                        tickLine={false}
                                        label={{ value: 'TL/kWh', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#9ca3af' }}
                                    />
                                    <YAxis
                                        yAxisId="consumption"
                                        orientation="right"
                                        stroke="#9ca3af"
                                        fontSize={11}
                                        tickLine={false}
                                        label={{ value: 'kW', angle: 90, position: 'insideRight', fontSize: 10, fill: '#9ca3af' }}
                                    />
                                    <Tooltip content={<CustomTooltip />} />

                                    {/* Tariff Area (Background) */}
                                    <Area
                                        yAxisId="tariff"
                                        type="stepAfter"
                                        dataKey="tariffRate"
                                        stroke="transparent"
                                        fill="url(#tariffGradient)"
                                    />

                                    {/* Deadline Reference Line */}
                                    <ReferenceLine
                                        x={`${state.deadline.toString().padStart(2, '0')}:00`}
                                        yAxisId="tariff"
                                        stroke="#ef4444"
                                        strokeDasharray="5 5"
                                        label={{ value: 'Termin', position: 'top', fill: '#ef4444', fontSize: 10 }}
                                    />

                                    {/* Consumption Bars (Foreground) */}
                                    <Bar
                                        yAxisId="consumption"
                                        dataKey="consumption"
                                        maxBarSize={30}
                                        radius={[4, 4, 0, 0]}
                                    >
                                        {chartData.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={
                                                    entry.tariffZone === 'night'
                                                        ? '#10b981'
                                                        : entry.tariffZone === 'peak'
                                                            ? '#ef4444'
                                                            : '#f59e0b'
                                                }
                                                fillOpacity={entry.isActive ? 0.9 : 0}
                                            />
                                        ))}
                                    </Bar>
                                </ComposedChart>
                            </ResponsiveContainer>

                            {/* Zone Legend */}
                            <div className="chart-legend">
                                <div className="legend-item">
                                    <span className="legend-color night"></span>
                                    Gece (Ucuz)
                                </div>
                                <div className="legend-item">
                                    <span className="legend-color peak"></span>
                                    Pik (Pahalı)
                                </div>
                                <div className="legend-item">
                                    <span className="legend-color evening"></span>
                                    Akşam (Orta)
                                </div>
                            </div>
                        </div>

                        {/* Explanation */}
                        <div className="energy-explanation">
                            <h4>🎓 Nasıl Çalışır?</h4>
                            <p>
                                <strong>Problem:</strong> Geleneksel planlama, fırını vardiya başlangıcında (08:00 - Pahalı saatler) açar.
                            </p>
                            <p>
                                <strong>Çözüm:</strong> AI, fırının termal ataleti'ni (ısınma süresi) bilir ve ısıtmayı ucuz saatlere kaydırır.
                                Böylece en çok enerji tüketen "ısınma fazı" ucuz tarife bölgesine denk gelir.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EnergyOptimizationModule;
