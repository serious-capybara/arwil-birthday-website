import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { verifyGuestEmail, confirmRSVP, type RSVP } from '../lib/supabase/client';
import { downloadICSFile, getGoogleCalendarUrl } from '../lib/calendarHelper';
import saveDateIcon from '../assets/icon/dark/save-date.svg';
import acceptIcon from '../assets/icon/light/accept-rsvp.svg';
import paperStar from '../assets/paper-star.png';

interface RsvpModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialGuest: RSVP | null;
  onRsvpSuccess: (updated: RSVP) => void;
}

export function RsvpModal({
  isOpen,
  onClose,
  initialGuest,
  onRsvpSuccess,
}: RsvpModalProps) {
  const [step, setStep] = useState<'verify' | 'confirm' | 'saved'>('verify');
  const [guest, setGuest] = useState<RSVP | null>(initialGuest);
  const [emailInput, setEmailInput] = useState('');
  const [isAttending, setIsAttending] = useState(true);
  const [plusOnes, setPlusOnes] = useState(0);
  const [wishInput, setWishInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (initialGuest) {
      setGuest(initialGuest);
      setIsAttending(initialGuest.is_attending);
      setPlusOnes(initialGuest.plus_ones || 0);
      setWishInput(initialGuest.wish_message || '');
      setStep('confirm');
    } else {
      setGuest(null);
      setStep('verify');
      setEmailInput('');
    }
    setErrorMessage(null);
  }, [initialGuest, isOpen]);

  // Handle email verification
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    const { guest: found, error } = await verifyGuestEmail(emailInput);
    setLoading(false);

    if (error || !found) {
      setErrorMessage(error || 'Email not found on guest list.');
      return;
    }

    setGuest(found);
    setIsAttending(true);
    setPlusOnes(found.plus_ones || 0);
    setWishInput(found.wish_message || '');
    setStep('confirm');
  };

  // Handle final RSVP confirmation
  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guest) return;

    setErrorMessage(null);
    setLoading(true);

    const { success, error, updated } = await confirmRSVP(
      guest.id,
      isAttending,
      plusOnes,
      wishInput
    );
    setLoading(false);

    if (!success || !updated) {
      setErrorMessage(error || 'Failed to submit RSVP.');
      return;
    }

    onRsvpSuccess(updated);
    // Crucial requirement: After confirm, don't close the modal, transition to Save the Date step!
    setStep('saved');
  };

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
            className="relative z-10 w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-100 overflow-hidden"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
          >
            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-800 transition"
              aria-label="Close dialog"
            >
              ✕
            </button>

            {/* Step 1: Guest Verification by Email */}
            {step === 'verify' && (
              <form onSubmit={handleVerify} className="flex flex-col gap-4 text-center">
                <div className="w-14 h-14 rounded-full bg-[#F9C5D1] flex items-center justify-center mx-auto mb-1">
                  <img src={paperStar} alt="" className="w-7 h-7" />
                </div>

                <h3 className="font-montserrat font-bold text-xl text-[#1A1A2E]">
                  Verify Your Invitation
                </h3>
                <p className="font-montserrat text-xs sm:text-sm text-[#4a4a6a]">
                  To confirm your RSVP, please enter the exact email address you provided to the host.
                </p>

                <div className="text-left mt-2">
                  <label htmlFor="verify-email" className="font-montserrat font-semibold text-xs text-[#1A1A2E] block mb-1">
                    Email Address
                  </label>
                  <input
                    id="verify-email"
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="e.g. guest@example.com"
                    className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-gray-50 text-sm font-montserrat focus:bg-white focus:border-[#C8A8D8] focus:ring-2 focus:ring-[#C8A8D8]/20 transition outline-hidden"
                  />
                </div>

                {errorMessage && (
                  <p className="text-xs text-red-600 font-montserrat bg-red-50 p-3 rounded-lg border border-red-200 text-left">
                    {errorMessage}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3.5 bg-[#1A1A2E] hover:bg-[#2b2b48] text-white font-montserrat font-semibold text-sm rounded-xl transition shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? 'Checking Guest List...' : 'Continue to RSVP'}
                </button>
              </form>
            )}

            {/* Step 2: Second Confirmation Modal */}
            {step === 'confirm' && guest && (
              <form onSubmit={handleConfirm} className="flex flex-col gap-4 text-left">
                <div className="text-center pb-2 border-b border-gray-100">
                  <span className="font-montserrat text-xs uppercase tracking-wider text-[#8e7b97] font-semibold">
                    Attendance Confirmation
                  </span>
                  <h3 className="font-heaven text-3xl text-[#1A1A2E] mt-1">
                    Hi {guest.guest_name}!
                  </h3>
                </div>

                {/* Attending selection */}
                <div>
                  <span className="font-montserrat font-semibold text-xs text-[#1A1A2E] block mb-2">
                    Will you be joining us?
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAttending(true)}
                      className={`py-3 px-3 rounded-xl border text-xs font-montserrat font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                        isAttending
                          ? 'bg-[#1A1A2E] text-white border-[#1A1A2E] shadow-sm'
                          : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <span className="w-3.5 h-3.5 rounded-full border border-current flex items-center justify-center">
                        {isAttending && <span className="w-2 h-2 rounded-full bg-white" />}
                      </span>
                      Yes, Attending!
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAttending(false)}
                      className={`py-3 px-3 rounded-xl border text-xs font-montserrat font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                        !isAttending
                          ? 'bg-[#C4526A] text-white border-[#C4526A] shadow-sm'
                          : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <span className="w-3.5 h-3.5 rounded-full border border-current flex items-center justify-center">
                        {!isAttending && <span className="w-2 h-2 rounded-full bg-white" />}
                      </span>
                      Cannot Attend
                    </button>
                  </div>
                </div>

                {/* Plus-ones */}
                {isAttending && (
                  <div>
                    <label htmlFor="plus-ones" className="font-montserrat font-semibold text-xs text-[#1A1A2E] block mb-1">
                      Companions / Plus-ones
                    </label>
                    <select
                      id="plus-ones"
                      value={plusOnes}
                      onChange={(e) => setPlusOnes(Number(e.target.value))}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-xs font-montserrat focus:bg-white focus:border-[#C8A8D8] transition outline-hidden"
                    >
                      <option value={0}>Just me (0 companions)</option>
                      <option value={1}>+1 Companion</option>
                      <option value={2}>+2 Companions</option>
                      <option value={3}>+3 Companions</option>
                    </select>
                  </div>
                )}

                {/* Optional Birthday Wish */}
                <div>
                  <label htmlFor="modal-wish" className="font-montserrat font-semibold text-xs text-[#1A1A2E] block mb-1">
                    Birthday Greeting (Optional)
                  </label>
                  <textarea
                    id="modal-wish"
                    rows={2}
                    maxLength={200}
                    value={wishInput}
                    onChange={(e) => setWishInput(e.target.value)}
                    placeholder="Write a sweet note to the celebrant..."
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-xs font-montserrat focus:bg-white focus:border-[#C8A8D8] transition outline-hidden resize-none"
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
                  <img src={acceptIcon} alt="" className="w-4 h-4" />
                  <span>{loading ? 'Confirming...' : 'Confirm RSVP Response'}</span>
                </button>
              </form>
            )}

            {/* Step 3: Success Screen with "Save the Date" feature as specified! */}
            {step === 'saved' && (
              <div className="flex flex-col items-center text-center gap-4 py-2">
                <div className="w-16 h-16 rounded-full bg-[#98FB98]/30 flex items-center justify-center">
                  <span className="text-3xl">🎉</span>
                </div>

                <div>
                  <h3 className="font-heaven text-3xl text-[#1A1A2E]">
                    {isAttending ? "You're Confirmed!" : 'Response Recorded'}
                  </h3>
                  <p className="font-montserrat text-xs sm:text-sm text-[#4a4a6a] mt-1">
                    {isAttending
                      ? 'We are so excited to celebrate Meow Yoga Birthday with you!'
                      : 'We will miss you! Thank you for letting us know.'}
                  </p>
                </div>

                {/* Event Summary Pill */}
                <div className="w-full bg-[#F5EDD8] rounded-2xl p-4 text-left border border-[#E8DCCA]">
                  <span className="font-montserrat font-bold text-xs text-[#1A1A2E] block">
                    Meow Yoga Birthday
                  </span>
                  <span className="font-montserrat text-xs text-[#6b5b73] block mt-0.5">
                    📅 Friday, November 20, 2026 • 6:40 PM
                  </span>
                  <span className="font-montserrat text-xs text-[#6b5b73] block mt-0.5">
                    📍 The Almonds Boutique Aparthotel
                  </span>
                </div>

                {/* SAVE THE DATE BUTTONS */}
                {isAttending && (
                  <div className="w-full flex flex-col gap-2 mt-2">
                    {/* Native iCal / .ics Download */}
                    <button
                      type="button"
                      onClick={downloadICSFile}
                      className="w-full py-3.5 px-4 bg-[#C8A8D8] hover:bg-[#b592c6] text-[#1A1A2E] font-montserrat font-bold text-xs sm:text-sm rounded-xl transition shadow-md flex items-center justify-center gap-2.5 cursor-pointer"
                    >
                      <img src={saveDateIcon} alt="" className="w-5 h-5" />
                      <span>Save the Date (.ics calendar)</span>
                    </button>

                    {/* Google Calendar Link */}
                    <a
                      href={getGoogleCalendarUrl()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 px-4 bg-gray-50 hover:bg-gray-100 text-gray-700 font-montserrat font-semibold text-xs rounded-xl border border-gray-200 transition text-center"
                    >
                      Add to Google Calendar ↗
                    </a>
                  </div>
                )}

                <button
                  type="button"
                  onClick={onClose}
                  className="mt-2 text-xs font-montserrat font-semibold text-gray-500 hover:text-gray-800 underline transition"
                >
                  Close & View Guest List
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
