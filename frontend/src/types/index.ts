// API Types
export interface CompanyProfile {
  name: string;
  location: string;
  sector: string;
  employees: number;
  annual_revenue: number;
  cnc_machines: number;
  presses: number;
  welding_robots: number;
  current_oee: number;
  target_oee: number;
  annual_energy_cost: number;
}

export interface MachineHealth {
  machine_id: string;
  machine_name: string;
  health_score: number;
  predicted_failure_days: number | null;
  last_maintenance: string;
  next_scheduled: string;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  vibration_trend: number[];
  temperature_trend: number[];
}

export interface PredictiveMaintenanceData {
  company: CompanyProfile;
  machines: MachineHealth[];
  total_savings: number;
  prevented_downtime_hours: number;
  roi_percentage: number;
}

export interface OEEMetrics {
  availability: number;
  performance: number;
  quality: number;
  oee: number;
  trend_data: {
    month: string;
    before_ai: number;
    after_ai: number;
  }[];
  bottleneck_analysis: {
    machine: string;
    downtime_hours: number;
    cause: string;
    impact: string;
  }[];
  improvement_potential: number;
  monthly_gain: number;
}

export interface EnergyData {
  current_consumption: number;
  optimized_consumption: number;
  savings_percentage: number;
  carbon_reduction: number;
  cost_savings: number;
  hourly_data: {
    hour: string;
    current: number;
    optimized: number;
    peak: boolean;
  }[];
  recommendations: {
    title: string;
    savings: string;
    implementation: string;
  }[];
}

export interface QualityData {
  current_scrap_rate: number;
  predicted_scrap_rate: number;
  defect_detection_accuracy: number;
  cost_savings: number;
  defect_types: {
    type: string;
    count: number;
    percentage: number;
    cost: number;
  }[];
  quality_trend: {
    month: string;
    scrap_rate: number;
    ai_scrap_rate: number;
  }[];
  risk_areas: {
    area: string;
    risk_score: number;
    main_issue: string;
  }[];
}

export interface ProductionPlan {
  current_capacity_usage: number;
  optimized_capacity_usage: number;
  on_time_delivery_current: number;
  on_time_delivery_optimized: number;
  schedule_data: {
    id: string;
    customer: string;
    product: string;
    quantity: number;
    start: string;
    end: string;
    machine: string;
    status: 'tamamlandı' | 'devam' | 'bekliyor' | 'planlandı';
  }[];
  scenarios: {
    name: string;
    completion: string;
    cost: number;
    efficiency: number;
  }[];
  inventory_savings: number;
}

export interface AnomalyData {
  total_anomalies_detected: number;
  prevented_incidents: number;
  accuracy: number;
  alerts: {
    id: number;
    timestamp: string;
    machine: string;
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
  }[];
  sensor_data: {
    sensor: string;
    value: number;
    unit: string;
    threshold: number;
    status: 'normal' | 'warning' | 'critical';
  }[];
  risk_score: number;
}

export interface CopilotInsight {
  kpi_summary: {
    name: string;
    value: string;
    unit: string;
    change: number;
    trend: 'up' | 'down';
  }[];
  recommendations: {
    priority: 'critical' | 'high' | 'medium';
    title: string;
    description: string;
    action: string;
    potential_savings: string;
  }[];
  chat_examples: {
    question: string;
    answer: string;
  }[];
  decision_speed_improvement: number;
  cost_reduction: number;
}

export interface ROISummary {
  company: string;
  annual_revenue: number;
  ai_solutions: {
    name: string;
    annual_savings: number;
    roi_months: number;
  }[];
  total_annual_savings: number;
  average_roi_months: number;
  savings_percentage: number;
}

export type ModuleType = 
  | 'predictive-maintenance'
  | 'oee'
  | 'energy'
  | 'quality'
  | 'planning'
  | 'anomaly'
  | 'copilot';
