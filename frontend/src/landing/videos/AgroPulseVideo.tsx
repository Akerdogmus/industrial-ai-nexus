// Sahne bileşeni ve video tanımı bilerek aynı dosyada: fast refresh kısıtı bu modüller için önemsiz.
/* eslint-disable react-refresh/only-export-components */
import { C, FONT, MONO, easeInOut, easeOut, fade, lerp, pulse, seg, type CaseVideo } from './engine';

// Basit traktör silüeti (yerel koordinat: 0,0 = arka tekerin altı)
function Tractor({ x, y, s = 1, alert = 0 }: { x: number; y: number; s?: number; alert?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x={-6} y={-62} width={70} height={30} rx={4} fill={C.panel2} stroke={C.ink3} />
      <rect x={30} y={-92} width={34} height={32} rx={3} fill="none" stroke={C.ink2} strokeWidth={2} />
      <rect x={64} y={-48} width={38} height={18} rx={3} fill={C.panel2} stroke={C.ink3} />
      <rect x={88} y={-66} width={5} height={18} fill={C.ink3} />
      <circle cx={20} cy={-22} r={22} fill={C.bg} stroke={C.ink2} strokeWidth={4} />
      <circle cx={20} cy={-22} r={6} fill={C.ink3} />
      <circle cx={90} cy={-14} r={14} fill={C.bg} stroke={C.ink2} strokeWidth={3} />
      {alert > 0 && (
        <g opacity={alert}>
          <circle cx={48} cy={-112} r={14} fill={C.danger} />
          <text x={48} y={-106} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={18} fill="#fff">!</text>
        </g>
      )}
    </g>
  );
}

function signal(i: number, t: number, drift: number) {
  // i: kanal, t: 0..1 ekran içi konum
  const base = [0.5, 0.45, 0.55][i];
  const n = Math.sin(t * 40 + i * 2) * 0.05 + Math.sin(t * 13 + i) * 0.04;
  const d = drift * Math.pow(Math.max(0, t - 0.55) / 0.45, 2) * (i === 1 ? 0.38 : i === 0 ? 0.12 : 0.05);
  return base + n - d;
}

