import { Suspense, lazy } from 'react';
import { motion } from 'framer-motion';
import nameBg from '../../assets/name-bg.webp';

const HeroScene = lazy(() => import('../../three/HeroScene').then((m) => ({ default: m.HeroScene })));

export function HeroSection() {
  return (
    <section
      id="hero"
      className="section-full min-h-screen flex flex-col items-center justify-end pb-6 sm:pb-10 relative overflow-hidden"
      aria-label="Birthday invitation"
    >
      {/* Soft stage light behind the cat */}
      <div className="stage" aria-hidden="true" />

      {/* 3D scene: two swinging disco balls and physics balloons you can touch */}
      <Suspense fallback={null}>
        <HeroScene className="absolute inset-0 pointer-events-auto z-10" />
      </Suspense>

      {/* Ripped graph-paper title card, overlapping the bottom of the cat */}
      <motion.div
        className="relative z-[25] flex flex-col items-center"
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="paper-card">
          <img src={nameBg} alt="" role="presentation" className="select-none" draggable={false} />
          <div className="paper-copy">
            <h1>
              Meow Yoga
              <br />
              Birthday
            </h1>
            <p className="paper-date">
              <span className="sr-only">Date: </span>
              <time dateTime="2026-11-20T18:40">Nov 20 · 6:40 pm</time>
            </p>
            <p>Please bring your own yoga mat</p>
          </div>
        </div>
      </motion.div>

      {/* Scroll hint is also a real link, so it works with keyboard, mouse and touch */}
      <motion.a
        href="#when-where"
        className="relative z-20 mt-3 min-h-11 px-4 flex flex-col items-center justify-center gap-1 rounded-full text-[var(--on-teal-secondary)] no-underline hover:text-white"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1, duration: 0.8 }}
      >
        <span className="t-footnote font-medium">Scroll to explore</span>
        <svg className="nudge" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </motion.a>
    </section>
  );
}
