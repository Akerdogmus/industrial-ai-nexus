/**
 * AI Copilot Engine
 * Keyword-based RAG (Retrieval-Augmented Generation) Simulation
 * Simulates an industrial AI assistant with source citations
 */

// ============================================
// TYPES
// ============================================

export interface CopilotResponse {
    answer: string;
    source: string;
    sourceType: 'log' | 'document' | 'analytics' | 'system';
    confidence: number;
    actionTaken?: string;
    chartData?: SparklineData[];
}

export interface SparklineData {
    value: number;
    label?: string;
}

export interface ThinkingStep {
    text: string;
    icon: string;
    duration: number;
}

interface ResponseTemplate {
    keywords: string[];
    answer: string;
    source: string;
    sourceType: 'log' | 'document' | 'analytics' | 'system';
    confidence: number;
    actionTaken?: string;
    chartData?: SparklineData[];
}

// ============================================
// KNOWLEDGE BASE
// ============================================

const KNOWLEDGE_BASE: ResponseTemplate[] = [
    // Arıza / Duruş Sorguları
    {
        keywords: ['neden', 'durdu', 'arıza', 'stop', 'duruş', 'hata'],
        answer: `Sistem loglarına göre, **CNC-02 Kesim İstasyonu** dün saat 14:30'da **Hidrolik Basınç Düşüklüğü** nedeniyle 45 dakika durdu.

**Detaylar:**
- Başlangıç: 14:30
- Bitiş: 15:15
- Toplam Duruş: 45 dakika
- Etkilenen Üretim: ~120 parça

**Kök Neden Analizi:** Hidrolik pompa filtresi tıkanıklığı tespit edildi.`,
        source: 'Maintenance_Log_2024.json',
        sourceType: 'log',
        confidence: 98,
        actionTaken: 'Teknik servis çağrısı #445 oluşturuldu.'
    },

    // OEE / Verimlilik Sorguları
    {
        keywords: ['verimlilik', 'oee', 'performans', 'üretim', 'efficiency'],
        answer: `Güncel üretim verimliliği (OEE) metrikleri:

| Metrik | Değer | Trend |
|--------|-------|-------|
| **Toplam OEE** | %78 | ↓ 5% |
| Kullanılabilirlik | %92 | → |
| Performans | %85 | ↓ |
| Kalite | %99.2 | ↑ |

**Analiz:** Geçen haftaya göre %5 düşüş var. Darboğaz **Montaj İstasyonu**'nda tespit edildi. Setup süreleri normalin %20 üzerinde.`,
        source: 'Realtime_Analytics_Engine',
        sourceType: 'analytics',
        confidence: 95,
        chartData: [
            { value: 82, label: 'Pzt' },
            { value: 85, label: 'Sal' },
            { value: 78, label: 'Çar' },
            { value: 80, label: 'Per' },
            { value: 78, label: 'Cum' }
        ]
    },

    // Maliyet / Tahmin Sorguları
    {
        keywords: ['maliyet', 'tahmin', 'bütçe', 'harcama', 'bakım', 'cost'],
        answer: `**Gelecek Ay Bakım Maliyet Tahmini:**

💰 **Toplam Tahmin:** ₺127,500

**Dağılım:**
- Planlı Bakım: ₺85,000 (67%)
- Kestirimci Bakım: ₺22,500 (18%)
- Acil Müdahale Karşılığı: ₺20,000 (15%)

**AI Önerisi:** CNC-02 için önleyici bakım yapılırsa acil müdahale maliyetinden **₺35,000 tasarruf** sağlanabilir.`,
        source: 'Financial_Projections_Q1.xlsx',
        sourceType: 'document',
        confidence: 87,
        actionTaken: 'Bakım planı taslağı oluşturuldu.'
    },

    // Prosedür / Kılavuz Sorguları
    {
        keywords: ['prosedür', 'kılavuz', 'talimat', 'acil', 'emergency', 'stop_procedure'],
        answer: `**Acil Stop Prosedürü (SOP-EM-001):**

1. 🔴 **Kırmızı Acil Stop butonuna** basın
2. ⚠️ Makinenin tamamen durduğunu **görsel olarak** doğrulayın
3. 🔒 Enerji kesme prosedürünü uygulayın (LOTO)
4. 📋 Olay raporunu **2 saat içinde** sisteme girin
5. 👷 Yetkili teknisyeni çağırın

> ⚡ **Uyarı:** Acil stop sonrası makineyi yeniden başlatmak için supervisor onayı gereklidir.`,
        source: 'Operator_Handbook_v3.2.pdf (Sayfa 45)',
        sourceType: 'document',
        confidence: 100
    },

    // Enerji Sorguları
    {
        keywords: ['enerji', 'elektrik', 'tüketim', 'kwh', 'güç', 'power'],
        answer: `**Günlük Enerji Tüketim Analizi:**

⚡ **Toplam:** 4,250 kWh
💵 **Maliyet:** ₺8,925

**Saat Bazlı Dağılım:**
- Pik Saatler (17:00-22:00): 1,850 kWh → ₺5,180
- Normal Saatler: 2,400 kWh → ₺3,745

**AI Önerisi:** Fırın ısıtma çizelgesi gece tarifesine kaydırılırsa günlük **₺1,230 tasarruf** mümkün.`,
        source: 'Energy_Dashboard_Live',
        sourceType: 'analytics',
        confidence: 94,
        chartData: [
            { value: 180, label: '06:00' },
            { value: 220, label: '09:00' },
            { value: 280, label: '12:00' },
            { value: 320, label: '15:00' },
            { value: 380, label: '18:00' },
            { value: 250, label: '21:00' }
        ]
    },

    // Kalite Sorguları
    {
        keywords: ['kalite', 'hata', 'fire', 'defect', 'kusur', 'ret'],
        answer: `**Kalite Kontrol Özeti (Son 24 Saat):**

✅ **Toplam Kontrol:** 1,247 parça
❌ **Red Edilen:** 8 parça (%0.64)

**Hata Türleri:**
1. Yüzey çizikleri: 4 adet
2. Boyut sapması: 3 adet
3. Renk uyumsuzluğu: 1 adet

**Kök Neden:** Yüzey çiziklerinin kaynağı, Kaynak İstasyonu'ndaki tutucudaki aşınma olarak tespit edildi.`,
        source: 'Quality_Inspection_Log.csv',
        sourceType: 'log',
        confidence: 96,
        actionTaken: 'Tutucu değişimi iş emri #892 oluşturuldu.'
    },

    // Makine Durumu Sorguları
    {
        keywords: ['makine', 'durum', 'sağlık', 'health', 'status', 'hangi'],
        answer: `**Makine Sağlık Durumu:**

| Makine | Sağlık | Risk | Sonraki Bakım |
|--------|--------|------|---------------|
| CNC-01 | %94 | 🟢 Düşük | 15 gün |
| CNC-02 | %67 | 🟡 Orta | 3 gün |
| Kaynak-01 | %88 | 🟢 Düşük | 22 gün |
| Montaj-01 | %45 | 🔴 Yüksek | **ACİL** |

⚠️ **Öncelikli Aksiyon:** Montaj-01 için acil bakım planlanmalı. Rulman titreşimi kritik seviyede.`,
        source: 'Predictive_Maintenance_AI',
        sourceType: 'analytics',
        confidence: 92
    },

    // Sipariş / Planlama Sorguları
    {
        keywords: ['sipariş', 'plan', 'termin', 'teslimat', 'order', 'schedule'],
        answer: `**Aktif Sipariş Durumu:**

📦 **Toplam Açık Sipariş:** 12
✅ **Zamanında Teslim Oranı:** %94

**Öncelikli Siparişler:**
1. **ORD-2024-156** - ABC Otomotiv
   - Deadline: 2 gün
   - Tamamlanma: %78
   - Durum: 🟢 Yolunda

2. **ORD-2024-159** - XYZ Makina
   - Deadline: 5 gün
   - Tamamlanma: %45
   - Durum: 🟡 Risk altında

**AI Önerisi:** XYZ Makina siparişi için fazla mesai planlanırsa terminle yakalanabilir.`,
        source: 'Production_Planning_System',
        sourceType: 'analytics',
        confidence: 89
    }
];

