import { useState, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
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

  const handleLoadingComplete = useCallback(() => {
    setIsLoading(false);
  }, []);

  return (
    <div className={`relative min-h-screen text-[#1A1A2E] font-montserrat overflow-x-hidden selection:bg-[#F9C5D1] selection:text-[#1A1A2E] ${isLoading ? 'bg-[#FDFDFD]' : 'bg-[#0A515A]'}`}>
      {/* Opening Step: Twinkling 5 paper stars on #FDFDFD background + Clash of Clans style cloud wipe */}
      <AnimatePresence>
        {isLoading && (
          <LoadingScreen onComplete={handleLoadingComplete} />
        )}
      </AnimatePresence>

      {/* Main Single-Page Birthday Invitation Content */}
      {!isLoading && (
        <>
          {/* Festive dynamic confetti canvas */}
          <ConfettiCanvas particleCount={130} />

          {/* Interactive Floating Mascot (Cat + Hat) that glides between sections */}
          <FloatingMascot />

          {/* Sections flow matching design references */}
          <main className="relative z-10 flex flex-col">
            {/* Hero Section: Pink disco balls, cat behind ripped note paper, metallic balloons */}
            <HeroSection />

            {/* When and Where Section: "When and where?" card, WHEN / WHERE mauve cards, mini map & confirmation modal */}
            <WhenAndWhere />

            {/* Dress Code Section: "What to wear?" card, THIS (pastel pink) / THAT (lavender) cards */}
            <DressCode />

            {/* Reminders Section: 3D iPhone 18, live clock, centered disco ball, 3D tilt glass notifications */}
            <EventReminders />

            {/* Guest List & RSVP Section: Max 5 rows, real-time search, Supabase integration, wishing ticker, Save the Date modal */}
            <GuestListSection />
          </main>

          {/* Clean Footer */}
          <Footer />
        </>
      )}
    </div>
  );
}
