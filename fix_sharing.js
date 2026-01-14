
import NDK, { NDKEvent, NDKUser, NDKPrivateKeySigner } from '@nostr-dev-kit/ndk';

// Configuration
const OWNER_NSEC = 'nsec1wnqh6y2aqlkygufm90vyjs38d6wcq2qzzh536tshg5u93m0w640shfrm4d';
const GUEST_PUBKEY_HEX = 'a1dcc614a3825ee8f8aed07a0aa8ec14077841644ee784c5d73c5179d9738ca0'; // derived from nsec1qvq...
const RELAYS = [
  'wss://relay.primal.net',
  'wss://relay.damus.io',
  'wss://nos.lol',
  'wss://relay.snort.social'
];

async function run() {
  const ndk = new NDK({ explicitRelayUrls: RELAYS });
  const signer = new NDKPrivateKeySigner(OWNER_NSEC);
  ndk.signer = signer;
  await ndk.connect();

  const ownerUser = await signer.user();
  console.log('Logged in as Owner:', ownerUser.pubkey);

  // 1. Fetch Keychain (Kind 30078, d=inventory-keys)
  // Note: App uses 30078 for keychain in useInventoryKey.ts, NOT 30008.
  // Wait, useInventoryKey.ts says: const KEYCHAIN_KIND = 30078; const KEYCHAIN_D_TAG = 'inventory-keys';

  console.log('Fetching Keychain...');
  const keychainEvent = await ndk.fetchEvent({
    kinds: [30078],
    authors: [ownerUser.pubkey],
    '#d': ['inventory-keys']
  });

  if (!keychainEvent) {
    console.error('No Keychain found! App must initialize it first.');
    process.exit(1);
  }

  // 2. Decrypt My Key
  // Find tag: ['p', my_pub, encrypted_key]
  const myTag = keychainEvent.tags.find(t => t[0] === 'p' && t[1] === ownerUser.pubkey);
  if (!myTag) {
    console.error('Owner entry not found in keychain!');
    process.exit(1);
  }

  const encryptedKey = myTag[2];
  const myKeyHex = await signer.decrypt(ownerUser, encryptedKey, 'nip44'); // NDK handles NIP-44 string
  console.log('Decrypted Symmetric Key:', myKeyHex.substring(0, 10) + '...');

  // 3. Encrypt for Guest
  const guestUser = new NDKUser({ pubkey: GUEST_PUBKEY_HEX });
  console.log('Encrypting for Guest:', guestUser.pubkey);
  const encryptedForGuest = await signer.encrypt(guestUser, myKeyHex, 'nip44');

  // 4. Update Keychain Event
  // Filter out OLD guest entries to avoid duplicates/conflicts? 
  // The previous bad share was to '0300...', current correct one is 'a1dcc...'
  // So we just filter out any existing entry for THIS guest, and append new one.
  const otherTags = keychainEvent.tags.filter(t => t[0] !== 'p' || (t[1] !== GUEST_PUBKEY_HEX));

  const newKeychain = new NDKEvent(ndk);
  newKeychain.kind = 30078;
  newKeychain.tags = [
    ...otherTags,
    ['p', GUEST_PUBKEY_HEX, encryptedForGuest]
  ];
  await newKeychain.publish();
  console.log('Keychain updated with Guest access.');

  // 5. Update Sharing List (Kind 30078, d=inventory-shares)
  // This tells the Guest "I have shared with you"
  console.log('Fetching Sharing List...');
  const shareListEvent = await ndk.fetchEvent({
    kinds: [30078],
    authors: [ownerUser.pubkey],
    '#d': ['inventory-shares']
  });

  const newShareList = new NDKEvent(ndk);
  newShareList.kind = 30078;

  let existingShareTags = [];
  if (shareListEvent) {
    existingShareTags = shareListEvent.tags.filter(t => t[0] !== 'd');
  }

  // Filter out existing guest tag if present
  const cleanShareTags = existingShareTags.filter(t => t[0] !== 'p' || t[1] !== GUEST_PUBKEY_HEX);

  newShareList.tags = [
    ['d', 'inventory-shares'],
    ...cleanShareTags,
    ['p', GUEST_PUBKEY_HEX]
  ];
  await newShareList.publish();
  console.log('Sharing List updated.');

  console.log('FIX COMPLETE.');
  process.exit(0);
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
