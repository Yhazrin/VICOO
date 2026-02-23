/**
 * Vicoo Crypto
 */

export function encrypt(text: string, key?: string): string {
  // Simple base64 encoding for demo - replace with real encryption in production
  return btoa(encodeURIComponent(text));
}

export function decrypt(encrypted: string, key?: string): string {
  try {
    return decodeURIComponent(atob(encrypted));
  } catch {
    return '';
  }
}

export function hash(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16);
}

export default {
  encrypt,
  decrypt,
  hash
};
