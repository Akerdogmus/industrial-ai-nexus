// Sahne bileşeni ve video tanımı bilerek aynı dosyada: fast refresh kısıtı bu modüller için önemsiz.
/* eslint-disable react-refresh/only-export-components */
import { C, FONT, MONO, easeOut, fade, gearPath, lerp, rand, seg, type CaseVideo } from './engine';

type Defect = 'none' | 'scratch' | 'dent' | 'blur' | 'fog';

function Part({ x, y, r, defect, t, id }: { x: number; y: number; r: number; defect: Defect; t: number; id: string }) {
  return (
    <g>
      <g filter={defect === 'blur' ? `url(#sv-blur-${id})` : undefined}>
        <path d={gearPath(x, y, r, 14)} fill="#3A404B" stroke="#59606C" strokeWidth={Math.max(1, r / 40)} />
        <circle cx={x} cy={y} r={r * 0.32} fill={C.bg} stroke="#59606C" />
        {defect === 'scratch' && (
          <path d={`M${x - r * 0.55} ${y - r * 0.25} L${x + r * 0.15} ${y + r * 0.45}`} stroke={C.accent} strokeWidth={Math.max(1.5, r / 25)} strokeLinecap="round" />
        )}
        {defect === 'dent' && <circle cx={x + r * 0.5} cy={y - r * 0.4} r={r * 0.12} fill={C.accent} opacity={0.85} />}
      </g>
      {defect === 'fog' && <circle cx={x} cy={y} r={r * 1.05} fill="#C9CED6" opacity={0.35 + 0.05 * Math.sin(t * 2)} />}
    </g>
  );
}

