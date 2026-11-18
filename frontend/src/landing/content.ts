import type { ModuleType } from '../types';

// ============================================
// v3 içerik modeli — "Tailored, not packaged"
// Anlatı kaynağı: ACD Kısa Sunum 2026 (Industrial AI Nexus bölümü)
// ============================================

export const CONTACT_EMAIL = 'info@acd.com.tr';

export interface Sector {
  id: string;
  label: string;
  note: string;
}

export const SECTORS: Sector[] = [
  { id: 'otomotiv', label: 'Otomotiv & Yan Sanayi', note: 'Yüksek hacimli üretimde planlama, kalite ve izlenebilirlik birlikte ele alınır; çözüm hat ritmine göre ayarlanır.' },
  { id: 'metal', label: 'Makine & Metal İşleme', note: 'Setup süreleri, takım aşınması ve spindle yükü modelin ana sinyalleri olur.' },
  { id: 'kimya', label: 'Kimya & Proses', note: 'Süreç parametreleri, kalite ve enerji performansı aynı veri katmanında izlenir.' },
  { id: 'ilac', label: 'İlaç & Medikal', note: 'Regülasyon uyumu ve dokümantasyon; QC laboratuvar verisi çözümün parçası olur.' },
  { id: 'gida', label: 'Gıda & İçecek', note: 'Hijyen ve izlenebilirlik kısıtları kamera ve sensör yerleşimini belirler.' },
  { id: 'enerji', label: 'Enerji Yoğun Tesisler', note: 'Tüketim profili, tarife ve üretim planı birlikte optimize edilir.' },
];

export type DataSourceId = 'sensor' | 'plc' | 'kamera' | 'mes' | 'sayac' | 'telemetri' | 'lab';

export const DATA_SOURCES: { id: DataSourceId; label: string }[] = [
  { id: 'sensor', label: 'Titreşim / sıcaklık sensörü' },
  { id: 'plc', label: 'PLC / SCADA' },
  { id: 'kamera', label: 'Hat kamerası' },
  { id: 'mes', label: 'MES / ERP kayıtları' },
  { id: 'sayac', label: 'Enerji sayacı' },
  { id: 'telemetri', label: 'Telemetri (CAN-Bus, MQTT)' },
  { id: 'lab', label: 'QC / laboratuvar kayıtları' },
];

export interface Problem {
  id: string;
  label: string;
  blocks: string[];
  required: DataSourceId[];
  metric: string;
  firstStep: string;
  demo: ModuleType;
}

export const PROBLEMS: Problem[] = [
  { id: 'durus', label: 'Plansız duruşlar', blocks: ['Kestirimci Bakım', 'Anomali Tespiti'], required: ['sensor', 'plc'], metric: 'Plansız duruş saati / ay', firstStep: 'Kritik makine seçimi', demo: 'predictive-maintenance' },
  { id: 'fire', label: 'Yüksek fire / geç fark edilen hata', blocks: ['Kalite Vision', 'Anomali Tespiti'], required: ['kamera', 'plc'], metric: 'Fire oranı (%)', firstStep: 'İstasyon ve ışık analizi', demo: 'quality' },
  { id: 'oee', label: 'Hedefin altında OEE', blocks: ['Üretim Verimliliği', 'Üretim Planlama'], required: ['plc', 'mes'], metric: 'OEE (%)', firstStep: 'Duruş kodu denetimi', demo: 'oee' },
  { id: 'enerji', label: 'Kontrolsüz enerji maliyeti', blocks: ['Enerji Optimizasyonu', 'Üretim Planlama'], required: ['sayac', 'mes'], metric: 'kWh / birim ürün', firstStep: 'Tüketim profili çıkarma', demo: 'energy' },
  { id: 'plan', label: 'Planlama karmaşası, uzun setup', blocks: ['Üretim Planlama', 'AI Copilot'], required: ['mes'], metric: 'Zamanında teslim (OTD)', firstStep: 'Setup matrisi çıkarma', demo: 'planning' },
  { id: 'proses', label: 'Proses / kalite sapmaları', blocks: ['Anomali Tespiti', 'AI Copilot'], required: ['plc', 'lab'], metric: 'Sapma tespit süresi', firstStep: 'Karanlık veri envanteri', demo: 'anomaly' },
  { id: 'guvenlik', label: 'Operatör / iş güvenliği riski', blocks: ['Kalite Vision (güvenlik bölgesi)'], required: ['kamera'], metric: 'Tehlikeli bölge ihlali / ay', firstStep: 'Risk noktası haritası', demo: 'quality' },
  { id: 'veri', label: 'Yönetim veriye ulaşamıyor', blocks: ['AI Copilot'], required: ['mes'], metric: 'Rapor hazırlama süresi', firstStep: 'Soru envanteri', demo: 'copilot' },
];

