// Sahne bileşeni ve video tanımı bilerek aynı dosyada: fast refresh kısıtı bu modüller için önemsiz.
/* eslint-disable react-refresh/only-export-components */
import { C, FONT, MONO, bezier, easeOut, fade, lerp, rand, seg, type CaseVideo } from './engine';

function Tower({ x, y, glow }: { x: number; y: number; glow: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r={110} fill={C.accent} opacity={0.08 + glow * 0.12} />
      <ellipse cx={0} cy={70} rx={90} ry={18} fill="none" stroke={C.accent} strokeOpacity={0.4 + glow * 0.4} />
      <rect x={-46} y={56} width={92} height={14} rx={3} fill={C.panel2} stroke={C.ink3} />
      <polygon points="-22,56 22,56 14,-10 -14,-10" fill={C.panel2} stroke={C.ink2} />
      <rect x={-34} y={-34} width={68} height={24} rx={4} fill={C.panel} stroke={C.accent} strokeWidth={2} />
      <rect x={-26} y={-28} width={52} height={12} rx={2} fill={C.accent} opacity={0.35 + glow * 0.5} />
      <polygon points="-40,-34 40,-34 30,-48 -30,-48" fill={C.panel2} stroke={C.ink2} />
      <line x1={0} y1={-48} x2={0} y2={-70} stroke={C.ink2} strokeWidth={3} />
      <circle cx={0} cy={-72} r={4} fill={C.accent} opacity={0.4 + 0.6 * Math.min(1, glow)} />
    </g>
  );
}

const SOURCES = [
  { name: 'MQTT', sub: 'Sensör verileri' },
  { name: 'CSV', sub: 'Proses kayıtları' },
  { name: 'QC Lab', sub: 'Laboratuvar testleri' },
];

const CAUSES = [
  { name: 'Granülasyon nemi', v: 0.82 },
  { name: 'Karıştırma süresi', v: 0.46 },
  { name: 'Hammadde lotu', v: 0.28 },
];

