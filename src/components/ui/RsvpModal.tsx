import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { verifyGuestEmail, confirmRSVP, type RSVP } from '../../lib/supabase/client';
import { downloadICSFile, getGoogleCalendarUrl } from '../../lib/calendarHelper';
import saveDateIcon from '../../assets/icon/dark/save-date.svg';
import acceptIcon from '../../assets/icon/light/accept-rsvp.svg';
import paperStar from '../../assets/paper-star.webp';
import { useDialog } from '../../hooks/useDialog';

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
  const dialogRef = useDialog<HTMLDivElement>(isOpen, onClose);

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

  const stepTitle =
    step === 'verify-email' ? 'Step 1 of 3 · Verify invitation' : step === 'respond-rsvp' ? 'Step 2 of 3 · Your response' : 'Step 3 of 3 · Save the date';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
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
            aria-labelledby="rsvp-title"
            tabIndex={-1}
            className="relative z-10 bg-white rounded-t-[28px] sm:rounded-[32px] p-5 sm:p-8 max-w-lg w-full max-h-[92svh] overflow-y-auto flex flex-col gap-5"
            style={{ boxShadow: 'var(--elev-3)' }}
            initial={{ scale: 0.96, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 30 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          >
            {/* Header: step + close */}
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-[var(--separator)]">
              <div className="flex items-center gap-2">
                <img src={paperStar} alt="" className="w-5 h-5 select-none" />
                <span className="t-eyebrow text-[#4A3B55] tracking-wider">{stepTitle}</span>
              </div>
              <button type="button" onClick={onClose} className="icon-btn" aria-label="Close">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
                  <path d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>
            </div>

            {/* Error banner (announced to screen readers) */}
            {errorMessage && (
              <motion.div
                role="alert"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-300 text-red-800 t-callout p-3.5 rounded-2xl flex items-start gap-2"
              >
                <span className="font-bold leading-none mt-0.5" aria-hidden="true">⚠</span>
                <span>{errorMessage}</span>
              </motion.div>
            )}

            {/* ── STEP 1: Email verification ── */}
            {step === 'verify-email' && (
              <form onSubmit={handleVerifyEmail} className="flex flex-col gap-4">
                <div className="text-center">
                  <h2 id="rsvp-title" className="t-title text-[#1A1A2E] text-2xl">
                    {targetGuest ? `Verify RSVP for ${targetGuest.guest_name}` : 'Verify your invitation'}
                  </h2>
                  <p className="t-callout text-[var(--label-secondary)] mt-2">
                    To protect guest privacy, enter the email address you gave the host.
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="rsvp-email" className="field-label">
                    Your invited email address
                  </label>
                  <input
                    id="rsvp-email"
                    type="email"
                    required
                    autoComplete="email"
                    inputMode="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="name@example.com"
                    className="field"
                    data-autofocus
                  />
                </div>

                <button type="submit" disabled={loading || !emailInput.trim()} className="btn btn-primary btn-block min-h-12">
                  {loading ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" role="status" aria-label="Verifying" /> : <span>Verify my email</span>}
                </button>
              </form>
            )}

            {/* ── STEP 2: Attendance + optional wish ── */}
            {step === 'respond-rsvp' && verifiedGuest && (
              <form onSubmit={handleConfirmRsvp} className="flex flex-col gap-5">
                <div className="text-center">
                  <h2 id="rsvp-title" className="t-title text-[#1A1A2E] text-2xl">
                    Welcome, {verifiedGuest.guest_name}! 🐾
                  </h2>
                  <p className="t-callout text-[var(--label-secondary)] mt-1">Meow Yoga Birthday · Nov 20, 2026, 6:40 pm</p>
                </div>

                <fieldset className="flex flex-col gap-2">
                  <legend className="field-label mb-2">Will you be able to attend?</legend>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setIsAttending(true)}
                      aria-pressed={isAttending}
                      className={`btn ${isAttending ? 'btn-primary' : 'btn-outline'}`}
                    >
                      <img src={acceptIcon} alt="" className={`w-4 h-4 ${isAttending ? '' : 'invert'}`} />
                      <span>Yes, I'm in!</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAttending(false)}
                      aria-pressed={!isAttending}
                      className={`btn ${!isAttending ? 'btn-primary' : 'btn-outline'}`}
                    >
                      <span>Can't make it</span>
                    </button>
                  </div>
                </fieldset>

                {isAttending && (
                  <div className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-[#F4F1F6]">
                    <div>
                      <p className="field-label" id="plusones-label">Bringing companions?</p>
                      <p className="t-footnote text-[var(--label-secondary)]">Extra guests coming with you</p>
                    </div>

                    <div className="flex items-center gap-2" role="group" aria-labelledby="plusones-label">
                      <button
                        type="button"
                        onClick={() => setPlusOnes((p) => Math.max(0, p - 1))}
                        disabled={plusOnes <= 0}
                        className="icon-btn bg-white shadow-xs text-lg font-semibold"
                        aria-label="One fewer companion"
                      >
                        −
                      </button>
                      <output className="w-6 text-center font-semibold text-lg" aria-live="polite">
                        {plusOnes}
                      </output>
                      <button
                        type="button"
                        onClick={() => setPlusOnes((p) => Math.min(5, p + 1))}
                        disabled={plusOnes >= 5}
                        className="icon-btn bg-white shadow-xs text-lg font-semibold"
                        aria-label="One more companion"
                      >
                        +
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  <label htmlFor="wish-text" className="field-label flex items-baseline justify-between gap-2">
                    <span>Birthday wish (optional)</span>
                    <span className="t-footnote font-normal text-[var(--label-tertiary)]">{wishInput.length} / 500</span>
                  </label>
                  <textarea
                    id="wish-text"
                    rows={3}
                    maxLength={500}
                    value={wishInput}
                    onChange={(e) => setWishInput(e.target.value)}
                    placeholder="Leave a sweet note for the Wish Wall…"
                    className="field"
                  />
                </div>

                <button type="submit" disabled={loading} className="btn btn-primary btn-block min-h-12">
                  {loading ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" role="status" aria-label="Sending" /> : <span>Send my response</span>}
                </button>
              </form>
            )}

            {/* ── STEP 3: Save the date (the modal stays open on purpose) ── */}
            {step === 'save-date' && verifiedGuest && (
              <div className="flex flex-col items-center text-center gap-4 py-2">
                <div className="w-16 h-16 rounded-full bg-[#F9C5D1] flex items-center justify-center">
                  <img src={saveDateIcon} alt="" className="w-8 h-8" />
                </div>

                <div>
                  <h2 id="rsvp-title" className="t-title text-[#1A1A2E]">
                    {isAttending ? 'See you there! 🎉' : 'Response recorded'}
                  </h2>
                  <p className="t-callout text-[var(--label-secondary)] mt-2 max-w-sm">
                    {isAttending
                      ? 'Your RSVP is confirmed. Add the day to your calendar so you don’t miss any of the fun.'
                      : 'We’ll miss you at the celebration. Thanks for letting us know.'}
                  </p>
                </div>

                {isAttending && (
                  <div className="w-full flex flex-col gap-3 mt-2">
                    <a href={getGoogleCalendarUrl()} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-block min-h-12" data-autofocus>
                      <img src={saveDateIcon} alt="" className="w-4 h-4 invert" />
                      <span>Add to Google Calendar</span>
                    </a>

                    <button type="button" onClick={() => downloadICSFile()} className="btn btn-secondary btn-block">
                      <span>Download calendar file (.ics)</span>
                    </button>
                  </div>
                )}

                <button type="button" onClick={onClose} className="btn btn-outline mt-1">
                  Done
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
