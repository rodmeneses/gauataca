import type { Thread } from '../types';

export const THREADS: Thread[] = [
  {
    id: 'b1', by: 'm2', date: '2026-08-19', votes: 4,
    title: { es: 'Idea: Street Fest de verano en Berkeley', en: 'Idea: Berkeley summer Street Fest' },
    body: { es: 'Postulaciones abren en octubre. Pagan $700 y nos dan puesto de merch. Necesitamos un set de 60 min.', en: 'Applications open in October. $700 plus a merch table. We would need a 60-min set.' },
    comments: [
      { by: 'm1', text: { es: 'Me anoto. Con el set del Festival Latino más tres gaitas llegamos a 60 min.', en: 'I am in. The Festival Latino set plus three gaitas gets us to 60 min.' } },
      { by: 'm3', text: { es: '$700 cubre el estudio de todo el trimestre. Vale la pena.', en: '$700 covers a full quarter of studio time. Worth it.' } },
      { by: 'm4', text: { es: '¿Hay tarima o tocamos en el piso? Cambia el armado de tambores.', en: 'Is there a stage or are we on the ground? Changes the drum setup.' } },
    ],
  },
  {
    id: 'b2', by: 'm5', date: '2026-08-14', votes: 5,
    title: { es: '¿Grabamos un EP de joropo en el garaje?', en: 'Should we record a joropo EP in the garage?' },
    body: { es: 'Cuatro temas, dos fines de semana. Con la mezcladora nueva y los SM58 no gastamos en estudio.', en: 'Four tracks, two weekends. With the new mixer and the SM58s we spend nothing on studio time.' },
    comments: [
      { by: 'm2', text: { es: 'Propongo Pajarillo, Quirpa, Seis por Derecho y Alma Llanera.', en: 'I propose Pajarillo, Quirpa, Seis por Derecho and Alma Llanera.' } },
      { by: 'm1', text: { es: 'El garaje tiene eco. Habría que colgar cobijas.', en: 'The garage has a slap echo. We would need blankets on the walls.' } },
      { by: 'm3', text: { es: 'Mezcla y master por fuera: ~$120 por tema. Hay que presupuestarlo.', en: 'Outside mix and master: ~$120 per track. We need to budget it.' } },
      { by: 'm4', text: { es: 'Los tambores los grabo en el patio, suenan mejor abiertos.', en: 'I would track the drums in the yard, they breathe better outside.' } },
    ],
  },
  {
    id: 'b3', by: 'm1', date: '2026-08-05', votes: 3,
    title: { es: 'Taller de cuatro para niños — Biblioteca de Oakland', en: 'Cuatro workshop for kids — Oakland Library' },
    body: { es: 'La biblioteca ofrece el salón gratis los sábados. No paga, pero nos da visibilidad y lista de correo.', en: 'The library offers the room free on Saturdays. No pay, but visibility and a mailing list.' },
    comments: [
      { by: 'm5', text: { es: 'Yo puedo dar la parte de acordes básicos.', en: 'I can teach the basic chords section.' } },
      { by: 'm2', text: { es: 'Necesitamos cuatros prestados para los niños.', en: 'We would need loaner cuatros for the kids.' } },
    ],
  },
  {
    id: 'b4', by: 'm4', date: '2026-07-30', votes: 2,
    title: { es: 'Comprar un micrófono inalámbrico de repuesto', en: 'Buy a spare wireless microphone' },
    body: { es: 'En Berkeley el cable de Caro se enredó dos veces. Un inalámbrico decente cuesta ~$130.', en: 'Caro’s cable tangled twice in Berkeley. A decent wireless runs ~$130.' },
    comments: [
      { by: 'm3', text: { es: 'Después del Festival Latino el fondo lo aguanta.', en: 'After Festival Latino the pool can absorb it.' } },
    ],
  },
];
