import { motion } from 'framer-motion';
import { Play } from 'lucide-react';
import { videoLayoutId, type CaseVideo } from './engine';

interface Props {
  video: CaseVideo;
  active: boolean;
  onOpen: () => void;
}

/** Vaka kartının sağ üstündeki küçük video karesi; tıklanınca oynatıcıya büyür. */
export default function VideoThumb({ video, active, onOpen }: Props) {
  const { Stage } = video;
  return (
    <motion.button
      type="button"
      layoutId={videoLayoutId(video.id)}
      className="nx-thumb"
      onClick={onOpen}
      aria-label={`${video.title} demo videosunu oynat (${video.duration} sn)`}
      style={{ borderRadius: 6, visibility: active ? 'hidden' : 'visible' }}
      transition={{ type: 'spring', stiffness: 260, damping: 30 }}
    >
      <span className="nx-thumb-frame" aria-hidden="true">
        <Stage t={video.poster} />
      </span>
      <span className="nx-thumb-play" aria-hidden="true"><Play size={14} fill="currentColor" /></span>
      <span className="nx-thumb-dur" aria-hidden="true">0:{String(video.duration).padStart(2, '0')}</span>
    </motion.button>
  );
}
