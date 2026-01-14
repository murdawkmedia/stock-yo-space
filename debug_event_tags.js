
import { SimplePool, nip19, getPublicKey } from 'nostr-tools';

// Node 24 has global WebSocket, so this should work without polyfill.

const guestNsec = 'nsec1qvqdaxh9zk42msuvlrzxx376a9k73kqc4ugfgjq4sg656tf0dy7syzgmx0';
const ownerNsec = 'nsec1wnqh6y2aqlkygufm90vyjs38d6wcq2qzzh536tshg5u93m0w640shfrm4d';

const relays = [
  'wss://relay.primal.net',
  'wss://relay.damus.io',
  'wss://nos.lol',
  'wss://relay.snort.social'
];

async function run() {
  try {
    const { data: guestData } = nip19.decode(guestNsec);
    const guestHex = getPublicKey(guestData);
    console.log('Guest Hex:', guestHex);

    const { data: ownerData } = nip19.decode(ownerNsec);
    const ownerHex = getPublicKey(ownerData);
    console.log('Owner Hex:', ownerHex);

    const pool = new SimplePool();

    console.log('Fetching event from relays:', relays);
    const event = await pool.get(relays, {
      kinds: [30078],
      authors: [ownerHex],
      '#d': ['inventory-shares']
    });

    if (event) {
      console.log('Event Found!');
      console.log('Tags:', JSON.stringify(event.tags, null, 2));

      const pTags = event.tags.filter(t => t[0] === 'p');
      const isGuestInTags = pTags.some(t => t[1] === guestHex);
      console.log('Guest in p-tags?', isGuestInTags);
    } else {
      console.log('Event NOT found on any relay.');
    }

    // pool.close(relays); // SimplePool in v2 might not have close() with args or might handle it differently, or process exit will handle it.
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

run();
