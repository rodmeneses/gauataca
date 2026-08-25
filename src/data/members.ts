import type { Member } from '../types';

export const MEMBERS: Member[] = [
  {
    id: 'm1', name: 'Rodrigo Alcántara', short: 'Rodrigo', initial: 'RA', role: 'admin',
    title: { es: 'Director musical', en: 'Musical director' }, email: 'rodrigo@dulcetricolor.org', joined: '2023-04-11',
    instruments: [{ n: { es: 'Arpa llanera', en: 'Llanera harp' }, lv: 'expert' }, { n: { es: 'Cuatro', en: 'Cuatro' }, lv: 'inter' }],
    vocals: ['none'],
  },
  {
    id: 'm2', name: 'Caro Betancourt', short: 'Caro', initial: 'CB', role: 'member',
    title: { es: 'Voz principal', en: 'Lead voice' }, email: 'caro@dulcetricolor.org', joined: '2023-04-11',
    instruments: [{ n: { es: 'Voz principal', en: 'Lead vocals' }, lv: 'expert' }, { n: { es: 'Cuatro', en: 'Cuatro' }, lv: 'beg' }],
    vocals: ['lead', 'chorus'],
  },
  {
    id: 'm3', name: 'Diego Salazar', short: 'Diego', initial: 'DS', role: 'admin',
    title: { es: 'Tesorero', en: 'Treasurer' }, email: 'diego@dulcetricolor.org', joined: '2023-06-02',
    instruments: [{ n: { es: 'Cuatro', en: 'Cuatro' }, lv: 'expert' }, { n: { es: 'Guitarra', en: 'Guitar' }, lv: 'inter' }],
    vocals: ['chorus'],
  },
  {
    id: 'm4', name: 'Sofía Uzcátegui', short: 'Sofía', initial: 'SU', role: 'member',
    title: { es: 'Percusión', en: 'Percussion' }, email: 'sofia@dulcetricolor.org', joined: '2024-01-19',
    instruments: [{ n: { es: "Tambores culo'e puya", en: "Culo'e puya drums" }, lv: 'expert' }, { n: { es: 'Furruco', en: 'Furruco' }, lv: 'inter' }],
    vocals: ['chorus'],
  },
  {
    id: 'm5', name: 'Abi Contreras', short: 'Abi', initial: 'AC', role: 'member',
    title: { es: 'Guitarra', en: 'Guitar' }, email: 'abi@dulcetricolor.org', joined: '2024-09-07',
    instruments: [{ n: { es: 'Guitarra', en: 'Guitar' }, lv: 'expert' }, { n: { es: 'Cuatro', en: 'Cuatro' }, lv: 'inter' }],
    vocals: ['chorus'],
  },
];

export function memberById(id: string): Member {
  return MEMBERS.find((m) => m.id === id) ?? MEMBERS[0];
}
