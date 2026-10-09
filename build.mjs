// Static site generator for greenrabbit.es. Zero dependencies: `node build.mjs`
// renders dist/ from site.config.mjs, src/ templates below and src/static/.
import { readFile, writeFile, mkdir, rm, cp } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { CLUB, SITE_URL, LEGAL_UPDATED, TODO } from './site.config.mjs';

const ROOT = dirname(new URL(import.meta.url).pathname);
const DIST = join(ROOT, 'dist');
const IMAGES = JSON.parse(await readFile(join(ROOT, 'src/image-manifest.json'), 'utf8'));
const CSS = (await readFile(join(ROOT, 'src/site.css'), 'utf8'))
  .replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s*\n\s*/g, '\n').trim();
const JS = (await readFile(join(ROOT, 'src/site.js'), 'utf8'))
  .replace(/^\s*\/\/.*$/gm, '').replace(/\n\s*\n/g, '\n').trim();
const YEAR = new Date().getFullYear();

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const stripTags = (s) => s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
const abs = (path) => SITE_URL + path;

const A = CLUB.address;
const HOURS = `${CLUB.hours.opens}–${CLUB.hours.closes}`;
const DAYS = [
  ['Mon', 'Monday', 'Lunes', 'Monday'],
  ['Tue', 'Tuesday', 'Martes', 'Tuesday'],
  ['Wed', 'Wednesday', 'Miércoles', 'Wednesday'],
  ['Thu', 'Thursday', 'Jueves', 'Thursday'],
  ['Fri', 'Friday', 'Viernes', 'Friday'],
  ['Sat', 'Saturday', 'Sábado', 'Saturday'],
  ['Sun', 'Sunday', 'Domingo', 'Sunday'],
];
const AGE = CLUB.minAge;
const MAP_EMBED = (lang) =>
  `https://maps.google.com/maps?q=${CLUB.geo.lat},${CLUB.geo.lng}&z=17&hl=${lang}&output=embed`;

/* ---------- icons ---------- */
const STROKE = 'fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"';
const ICONS = {
  instagram: `<svg viewBox="0 0 24 24" ${STROKE} aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.4" cy="6.6" r="1" fill="currentColor" stroke="none"/></svg>`,
  tiktok: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.53.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>`,
  whatsapp: `<svg viewBox="0 0 24 24" ${STROKE} aria-hidden="true"><path d="M20.5 11.6a8.6 8.6 0 0 1-12.7 7.6L3.5 20.5l1.3-4.1a8.6 8.6 0 1 1 15.7-4.8Z"/><path d="M9 8.6c.2 2.6 2.3 4.9 5 5.4l1-1.2 1.9.9c-.2 1-1.1 1.6-2.1 1.5-3.4-.4-6.2-3.2-6.6-6.6-.1-1 .5-1.9 1.5-2.1l.9 1.9Z" stroke-width="1.4"/></svg>`,
  phone: `<svg viewBox="0 0 24 24" ${STROKE} aria-hidden="true"><path d="M5 4h3.5l1.6 4-2.2 1.4a11 11 0 0 0 6.7 6.7l1.4-2.2 4 1.6V19a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z"/></svg>`,
  mail: `<svg viewBox="0 0 24 24" ${STROKE} aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 6 8.5 7 8.5-7"/></svg>`,
  pin: `<svg viewBox="0 0 24 24" ${STROKE} aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/></svg>`,
  clock: `<svg viewBox="0 0 24 24" ${STROKE} aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>`,
  arrow: `<svg viewBox="0 0 24 24" ${STROKE} aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>`,
  map: `<svg viewBox="0 0 24 24" ${STROKE} aria-hidden="true"><path d="m9 4-6 2v14l6-2 6 2 6-2V4l-6 2-6-2Z"/><path d="M9 4v14M15 6v14"/></svg>`,
  heart: `<svg viewBox="0 0 24 24" ${STROKE} aria-hidden="true"><path d="M12 20s-7.5-4.6-7.5-10.2A4.1 4.1 0 0 1 12 7.4a4.1 4.1 0 0 1 7.5 2.4C19.5 15.4 12 20 12 20Z"/></svg>`,
  sprout: `<svg viewBox="0 0 24 24" ${STROKE} aria-hidden="true"><path d="M12 21v-9"/><path d="M12 12C12 8 9 5 5 5c0 4 3 7 7 7Z"/><path d="M12 14.5c0-3.3 2.7-6 6-6 0 3.3-2.7 6-6 6Z"/></svg>`,
  home: `<svg viewBox="0 0 24 24" ${STROKE} aria-hidden="true"><path d="M3.5 11 12 4l8.5 7"/><path d="M6 9.5V20h12V9.5"/><path d="M10 20v-5h4v5"/></svg>`,
  key: `<svg viewBox="0 0 24 24" ${STROKE} aria-hidden="true"><circle cx="8" cy="15" r="4"/><path d="m10.9 12.1 8.6-8.6"/><path d="m16.5 6.5 2.5 2.5M14 9l2 2"/></svg>`,
  idcard: `<svg viewBox="0 0 24 24" ${STROKE} aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2"/><path d="M5.8 16.2c.6-1.4 1.8-2.2 3.2-2.2s2.6.8 3.2 2.2M14.5 10h4M14.5 13.5h3"/></svg>`,
  referral: `<svg viewBox="0 0 24 24" ${STROKE} aria-hidden="true"><circle cx="9" cy="8" r="3.2"/><path d="M3 19.5c.8-3.3 3.2-5.2 6-5.2s5.2 1.9 6 5.2"/><path d="M18.5 8v6M15.5 11h6"/></svg>`,
  approved: `<svg viewBox="0 0 24 24" ${STROKE} aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="m8.4 12.3 2.5 2.5 4.8-5"/></svg>`,
  age: `<svg viewBox="0 0 24 24" ${STROKE} aria-hidden="true"><circle cx="12" cy="12" r="9"/><text x="12" y="15.4" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="9" font-weight="600" fill="currentColor" stroke="none">18</text></svg>`,
  document: `<svg viewBox="0 0 24 24" ${STROKE} aria-hidden="true"><path d="M6.5 3h8l4 4v14h-12Z"/><path d="M14.5 3v4h4M9.5 12h6M9.5 15h6M9.5 18h3.5"/></svg>`,
  no: `<svg viewBox="0 0 24 24" ${STROKE} aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M5.7 5.7l12.6 12.6"/></svg>`,
  scale: `<svg viewBox="0 0 24 24" ${STROKE} aria-hidden="true"><path d="M12 4v16M8 20h8M5 7h14M12 4l0 3"/><path d="M2.5 14a2.5 2.5 0 0 0 5 0L5 7.5Z"/><path d="M16.5 14a2.5 2.5 0 0 0 5 0L19 7.5Z"/></svg>`,
  people: `<svg viewBox="0 0 24 24" ${STROKE} aria-hidden="true"><circle cx="9" cy="8" r="3"/><path d="M3.5 19c.7-3 2.9-4.8 5.5-4.8s4.8 1.8 5.5 4.8"/><path d="M15.8 5.3a3 3 0 0 1 0 5.4M17.6 14.5c1.6.7 2.5 2.2 2.9 4.5"/></svg>`,
  shield: `<svg viewBox="0 0 24 24" ${STROKE} aria-hidden="true"><path d="M12 3 5 6v5.2c0 4.4 2.9 8 7 9.8 4.1-1.8 7-5.4 7-9.8V6Z"/><path d="M12 8.5v4M12 15.5v.3"/></svg>`,
  lock: `<svg viewBox="0 0 24 24" ${STROKE} aria-hidden="true"><rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5M12 14.5v2.5"/></svg>`,
  car: `<svg viewBox="0 0 24 24" ${STROKE} aria-hidden="true"><path d="M4 15.5v-3.2L6 7.6A2 2 0 0 1 7.8 6.4h8.4A2 2 0 0 1 18 7.6l2 4.7v3.2"/><rect x="3" y="12.3" width="18" height="5.2" rx="1.6"/><path d="M6.5 17.5v2M17.5 17.5v2M6.5 15h1.5M16 15h1.5"/></svg>`,
  calendar: `<svg viewBox="0 0 24 24" ${STROKE} aria-hidden="true"><rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M8.5 3v4M15.5 3v4"/></svg>`,
  info: `<svg viewBox="0 0 24 24" ${STROKE} aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.8v.4"/></svg>`,
  chat: `<svg viewBox="0 0 24 24" ${STROKE} aria-hidden="true"><path d="M20 12.5a7.5 7.5 0 0 1-11 6.6L4 20l1.1-4.2A7.5 7.5 0 1 1 20 12.5Z"/><path d="M9 11h6M9 14h4"/></svg>`,
};
const icon = (name) => ICONS[name];

