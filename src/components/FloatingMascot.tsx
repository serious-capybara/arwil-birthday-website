import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import catImg from '../assets/person-img.png';
import hatImg from '../assets/hat.png';

interface FloatingMascotProps {
  currentSection?: number; // fallback or manual override
}

export function FloatingMascot({ }: FloatingMascotProps) {
  const { scrollYProgress } = useScroll();

  // Smooth out scroll progress with a gentle spring
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 85,
    damping: 24,
    restDelta: 0.001,
  });

  // Map scroll progress across sections:
  // 0.00 -> Hero (center)
  // 0.25 -> Section 2 (left side)
  // 0.50 -> Section 3 (right side)
  // 0.75 -> Section 4 (iPhone reminders - cat fades as it appears inside phone notifications)
  // 1.00 -> Section 5 (RSVP & wishes)

  // Responsive X position (% of viewport width or translate)
  const xPercent = useTransform(
    smoothProgress,
    [0, 0.15, 0.28, 0.42, 0.55, 0.70, 0.85, 1.0],
    ['0%', '0%', '-34%', '-34%', '32%', '32%', '0%', '0%']
  );

  // Y position (% or vh offset)
  const yPercent = useTransform(
    smoothProgress,
    [0, 0.15, 0.28, 0.42, 0.55, 0.70, 0.85, 1.0],
    ['-18%', '-18%', '-28%', '-28%', '-25%', '-25%', '40%', '40%']
  );

  // Scale: bigger in hero, medium in sections 2 & 3, shrinks in section 4
  const scale = useTransform(
    smoothProgress,
    [0, 0.15, 0.28, 0.42, 0.55, 0.70, 0.85, 1.0],
    [1, 1, 0.65, 0.65, 0.72, 0.72, 0.4, 0]
  );

  // Opacity: visible in hero, sec 2, sec 3; fades out in sec 4 because cat is inside iPhone screen
  const opacity = useTransform(
    smoothProgress,
    [0, 0.68, 0.78, 1.0],
    [1, 1, 0, 0]
  );

  // Subtle floating wobble
  return (
    <motion.div
      className="fixed inset-0 pointer-events-none z-30 flex items-center justify-center"
      style={{ opacity }}
    >
      <motion.div
        className="relative flex flex-col items-center select-none"
        style={{
          x: xPercent,
          y: yPercent,
          scale,
        }}
      >
        {/* Cat mascot with party hat */}
        <div className="relative w-44 sm:w-56 md:w-64">
          {/* Party Hat - positioned right above cat's head */}
          <motion.img
            src={hatImg}
            alt=""
            role="presentation"
            className="absolute -top-[52%] left-1/2 -translate-x-1/2 w-[52%] h-auto z-10 pointer-events-none drop-shadow-md"
            animate={{
              rotate: [-2, 2, -2],
              y: [-1, 1, -1],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />

          {/* Kitten body */}
          <motion.img
            src={catImg}
            alt="Meow Birthday Mascot"
            className="w-full h-auto object-contain drop-shadow-xl"
            animate={{
              y: [0, -6, 0],
            }}
            transition={{
              duration: 3.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}