export interface SolutionBlock {
  code: string;
  scope: string;
  id: ModuleType;
  title: string;
  description: string;
}

export const BLOCKS: SolutionBlock[] = [
  { code: 'B-01', scope: 'VARLIK', id: 'predictive-maintenance', title: 'Kestirimci Bakım', description: 'Titreşim ve sıcaklıktan arıza riskini önceden görür.' },
  { code: 'B-02', scope: 'HAT', id: 'oee', title: 'Üretim Verimliliği', description: 'Dijital ikiz üzerinde OEE ve darboğaz analizi.' },
  { code: 'B-03', scope: 'TESİS', id: 'energy', title: 'Enerji Optimizasyonu', description: 'Tarifeye göre yük kaydırma ve karbon takibi.' },
  { code: 'B-04', scope: 'ÜRÜN', id: 'quality', title: 'Kalite & Fire (Vision)', description: 'Kamerayla hat üstü hata tespiti ve segmentasyon.' },
  { code: 'B-05', scope: 'PLAN', id: 'planning', title: 'Üretim Planlama', description: 'Setup süresini azaltan akıllı çizelgeleme.' },
  { code: 'B-06', scope: 'SÜREÇ', id: 'anomaly', title: 'Anomali Tespiti', description: 'Çoklu sensörde istatistiksel sapma ve erken uyarı.' },
  { code: 'B-07', scope: 'KARAR', id: 'copilot', title: 'AI Copilot', description: 'Fabrika verisini doğal dille sorgulama ve raporlama.' },
];

export interface CaseStudy {
  name: string;
  sector: string;
  problem: string;
  inputs: string[];
  outputs: string[];
  summary: string;
  videoId: string;
}

export const CASES: CaseStudy[] = [
  {
    name: 'AgroPulse AI',
    videoId: 'agropulse',
    sector: 'Tarım makineleri · Filo',
    problem: 'Sahadaki traktörlerde plansız arızalar',
    inputs: ['CAN-Bus telemetri', '6 aylık filo verisi', 'Düşük gecikmeli akış'],
    outputs: ['Kritik arızada ≥3 gün önceden uyarı', 'Risk trend analizi', 'Filo dashboard entegrasyonu'],
    summary: '5 kritik arıza tipi üzerine eğitilmiş, on-premise çalışan anomali tespit sistemi.',
  },
  {
    name: 'PharmAI',
    videoId: 'pharmai',
    sector: 'İlaç üretimi',
    problem: 'Hatlarda kullanılmayan "karanlık veri"',
    inputs: ['MQTT sensör verisi', 'CSV proses kayıtları', 'QC laboratuvar testleri'],
    outputs: ['Kestirimci uyarılar', 'Kök neden analizi (RCA)', 'Süreç optimizasyonu'],
    summary: 'Veriyi reaktif bir kayıt aracından proaktif bir stratejik varlığa dönüştüren dijital kontrol kulesi.',
  },
  {
    name: 'MB Process Guard',
    videoId: 'mixer',
    sector: 'Proses üretimi',
    problem: 'İnsan kaynaklı hatalı besleme sekansı (A-B-A-B dışı)',
    inputs: ['Endüstriyel kamera', 'Konveyör hattı'],
    outputs: ['Gerçek zamanlı sekans tespiti', 'İhlalde bandın otomatik durdurulması'],
    summary: 'Hatalı üretimi ve hammadde kaybını kaynağında, görüntü işleme ile durdurmayı hedefler.',
  },
  {
    name: 'RKVision Guard',
    videoId: 'rkvision',
    sector: 'İş güvenliği',
    problem: 'Operatör uzvunun tehlikeli bölgeye girmesi',
    inputs: ['Bölge kamerası', 'Makine durum sinyali'],
    outputs: ['İnsan hızının ötesinde tespit', '7/24 yorulmayan denetim'],
    summary: 'Fiziksel bariyerlerin ötesinde, tehlike ile operatör arasına dijital bir kalkan.',
  },
  {
    name: 'Synth Vision Suite',
    videoId: 'synthvision',
    sector: 'Görüntü verisi',
    problem: 'Kusur tespiti için yetersiz gerçek hata görüntüsü',
    inputs: ['Az sayıda gerçek görüntü', 'Senaryoya özel kusur tipleri'],
    outputs: ['Parametrik hata enjeksiyonu', 'Senaryoya özel LoRA', 'Gerçek ortamda kusur tespiti'],
    summary: 'GAN, diffusion ve harici modelleri tek platformda birleştiren sentetik veri üretim hattı.',
  },
];
