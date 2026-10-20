import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import paperStar from '../../assets/paper-star.webp';
import clouds1 from '../../assets/clouds-1.webp';
import clouds2 from '../../assets/clouds-2.webp';
import clouds3 from '../../assets/clouds-3.webp';

interface LoadingScreenProps {
  onComplete: () => void;
}

const STAR_COUNT = 5;
const TOTAL_DURATION_MS = 3600; // 3.6s star progression before cloud wipe

export function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [litStars, setLitStars] = useState(0);
  const [phase, setPhase] = useState<'loading' | 'clouds'>('loading');
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    // Preload heavy assets in the background while stars are twinkling
    try {
      const hatImg = new Image();
      hatImg.src = '/src/assets/hat.webp';
      // Preload 3D model assets into browser cache during opening stars
      fetch('/models/colorful_balloons.glb');
      fetch('/models/free_realistic_disco_ball.glb');
    } catch {
      // background preload non-blocking
    }

    // Step 1: Light up stars one by one with a delightful twinkle
    const starInterval = TOTAL_DURATION_MS / (STAR_COUNT + 0.8);
    for (let i = 0; i < STAR_COUNT; i++) {
      const t = setTimeout(() => {
        setLitStars(i + 1);
      }, (i + 1) * starInterval);
      timers.push(t);
    }

    // Step 2: Trigger Clash of Clans cloud wipe
    const cloudTimer = setTimeout(() => {
      setPhase('clouds');
    }, TOTAL_DURATION_MS);
    timers.push(cloudTimer);

    // Step 3: Complete transition smoothly to hero-step
    const doneTimer = setTimeout(() => {
      onCompleteRef.current();
    }, TOTAL_DURATION_MS + 950);
    timers.push(doneTimer);

    return () => {
      timers.forEach(clearTimeout);
    };
  }, []);

  return (
    <AnimatePresence>
      {/* Opening Step Screen - Pristine #FDFDFD background */}
      <motion.div
        key="loading-bg"
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.45 }}
        className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[#FDFDFD] select-none"
      >
        {/* 5 Twinkling Stars Row */}
        <div className="flex items-center gap-3 sm:gap-4 mb-6" role="status" aria-label="Setting out the stars">
          {Array.from({ length: STAR_COUNT }).map((_, i) => {
            const isLit = litStars > i;
            return (
              <motion.div
                key={i}
                className="relative w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center"
                initial={{ opacity: 0.3, scale: 0.9 }}
                animate={
                  isLit
                    ? {
                        opacity: [1, 0.75, 1],
                        scale: [1.12, 0.98, 1.05],
                        rotate: [-5, 5, -2, 0],
                      }
                    : {
                        opacity: 0.32,
                        scale: 0.92,
                      }
                }
                transition={
                  isLit
                    ? {
                        duration: 1.6,
                        repeat: Infinity,
                        repeatType: 'reverse',
                        ease: 'easeInOut',
                        delay: (i % 2) * 0.15,
                      }
                    : { duration: 0.2 }
                }
              >
                <img
                  src={paperStar}
                  alt=""
                  role="presentation"
                  className="w-full h-full object-contain select-none drop-shadow-xs"
                />
              </motion.div>
            );
          })}
        </div>

        {/* Text in clean Montserrat font: "Setting out the stars for you, just a moment." */}
        <motion.p
          className="font-montserrat font-medium text-lg sm:text-xl text-[#2A2A3E] text-center px-6 tracking-wide"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          Setting out the stars for you, just a moment.
        </motion.p>
      </motion.div>

      {/* Clash-of-Clans style cloud wipe overlay */}
      {phase === 'clouds' && (
        <div className="fixed inset-0 z-[300] pointer-events-none overflow-hidden">
          {/* Top Cloud */}
          <motion.div
            className="absolute inset-x-0 top-0 h-[55vh]"
            style={{
              backgroundImage: `url(${clouds1})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center bottom',
            }}
            initial={{ y: '-100%' }}
            animate={{ y: ['-100%', '0%', '-100%'] }}
            transition={{ duration: 1.2, times: [0, 0.45, 1], ease: [0.65, 0, 0.35, 1] }}
          />

          {/* Left Cloud */}
          <motion.div
            className="absolute inset-y-0 left-0 w-[55vw]"
            style={{
              backgroundImage: `url(${clouds2})`,
              backgroundSize: 'cover',
              backgroundPosition: 'right center',
            }}
            initial={{ x: '-100%' }}
            animate={{ x: ['-100%', '0%', '-100%'] }}
            transition={{ duration: 1.2, times: [0, 0.45, 1], ease: [0.65, 0, 0.35, 1] }}
          />

          {/* Right Cloud */}
          <motion.div
            className="absolute inset-y-0 right-0 w-[55vw]"
            style={{
              backgroundImage: `url(${clouds2})`,
              backgroundSize: 'cover',
              backgroundPosition: 'left center',
              transform: 'scaleX(-1)',
            }}
            initial={{ x: '100%' }}
            animate={{ x: ['100%', '0%', '100%'] }}
            transition={{ duration: 1.2, times: [0, 0.45, 1], ease: [0.65, 0, 0.35, 1] }}
          />

          {/* Bottom Cloud */}
          <motion.div
            className="absolute inset-x-0 bottom-0 h-[55vh]"
            style={{
              backgroundImage: `url(${clouds3})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center top',
            }}
            initial={{ y: '100%' }}
            animate={{ y: ['100%', '0%', '100%'] }}
            transition={{ duration: 1.2, times: [0, 0.45, 1], ease: [0.65, 0, 0.35, 1] }}
          />

          {/* Screen wipe reveal flash */}
          <motion.div
            className="absolute inset-0 bg-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.85, 0] }}
            transition={{ duration: 1.0, times: [0, 0.5, 1], delay: 0.2 }}
          />
        </div>
      )}
    </AnimatePresence>
  );
}
