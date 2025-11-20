/**
 * Client-side encryption for individual passwords using Web Crypto API
 * Uses AES-256-GCM with PBKDF2 key derivation (600,000 iterations - OWASP 2023)
 * Each password is encrypted individually with its own IV and salt
 */

interface EncryptedData {
  ciphertext: string;
  iv: string;
  salt: string;
}

/**
 * Derives a cryptographic key from user's email using PBKDF2
 * Uses email as the "master password" for transparent encryption
 */
async function deriveKey(userEmail: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const emailBuffer = encoder.encode(userEmail);

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    emailBuffer,
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: 600000, // OWASP 2023 recommendation
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts a plaintext password using AES-256-GCM
 */
export async function encryptPassword(
  plaintext: string,
  userEmail: string
): Promise<EncryptedData> {
  const encoder = new TextEncoder();
  
  // Generate random salt and IV for each password
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  const key = await deriveKey(userEmail, salt);
  
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(plaintext)
  );

  return {
    ciphertext: arrayBufferToBase64(ciphertext),
    iv: arrayBufferToBase64(iv.buffer),
    salt: arrayBufferToBase64(salt.buffer),
  };
}

/**
 * Decrypts an encrypted password using AES-256-GCM
 */
export async function decryptPassword(
  encrypted: EncryptedData,
  userEmail: string
): Promise<string> {
  const decoder = new TextDecoder();
  
  const ciphertext = base64ToArrayBuffer(encrypted.ciphertext);
  const iv = base64ToArrayBuffer(encrypted.iv);
  const salt = base64ToArrayBuffer(encrypted.salt);
  
  const key = await deriveKey(userEmail, new Uint8Array(salt));
  
  try {
    const plaintext = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: new Uint8Array(iv) },
      key,
      ciphertext
    );
    
    return decoder.decode(plaintext);
  } catch (error) {
    throw new Error('Decryption failed');
  }
}

/**
 * Serializes encrypted data for storage in database
 */
export function serializeEncrypted(encrypted: EncryptedData): string {
  return JSON.stringify(encrypted);
}

/**
 * Deserializes encrypted data from database
 */
export function deserializeEncrypted(serialized: string): EncryptedData {
  return JSON.parse(serialized);
}

/**
 * Utility: ArrayBuffer to Base64
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Utility: Base64 to ArrayBuffer
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Generates a cryptographically secure random password
 */
export function generateSecurePassword(length: number = 16): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
  const randomValues = crypto.getRandomValues(new Uint8Array(length));
  
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset[randomValues[i] % charset.length];
  }
  
  return password;
}
