import random1 from '../../assets/attendees-anonymous-photo/random-1.webp';
import random2 from '../../assets/attendees-anonymous-photo/random-2.webp';
import random3 from '../../assets/attendees-anonymous-photo/random-3.webp';
import random4 from '../../assets/attendees-anonymous-photo/random-4.webp';
import random5 from '../../assets/attendees-anonymous-photo/random-5.webp';
import random6 from '../../assets/attendees-anonymous-photo/random-6.webp';

const AVATARS = [random1, random2, random3, random4, random5, random6];

/**
 * Deterministically picks an anonymous attendee photo based on guest ID/name
 */
export function getAvatarForGuest(seed: string): string {
  if (!seed) return AVATARS[0];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % AVATARS.length;
  return AVATARS[index];
}