/* ---------- images ---------- */
function srcset(slug, ext) {
  return IMAGES[slug].widths.map((w) => `/assets/img/${slug}-${w}.${ext} ${w}w`).join(', ');
}
function picture(slug, { alt, sizes, eager = false }) {
  const { widths, ratio } = IMAGES[slug];
  const max = widths.at(-1);
  const fallback = widths[Math.min(1, widths.length - 1)];
  const loading = eager ? 'fetchpriority="high" decoding="async"' : 'loading="lazy" decoding="async"';
  return `<picture><source type="image/avif" srcset="${srcset(slug, 'avif')}" sizes="${sizes}"><source type="image/webp" srcset="${srcset(slug, 'webp')}" sizes="${sizes}"><img src="/assets/img/${slug}-${fallback}.jpg" srcset="${srcset(slug, 'jpg')}" sizes="${sizes}" width="${max}" height="${Math.round(max * ratio)}" alt="${esc(alt)}" ${loading}></picture>`;
}
const LOGO = (size, alt = '', eager = false) =>
  `<img src="/assets/img/logo-${size <= 52 ? 96 : size <= 96 ? 192 : 384}.webp" width="${size}" height="${size}" alt="${esc(alt)}"${eager ? '' : ' loading="lazy"'} decoding="async">`;

