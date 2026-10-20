import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { LoadingScreen } from './components/LoadingScreen';
import { Confetti } from './components/Confetti';
import { FloatingMascot } from './components/FloatingMascot';
import { HeroSection } from './components/HeroSection';
import { SectionTwo } from './components/SectionTwo';
import { SectionThree } from './components/SectionThree';
import { SectionFour } from './components/SectionFour';
import { SectionFive } from './components/SectionFive';

export default function App() {
  const [isLoading, setIsLoading] = useState<boolean>(true);

  return (
    <div className="relative min-h-screen bg-[#F5EDD8] text-[#1A1A2E] font-montserrat overflow-x-hidden selection:bg-[#F9C5D1] selection:text-[#1A1A2E]">
      {/* Opening Step: Loading screen with star twinkles and Clash-of-Clans style cloud wipe */}
      <AnimatePresence>
        {isLoading && (
          <LoadingScreen onComplete={() => setIsLoading(false)} />
        )}
      </AnimatePresence>

      {/* Main One-Page Invitation Content */}
      {!isLoading && (
        <>
          {/* Confetti celebration effect on Hero */}
          <Confetti particleCount={140} />

          {/* Floating Mascot (Cat + Hat) that shifts position across sections like an interactive product presentation */}
          <FloatingMascot />

          {/* Page Sections */}
          <main className="relative z-10 flex flex-col">
            {/* Hero Step */}
            <HeroSection />

            {/* Section Two: When and Where? */}
            <SectionTwo />

            {/* Section Three: What to wear? */}
            <SectionThree />

            {/* Section Four: Reminders (iPhone 18 3D + Live Clock + Grouped Glass Notifications) */}
            <SectionFour />

            {/* Section Five: Guest List, Verification, RSVP with Save the Date, Responsive Wish Sheet, & Wish Carousel */}
            <SectionFive />
          </main>

          {/* Footer */}
          <footer className="relative z-10 py-10 px-4 text-center border-t border-black/5 bg-[#F5EDD8]">
            <p className="font-heaven text-2xl text-[#1A1A2E]">
              Meow Yoga Birthday
            </p>
            <p className="font-montserrat text-xs text-[#6b5b73] mt-1">
              November 20, 2026 • Hon. Tudtud Road, Cebu City • With love & meows 🐾
            </p>
          </footer>
        </>
      )}
    </div>
  );
}
