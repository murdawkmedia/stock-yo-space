
import NDK, { NDKEvent, NDKPrivateKeySigner, NDKUser } from '@nostr-dev-kit/ndk';
import { nip19, nip44 } from 'nostr-tools';
import 'websocket-polyfill';
import crypto from 'crypto';

// --- CONFIGURATION ---
// Owner
const OWNER_NSEC = 'nsec1wnqh6y2aqlkygufm90vyjs38d6wcq2qzzh536tshg5u93m0w640shfrm4d';
const OWNER_PUBKEY_HEX = '0c56af12e63b792ea73efb9a0832ee3efecf6ca4322f761185745f46f95ff9d3';

// Guest
const GUEST_NSEC = 'nsec1qvqdaxh9zk42msuvlrzxx376a9k73kqc4ugfgjq4sg656tf0dy7syzgmx0';
const GUEST_PRIVKEY_HEX = '0300de9ae515aaadc38cf8c46347dae96de8d818af1094481582354d2d2f693d';

const RELAYS = [
  'wss://relay.primal.net',
  'wss://relay.damus.io',
  'wss://nos.lol'
];

// Constants
const KEYCHAIN_KIND = 30078;
const KEYCHAIN_D_TAG = 'inventory-keys';
const INVENTORY_KIND = 30017;
const INVENTORY_D_TAG = 'inventory';

const TEST_ITEM_NAME = `Shared Item Test ${Date.now()}`;