/* ---------- copy ---------- */
const T = {
  es: {
    lang: 'es', locale: 'es_ES', altLocale: 'en_GB', path: '/', altPath: '/en/',
    title: 'Green Rabbit | Cannabis Social Club Calpe · Club Cannábico',
    description: `Green Rabbit, asociación cannábica privada en Calpe (Alicante). Cannabis social club solo para socios mayores de ${AGE} años: admisión, horario y ubicación.`,
    ogAlt: 'Logotipo de Green Rabbit, Cannabis Social Club en Calpe, sobre una imagen ilustrativa de una zona lounge',
    skip: 'Saltar al contenido',
    nav: [['about', 'La asociación'], ['membership', 'Membresía'], ['how-it-works', 'Cómo funciona'], ['location', 'Ubicación'], ['faq', 'FAQ']],
    navLabel: 'Navegación principal',
    menu: 'Menú',
    illustrative: 'Imagen ilustrativa',
    langLabel: 'Idioma',
    home: 'Inicio',
    gate: {
      title: `¿Tienes ${AGE} años o más?`,
      text: `Este sitio informa sobre una asociación cannábica privada y está dirigido exclusivamente a personas mayores de ${AGE} años.`,
      yes: `Sí, tengo ${AGE} o más`, no: 'No',
      deniedTitle: 'Lo sentimos',
      deniedText: `Este sitio es solo para personas mayores de ${AGE} años.`,
      back: 'Volver',
    },
    hero: {
      eyebrow: 'Asociación cannábica · Calp, Alicante',
      h1: 'Cannabis Social Club en Calpe',
      sub: `Asociación privada sin ánimo de lucro. Solo socios, mayores de ${AGE} años.`,
      cta1: 'Cómo hacerse socio', cta2: 'Ubicación y horario',
      mapsLink: 'Ver la ficha en Google Maps',
      rating: 'en Google',
      ratingLabel: (r) => `Valoración ${r.replace('.', ',')} de 5 en Google. Ver la ficha en Google Maps`,
      alt: 'Zona lounge con sofás, luz cálida y pantalla de proyección (imagen ilustrativa)',
    },
    quick: { address: 'Dirección', hours: 'Horario para socios', daily: 'Todos los días', directions: 'Cómo llegar' },
    about: {
      eyebrow: 'La asociación',
      h2: 'Qué es un club social de cannabis en Calpe',
      lead: 'Green Rabbit es una asociación privada y sin ánimo de lucro, inscrita en el Registro de Asociaciones de la Comunitat Valenciana.',
      body: 'Reúne a personas adultas que ya son consumidoras de cannabis y que han decidido organizarse de forma responsable, privada y dentro del marco asociativo.',
      notTitle: 'Lo que no somos',
      nots: [
        ['no', 'No somos una tienda, un bar ni un coffee shop'],
        ['no', 'No hay venta al público'],
        ['no', 'Sin visitantes de paso ni acceso turístico o puntual'],
        ['key', 'El local está reservado a los socios'],
      ],
      pillarIcons: ['heart', 'sprout', 'home', 'key'],
      pillars: [
        ['Sin ánimo de lucro', 'Las aportaciones de los socios se destinan únicamente a sostener la actividad de la asociación.'],
        ['Cultivo compartido', 'Un modelo de autoabastecimiento colectivo, en circuito cerrado y pensado solo para socios adultos.'],
        ['Consumo solo en el local', 'El consumo se realiza exclusivamente dentro de nuestras instalaciones privadas, nunca en la vía pública.'],
        ['Solo socios', 'Sin venta, sin acceso para turistas y sin compras de paso. Para entrar hay que ser socio.'],
      ],
      spaceEyebrow: 'El espacio',
      spaceH2: 'Un club social en el centro de Calp',
      spaceLead: 'Un local amplio y cuidado para desconectar, trabajar con calma o compartir la tarde con otros socios.',
      imagesNote: 'Imágenes ilustrativas: no muestran el interior real del local.',
      space: [
        ['hero-lounge', 'Salón lounge', 'Sofás amplios, luz cálida y una gran pantalla para ver cine, deporte o simplemente charlar.', 'Personas conversando en una zona lounge con sofás y pantalla de proyección (imagen ilustrativa)'],
        ['bar', 'Barra y rincón de café', 'Una barra con taburetes que hace de punto de encuentro del club.', 'Barra con taburetes y zona de café (imagen ilustrativa)'],
        ['games-room', 'Sala de juegos', 'Consolas, pantallas y sillones para partidas entre socios.', 'Sala de juegos con consolas y proyector (imagen ilustrativa)'],
        ['board-games', 'Juegos de mesa', 'Cartas y juegos de mesa para las tardes en grupo.', 'Grupo de personas jugando a un juego de mesa (imagen ilustrativa)'],
        ['workspace', 'Rincón tranquilo', 'Mesas cómodas y buena luz para leer o trabajar con el portátil.', 'Persona trabajando con un portátil en una zona tranquila (imagen ilustrativa)'],
        ['cinema', 'Cine y eventos', 'Sesiones de cine, retransmisiones y eventos internos para socios.', 'Sesión de cine frente a una pantalla grande (imagen ilustrativa)'],
      ],
    },
    membership: {
      eyebrow: 'Membresía',
      h2: 'Cómo hacerse socio del club cannábico en Calpe',
      lead: 'La admisión es solo por referencia de un socio actual y requiere la aprobación de la asociación.',
      chips: ['No es inmediata', 'Sin pases de un día', 'Sin membresías temporales'],
      steps: [
        ['Identificación', 'Para iniciar la solicitud debes identificarte con tu DNI, NIE o pasaporte en vigor. Comprobamos tu identidad y tu edad.'],
        ['Solicitud con aval de un socio', 'Rellenas la solicitud de admisión. Tu solicitud debe estar avalada por una persona que ya sea socia de la asociación.'],
        ['Aprobación por la asociación', 'La asociación estudia cada solicitud con calma; la admisión nunca es inmediata. Solo si se aprueba quedas inscrito como socio, y a partir de entonces puedes acceder al local.'],
      ],
      reqTitle: 'Requisitos',
      reqs: [
        ['age', `Tener ${AGE} años o más`],
        ['idcard', 'Documento de identidad válido: DNI, NIE o pasaporte'],
        ['referral', 'Aval de un socio actual de la asociación'],
        ['document', 'Aceptar los estatutos y respetar las normas de la casa'],
      ],
      contactTitle: '¿Dudas sobre la admisión?',
      contact: 'Escríbenos por WhatsApp o por correo electrónico.',
    },
    law: {
      eyebrow: 'Marco legal',
      h2: 'Cómo funciona un club de cannabis en España',
      lead: 'Un resumen informativo del marco en el que operan las asociaciones cannábicas.',
      items: [
        ['Consumo privado', 'El consumo privado entre adultos no es delito', 'En España, el consumo personal de cannabis por parte de adultos en el ámbito privado no está tipificado como delito en el Código Penal.'],
        ['LO 1/2002', 'Derecho de asociación', 'Las asociaciones se constituyen al amparo de la Ley Orgánica 1/2002, reguladora del derecho de asociación, y se inscriben en el registro autonómico correspondiente.'],
        ['LO 4/2015', 'Consumo en la vía pública', 'El consumo y la tenencia en lugares públicos se sancionan como infracción administrativa grave según la Ley Orgánica 4/2015, de protección de la seguridad ciudadana.'],
        ['Nuestro modelo', 'Circuito cerrado', 'Sin venta al público y sin publicidad. Solo socios mayores de edad, con consumo exclusivamente dentro del local.'],
      ],
      disclaimer: 'Información general y divulgativa. No constituye asesoramiento jurídico.',
    },
    location: {
      eyebrow: 'Ubicación y horario',
      h2: 'Dónde estamos en Calpe',
      lead: 'En el centro de Calp, a pocos pasos del paseo marítimo. Acceso exclusivo para socios.',
      byCar: 'En coche',
      travel: [['Altea · Benissa', '10–15 min'], ['Moraira', 'unos 20 min'], ['Benidorm', 'unos 25 min']],
      hoursSummary: 'Todos los días',
      hoursMore: 'Ver horario por días',
      address: 'Dirección', hours: 'Horario de apertura (socios)', contact: 'Contacto',
      directions: 'Cómo llegar',
      days: 'Día', time: 'Horario',
      mapAlt: 'Mapa de la ubicación de Green Rabbit en Carrer de Joan de Garay, Calp',
      mapLoad: 'Cargar Google Maps',
      mapNote: 'Al cargar el mapa se conectará con Google, que puede usar cookies. Más información en la <a href="/cookies/">política de cookies</a>.',
      mapTitle: 'Mapa de Google con la ubicación de Green Rabbit en Calpe',
    },
    faqTitle: 'Preguntas frecuentes sobre el cannabis en Calpe',
    faqEyebrow: 'FAQ',
    faq: [
      ['¿Pueden hacerse socios los turistas?',
        '<p>No ofrecemos acceso a turistas ni a visitantes de paso. No hay acceso inmediato, pases de un día ni membresías temporales. La admisión es solo por referencia de un socio actual y requiere la aprobación de la asociación, que estudia cada solicitud según sus estatutos. Sin el aval de un socio no es posible solicitarla.</p>'],
      ['¿Es legal el cannabis en Calpe y en España?',
        '<p>El consumo privado por parte de adultos no es delito en España. La venta y el tráfico sí están prohibidos, y el consumo o la tenencia en la vía pública se sancionan administrativamente (Ley Orgánica 4/2015). Las asociaciones cannábicas funcionan como entidades privadas sin ánimo de lucro bajo el derecho de asociación. En Calpe rigen las mismas normas que en el resto del país.</p>'],
      ['¿Se puede comprar marihuana en Calpe?',
        '<p>No. En España no existe venta legal de cannabis, ni en Calpe ni en ningún otro sitio. Las asociaciones como Green Rabbit son privadas y solo para socios: no venden al público, no atienden compras de paso y no hacen envíos.</p>'],
      ['¿Qué necesito para hacerme socio?',
        `<p>Tener ${AGE} años o más, identificarte con tu DNI, NIE o pasaporte en vigor, contar con el aval de un socio actual y rellenar la solicitud de admisión. La asociación estudia cada solicitud y comunica su decisión; la admisión no es inmediata. <a href="#membership">Ver los tres pasos</a>.</p>`],
      ['¿Cuál es la edad mínima?',
        `<p>${AGE} años. Comprobamos la edad con un documento oficial en vigor antes de tramitar cualquier solicitud.</p>`],
      ['¿Dónde estáis y qué horario tenéis?',
        `<p>Estamos en ${A.street}, ${A.postalCode} ${A.localityDisplay}, ${A.province}. El horario de apertura para socios es todos los días de ${HOURS}. <a href="${esc(CLUB.mapsUrl)}" rel="noopener" target="_blank">Abrir en Google Maps</a>.</p>`],
      ['¿Puedo consumir fuera del club?',
        '<p>Las normas de la asociación establecen que el consumo se realiza únicamente dentro del local. Fuera, el consumo en la vía pública está sancionado por la Ley Orgánica 4/2015. Pedimos a todos los socios respeto por los vecinos y por el entorno.</p>'],
      ['¿Estáis cerca de Altea, Benidorm o Moraira?',
        '<p>Estamos en el centro de Calp, en la Costa Blanca: a unos 25 minutos de Benidorm, a 10–15 minutos de Altea y Benissa y a unos 20 minutos de Moraira. El proceso de admisión es el mismo para todos, vengas de donde vengas: por referencia de un socio y con aprobación de la asociación.</p>'],
    ],
    footer: {
      visit: 'Dirección', contact: 'Contacto', follow: 'Síguenos',
      registry: `Inscrita en el ${CLUB.registry.name} con el <span class="nowrap">n.º ${CLUB.registry.number}</span>.`,
      daily: 'Todos los días',
      note: `Asociación privada sin ánimo de lucro. Este sitio tiene carácter informativo y no promueve ni publicita el consumo de cannabis. Acceso al local solo para socios mayores de ${AGE} años.`,
      legal: [['/aviso-legal/', 'Aviso legal'], ['/privacidad/', 'Política de privacidad'], ['/cookies/', 'Política de cookies']],
      rights: 'Todos los derechos reservados.',
    },
    alt2: 'Zona de descanso con sofás e iluminación cálida (imagen ilustrativa)',
    social: { instagram: 'Green Rabbit en Instagram', tiktok: 'Green Rabbit en TikTok', whatsapp: 'Escribir por WhatsApp' },
  },

  en: {
    lang: 'en', locale: 'en_GB', altLocale: 'es_ES', path: '/en/', altPath: '/',
    title: 'Green Rabbit | Cannabis Social Club in Calpe · Members Only',
    description: `Green Rabbit is a private cannabis social club in Calpe, Costa Blanca. Members only, ${AGE}+. How membership works, opening hours, location and FAQ.`,
    ogAlt: 'Green Rabbit Cannabis Social Club in Calpe logo over an illustrative image of a lounge area',
    skip: 'Skip to content',
    nav: [['about', 'About'], ['membership', 'Membership'], ['how-it-works', 'How it works'], ['location', 'Location'], ['faq', 'FAQ']],
    navLabel: 'Main navigation',
    menu: 'Menu',
    illustrative: 'Illustrative image',
    langLabel: 'Language',
    home: 'Home',
    gate: {
      title: `Are you ${AGE} or over?`,
      text: `This website provides information about a private cannabis association and is intended only for adults aged ${AGE} and over.`,
      yes: `Yes, I'm ${AGE} or over`, no: 'No',
      deniedTitle: 'Sorry',
      deniedText: `This website is only for people aged ${AGE} and over.`,
      back: 'Go back',
    },
    hero: {
      eyebrow: 'Cannabis association · Calp, Alicante',
      h1: 'Cannabis Social Club in Calpe',
      sub: `A private, non-profit association. Members only, aged ${AGE} and over.`,
      cta1: 'How to become a member', cta2: 'Location & hours',
      mapsLink: 'View our Google Maps listing',
      rating: 'on Google',
      ratingLabel: (r) => `Rated ${r} out of 5 on Google. View the listing on Google Maps`,
      alt: 'Lounge area with sofas, warm light and a projection screen (illustrative image)',
    },
    quick: { address: 'Address', hours: 'Hours (members)', daily: 'Every day', directions: 'Get directions' },
    about: {
      eyebrow: 'The association',
      h2: 'What a cannabis social club in Calpe is',
      lead: 'Green Rabbit is a private, non-profit association registered with the Associations Registry of the Valencian Community.',
      body: 'It brings together adults who already use cannabis and have chosen to organise themselves responsibly, privately and within the legal framework for associations.',
      notTitle: 'What we are not',
      nots: [
        ['no', 'Not a shop, a bar or a coffee shop'],
        ['no', 'No sale to the public'],
        ['no', 'No walk-in service and no tourist or one-off access'],
        ['key', 'The premises are for members only'],
      ],
      pillarIcons: ['heart', 'sprout', 'home', 'key'],
      pillars: [
        ['Non-profit', "Members' contributions go solely towards running the association."],
        ['Shared cultivation', 'A collective, closed-circuit self-supply model intended only for adult members.'],
        ['Consumption on site only', 'Consumption takes place exclusively inside our private premises, never in public.'],
        ['Members only', 'No sales, no tourist access and no walk-in purchases. You have to be a member to come in.'],
      ],
      spaceEyebrow: 'The space',
      spaceH2: 'A social club in the centre of Calp',
      spaceLead: 'A spacious, carefully designed place to unwind, work in peace or spend the afternoon with other members.',
      imagesNote: 'Illustrative images: they do not show the actual premises.',
      space: [
        ['hero-lounge', 'Lounge', 'Deep sofas, warm light and a big screen for films, sport or simply talking.', 'People chatting in a lounge area with sofas and a projection screen (illustrative image)'],
        ['bar', 'Bar & coffee corner', "A counter with stools that's the club's natural meeting point.", 'Bar counter with stools and a coffee area (illustrative image)'],
        ['games-room', 'Games room', 'Consoles, screens and armchairs for games between members.', 'Games room with consoles and a projector (illustrative image)'],
        ['board-games', 'Board games', 'Cards and board games for afternoons in good company.', 'Group of people playing a board game (illustrative image)'],
        ['workspace', 'Quiet corner', 'Comfortable tables and good light for reading or working on a laptop.', 'Person working on a laptop in a quiet area (illustrative image)'],
        ['cinema', 'Film nights & events', 'Film screenings, live broadcasts and members-only events.', 'Film screening in front of a big screen (illustrative image)'],
      ],
    },
    membership: {
      eyebrow: 'Membership',
      h2: 'How to join our cannabis club in Calpe',
      lead: 'Membership is by referral from an existing member only and requires approval by the association.',
      chips: ['Never immediate', 'No day passes', 'No temporary memberships'],
      steps: [
        ['Identification', 'To start an application you need to identify yourself with a valid DNI, NIE or passport. We check your identity and age.'],
        ['Application endorsed by a member', 'Fill in the membership application. It must be endorsed by someone who is already a member of the association.'],
        ['Approval by the association', 'The association reviews every application carefully; admission is never immediate. Only once it is approved are you registered as a member and able to access the premises.'],
      ],
      reqTitle: 'Requirements',
      reqs: [
        ['age', `Aged ${AGE} or over`],
        ['idcard', 'Valid ID: DNI, NIE or passport'],
        ['referral', 'Endorsement from a current member of the association'],
        ['document', 'Agreement to the statutes and respect for the house rules'],
      ],
      contactTitle: 'Questions about membership?',
      contact: 'Message us on WhatsApp or by email.',
    },
    law: {
      eyebrow: 'Legal framework',
      h2: 'How cannabis clubs work in Spain',
      lead: 'A short, factual overview of the framework cannabis associations operate in.',
      items: [
        ['Private use', 'Private use by adults is not a crime', 'In Spain, personal cannabis use by adults in a private setting is not classed as a criminal offence under the Criminal Code.'],
        ['LO 1/2002', 'Right of association', 'Associations are formed under Organic Law 1/2002 on the right of association and are entered in the relevant regional registry.'],
        ['LO 4/2015', 'Use in public places', 'Consumption and possession in public places are punishable as a serious administrative offence under Organic Law 4/2015 on public safety.'],
        ['Our model', 'Closed circuit', 'No public sales and no advertising. Adult members only, with consumption exclusively on the premises.'],
      ],
      disclaimer: 'General information only. This is not legal advice.',
    },
    location: {
      eyebrow: 'Location & hours',
      h2: 'Where to find us in Calpe',
      lead: 'In the centre of Calp, a short walk from the seafront promenade. Access for members only.',
      byCar: 'By car',
      travel: [['Altea · Benissa', '10–15 min'], ['Moraira', 'around 20 min'], ['Benidorm', 'about 25 min']],
      hoursSummary: 'Every day',
      hoursMore: 'See daily hours',
      address: 'Address', hours: 'Opening hours (members)', contact: 'Contact',
      directions: 'Get directions',
      days: 'Day', time: 'Hours',
      mapAlt: 'Map showing Green Rabbit on Carrer de Joan de Garay, Calp',
      mapLoad: 'Load Google Maps',
      mapNote: 'Loading the map connects to Google, which may set cookies. See our <a href="/cookies/">cookie policy</a> (in Spanish).',
      mapTitle: 'Google map showing Green Rabbit in Calpe',
    },
    faqTitle: 'Frequently asked questions about cannabis in Calpe',
    faqEyebrow: 'FAQ',
    faq: [
      ['Can tourists join?',
        "<p>We don't offer access to tourists or passing visitors. There is no immediate access, no day pass and no temporary membership. Membership is by referral from a current member only and requires approval by the association, which reviews each application under its statutes. Without a member's endorsement it isn't possible to apply.</p>"],
      ['Is cannabis legal in Calpe and in Spain?',
        '<p>Private use by adults is not a crime in Spain. Selling and trafficking are prohibited, and consumption or possession in public places is subject to administrative fines (Organic Law 4/2015). Cannabis associations operate as private, non-profit organisations under the right of association. The same rules apply in Calpe as in the rest of Spain.</p>'],
      ['Can I buy weed in Calpe?',
        "<p>No. There is no legal sale of cannabis in Spain, in Calpe or anywhere else. Associations like Green Rabbit are private and members-only: they don't sell to the public, don't serve walk-in customers and don't deliver.</p>"],
      ['What do I need to join?',
        `<p>You need to be ${AGE} or over, identify yourself with a valid DNI, NIE or passport, be endorsed by a current member and fill in the membership application. The association reviews every application and lets you know its decision; admission is not immediate. <a href="#membership">See the three steps</a>.</p>`],
      ['What is the minimum age?',
        `<p>${AGE}. We check age against a valid official ID before processing any application.</p>`],
      ['Where are you and when are you open?',
        `<p>You'll find us at ${A.street}, ${A.postalCode} ${A.localityDisplay}, ${A.province}, Spain. Opening hours for members are every day, ${HOURS}. <a href="${esc(CLUB.mapsUrl)}" rel="noopener" target="_blank">Open in Google Maps</a>.</p>`],
      ['Can I consume outside the club?',
        "<p>The association's rules say consumption takes place only inside the premises. Outside, consumption in public places is sanctioned under Organic Law 4/2015. We ask all members to respect our neighbours and the area.</p>"],
      ['Are you near Altea, Benidorm or Moraira?',
        "<p>We're in the centre of Calp on the Costa Blanca: about 25 minutes from Benidorm, 10–15 minutes from Altea and Benissa, and around 20 minutes from Moraira. The membership process is the same for everyone, wherever you're coming from: by referral from a member and with approval by the association.</p>"],
    ],
    footer: {
      visit: 'Address', contact: 'Contact', follow: 'Follow',
      registry: `Registered with the ${CLUB.registry.name}, <span class="nowrap">no. ${CLUB.registry.number}</span>.`,
      daily: 'Every day',
      note: `Private, non-profit association. This website is for information only and does not promote or advertise cannabis use. Entry to the premises is for members aged ${AGE} and over only.`,
      legal: [['/aviso-legal/', 'Legal notice (ES)'], ['/privacidad/', 'Privacy policy (ES)'], ['/cookies/', 'Cookie policy (ES)']],
      rights: 'All rights reserved.',
    },
    alt2: 'Relaxation area with sofas and warm lighting (illustrative image)',
    social: { instagram: 'Green Rabbit on Instagram', tiktok: 'Green Rabbit on TikTok', whatsapp: 'Message us on WhatsApp' },
  },
};

