/**
 * Mock Data for Static Frontend
 * Pre-generated data for all modules - no backend required
 * Types are inferred for flexibility
 */

// ============================================
// PREDICTIVE MAINTENANCE
// ============================================
export const predictiveMaintenanceData = {
    machines: [
        { machine_id: "CNC-001", machine_name: "CNC Torna #1", health_score: 94, risk_level: "low" as const, predicted_failure_days: null, last_maintenance: "2024-12-15", next_scheduled: "2025-01-15", vibration_trend: [2.1, 2.2, 2.0, 2.1, 2.3], temperature_trend: [45, 46, 45, 44, 45] },
        { machine_id: "CNC-002", machine_name: "CNC Freze #2", health_score: 78, risk_level: "medium" as const, predicted_failure_days: 12, last_maintenance: "2024-11-28", next_scheduled: "2025-01-10", vibration_trend: [3.1, 3.2, 3.5, 3.8, 4.0], temperature_trend: [55, 58, 60, 62, 65] },
        { machine_id: "PRS-001", machine_name: "Hidrolik Pres #1", health_score: 45, risk_level: "high" as const, predicted_failure_days: 3, last_maintenance: "2024-10-05", next_scheduled: "2025-01-02", vibration_trend: [4.5, 5.0, 5.5, 6.0, 6.5], temperature_trend: [70, 72, 75, 78, 80] },
        { machine_id: "WLD-001", machine_name: "Kaynak Robotu #1", health_score: 88, risk_level: "low" as const, predicted_failure_days: null, last_maintenance: "2024-12-20", next_scheduled: "2025-02-20", vibration_trend: [1.5, 1.4, 1.5, 1.6, 1.5], temperature_trend: [40, 41, 40, 42, 41] },
        { machine_id: "ASM-001", machine_name: "Montaj Hattı #1", health_score: 62, risk_level: "medium" as const, predicted_failure_days: 8, last_maintenance: "2024-11-15", next_scheduled: "2025-01-08", vibration_trend: [2.8, 3.0, 3.2, 3.5, 3.8], temperature_trend: [50, 52, 55, 58, 60] },
        { machine_id: "CNC-003", machine_name: "5 Eksen CNC", health_score: 28, risk_level: "critical" as const, predicted_failure_days: 1, last_maintenance: "2024-09-20", next_scheduled: "2025-01-01", vibration_trend: [6.0, 6.5, 7.0, 7.5, 8.0], temperature_trend: [80, 82, 85, 88, 90] }
    ],
    total_savings: 145000,
    prevented_downtime_hours: 320,
    roi_percentage: 285
};

// ============================================
// OEE METRICS
// ============================================
export const oeeData = {
    availability: 85.2,
    performance: 91.3,
    quality: 93.1,
    oee: 72.5,
    trend_data: [
        { month: "Oca", before_ai: 65, after_ai: 72 },
        { month: "Şub", before_ai: 66, after_ai: 74 },
        { month: "Mar", before_ai: 64, after_ai: 75 },
        { month: "Nis", before_ai: 68, after_ai: 78 },
        { month: "May", before_ai: 67, after_ai: 80 },
        { month: "Haz", before_ai: 70, after_ai: 82 }
    ],
    bottleneck_analysis: [
        { machine: "CNC-003", downtime_hours: 45, cause: "Rulman aşınması", impact: "Yüksek" },
        { machine: "PRS-001", downtime_hours: 32, cause: "Hidrolik sızıntı", impact: "Orta" },
        { machine: "ASM-001", downtime_hours: 18, cause: "Sensör arızası", impact: "Düşük" }
    ],
    improvement_potential: 15.5,
    monthly_gain: 125000
};

