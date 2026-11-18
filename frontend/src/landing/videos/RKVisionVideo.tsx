// Sahne bileşeni ve video tanımı bilerek aynı dosyada: fast refresh kısıtı bu modüller için önemsiz.
/* eslint-disable react-refresh/only-export-components */
import { C, FONT, MONO, easeInOut, fade, lerp, pulse, seg, type CaseVideo } from './engine';

const CX = 600, CY = 290;     // silindir merkezi
const WARN_R = 190, DANGER_R = 120;

// Uzvun uç noktası (x) zamana göre
const tipX = (t: number) => {
  const reach = easeInOut(seg(t, 5, 12.4));
  const back = easeInOut(seg(t, 17.5, 20));
  return lerp(lerp(150, 425, reach), 150, back);
};

// Silindir açısı: sabit hızla döner, 12.6–13.2 arası hızla durur, 20.5'ten sonra yeniden başlar
function angle(t: number) {
  const w = 300; // derece/sn
  const stopA = 11.8, stopB = 12.3, restart = 20.5;
  if (t < stopA) return t * w;
  if (t < stopB) { const p = (t - stopA) / (stopB - stopA); return stopA * w + w * (stopB - stopA) * (p - p * p / 2); }
  const frozen = stopA * w + w * (stopB - stopA) / 2;
  if (t < restart) return frozen;
  return frozen + (t - restart) * w * seg(t, restart, restart + 0.8);
}

