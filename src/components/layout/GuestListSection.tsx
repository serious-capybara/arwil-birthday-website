import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { fetchEventGuests, type RSVP } from '../../lib/supabase/client';
import { getAvatarForGuest } from '../ui/AvatarHelper';
import { RsvpModal } from '../ui/RsvpModal';
import { WishSheet } from '../ui/WishSheet';
import { WishCarousel } from '../ui/WishCarousel';
import acceptIcon from '../../assets/icon/light/accept-rsvp.svg';
import wishingIcon from '../../assets/icon/dark/wishing-message.svg';
import paperStar from '../../assets/paper-star.webp';
import silverStars from '../../assets/silver-dusk-star.webp';
import paperTrumpet from '../../assets/paper-trumpet.webp';

export function GuestListSection() {
  const [guests, setGuests] = useState<RSVP[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedGuest, setSelectedGuest] = useState<RSVP | null>(null);
  const [isRsvpModalOpen, setIsRsvpModalOpen] = useState<boolean>(false);
  const [isWishSheetOpen, setIsWishSheetOpen] = useState<boolean>(false);
  const [verifiedGuest, setVerifiedGuest] = useState<RSVP | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  // Load guests directly from Supabase (Pure database queries, no mock data)
  const loadGuests = async () => {
    setLoading(true);
    const { data } = await fetchEventGuests();
    setGuests(data);
    setLoading(false);
  };

  useEffect(() => {
    loadGuests();
  }, [refreshTrigger]);

  // Real-time search filter
  const filteredGuests = useMemo(() => {
    if (!searchQuery.trim()) return guests;
    const q = searchQuery.toLowerCase();
    return guests.filter((g) => g.guest_name.toLowerCase().includes(q));
  }, [guests, searchQuery]);

  const handleOpenRsvp = (guest?: RSVP) => {
    setSelectedGuest(guest || null);
    setIsRsvpModalOpen(true);
  };

  const handleOpenWish = (guest?: RSVP) => {
    if (guest) {
      setVerifiedGuest(guest);
    }
    setIsWishSheetOpen(true);
  };

  const handleRsvpSuccess = (updated: RSVP) => {
    setVerifiedGuest(updated);
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <section
      id="guest-list"
      className="section-full min-h-screen py-24 px-4 sm:px-8 relative flex flex-col items-center justify-center overflow-hidden"
      aria-labelledby="guest-list-title"
    >
      <div className="stage" aria-hidden="true" />

      {/* Decorative stickers and sparkles */}
      <img src={silverStars} alt="" role="presentation" className="absolute top-8 right-0 w-80 sm:w-96 opacity-60 pointer-events-none select-none z-0" />
      <img src={paperTrumpet} alt="" role="presentation" className="absolute top-12 left-4 w-20 sm:w-28 rotate-12 opacity-80 pointer-events-none select-none z-0 drop-shadow-md" />

      <div className="relative z-10 w-full max-w-xl mx-auto flex flex-col gap-6">
        {/* Section header */}
        <header className="text-center">
          <p className="material inline-flex items-center gap-2 mb-3 px-4 py-2 rounded-full t-eyebrow text-[#4A3B55]">
            <img src={paperStar} alt="" className="w-4 h-4 select-none" />
            <span>Guest list & RSVP</span>
          </p>

          <h2 id="guest-list-title" className="t-large-title text-white">
            Are you joining the fun?
          </h2>
          <p className="t-body text-[var(--on-teal-secondary)] mt-3 max-w-md mx-auto">
            Find your name on the guest list to confirm you're coming, or send a sweet birthday wish.
          </p>
        </header>

        {/* Search + primary action */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative w-full">
            <label htmlFor="guest-search" className="sr-only">
              Search the guest list by name
            </label>
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-[#66667C] pointer-events-none" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              id="guest-search"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search your name"
              autoComplete="off"
              enterKeyHint="search"
              className="field pl-11 pr-12 rounded-2xl"
              style={{ boxShadow: 'var(--elev-1)' }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="icon-btn absolute right-0.5 top-1/2 -translate-y-1/2 bg-transparent"
                aria-label="Clear search"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
                  <path d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>
            )}
          </div>

          <button type="button" onClick={() => handleOpenRsvp()} className="btn btn-primary sm:w-auto w-full flex-shrink-0 min-h-12">
            <img src={acceptIcon} alt="" className="w-4 h-4" />
            <span>Confirm RSVP</span>
          </button>
        </div>

        {/* Guest list (about five rows visible, then it scrolls) */}
        <div className="material-thick rounded-[32px] p-3 sm:p-5 overflow-hidden">
          <div className="flex items-center justify-between gap-3 pb-3 mb-3 border-b border-[var(--separator)] px-2">
            <h3 className="t-eyebrow text-[#4A3B55]">Invited guests ({filteredGuests.length})</h3>
            <button type="button" onClick={() => handleOpenWish()} className="btn btn-secondary text-[#9A3550]">
              <img src={wishingIcon} alt="" className="w-4 h-4" />
              <span>Leave a wish</span>
            </button>
          </div>

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3" role="status">
              <div className="w-8 h-8 border-[3px] border-[#B496BC] border-t-transparent rounded-full animate-spin" aria-hidden="true" />
              <p className="t-callout text-[var(--label-secondary)]">Loading the guest list…</p>
            </div>
          ) : filteredGuests.length === 0 ? (
            <div className="py-12 text-center" role="status">
              <p className="t-headline text-[var(--label-secondary)]">No matching guest found</p>
              <p className="t-callout text-[var(--label-tertiary)] mt-1">
                {searchQuery ? 'Check the spelling, or ask the host to confirm your name.' : 'No guests have been added yet.'}
              </p>
            </div>
          ) : (
            <ul className="attendees-scroll flex flex-col gap-2.5 pr-1" aria-label="Invited guests">
              {filteredGuests.map((guest, idx) => (
                <motion.li
                  key={guest.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-white border border-[var(--separator)] gap-3"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(idx * 0.04, 0.25) }}
                >
                  {/* Avatar + name + status */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-11 h-11 rounded-full overflow-hidden flex-shrink-0 border-2 border-[#B496BC]/60">
                      <img src={getAvatarForGuest(guest.id || guest.guest_name)} alt="" className="w-full h-full object-cover" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="t-headline text-[var(--label)] truncate">{guest.guest_name}</p>
                      {/* Status is shown with text and a symbol, never colour alone */}
                      {guest.is_attending ? (
                        <span className="inline-flex items-center gap-1 t-footnote font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                          <span aria-hidden="true">✓</span> Attending{guest.plus_ones > 0 ? ` (+${guest.plus_ones})` : ''}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 t-footnote font-semibold text-[#4A4A63] bg-gray-100 px-2 py-0.5 rounded-full">
                          <span aria-hidden="true">○</span> Awaiting reply
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Row actions */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenRsvp(guest)}
                      className="btn btn-primary px-3 sm:px-4"
                      aria-label={`RSVP as ${guest.guest_name}`}
                    >
                      <img src={acceptIcon} alt="" className="w-4 h-4" />
                      <span className="hidden sm:inline">RSVP</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenWish(guest)}
                      className="icon-btn"
                      aria-label={`Send a wish as ${guest.guest_name}`}
                    >
                      <img src={wishingIcon} alt="" className="w-4 h-4" />
                    </button>
                  </div>
                </motion.li>
              ))}
            </ul>
          )}
        </div>

        {/* Wishes wall */}
        <WishCarousel refreshTrigger={refreshTrigger} />
      </div>

      {/* RSVP flow: verify email, respond, save the date */}
      <RsvpModal
        isOpen={isRsvpModalOpen}
        onClose={() => setIsRsvpModalOpen(false)}
        targetGuest={selectedGuest}
        onRsvpSuccess={handleRsvpSuccess}
      />

      {/* Wish sheet: bottom sheet on phones, side drawer on desktop */}
      <WishSheet
        isOpen={isWishSheetOpen}
        onClose={() => setIsWishSheetOpen(false)}
        verifiedGuest={verifiedGuest}
        onGuestVerified={(guest) => setVerifiedGuest(guest)}
        onWishSubmitted={() => setRefreshTrigger((prev) => prev + 1)}
      />
    </section>
  );
}
