import { useState } from 'react';
import { motion } from 'framer-motion';
import paperStar from '../../assets/paper-star.webp';
import silverStars from '../../assets/silver-dusk-star.webp';
import mapsIcon from '../../assets/icon/light/maps-redirect.svg';
import { LocationMapModal } from '../ui/LocationMapModal';

const MAP_URL = 'https://maps.app.goo.gl/Hbg3yb28qrppTYQ4A';

const reveal = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.3 },
};

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
      aria-labelledby="when-where-title"
    >
      <div className="stage" aria-hidden="true" />

      {/* Decorative silver stars */}
      <img
        src={silverStars}
        alt=""
        role="presentation"
        className="absolute bottom-4 right-0 w-80 sm:w-96 md:w-[32rem] opacity-70 pointer-events-none select-none z-0"
      />

      <div className="relative z-10 w-full max-w-xl sm:max-w-2xl mx-auto flex flex-col gap-6 sm:gap-8">
        {/* Section title card */}
        <motion.div
          className="self-end w-[86%] sm:w-[75%] md:w-[68%]"
          initial={{ opacity: 0, x: 60 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="relative bg-white rounded-[32px] py-7 px-8 sm:py-8 sm:px-10" style={{ boxShadow: 'var(--elev-2)' }}>
            <img src={paperStar} alt="" role="presentation" className="absolute -top-4 -right-4 w-10 h-10 sm:w-12 sm:h-12 select-none drop-shadow-xs" />
            <img src={paperStar} alt="" role="presentation" className="absolute -bottom-3 -left-3 w-8 h-8 sm:w-10 sm:h-10 select-none opacity-90 drop-shadow-xs" />
            <h2 id="when-where-title" className="t-title text-center text-[#1A1A2E]">
              When and where?
            </h2>
          </div>
        </motion.div>

        {/* WHEN */}
        <motion.div className="flex flex-col items-end w-full" {...reveal} transition={{ duration: 0.7, delay: 0.1 }}>
          <h3 className="t-eyebrow text-white mb-2 mr-3">When</h3>
          <div className="w-[88%] sm:w-[72%] bg-[#B496BC] rounded-3xl px-6 py-5 text-center" style={{ boxShadow: 'var(--elev-2)' }}>
            <p className="font-display font-bold text-xl sm:text-2xl text-[#1A1A2E] tracking-tight">
              <time dateTime="2026-11-20T18:40">November 20, 6:40 pm</time>
            </p>
          </div>
        </motion.div>

        {/* WHERE */}
        <motion.div className="flex flex-col items-start w-full" {...reveal} transition={{ duration: 0.7, delay: 0.2 }}>
          <h3 className="t-eyebrow text-white mb-2 ml-3">Where</h3>
          <address className="not-italic w-[92%] sm:w-[82%] bg-[#B496BC] rounded-3xl p-5 sm:p-6" style={{ boxShadow: 'var(--elev-2)' }}>
            <p className="font-semibold text-lg sm:text-xl text-[#1A1A2E] leading-snug">
              The Almonds Boutique Aparthotel, SerenityCore Wellness Hub Palette, Hon. Tudtud Road
            </p>
          </address>
        </motion.div>

        {/* Map: stays fully interactive; the action sits below it instead of covering it */}
        <motion.div className="w-full" {...reveal} transition={{ duration: 0.7, delay: 0.3 }}>
          <div className="rounded-[32px] overflow-hidden bg-[#B496BC] p-2 sm:p-3" style={{ boxShadow: 'var(--elev-3)' }}>
            <div className="rounded-[26px] overflow-hidden h-64 sm:h-80">
              <iframe
                title="Map showing The Almonds Boutique Aparthotel"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3925.321115598687!2d123.9144444!3d10.3235556!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x33a999238933b931%3A0x67dbfa97a15aefb!2sThe%20Almonds%20Boutique%20Aparthotel!5e0!3m2!1sen!2sph!4v1700000000000!5m2!1sen!2sph"
                className="w-full h-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <div className="p-2 sm:p-3 pt-3 sm:pt-4">
              <button type="button" onClick={() => setShowMapModal(true)} className="btn btn-primary btn-block">
                <span>Get directions in Google Maps</span>
                <img src={mapsIcon} alt="" className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      <LocationMapModal isOpen={showMapModal} onClose={() => setShowMapModal(false)} onConfirm={handleOpenMaps} />
    </section>
  );
}