/* ---------- structured data ---------- */
function orgSchema(t) {
  return {
    '@type': ['Organization', 'LocalBusiness'],
    '@id': abs('/#organization'),
    name: CLUB.brandName,
    legalName: CLUB.legalName,
    alternateName: CLUB.shortName,
    taxID: CLUB.cif,
    description: t.description,
    url: abs('/'),
    logo: { '@type': 'ImageObject', url: abs('/assets/img/logo-512.png'), width: 512, height: 512 },
    image: abs('/assets/img/logo-512.png'),
    telephone: CLUB.phone,
    email: CLUB.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: A.street,
      addressLocality: A.locality,
      addressRegion: A.province,
      postalCode: A.postalCode,
      addressCountry: A.country,
    },
    geo: { '@type': 'GeoCoordinates', latitude: CLUB.geo.lat, longitude: CLUB.geo.lng },
    openingHoursSpecification: [{
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: DAYS.map((d) => d[1]),
      opens: CLUB.hours.opens,
      closes: CLUB.hours.closes,
    }],
    hasMap: CLUB.mapsUrl,
    sameAs: [CLUB.instagram, CLUB.tiktok, CLUB.mapsUrl],
  };
}

function homeSchema(t) {
  const pageUrl = abs(t.path);
  return {
    '@context': 'https://schema.org',
    '@graph': [
      orgSchema(t),
      {
        '@type': 'WebSite',
        '@id': abs('/#website'),
        url: abs('/'),
        name: CLUB.brandName,
        inLanguage: ['es', 'en'],
        publisher: { '@id': abs('/#organization') },
      },
      {
        '@type': 'FAQPage',
        '@id': `${pageUrl}#faq`,
        url: pageUrl,
        inLanguage: t.lang,
        mainEntity: t.faq.map(([q, a]) => ({
          '@type': 'Question',
          name: q,
          acceptedAnswer: { '@type': 'Answer', text: stripTags(a) },
        })),
      },
    ],
  };
}

