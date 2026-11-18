import type { ReactElement } from 'react';

// ============================================
// Zaman tabanlı (deterministik) animasyon yardımcıları.
// Her sahne yalnızca `t` (saniye) ile çizilir; böylece duraklatma ve
// bölüm atlama ücretsiz gelir.
// ============================================

export const clamp = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));

/** t, [a, b] aralığında 0→1 ilerler. */
export const seg = (t: number, a: number, b: number) => clamp((t - a) / (b - a));

export const lerp = (a: number, b: number, p: number) => a + (b - a) * p;

export const easeOut = (p: number) => 1 - Math.pow(1 - p, 3);

export const easeInOut = (p: number) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);

/** [a, b] penceresinde görünür; kenarlarda `f` saniyelik yumuşak geçiş. */
export const fade = (t: number, a: number, b: number, f = 0.5) =>
  Math.min(seg(t, a, a + f), 1 - seg(t, b - f, b));

/** 0..1 arasında yavaş nabız. */
export const pulse = (t: number, period = 1.2) => 0.5 + 0.5 * Math.sin((t / period) * Math.PI * 2);

/** Dişli silüeti için SVG path. */
export function gearPath(cx: number, cy: number, r: number, teeth = 12, depth = 0.16): string {
  const pts: string[] = [];
  const steps = teeth * 4;
  for (let i = 0; i < steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    const outer = i % 4 === 1 || i % 4 === 2;
    const rr = outer ? r : r * (1 - depth);
    pts.push(`${(cx + rr * Math.cos(a)).toFixed(1)},${(cy + rr * Math.sin(a)).toFixed(1)}`);
  }
  return `M${pts.join('L')}Z`;
}

/** Kübik Bézier üzerindeki nokta. */
export function bezier(
  p0: [number, number], p1: [number, number], p2: [number, number], p3: [number, number], u: number,
): [number, number] {
  const m = 1 - u;
  const a = m * m * m, b = 3 * m * m * u, c = 3 * m * u * u, d = u * u * u;
  return [a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1]];
}

/** Deterministik sözde-rastgele (aynı i → aynı değer). */
export const rand = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/** Video renk paleti — marka ile uyumlu koyu sahne. */
export const C = {
  bg: '#111317',
  panel: '#1A1D23',
  panel2: '#22262E',
  line: '#2E333C',
  ink: '#ECEDEF',
  ink2: '#A9AEB8',
  ink3: '#6B717C',
  accent: '#E2577F',
  accentSoft: 'rgba(226,87,127,0.18)',
  ok: '#3FB68B',
  warn: '#F2B84B',
  danger: '#EF5350',
  blue: '#5B8DEF',
};

export const FONT = "'Space Grotesk', Inter, system-ui, sans-serif";
export const MONO = "'JetBrains Mono', ui-monospace, monospace";

export interface Chapter {
  start: number;
  label: string;
  caption: string;
}

export interface CaseVideo {
  id: string;
  title: string;
  subtitle: string;
  duration: number;
  /** Önizleme karesinin zamanı (sn). */
  poster: number;
  /** Seslendirmeli tanıtım filmi (MP4); varsa oynatıcı animasyon yerine bunu oynatır. */
  src?: string;
  chapters: Chapter[];
  Stage: (props: { t: number }) => ReactElement;
}

/** Önizleme ↔ oynatıcı paylaşımlı geçişi için framer-motion layoutId. */
export const videoLayoutId = (id: string) => `nx-video-${id}`;
