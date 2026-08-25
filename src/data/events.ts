import type { BandEvent } from '../types';

export const EVENTS: BandEvent[] = [
  {
    id: 'e3', type: 'garage', state: 'active', date: '2026-08-27', time: '16:00',
    title: { es: 'Ensayo en el garaje de Diego', en: "Practice at Diego's garage" },
    venue: 'Hayward, CA', money: 0, setlist: ['s14', 's15', 's16'], attend: 5,
    note: { es: 'Arrancamos la temporada de gaitas temprano este año.', en: 'Starting gaita season early this year.' },
  },
  {
    id: 'e2', type: 'studio', state: 'active', date: '2026-09-02', time: '19:00',
    title: { es: 'Ensayo de estudio — Sonido Sur', en: 'Studio rehearsal — Sonido Sur' },
    venue: 'San Leandro, CA', money: -50, setlist: ['s1', 's9', 's2', 's22'], attend: 4,
    note: { es: 'Repaso del set del Festival Latino. Traer cables propios.', en: 'Run the Festival Latino set. Bring your own cables.' },
  },
  {
    id: 'e1', type: 'gig', state: 'active', date: '2026-09-12', time: '18:30',
    title: { es: 'Festival Latino de Fruitvale', en: 'Fruitvale Latino Festival' },
    venue: 'Fruitvale Plaza, Oakland, CA', money: 600, attend: 5,
    setlist: ['s1', 's9', 's2', 's22', 's13', 's3', 's10', 's6'],
    flyer: 'https://drive.google.com/file/d/dtv-flyer-fruitvale/view',
    note: { es: 'Set de 45 min. Llegar 17:30 para prueba de sonido.', en: '45-min set. Call time 5:30pm for soundcheck.' },
  },
  {
    id: 'e5', type: 'gig', state: 'cancelled', date: '2026-09-19', time: '19:30',
    title: { es: 'Mercado Nocturno de San José', en: 'San José Night Market' },
    venue: 'San José, CA', money: 0, setlist: [], attend: 0,
    note: { es: 'Cancelado: el permiso de vendedores no salió a tiempo.', en: 'Cancelled: vendor permit did not clear in time.' },
  },
  {
    id: 'e4', type: 'gig', state: 'rescheduled', date: '2026-10-04', time: '15:00',
    title: { es: 'Boda Rivas — ceremonia y cóctel', en: 'Rivas wedding — ceremony & cocktail' },
    venue: 'Palo Alto, CA', money: 850, setlist: ['s10', 's12', 's11', 's9'], attend: 4, prevDate: '2026-09-27',
    note: { es: 'Movido una semana por la familia. Set acústico, sin percusión fuerte.', en: 'Moved a week at the family’s request. Acoustic set, light percussion.' },
  },
  {
    id: 'e6', type: 'gig', state: 'active', date: '2026-12-16', time: '19:00',
    title: { es: 'Misa de Aguinaldo — St. Elizabeth', en: 'Misa de Aguinaldo — St. Elizabeth' },
    venue: 'Oakland, CA', money: 300, setlist: ['s14', 's15', 's16', 's17', 's18'], attend: 5,
    note: { es: 'Programa completo de gaitas. Revisar el furruco antes.', en: 'Full gaita program. Service the furruco first.' },
  },

  // ---- history (dates before TODAY 2026-08-25) ----
  {
    id: 'h1', type: 'gig', state: 'active', date: '2026-08-15', time: '17:00',
    title: { es: 'Cierre del Festival de Verano', en: 'Summer Festival closing set' },
    venue: 'Civic Center Park, Berkeley, CA', money: 450, attend: 5,
    setlist: ['s1', 's9', 's2', 's8', 's10'],
    media: [
      { label: { es: 'Álbum compartido de iCloud — fotos', en: 'iCloud shared album — photos' }, url: 'https://www.icloud.com/sharedalbum/dtv-berkeley-2026' },
      { label: { es: 'Carpeta de Drive — video del set', en: 'Drive folder — set video' }, url: 'https://drive.google.com/drive/folders/dtv-berkeley-video' },
    ],
    feedback: {
      sound: 4.2, perf: 4.6, log: 3.4, energy: 4.8, responses: 5,
      well: [
        { by: 'Caro', anon: false, text: { es: 'El público cantó “Alma Llanera” completa. Nunca nos había pasado.', en: 'The crowd sang all of “Alma Llanera”. First time ever.' } },
        { by: null, anon: true, text: { es: 'El arpa se escuchó limpia por primera vez en un evento al aire libre.', en: 'The harp sounded clean outdoors for the first time.' } },
      ],
      improve: [
        { by: 'Diego', anon: false, text: { es: 'Llegamos con 20 min para armar. Necesitamos una hora.', en: 'We only had 20 min to set up. We need a full hour.' } },
        { by: null, anon: true, text: { es: 'Faltó agua y sombra para el equipo.', en: 'No water or shade for the crew.' } },
      ],
      poll: {
        q: { es: '¿Volvemos a tocar en el Festival de Verano el año que viene?', en: 'Should we play the Summer Festival again next year?' },
        options: [
          { label: { es: 'Sí, sin duda', en: 'Yes, definitely' }, v: 4 },
          { label: { es: 'Solo si suben el cachet', en: 'Only for a higher fee' }, v: 1 },
          { label: { es: 'No', en: 'No' }, v: 0 },
        ],
      },
    },
    note: { es: 'Cachet de $450 más propinas. Mejor evento del año hasta ahora.', en: '$450 fee plus tips. Best event of the year so far.' },
  },
  {
    id: 'h2', type: 'garage', state: 'active', date: '2026-08-08', time: '16:00',
    title: { es: 'Ensayo en el garaje de Diego', en: "Practice at Diego's garage" },
    venue: 'Hayward, CA', money: 0, setlist: ['s4', 's6', 's10', 's13', 's22'], attend: 4,
    note: { es: 'Cuatro horas. Cerramos los arreglos de calipso.', en: 'Four hours. Locked the calipso arrangements.' },
  },
  {
    id: 'h3', type: 'studio', state: 'active', date: '2026-07-26', time: '19:00',
    title: { es: 'Ensayo de estudio — Sonido Sur', en: 'Studio rehearsal — Sonido Sur' },
    venue: 'San Leandro, CA', money: -50, setlist: ['s11', 's23'], attend: 3,
    note: { es: 'Solo tres pudieron ir. Grabamos referencia de “Sabana”.', en: 'Only three could make it. Tracked a “Sabana” reference.' },
  },
  {
    id: 'h4', type: 'gig', state: 'active', date: '2026-07-18', time: '12:00',
    title: { es: 'Ashby Flea Market', en: 'Ashby Flea Market' },
    venue: 'Berkeley, CA', money: 86, setlist: ['s3', 's21'], attend: 4,
    media: [{ label: { es: 'Fotos del puesto — Drive', en: 'Booth photos — Drive' }, url: 'https://drive.google.com/drive/folders/dtv-ashby' }],
    note: { es: 'Solo propinas: $86. Buen calentamiento de calle.', en: 'Tips only: $86. Good street warm-up.' },
  },
  {
    id: 'h5', type: 'garage', state: 'active', date: '2026-06-24', time: '16:00',
    title: { es: 'Ensayo en el garaje de Diego', en: "Practice at Diego's garage" },
    venue: 'Hayward, CA', money: 0, setlist: ['s19', 's20'], attend: 5,
    note: { es: 'Sesión dedicada a tambores de Barlovento con Sofía.', en: 'Barlovento drum session led by Sofía.' },
  },
];