function Stage({ t }: { t: number }) {
  const s1 = fade(t, 0, 5.4);
  const s2 = fade(t, 5, 11.4);
  const s3 = fade(t, 11, 17.4);
  const s4 = seg(t, 17, 17.6);

  // Sahne 2 efekt ilerlemeleri
  const scratchP = easeOut(seg(t, 6, 7.4));
  const blurP = seg(t, 7.6, 9);
  const fogP = seg(t, 9.2, 10.6);

  const DEFECTS: Defect[] = ['scratch', 'dent', 'blur', 'fog', 'none'];
  const grid = Array.from({ length: 6 * 10 }, (_, i) => i);

  return (
    <svg viewBox="0 0 960 540" width="100%" role="img" aria-label="Synth Vision Suite animasyonu" style={{ display: 'block', background: C.bg }}>
      <defs>
        <filter id="sv-blur-big"><feGaussianBlur stdDeviation={blurP * 4} /></filter>
        {grid.map(i => <filter key={i} id={`sv-blur-g${i}`}><feGaussianBlur stdDeviation={1.6} /></filter>)}
      </defs>
      <text x={40} y={56} fontFamily={MONO} fontSize={13} fill={C.accent}>SYNTH VISION SUITE · SENTETİK GÖRÜNTÜ VERİSİ</text>

      {/* Sahne 1 — az gerçek hata görüntüsü */}
      <g opacity={s1}>
        <text x={40} y={100} fontFamily={FONT} fontSize={28} fontWeight={600} fill={C.ink}>Kusur tespiti için gerçek hata görüntüsü az</text>
        <text x={40} y={132} fontFamily={FONT} fontSize={18} fill={C.ink2}>Hattaki parçaların neredeyse hepsi sağlam; model öğrenecek örnek bulamıyor.</text>
        {[0, 1, 2, 3, 4].map(i => {
          const p = easeOut(seg(t, 0.4 + i * 0.25, 1.2 + i * 0.25));
          const x = 140 + i * 170;
          const defective = i === 3;
          return (
            <g key={i} opacity={p}>
              <rect x={x - 70} y={200} width={140} height={160} rx={8} fill={C.panel} stroke={defective ? C.accent : C.line} />
              <Part x={x} y={270} r={50} defect={defective ? 'scratch' : 'none'} t={t} id={`s1-${i}`} />
              <text x={x} y={346} textAnchor="middle" fontFamily={MONO} fontSize={11} fill={defective ? C.accent : C.ink2}>{defective ? 'HATALI' : 'SAĞLAM'}</text>
            </g>
          );
        })}
        <g opacity={seg(t, 2.8, 3.4)}>
          <rect x={330} y={400} width={300} height={50} rx={25} fill={C.accentSoft} />
          <text x={480} y={431} textAnchor="middle" fontFamily={FONT} fontSize={17} fill={C.accent}>Hatalı örnek oranı çok düşük</text>
        </g>
      </g>

      {/* Sahne 2 — parametrik hata enjeksiyonu */}
      <g opacity={s2}>
        <text x={40} y={100} fontFamily={FONT} fontSize={28} fontWeight={600} fill={C.ink}>Parametrik hata enjeksiyonu</text>
        <rect x={120} y={140} width={340} height={340} rx={10} fill={C.panel} stroke={C.line} />
        <g filter="url(#sv-blur-big)">
          <path d={gearPath(290, 310, 120, 16)} fill="#3A404B" stroke="#59606C" strokeWidth={3} />
          <circle cx={290} cy={310} r={38} fill={C.bg} stroke="#59606C" />
          <path d="M210 260 L330 390" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - scratchP} stroke={C.accent} strokeWidth={5} strokeLinecap="round" />
        </g>
        <rect x={120} y={140} width={340} height={340} rx={10} fill="#C9CED6" opacity={fogP * 0.35} />
        {[
          { k: 'Çizik', p: scratchP },
          { k: 'Motion blur', p: blurP },
          { k: 'Sis (fog)', p: fogP },
        ].map((s, i) => (
          <g key={s.k} transform={`translate(540 ${180 + i * 90})`}>
            <text fontFamily={FONT} fontSize={18} fill={s.p > 0 ? C.ink : C.ink3}>{s.k}</text>
            <rect y={16} width={340} height={8} rx={4} fill={C.line} />
            <rect y={16} width={340 * s.p} height={8} rx={4} fill={C.accent} />
            <circle cx={340 * s.p} cy={20} r={10} fill={s.p > 0 ? C.ink : C.ink3} />
          </g>
        ))}
        <text x={540} y={460} fontFamily={MONO} fontSize={12} fill={C.ink2}>Senaryoya özel kusur tipleri ve eşikler</text>
      </g>

      {/* Sahne 3 — sentetik veri seti çoğalıyor */}
      <g opacity={s3}>
        <text x={40} y={100} fontFamily={FONT} fontSize={28} fontWeight={600} fill={C.ink}>Gerçeğe yakın, binlerce sentetik örnek</text>
        {grid.map(i => {
          const col = i % 10, row = Math.floor(i / 10);
          const appear = seg(t, 11.3 + (col + row) * 0.12, 11.8 + (col + row) * 0.12);
          const d = DEFECTS[Math.floor(rand(i) * DEFECTS.length)];
          const x = 90 + col * 64, y = 160 + row * 56;
          return (
            <g key={i} opacity={appear} transform={`translate(${x} ${y}) scale(${lerp(0.6, 1, easeOut(appear))}) translate(${-x} ${-y})`}>
              <rect x={x - 28} y={y - 25} width={56} height={50} rx={4} fill={C.panel} stroke={d === 'none' ? C.line : C.accentSoft} />
              <Part x={x} y={y} r={18} defect={d} t={t} id={`g${i}`} />
            </g>
          );
        })}
        <g transform="translate(730 170)">
          {['GAN', 'Diffusion', 'Senaryoya özel LoRA', 'Harici API modelleri'].map((m, i) => (
            <g key={m} opacity={seg(t, 12 + i * 0.5, 12.5 + i * 0.5)} transform={`translate(0 ${i * 52})`}>
              <rect width={200} height={40} rx={20} fill={C.panel2} stroke={C.line} />
              <text x={100} y={25} textAnchor="middle" fontFamily={FONT} fontSize={14} fill={C.ink}>{m}</text>
            </g>
          ))}
          <text x={0} y={240} fontFamily={MONO} fontSize={12} fill={C.ink2} opacity={seg(t, 14.5, 15)}>KALİTE METRİKLERİYLE</text>
          <text x={0} y={258} fontFamily={MONO} fontSize={12} fill={C.ink2} opacity={seg(t, 14.5, 15)}>DEĞERLENDİRİLİR</text>
        </g>
      </g>

      {/* Sahne 4 — gerçek hatta tespit */}
      <g opacity={s4}>
        <text x={40} y={100} fontFamily={FONT} fontSize={28} fontWeight={600} fill={C.ink}>Gerçek hatta kusur tespiti</text>
        <rect x={0} y={380} width={960} height={22} fill={C.accent} opacity={0.85} />
        {[0, 1, 2, 3, 4, 5].map(i => {
          const x = ((t - 17) * 70 + i * 190) % 1140 - 90;
          const defective = i === 2 || i === 5;
          const inCam = Math.abs(x - 480) < 110;
          return (
            <g key={i}>
              <Part x={x} y={320} r={56} defect={defective ? (i === 2 ? 'scratch' : 'dent') : 'none'} t={t} id={`c${i}`} />
              {inCam && (
                <g>
                  <rect x={x - 66} y={254} width={132} height={132} rx={4} fill="none" stroke={defective ? C.accent : C.ok} strokeWidth={2.5} />
                  <rect x={x - 66} y={230} width={defective ? 132 : 70} height={22} rx={3} fill={defective ? C.accent : C.ok} />
                  <text x={x - 60} y={246} fontFamily={MONO} fontSize={11} fill="#fff">{defective ? (i === 2 ? 'KUSUR · ÇİZİK' : 'KUSUR · EZİK') : 'SAĞLAM'}</text>
                </g>
              )}
            </g>
          );
        })}
        <polygon points="462,150 498,150 600,250 360,250" fill={C.accent} opacity={0.1} />
        <rect x={450} y={124} width={60} height={30} rx={6} fill={C.panel2} stroke={C.accent} />
        <text x={480} y={470} textAnchor="middle" fontFamily={FONT} fontSize={19} fill={C.ink2} opacity={seg(t, 19, 19.8)}>
          Sentetik veriyle eğitilen model, gerçek ortamda hatalı ürünü yakalar.
        </text>
      </g>
    </svg>
  );
}

export const synthVisionVideo: CaseVideo = {
  id: 'synthvision',
  title: 'Synth Vision Suite',
  subtitle: 'Az veriden güçlü kusur tespitine',
  duration: 24,
  poster: 19.5,
  chapters: [
    { start: 0, label: 'Sorun', caption: 'Hattaki parçaların çoğu sağlam; modeli eğitecek gerçek hata görüntüsü çok az.' },
    { start: 5, label: 'Enjeksiyon', caption: 'Çizik, motion blur ve sis gibi bozulmalar görüntülere parametrik olarak eklenir.' },
    { start: 11, label: 'Üretim', caption: 'GAN, diffusion ve senaryoya özel LoRA ile gerçeğe yakın veri seti üretilir.' },
    { start: 17, label: 'Tespit', caption: 'Sentetik veriyle eğitilen model gerçek üretim hattında kusurları yakalar.' },
  ],
  Stage,
};