const jsonld = (obj) => `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, '\\u003c')}</script>`;

/* ---------- shared chrome ---------- */
// The hero image is full-bleed at every width.
const HERO_SIZES = '100vw';

function head({ t, title, description, path, alternates, schema, preloadHero = false, noindex = false, gate = false }) {
  const url = abs(path);
  const hreflang = alternates
    ? alternates.map(([l, p]) => `<link rel="alternate" hreflang="${l}" href="${abs(p)}">`).join('\n')
    : '';
  const heroPreload = preloadHero
    ? `<link rel="preload" as="image" type="image/avif" imagesrcset="${srcset('lounge', 'avif')}" imagesizes="${HERO_SIZES}" fetchpriority="high">`
    : '';
  const gateCheck = gate
    ? `;try{if(localStorage.getItem('gr-age-ok')!=='1')d.classList.add('age-pending')}catch(e){d.classList.add('age-pending')}`
    : '';
  return `<!DOCTYPE html>
<html lang="${t.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
${noindex ? '<meta name="robots" content="noindex, follow">' : '<meta name="robots" content="index, follow, max-image-preview:large">'}
<link rel="canonical" href="${url}">
${hreflang}
<script>var d=document.documentElement;d.classList.add('js')${gateCheck}</script>
<link rel="preload" href="/assets/fonts/cormorant-500.woff2" as="font" type="font/woff2" crossorigin>
${heroPreload}
<style>${CSS}</style>
<meta name="theme-color" content="#f8f6f1">
<link rel="icon" href="/favicon.ico" sizes="48x48">
<link rel="icon" href="/favicon-32.png" type="image/png" sizes="32x32">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<meta name="geo.region" content="${A.regionCode}">
<meta name="geo.placename" content="${A.locality}">
<meta name="geo.position" content="${CLUB.geo.lat};${CLUB.geo.lng}">
<meta name="ICBM" content="${CLUB.geo.lat}, ${CLUB.geo.lng}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(CLUB.brandName)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${abs('/og-image.jpg')}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(t.ogAlt)}">
<meta property="og:locale" content="${t.locale}">
<meta property="og:locale:alternate" content="${t.altLocale}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${abs('/og-image.jpg')}">
<meta name="twitter:image:alt" content="${esc(t.ogAlt)}">
${schema ? jsonld(schema) : ''}
</head>`;
}

function socialLinks(t) {
  return `<a class="icon-link" href="${CLUB.instagram}" rel="noopener" target="_blank" aria-label="${esc(t.social.instagram)}">${ICONS.instagram}</a>
<a class="icon-link" href="${CLUB.tiktok}" rel="noopener" target="_blank" aria-label="${esc(t.social.tiktok)}">${ICONS.tiktok}</a>`;
}

function header(t, { onHome, langPaths }) {
  const base = onHome ? '' : t.path;
  const [esPath, enPath] = langPaths;
  const langItem = (code, label, path) =>
    code === t.lang
      ? `<span aria-current="true" lang="${code}">${label}<span class="visually-hidden"> (${code === 'es' ? 'idioma actual' : 'current language'})</span></span>`
      : `<a href="${path}" hreflang="${code}" lang="${code}">${label}<span class="visually-hidden"> ${code === 'es' ? '(Español)' : '(English)'}</span></a>`;
  return `<a class="skip-link" href="#main">${t.skip}</a>
<header class="site-header">
<div class="wrap header-row">
<a class="brand" href="${t.path}" aria-label="${esc(CLUB.shortName)} – ${t.home}">${LOGO(44, '', true)}<span>${CLUB.shortName}</span></a>
<nav class="site-nav" aria-label="${t.navLabel}" id="site-nav">
<ul>
${t.nav.map(([id, label]) => `<li><a href="${base}#${id}">${label}</a></li>`).join('\n')}
</ul>
<div class="nav-social">${socialLinks(t)}</div>
</nav>
<div class="lang-switch" role="group" aria-label="${t.langLabel}">${langItem('es', 'ES', esPath)}<span class="sep" aria-hidden="true"></span>${langItem('en', 'EN', enPath)}</div>
<div class="header-social">${socialLinks(t)}</div>
<button class="menu-toggle" type="button" data-menu-toggle aria-expanded="false" aria-controls="site-nav" aria-label="${t.menu}"><span class="menu-icon" aria-hidden="true"><span></span></span><span class="menu-label" aria-hidden="true">${t.menu}</span></button>
</div>
</header>`;
}

function footer(t) {
  const f = t.footer;
  return `<footer class="site-footer">
<div class="wrap">
<div class="footer-grid">
<div class="footer-brand">
${LOGO(56, CLUB.shortName)}
<p><strong>${CLUB.legalName}</strong></p>
<p class="footer-legal-id">CIF ${CLUB.cif}</p>
<p class="footer-legal-id">${f.registry}</p>
</div>
<div>
<h2>${f.visit}</h2>
<address>${A.street}<br>${A.postalCode} ${A.localityDisplay}, ${A.province}<br>${A.countryName[t.lang]}</address>
<p class="footer-hours">${f.daily}: ${HOURS}</p>
</div>
<div>
<h2>${f.contact}</h2>
<ul class="footer-links">
<li><a href="tel:${CLUB.phone}">${CLUB.phoneDisplay}</a></li>
<li><a href="mailto:${CLUB.email}">${CLUB.email}</a></li>
<li><a href="${CLUB.whatsapp}" rel="noopener" target="_blank">WhatsApp</a></li>
</ul>
<div class="footer-social">${socialLinks(t)}</div>
</div>
</div>
<p class="note footer-note">${f.note}</p>
<div class="footer-bottom">
<p>© ${YEAR} ${CLUB.legalName}. ${f.rights}</p>
<ul>${f.legal.map(([href, label]) => `<li><a href="${href}">${label}</a></li>`).join('')}</ul>
</div>
</div>
</footer>`;
}

