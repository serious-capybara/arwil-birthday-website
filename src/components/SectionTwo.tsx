import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import paperStar from '../assets/paper-star.png';
import silverStars from '../assets/silver-dusk-star.png';
import mapsIcon from '../assets/icon/light/maps-redirect.svg';

const MAP_URL = 'https://maps.app.goo.gl/Hbg3yb28qrppTYQ4A';

export function SectionTwo() {
  const [showMapModal, setShowMapModal] = useState(false);

  const handleOpenMaps = () => {
    setShowMapModal(false);
    window.open(MAP_URL, '_blank', 'noopener,noreferrer');
  };

  return (
    <section
      id="when-where"
      className="section-full min-h-screen py-20 px-4 sm:px-8 relative flex flex-col justify-center items-center overflow-hidden"
      aria-label="When and where section"
    >
      {/* Decorative Silver Dusk Stars background trail */}
      <img
        src={silverStars}
        alt=""
        role="presentation"
        className="absolute bottom-4 right-0 w-80 sm:w-96 md:w-[32rem] opacity-75 pointer-events-none select-none z-0"
      />

      <div className="relative z-10 w-full max-w-2xl mx-auto flex flex-col gap-8">
        {/* "When and where?" question card sliding from right */}
        <motion.div
          className="self-end w-[85%] sm:w-[75%] md:w-[68%]"
          initial={{ opacity: 0, x: 80 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="relative bg-white rounded-3xl p-6 sm:p-8 shadow-md border border-white/60">
            {/* Stars on corner */}
            <img
              src={paperStar}
              alt=""
              role="presentation"
              className="absolute -top-4 -right-4 w-9 h-9 select-none"
            />
            <img
              src={paperStar}
              alt=""
              role="presentation"
              className="absolute -bottom-3 -left-3 w-7 h-7 select-none opacity-80"
            />

            <h2 className="font-montserrat text-xl sm:text-2xl md:text-3xl text-center font-normal text-[#1A1A2E]">
              When and where?
            </h2>
          </div>
        </motion.div>

        {/* WHEN Block */}
        <motion.div
          className="flex flex-col items-end w-full"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, delay: 0.15 }}
        >
          <span className="font-montserrat font-extrabold text-sm sm:text-base text-[#1A1A2E] tracking-widest uppercase mb-2 mr-2">
            WHEN
          </span>
          <div className="w-[85%] sm:w-[70%] bg-[#C8A8D8] rounded-2xl px-6 py-4 shadow-sm text-center">
            <p className="font-heaven text-xl sm:text-2xl md:text-3xl text-[#1A1A2E]">
              November 20, 6:40 pm
            </p>
          </div>
        </motion.div>

        {/* WHERE Block */}
        <motion.div
          className="flex flex-col items-start w-full"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, delay: 0.25 }}
        >
          <span className="font-montserrat font-extrabold text-sm sm:text-base text-[#1A1A2E] tracking-widest uppercase mb-2 ml-2">
            WHERE
          </span>
          <div className="w-[90%] sm:w-[80%] bg-[#C8A8D8] rounded-2xl p-5 sm:p-6 shadow-sm">
            <p className="font-heaven text-lg sm:text-xl md:text-2xl text-[#1A1A2E] leading-relaxed">
              The Almonds Boutique Aparthotel, SerenityCore Wellness Hub Palette, Hon. Tudtud Road
            </p>
          </div>
        </motion.div>

        {/* Map Preview Container */}
        <motion.div
          className="w-full relative mt-2"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, delay: 0.35 }}
        >
          <div className="relative rounded-3xl overflow-hidden shadow-lg border-4 border-[#C8A8D8] bg-[#C8A8D8]/20 group">
            {/* Embedded interactive Google Map iframe */}
            <iframe
              title="Event Location Map"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3925.321115598687!2d123.9144444!3d10.3235556!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x33a999238933b931%3A0x67dbfa97a15aefb!2sThe%20Almonds%20Boutique%20Aparthotel!5e0!3m2!1sen!2sph!4v1700000000000!5m2!1sen!2sph"
              className="w-full h-56 sm:h-72 border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />

            {/* Click overlay trigger for full map confirmation */}
            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/25 transition-colors flex items-center justify-center p-4">
              <button
                type="button"
                onClick={() => setShowMapModal(true)}
                className="bg-white/90 hover:bg-white text-[#1A1A2E] font-montserrat font-bold text-xs sm:text-sm px-5 py-3 rounded-full shadow-lg backdrop-blur-sm transition-all transform hover:scale-105 flex items-center gap-2 cursor-pointer"
              >
                <span>View Pinned Location on Maps</span>
                <span className="bg-[#1A1A2E] p-1.5 rounded-full inline-flex items-center justify-center">
                  <img src={mapsIcon} alt="" className="w-3.5 h-3.5" />
                </span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Confirmation Modal to Exit to Google Maps */}
      <AnimatePresence>
        {showMapModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-gray-100 flex flex-col gap-4 text-center"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
            >
              <div className="w-12 h-12 rounded-full bg-[#F9C5D1] text-[#1A1A2E] flex items-center justify-center mx-auto mb-1">
                <img src={mapsIcon} alt="" className="w-6 h-6 invert" />
              </div>

              <h3 className="font-montserrat font-bold text-lg sm:text-xl text-[#1A1A2E]">
                Open Google Maps?
              </h3>
              <p className="font-montserrat text-sm text-[#4a4a6a]">
                You will be redirected to Google Maps in a new tab to see full directions to{' '}
                <span className="font-semibold text-[#1A1A2E]">
                  The Almonds Boutique Aparthotel, SerenityCore Wellness Hub Palette
                </span>.
              </p>

              <div className="flex gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setShowMapModal(false)}
                  className="flex-1 py-3 px-4 rounded-xl border border-gray-300 font-montserrat font-semibold text-sm text-gray-700 hover:bg-gray-50 transition"
                >
                  Stay Here
                </button>
                <button
                  type="button"
                  onClick={handleOpenMaps}
                  className="flex-1 py-3 px-4 rounded-xl bg-[#1A1A2E] text-white font-montserrat font-semibold text-sm hover:bg-[#2b2b48] shadow-md transition flex items-center justify-center gap-2"
                >
                  <span>Continue</span>
                  <img src={mapsIcon} alt="" className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