function Stage({ t }: { t: number }) {
  // ---- Sahne 1: saha ----
  const s1 = fade(t, 0, 5.4);
  const roll = t * 18;
  const alert = seg(t, 2.8, 3.3) * (0.6 + 0.4 * pulse(t, 0.6));

  // ---- Sahne 2: telemetri ----
  const s2 = fade(t, 5, 24, 0.6);
  const reveal = easeOut(seg(t, 5.6, 10.5));
  const drift = seg(t, 11, 15.5);

  // ---- Sahne 3: model ----
  const s3 = seg(t, 11, 11.8);
  const score = lerp(0.18, 0.87, easeInOut(seg(t, 12, 16)));
  const over = score > 0.7;

  // ---- Sahne 4: zaman çizgisi ----
  const s4 = seg(t, 17, 17.8);

  const chans = ['Motor sıcaklığı', 'Hidrolik basınç', 'Titreşim'];
  const W = 430, H = 70;

  return (
    <svg viewBox="0 0 960 540" width="100%" role="img" aria-label="AgroPulse AI animasyonu" style={{ display: 'block', background: C.bg }}>
      <defs>
        <linearGradient id="ag-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#15181D" />
          <stop offset="1" stopColor="#1C2026" />
        </linearGradient>
      </defs>

      {/* Sahne 1 — filo sahada */}
      <g opacity={s1}>
        <rect width={960} height={540} fill="url(#ag-sky)" />
        {[0, 1, 2, 3, 4, 5].map(i => (
          <line key={i} x1={0} x2={960} y1={380 + i * 28} y2={380 + i * 28} stroke={C.line} strokeDasharray="14 18" strokeDashoffset={-roll * (1 + i * 0.3)} />
        ))}
        <line x1={0} x2={960} y1={372} y2={372} stroke={C.ink3} />
        <Tractor x={120} y={372} s={1.1} />
        <Tractor x={420} y={372} s={1.1} alert={alert} />
        <Tractor x={720} y={372} s={1.1} />
        <text x={480} y={110} textAnchor="middle" fontFamily={FONT} fontSize={30} fontWeight={600} fill={C.ink}>Sahada bir traktör filosu</text>
        <text x={480} y={146} textAnchor="middle" fontFamily={FONT} fontSize={20} fill={C.ink2}>Arızalar habersiz geliyor, iş en yoğun anda duruyor.</text>
        <g opacity={seg(t, 3, 3.6)}>
          <rect x={410} y={190} width={140} height={34} rx={17} fill={C.danger} />
          <text x={480} y={213} textAnchor="middle" fontFamily={MONO} fontSize={14} fill="#fff">PLANSIZ ARIZA</text>
        </g>
      </g>

      {/* Sahne 2+ — telemetri paneli */}
      <g opacity={s2}>
        <text x={40} y={56} fontFamily={MONO} fontSize={13} fill={C.accent}>CAN-BUS TELEMETRİ · DAKİKADA 1 ÖRNEK</text>
        {/* küçük filo ikonları ve veri noktaları */}
        {[0, 1, 2].map(i => (
          <g key={i}>
            <Tractor x={40} y={150 + i * 120} s={0.5} alert={i === 1 && t > 15.5 ? 1 : 0} />
            {[0, 1, 2, 3].map(k => {
              const p = ((t * 0.6 + k * 0.25 + i * 0.13) % 1);
              return <circle key={k} cx={lerp(100, 300, p)} cy={130 + i * 120 + Math.sin(p * 6) * 4} r={3} fill={C.accent} opacity={reveal * (1 - p * 0.6)} />;
            })}
          </g>
        ))}
        {/* sinyal grafikleri */}
        {chans.map((name, i) => {
          const y0 = 90 + i * 120;
          const n = 90;
          const pts = Array.from({ length: n }, (_, k) => {
            const u = k / (n - 1);
            return `${(310 + u * W).toFixed(1)},${(y0 + H - signal(i, u, drift) * H).toFixed(1)}`;
          }).slice(0, Math.max(2, Math.round(n * reveal)));
          const hot = i === 1 && drift > 0;
          return (
            <g key={name}>
              <rect x={300} y={y0 - 24} width={W + 20} height={H + 36} rx={8} fill={C.panel} stroke={hot && over ? C.accent : C.line} />
              <text x={312} y={y0 - 6} fontFamily={MONO} fontSize={12} fill={C.ink2}>{name}</text>
              {hot && (
                <rect x={310 + W * 0.55} y={y0} width={W * 0.45} height={H} fill={C.accentSoft} opacity={drift} />
              )}
              <polyline points={pts.join(' ')} fill="none" stroke={hot ? C.accent : C.blue} strokeWidth={2} />
            </g>
          );
        })}
      </g>

      {/* Sahne 3 — AgroPulse modeli */}
      <g opacity={s3 * (1 - seg(t, 17, 17.6))}>
        {/* model ← sinyal bağlantısı */}
        <path d="M 760 200 C 780 200 790 200 806 200" stroke={C.accent} strokeWidth={2} strokeDasharray="4 4" strokeDashoffset={-t * 20} fill="none" />
        <g transform="translate(860 200)">
          <polygon points="0,-62 54,-31 54,31 0,62 -54,31 -54,-31" fill={C.panel2} stroke={C.accent} strokeWidth={2} />
          <text y={-6} textAnchor="middle" fontFamily={FONT} fontWeight={600} fontSize={16} fill={C.ink}>AgroPulse</text>
          <text y={14} textAnchor="middle" fontFamily={MONO} fontSize={11} fill={C.ink2}>on-premise</text>
        </g>
        <text x={860} y={300} textAnchor="middle" fontFamily={MONO} fontSize={11} fill={C.ink2}>5 ARIZA TİPİNE</text>
        <text x={860} y={316} textAnchor="middle" fontFamily={MONO} fontSize={11} fill={C.ink2}>ÖZEL MODEL</text>
        {/* risk göstergesi */}
        <text x={860} y={366} textAnchor="middle" fontFamily={MONO} fontSize={11} fill={C.ink2}>ANOMALİ SKORU</text>
        <rect x={800} y={380} width={120} height={10} rx={5} fill={C.line} />
        <rect x={800} y={380} width={120 * score} height={10} rx={5} fill={over ? C.accent : C.warn} />
        <line x1={800 + 120 * 0.7} x2={800 + 120 * 0.7} y1={374} y2={396} stroke={C.ink2} strokeDasharray="2 2" />
        <text x={860} y={424} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={26} fill={over ? C.accent : C.ink}>{Math.round(score * 100)}</text>
      </g>

      {/* Sahne 4 — 3 gün önceden uyarı */}
      <g opacity={s4}>
        <rect x={0} y={0} width={960} height={540} fill={C.bg} opacity={0.94} />
        <text x={480} y={92} textAnchor="middle" fontFamily={FONT} fontSize={30} fontWeight={600} fill={C.ink}>Arıza gelmeden önce haber</text>
        {(() => {
          const days = ['3 gün önce', '2 gün önce', '1 gün önce', 'Beklenen arıza'];
          const x0 = 150, x1 = 810;
          const prog = easeInOut(seg(t, 18, 21));
          return (
            <g>
              <line x1={x0} x2={x1} y1={270} y2={270} stroke={C.line} strokeWidth={4} />
              <line x1={x0} x2={lerp(x0, x1, prog)} y1={270} y2={270} stroke={C.ok} strokeWidth={4} />
              {days.map((d, i) => {
                const x = lerp(x0, x1, i / 3);
                const isAlert = i === 0, isFail = i === 3;
                return (
                  <g key={d}>
                    <circle cx={x} cy={270} r={isAlert ? 14 : 9} fill={isAlert ? C.accent : isFail ? C.panel2 : C.ink3} stroke={isFail ? C.ink3 : 'none'} />
                    <text x={x} y={312} textAnchor="middle" fontFamily={MONO} fontSize={13} fill={C.ink2}>{d}</text>
                  </g>
                );
              })}
              {/* uyarı kartı */}
              <g opacity={seg(t, 18.2, 18.8)} transform={`translate(${x0 - 40} ${lerp(150, 140, seg(t, 18.2, 18.8))})`}>
                <rect width={250} height={78} rx={8} fill={C.panel} stroke={C.accent} />
                <text x={16} y={28} fontFamily={MONO} fontSize={12} fill={C.accent}>KESTİRİMCİ UYARI</text>
                <text x={16} y={54} fontFamily={FONT} fontSize={17} fill={C.ink}>Hidrolik sistem · yüksek risk</text>
              </g>
              <g opacity={seg(t, 19.5, 20.1)} transform={`translate(${lerp(x0, x1, 1 / 3) - 60} 340)`}>
                <rect width={190} height={44} rx={22} fill={C.ok} opacity={0.18} />
                <text x={95} y={28} textAnchor="middle" fontFamily={FONT} fontSize={16} fill={C.ok}>✓ Bakım planlandı</text>
              </g>
              {/* önlenen arıza */}
              <g opacity={seg(t, 21, 21.6)}>
                <line x1={x1 - 60} x2={x1 + 60} y1={312 - 5} y2={312 - 5} stroke={C.ok} strokeWidth={2} />
                <text x={x1} y={350} textAnchor="middle" fontFamily={FONT} fontWeight={600} fontSize={18} fill={C.ok}>Arıza önlendi</text>
              </g>
              <text x={480} y={460} textAnchor="middle" fontFamily={FONT} fontSize={20} fill={C.ink2} opacity={seg(t, 21.5, 22.3)}>
                Kritik arızalar ≥3 gün önceden · plansız duruş en aza iner
              </text>
            </g>
          );
        })()}
      </g>
    </svg>
  );
}

export const agroPulseVideo: CaseVideo = {
  id: 'agropulse',
  title: 'AgroPulse AI',
  subtitle: 'Filo telemetrisinden kestirimci uyarıya',
  duration: 24,
  poster: 15,
  chapters: [
    { start: 0, label: 'Saha', caption: 'Traktör filosu sahada; arızalar habersiz geliyor.' },
    { start: 5, label: 'Veri', caption: 'CAN-Bus telemetrisi ve 6 aylık filo verisi düşük gecikmeyle akıyor.' },
    { start: 11, label: 'Model', caption: '5 kritik arıza tipine özel modeller sapmayı erken yakalıyor.' },
    { start: 17, label: 'Sonuç', caption: 'Arızadan ≥3 gün önce uyarı; bakım planlanıyor, duruş önleniyor.' },
  ],
  Stage,
};
