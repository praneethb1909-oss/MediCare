/**
 * Sensitive Data Masking Utility for Olmera Healthcare Platform
 * Provides consistent, HIPAA-aligned obfuscation for PII (emails and phone numbers)
 * across patient registries, doctor directories, audit trails, and consultation views.
 */

/**
 * Partially masks an email address while maintaining recognizable domain context.
 * e.g. "praneethb@gmail.com" -> "p•••••b@gmail.com"
 * e.g. "admin@olmera.health" -> "a•••n@olmera.health"
 * e.g. "dr.suresh@apollo.org" -> "d••••••h@apollo.org"
 */
export function maskEmail(email?: string | null): string {
  if (!email || typeof email !== 'string') return 'N/A';
  const trimmed = email.trim();
  if (!trimmed.includes('@')) return trimmed;

  const [username, domain] = trimmed.split('@');
  if (!username) return trimmed;

  if (username.length <= 2) {
    return `${username[0]}•@${domain}`;
  }

  const firstChar = username[0];
  const lastChar = username[username.length - 1];
  const maskedLength = Math.min(5, Math.max(3, username.length - 2));
  const maskedMiddle = '•'.repeat(maskedLength);

  return `${firstChar}${maskedMiddle}${lastChar}@${domain}`;
}

/**
 * Partially masks a phone number while maintaining international dialing code
 * and the final 3-4 digits for verification.
 * e.g. "+91 98765 43210" -> "+91 ••••• ••210"
 * e.g. "+91 9123456789"  -> "+91 ••••• •6789"
 * e.g. "9876543210"      -> "••••••3210"
 */
export function maskPhone(phone?: string | null): string {
  if (!phone || typeof phone !== 'string') return 'N/A';
  const trimmed = phone.trim();
  if (trimmed.length < 5) return trimmed;

  // Extract digits only for masking
  const digitsOnly = trimmed.replace(/\D/g, '');
  if (digitsOnly.length < 7) {
    return trimmed.replace(/\d/g, '•');
  }

  // Preserve country code if present (e.g., +91)
  const hasPlus = trimmed.startsWith('+');
  let prefix = '';
  if (hasPlus) {
    // Check if +91 or similar
    const match = trimmed.match(/^(\+\d{1,3}[\s-]?).*/);
    if (match) {
      prefix = match[1];
    }
  }

  // Keep last 4 digits
  const last4 = digitsOnly.slice(-4);
  const maskCount = Math.max(4, Math.min(6, digitsOnly.length - 4 - (prefix ? prefix.replace(/\D/g, '').length : 0)));
  const dots = '•'.repeat(maskCount);

  if (prefix) {
    return `${prefix}${dots} ••${last4.slice(-3)}`;
  }

  return `${dots}${last4}`;
}
