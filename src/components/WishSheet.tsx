import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { verifyGuestEmail, submitWishMessage, type RSVP } from '../lib/supabase/client';
import paperStar from '../assets/paper-star.png';
import wishingIcon from '../assets/icon/dark/wishing-message.svg';

interface WishSheetProps {
  isOpen: boolean;
  onClose: () => void;
  verifiedGuest: RSVP | null;
  onGuestVerified: (guest: RSVP) => void;
  onWishSubmitted: () => void;
}

export function WishSheet({
  isOpen,
  onClose,
  verifiedGuest,
  onGuestVerified,
  onWishSubmitted,
}: WishSheetProps) {
  const [emailInput, setEmailInput] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Verification step if guest isn't verified yet
  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    const { guest, error } = await verifyGuestEmail(emailInput);
    setLoading(false);

    if (error || !guest) {
      setErrorMessage(error || 'Email not found on guest list.');
      return;
    }

    onGuestVerified(guest);
    if (guest.wish_message) {
      setMessageInput(guest.wish_message);
    }
  };

  // Submit wish step
  const handleSubmitWish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifiedGuest) return;

    setErrorMessage(null);
    setLoading(true);

    const { success, error } = await submitWishMessage(verifiedGuest.id, messageInput);
    setLoading(false);

    if (!success) {
      setErrorMessage(error || 'Failed to send wish.');
      return;
    }

    setSuccessMessage('Your birthday wish has been delivered to the wall! 🎂✨');
    onWishSubmitted();
    setTimeout(() => {
      setSuccessMessage(null);
      onClose();
    }, 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end lg:items-stretch lg:justify-end">
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/45 backdrop-blur-xs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Responsive Sheet: Bottom sheet on mobile/tablet, right sidebar on desktop/laptop */}
          <motion.div
            className="relative z-10 w-full lg:w-[420px] max-h-[85vh] lg:max-h-full h-auto lg:h-full bg-white rounded-t-[32px] lg:rounded-t-none lg:rounded-l-[32px] shadow-2xl p-6 sm:p-8 flex flex-col justify-between overflow-y-auto border border-gray-100"
            initial={{ y: '100%', x: 0 }}
            animate={{
              y: 0,
              x: 0,
              transition: { type: 'spring', damping: 28, stiffness: 240 },
            }}
            exit={{
              y: window.innerWidth >= 1024 ? 0 : '100%',
              x: window.innerWidth >= 1024 ? '100%' : 0,
              transition: { duration: 0.3 },
            }}
          >
            {/* Top Bar / Drag Handle for Mobile */}
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-4 lg:hidden" />

            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <img src={wishingIcon} alt="" className="w-5 h-5" />
                <h3 className="font-montserrat font-bold text-lg text-[#1A1A2E]">
                  Birthday Wish Note
                </h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-800 transition"
                aria-label="Close sheet"
              >
                ✕
              </button>
            </div>

            {/* Content area */}
            <div className="my-6 flex-1 flex flex-col justify-center">
              {successMessage ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-[#F9C5D1] rounded-full flex items-center justify-center mx-auto mb-3">
                    <img src={paperStar} alt="" className="w-8 h-8" />
                  </div>
                  <h4 className="font-heaven text-2xl text-[#1A1A2E] mb-2">Thank you!</h4>
                  <p className="font-montserrat text-sm text-[#4a4a6a]">{successMessage}</p>
                </div>
              ) : !verifiedGuest ? (
                /* Step 1: Verification Form */
                <form onSubmit={handleVerifyEmail} className="flex flex-col gap-4">
                  <div className="text-left">
                    <span className="font-montserrat text-xs font-semibold text-[#8e7b97] uppercase tracking-wider block mb-1">
                      Guest Verification
                    </span>
                    <p className="font-montserrat text-sm text-[#4a4a6a]">
                      Please enter your invited email address to sign your birthday wish.
                    </p>
                  </div>

                  <div>
                    <label htmlFor="wish-email" className="sr-only">
                      Email address
                    </label>
                    <input
                      id="wish-email"
                      type="email"
                      required
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="e.g. your.email@gmail.com"
                      className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-gray-50 text-sm font-montserrat focus:bg-white focus:border-[#C8A8D8] focus:ring-2 focus:ring-[#C8A8D8]/20 transition outline-hidden"
                    />
                  </div>

                  {errorMessage && (
                    <p className="text-xs text-red-600 font-montserrat bg-red-50 p-3 rounded-lg border border-red-200">
                      {errorMessage}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-[#1A1A2E] hover:bg-[#2b2b48] text-white font-montserrat font-semibold text-sm rounded-xl transition shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? 'Verifying...' : 'Verify Guest Email'}
                  </button>
                </form>
              ) : (
                /* Step 2: Wish Note Message Input */
                <form onSubmit={handleSubmitWish} className="flex flex-col gap-4">
                  <div className="text-left">
                    <span className="font-montserrat text-xs font-semibold text-[#8e7b97] uppercase tracking-wider block mb-1">
                      Signed as: <strong className="text-[#1A1A2E]">{verifiedGuest.guest_name}</strong>
                    </span>
                    <p className="font-montserrat text-sm text-[#4a4a6a]">
                      Leave a heartfelt birthday greeting to be displayed on the wish wall!
                    </p>
                  </div>

                  <div className="relative">
                    <label htmlFor="wish-text" className="sr-only">
                      Birthday wish message
                    </label>
                    <textarea
                      id="wish-text"
                      rows={4}
                      maxLength={300}
                      required
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      placeholder="Write your birthday greetings here..."
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm font-heaven text-lg focus:bg-white focus:border-[#C8A8D8] focus:ring-2 focus:ring-[#C8A8D8]/20 transition outline-hidden resize-none"
                    />
                    <span className="absolute bottom-2 right-3 text-[10px] font-montserrat text-gray-400">
                      {messageInput.length}/300
                    </span>
                  </div>

                  {errorMessage && (
                    <p className="text-xs text-red-600 font-montserrat bg-red-50 p-3 rounded-lg border border-red-200">
                      {errorMessage}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={loading || messageInput.trim().length === 0}
                    className="w-full py-3.5 bg-[#C4526A] hover:bg-[#a83f55] text-white font-montserrat font-semibold text-sm rounded-xl transition shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? 'Sending Wish...' : 'Post to Wish Wall ✨'}
                  </button>
                </form>
              )}
            </div>

            {/* Bottom note */}
            <div className="text-center pt-4 border-t border-gray-100">
              <span className="font-montserrat text-[11px] text-gray-400">
                Meow Yoga Birthday • Nov 20, 2026
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
