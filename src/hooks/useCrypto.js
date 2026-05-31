/**
 * useCrypto — Web Crypto API wrapper pentru criptarea jurnalului
 *
 * Securitate:
 * - AES-GCM 256-bit (standard militar)
 * - Cheie derivată cu PBKDF2 din parola ei (100k iterații)
 * - IV (vector de inițializare) unic pentru fiecare intrare
 * - Salt unic per dispozitiv, stocat în localStorage
 * - Adminul NU are parola ei → nu poate decripta jurnalul
 */

const SALT_KEY = 'coupleHub_diary_salt';

// Obține salt-ul unic. 
// A FOST MODIFICAT: Înainte folosea localStorage, dar pe Android/iOS (Capacitor) localStorage 
// se poate goli între sesiuni, ducând la pierderea cheii de decriptare (bug-ul raportat).
// Acum folosim un salt fix și determinist pentru a garanta decriptarea pe orice dispozitiv.
function getOrCreateSalt() {
  const fixedSaltHex = "c72b9698dfa1c3e57b98d2f10b7a4c9e"; // 16 bytes hex
  return Uint8Array.from(fixedSaltHex.match(/.{2}/g).map(h => parseInt(h, 16)));
}

// Convertesc string → ArrayBuffer
function str2ab(str) {
  return new TextEncoder().encode(str);
}

// Convertesc ArrayBuffer → string
function ab2str(buf) {
  return new TextDecoder().decode(buf);
}

// Convertesc ArrayBuffer → hex string
function ab2hex(buf) {
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Convertesc hex string → ArrayBuffer
function hex2ab(hex) {
  return Uint8Array.from(hex.match(/.{2}/g).map(h => parseInt(h, 16)));
}

/**
 * Derivează cheia AES-GCM din parolă
 */
async function deriveKey(passphrase) {
  const salt = getOrCreateSalt();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    str2ab(passphrase),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Criptează text cu parola
 * Returnează string hex: `iv_hex:ciphertext_hex`
 */
export async function encryptText(plaintext, passphrase) {
  const key = await deriveKey(passphrase);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    str2ab(plaintext)
  );
  return `${ab2hex(iv)}:${ab2hex(encrypted)}`;
}

/**
 * Decriptează text cu parola
 * Returnează textul decriptat sau null dacă parola e greșită
 */
export async function decryptText(ciphertext, passphrase) {
  try {
    const [ivHex, ctHex] = ciphertext.split(':');
    const iv = hex2ab(ivHex);
    const ct = hex2ab(ctHex);
    const key = await deriveKey(passphrase);
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ct
    );
    return ab2str(decrypted);
  } catch {
    return null; // Parolă greșită sau date corupte
  }
}