function ageGate(t) {
  const g = t.gate;
  return `<div class="age-gate" id="age-gate" role="dialog" aria-modal="true" aria-labelledby="age-title" aria-describedby="age-text">
<div class="age-card">
${LOGO(80, '', true)}
<div class="age-ask">
<h2 id="age-title">${g.title}</h2>
<p id="age-text">${g.text}</p>
<div class="age-actions">
<button class="btn btn-primary" type="button" data-age-yes>${g.yes}</button>
<button class="btn btn-secondary" type="button" data-age-no>${g.no}</button>
</div>
</div>
<div class="age-denied" aria-live="polite">
<h2>${g.deniedTitle}</h2>
<p>${g.deniedText}</p>
<button class="btn btn-secondary" type="button" data-age-back>${g.back}</button>
</div>
</div>
</div>`;
}

/* ---------- home page ---------- */
function homePage(t) {
  const h = t.hero, ab = t.about, m = t.membership, law = t.law, loc = t.location, q = t.quick;
  const mapsAttrs = `href="${esc(CLUB.mapsUrl)}" rel="noopener" target="_blank"`;
  const directionsBtn = (label) => `<a class="btn btn-primary" ${mapsAttrs}>${ICONS.map}${label}</a>`;
  // The Google rating is only shown when verified in site.config.mjs; otherwise a neutral link.
  const rating = CLUB.googleRating;
  const googleLink = rating
    ? `<a class="text-link" ${mapsAttrs} aria-label="${esc(h.ratingLabel(rating))}"><span aria-hidden="true">★ ${t.lang === 'es' ? rating.replace('.', ',') : rating} ${h.rating}</span></a>`
    : `<a class="text-link" ${mapsAttrs}>${ICONS.pin}${h.mapsLink}</a>`;
  const gallerySizes = (i) => i === 0
    ? '(min-width: 1000px) 760px, (min-width: 640px) calc(100vw - 5rem), calc(100vw - 2.25rem)'
    : '(min-width: 1000px) 380px, (min-width: 640px) 45vw, 104px';
  const iconList = (items, cls = 'icon-list') =>
    `<ul class="${cls}">${items.map(([ic, text]) => `<li><span class="icon-badge">${icon(ic)}</span><span>${text}</span></li>`).join('')}</ul>`;
  const STEP_ICONS = ['idcard', 'referral', 'approved'];
  const LAW_ICONS = ['scale', 'people', 'shield', 'lock'];

  const body = `<body>
${header(t, { onHome: true, langPaths: ['/', '/en/'] })}
<main id="main">
<section class="hero" aria-labelledby="hero-title">
<figure class="hero-media">${picture('lounge', { alt: h.alt, sizes: HERO_SIZES, eager: true })}<figcaption class="media-label">${t.illustrative}</figcaption></figure>
<div class="wrap hero-inner">
<div class="hero-content">
<p class="eyebrow">${h.eyebrow}</p>
<h1 id="hero-title">${h.h1}</h1>
<p class="lead">${h.sub}</p>
<div class="btn-row">
<a class="btn btn-primary" href="#membership">${h.cta1}${ICONS.arrow}</a>
<a class="btn btn-secondary" href="#location">${ICONS.pin}${h.cta2}</a>
</div>
${googleLink}
</div>
</div>
</section>

<div class="quick-info">
<div class="wrap">
<div class="qi-card">
<div class="qi-item"><span class="icon-badge">${ICONS.pin}</span><div><span class="qi-label">${q.address}</span><span class="qi-value">${A.street}, ${A.localityDisplay}</span></div></div>
<div class="qi-item"><span class="icon-badge">${ICONS.clock}</span><div><span class="qi-label">${q.hours}</span><span class="qi-value">${q.daily} · ${HOURS}</span></div></div>
${directionsBtn(q.directions)}
</div>
</div>
</div>

<section class="section section-about" id="about" aria-labelledby="about-title">
<div class="wrap about-grid">
<div class="about-text">
<p class="eyebrow">${ab.eyebrow}</p>
<h2 id="about-title">${ab.h2}</h2>
<p class="lead">${ab.lead}</p>
<p>${ab.body}</p>
<div class="not-box">
<h3>${ab.notTitle}</h3>
${iconList(ab.nots, 'icon-list icon-list-compact')}
</div>
</div>
<ul class="pillars">
${ab.pillars.map(([title, text], i) => `<li class="pillar"><span class="icon-badge icon-badge-lg">${icon(ab.pillarIcons[i])}</span><h3>${title}</h3><p>${text}</p></li>`).join('\n')}
</ul>
</div>
</section>

<section class="section section-stone" aria-labelledby="space-title">
<div class="wrap">
<div class="section-head">
<p class="eyebrow">${ab.spaceEyebrow}</p>
<h2 id="space-title">${ab.spaceH2}</h2>
<p class="lead">${ab.spaceLead}</p>
</div>
<ul class="gallery">
${ab.space.map(([slug, title, text, alt], i) => `<li class="gallery-item${i === 0 ? ' is-feature' : ''}">${picture(slug, { alt, sizes: gallerySizes(i) })}<div><h3>${title}</h3><p>${text}</p></div></li>`).join('\n')}
</ul>
<p class="note note-icon gallery-note">${ICONS.info}<span>${ab.imagesNote}</span></p>
</div>
</section>

<section class="section section-membership" id="membership" aria-labelledby="membership-title">
<div class="wrap">
<div class="membership-layout">
<div class="section-head">
<p class="eyebrow">${m.eyebrow}</p>
<h2 id="membership-title">${m.h2}</h2>
<p class="lead">${m.lead}</p>
<ul class="chips">${m.chips.map((c) => `<li>${ICONS.no}${c}</li>`).join('')}</ul>
</div>
<figure class="membership-media">${picture('lounge-tall', { alt: t.alt2, sizes: '(min-width: 1000px) 440px, calc(100vw - 2.25rem)' })}<figcaption class="media-label">${t.illustrative}</figcaption></figure>
<ol class="steps">
${m.steps.map(([title, text], i) => `<li class="step"><span class="step-icon">${icon(STEP_ICONS[i])}<span class="step-num">${i + 1}</span></span><div><h3>${title}</h3><p>${text}</p></div></li>`).join('\n')}
</ol>
</div>
<div class="membership-panels">
<div class="panel">
<h3>${m.reqTitle}</h3>
${iconList(m.reqs)}
</div>
<div class="panel panel-stone">
<span class="icon-badge icon-badge-lg">${ICONS.chat}</span>
<h3>${m.contactTitle}</h3>
<p class="muted">${m.contact}</p>
<div class="btn-row">
<a class="btn btn-primary" href="${CLUB.whatsapp}" rel="noopener" target="_blank">${ICONS.whatsapp}WhatsApp</a>
<a class="btn btn-secondary btn-wrap" href="mailto:${CLUB.email}">${ICONS.mail}${CLUB.email}</a>
</div>
</div>
</div>
</div>
</section>

<section class="section section-stone section-law" id="how-it-works" aria-labelledby="law-title">
<div class="wrap">
<div class="section-head">
<p class="eyebrow">${law.eyebrow}</p>
<h2 id="law-title">${law.h2}</h2>
<p class="lead">${law.lead}</p>
</div>
<ul class="law-grid">
${law.items.map(([tag, title, text], i) => `<li class="law-item"><span class="icon-badge icon-badge-lg">${icon(LAW_ICONS[i])}</span><div><span class="tag">${tag}</span><h3>${title}</h3><p>${text}</p></div></li>`).join('\n')}
</ul>
<p class="note note-icon">${ICONS.info}<span>${law.disclaimer}</span></p>
</div>
</section>

<section class="section section-white" id="location" aria-labelledby="location-title">
<div class="wrap location-grid">
<div>
<div class="section-head">
<p class="eyebrow">${loc.eyebrow}</p>
<h2 id="location-title">${loc.h2}</h2>
<p class="lead">${loc.lead}</p>
<p class="travel-label">${ICONS.car}${loc.byCar}</p>
<ul class="chips chips-travel">${loc.travel.map(([place, time]) => `<li><strong>${place}</strong> ${time}</li>`).join('')}</ul>
</div>
<div class="info-block">
<div class="info-card">
<h3>${loc.address}</h3>
<address>${A.street}<br>${A.postalCode} ${A.localityDisplay}, ${A.province}<br>${A.countryName[t.lang]}</address>
${directionsBtn(loc.directions)}
</div>
<div class="info-card">
<h3>${loc.hours}</h3>
<p class="hours-summary"><span class="icon-badge">${ICONS.calendar}</span><span><span class="qi-label">${loc.hoursSummary}</span><span class="hours-big">${HOURS}</span></span></p>
<details class="hours-more">
<summary>${loc.hoursMore}</summary>
<table class="hours-table">
<thead class="visually-hidden"><tr><th scope="col">${loc.days}</th><th scope="col">${loc.time}</th></tr></thead>
<tbody>
${DAYS.map((d) => `<tr data-day="${d[0]}"><th scope="row">${t.lang === 'es' ? d[2] : d[3]}</th><td>${HOURS}</td></tr>`).join('\n')}
</tbody>
</table>
</details>
</div>
<div>
<h3>${loc.contact}</h3>
<ul class="contact-list">
<li><a href="tel:${CLUB.phone}"><span class="icon-badge">${ICONS.phone}</span>${CLUB.phoneDisplay}</a></li>
<li><a href="${CLUB.whatsapp}" rel="noopener" target="_blank"><span class="icon-badge">${ICONS.whatsapp}</span>WhatsApp</a></li>
<li><a href="mailto:${CLUB.email}"><span class="icon-badge">${ICONS.mail}</span>${CLUB.email}</a></li>
<li><a href="${CLUB.instagram}" rel="noopener" target="_blank"><span class="icon-badge">${ICONS.instagram}</span>Instagram ${CLUB.handle}</a></li>
<li><a href="${CLUB.tiktok}" rel="noopener" target="_blank"><span class="icon-badge">${ICONS.tiktok}</span>TikTok ${CLUB.handle}</a></li>
</ul>
</div>
</div>
</div>
<figure class="map" data-map-src="${esc(MAP_EMBED(t.lang))}" data-map-title="${esc(loc.mapTitle)}">
<div class="map-media">
${picture('map', { alt: loc.mapAlt, sizes: '(min-width: 960px) 600px, calc(100vw - 2.25rem)' })}
<span class="map-attrib">© <a href="https://www.openstreetmap.org/copyright" rel="noopener" target="_blank">OpenStreetMap</a></span>
</div>
<figcaption class="map-controls" data-map-controls>
<button class="btn btn-secondary" type="button" data-map-load>${ICONS.map}${loc.mapLoad}</button>
<p class="note">${loc.mapNote}</p>
</figcaption>
</figure>
</div>
</section>

<section class="section section-faq" id="faq" aria-labelledby="faq-title">
<div class="wrap faq-grid">
<div class="section-head">
<p class="eyebrow">${t.faqEyebrow}</p>
<h2 id="faq-title">${t.faqTitle}</h2>
</div>
<div class="faq-list">
${t.faq.map(([qq, a]) => `<details><summary><h3>${qq}</h3></summary><div class="answer">${a}</div></details>`).join('\n')}
</div>
</div>
</section>
</main>
${footer(t)}
${ageGate(t)}
<script>${JS}</script>
</body>
</html>`;

  return head({
    t, title: t.title, description: t.description, path: t.path,
    alternates: [['es', '/'], ['en', '/en/'], ['x-default', '/']],
    schema: homeSchema(t), preloadHero: true, gate: true,
  }) + '\n' + body;
}

