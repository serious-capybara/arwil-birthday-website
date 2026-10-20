import { Suspense, lazy } from 'react';
import { motion } from 'framer-motion';
import nameBg from '../../assets/name-bg.webp';

const HeroScene = lazy(() =>
  import('../../three/HeroScene').then((m) => ({ default: m.HeroScene }))
);

export function HeroSection() {
  return (
    <section
      id="hero"
      className="section-full min-h-screen flex flex-col items-center justify-end pb-12 sm:pb-16 relative overflow-hidden"
      aria-label="Birthday invitation hero"
    >
      {/* 3D Scene (Pink Disco balls top-left & top-right, floating metallic balloons) */}
      <Suspense fallback={null}>
        <HeroScene className="absolute inset-0 pointer-events-none z-10" />
      </Suspense>

      {/* Ripped Graph Paper Title Card - Placed to overlap bottom of cat mascot exactly as in hero-step.png */}
      <motion.div
        className="relative z-25 w-[92vw] max-w-[360px] sm:max-w-[420px] mb-4 sm:mb-8"
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="relative flex flex-col items-center justify-center">
          {/* Authentic Ripped Paper image with transparent cutouts */}
          <img
            src={nameBg}
            alt=""
            role="presentation"
            className="w-full h-auto object-contain select-none drop-shadow-xl"
          />

          {/* Text positioned right on the ripped graph paper as in hero-step.png */}
          <div className="absolute inset-0 pt-6 sm:pt-8 px-4 flex flex-col items-center justify-center text-center">
            <h1 className="font-montserrat font-extrabold text-2xl sm:text-3xl md:text-4xl tracking-[0.12em] uppercase text-black leading-snug">
              Meow<br />
              Yoga<br />
              Birthday
            </h1>

            <p className="font-montserrat text-xs sm:text-sm text-[#2A2A3E] font-medium tracking-normal mt-2">
              Please bring your own yoga mat
            </p>
          </div>
        </div>
      </motion.div>

      {/* Subtle Scroll Hint */}
      <motion.div
        className="relative z-20 flex flex-col items-center gap-1.5 opacity-70"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.75 }}
        transition={{ delay: 1.2, duration: 0.8 }}
      >
        <span className="font-montserrat text-[10px] tracking-widest uppercase text-[#554a5c]">
          Scroll to explore
        </span>
        <motion.div
          className="w-1 h-6 bg-[#B496BC] rounded-full"
          animate={{ scaleY: [1, 0.4, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>
    </section>
  );
}
