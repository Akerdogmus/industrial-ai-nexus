import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useIsPresent } from 'framer-motion';
import { Pause, Play, RotateCcw, X } from 'lucide-react';
import { videoLayoutId, type CaseVideo } from './engine';

interface Props {
  video: CaseVideo;
  onClose: () => void;
}

const fmt = (s: number) => `0:${String(Math.floor(s)).padStart(2, '0')}`;

export default function CaseVideoPlayer({ video, onClose }: Props) {
  const reduceMotion = typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const [t, setT] = useState(0);
  // MP4'ü olan vakada film oynar; animasyon saati devre dışı kalır.
  const [playing, setPlaying] = useState(!reduceMotion && !video.src);
  const lastRef = useRef<number | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const filmRef = useRef<HTMLVideoElement>(null);

  // ---- Saat ----
  useEffect(() => {
    if (!playing) { lastRef.current = null; return; }
    let raf = 0;
    const tick = (now: number) => {
      const last = lastRef.current ?? now;
      lastRef.current = now;
      setT(prev => {
        const next = prev + (now - last) / 1000;
        if (next >= video.duration) {
          setPlaying(false);
          return video.duration;
        }
        return next;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, video.duration]);

  const ended = t >= video.duration;
  const chapterIdx = video.chapters.reduce((acc, c, i) => (t >= c.start ? i : acc), 0);
  const chapter = video.chapters[chapterIdx];

  // Kapanırken (çıkış animasyonu sürerken) oynatıcı tamamen pasif: ses yok, tıklama yok.
  const isPresent = useIsPresent();
  useEffect(() => { if (!isPresent) filmRef.current?.pause(); }, [isPresent]);

  // Kapat: film ve saat, çıkış animasyonunu beklemeden hemen dursun
  const close = useCallback(() => {
    filmRef.current?.pause();
    setPlaying(false);
    onClose();
  }, [onClose]);

  const toggle = useCallback(() => {
    const film = filmRef.current;
    if (film) { if (film.paused) film.play().catch(() => {}); else film.pause(); return; }
    if (ended) { setT(0); setPlaying(true); return; }
    setPlaying(p => !p);
  }, [ended]);

  const seek = (s: number) => {
    setT(s);
    lastRef.current = null;
    if (s < video.duration && !playing) setPlaying(true);
  };

  // ---- Klavye ----
  useEffect(() => {
    if (!isPresent) return;
    closeRef.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === ' ' && (e.target as HTMLElement)?.tagName !== 'BUTTON') { e.preventDefault(); toggle(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [close, toggle, isPresent]);

  const { Stage } = video;

  return (
    <motion.div
      className="nx-vid-overlay"
      onClick={close}
      style={{ pointerEvents: isPresent ? 'auto' : 'none' }}
      aria-hidden={!isPresent}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      <motion.div
        layoutId={reduceMotion ? undefined : videoLayoutId(video.id)}
        className="nx-vid"
        role="dialog"
        aria-modal="true"
        aria-label={`${video.title} — demo videosu`}
        onClick={e => e.stopPropagation()}
        transition={{ type: 'spring', stiffness: 260, damping: 30 }}
        style={{ borderRadius: 12 }}
      >
        <div className="nx-vid-head">
          <div>
            <div className="nx-vid-title">{video.title}</div>
            <div className="nx-vid-sub">{video.subtitle}</div>
          </div>
          <button ref={closeRef} type="button" className="nx-vid-icon" onClick={close} aria-label="Videoyu kapat">
            <X size={20} />
          </button>
        </div>

        {video.src ? (
          <div className="nx-vid-stage nx-vid-film">
            <video
              ref={filmRef}
              src={video.src}
              autoPlay={!reduceMotion}
              controls
              playsInline
              preload="auto"
              aria-label={`${video.title} tanıtım filmi`}
            />
          </div>
        ) : (<>
        <button type="button" className="nx-vid-stage" onClick={toggle} aria-label={playing ? 'Duraklat' : 'Oynat'}>
          <Stage t={t} />
          {!playing && (
            <span className="nx-vid-bigplay" aria-hidden="true">
              {ended ? <RotateCcw size={30} /> : <Play size={30} />}
            </span>
          )}
        </button>

        <div className="nx-vid-caption" aria-live="polite">
          <span className="nx-vid-chapter">{String(chapterIdx + 1).padStart(2, '0')} · {chapter.label}</span>
          <span>{chapter.caption}</span>
        </div>

        <div className="nx-vid-controls">
          <button type="button" className="nx-vid-icon" onClick={toggle} aria-label={ended ? 'Baştan oynat' : playing ? 'Duraklat' : 'Oynat'}>
            {ended ? <RotateCcw size={18} /> : playing ? <Pause size={18} /> : <Play size={18} />}
          </button>
          <div className="nx-vid-track">
            <div className="nx-vid-fill" style={{ width: `${(t / video.duration) * 100}%` }} />
            {video.chapters.map((c, i) => (
              <button
                key={c.start}
                type="button"
                className={`nx-vid-mark${i === chapterIdx ? ' is-on' : ''}`}
                style={{ left: `${(c.start / video.duration) * 100}%`, width: `${(((video.chapters[i + 1]?.start ?? video.duration) - c.start) / video.duration) * 100}%` }}
                onClick={() => seek(c.start)}
                aria-label={`Bölüm ${i + 1}: ${c.label}`}
                title={c.label}
              />
            ))}
          </div>
          <span className="nx-vid-time">{fmt(t)} / {fmt(video.duration)}</span>
        </div>
        </>)}
        <div className="nx-vid-note">Temsili animasyondur; gizlilik nedeniyle gerçek platform arayüzleri gösterilmez.</div>
      </motion.div>
    </motion.div>
  );
}
