
import { nip19, getPublicKey } from 'nostr-tools';

const OWNER_NSEC = 'nsec1wnqh6y2aqlkygufm90vyjs38d6wcq2qzzh536tshg5u93m0w640shfrm4d';
const GUEST_NSEC = 'nsec1qvqdaxh9zk42msuvlrzxx376a9k73kqc4ugfgjq4sg656tf0dy7syzgmx0';

function debugKey(name, nsec) {
  console.log(`\n--- ${name} ---`);
  try {
    const { type, data } = nip19.decode(nsec);
    console.log(`Type: ${type}`);
    if (type === 'nsec') {
      const privHex = Buffer.from(data).toString('hex');
      console.log(`Private Key Hex: ${privHex}`);
      const pubHex = getPublicKey(data);
      console.log(`Public Key Hex:  ${pubHex}`);
      const npub = nip19.npubEncode(pubHex);
      console.log(`NPUB:            ${npub}`);
    }
  } catch (e) {
    console.error(`Error decoding ${name}:`, e.message);
  }
}

debugKey('OWNER', OWNER_NSEC);
debugKey('GUEST', GUEST_NSEC);
