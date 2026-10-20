import { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import personImgTwo from '../../assets/person-img-two.webp';
import personImgThree from '../../assets/person-img-three.webp';

const PhoneScene = lazy(() =>
  import('../../three/PhoneScene').then((m) => ({ default: m.PhoneScene }))
);
const HeroScene = lazy(() =>
  import('../../three/HeroScene').then((m) => ({ default: m.HeroScene }))
);

export function EventReminders() {
  // Live real-time clock and date
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');

  useEffect(() => {
    function updateClock() {
      const now = new Date();
      // Format time: "6:20 PM"
      const timeStr = now.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
      setCurrentTime(timeStr);

      // Format date: "October 20, 2026"
      const dateStr = now.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
      setCurrentDate(dateStr);
    }

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Synchronized 3D tilt interaction for grouped iPhone + Clock + Notifications
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 22, stiffness: 85 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  const rotateX = useTransform(smoothY, [-0.5, 0.5], [10, -10]);
  const rotateY = useTransform(smoothX, [-0.5, 0.5], [-12, 12]);

  const [rawCoords, setRawCoords] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const normX = (e.clientX - rect.left) / rect.width - 0.5;
    const normY = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(normX);
    mouseY.set(normY);
    setRawCoords({ x: normX, y: normY });
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
    setRawCoords({ x: 0, y: 0 });
  };

  // Device orientation (gyroscope) support for mobile devices
  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.gamma !== null && e.beta !== null) {
        const gx = Math.min(Math.max(e.gamma / 45, -0.5), 0.5);
        const gy = Math.min(Math.max((e.beta - 45) / 45, -0.5), 0.5);
        mouseX.set(gx);
        mouseY.set(gy);
        setRawCoords({ x: gx, y: gy });
      }
    };

    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', handleOrientation);
    }
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, [mouseX, mouseY]);

  return (
    <section
      id="reminders"
      className="section-full min-h-screen py-20 px-4 sm:px-8 relative flex flex-col items-center justify-center overflow-hidden"
      aria-label="Event reminders section"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Grouped 3D Perspective Container */}
      <div
        ref={containerRef}
        className="relative w-full max-w-md sm:max-w-lg flex flex-col items-center justify-center [perspective:1200px]"
      >
        <motion.div
          className="relative w-full flex flex-col items-center [transform-style:preserve-3d]"
          style={{
            rotateX,
            rotateY,
          }}
          animate={{
            y: [0, -8, 0],
          }}
          transition={{
            duration: 4.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          {/* Top Disco Ball Accent (centered directly above phone as in section-four.png) */}
          <div className="w-48 h-48 sm:w-56 sm:h-56 -mb-16 z-20 pointer-events-none">
            <Suspense fallback={null}>
              <HeroScene isSingleBallTop className="w-full h-full" />
            </Suspense>
          </div>

          {/* iPhone 18 Frame Container matching section-four.png */}
          <div className="relative w-[86vw] max-w-[340px] sm:max-w-[370px] h-[580px] sm:h-[630px] rounded-[52px] p-3 shadow-2xl border-[6px] border-[#181920] bg-[#0c0d12] flex flex-col items-center overflow-hidden [transform-style:preserve-3d]">
            {/* Wallpaper Background matching birthday texture */}
            <div
              className="absolute inset-0 bg-cover bg-center rounded-[44px] opacity-95"
              style={{ backgroundImage: "url('/src/assets/birth-day-bg.webp')" }}
            />

            {/* Subtle glass reflection highlight */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-white/20 rounded-[44px] pointer-events-none" />

            {/* Dynamic Island */}
            <div className="relative z-20 mt-2 w-28 h-6 bg-black rounded-full flex items-center justify-between px-3">
              <div className="w-2.5 h-2.5 rounded-full bg-[#1A1A2E]/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#0a0a14]" />
            </div>

            {/* Lock Screen Date & Live Clock */}
            <div className="relative z-20 mt-6 sm:mt-7 flex flex-col items-center text-center">
              <span className="font-montserrat font-medium text-xs sm:text-sm text-[#1A1A2E]/80 tracking-wide">
                {currentDate || 'October 20, 2026'}
              </span>
              <h3 className="font-montserrat font-black text-4xl sm:text-5xl text-[#1A1A2E] tracking-tight mt-1">
                {currentTime || '6:20 PM'}
              </h3>
            </div>

            {/* 3D Model subtle depth layer */}
            <div className="absolute inset-0 pointer-events-none opacity-40 z-10">
              <Suspense fallback={null}>
                <PhoneScene mouseX={rawCoords.x} mouseY={rawCoords.y} />
              </Suspense>
            </div>

            {/* Floating Glassmorphism Notifications matching section-four.png */}
            <div className="relative z-30 mt-auto mb-8 w-full flex flex-col gap-3 px-2 sm:px-3">
              {/* Notification 1: Outfit Ready? */}
              <motion.div
                className="notif-card p-4 rounded-2xl flex items-center justify-between gap-3 shadow-lg border border-white/60 bg-white/75 backdrop-blur-md"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <div className="flex-1 pr-1">
                  <span className="font-montserrat text-[11px] font-bold text-[#6b5b73] uppercase tracking-wider block">
                    Reminders
                  </span>
                  <h4 className="font-montserrat text-xs sm:text-sm font-bold text-[#1A1A2E] mt-0.5">
                    Outfit Ready?
                  </h4>
                  <p className="font-montserrat text-[11px] sm:text-xs text-[#2d2d44] leading-relaxed mt-0.5">
                    Do not forget to wear your pink or lavender comfortable outfit on the day.
                  </p>
                  <span className="font-montserrat text-[11px] font-bold text-[#1A1A2E] mt-1 block">
                    Yoga mat ready?
                  </span>
                </div>

                <div className="w-14 h-14 sm:w-16 sm:h-16 flex-shrink-0 rounded-xl overflow-hidden bg-white/80 p-0.5 border border-white/80 shadow-xs">
                  <img
                    src={personImgTwo}
                    alt="Reminder mascot"
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>
              </motion.div>

              {/* Notification 2: Yoga start time */}
              <motion.div
                className="notif-card p-4 rounded-2xl flex items-center justify-between gap-3 shadow-lg border border-white/60 bg-white/75 backdrop-blur-md"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <div className="flex-1 pr-1">
                  <span className="font-montserrat text-[11px] font-bold text-[#6b5b73] uppercase tracking-wider block">
                    Reminders
                  </span>
                  <h4 className="font-montserrat text-xs sm:text-sm font-bold text-[#1A1A2E] mt-0.5">
                    Yoga start time
                  </h4>
                  <p className="font-montserrat text-[11px] sm:text-xs text-[#2d2d44] leading-relaxed mt-0.5">
                    Our Yoga will start at exactly <strong>6:40 PM</strong>. Dinner and short activity will shortly follow.
                  </p>
                </div>

                <div className="w-14 h-14 sm:w-16 sm:h-16 flex-shrink-0 rounded-xl overflow-hidden bg-white/80 p-0.5 border border-white/80 shadow-xs">
                  <img
                    src={personImgThree}
                    alt="Reminder mascot"
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