// ============================================
// THINKING STEPS
// ============================================

export const THINKING_STEPS: ThinkingStep[] = [
    { text: 'Bakım logları taranıyor...', icon: '🔍', duration: 600 },
    { text: 'İlgili dökümanlar getiriliyor...', icon: '📄', duration: 500 },
    { text: 'Sensör verileri analiz ediliyor...', icon: '📊', duration: 400 },
    { text: 'Sonuçlar derleniyor...', icon: '💡', duration: 300 }
];

// ============================================
// HELPER FUNCTIONS
// ============================================

const delay = (ms: number): Promise<void> =>
    new Promise(resolve => setTimeout(resolve, ms));

const normalizeText = (text: string): string =>
    text.toLowerCase()
        .replace(/ı/g, 'i')
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ş/g, 's')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c');

// ============================================
// MAIN QUERY FUNCTION
// ============================================

export const queryCopilot = async (text: string): Promise<CopilotResponse> => {
    // Simulate RAG retrieval delay
    await delay(1800);

    const normalizedQuery = normalizeText(text);

    // Find matching response based on keywords
    const matchedTemplate = KNOWLEDGE_BASE.find(template =>
        template.keywords.some(keyword =>
            normalizedQuery.includes(normalizeText(keyword))
        )
    );

    if (matchedTemplate) {
        return {
            answer: matchedTemplate.answer,
            source: matchedTemplate.source,
            sourceType: matchedTemplate.sourceType,
            confidence: matchedTemplate.confidence,
            actionTaken: matchedTemplate.actionTaken,
            chartData: matchedTemplate.chartData
        };
    }

    // Fallback response
    return {
        answer: `Üzgünüm, bu konuda veritabanımda yeterli bilgi bulamadım. 

**Şu konularda size yardımcı olabilirim:**
- Makine arızaları ve duruş nedenleri
- Üretim verimliliği (OEE) metrikleri
- Bakım maliyet tahminleri
- Operasyonel prosedürler
- Enerji tüketim analizi
- Kalite kontrol raporları

Lütfen sorunuzu yeniden ifade edin veya yukarıdaki konulardan birini seçin.`,
        source: 'System',
        sourceType: 'system',
        confidence: 0
    };
};

// ============================================
// QUICK PROMPTS
// ============================================

export const QUICK_PROMPTS = [
    { label: 'Durum Kontrol', text: 'Makinelerin güncel sağlık durumu nedir?' },
    { label: 'Arıza Analizi', text: 'CNC-02 neden dün durdu?' },
    { label: 'Verimlilik', text: 'Güncel OEE değeri nedir?' },
    { label: 'Maliyet Tahmini', text: 'Gelecek ay bakım maliyet tahmini nedir?' },
    { label: 'Enerji Raporu', text: 'Bugünkü enerji tüketimi nasıl?' },
    { label: 'Acil Prosedür', text: 'Acil stop prosedürü nedir?' }
];
