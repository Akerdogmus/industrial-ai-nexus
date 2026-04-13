// ============================================
// COMPUTER VISION MOCK DATA
// Simulated AI detection results for quality inspection
// ============================================

export interface Detection {
    id: number;
    label: string;
    labelEn: string;
    confidence: number;
    box: {
        top: number;    // % from top
        left: number;   // % from left
        width: number;  // % width
        height: number; // % height
    };
    type: 'critical' | 'minor' | 'noise';
    description: string;
    area?: string;  // e.g., "45mm²"
}

export interface InspectionSample {
    id: number;
    name: string;
    imageUrl: string;
    detections: Detection[];
    expectedResult: 'pass' | 'reject';
}

// ============================================
// INSPECTION SAMPLES (Conveyor Belt Simulation)
// ============================================
const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

export const INSPECTION_SAMPLES: InspectionSample[] = [
    {
        id: 1,
        name: "Parça #2847 - Temiz",
        imageUrl: `${BASE}/assets/images/gear_clean.jpg`,
        detections: [],
        expectedResult: 'pass'
    },
    {
        id: 2,
        name: "Parça #2848 - Hatalı",
        imageUrl: `${BASE}/assets/images/gear_inspection.jpg`,
        detections: [
            {
                id: 1,
                label: "Derin Çatlak",
                labelEn: "Deep Crack",
                confidence: 0.94,
                box: { top: 5, left: 42, width: 16, height: 48 },
                type: "critical",
                description: "Kritik yapısal çatlak tespit edildi - Parça kullanılamaz",
                area: "85.2mm²"
            },
            {
                id: 2,
                label: "Oksidasyon Lekesi",
                labelEn: "Oxidation Stain",
                confidence: 0.72,
                box: { top: 48, left: 44, width: 14, height: 14 },
                type: "minor",
                description: "Merkez bölgede renk değişimi - Pas başlangıcı olabilir",
                area: "12.4mm²"
            },
            {
                id: 3,
                label: "Yüzey Çizikleri",
                labelEn: "Surface Scratches",
                confidence: 0.48,
                box: { top: 32, left: 68, width: 18, height: 22 },
                type: "noise",
                description: "Hafif yüzey çizikleri - Kabul edilebilir tolerans içinde",
                area: "22.8mm²"
            }
        ],
        expectedResult: 'reject'
    },
    {
        id: 3,
        name: "Parça #2849 - Minör Hata",
        imageUrl: `${BASE}/assets/images/gear_clean.jpg`,
        detections: [
            {
                id: 4,
                label: "Eksik Diş",
                labelEn: "Missing Tooth",
                confidence: 0.88,
                box: { top: 12, left: 60, width: 15, height: 18 },
                type: "minor",
                description: "Dişli üzerinde kırık/eksik diş - Titreşim seviyesini artırabilir",
                area: "31.5mm²"
            },
            {
                id: 5,
                label: "Yağ Kalıntısı",
                labelEn: "Oil Residue",
                confidence: 0.41,
                box: { top: 55, left: 25, width: 20, height: 16 },
                type: "noise",
                description: "İşlem yağı kalıntısı - Temizlik gerekli",
                area: "8.7mm²"
            }
        ],
        expectedResult: 'reject'
    },
    {
        id: 4,
        name: "Parça #2850 - Kritik",
        imageUrl: `${BASE}/assets/images/gear_inspection.jpg`,
        detections: [
            {
                id: 6,
                label: "Merkez Delik Deformasyonu",
                labelEn: "Center Bore Deformation",
                confidence: 0.97,
                box: { top: 32, left: 35, width: 30, height: 30 },
                type: "critical",
                description: "Merkez montaj deliği ovalleşmiş - Mil bağlantısı güvensiz",
                area: "142.3mm²"
            },
            {
                id: 7,
                label: "Kenar Aşınması",
                labelEn: "Edge Wear",
                confidence: 0.65,
                box: { top: 5, left: 10, width: 22, height: 22 },
                type: "minor",
                description: "Sol üst kenarda aşınma izleri tespit edildi",
                area: "18.9mm²"
            },
            {
                id: 8,
                label: "Talaş İzi",
                labelEn: "Chip Mark",
                confidence: 0.38,
                box: { top: 70, left: 65, width: 12, height: 12 },
                type: "noise",
                description: "İşleme kalıntısı - Yüzey kalitesini etkilemez",
                area: "5.2mm²"
            }
        ],
        expectedResult: 'reject'
    }
];

// Legacy export for backward compatibility
export const MOCK_DETECTIONS = INSPECTION_SAMPLES[1].detections;
export const INSPECTION_IMAGE_URL = INSPECTION_SAMPLES[1].imageUrl;

// Helper function to get color based on detection type
export function getDetectionColor(type: Detection['type']): string {
    switch (type) {
        case 'critical': return '#ef4444'; // Red
        case 'minor': return '#f59e0b';    // Yellow/Amber
        case 'noise': return '#6b7280';    // Gray
    }
}

// Helper function to get Turkish type label
export function getTypeLabel(type: Detection['type']): string {
    switch (type) {
        case 'critical': return 'Kritik';
        case 'minor': return 'Minör';
        case 'noise': return 'Gürültü';
    }
}

// Confidence threshold presets
export const THRESHOLD_PRESETS = [
    { value: 0.3, label: 'Hassas', description: 'Tüm tespitleri göster (yüksek yanlış pozitif)' },
    { value: 0.5, label: 'Dengeli', description: 'Orta güvenilirlik eşiği' },
    { value: 0.8, label: 'Kesin', description: 'Sadece yüksek güvenli tespitler' },
];