/* ---------- legal pages (Spanish) ---------- */
const UPDATED = new Date(LEGAL_UPDATED + 'T12:00:00Z').toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
const OWNER_DL = `<dl>
<dt>Titular</dt><dd>${CLUB.legalName}</dd>
<dt>Nombre comercial</dt><dd>${CLUB.brandName}</dd>
<dt>CIF</dt><dd>${CLUB.cif}</dd>
<dt>Domicilio</dt><dd>${A.street}, ${A.postalCode} ${A.localityDisplay}, ${A.province}, ${A.countryName.es}</dd>
<dt>Registro</dt><dd>${CLUB.registry.name}, <span class="nowrap">n.º ${CLUB.registry.number}</span></dd>
<dt>Correo electrónico</dt><dd><a href="mailto:${CLUB.email}">${CLUB.email}</a></dd>
<dt>Teléfono</dt><dd><a href="tel:${CLUB.phone}">${CLUB.phoneDisplay}</a></dd>
</dl>`;
const EN_NOTE = '<p class="legal-note" lang="en">This page is provided in Spanish, the governing language. For questions in English, email <a href="mailto:' + CLUB.email + '">' + CLUB.email + '</a>.</p>';

const LEGAL = [
  {
    path: '/aviso-legal/',
    title: 'Aviso legal | Green Rabbit Cannabis Social Club',
    description: `Aviso legal de ${CLUB.legalName} (CIF ${CLUB.cif}), asociación privada sin ánimo de lucro en Calp, Alicante, conforme a la LSSI-CE.`,
    h1: 'Aviso legal',
    body: `<p>En cumplimiento del artículo 10 de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y de Comercio Electrónico (LSSI-CE), se facilitan los datos identificativos del titular de este sitio web.</p>
<h2>1. Datos identificativos</h2>
${OWNER_DL}
<h2>2. Objeto</h2>
<p>El sitio web greenrabbit.es tiene una finalidad exclusivamente informativa sobre la asociación, su funcionamiento, su ubicación y el procedimiento de admisión de socios. No se realiza a través de él ninguna venta, contratación ni actividad comercial, y su contenido no promueve ni publicita el consumo de cannabis.</p>
<h2>3. Condiciones de uso</h2>
<p>El acceso a este sitio está dirigido a personas mayores de ${AGE} años. El usuario se compromete a hacer un uso adecuado de los contenidos, de conformidad con la ley, la buena fe y el orden público.</p>
<h2>4. Propiedad intelectual e industrial</h2>
<p>Los textos, imágenes, logotipos y diseño de este sitio son titularidad de ${CLUB.legalName} o se utilizan con autorización. Queda prohibida su reproducción, distribución o transformación sin autorización expresa, salvo para uso personal y privado. Las fotografías de ambiente del sitio son imágenes ilustrativas y no muestran el interior real del local. El mapa de vista previa utiliza datos de © colaboradores de OpenStreetMap (licencia ODbL).</p>
<h2>5. Responsabilidad</h2>
<p>La asociación procura que la información publicada sea correcta y esté actualizada, pero no garantiza la ausencia de errores. La información sobre el marco legal tiene carácter general y no constituye asesoramiento jurídico. La asociación no se responsabiliza del contenido de los sitios web de terceros enlazados (Google Maps, Instagram, TikTok, WhatsApp).</p>
<h2>6. Legislación aplicable</h2>
<p>Este aviso legal se rige por la legislación española. Para cualquier controversia, las partes se someterán a los juzgados y tribunales que correspondan conforme a la normativa vigente.</p>`,
  },
  {
    path: '/privacidad/',
    title: 'Política de privacidad | Green Rabbit Calpe',
    description: `Política de privacidad de ${CLUB.legalName}: qué datos tratamos, con qué finalidad y cómo ejercer tus derechos según el RGPD y la LOPDGDD.`,
    h1: 'Política de privacidad',
    body: `<p>Esta política explica cómo trata los datos personales ${CLUB.legalName} en relación con este sitio web, de acuerdo con el Reglamento (UE) 2016/679 (RGPD) y la Ley Orgánica 3/2018 de Protección de Datos Personales y garantía de los derechos digitales (LOPDGDD).</p>
<h2>1. Responsable del tratamiento</h2>
${OWNER_DL}
<h2>2. Datos que tratamos</h2>
<p>Este sitio no tiene formularios, no crea cuentas de usuario y no utiliza herramientas de analítica ni de publicidad. Solo tratamos datos personales en estos casos:</p>
<ul>
<li><strong>Contacto:</strong> si nos escribes por correo electrónico (gestionado con Gmail / Google Workspace), WhatsApp o nos llamas, tratamos tus datos de contacto y el contenido de tu mensaje para responderte. Base jurídica: tu consentimiento y, en su caso, la aplicación de medidas precontractuales a petición tuya (art. 6.1.a y 6.1.b RGPD).</li>
<li><strong>Registros técnicos del servidor:</strong> el proveedor de alojamiento registra de forma automática datos técnicos como la dirección IP, el navegador y la fecha de acceso, con fines de seguridad y funcionamiento del servicio. Base jurídica: interés legítimo (art. 6.1.f RGPD).</li>
<li><strong>Mapa de Google:</strong> solo si pulsas «Cargar Google Maps» se conecta tu navegador con Google, que tratará tus datos según su propia política. Base jurídica: tu consentimiento, expresado al pulsar el botón.</li>
</ul>
<p>Los datos de las solicitudes de admisión de socios se recogen de forma presencial en la sede de la asociación, donde se facilita la información sobre protección de datos correspondiente. No se recogen a través de este sitio web.</p>
<h2>3. Destinatarios y transferencias</h2>
<p>No cedemos datos a terceros salvo obligación legal. Proveedores que pueden tratar datos por cuenta de la asociación o como responsables independientes:</p>
<ul>
<li>Vercel Inc. (alojamiento web), con sede en EE. UU., con garantías adecuadas para las transferencias internacionales (cláusulas contractuales tipo de la Comisión Europea y/o Marco de Privacidad de Datos UE-EE. UU.).</li>
<li>Google Ireland Ltd. – Gmail / Google Workspace (servicio de correo electrónico): trata los mensajes que nos envías a ${CLUB.email} y nuestras respuestas.</li>
<li>Google Ireland Ltd. – Google Maps: solo si pulsas «Cargar Google Maps».</li>
<li>WhatsApp Ireland Ltd., solo si decides contactarnos por WhatsApp.</li>
</ul>
<h2>4. Conservación</h2>
<p>Conservamos los datos de contacto el tiempo necesario para atender tu consulta y, después, durante los plazos legales de prescripción de posibles responsabilidades. Los registros técnicos se conservan el tiempo que fija el proveedor de alojamiento por motivos de seguridad.</p>
<h2>5. Tus derechos</h2>
<p>Puedes ejercer tus derechos de acceso, rectificación, supresión, oposición, limitación del tratamiento y portabilidad, así como retirar tu consentimiento en cualquier momento, escribiendo a <a href="mailto:${CLUB.email}">${CLUB.email}</a> e indicando el derecho que deseas ejercer. Podremos pedirte que acredites tu identidad.</p>
<p>Si consideras que no hemos tratado tus datos correctamente, puedes presentar una reclamación ante la Agencia Española de Protección de Datos (<a href="https://www.aepd.es" rel="noopener" target="_blank">www.aepd.es</a>).</p>
<h2>6. Menores de edad</h2>
<p>Este sitio está dirigido exclusivamente a personas mayores de ${AGE} años. No tratamos de forma consciente datos de menores.</p>`,
  },
  {
    path: '/cookies/',
    title: 'Política de cookies | Green Rabbit Calpe',
    description: `Política de cookies de ${CLUB.brandName}: este sitio no instala cookies propias, de analítica ni de publicidad. El mapa de Google solo se carga si lo pides.`,
    h1: 'Política de cookies',
    body: `<p>Esta política informa sobre el uso de cookies y tecnologías similares en greenrabbit.es, conforme al artículo 22.2 de la LSSI-CE.</p>
<h2>1. En resumen</h2>
<p><strong>Este sitio no instala cookies propias ni utiliza cookies de analítica, de publicidad ni de redes sociales.</strong> Por eso no mostramos un banner de cookies.</p>
<h2>2. Almacenamiento local técnico</h2>
<p>Cuando confirmas que tienes ${AGE} años o más, tu navegador guarda esa respuesta en su almacenamiento local (<code>localStorage</code>, clave <code>gr-age-ok</code>) para no volver a preguntarte. No es una cookie, no se envía a ningún servidor y no sirve para identificarte. Es un almacenamiento estrictamente necesario para la función que has solicitado, por lo que está exento de consentimiento. Puedes borrarlo en cualquier momento desde la configuración de tu navegador (datos de sitios web).</p>
<h2>3. Mapa de Google (solo si lo cargas)</h2>
<p>En la sección de ubicación mostramos una imagen estática del mapa. El mapa interactivo de Google Maps solo se carga si pulsas el botón «Cargar Google Maps». A partir de ese momento, Google puede instalar cookies y tecnologías similares bajo su responsabilidad. Puedes consultar su política en <a href="https://policies.google.com/technologies/cookies?hl=es" rel="noopener" target="_blank">policies.google.com</a>. Si no pulsas el botón, no se realiza ninguna conexión con Google.</p>
<h2>4. Enlaces externos</h2>
<p>Los enlaces a Instagram, TikTok, WhatsApp y Google Maps te llevan a sitios de terceros, que aplican sus propias políticas de cookies.</p>
<h2>5. Cambios</h2>
<p>Si en el futuro incorporamos cookies que requieran tu consentimiento, actualizaremos esta política y te lo solicitaremos antes de instalarlas.</p>`,
  },
];