async function runTest() {
  console.log('🚀 Starting Two-User Sharing Verification Flow');

  // ---------------------------------------------------------
  // STEP 1: Owner Creates Item
  // ---------------------------------------------------------
  console.log('\n👤 OWNER ACTION: Creating new item...');
  const ownerNDK = new NDK({ explicitRelayUrls: RELAYS });
  ownerNDK.signer = new NDKPrivateKeySigner(OWNER_NSEC);
  await ownerNDK.connect();

  // 1.1 Fetch Key (to encrypt)
  // In a real app we'd fetch the keychain, decrypt the shared key. 
  // For this test, to mimic "using the shared key", we need to fetch the keychain event first.

  const keychainEvent = await ownerNDK.fetchEvent({
    kinds: [KEYCHAIN_KIND],
    authors: [OWNER_PUBKEY_HEX],
    '#d': [KEYCHAIN_D_TAG]
  });

  if (!keychainEvent) {
    console.error('❌ Owner Keychain not found. Run fix_sharing.js first.');
    process.exit(1);
  }

  // Decrypt the shared key from the keychain (Owner's NIP-44 to self)
  // The content is nip44 encrypted.
  // We need to use NDK's decryption or manual nip44.
  // Since we are nodejs, we can use nip44 directly if we have the shared secret.
  // Wait, NDK handles this.


  let sharedKeyHex = '';
  try {
    // Mimic useInventoryKey.ts: Find tag for me: ['p', my_pub, encrypted_key]
    const myTag = keychainEvent.tags.find(t => t[0] === 'p' && t[1] === OWNER_PUBKEY_HEX);
    if (!myTag || !myTag[2]) {
      throw new Error('Owner p-tag not found in keychain');
    }
    const encryptedKey = myTag[2];
    // Decrypt using NDK Signer (NIP-44)
    // We treat the event author (ourselves) as the sender.
    const senderUser = new NDKUser({ pubkey: OWNER_PUBKEY_HEX });
    sharedKeyHex = await ownerNDK.signer.decrypt(senderUser, encryptedKey, 'nip44');

    if (!sharedKeyHex) throw new Error('Decryption returned empty');

    // Check if it's JSON (sometimes wrapped) or raw hex
    // The App calls `hexToBytes(decryptedHex)` later.
    // Our fix_sharing.js puts the RAW HEX in?
    // fix_sharing.js: `const myKeyHex = ...; await signer.encrypt(..., myKeyHex, 'nip44');`
    // So distinct hex string.

    console.log('✅ Owner decrypted shared inventory key.');
  } catch (e) {
    console.error('❌ Failed to decrypt keychain:', e);
    process.exit(1);
  }

  // 1.2 Create Inventory Item Encrypted with Shared Key
  // NOTE: The app encrypts the content using the *sharedKeyHex*. 
  // This is NOT NIP-44 encryption to a pubkey. It's manual encryption using the shared key.
  // Actually, looking at useInventory.ts, it uses `nip44.encrypt(sharedKey, JSON.stringify(item))`
  // Wait, nip44.encrypt takes a conversation key?
  // Let's check how the app does it.
  // useInventory.ts: `const encrypted = await encrypt(JSON.stringify(itemData), sharedKey);`
  // Wait, the app uses a custom `encrypt` function or NDK?
  // `useInventoryKey.ts` -> `encrypt` function using `nip44.v2.encrypt`.

  // We need to replicate that here.
  const itemData = {
    id: crypto.randomUUID(),
    name: TEST_ITEM_NAME,
    category: 'Test',
    quantity: 1,
    unit: 'pcs',
    minQuantity: 0,
    updatedAt: Date.now()
  };

  // Encrypt content using the shared key
  // NIP-44 v2 encrypt(content, key)
  const nonce = crypto.randomBytes(32); // random nonce? No, nip44 handles it.
  // Actually nostr-tools v2 nip44.encrypt(conversationKey, plaintext)
  const conversationKey = new Uint8Array(Buffer.from(sharedKeyHex, 'hex'));
  const encryptedContent = nip44.encrypt(conversationKey, JSON.stringify(itemData));

  const itemEvent = new NDKEvent(ownerNDK);
  itemEvent.kind = INVENTORY_KIND;
  itemEvent.tags = [['d', INVENTORY_D_TAG]];
  itemEvent.content = encryptedContent;
  await itemEvent.publish();
  console.log(`✅ Owner published item: "${TEST_ITEM_NAME}"`);

  console.log('⏳ Waiting 3s for propagation...');
  await new Promise(r => setTimeout(r, 3000));

  // Disconnect Owner
  // ownerNDK.pool.close(); // Keep connected or not? NDK doesn't have a clean disconnect for pool usually needed in script.

  // ---------------------------------------------------------
  // STEP 2: Guest Verifies Item
  // ---------------------------------------------------------
  console.log('\n👤 GUEST ACTION: Verifying visibility...');
  const guestNDK = new NDK({ explicitRelayUrls: RELAYS });
  guestNDK.signer = new NDKPrivateKeySigner(GUEST_PRIVKEY_HEX);
  await guestNDK.connect();

  // 2.1 Fetch Owner's Keychain (Guest is shared on it)
  const guestKeychainEvent = await guestNDK.fetchEvent({
    kinds: [KEYCHAIN_KIND],
    authors: [OWNER_PUBKEY_HEX],
    '#d': [KEYCHAIN_D_TAG]
  });

  if (!guestKeychainEvent) {
    console.error('❌ Guest could not find Owner keychain.');
    process.exit(1);
  }

  // 2.2 Decrypt Shared Key
  let guestSharedKey = '';
  try {
    // Find tag for guest: ['p', guest_pub, encrypted_key]
    // My pubkey (Guest) is derived from signer.
    const guestUser = await guestNDK.signer.user();
    const guestPub = guestUser.pubkey;

    const myTag = guestKeychainEvent.tags.find(t => t[0] === 'p' && t[1] === guestPub);
    if (!myTag || !myTag[2]) {
      // Fallback: check all p tags? No, must match me.
      console.log('Guest Pubkey:', guestPub);
      console.log('Available Tags:', guestKeychainEvent.tags);
      throw new Error('Guest p-tag not found in keychain');
    }

    const encryptedKey = myTag[2];
    const senderUser = new NDKUser({ pubkey: OWNER_PUBKEY_HEX }); // Sender is Owner

    guestSharedKey = await guestNDK.signer.decrypt(senderUser, encryptedKey, 'nip44');

    console.log('✅ Guest decrypted keychain.');

    if (guestSharedKey !== sharedKeyHex) {
      console.error('❌ SHARED KEY MISMATCH!');
      console.error('Owner Key:', sharedKeyHex);
      console.error('Guest Key:', guestSharedKey);
      process.exit(1);
    }

  } catch (e) {
    console.error('⚠️ Guest Decryption failed:', e);
    process.exit(1);
  }

  // 2.3 Fetch and Decrypt Items
  const items = await guestNDK.fetchEvents({
    kinds: [INVENTORY_KIND],
    authors: [OWNER_PUBKEY_HEX],
    '#d': [INVENTORY_D_TAG]
  });

  console.log(`📦 Guest found ${items.size} inventory events from Owner.`);

  let foundTestItem = false;
  for (const event of items) {
    try {
      // Decrypt content using shared key
      const guestKeyBytes = new Uint8Array(Buffer.from(guestSharedKey, 'hex'));
      const content = nip44.decrypt(guestKeyBytes, event.content);
      const item = JSON.parse(content);
      if (item.name === TEST_ITEM_NAME) {
        foundTestItem = true;
        console.log(`✅ FOUND & DECRYPTED: ${item.name}`);
        break;
      }
    } catch (e) {
      console.error('Decryption failed for event', event.id, e.message);
    }
  }

  if (foundTestItem) {
    console.log('\n🎉 SUCCESS: Full Sharing Flow Verified!');
    process.exit(0);
  } else {
    console.error('\n❌ FAILED: Created item not found or could not be decrypted.');
    process.exit(1);
  }
}

runTest().catch(console.error);