// ============================================
// ENERGY DATA
// ============================================
export const energyData = {
    current_consumption: 45820,
    optimized_consumption: 38950,
    savings_percentage: 15.0,
    carbon_reduction: 23.4,
    cost_savings: 28500,
    hourly_data: Array.from({ length: 24 }, (_, i) => ({
        hour: `${i.toString().padStart(2, '0')}:00`,
        current: 200 + Math.sin(i / 24 * Math.PI * 2) * 100 + (i >= 8 && i <= 18 ? 400 : 0),
        optimized: 180 + Math.sin(i / 24 * Math.PI * 2) * 80 + (i >= 8 && i <= 18 ? 320 : 0),
        peak: i >= 17 && i <= 20
    })),
    recommendations: [
        { title: "HVAC Optimizasyonu", savings: "12.500 TL/ay", implementation: "2 hafta" },
        { title: "Pik Yük Kaydırma", savings: "8.200 TL/ay", implementation: "1 ay" },
        { title: "LED Aydınlatma", savings: "4.800 TL/ay", implementation: "2 hafta" }
    ]
};

// ============================================
// QUALITY DATA
// ============================================
export const qualityData = {
    current_scrap_rate: 2.8,
    predicted_scrap_rate: 1.2,
    defect_detection_accuracy: 97.5,
    cost_savings: 85000,
    defect_types: [
        { type: "Boyutsal Sapma", count: 45, percentage: 35, cost: 12500 },
        { type: "Yüzey Hatası", count: 32, percentage: 25, cost: 8900 },
        { type: "Montaj Hatası", count: 26, percentage: 20, cost: 7200 },
        { type: "Malzeme Hatası", count: 15, percentage: 12, cost: 4100 },
        { type: "Diğer", count: 10, percentage: 8, cost: 2800 }
    ],
    quality_trend: [
        { month: "Oca", scrap_rate: 3.5, ai_scrap_rate: 1.8 },
        { month: "Şub", scrap_rate: 3.2, ai_scrap_rate: 1.5 },
        { month: "Mar", scrap_rate: 3.0, ai_scrap_rate: 1.3 },
        { month: "Nis", scrap_rate: 2.8, ai_scrap_rate: 1.2 },
        { month: "May", scrap_rate: 2.9, ai_scrap_rate: 1.2 },
        { month: "Haz", scrap_rate: 2.8, ai_scrap_rate: 1.1 }
    ],
    risk_areas: [
        { area: "CNC İşleme", risk_score: 75, main_issue: "Takım aşınması" },
        { area: "Kaynak", risk_score: 45, main_issue: "Sıcaklık kontrolü" },
        { area: "Montaj", risk_score: 30, main_issue: "Operatör hatası" }
    ]
};

// ============================================
// PRODUCTION PLAN
// ============================================
export const planningData = {
    current_capacity_usage: 72,
    optimized_capacity_usage: 88,
    on_time_delivery_current: 85,
    on_time_delivery_optimized: 96,
    schedule_data: [
        { id: "ORD-001", customer: "ABC Otomotiv", product: "Motor Bloğu A", quantity: 500, start: "2024-12-28", end: "2024-12-30", machine: "CNC-001", status: "devam" as const },
        { id: "ORD-002", customer: "XYZ Makine", product: "Şanzıman Dişlisi", quantity: 1200, start: "2024-12-31", end: "2025-01-03", machine: "CNC-002", status: "bekliyor" as const },
        { id: "ORD-003", customer: "DEF Parça", product: "Fren Diski", quantity: 800, start: "2024-12-29", end: "2025-01-02", machine: "PRS-001", status: "devam" as const },
        { id: "ORD-004", customer: "GHI Endüstri", product: "Krank Mili", quantity: 200, start: "2024-12-25", end: "2024-12-27", machine: "CNC-003", status: "tamamlandı" as const }
    ],
    scenarios: [
        { name: "Mevcut Plan", completion: "2025-01-05", cost: 125000, efficiency: 72 },
        { name: "AI Optimizeli", completion: "2025-01-02", cost: 98000, efficiency: 88 },
        { name: "Acil Mod", completion: "2024-12-31", cost: 145000, efficiency: 95 }
    ],
    inventory_savings: 45000
};

