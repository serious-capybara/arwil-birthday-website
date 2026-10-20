import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import paperStar from '../assets/paper-star.png';

interface LoadingScreenProps {
  onComplete: () => void;
}

const STAR_COUNT = 5;
const TOTAL_DURATION_MS = 4000; // 4 seconds total

export function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [litStars, setLitStars] = useState(0);
  const [phase, setPhase] = useState<'loading' | 'clouds'>('loading');
  const timerRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    // Light stars one by one
    for (let i = 0; i < STAR_COUNT; i++) {
      const t = setTimeout(() => {
        setLitStars(i + 1);
      }, (i + 1) * (TOTAL_DURATION_MS / (STAR_COUNT + 2)));
      timerRef.current.push(t);
    }

    // After all stars lit, transition to cloud phase
    const cloudTimer = setTimeout(() => {
      setPhase('clouds');
    }, TOTAL_DURATION_MS);
    timerRef.current.push(cloudTimer);

    // After cloud animation, call onComplete
    const doneTimer = setTimeout(() => {
      onComplete();
    }, TOTAL_DURATION_MS + 1200);
    timerRef.current.push(doneTimer);

    return () => timerRef.current.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {/* Main loading background */}
      <motion.div
        key="loading-bg"
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[#F5EDD8]"
      >
        {/* Stars row */}
        <div className="flex items-center gap-4 mb-6" role="status" aria-label="Loading">
          {Array.from({ length: STAR_COUNT }).map((_, i) => (
            <motion.img
              key={i}
              src={paperStar}
              alt=""
              role="presentation"
              className="w-10 h-10 sm:w-12 sm:h-12 select-none"
              initial={{ opacity: 0.15, scale: 0.85, rotate: -5 }}
              animate={
                litStars > i
                  ? {
                      opacity: [1, 0.7, 1],
                      scale: [1, 1.08, 1],
                      rotate: [-5, 5, -5],
                    }
                  : { opacity: 0.15, scale: 0.85 }
              }
              transition={
                litStars > i
                  ? {
                      duration: 1.6,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay: i * 0.15,
                    }
                  : {}
              }
            />
          ))}
        </div>

        {/* Caption */}
        <motion.p
          className="font-heaven text-base sm:text-lg text-[#6b5b73] text-center px-8"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.7 }}
        >
          Setting out the stars for you, just a moment.
        </motion.p>
      </motion.div>

      {/* Cloud wipe overlay */}
      {phase === 'clouds' && (
        <CloudTransition key="cloud-wipe" />
      )}
    </AnimatePresence>
  );
}

/** Clash-of-Clans-style cloud wipe from edges toward center, then reveals page */
function CloudTransition() {
  return (
    <>
      {/* Left cloud */}
      <motion.div
        className="fixed inset-y-0 left-0 z-[300] w-1/2"
        style={{
          backgroundImage: "url('/src/assets/clouds-2.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'right center',
        }}
        initial={{ x: '-100%' }}
        animate={{ x: 0 }}
        exit={{ x: '-100%' }}
        transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
      />
      {/* Right cloud */}
      <motion.div
        className="fixed inset-y-0 right-0 z-[300] w-1/2"
        style={{
          backgroundImage: "url('/src/assets/clouds-2.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'left center',
          transform: 'scaleX(-1)',
        }}
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
      />
      {/* Top cloud */}
      <motion.div
        className="fixed inset-x-0 top-0 z-[299] h-1/2"
        style={{
          backgroundImage: "url('/src/assets/clouds-1.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center bottom',
        }}
        initial={{ y: '-100%' }}
        animate={{ y: 0 }}
        exit={{ y: '-100%' }}
        transition={{ duration: 0.65, ease: [0.76, 0, 0.24, 1], delay: 0.05 }}
      />
      {/* Bottom cloud */}
      <motion.div
        className="fixed inset-x-0 bottom-0 z-[299] h-1/2"
        style={{
          backgroundImage: "url('/src/assets/clouds-3.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
        }}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ duration: 0.65, ease: [0.76, 0, 0.24, 1], delay: 0.05 }}
      />
      {/* Center white flash then fade out everything */}
      <motion.div
        className="fixed inset-0 z-[310] bg-white"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 0.7, delay: 0.6, times: [0, 0.4, 1] }}
      />
    </>
  );
}
