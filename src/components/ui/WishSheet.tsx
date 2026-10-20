import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { verifyGuestEmail, submitWishMessage, type RSVP } from '../../lib/supabase/client';
import paperStar from '../../assets/paper-star.webp';
import wishingIcon from '../../assets/icon/dark/wishing-message.svg';

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

  useEffect(() => {
    if (verifiedGuest) {
      if (verifiedGuest.wish_message) {
        setMessageInput(verifiedGuest.wish_message);
      }
    } else {
      setMessageInput('');
      setEmailInput('');
    }
    setErrorMessage(null);
    setSuccessMessage(null);
  }, [verifiedGuest, isOpen]);

  // Step 1: Verification if guest isn't verified yet
  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    const { guest, error } = await verifyGuestEmail(emailInput);
    setLoading(false);

    if (error || !guest) {
      setErrorMessage(error || 'Email was not found on the guest list. Please check with the host.');
      return;
    }

    onGuestVerified(guest);
    if (guest.wish_message) {
      setMessageInput(guest.wish_message);
    }
  };

  // Step 2: Submit Birthday Wish
  const handleSubmitWish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifiedGuest) return;

    setErrorMessage(null);
    setLoading(true);

    const { success, error } = await submitWishMessage(verifiedGuest.id, messageInput);
    setLoading(false);

    if (!success) {
      setErrorMessage(error || 'Failed to submit wish. Please try again.');
      return;
    }

    setSuccessMessage('Your sweet birthday wish has been delivered to the wall! 🎂✨');
    onWishSubmitted();
    setTimeout(() => {
      setSuccessMessage(null);
      onClose();
    }, 1800);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end lg:items-stretch lg:justify-end">
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Responsive Wish Sheet: Bottom sheet on phone/tablet, right live drawer on laptop/desktop */}
          <motion.div
            className="relative z-10 w-full lg:w-[440px] max-h-[88vh] lg:max-h-full h-auto lg:h-full bg-white rounded-t-[36px] lg:rounded-t-none lg:rounded-l-[36px] shadow-2xl p-6 sm:p-8 flex flex-col justify-between overflow-y-auto border border-gray-100"
            initial={{ y: '100%', x: 0 }}
            animate={{
              y: 0,
              x: 0,
              transition: { type: 'spring', damping: 28, stiffness: 240 },
            }}
            exit={{
              y: '100%',
              x: 0,
              transition: { duration: 0.25 },
            }}
          >
            {/* Sheet Header */}
            <div>
              {/* Drag bar on mobile */}
              <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-4 lg:hidden" />

              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <img src={wishingIcon} alt="" className="w-5 h-5" />
                  <span className="font-montserrat font-bold text-xs uppercase tracking-wider text-[#6b5b73]">
                    Birthday Wish Wall
                  </span>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800 flex items-center justify-center text-sm font-bold transition cursor-pointer"
                  aria-label="Close sheet"
                >
                  ✕
                </button>
              </div>

              {/* Title & Prompt */}
              <div className="mt-4">
                <div className="flex items-center gap-2">
                  <h3 className="font-montserrat font-bold text-xl sm:text-2xl text-[#1A1A2E]">
                    Send a Sweet Wish
                  </h3>
                  <img src={paperStar} alt="" className="w-5 h-5 select-none" />
                </div>
                <p className="font-montserrat text-xs sm:text-sm text-[#4a4a6a] mt-1 leading-relaxed">
                  Your message will be displayed on the public wishing carousel for everyone to see!
                </p>
              </div>

              {/* Success / Error Messages */}
              {successMessage && (
                <div className="mt-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-montserrat font-semibold">
                  {successMessage}
                </div>
              )}

              {errorMessage && (
                <div className="mt-4 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm font-montserrat">
                  {errorMessage}
                </div>
              )}

              {/* Form Content */}
              {!verifiedGuest ? (
                /* Step A: Email Verification Required */
                <form onSubmit={handleVerifyEmail} className="mt-6 flex flex-col gap-4">
                  <div className="p-4 rounded-2xl bg-[#B496BC]/15 border border-[#B496BC]/30">
                    <span className="font-montserrat font-bold text-xs text-[#1A1A2E] block">
                      🔒 Verification Required
                    </span>
                    <p className="font-montserrat text-xs text-[#554a5c] mt-0.5">
                      Please enter your invited email address to verify identity before posting a wish.
                    </p>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="wish-email" className="font-montserrat font-bold text-xs text-[#1A1A2E]">
                      Your Email Address:
                    </label>
                    <input
                      id="wish-email"
                      type="email"
                      required
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="e.g. yourname@example.com"
                      className="w-full px-4 py-3 bg-gray-50 focus:bg-white rounded-2xl border border-gray-200 text-sm font-montserrat focus:ring-2 focus:ring-[#B496BC] focus:border-[#B496BC] transition outline-hidden"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !emailInput.trim()}
                    className="w-full py-3.5 px-4 bg-[#1A1A2E] hover:bg-[#2b2b48] disabled:opacity-50 text-white font-montserrat font-bold text-sm rounded-2xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <span>Verify & Continue</span>
                    )}
                  </button>
                </form>
              ) : (
                /* Step B: Writing the Wish Message */
                <form onSubmit={handleSubmitWish} className="mt-6 flex flex-col gap-4">
                  <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-between">
                    <div>
                      <span className="font-montserrat text-[11px] text-[#6b5b73] block uppercase tracking-wider">
                        Posting as
                      </span>
                      <span className="font-montserrat font-bold text-sm text-[#1A1A2E]">
                        {verifiedGuest.guest_name}
                      </span>
                    </div>
                    <span className="text-xs bg-emerald-100 text-emerald-800 font-montserrat font-semibold px-2 py-0.5 rounded-full">
                      ✓ Verified
                    </span>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="wish-message-input" className="font-montserrat font-bold text-xs text-[#1A1A2E] flex justify-between">
                      <span>Your Birthday Greeting:</span>
                      <span className="font-normal text-[11px] text-gray-400">
                        {messageInput.length} / 500
                      </span>
                    </label>
                    <textarea
                      id="wish-message-input"
                      rows={5}
                      required
                      maxLength={500}
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      placeholder="Write your warmest birthday thoughts, yoga jokes, or sweet greetings..."
                      className="w-full px-4 py-3 bg-gray-50 focus:bg-white rounded-2xl border border-gray-200 text-sm font-montserrat focus:ring-2 focus:ring-[#B496BC] focus:border-[#B496BC] transition resize-none outline-hidden"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || messageInput.trim().length < 2}
                    className="w-full py-3.5 px-4 bg-[#1A1A2E] hover:bg-[#2b2b48] disabled:opacity-50 text-white font-montserrat font-bold text-sm rounded-2xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <img src={wishingIcon} alt="" className="w-4 h-4 invert" />
                        <span>Publish Birthday Wish</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

            {/* Bottom note */}
            <div className="pt-6 border-t border-gray-100 text-center">
              <p className="font-montserrat text-[11px] text-gray-400">
                Meow Yoga Birthday • November 20, 2026
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
