import { motion, AnimatePresence } from 'framer-motion';
import mapsIcon from '../../assets/icon/dark/maps-redirect.svg';

interface LocationMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function LocationMapModal({ isOpen, onClose, onConfirm }: LocationMapModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/55 backdrop-blur-xs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal Container */}
          <motion.div
            className="relative z-10 bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-gray-100 flex flex-col gap-4 text-center"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Map Pin Icon Badge */}
            <div className="w-14 h-14 rounded-full bg-[#F9C5D1] text-[#1A1A2E] flex items-center justify-center mx-auto mb-1 shadow-xs">
              <img src={mapsIcon} alt="" className="w-7 h-7" />
            </div>

            <h3 className="font-montserrat font-bold text-lg sm:text-xl text-[#1A1A2E]">
              Open Pinned Map in Google Maps?
            </h3>

            <p className="font-montserrat text-xs sm:text-sm text-[#4a4a6a] leading-relaxed">
              You will be redirected to Google Maps in a new tab to see full directions to{' '}
              <span className="font-semibold text-[#1A1A2E]">
                The Almonds Boutique Aparthotel, SerenityCore Wellness Hub Palette
              </span>{' '}
              on Hon. Tudtud Road.
            </p>

            <div className="flex gap-3 mt-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-xl border border-gray-300 font-montserrat font-semibold text-xs sm:text-sm text-gray-700 hover:bg-gray-50 transition cursor-pointer"
              >
                Stay Here
              </button>

              <button
                type="button"
                onClick={onConfirm}
                className="flex-1 py-3 px-4 rounded-xl bg-[#1A1A2E] text-white font-montserrat font-semibold text-xs sm:text-sm hover:bg-[#2b2b48] shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Continue</span>
                <img src={mapsIcon} alt="" className="w-4 h-4 invert" />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
