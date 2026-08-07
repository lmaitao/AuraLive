/**
 * Anti-WhatsApp & Contact Leak Security Regex Filter
 * Inspects outgoing live room & DM messages in real time.
 * Detects keywords: WhatsApp, wsp, WA, Instagram, IG, Telegram, número,
 * country codes, and numeric sequences >= 7 digits.
 * Replaces matched leaks with '[AURA PRIVACY: CONTACTO BLOQUEADO]'.
 */

const LEAK_PATTERNS = [
  // Phone numbers or sequences of 7 or more digits (with optional spaces, dots, or hyphens)
  /(?:(?:\+|00)?\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?)?\d{3,4}[\s.-]?\d{3,4}/gi,
  // Digit sequences with spaces/dots inserted to bypass filters (e.g. 3 0 0 1 2 3 4 5 6 7)
  /(?:\d[\s.-]*){7,}/gi,
  // WhatsApp variations
  /w[a@]*t[s$]*a[p$]*p*/gi,
  /w[\s.-]*s[\s.-]*p/gi,
  /\bwa\b/gi,
  // Social media escape terms
  /insta(?:gram)?/gi,
  /\big\b/gi,
  /tele(?:gram)?/gi,
  /t\.me/gi,
  /número|celular|telefono|contacto/gi
];

export function sanitizeMessage(text: string): { sanitizedText: string; isCensored: boolean } {
  if (!text) return { sanitizedText: text, isCensored: false };

  let isCensored = false;
  let sanitizedText = text;

  for (const pattern of LEAK_PATTERNS) {
    if (pattern.test(sanitizedText)) {
      isCensored = true;
      sanitizedText = sanitizedText.replace(pattern, '[AURA PRIVACY: CONTACTO BLOQUEADO]');
    }
  }

  return { sanitizedText, isCensored };
}
