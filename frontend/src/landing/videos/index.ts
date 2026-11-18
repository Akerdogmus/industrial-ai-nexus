import type { CaseVideo } from './engine';
import { agroPulseVideo } from './AgroPulseVideo';
import { pharmAIVideo } from './PharmAIVideo';
import { mixerVideo } from './MixerVideo';
import { rkVisionVideo } from './RKVisionVideo';
import { synthVisionVideo } from './SynthVisionVideo';

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

// Seslendirmeli tanıtım filmleri (scripts/mux-promos.py çıktısı). Olmayan vakada animasyon oynar.
const FILMS: Record<string, string> = {
  agropulse: 'agropulse.mp4',
  pharmai: 'pharmai.mp4',
  mixer: 'mixer.mp4',
  rkvision: 'rkvision.mp4',
  synthvision: 'synthvision.mp4',
};

const withFilm = (v: CaseVideo): CaseVideo =>
  // Filmler 29,5 sn; önizleme rozeti filmin süresini göstersin.
  FILMS[v.id] ? { ...v, src: `${BASE}/assets/videos/promo/${FILMS[v.id]}`, duration: 30 } : v;

export const CASE_VIDEOS: Record<string, CaseVideo> = Object.fromEntries(
  [agroPulseVideo, pharmAIVideo, mixerVideo, rkVisionVideo, synthVisionVideo].map(v => [v.id, withFilm(v)]),
);

export type { CaseVideo };
