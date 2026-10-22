import { useState, useCallback } from 'react';
import { AnimatePresence, MotionConfig, useReducedMotion } from 'framer-motion';
import { LoadingScreen } from './components/motion/LoadingScreen';
import { ConfettiCanvas } from './components/motion/ConfettiCanvas';
import { FloatingMascot } from './components/motion/FloatingMascot';
import { HeroSection } from './components/layout/HeroSection';
import { WhenAndWhere } from './components/layout/WhenAndWhere';
import { DressCode } from './components/layout/DressCode';
import { EventReminders } from './components/layout/EventReminders';
import { GuestListSection } from './components/layout/GuestListSection';
import { Footer } from './components/layout/Footer';

export default function App() {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const prefersReducedMotion = useReducedMotion();

  const handleLoadingComplete = useCallback(() => {
    setIsLoading(false);
  }, []);

  return (
    // Respect the system "Reduce motion" setting for every framer-motion animation below
    <MotionConfig reducedMotion="user">
      <div
        className={`relative min-h-screen text-[#1A1A2E] overflow-x-hidden ${isLoading ? 'bg-[#FDFDFD]' : 'bg-[#0A515A]'}`}
      >
        {/* Opening step: twinkling paper stars, then a cloud wipe. Can be skipped. */}
        <AnimatePresence>{isLoading && <LoadingScreen onComplete={handleLoadingComplete} />}</AnimatePresence>

        {!isLoading && (
          <>
            <a href="#main" className="skip-link">
              Skip to invitation
            </a>

            {/* Festive confetti, left out entirely when the person prefers reduced motion */}
            {!prefersReducedMotion && <ConfettiCanvas particleCount={110} />}

            {/* Cat + party hat that glides between sections */}
            <FloatingMascot />

            <main id="main" className="relative z-10 flex flex-col">
              <HeroSection />
              <WhenAndWhere />
              <DressCode />
              <EventReminders />
              <GuestListSection />
            </main>

            <Footer />
          </>
        )}
      </div>
    </MotionConfig>
  );
}
