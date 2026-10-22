import { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { fetchWishingMessages } from '../../lib/supabase/client';
import { getAvatarForGuest } from './AvatarHelper';
import paperStar from '../../assets/paper-star.webp';
import wishingIcon from '../../assets/icon/dark/wishing-message.svg';

interface WishMessage {
  id: string;
  name: string;
  message: string;
}

interface WishCarouselProps {
  refreshTrigger?: number;
}

export function WishCarousel({ refreshTrigger }: WishCarouselProps) {
  const [wishes, setWishes] = useState<WishMessage[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  // People who prefer reduced motion get a manual carousel; everyone can pause or step through it
  const reduceMotion = useReducedMotion();
  const [userPaused, setUserPaused] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadWishes() {
      const data = await fetchWishingMessages();
      if (isMounted) {
        setWishes(data);
        setCurrentIndex(0);
      }
    }
    loadWishes();
    return () => {
      isMounted = false;
    };
  }, [refreshTrigger]);

  const autoPlay = !userPaused && !reduceMotion && !isHovering && !isFocused;

  // Advance every 5 seconds while playing (long enough to read a wish)
  useEffect(() => {
    if (wishes.length <= 1 || !autoPlay) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % wishes.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [wishes.length, autoPlay]);

  // Nothing to show yet: stay out of the way
  if (wishes.length === 0) {
    return null;
  }

  const currentWish = wishes[currentIndex] ?? wishes[0];
  const go = (delta: number) => setCurrentIndex((prev) => (prev + delta + wishes.length) % wishes.length);

  return (
    <section
      className="w-full max-w-xl mx-auto mt-2"
      aria-roledescription="carousel"
      aria-label="Birthday wishes"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
    >
      <div className="flex items-center justify-between gap-2 mb-2 px-2">
        <div className="flex items-center gap-2 text-white">
          <img src={wishingIcon} alt="" className="w-4 h-4 invert" />
          <h3 className="t-eyebrow">Wishes wall ({wishes.length})</h3>
          <img src={paperStar} alt="" className="w-4 h-4 select-none" />
        </div>

        {wishes.length > 1 && (
          <div className="flex items-center gap-1 text-white">
            <button type="button" onClick={() => go(-1)} className="icon-btn bg-white/15 text-white hover:bg-white/25" aria-label="Previous wish">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
            </button>
            {!reduceMotion && (
              <button
                type="button"
                onClick={() => setUserPaused((p) => !p)}
                className="icon-btn bg-white/15 text-white hover:bg-white/25"
                aria-label={userPaused ? 'Play wishes automatically' : 'Pause wishes'}
              >
                {userPaused ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 5h4v14H7zM13 5h4v14h-4z" /></svg>
                )}
              </button>
            )}
            <button type="button" onClick={() => go(1)} className="icon-btn bg-white/15 text-white hover:bg-white/25" aria-label="Next wish">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
            </button>
          </div>
        )}
      </div>

      <div className="material-thick relative min-h-[104px] overflow-hidden rounded-3xl p-4 sm:p-5 flex items-center" aria-live={autoPlay ? 'off' : 'polite'}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.figure
            key={currentWish.id + currentIndex}
            className="flex items-center gap-4 w-full"
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            aria-label={`Wish ${currentIndex + 1} of ${wishes.length}`}
          >
            <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 border-2 border-[#B496BC]">
              <img src={getAvatarForGuest(currentWish.id || currentWish.name)} alt="" className="w-full h-full object-cover" />
            </div>

            <div className="flex-1 min-w-0">
              <blockquote className="t-callout font-medium text-[#33334D] line-clamp-3 italic">“{currentWish.message}”</blockquote>
              <figcaption className="t-footnote font-semibold text-[var(--label)] mt-1 truncate">— {currentWish.name}</figcaption>
            </div>
          </motion.figure>
        </AnimatePresence>
      </div>

      {wishes.length > 1 && (
        <p className="t-footnote text-[var(--on-teal-secondary)] text-center mt-2" aria-hidden="true">
          {currentIndex + 1} of {wishes.length}
        </p>
      )}
    </section>
  );
}
