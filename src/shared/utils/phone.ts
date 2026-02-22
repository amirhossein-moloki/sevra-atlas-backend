/**
 * Normalizes Iranian phone numbers to E.164 format (+989XXXXXXXXX).
 * Handles formats like: 0912..., 912..., +98912..., 0098912...
 *
 * @param phone - The input phone number string
 * @returns The normalized phone number in +98 format
 */
export function normalizePhone(phone: string): string {
  if (!phone) return phone;

  // Remove all non-digit characters
  let digits = phone.replace(/\D/g, '');

  if (digits.startsWith('0098')) {
    digits = digits.substring(4);
  } else if (digits.startsWith('98') && digits.length > 10) {
    digits = digits.substring(2);
  } else if (digits.startsWith('0')) {
    digits = digits.substring(1);
  }

  // Ensure it's a 10-digit number starting with 9
  if (digits.length === 10 && digits.startsWith('9')) {
    return `+98${digits}`;
  }

  // Fallback for non-standard but potentially valid numbers
  return phone;
}
