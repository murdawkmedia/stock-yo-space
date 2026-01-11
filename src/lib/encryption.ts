import { xchacha20poly1305 } from '@noble/ciphers/chacha.js';
import { bytesToHex, hexToBytes, utf8ToBytes, bytesToUtf8, managedNonce, randomBytes } from '@noble/ciphers/utils.js';

// Re-export utility functions for convenience
export { bytesToHex, hexToBytes, randomBytes };

/**
 * Generates a random 32-byte key for inventory encryption
 */
export function generateInventoryKey(): Uint8Array {
  return randomBytes(32);
}

/**
 * Encrypts data using XChaCha20-Poly1305 with a random nonce (prepended)
 * This is symmetric encryption using the Shared Inventory Key.
 */
export function encryptInventoryData(content: string, key: Uint8Array): string {
  if (key.length !== 32) throw new Error('Invalid key length');

  const data = utf8ToBytes(content);
  // managedNonce expects the cipher function
  const chacha = managedNonce(xchacha20poly1305);

  const encryptedBytes = chacha(key).encrypt(data);
  return 'ivt1-' + bytesToHex(encryptedBytes);
}

/**
 * Decrypts inventory data
 */
export function decryptInventoryData(ciphertext: string, key: Uint8Array): string | null {
  if (!ciphertext.startsWith('ivt1-')) return null;
  if (key.length !== 32) return null;

  try {
    const rawHex = ciphertext.slice(5);
    const rawBytes = hexToBytes(rawHex);

    const chacha = managedNonce(xchacha20poly1305);

    // managedNonce automatically reads the nonce from the beginning of the ciphertext
    const decryptedBytes = chacha(key).decrypt(rawBytes);
    return bytesToUtf8(decryptedBytes);
  } catch (e) {
    console.error('Decryption failed:', e);
    return null;
  }
}
