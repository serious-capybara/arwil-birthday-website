import { Suspense, lazy } from 'react';
import { motion } from 'framer-motion';
import nameBg from '../assets/name-bg.png';

const HeroScene = lazy(() =>
  import('../three/HeroScene').then((m) => ({ default: m.HeroScene }))
);

export function HeroSection() {
  return (
    <section
      id="hero"
      className="section-full bg-fixed-birthday flex flex-col items-center justify-end pb-12 sm:pb-20 relative"
      aria-label="Birthday invitation hero"
    >
      {/* 3D Scene overlay */}
      <Suspense fallback={null}>
        <HeroScene className="absolute inset-0 pointer-events-none z-10" />
      </Suspense>

      {/* Name banner / title card */}
      <motion.div
        className="relative z-20 w-[85vw] max-w-sm sm:max-w-md"
        initial={{ opacity: 0, y: 60, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.9, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Grid note paper background */}
        <div
          className="relative rounded-lg overflow-hidden shadow-xl"
          style={{
            backgroundImage: `url(${nameBg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="px-6 py-8 sm:px-10 sm:py-10">
            <motion.h1
              className="font-heaven text-5xl sm:text-6xl md:text-7xl leading-tight text-[#1A1A2E] tracking-wide"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.8 }}
            >
              Meow<br />
              Yoga<br />
              Birthday<span className="text-[#C4526A]">.</span>
            </motion.h1>

            <motion.p
              className="font-montserrat text-sm sm:text-base text-[#4a4a6a] mt-3 font-medium"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.6 }}
            >
              Please bring your own yoga mat
            </motion.p>
          </div>
        </div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.8 }}
      >
        <span className="font-montserrat text-xs text-[#6b5b73] tracking-widest uppercase">Scroll</span>
        <motion.div
          className="w-0.5 h-8 bg-[#C8A8D8] rounded-full"
          animate={{ scaleY: [1, 0.4, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>
    </section>
  );
}
