import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { verifyGuestEmail, submitWishMessage, type RSVP } from '../../lib/supabase/client';
import paperStar from '../../assets/paper-star.webp';
import wishingIcon from '../../assets/icon/dark/wishing-message.svg';
import { useDialog } from '../../hooks/useDialog';

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
  const dialogRef = useDialog<HTMLDivElement>(isOpen, onClose);
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
            aria-hidden="true"
          />

          {/* Bottom sheet on phones and tablets, side drawer on desktop */}
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="wish-title"
            tabIndex={-1}
            className="relative z-10 w-full lg:w-[440px] max-h-[90svh] lg:max-h-full h-auto lg:h-full bg-white rounded-t-[28px] lg:rounded-t-none lg:rounded-l-[28px] p-5 sm:p-8 flex flex-col justify-between overflow-y-auto"
            style={{ boxShadow: 'var(--elev-3)' }}
            initial={{ y: '100%', x: 0 }}
            animate={{ y: 0, x: 0, transition: { type: 'spring', damping: 30, stiffness: 260 } }}
            exit={{ y: '100%', x: 0, transition: { duration: 0.25 } }}
          >
            <div>
              {/* Grabber (visual cue only; the close button is the real control) */}
              <div className="w-10 h-1.5 bg-gray-300 rounded-full mx-auto mb-4 lg:hidden" aria-hidden="true" />

              <div className="flex items-center justify-between gap-3 pb-3 border-b border-[var(--separator)]">
                <div className="flex items-center gap-2">
                  <img src={wishingIcon} alt="" className="w-5 h-5" />
                  <span className="t-eyebrow text-[#4A3B55] tracking-wider">Birthday wish wall</span>
                </div>
                <button type="button" onClick={onClose} className="icon-btn" aria-label="Close">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
                    <path d="M6 6l12 12M18 6 6 18" />
                  </svg>
                </button>
              </div>

              <div className="mt-5">
                <div className="flex items-center gap-2">
                  <h2 id="wish-title" className="t-title text-[#1A1A2E] text-2xl">
                    Send a sweet wish
                  </h2>
                  <img src={paperStar} alt="" className="w-5 h-5 select-none" />
                </div>
                <p className="t-callout text-[var(--label-secondary)] mt-2">
                  Your message appears on the public wishes wall for everyone to see.
                </p>
              </div>

              {successMessage && (
                <div role="status" className="mt-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 t-callout font-semibold">
                  {successMessage}
                </div>
              )}

              {errorMessage && (
                <div role="alert" className="mt-4 p-4 rounded-2xl bg-red-50 border border-red-300 text-red-800 t-callout">
                  {errorMessage}
                </div>
              )}

              {!verifiedGuest ? (
                /* Step A: verify who you are first */
                <form onSubmit={handleVerifyEmail} className="mt-6 flex flex-col gap-4">
                  <div className="p-4 rounded-2xl bg-[#B496BC]/15 border border-[#B496BC]/40">
                    <p className="t-callout font-semibold text-[var(--label)]">🔒 Quick verification</p>
                    <p className="t-footnote text-[var(--label-secondary)] mt-1">
                      Enter the email address you gave the host so we know the wish is really from you.
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label htmlFor="wish-email" className="field-label">
                      Your email address
                    </label>
                    <input
                      id="wish-email"
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
                    {loading ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" role="status" aria-label="Verifying" /> : <span>Verify and continue</span>}
                  </button>
                </form>
              ) : (
                /* Step B: write the wish */
                <form onSubmit={handleSubmitWish} className="mt-6 flex flex-col gap-4">
                  <div className="p-4 rounded-2xl bg-[#F4F1F6] flex items-center justify-between gap-3">
                    <div>
                      <p className="t-footnote text-[var(--label-secondary)]">Posting as</p>
                      <p className="t-headline text-[var(--label)]">{verifiedGuest.guest_name}</p>
                    </div>
                    <span className="t-footnote bg-emerald-100 text-emerald-900 font-semibold px-2.5 py-1 rounded-full">✓ Verified</span>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label htmlFor="wish-message-input" className="field-label flex items-baseline justify-between gap-2">
                      <span>Your birthday greeting</span>
                      <span className="t-footnote font-normal text-[var(--label-tertiary)]">{messageInput.length} / 500</span>
                    </label>
                    <textarea
                      id="wish-message-input"
                      rows={5}
                      required
                      maxLength={500}
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      placeholder="Your warmest thoughts, yoga jokes or sweet greetings…"
                      className="field"
                      data-autofocus
                    />
                  </div>

                  <button type="submit" disabled={loading || messageInput.trim().length < 2} className="btn btn-primary btn-block min-h-12">
                    {loading ? (
                      <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" role="status" aria-label="Publishing" />
                    ) : (
                      <>
                        <img src={wishingIcon} alt="" className="w-4 h-4 invert" />
                        <span>Publish wish</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

            <div className="pt-6 mt-6 border-t border-[var(--separator)] text-center">
              <p className="t-footnote text-[var(--label-tertiary)]">Meow Yoga Birthday · November 20, 2026</p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
