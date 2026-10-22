import { motion } from 'framer-motion';
import thisWearImg from '../../assets/this-wear.webp';
import thatWearImg from '../../assets/that-wear.webp';
import paperStar from '../../assets/paper-star.webp';
import silverStars from '../../assets/silver-dusk-star.webp';
import paperTrumpet from '../../assets/paper-trumpet.webp';

export function DressCode() {
  return (
    <section
      id="what-to-wear"
      className="section-full min-h-screen py-20 px-4 sm:px-8 relative flex flex-col justify-center items-center overflow-hidden"
      aria-labelledby="what-to-wear-title"
    >
      <div className="stage" aria-hidden="true" />

      {/* Background festive sparkles and trumpet decorations from assets */}
      <img
        src={silverStars}
        alt=""
        role="presentation"
        className="absolute top-10 left-0 w-72 sm:w-96 opacity-60 pointer-events-none select-none z-0"
      />
      <img
        src={paperTrumpet}
        alt=""
        role="presentation"
        className="absolute bottom-6 left-6 w-24 sm:w-32 md:w-36 -rotate-12 opacity-85 pointer-events-none select-none z-10 drop-shadow-md"
      />

      <div className="relative z-10 w-full max-w-xl sm:max-w-2xl mx-auto flex flex-col gap-8 sm:gap-10">
        {/* "What to wear?" Speech Card (section-three.png) */}
        <motion.div
          className="self-center sm:self-start w-[88%] sm:w-[70%]"
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7 }}
        >
          <div className="relative bg-white rounded-[32px] sm:rounded-[36px] py-7 px-8 sm:py-8 sm:px-10 " style={{ boxShadow: 'var(--elev-2)' }}>
            {/* Stars on corners matching section-three.png */}
            <img
              src={paperStar}
              alt=""
              role="presentation"
              className="absolute -top-3 -left-3 w-8 h-8 sm:w-10 sm:h-10 select-none drop-shadow-xs"
            />
            <img
              src={paperStar}
              alt=""
              role="presentation"
              className="absolute -bottom-3 right-6 w-7 h-7 sm:w-9 sm:h-9 select-none opacity-85 drop-shadow-xs"
            />

            <h2 id="what-to-wear-title" className="t-title text-center text-[#1A1A2E]">
              What to wear?
            </h2>
          </div>
        </motion.div>

        {/* THIS Card - Pastel Pink Active Wear */}
        <motion.div
          className="flex flex-col items-start w-full"
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, delay: 0.15 }}
        >
          <h3 className="t-eyebrow text-white mb-2 ml-3">This</h3>

          <div className="relative w-[92%] sm:w-[84%] bg-[#B496BC] rounded-3xl p-5 sm:p-6 flex items-center justify-between gap-4 overflow-hidden" style={{ boxShadow: 'var(--elev-2)' }}>
            <img
              src={paperStar}
              alt=""
              role="presentation"
              className="absolute -bottom-3 -left-3 w-10 h-10 select-none z-10 drop-shadow-xs"
            />

            {/* Model image wearing pastel pink active wear */}
            <div className="w-1/2 sm:w-5/12 flex-shrink-0">
              <img
                src={thisWearImg}
                alt="Pastel pink active wear outfit"
                className="w-full h-auto object-contain max-h-72 drop-shadow-md motion-safe:transition-transform motion-safe:hover:scale-105"
              />
            </div>

            {/* Description */}
            <div className="w-1/2 sm:w-7/12 text-right pr-2 sm:pr-4">
              <p className="font-display font-bold text-2xl sm:text-3xl md:text-4xl text-[#1A1A2E] leading-tight tracking-tight">
                Pastel<br />
                pink<br />
                active<br />
                wear
              </p>
            </div>
          </div>
        </motion.div>

        {/* THAT Card - Lavender Active Wear */}
        <motion.div
          className="flex flex-col items-end w-full"
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, delay: 0.25 }}
        >
          <h3 className="t-eyebrow text-white mb-2 mr-3">That</h3>

          <div className="relative w-[92%] sm:w-[84%] bg-[#B496BC] rounded-3xl p-5 sm:p-6 flex items-center justify-between gap-4 overflow-hidden" style={{ boxShadow: 'var(--elev-2)' }}>
            <img
              src={paperStar}
              alt=""
              role="presentation"
              className="absolute -top-3 -right-3 w-10 h-10 select-none z-10 drop-shadow-xs"
            />

            {/* Description */}
            <div className="w-1/2 sm:w-7/12 text-left pl-2 sm:pl-4">
              <p className="font-display font-bold text-2xl sm:text-3xl md:text-4xl text-[#1A1A2E] leading-tight tracking-tight">
                Lavender<br />
                active<br />
                wear
              </p>
            </div>

            {/* Model image wearing lavender active wear */}
            <div className="w-1/2 sm:w-5/12 flex-shrink-0">
              <img
                src={thatWearImg}
                alt="Lavender active wear outfit"
                className="w-full h-auto object-contain max-h-72 drop-shadow-md motion-safe:transition-transform motion-safe:hover:scale-105"
              />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
