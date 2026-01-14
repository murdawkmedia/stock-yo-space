
import { nip44, generateSecretKey, getPublicKey } from 'nostr-tools';

try {
  const sk1 = generateSecretKey();
  const pk1 = getPublicKey(sk1);
  const sk2 = generateSecretKey();
  const pk2 = getPublicKey(sk2);

  const message = "attack at dawn";

  // Check if high-level encrypt exists
  // version 2.x standard: encrypt(privKey, pubKey, text) ??
  // Or involves conversation key.

  // Let's inspect properties
  console.log('nip44 keys:', Object.keys(nip44));

  if (typeof nip44.encrypt === 'function') {
    try {
      // Attempt 1: encrypt(sk, pk, msg)
      const ciphertext = nip44.encrypt(sk1, pk2, message);
      console.log('Encrypt success (sk, pk, msg):', ciphertext);
      const plaintext = nip44.decrypt(sk2, pk1, ciphertext);
      console.log('Decrypt success:', plaintext === message);
    } catch (e) {
      console.log('High level encrypt failed:', e.message);
    }
  } else if (nip44.v2) {
    console.log('Found nip44.v2');
  }

} catch (e) {
  console.error(e);
}
