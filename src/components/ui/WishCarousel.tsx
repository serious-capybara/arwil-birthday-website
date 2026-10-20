import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadWishes() {
      const data = await fetchWishingMessages();
      if (isMounted) {
        setWishes(data);
      }
    }
    loadWishes();
    return () => {
      isMounted = false;
    };
  }, [refreshTrigger]);

  // Rotate messages: displays one message, holds for 3 seconds, then transitions from right to left
  useEffect(() => {
    if (wishes.length <= 1 || isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % wishes.length);
    }, 4000); // 1s transition + 3s hold

    return () => clearInterval(interval);
  }, [wishes.length, isPaused]);

  // If there are no messages, hide cleanly as strictly requested
  if (wishes.length === 0) {
    return null;
  }

  const currentWish = wishes[currentIndex];

  return (
    <div
      className="w-full max-w-xl mx-auto my-4 px-2"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="flex items-center justify-between mb-2 px-3">
        <div className="flex items-center gap-2">
          <img src={wishingIcon} alt="" className="w-4 h-4" />
          <span className="font-montserrat font-bold text-xs uppercase tracking-wider text-[#6b5b73]">
            Birthday Wishes Wall ({wishes.length})
          </span>
          <img src={paperStar} alt="" className="w-4 h-4 select-none" />
        </div>
        <span className="font-montserrat text-[11px] text-[#8e7b97]">
          {currentIndex + 1} of {wishes.length}
        </span>
      </div>

      {/* Single message card with right-to-left slide & 3-second hold */}
      <div className="relative min-h-[96px] overflow-hidden rounded-3xl bg-white/85 backdrop-blur-md border border-white/80 shadow-md p-4 sm:p-5 flex items-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentWish.id + currentIndex}
            className="flex items-center gap-3.5 w-full"
            initial={{ opacity: 0, x: 80 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -80 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Guest Avatar */}
            <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 border-2 border-[#B496BC] shadow-xs">
              <img
                src={getAvatarForGuest(currentWish.id || currentWish.name)}
                alt={currentWish.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Name and Message */}
            <div className="flex-1 min-w-0 pr-2">
              <span className="font-montserrat font-bold text-xs sm:text-sm text-[#1A1A2E] truncate block">
                {currentWish.name}
              </span>
              <p className="font-montserrat font-medium text-xs sm:text-sm text-[#3d3d5a] line-clamp-2 leading-relaxed mt-0.5 italic">
                "{currentWish.message}"
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
