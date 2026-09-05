import type { Member } from '../types';

export const MEMBERS: Member[] = [
  {
    id: 'm1', name: 'Rodrigo Alcántara', short: 'Rodrigo', initial: 'RA', role: 'admin',
    title: { es: 'Director musical', en: 'Musical director' }, email: 'rodrigo@guataca.org', joined: '2023-04-11',
    instruments: [{ id: 'arpa', lv: 'expert' }, { id: 'cuatro', lv: 'inter' }],
    vocals: ['none'],
  },
  {
    id: 'm2', name: 'Caro Betancourt', short: 'Caro', initial: 'CB', role: 'member',
    title: { es: 'Voz principal', en: 'Lead voice' }, email: 'caro@guataca.org', joined: '2023-04-11',
    instruments: [{ id: 'voz', lv: 'expert' }, { id: 'cuatro', lv: 'beg' }],
    vocals: ['lead', 'chorus'],
  },
  {
    id: 'm3', name: 'Diego Salazar', short: 'Diego', initial: 'DS', role: 'admin',
    title: { es: 'Tesorero', en: 'Treasurer' }, email: 'diego@guataca.org', joined: '2023-06-02',
    instruments: [{ id: 'cuatro', lv: 'expert' }, { id: 'guitarra', lv: 'inter' }],
    vocals: ['chorus'],
  },
  {
    id: 'm4', name: 'Sofía Uzcátegui', short: 'Sofía', initial: 'SU', role: 'member',
    title: { es: 'Percusión', en: 'Percussion' }, email: 'sofia@guataca.org', joined: '2024-01-19',
    instruments: [{ id: 'tambores', lv: 'expert' }, { id: 'furruco', lv: 'inter' }],
    vocals: ['chorus'],
  },
  {
    id: 'm5', name: 'Abi Contreras', short: 'Abi', initial: 'AC', role: 'member',
    title: { es: 'Guitarra', en: 'Guitar' }, email: 'abi@guataca.org', joined: '2024-09-07',
    instruments: [{ id: 'guitarra', lv: 'expert' }, { id: 'cuatro', lv: 'inter' }],
    vocals: ['chorus'],
  },
];

export function memberById(id: string): Member {
  return MEMBERS.find((m) => m.id === id) ?? MEMBERS[0];
}
