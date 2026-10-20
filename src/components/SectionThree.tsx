import { motion } from 'framer-motion';
import thisWearImg from '../assets/this-wear.png';
import thatWearImg from '../assets/that-wear.png';
import paperStar from '../assets/paper-star.png';
import silverStars from '../assets/silver-dusk-star.png';
import paperTrumpet from '../assets/paper-trumpet.png';

export function SectionThree() {
  return (
    <section
      id="what-to-wear"
      className="section-full min-h-screen py-20 px-4 sm:px-8 relative flex flex-col justify-center items-center overflow-hidden"
      aria-label="What to wear section"
    >
      {/* Background festive sparkles */}
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

      <div className="relative z-10 w-full max-w-2xl mx-auto flex flex-col gap-10">
        {/* "What to wear?" speech card */}
        <motion.div
          className="self-center sm:self-start w-[85%] sm:w-[70%]"
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7 }}
        >
          <div className="relative bg-white rounded-3xl p-6 sm:p-8 shadow-md border border-white/60">
            <img
              src={paperStar}
              alt=""
              role="presentation"
              className="absolute -top-3 -left-3 w-8 h-8 select-none"
            />
            <img
              src={paperStar}
              alt=""
              role="presentation"
              className="absolute -bottom-3 right-6 w-7 h-7 select-none opacity-80"
            />
            <h2 className="font-montserrat text-xl sm:text-2xl md:text-3xl text-center font-normal text-[#1A1A2E]">
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
          <span className="font-montserrat font-extrabold text-sm sm:text-base text-[#1A1A2E] tracking-widest uppercase mb-2 ml-2">
            THIS
          </span>

          <div className="relative w-[90%] sm:w-[82%] bg-[#C8A8D8] rounded-3xl p-5 sm:p-6 shadow-md flex items-center justify-between gap-4 overflow-hidden">
            <img
              src={paperStar}
              alt=""
              role="presentation"
              className="absolute -bottom-3 -left-3 w-10 h-10 select-none z-10"
            />

            {/* Model image */}
            <div className="w-1/2 sm:w-5/12 flex-shrink-0">
              <img
                src={thisWearImg}
                alt="Pastel pink active wear outfit"
                className="w-full h-auto object-contain max-h-72 drop-shadow-md transform hover:scale-105 transition-transform"
              />
            </div>

            {/* Description */}
            <div className="w-1/2 sm:w-7/12 text-right pr-2">
              <p className="font-heaven text-2xl sm:text-3xl md:text-4xl text-[#1A1A2E] leading-snug">
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
          <span className="font-montserrat font-extrabold text-sm sm:text-base text-[#1A1A2E] tracking-widest uppercase mb-2 mr-2">
            THAT
          </span>

          <div className="relative w-[90%] sm:w-[82%] bg-[#C8A8D8] rounded-3xl p-5 sm:p-6 shadow-md flex items-center justify-between gap-4 overflow-hidden">
            <img
              src={paperStar}
              alt=""
              role="presentation"
              className="absolute -top-3 -right-3 w-10 h-10 select-none z-10"
            />

            {/* Description */}
            <div className="w-1/2 sm:w-7/12 text-left pl-2">
              <p className="font-heaven text-2xl sm:text-3xl md:text-4xl text-[#1A1A2E] leading-snug">
                Lavender<br />
                active<br />
                wear
              </p>
            </div>

            {/* Model image */}
            <div className="w-1/2 sm:w-5/12 flex-shrink-0">
              <img
                src={thatWearImg}
                alt="Lavender active wear outfit"
                className="w-full h-auto object-contain max-h-72 drop-shadow-md transform hover:scale-105 transition-transform"
              />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
