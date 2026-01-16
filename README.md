# ACD Industrial AI Nexus (AI Toolkit Demo Platform)

Industrial AI Nexus, endüstriyel yapay zeka çözümlerinin değerini somutlaştırmak amacıyla geliştirilen, kurulum gerektirmeyen, tarayıcı tabanlı (Client-Side) bir interaktif demo platformu

## 🚀 Hızlı Başlangıç

### Windows (Kolay kullanım)
**Çift tıklayın:** `start_demo.bat`

Demo birkaç saniye içinde tarayıcınızda otomatik açılacaktır (http://localhost:3000).

Durdurmak için: Komut penceresinde **ENTER** tuşuna basın veya `stop_demo.bat` çalıştırın.

### Geliştirici Modu

#### Gereksinimler
- Node.js 18+

#### Kurulum ve Çalıştırma
```bash
cd frontend
npm install
npm run dev
```

Varsayılan adres: http://localhost:3000

## 📊 Demo Modülleri

| Modül | Açıklama | Potansiyel Kazanım |
|-------|----------|-------------------|
| **Kestirimci Bakım** | Canlı sensör simülasyonu ile arıza risk tahmini | %25-30 maliyet azaltma |
| **Üretim Verimliliği** | OEE optimizasyonu, kuyruk teorisi, darboğaz analizi | %10-25 OEE artışı |
| **Enerji Optimizasyonu** | Enerji ve karbon yönetimi | %22 tasarruf |
| **Kalite & Fire** | Kalite riski tahmini | %35 fire azaltma |
| **Üretim Planlama** | Kapasite optimizasyonu | %25 teslimat iyileştirme |
| **Anomali Tespiti** | Erken uyarı sistemi | %94.5 doğruluk |
| **AI Copilot** | Karar destek asistanı | %35 hız artışı |

## 🏭 Demo Senaryoları

Her modül, endüstrinin farklı bir alanındaki spesifik bir problemi ele alan **bağımsız** bir kullanım senaryosu sunar:

- **Kestirimci Bakım:** CNC tezgahlarında titreşim ve sıcaklık verisi üzerinden rulman arıza tahmini.
- **Üretim Verimliliği:** Şişeleme hattındaki darboğazların "Digital Twin" ile analizi.
- **Enerji Optimizasyonu:** Endüstriyel bir fırının elektrik tarifesine göre akıllı yük planlaması.
- **Kalite Kontrol:** Üretim hattından geçen metal parçaların kamera ile yüzey hatası denetimi.
- **Üretim Planlama:** Karmaşık siparişlerin setup sürelerini minimize edecek şekilde otomatik çizelgelenmesi.
- **Anomali Tespiti:** Yüksek frekanslı sensör verilerindeki (akım/voltaj) ani sapmaların yakalanması.
- **AI Copilot:** Fabrika yöneticisinin doğal dil ile geçmiş üretim verilerini ve bakım raporlarını sorgulaması.

## 📁 Proje Yapısı

```
acd-ai-apps-catalog/
├── start_demo.bat     # Tek tıkla çalıştır
├── stop_demo.bat      # Durdur
├── README.md
└── frontend/          # React + Vite + TypeScript
    ├── src/
    │   ├── components/    # Modül bileşenleri
    │   ├── engines/       # Simülasyon motorları
    │   ├── App.tsx        # Ana uygulama
    │   └── index.css      # Stiller
    └── package.json
```

## 🛠️ Teknolojiler

- **Frontend:** React 19, TypeScript, Vite, Recharts, Framer Motion
- **Simülasyon:** Tamamen frontend tarafında TypeScript ile
- **Tasarım:** Modern glassmorphism, dark theme, cyberpunk industrial UI

## ✨ Öne Çıkan Özellikler

### Kestirimci Bakım Modülü
- Canlı sensör veri akışı simülasyonu
- Risk seviyesi hesaplama
- Predictive insights

### Üretim Verimliliği Modülü (Digital Twin)
- Animasyonlu parçacık akışı
- OEE gauge göstergesi
- Darboğaz tespiti ve görselleştirme
- AI optimizasyon önerileri
- Kuyruk teorisi simülasyonu

### Enerji Optimizasyonu Modülü
- Akıllı fırın yük planlama simülasyonu
- Tarife bazlı maliyet hesaplama
- İnteraktif 24 saatlik ısı haritası
- Karbon ayak izi takibi

### Kalite & Fire Modülü (Computer Vision)
- Konveyör bant simülasyonu
- Çoklu görsel denetimi (Hatalı/Temiz parça)
- Gerçek zamanlı maskeleme animasyonu
- Hata segmentasyonu

### Üretim Planlama Modülü
- İnteraktif Gantt şeması
- Manuel vs AI planlama karşılaştırması
- Setup süresi minimizasyonu
- Dinamik iş emri yönetimi

### Anomali Tespiti Modülü
- Gerçek zamanlı sinyal analizi
- Gürültü ve anomali enjeksiyonu
- Eşik değeri aşımı görselleştirme
- Titreşim ve sıcaklık korelasyonu

### AI Copilot
- RAG (Retrieval-Augmented Generation) simülasyonu
- Doğal dil işleme arayüzü
- Kaynak gösterme (Citation) ve güven skorları
- Düşünme adımları animasyonu (Chain of Thought)
- Dinamik grafik çizimi ve raporlama
- Typewriter efekti ve Markdown desteği