function Stage({ t }: { t: number }) {
  const s1 = fade(t, 0, 6.4);
  const s2 = seg(t, 6, 6.8);
  const rca = seg(t, 12, 12.6);
  const act = seg(t, 18, 18.6);

  // karanlık veri ızgarası
  const cols = 32, rows = 14;
  const lit = seg(t, 3.5, 5.8);

  return (
    <svg viewBox="0 0 960 540" width="100%" role="img" aria-label="PharmAI animasyonu" style={{ display: 'block', background: C.bg }}>
      {/* Sahne 1 — karanlık veri */}
      <g opacity={s1}>
        {Array.from({ length: cols * rows }, (_, i) => {
          const cx = 60 + (i % cols) * 26.5;
          const cy = 190 + Math.floor(i / cols) * 22;
          const r = rand(i);
          const flicker = 0.12 + 0.18 * (0.5 + 0.5 * Math.sin(t * 3 + r * 20));
          const used = r < 0.08 * lit * 4;
          return <rect key={i} x={cx} y={cy} width={14} height={10} rx={2} fill={used ? C.accent : C.ink3} opacity={used ? 0.9 : flicker} />;
        })}
        <text x={480} y={92} textAnchor="middle" fontFamily={FONT} fontSize={30} fontWeight={600} fill={C.ink}>Hatlarda her saniye veri üretiliyor</text>
        <text x={480} y={130} textAnchor="middle" fontFamily={FONT} fontSize={20} fill={C.ink2}>
          {t < 3.5 ? 'Ama çoğu kayıtta kalıyor: karanlık veri.' : 'Karar için kullanılan pay ise küçük.'}
        </text>
      </g>

      {/* Sahne 2 — kaynaklar → kontrol kulesi */}
      <g opacity={s2}>
        <text x={40} y={56} fontFamily={MONO} fontSize={13} fill={C.accent}>KARANLIK VERİ → AKSİYONA DÖNÜŞTÜRÜLEBİLİR ZEKÂ</text>
        {SOURCES.map((s, i) => {
          const y = 150 + i * 110;
          const inP = easeOut(seg(t, 6.4 + i * 0.4, 7.4 + i * 0.4));
          const lineP = seg(t, 8 + i * 0.4, 9.6 + i * 0.4);
          return (
            <g key={s.name} opacity={inP} transform={`translate(${lerp(-40, 0, inP)} 0)`}>
              <rect x={40} y={y - 34} width={200} height={68} rx={10} fill={C.panel} stroke={C.line} />
              <circle cx={78} cy={y} r={18} fill={C.accentSoft} />
              <text x={78} y={y + 5} textAnchor="middle" fontFamily={MONO} fontSize={11} fill={C.accent}>{s.name.slice(0, 3)}</text>
              <text x={108} y={y - 4} fontFamily={FONT} fontWeight={600} fontSize={16} fill={C.ink}>{s.name}</text>
              <text x={108} y={y + 16} fontFamily={FONT} fontSize={13} fill={C.ink2}>{s.sub}</text>
              <path d={`M240 ${y} C 310 ${y} 310 270 380 270`} pathLength={1} strokeDasharray="1" strokeDashoffset={1 - lineP} fill="none" stroke={C.accent} strokeWidth={2} />
              {lineP >= 1 && [0, 1, 2].map(k => {
                const [bx, by] = bezier([240, y], [310, y], [310, 270], [380, 270], (t * 0.5 + k / 3 + i * 0.1) % 1);
                return <circle key={k} cx={bx} cy={by} r={3.5} fill={C.accent} />;
              })}
            </g>
          );
        })}
        <Tower x={480} y={280} glow={seg(t, 10, 12) + act * 0.5} />
        <text x={480} y={410} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={24} fill={C.accent}>PharmAI</text>
        <text x={480} y={436} textAnchor="middle" fontFamily={FONT} fontSize={15} fill={C.ink2}>Dijital kontrol kulesi</text>

        {/* Sahne 3 — kök neden analizi */}
        <g opacity={rca * (1 - act)}>
          <rect x={640} y={150} width={290} height={240} rx={10} fill={C.panel} stroke={C.line} />
          <text x={660} y={182} fontFamily={MONO} fontSize={12} fill={C.accent}>KÖK NEDEN ANALİZİ (RCA)</text>
          <text x={660} y={206} fontFamily={FONT} fontSize={14} fill={C.ink2}>Sapma: tablet sertliği</text>
          {CAUSES.map((c, i) => {
            const w = 250 * c.v * easeOut(seg(t, 13 + i * 0.5, 14.5 + i * 0.5));
            return (
              <g key={c.name}>
                <text x={660} y={244 + i * 48} fontFamily={FONT} fontSize={13} fill={C.ink}>{c.name}</text>
                <rect x={660} y={252 + i * 48} width={250} height={12} rx={6} fill={C.line} />
                <rect x={660} y={252 + i * 48} width={w} height={12} rx={6} fill={i === 0 ? C.accent : C.ink3} />
              </g>
            );
          })}
        </g>

        {/* Sahne 4 — aksiyon kartları */}
        <g opacity={act}>
          {[
            { k: 'KESTİRİMCİ UYARI', v: 'Sertlik sapması bekleniyor', c: C.accent },
            { k: 'KÖK NEDEN', v: 'Granülasyon nemi', c: C.warn },
            { k: 'SÜREÇ ÖNERİSİ', v: 'Kurutma süresini ayarla', c: C.ok },
          ].map((a, i) => {
            const p = easeOut(seg(t, 18.4 + i * 0.6, 19.2 + i * 0.6));
            return (
              <g key={a.k} opacity={p} transform={`translate(${lerp(700, 650, p)} ${150 + i * 90})`}>
                <path d={`M-80 34 L0 34`} stroke={a.c} strokeWidth={2} strokeDasharray="4 4" />
                <rect width={280} height={68} rx={10} fill={C.panel} stroke={a.c} />
                <text x={16} y={26} fontFamily={MONO} fontSize={11} fill={a.c}>{a.k}</text>
                <text x={16} y={50} fontFamily={FONT} fontSize={16} fill={C.ink}>{a.v}</text>
              </g>
            );
          })}
          <text x={480} y={500} textAnchor="middle" fontFamily={FONT} fontSize={19} fill={C.ink2} opacity={seg(t, 21, 21.8)}>
            Veri reaktif bir kayıttan proaktif bir stratejik varlığa dönüşür.
          </text>
        </g>
      </g>
    </svg>
  );
}

export const pharmAIVideo: CaseVideo = {
  id: 'pharmai',
  title: 'PharmAI',
  subtitle: 'Karanlık veriden otonom kalite zekâsına',
  duration: 24,
  poster: 20.5,
  chapters: [
    { start: 0, label: 'Sorun', caption: 'Üretim hatlarındaki verinin çoğu kayıtta kalıyor: karanlık veri.' },
    { start: 6, label: 'Veri', caption: 'MQTT sensör verisi, CSV proses kayıtları ve QC testleri tek kontrol kulesinde birleşiyor.' },
    { start: 12, label: 'Analiz', caption: 'Kök neden analizi sapmanın asıl kaynağını önceliklendiriyor.' },
    { start: 18, label: 'Aksiyon', caption: 'Kestirimci uyarılar ve süreç önerileriyle kalite proaktif yönetiliyor.' },
  ],
  Stage,
};
