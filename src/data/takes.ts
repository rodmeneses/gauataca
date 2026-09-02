import type { Take } from '../types';

/** Demo recordings: three takes of "Sabana" (s11) in h3, plus singles in h2/h5. */
export const TAKES: Take[] = [
  { id: 'k1', eventId: 'h3', songId: 's11', url: 'https://drive.google.com/file/d/dtv-sabana-take1', n: 1 },
  { id: 'k2', eventId: 'h3', songId: 's11', url: 'https://drive.google.com/file/d/dtv-sabana-take2', n: 2 },
  { id: 'k3', eventId: 'h3', songId: 's11', url: 'https://drive.google.com/file/d/dtv-sabana-take3', n: 3 },
  { id: 'k4', eventId: 'h2', songId: 's4', url: 'https://drive.google.com/file/d/dtv-s4-take1', n: 1 },
  { id: 'k5', eventId: 'h2', songId: 's6', url: 'https://drive.google.com/file/d/dtv-s6-take1', n: 1 },
  { id: 'k6', eventId: 'h5', songId: 's19', url: 'https://drive.google.com/file/d/dtv-s19-take1', n: 1 },
  { id: 'k7', eventId: 'h5', songId: 's20', url: 'https://drive.google.com/file/d/dtv-s20-take1', n: 1 },
];
