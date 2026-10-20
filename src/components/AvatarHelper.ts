import avatar1 from '../assets/attendees-anonymous-photo/random-1.png';
import avatar2 from '../assets/attendees-anonymous-photo/random-2.png';
import avatar3 from '../assets/attendees-anonymous-photo/random-3.png';
import avatar4 from '../assets/attendees-anonymous-photo/random-4.png';
import avatar5 from '../assets/attendees-anonymous-photo/random-5.png';
import avatar6 from '../assets/attendees-anonymous-photo/random-6.png';

export const AVATAR_LIST = [avatar1, avatar2, avatar3, avatar4, avatar5, avatar6];

/**
 * Returns a consistent avatar photo for any given string (such as guest name or ID).
 */
export function getAvatarForGuest(identifier: string): string {
  let hash = 0;
  for (let i = 0; i < identifier.length; i++) {
    hash = (hash << 5) - hash + identifier.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % AVATAR_LIST.length;
  return AVATAR_LIST[index];
}
