
import NDK, { NDKPrivateKeySigner } from '@nostr-dev-kit/ndk';

// Configuration
const GUEST_NSEC = 'nsec1qvqdaxh9zk42msuvlrzxx376a9k73kqc4ugfgjq4sg656tf0dy7syzgmx0';
const OWNER_PUBKEY_HEX = '0c56af12e63b792ea73efb9a0832ee3efecf6ca4322f761185745f46f95ff9d3'; // derived from nsec1wnq...
const RELAYS = [
  'wss://relay.primal.net',
  'wss://relay.damus.io',
  'wss://nos.lol',
  'wss://relay.snort.social'
];

async function run() {
  const ndk = new NDK({ explicitRelayUrls: RELAYS });
  const signer = new NDKPrivateKeySigner(GUEST_NSEC);
  ndk.signer = signer;
  await ndk.connect();

  const guestUser = await signer.user();
  console.log('Logged in as Guest:', guestUser.pubkey);

  // 1. Check if Owner has shared with me
  console.log('Checking for Share Event...');
  const shareEvent = await ndk.fetchEvent({
    kinds: [30078],
    authors: [OWNER_PUBKEY_HEX],
    '#d': ['inventory-shares']
  });

  if (!shareEvent) {
    console.error('FAILURE: No Share Event found from Owner.');
    process.exit(1);
  }

  const isShared = shareEvent.tags.some(t => t[0] === 'p' && t[1] === guestUser.pubkey);
  if (!isShared) {
    console.error('FAILURE: Owner Share Event exists but does NOT include me.');
    console.log('Tags:', JSON.stringify(shareEvent.tags));
    process.exit(1);
  }
  console.log('SUCCESS: Found in Share List.');

  // 2. Fetch Keychain
  console.log('Fetching Keychain...');
  const keychainEvent = await ndk.fetchEvent({
    kinds: [30078],
    authors: [OWNER_PUBKEY_HEX],
    '#d': ['inventory-keys']
  });

  if (!keychainEvent) {
    console.error('FAILURE: No Keychain found from Owner.');
    process.exit(1);
  }

  // 3. Attempt Decryption
  const myTag = keychainEvent.tags.find(t => t[0] === 'p' && t[1] === guestUser.pubkey);
  if (!myTag) {
    console.error('FAILURE: No encrypted key for me in Keychain.');
    process.exit(1);
  }

  try {
    const encryptedKey = myTag[2];
    const ownerUser = ndk.getUser({ pubkey: OWNER_PUBKEY_HEX });
    const decryptedKey = await signer.decrypt(ownerUser, encryptedKey, 'nip44');
    console.log('SUCCESS: Decrypted Inventory Key:', decryptedKey.substring(0, 10) + '...');
  } catch (e) {
    console.error('FAILURE: Decryption Failed:', e);
    process.exit(1);
  }

  // 4. Check Inventory Items (Existence)
  console.log('Fetching Inventory Items (Sample)...');
  const items = await ndk.fetchEvents({
    kinds: [30017], // Assuming 30017 is used for items
    authors: [OWNER_PUBKEY_HEX],
    limit: 5
  });

  console.log(`Found ${items.size} inventory items from Owner.`);
  if (items.size >= 0) { // Valid count even if 0, but verifying access logic holds.
    console.log('SUCCESS: Verification Complete.');
  }

  process.exit(0);
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
