import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: { persistSession: false },
  }
);

// ──────────────────────────────────────────────────
// Types matching rsvps table schema
// ──────────────────────────────────────────────────

export interface RSVP {
  id: string;
  created_at: string;
  guest_name: string;
  email: string;
  is_attending: boolean;
  plus_ones: number;
  wish_message: string | null;
  event_code: string;
}

// ──────────────────────────────────────────────────
// Security helpers (Sanitization & Email Validation)
// ──────────────────────────────────────────────────

/** Strip HTML/script tags and special characters to prevent XSS / injection */
export function sanitizeText(input: string): string {
  if (!input) return '';
  return input
    .replace(/<[^>]*>/g, '') // remove HTML tags
    .replace(/[&<>"'`]/g, (c) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
      '`': '&#96;',
    }[c] ?? c))
    .trim()
    .slice(0, 500); // hard limit length
}

/** Validate email format */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim().toLowerCase());
}

export const EVENT_CODE = (import.meta.env.VITE_EVENT_CODE as string) || 'meow_2026';

// ──────────────────────────────────────────────────
// Direct Supabase Operations (Pure Database queries, no static mocks)
// ──────────────────────────────────────────────────

/**
 * Fetch all guests for this event code from Supabase
 */
export async function fetchEventGuests(): Promise<{ data: RSVP[]; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('rsvps')
      .select('*')
      .eq('event_code', EVENT_CODE)
      .order('guest_name', { ascending: true });

    if (error) {
      return { data: [], error: error.message };
    }
    return { data: (data as RSVP[]) || [], error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch attendees';
    return { data: [], error: message };
  }
}

/**
 * Verify whether a guest email exists in Supabase rsvps table for this event.
 * Case-insensitive email match.
 */
export async function verifyGuestEmail(email: string): Promise<{ guest: RSVP | null; error: string | null }> {
  const cleanEmail = email.trim().toLowerCase();
  if (!isValidEmail(cleanEmail)) {
    return { guest: null, error: 'Please enter a valid email address.' };
  }

  try {
    const { data, error } = await supabase
      .from('rsvps')
      .select('*')
      .eq('event_code', EVENT_CODE)
      .ilike('email', cleanEmail)
      .maybeSingle();

    if (error) {
      return { guest: null, error: error.message };
    }
    if (!data) {
      return { guest: null, error: 'Your email was not found on the guest list. Please make sure to use the exact email provided to the host.' };
    }
    return { guest: data as RSVP, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Verification request failed';
    return { guest: null, error: message };
  }
}

/**
 * Update RSVP attendance status, companion count, and optional wish in Supabase.
 */
export async function confirmRSVP(
  rsvpId: string,
  isAttending: boolean,
  plusOnes: number = 0,
  wishMessage?: string
): Promise<{ success: boolean; error: string | null; updated: RSVP | null }> {
  const cleanMessage = wishMessage ? sanitizeText(wishMessage) : null;
  const safePlusOnes = Math.max(0, Math.min(10, Math.floor(plusOnes)));

  try {
    const updatePayload: Partial<RSVP> = {
      is_attending: isAttending,
      plus_ones: safePlusOnes,
    };

    if (cleanMessage !== null && cleanMessage.length > 0) {
      updatePayload.wish_message = cleanMessage;
    }

    const { data, error } = await supabase
      .from('rsvps')
      .update(updatePayload)
      .eq('id', rsvpId)
      .eq('event_code', EVENT_CODE)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message, updated: null };
    }

    return { success: true, error: null, updated: data as RSVP };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update RSVP';
    return { success: false, error: message, updated: null };
  }
}

/**
 * Submit or update a birthday wish message in Supabase
 */
export async function submitWishMessage(
  rsvpId: string,
  message: string
): Promise<{ success: boolean; error: string | null }> {
  const clean = sanitizeText(message);
  if (!clean || clean.length < 2) {
    return { success: false, error: 'Please enter a message with at least 2 characters.' };
  }

  try {
    const { error } = await supabase
      .from('rsvps')
      .update({ wish_message: clean })
      .eq('id', rsvpId)
      .eq('event_code', EVENT_CODE);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to submit wish message';
    return { success: false, error: msg };
  }
}

/**
 * Fetch all wishing messages directly from Supabase for the wishing ticker/carousel
 */
export async function fetchWishingMessages(): Promise<{ name: string; message: string; id: string }[]> {
  try {
    const { data, error } = await supabase
      .from('rsvps')
      .select('id, guest_name, wish_message')
      .eq('event_code', EVENT_CODE)
      .not('wish_message', 'is', null)
      .neq('wish_message', '');

    if (error || !data) return [];

    return data
      .filter((row) => row.wish_message && row.wish_message.trim().length > 0)
      .map((row) => ({
        id: row.id,
        name: row.guest_name,
        message: row.wish_message!,
      }));
  } catch {
    return [];
  }
}
