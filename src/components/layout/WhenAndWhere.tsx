import { useState } from 'react';
import { motion } from 'framer-motion';
import paperStar from '../../assets/paper-star.webp';
import silverStars from '../../assets/silver-dusk-star.webp';
import mapsIcon from '../../assets/icon/light/maps-redirect.svg';
import { LocationMapModal } from '../ui/LocationMapModal';

const MAP_URL = 'https://maps.app.goo.gl/Hbg3yb28qrppTYQ4A';

export function WhenAndWhere() {
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
      {/* Decorative Silver Dusk Stars background trail as seen in section-two.png */}
      <img
        src={silverStars}
        alt=""
        role="presentation"
        className="absolute bottom-4 right-0 w-80 sm:w-96 md:w-[32rem] opacity-75 pointer-events-none select-none z-0"
      />

      <div className="relative z-10 w-full max-w-xl sm:max-w-2xl mx-auto flex flex-col gap-6 sm:gap-8">
        {/* "When and where?" Question Card sliding from right (as in section-two.png) */}
        <motion.div
          className="self-end w-[86%] sm:w-[75%] md:w-[68%]"
          initial={{ opacity: 0, x: 80 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="relative bg-white rounded-[32px] sm:rounded-[36px] py-7 px-8 sm:py-8 sm:px-10 shadow-lg border border-white/80">
            {/* Hand-drawn Stars on corners (section-two.png) */}
            <img
              src={paperStar}
              alt=""
              role="presentation"
              className="absolute -top-4 -right-4 w-9 h-9 sm:w-11 sm:h-11 select-none drop-shadow-xs"
            />
            <img
              src={paperStar}
              alt=""
              role="presentation"
              className="absolute -bottom-3 -left-3 w-7 h-7 sm:w-9 sm:h-9 select-none opacity-85 drop-shadow-xs"
            />

            <h2 className="font-montserrat text-2xl sm:text-3xl text-center font-normal text-[#1A1A2E] tracking-tight">
              When and where?
            </h2>
          </div>
        </motion.div>

        {/* WHEN Block (Right aligned heading & mauve pill box) */}
        <motion.div
          className="flex flex-col items-end w-full"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, delay: 0.15 }}
        >
          <span className="font-montserrat font-black text-sm sm:text-base text-black tracking-widest uppercase mb-1.5 mr-3">
            WHEN
          </span>

          <div className="w-[88%] sm:w-[72%] bg-[#B496BC] rounded-3xl px-6 py-4 sm:py-5 shadow-sm text-center">
            <p className="font-montserrat font-bold text-xl sm:text-2xl md:text-3xl text-[#1A1A2E] tracking-tight">
              November 20, 6:40 pm
            </p>
          </div>
        </motion.div>

        {/* WHERE Block (Left aligned heading & mauve box) */}
        <motion.div
          className="flex flex-col items-start w-full"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, delay: 0.25 }}
        >
          <span className="font-montserrat font-black text-sm sm:text-base text-black tracking-widest uppercase mb-1.5 ml-3">
            WHERE
          </span>

          <div className="w-[92%] sm:w-[82%] bg-[#B496BC] rounded-3xl p-5 sm:p-6 shadow-sm">
            <p className="font-montserrat font-semibold text-lg sm:text-xl md:text-2xl text-[#1A1A2E] leading-relaxed">
              The Almonds Boutique Aparthotel, SerenityCore Wellness Hub Palette, Hon. Tudtud Road
            </p>
          </div>
        </motion.div>

        {/* [Map Here] Box matching section-two.png with embedded Google Map and Confirmation Modal */}
        <motion.div
          className="w-full relative mt-1"
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, delay: 0.35 }}
        >
          <div className="relative rounded-[32px] overflow-hidden shadow-lg bg-[#B496BC] p-2 sm:p-3 group">
            {/* Embedded interactive Google Map iframe */}
            <div className="relative rounded-[26px] overflow-hidden bg-[#B496BC]/30 h-64 sm:h-72">
              <iframe
                title="Event Location Map"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3925.321115598687!2d123.9144444!3d10.3235556!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x33a999238933b931%3A0x67dbfa97a15aefb!2sThe%20Almonds%20Boutique%20Aparthotel!5e0!3m2!1sen!2sph!4v1700000000000!5m2!1sen!2sph"
                className="w-full h-full border-0 rounded-[26px]"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />

              {/* Click trigger overlay to confirm exiting to Google Maps */}
              <div className="absolute inset-0 bg-black/15 hover:bg-black/25 transition-colors flex items-center justify-center p-4">
                <button
                  type="button"
                  onClick={() => setShowMapModal(true)}
                  className="bg-white hover:bg-white/95 text-[#1A1A2E] font-montserrat font-bold text-xs sm:text-sm px-6 py-3 rounded-full shadow-lg transition-all transform hover:scale-105 flex items-center gap-2.5 cursor-pointer"
                >
                  <span>Open Full Directions in Google Maps</span>
                  <span className="bg-[#1A1A2E] p-1.5 rounded-full inline-flex items-center justify-center">
                    <img src={mapsIcon} alt="" className="w-3.5 h-3.5" />
                  </span>
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Confirmation Modal to Exit to Google Maps */}
      <LocationMapModal
        isOpen={showMapModal}
        onClose={() => setShowMapModal(false)}
        onConfirm={handleOpenMaps}
      />
    </section>
  );
}
