
import { nip19 } from 'nostr-tools';

const unknownHex = '0300de9ae515aaadc38cf8c46347dae96de8d818af1094481582354d2d2f693d';
const guestExpectedHex = 'a1dcc614a3825ee8f8aed07a0aa8ec14077841644ee784c5d73c5179d9738ca0';
const guestNpubString = 'npub1qvqdaxh9zk42msuvlrzxx376a9k73kqc4ugfgjq4sg656tf0dy7sg5r6q6';

try {
  console.log('Unknown Npub:', nip19.npubEncode(unknownHex));
} catch (e) { console.error('Error encoding unknown:', e); }

try {
  const { data } = nip19.decode(guestNpubString);
  console.log('Guest Npub decodes to:', data);
  console.log('Match?', data === guestExpectedHex);
} catch (e) { console.error('Error decoding guest:', e); }

try {
  console.log('Guest Hex encodes to:', nip19.npubEncode(guestExpectedHex));
} catch (e) { console.error('Error encoding guest:', e); }
