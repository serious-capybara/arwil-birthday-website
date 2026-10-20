import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { verifyGuestEmail, confirmRSVP, type RSVP } from '../../lib/supabase/client';
import { downloadICSFile, getGoogleCalendarUrl } from '../../lib/calendarHelper';
import saveDateIcon from '../../assets/icon/dark/save-date.svg';
import acceptIcon from '../../assets/icon/light/accept-rsvp.svg';
import paperStar from '../../assets/paper-star.webp';

interface RsvpModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetGuest: RSVP | null;
  onRsvpSuccess: (updated: RSVP) => void;
}

export function RsvpModal({
  isOpen,
  onClose,
  targetGuest,
  onRsvpSuccess,
}: RsvpModalProps) {
  // Steps: 1 = 'verify-email', 2 = 'respond-rsvp', 3 = 'save-date' (keeps modal open with Save the Date)
  const [step, setStep] = useState<'verify-email' | 'respond-rsvp' | 'save-date'>('verify-email');
  const [verifiedGuest, setVerifiedGuest] = useState<RSVP | null>(null);
  const [emailInput, setEmailInput] = useState('');
  const [isAttending, setIsAttending] = useState(true);
  const [plusOnes, setPlusOnes] = useState(0);
  const [wishInput, setWishInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setStep('verify-email');
      setVerifiedGuest(null);
      setEmailInput('');
      setErrorMessage(null);
      setWishInput('');
      setPlusOnes(0);
      setIsAttending(true);
    }
  }, [isOpen, targetGuest]);

  // Step 1: Verify Email against Supabase rsvps table
  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    const { guest, error } = await verifyGuestEmail(emailInput);
    setLoading(false);

    if (error || !guest) {
      setErrorMessage(error || 'Email not found on the guest list. Please make sure you enter the exact email given to the host.');
      return;
    }

    // Security check: If clicked from a specific row, ensure the email belongs to that person
    if (targetGuest && targetGuest.id !== guest.id) {
      setErrorMessage(`The email entered belongs to a different guest. Please enter the email for ${targetGuest.guest_name}.`);
      return;
    }

    setVerifiedGuest(guest);
    setIsAttending(guest.is_attending);
    setPlusOnes(guest.plus_ones || 0);
    setWishInput(guest.wish_message || '');
    setStep('respond-rsvp');
  };

  // Step 2: Confirm RSVP Attendance & Optional Wish
  const handleConfirmRsvp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifiedGuest) return;

    setErrorMessage(null);
    setLoading(true);

    const { success, error, updated } = await confirmRSVP(
      verifiedGuest.id,
      isAttending,
      plusOnes,
      wishInput
    );
    setLoading(false);

    if (!success || !updated) {
      setErrorMessage(error || 'Failed to update RSVP. Please try again.');
      return;
    }

    onRsvpSuccess(updated);
    setVerifiedGuest(updated);
    // Crucial requirement: After accept, do NOT close the modal! Transition to Save the Date!
    setStep('save-date');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal Container */}
          <motion.div
            className="relative z-10 bg-white rounded-[32px] p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-gray-100 flex flex-col gap-5 overflow-hidden"
            initial={{ scale: 0.92, opacity: 0, y: 25 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 25 }}
            transition={{ type: 'spring', damping: 26, stiffness: 280 }}
          >
            {/* Top Stars & Close Button */}
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <img src={paperStar} alt="" className="w-5 h-5 select-none" />
                <span className="font-montserrat font-bold text-xs uppercase tracking-wider text-[#6b5b73]">
                  {step === 'verify-email' && 'Step 1: Verify Invitation'}
                  {step === 'respond-rsvp' && 'Step 2: Confirm Attendance'}
                  {step === 'save-date' && 'Step 3: Save the Date'}
                </span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800 flex items-center justify-center text-sm font-bold transition cursor-pointer"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm p-3.5 rounded-2xl flex items-start gap-2"
              >
                <span className="text-red-500 font-bold text-base leading-none">⚠</span>
                <span>{errorMessage}</span>
              </motion.div>
            )}

            {/* ── STEP 1: Email Verification ── */}
            {step === 'verify-email' && (
              <form onSubmit={handleVerifyEmail} className="flex flex-col gap-4">
                <div className="text-center">
                  <h3 className="font-montserrat font-bold text-xl text-[#1A1A2E]">
                    {targetGuest ? `Verify RSVP for ${targetGuest.guest_name}` : 'Verify Your Invitation'}
                  </h3>
                  <p className="font-montserrat text-xs sm:text-sm text-[#4a4a6a] mt-1.5 leading-relaxed">
                    To protect guest privacy, please enter the exact email address you provided to the host.
                  </p>
                </div>

                <div className="flex flex-col gap-1.5 mt-2">
                  <label htmlFor="rsvp-email" className="font-montserrat font-bold text-xs text-[#1A1A2E]">
                    Your Invited Email Address:
                  </label>
                  <input
                    id="rsvp-email"
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
                  className="w-full mt-2 py-3.5 px-4 bg-[#1A1A2E] hover:bg-[#2b2b48] disabled:opacity-50 text-white font-montserrat font-bold text-sm rounded-2xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>Verify My Email</span>
                  )}
                </button>
              </form>
            )}

            {/* ── STEP 2: Attendance & Wish Response ── */}
            {step === 'respond-rsvp' && verifiedGuest && (
              <form onSubmit={handleConfirmRsvp} className="flex flex-col gap-4">
                <div className="text-center">
                  <h3 className="font-montserrat font-bold text-xl text-[#1A1A2E]">
                    Welcome, {verifiedGuest.guest_name}! 🐾
                  </h3>
                  <p className="font-montserrat text-xs text-[#6b5b73] mt-1">
                    Event: Meow Yoga Birthday • Nov 20, 2026, 6:40 PM
                  </p>
                </div>

                {/* Attending Selection */}
                <div className="flex flex-col gap-2">
                  <label className="font-montserrat font-bold text-xs text-[#1A1A2E]">
                    Will you be able to attend?
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setIsAttending(true)}
                      className={`p-3 rounded-2xl border text-xs sm:text-sm font-montserrat font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                        isAttending
                          ? 'bg-[#1A1A2E] text-white border-[#1A1A2E] shadow-sm'
                          : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <img src={acceptIcon} alt="" className="w-3.5 h-3.5" />
                      <span>Yes, Attending!</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsAttending(false)}
                      className={`p-3 rounded-2xl border text-xs sm:text-sm font-montserrat font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                        !isAttending
                          ? 'bg-[#1A1A2E] text-white border-[#1A1A2E] shadow-sm'
                          : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <span>Can't Make It</span>
                    </button>
                  </div>
                </div>

                {/* Plus-ones counter if attending */}
                {isAttending && (
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-gray-50 border border-gray-200">
                    <div>
                      <span className="font-montserrat font-bold text-xs text-[#1A1A2E] block">
                        Bringing Companions (+1)?
                      </span>
                      <span className="font-montserrat text-[11px] text-[#6b5b73]">
                        Extra guests attending with you
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setPlusOnes((p) => Math.max(0, p - 1))}
                        className="w-8 h-8 rounded-full bg-white border border-gray-200 font-bold text-gray-700 hover:bg-gray-100 flex items-center justify-center cursor-pointer shadow-xs"
                      >
                        -
                      </button>
                      <span className="font-montserrat font-bold text-sm w-4 text-center">
                        {plusOnes}
                      </span>
                      <button
                        type="button"
                        onClick={() => setPlusOnes((p) => Math.min(5, p + 1))}
                        className="w-8 h-8 rounded-full bg-white border border-gray-200 font-bold text-gray-700 hover:bg-gray-100 flex items-center justify-center cursor-pointer shadow-xs"
                      >
                        +
                      </button>
                    </div>
                  </div>
                )}

                {/* Optional Birthday Wish Message */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="wish-text" className="font-montserrat font-bold text-xs text-[#1A1A2E] flex items-center justify-between">
                    <span>Birthday Wish for the Celebrant (Optional):</span>
                    <span className="font-normal text-[11px] text-gray-400">Max 500 chars</span>
                  </label>
                  <textarea
                    id="wish-text"
                    rows={3}
                    maxLength={500}
                    value={wishInput}
                    onChange={(e) => setWishInput(e.target.value)}
                    placeholder="Leave a sweet greeting or note for the Wish Wall..."
                    className="w-full px-4 py-3 bg-gray-50 focus:bg-white rounded-2xl border border-gray-200 text-xs sm:text-sm font-montserrat focus:ring-2 focus:ring-[#B496BC] focus:border-[#B496BC] transition resize-none outline-hidden"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3.5 px-4 bg-[#1A1A2E] hover:bg-[#2b2b48] text-white font-montserrat font-bold text-sm rounded-2xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>Submit RSVP Response</span>
                  )}
                </button>
              </form>
            )}

            {/* ── STEP 3: Second Confirmation & Save the Date (Keeps Modal Open!) ── */}
            {step === 'save-date' && verifiedGuest && (
              <div className="flex flex-col items-center text-center gap-4 py-2">
                <div className="w-16 h-16 rounded-full bg-[#F9C5D1] text-[#1A1A2E] flex items-center justify-center shadow-md">
                  <img src={saveDateIcon} alt="" className="w-8 h-8" />
                </div>

                <div>
                  <h3 className="font-montserrat font-extrabold text-2xl text-[#1A1A2E]">
                    {isAttending ? 'See You There! 🎉' : 'Response Recorded'}
                  </h3>
                  <p className="font-montserrat text-xs sm:text-sm text-[#4a4a6a] mt-1 max-w-sm">
                    {isAttending
                      ? 'Your RSVP has been confirmed. Don’t forget to add this special day to your calendar so you don’t miss any of the fun!'
                      : 'We will miss you at the celebration! Thanks for letting us know.'}
                  </p>
                </div>

                {/* Calendar Options (Save the Date button using save-date.svg) */}
                {isAttending && (
                  <div className="w-full flex flex-col gap-2.5 mt-2">
                    {/* Direct 1-Click Google Calendar */}
                    <a
                      href={getGoogleCalendarUrl()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3.5 px-5 rounded-2xl bg-[#1A1A2E] hover:bg-[#2b2b48] text-white font-montserrat font-bold text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2.5"
                    >
                      <img src={saveDateIcon} alt="" className="w-4 h-4 invert" />
                      <span>Add to Google Calendar</span>
                    </a>

                    {/* Download .ics file for Apple Calendar / Outlook */}
                    <button
                      type="button"
                      onClick={() => downloadICSFile()}
                      className="w-full py-3 px-5 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-montserrat font-semibold text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>Download Calendar Event (.ics)</span>
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  onClick={onClose}
                  className="mt-2 text-xs font-montserrat font-semibold text-[#6b5b73] hover:text-[#1A1A2E] transition underline cursor-pointer"
                >
                  Done & Return to Invitation
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
