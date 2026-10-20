import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import catImg from '../../assets/person-img.webp';
import hatImg from '../../assets/hat.webp';
import paperStar from '../../assets/paper-star.webp';

export function FloatingMascot() {
  const { scrollYProgress } = useScroll();

  // Gentle spring physics for smooth, organic movement across scroll
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 75,
    damping: 22,
    restDelta: 0.001,
  });

  // Map scroll progress across sections:
  // 0.00 -> Hero (Center, behind ripped note card)
  // 0.22 - 0.35 -> Section Two: When and where? (Left side, matching section-two.png)
  // 0.45 - 0.60 -> Section Three: What to wear? (Right side, matching section-three.png)
  // 0.70+ -> Section Four & Five (Fades out cleanly as cat appears in phone notifications)

  // Horizontal position (percentage of viewport width)
  const xPercent = useTransform(
    smoothProgress,
    [0, 0.12, 0.25, 0.38, 0.50, 0.62, 0.75, 1.0],
    ['0%', '0%', '-33%', '-33%', '32%', '32%', '0%', '0%']
  );

  // Vertical offset
  const yPercent = useTransform(
    smoothProgress,
    [0, 0.12, 0.25, 0.38, 0.50, 0.62, 0.75, 1.0],
    ['-13%', '-13%', '-22%', '-22%', '-18%', '-18%', '35%', '35%']
  );

  // Scale: large in hero, medium in section 2 and section 3
  const scale = useTransform(
    smoothProgress,
    [0, 0.12, 0.25, 0.38, 0.50, 0.62, 0.75, 1.0],
    [1.05, 1.05, 0.75, 0.75, 0.8, 0.8, 0.4, 0]
  );

  // Opacity: visible in hero, section 2, section 3; smoothly disappears before section 4
  const opacity = useTransform(
    smoothProgress,
    [0, 0.62, 0.70, 1.0],
    [1, 1, 0, 0]
  );

  return (
    <motion.div
      className="fixed inset-0 pointer-events-none z-20 flex items-center justify-center"
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
        {/* Cat with party hat container */}
        <div className="relative w-48 sm:w-60 md:w-68">
          {/* Party Hat — brim sits flush on the cat's crown (no gap) */}
          <div className="absolute left-1/2 w-[46%] z-10 pointer-events-none"
            style={{ top: 0, transform: 'translate(-50%, -74%)' }}
          >
            <motion.img
              src={hatImg}
              alt=""
              role="presentation"
              className="w-full h-auto drop-shadow-md"
              animate={{
                rotate: [-2, 2, -2],
                y: [-1, 1, -1],
              }}
              transition={{
                duration: 3.2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          </div>

          {/* Kitten body */}
          <motion.img
            src={catImg}
            alt="Meow Birthday Mascot"
            className="w-full h-auto object-contain drop-shadow-xl"
            animate={{
              y: [0, -6, 0],
            }}
            transition={{
              duration: 3.8,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />

          {/* Floating whimsical stars accompanying the mascot */}
          <motion.img
            src={paperStar}
            alt=""
            role="presentation"
            className="absolute -top-6 -right-6 w-8 h-8 opacity-80"
            animate={{
              scale: [0.9, 1.1, 0.9],
              rotate: [0, 15, 0],
            }}
            transition={{
              duration: 2.8,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          <motion.img
            src={paperStar}
            alt=""
            role="presentation"
            className="absolute bottom-4 -left-6 w-6 h-6 opacity-70"
            animate={{
              scale: [1, 0.85, 1],
              rotate: [0, -20, 0],
            }}
            transition={{
              duration: 2.4,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 0.5,
            }}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}
