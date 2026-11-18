// Sahne bileşeni ve video tanımı bilerek aynı dosyada: fast refresh kısıtı bu modüller için önemsiz.
/* eslint-disable react-refresh/only-export-components */
import { C, FONT, MONO, fade, pulse, seg, type CaseVideo } from './engine';

// Konveyör kinematiği: bant 15–19 sn arası durur.
const V = 40;          // px/sn
const SPACING = 110;
const X0 = 470;        // T=0'da 0. kutunun konumu → hatalı kutu T=15'te kamera alanına girer
const WRONG = 5;       // sırası bozuk kutu
const CAM_X = 600;
const MIXER_X = 850;
const BELT_Y = 330;

const beltTime = (t: number) => (t < 15 ? t : t < 19 ? 15 : t - 4);
const label = (i: number) => (i === WRONG ? 'A' : i % 2 === 0 ? 'A' : 'B');

function Stage({ t }: { t: number }) {
  const T = beltTime(t);
  const stopped = t >= 15 && t < 19;
  const camOn = seg(t, 10, 10.6);
  const intro = fade(t, 0, 5.2);
  const wrongHint = fade(t, 5.4, 10.2);
  const wrongRemoved = seg(t, 17.8, 18.6);

  const boxes = [];
  for (let i = -3; i <= 14; i++) {
    const x = X0 + V * T - i * SPACING;
    if (x < -60 || x > MIXER_X - 10) continue;
    const isWrong = i === WRONG;
    const opacity = isWrong ? 1 - wrongRemoved : 1;
    const inCam = Math.abs(x - CAM_X) < 90 && camOn > 0;
    const isA = label(i) === 'A';
    boxes.push(
      <g key={i} transform={`translate(${x} ${BELT_Y})`} opacity={opacity}>
        <rect x={-34} y={-66} width={68} height={62} rx={4} fill={isA ? '#2A2F38' : '#33303A'} stroke={C.ink3} />
        <line x1={-34} x2={34} y1={-52} y2={-52} stroke={C.line} />
        <text y={-20} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={26} fill={C.ink}>{label(i)}</text>
        {isWrong && wrongHint > 0 && (
          <rect x={-40} y={-72} width={80} height={74} rx={6} fill="none" stroke={C.warn} strokeWidth={2} strokeDasharray="6 4" opacity={wrongHint * (0.5 + 0.5 * pulse(t, 0.7))} />
        )}
        {inCam && (
          <g opacity={camOn}>
            <rect x={-42} y={-74} width={84} height={78} rx={3} fill="none" stroke={isWrong ? C.danger : C.ok} strokeWidth={2.5} />
            <rect x={-42} y={-96} width={isWrong ? 120 : 64} height={20} rx={3} fill={isWrong ? C.danger : C.ok} />
            <text x={-36} y={-81} fontFamily={MONO} fontSize={11} fill="#fff">{isWrong ? `${label(i)} · İHLAL` : `${label(i)} ✓`}</text>
          </g>
        )}
      </g>,
    );
  }

  const stripeOffset = -(V * T) % 24;

  return (
    <svg viewBox="0 0 960 540" width="100%" role="img" aria-label="Mikser besleme sekans kontrolü animasyonu" style={{ display: 'block', background: C.bg }}>
      {/* başlık alanı */}
      <text x={40} y={56} fontFamily={MONO} fontSize={13} fill={C.accent}>MİKSER BESLEME · BEKLENEN SIRA A-B-A-B</text>
      <g opacity={intro}>
        <text x={40} y={100} fontFamily={FONT} fontSize={28} fontWeight={600} fill={C.ink}>Her parti doğru sırayla mikserde olmalı</text>
      </g>
      <g opacity={wrongHint}>
        <text x={40} y={100} fontFamily={FONT} fontSize={28} fontWeight={600} fill={C.ink}>Tek bir dalgınlık: sıra bozuluyor</text>
        <text x={40} y={132} fontFamily={FONT} fontSize={18} fill={C.warn}>Beklenen B, banda A kondu → hatalı üretim ve hammadde kaybı</text>
      </g>

      {/* kamera */}
      <g opacity={camOn}>
        <polygon points={`${CAM_X - 18},150 ${CAM_X + 18},150 ${CAM_X + 95},${BELT_Y + 4} ${CAM_X - 95},${BELT_Y + 4}`} fill={C.accent} opacity={0.12} />
        <rect x={CAM_X - 30} y={118} width={60} height={34} rx={6} fill={C.panel2} stroke={C.accent} />
        <circle cx={CAM_X} cy={152} r={10} fill={C.bg} stroke={C.accent} strokeWidth={2} />
        <text x={CAM_X + 44} y={140} fontFamily={MONO} fontSize={12} fill={C.accent}>ENDÜSTRİYEL KAMERA · GERÇEK ZAMANLI</text>
      </g>

      {/* mikser */}
      <g>
        <rect x={MIXER_X - 10} y={BELT_Y - 150} width={110} height={170} rx={14} fill={C.panel} stroke={C.ink3} />
        <circle cx={MIXER_X + 45} cy={BELT_Y - 70} r={34} fill="none" stroke={C.ink3} strokeWidth={2} />
        <g transform={`rotate(${stopped ? 0 : t * 120} ${MIXER_X + 45} ${BELT_Y - 70})`}>
          <line x1={MIXER_X + 45} y1={BELT_Y - 100} x2={MIXER_X + 45} y2={BELT_Y - 40} stroke={C.ink2} strokeWidth={3} />
          <line x1={MIXER_X + 15} y1={BELT_Y - 70} x2={MIXER_X + 75} y2={BELT_Y - 70} stroke={C.ink2} strokeWidth={3} />
        </g>
        <text x={MIXER_X + 45} y={BELT_Y + 50} textAnchor="middle" fontFamily={MONO} fontSize={12} fill={C.ink2}>MİKSER</text>
      </g>

      {/* bant */}
      <rect x={0} y={BELT_Y} width={MIXER_X} height={26} fill={stopped ? '#4A1F2B' : C.accent} opacity={stopped ? 1 : 0.85} />
      <line x1={0} x2={MIXER_X} y1={BELT_Y + 13} y2={BELT_Y + 13} stroke="#ffffff" strokeOpacity={0.35} strokeDasharray="12 12" strokeDashoffset={stripeOffset} />
      {[60, 220, 380, 540, 700].map(x => (
        <circle key={x} cx={x} cy={BELT_Y + 40} r={10} fill={C.panel2} stroke={C.ink3} />
      ))}
      {boxes}

      {/* durdurma */}
      <g opacity={fade(t, 15, 19.2, 0.3)}>
        <rect x={300} y={400} width={360} height={72} rx={12} fill={C.danger} opacity={0.9} />
        <text x={480} y={436} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={24} fill="#fff">BANT DURDURULDU</text>
        <text x={480} y={460} textAnchor="middle" fontFamily={MONO} fontSize={12} fill="#fff">Hatalı kutu mikserden önce yakalandı</text>
      </g>
      <g opacity={seg(t, 19.2, 19.8)}>
        <text x={480} y={430} textAnchor="middle" fontFamily={FONT} fontWeight={600} fontSize={24} fill={C.ok}>Sıra düzeltildi · üretim devam ediyor</text>
        <text x={480} y={462} textAnchor="middle" fontFamily={FONT} fontSize={18} fill={C.ink2}>Hedef: insan kaynaklı besleme hatasını sıfıra indirmek</text>
      </g>

      {/* sayaç */}
      <g opacity={seg(t, 10.5, 11)}>
        <rect x={40} y={170} width={250} height={58} rx={8} fill={C.panel} stroke={C.line} />
        <text x={56} y={192} fontFamily={MONO} fontSize={11} fill={C.ink2}>MİKSERE GİREN HATALI PARTİ</text>
        <text x={56} y={218} fontFamily={FONT} fontWeight={700} fontSize={22} fill={C.ok}>0</text>
      </g>
    </svg>
  );
}

export const mixerVideo: CaseVideo = {
  id: 'mixer',
  title: 'MB Process Guard',
  subtitle: 'Kamerayla sıra denetimi ve otomatik müdahale',
  duration: 22,
  poster: 16,
  chapters: [
    { start: 0, label: 'Süreç', caption: 'Mikser besleme sırası A-B-A-B olmalı; besleme operatör eliyle yapılıyor.' },
    { start: 5, label: 'Risk', caption: 'Tek bir dalgınlık sırayı bozuyor: hatalı üretim, hammadde ve zaman kaybı.' },
    { start: 10, label: 'Tespit', caption: 'Endüstriyel kamera her kutuyu gerçek zamanlı tanıyor ve sırayı denetliyor.' },
    { start: 15, label: 'Müdahale', caption: 'İhlal anında bant duruyor; hatalı parti miksere ulaşmadan düzeltiliyor.' },
  ],
  Stage,
};
