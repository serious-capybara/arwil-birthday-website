import { motion, AnimatePresence } from 'framer-motion';
import mapsIcon from '../../assets/icon/dark/maps-redirect.svg';
import { useDialog } from '../../hooks/useDialog';

interface LocationMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function LocationMapModal({ isOpen, onClose, onConfirm }: LocationMapModalProps) {
  const dialogRef = useDialog<HTMLDivElement>(isOpen, onClose);

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
            aria-hidden="true"
          />

          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="map-dialog-title"
            aria-describedby="map-dialog-desc"
            tabIndex={-1}
            className="relative z-10 bg-white rounded-[28px] p-6 sm:p-8 max-w-md w-full flex flex-col gap-4 text-center"
            style={{ boxShadow: 'var(--elev-3)' }}
            initial={{ scale: 0.94, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.94, opacity: 0, y: 16 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          >
            <div className="w-14 h-14 rounded-full bg-[#F9C5D1] flex items-center justify-center mx-auto">
              <img src={mapsIcon} alt="" className="w-7 h-7" />
            </div>

            <h2 id="map-dialog-title" className="t-title text-[#1A1A2E] text-2xl">
              Open in Google Maps?
            </h2>

            <p id="map-dialog-desc" className="t-callout text-[var(--label-secondary)]">
              Directions to{' '}
              <span className="font-semibold text-[var(--label)]">The Almonds Boutique Aparthotel, SerenityCore Wellness Hub Palette</span>{' '}
              on Hon. Tudtud Road will open in a new tab.
            </p>

            <div className="flex flex-col-reverse sm:flex-row gap-3 mt-2">
              <button type="button" onClick={onClose} className="btn btn-outline flex-1">
                Stay here
              </button>
              <button type="button" onClick={onConfirm} className="btn btn-primary flex-1" data-autofocus>
                <span>Open Maps</span>
                <img src={mapsIcon} alt="" className="w-4 h-4 invert" />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
