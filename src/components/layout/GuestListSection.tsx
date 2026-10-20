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
      aria-label="Guest list and RSVP section"
    >
      {/* Decorative Stickers & Sparkles matching Section 2 and 3 aesthetic */}
      <img
        src={silverStars}
        alt=""
        role="presentation"
        className="absolute top-8 right-0 w-80 sm:w-96 opacity-65 pointer-events-none select-none z-0"
      />
      <img
        src={paperTrumpet}
        alt=""
        role="presentation"
        className="absolute top-12 left-4 w-20 sm:w-28 rotate-12 opacity-80 pointer-events-none select-none z-0 drop-shadow-md"
      />

      <div className="relative z-10 w-full max-w-xl mx-auto flex flex-col gap-6">
        {/* Section Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 mb-2.5 bg-white/75 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/80 shadow-xs">
            <img src={paperStar} alt="" className="w-4 h-4 select-none" />
            <span className="font-montserrat font-bold text-xs uppercase tracking-widest text-[#6b5b73]">
              Guest List & RSVP
            </span>
          </div>

          <h2 className="font-heaven text-4xl sm:text-5xl text-[#1A1A2E]">
            Are you joining the fun?
          </h2>
          <p className="font-montserrat text-xs sm:text-sm text-[#4a4a6a] mt-1.5 max-w-md mx-auto leading-relaxed">
            Find your name on the invited guest list below to confirm your attendance or send a sweet birthday wish!
          </p>
        </div>

        {/* Search Bar & Direct Action */}
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <div className="relative w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search your name on guest list..."
              className="w-full pl-10 pr-4 py-3 bg-white/85 backdrop-blur-md rounded-2xl border border-white/80 text-xs sm:text-sm font-montserrat placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-[#B496BC] focus:border-[#B496BC] transition shadow-xs outline-hidden"
            />
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
              🔍
            </span>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Direct RSVP Button */}
          <button
            type="button"
            onClick={() => handleOpenRsvp()}
            className="w-full sm:w-auto flex-shrink-0 px-5 py-3 bg-[#1A1A2E] hover:bg-[#2b2b48] text-white font-montserrat font-bold text-xs sm:text-sm rounded-2xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <img src={acceptIcon} alt="" className="w-3.5 h-3.5" />
            <span>Confirm RSVP</span>
          </button>
        </div>

        {/* Guest List Table Container (Max 5 rows displayed, slide up/down scroll) */}
        <div className="relative bg-white/80 backdrop-blur-xl rounded-[32px] p-4 sm:p-6 shadow-xl border border-white/80 overflow-hidden">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100 px-2">
            <span className="font-montserrat font-bold text-xs uppercase text-[#6b5b73] tracking-wider">
              Invited Guests ({filteredGuests.length})
            </span>
            <button
              type="button"
              onClick={() => handleOpenWish()}
              className="font-montserrat font-semibold text-xs text-[#C4526A] hover:underline flex items-center gap-1.5 cursor-pointer"
            >
              <img src={wishingIcon} alt="" className="w-3.5 h-3.5" />
              <span>Leave a Wish</span>
            </button>
          </div>

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-3 border-[#B496BC] border-t-transparent rounded-full animate-spin" />
              <p className="font-montserrat text-xs text-[#6b5b73]">Loading guest list from database...</p>
            </div>
          ) : filteredGuests.length === 0 ? (
            <div className="py-12 text-center">
              <p className="font-heaven text-2xl text-[#6b5b73]">No matching guest found</p>
              <p className="font-montserrat text-xs text-gray-500 mt-1">
                {searchQuery ? 'Check spelling or verify your name with the host.' : 'No attendees registered yet.'}
              </p>
            </div>
          ) : (
            /* Scrollable list displaying max 5 rows at once */
            <div className="attendees-scroll flex flex-col gap-2.5 pr-1">
              {filteredGuests.map((guest, idx) => (
                <motion.div
                  key={guest.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-white/75 hover:bg-white border border-white/70 transition shadow-xs gap-3"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(idx * 0.04, 0.25) }}
                >
                  {/* Avatar + Name */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full overflow-hidden flex-shrink-0 border-2 border-[#B496BC]/60 shadow-xs">
                      <img
                        src={getAvatarForGuest(guest.id || guest.guest_name)}
                        alt={guest.guest_name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4 className="font-montserrat font-bold text-xs sm:text-sm text-[#1A1A2E] truncate">
                        {guest.guest_name}
                      </h4>

                      {/* Attendance badge */}
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {guest.is_attending ? (
                          <span className="inline-flex items-center text-[10px] sm:text-[11px] font-montserrat font-semibold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                            ● Attending {guest.plus_ones > 0 ? `(+${guest.plus_ones})` : ''}
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-[10px] sm:text-[11px] font-montserrat font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                            ○ Pending Response
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons using provided asset icons */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenRsvp(guest)}
                      title="Confirm Attendance"
                      className="px-3 py-1.5 rounded-xl bg-[#1A1A2E] hover:bg-[#2b2b48] text-white text-[11px] font-montserrat font-semibold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                    >
                      <img src={acceptIcon} alt="" className="w-3 h-3" />
                      <span className="hidden sm:inline">RSVP</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenWish(guest)}
                      title="Send Birthday Wish"
                      className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition cursor-pointer"
                      aria-label={`Send wish as ${guest.guest_name}`}
                    >
                      <img src={wishingIcon} alt="" className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Wishing Message Carousel (Right-to-left effect, 3s pause on each, auto-hides if empty) */}
        <WishCarousel refreshTrigger={refreshTrigger} />
      </div>

      {/* RSVP Confirmation Modal with Email Verification & Save the Date */}
      <RsvpModal
        isOpen={isRsvpModalOpen}
        onClose={() => setIsRsvpModalOpen(false)}
        targetGuest={selectedGuest}
        onRsvpSuccess={handleRsvpSuccess}
      />

      {/* Responsive Wish Sheet (Bottom sheet on phone/tablet, right live drawer on laptop/desktop) */}
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