function Stage({ t }: { t: number }) {
  const tip = tipX(t);
  const dist = CX - tip;
  const camOn = seg(t, 9, 9.5);
  const zone = !camOn ? 'idle' : dist < DANGER_R ? 'danger' : dist < WARN_R ? 'warn' : 'ok';
  const zoneColor = zone === 'danger' ? C.danger : zone === 'warn' ? C.warn : C.ok;
  const halted = t >= 11.8 && t < 20.5;
  const a = angle(t);

  return (
    <svg viewBox="0 0 960 540" width="100%" role="img" aria-label="RKVision Guard animasyonu" style={{ display: 'block', background: C.bg }}>
      <text x={40} y={56} fontFamily={MONO} fontSize={13} fill={C.accent}>RKVISION GUARD · OPERATÖR GÜVENLİĞİ</text>
      <g opacity={fade(t, 0, 5.2)}>
        <text x={40} y={100} fontFamily={FONT} fontSize={28} fontWeight={600} fill={C.ink}>Dönen silindir, fiziksel bariyer, insan refleksi</text>
      </g>
      <g opacity={fade(t, 5, 9.2)}>
        <text x={40} y={100} fontFamily={FONT} fontSize={28} fontWeight={600} fill={C.ink}>Bariyerin yetmediği an</text>
        <text x={40} y={132} fontFamily={FONT} fontSize={18} fill={C.warn}>Operatör uzvu tehlikeli bölgeye yaklaşıyor; refleks sınırlı</text>
      </g>
      <g opacity={fade(t, 9, 12.2)}>
        <text x={40} y={100} fontFamily={FONT} fontSize={28} fontWeight={600} fill={C.ink}>Kamera bölgeyi 7/24 izliyor</text>
      </g>

      {/* güvenlik bölgeleri */}
      <g opacity={camOn}>
        <circle cx={CX} cy={CY} r={WARN_R} fill={zone === 'warn' || zone === 'danger' ? C.warn : C.ok} fillOpacity={0.06} stroke={zone === 'idle' || zone === 'ok' ? C.ok : C.warn} strokeDasharray="8 6" strokeWidth={1.5} />
        <circle cx={CX} cy={CY} r={DANGER_R} fill={zone === 'danger' ? C.danger : 'none'} fillOpacity={0.12 + (zone === 'danger' ? 0.1 * pulse(t, 0.4) : 0)} stroke={C.danger} strokeDasharray="4 4" strokeOpacity={0.7} />
        <text x={CX + WARN_R - 6} y={CY - WARN_R + 30} fontFamily={MONO} fontSize={11} fill={C.ink2}>UYARI BÖLGESİ</text>
        <text x={CX + DANGER_R - 20} y={CY - DANGER_R + 6} fontFamily={MONO} fontSize={11} fill={C.danger}>TEHLİKE</text>
      </g>

      {/* fiziksel bariyer */}
      <rect x={330} y={170} width={8} height={240} rx={3} fill={C.ink3} />
      <text x={334} y={430} textAnchor="middle" fontFamily={MONO} fontSize={11} fill={C.ink3}>BARİYER</text>

      {/* silindir */}
      <g>
        <rect x={CX - 110} y={CY - 46} width={220} height={92} rx={10} fill={C.panel2} stroke={C.ink3} />
        <g transform={`rotate(${a} ${CX} ${CY})`}>
          <circle cx={CX} cy={CY} r={60} fill={C.panel} stroke={C.ink2} strokeWidth={3} />
          {[0, 60, 120, 180, 240, 300].map(d => (
            <line key={d} x1={CX} y1={CY} x2={CX + 56 * Math.cos((d * Math.PI) / 180)} y2={CY + 56 * Math.sin((d * Math.PI) / 180)} stroke={C.ink3} strokeWidth={4} />
          ))}
        </g>
        <circle cx={CX} cy={CY} r={12} fill={halted ? C.danger : C.ok} />
      </g>

      {/* operatör kolu */}
      <g>
        <path d={`M0 ${CY + 40} C 60 ${CY + 30} 90 ${CY + 6} ${tip - 40} ${CY}`} stroke="#5A6170" strokeWidth={34} strokeLinecap="round" fill="none" />
        <ellipse cx={tip - 18} cy={CY} rx={28} ry={20} fill="#6E7584" />
        {[0, 1, 2, 3].map(f => (
          <rect key={f} x={tip - 6} y={CY - 18 + f * 10} width={26} height={8} rx={4} fill="#6E7584" />
        ))}
      </g>

      {/* kamera */}
      <g opacity={camOn}>
        <polygon points={`866,122 884,134 ${CX + 120},${CY + 210} ${CX - 330},${CY + 210}`} fill={C.accent} opacity={0.06} />
        <rect x={858} y={84} width={64} height={38} rx={6} fill={C.panel2} stroke={C.accent} transform="rotate(-25 890 103)" />
        <circle cx={872} cy={118} r={9} fill={C.bg} stroke={C.accent} strokeWidth={2} />
        <text x={930} y={160} textAnchor="end" fontFamily={MONO} fontSize={11} fill={C.accent}>KAMERA</text>
        {/* algılama kutusu */}
        <rect x={tip - 52} y={CY - 32} width={84} height={64} rx={3} fill="none" stroke={zoneColor} strokeWidth={2.5} />
        <rect x={tip - 52} y={CY - 54} width={120} height={20} rx={3} fill={zoneColor} />
        <text x={tip - 46} y={CY - 40} fontFamily={MONO} fontSize={11} fill="#111">EL · {zone === 'danger' ? 'TEHLİKE' : zone === 'warn' ? 'UYARI' : 'GÜVENLİ'}</text>
      </g>

      {/* durdurma + kalkan */}
      <g opacity={fade(t, 11.8, 21, 0.3)}>
        <g transform={`translate(${CX + WARN_R + 70} ${CY + 10})`}>
          <path d="M0 -38 L32 -26 L32 6 C32 26 16 38 0 46 C-16 38 -32 26 -32 6 L-32 -26 Z" fill={C.accent} />
          <path d="M-12 4 L-3 14 L14 -8" stroke="#fff" strokeWidth={4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>
        <rect x={250} y={438} width={460} height={68} rx={12} fill={C.panel} stroke={C.danger} />
        <text x={480} y={468} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={22} fill={C.danger}>MAKİNE DURDURULDU</text>
        <text x={480} y={492} textAnchor="middle" fontFamily={MONO} fontSize={12} fill={C.ink2}>Uyarı bölgesinde tespit · milisaniyelik dijital müdahale</text>
      </g>
      <g opacity={seg(t, 20.5, 21.2)}>
        <text x={480} y={480} textAnchor="middle" fontFamily={FONT} fontSize={20} fill={C.ok}>Tehlike ile operatör arasında dijital bir kalkan</text>
      </g>
    </svg>
  );
}

export const rkVisionVideo: CaseVideo = {
  id: 'rkvision',
  title: 'RKVision Guard',
  subtitle: 'Fiziksel bariyerin ötesinde operatör güvenliği',
  duration: 22,
  poster: 13,
  chapters: [
    { start: 0, label: 'Süreç', caption: 'Dönen silindirli makine; koruma fiziksel bariyere ve insan refleksine bağlı.' },
    { start: 5, label: 'Risk', caption: 'Operatör uzvu tehlikeli bölgeye girebiliyor; geleneksel yöntemlerin tepki hızı sınırlı.' },
    { start: 9, label: 'Tespit', caption: 'Bilgisayarlı görü bölgeyi 7/24, yorulmadan ve insan hızının ötesinde izliyor.' },
    { start: 12, label: 'Kalkan', caption: 'Uyarı bölgesinde tespit edilen el için makine anında durduruluyor.' },
  ],
  Stage,
};