// ============================================
// ANOMALY DATA
// ============================================
export const anomalyData = {
    total_anomalies_detected: 156,
    prevented_incidents: 23,
    accuracy: 92.3,
    alerts: [
        { id: 1, timestamp: "2024-12-28T14:32:00", machine: "CNC-003", type: "Titreşim", severity: "critical" as const, message: "Kritik titreşim seviyesi tespit edildi" },
        { id: 2, timestamp: "2024-12-28T13:15:00", machine: "PRS-001", type: "Basınç", severity: "high" as const, message: "Hidrolik basınç düşüşü" },
        { id: 3, timestamp: "2024-12-28T11:45:00", machine: "CNC-002", type: "Sıcaklık", severity: "medium" as const, message: "Rulman sıcaklığı normalin üstünde" }
    ],
    sensor_data: [
        { sensor: "VIB-001", value: 3.2, unit: "mm/s", threshold: 5.0, status: "normal" as const },
        { sensor: "TMP-001", value: 68, unit: "°C", threshold: 75, status: "warning" as const },
        { sensor: "PRS-001", value: 145, unit: "bar", threshold: 160, status: "critical" as const }
    ],
    risk_score: 72
};

// ============================================
// COPILOT DATA
// ============================================
export const copilotData = {
    kpi_summary: [
        { name: "OEE", value: "72.5", unit: "%", change: 8.5, trend: "up" as const },
        { name: "Hata Oranı", value: "2.8", unit: "%", change: -15, trend: "down" as const },
        { name: "Enerji", value: "45.8", unit: "MWh", change: -12, trend: "down" as const },
        { name: "Verimlilik", value: "88", unit: "%", change: 5, trend: "up" as const }
    ],
    recommendations: [
        { priority: "critical" as const, title: "Acil Bakım Önerisi", description: "CNC-003 makinesi kritik durumda", action: "24 saat içinde bakım planla", potential_savings: "45.000 TL" },
        { priority: "high" as const, title: "Enerji Optimizasyonu", description: "Gece vardiyasında HVAC tasarrufu", action: "Otomasyon kuralı ekle", potential_savings: "8.500 TL" },
        { priority: "medium" as const, title: "Üretim Planı", description: "ORD-002 siparişini öne al", action: "Planı güncelle", potential_savings: "12.000 TL" }
    ],
    chat_examples: [
        { question: "Hangi makineler risk altında?", answer: "CNC-003 kritik durumda (sağlık: %28). PRS-001 yüksek risk altında." },
        { question: "Bu ay ne kadar tasarruf edebiliriz?", answer: "Önerilen aksiyonlarla toplam 65.500 TL tasarruf potansiyeli var." }
    ],
    decision_speed_improvement: 45,
    cost_reduction: 18
};

// ============================================
// COPILOT CHAT RESPONSES
// ============================================
export const copilotResponses: Record<string, string> = {
    "bakım": "Bakım önerileri: CNC-003 acil bakım gerektiriyor (kritik). PRS-001 için 3 gün içinde planlı bakım yapılmalı.",
    "enerji": "Enerji analizi: Günlük ortalama tüketim 6.546 kWh. HVAC optimizasyonu ile %12.5 tasarruf potansiyeli var.",
    "kalite": "Kalite raporu: Hata oranı %2.8, ilk geçiş verimi %97.2. En yaygın hata: Boyutsal Sapma (%35).",
    "üretim": "Üretim durumu: 4 aktif sipariş. ORD-001 %65 tamamlandı. Darboğaz: CNC-003 bakım bekliyor.",
    "risk": "Risk analizi: CNC-003 kritik (%28), 1 gün içinde arıza riski. Toplam 6 makineden 3'ü sağlıklı.",
    "default": "ACD Endüstriyel AI Platformu'na hoş geldiniz! Bakım, enerji, kalite veya üretim hakkında soru sorabilirsiniz."
};

export function getCopilotResponse(message: string): string {
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes("bakım") || lowerMessage.includes("maintenance")) return copilotResponses["bakım"];
    if (lowerMessage.includes("enerji") || lowerMessage.includes("energy")) return copilotResponses["enerji"];
    if (lowerMessage.includes("kalite") || lowerMessage.includes("quality")) return copilotResponses["kalite"];
    if (lowerMessage.includes("üretim") || lowerMessage.includes("production")) return copilotResponses["üretim"];
    if (lowerMessage.includes("risk") || lowerMessage.includes("makine")) return copilotResponses["risk"];
    return copilotResponses["default"];
}