function legalPage(p) {
  const t = T.es;
  const body = `<body>
${header(t, { onHome: false, langPaths: ['/', '/en/'] })}
<main id="main" class="legal-main">
<div class="wrap">
<p class="eyebrow">${CLUB.shortName} · ${A.locality}</p>
<h1>${p.h1}</h1>
<p class="muted">Última actualización: ${UPDATED}</p>
${EN_NOTE}
${p.body}
</div>
</main>
${footer(t)}
<script>${JS}</script>
</body>
</html>`;
  return head({
    t, title: p.title, description: p.description, path: p.path,
    alternates: null, schema: null,
  }) + '\n' + body;
}

function notFoundPage() {
  const t = T.es;
  const body = `<body>
${header(t, { onHome: false, langPaths: ['/', '/en/'] })}
<main id="main" class="legal-main">
<div class="wrap">
<h1>Página no encontrada</h1>
<p class="lead">La página que buscas no existe. <span lang="en">This page doesn't exist.</span></p>
<div class="btn-row"><a class="btn btn-primary" href="/">Volver al inicio</a><a class="btn btn-secondary" href="/en/" lang="en">English home</a></div>
</div>
</main>
${footer(t)}
<script>${JS}</script>
</body>
</html>`;
  return head({ t, title: 'Página no encontrada | Green Rabbit', description: T.es.description, path: '/404', noindex: true }) + '\n' + body;
}

/* ---------- sitemap / robots / manifest ---------- */
function sitemap() {
  const alt = `<xhtml:link rel="alternate" hreflang="es" href="${abs('/')}"/><xhtml:link rel="alternate" hreflang="en" href="${abs('/en/')}"/><xhtml:link rel="alternate" hreflang="x-default" href="${abs('/')}"/>`;
  const homes = ['/', '/en/'].map((p) => `<url><loc>${abs(p)}</loc><lastmod>${LEGAL_UPDATED}</lastmod>${alt}</url>`);
  const legal = LEGAL.map((p) => `<url><loc>${abs(p.path)}</loc><lastmod>${LEGAL_UPDATED}</lastmod></url>`);
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${[...homes, ...legal].join('\n')}
</urlset>
`;
}

const ROBOTS = `User-agent: *
Allow: /

Sitemap: ${abs('/sitemap.xml')}
`;

const MANIFEST = JSON.stringify({
  name: CLUB.brandName,
  short_name: CLUB.shortName,
  start_url: '/',
  display: 'browser',
  background_color: '#f8f6f1',
  theme_color: '#f8f6f1',
  icons: [
    { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
  ],
}, null, 2);

/* ---------- write ---------- */
async function out(path, content) {
  const file = join(DIST, path);
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, content);
}

await rm(DIST, { recursive: true, force: true });
await cp(join(ROOT, 'src/static'), DIST, { recursive: true });
await out('index.html', homePage(T.es));
await out('en/index.html', homePage(T.en));
for (const p of LEGAL) await out(p.path + 'index.html', legalPage(p));
await out('404.html', notFoundPage());
await out('sitemap.xml', sitemap());
await out('robots.txt', ROBOTS);
await out('site.webmanifest', MANIFEST);

// Report SEO lengths and open TODOs.
for (const t of [T.es, T.en]) {
  console.log(`[${t.lang}] title ${t.title.length} chars, description ${t.description.length} chars`);
}
const pending = [...TODO];
for (const [k, v] of Object.entries(CLUB)) if (typeof v === 'string' && v.includes('TODO')) pending.push(`CLUB.${k}`);
if (pending.length) console.warn('TODO placeholders still open:\n - ' + pending.join('\n - '));
console.log('built ->', DIST);
