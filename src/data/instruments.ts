import type { Instrument } from '../types';

/** Shared instrument catalog: 5 basic + the custom ones the demo band uses. */
export const INSTRUMENTS: Instrument[] = [
  { id: 'cuatro', name: { es: 'Cuatro', en: 'Cuatro' }, isBasic: true },
  { id: 'guitarra', name: { es: 'Guitarra', en: 'Guitar' }, isBasic: true },
  { id: 'bajo', name: { es: 'Bajo', en: 'Bass' }, isBasic: true },
  { id: 'piano', name: { es: 'Piano', en: 'Piano' }, isBasic: true },
  { id: 'percusion', name: { es: 'Percusión', en: 'Percussion' }, isBasic: true },
  { id: 'arpa', name: { es: 'Arpa llanera', en: 'Llanera harp' }, isBasic: false },
  { id: 'voz', name: { es: 'Voz principal', en: 'Lead vocals' }, isBasic: false },
  { id: 'tambores', name: { es: "Tambores culo'e puya", en: "Culo'e puya drums" }, isBasic: false },
  { id: 'furruco', name: { es: 'Furruco', en: 'Furruco' }, isBasic: false },
];
