export function generatePromoCode(length: number = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

export function isLikelyValidPromo(code: string): boolean {
  if (!code) return false;
  const normalized = code.trim().toUpperCase();
  return /^[A-Z0-9]{6,12}$/.test(normalized);
}
