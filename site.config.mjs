// Single source of truth for all club data. Every page, the JSON-LD,
// sitemap and legal pages are generated from this file by build.mjs.
// Anything still unconfirmed goes in TODO below; the build prints the list.

export const SITE_URL = 'https://www.greenrabbit.es';

export const CLUB = {
  brandName: 'Green Rabbit Cannabis Social Club',
  shortName: 'Green Rabbit',
  legalName: 'Asociación Cannábica Green Rabbit',
  cif: 'G88682265',
  registry: {
    name: 'Registro de Asociaciones de la Comunitat Valenciana',
    number: 'CV-01-068683-A',
  },
  address: {
    street: 'Carrer de Joan de Garay, 3',
    postalCode: '03710',
    locality: 'Calp',
    localityDisplay: 'Calp (Calpe)',
    province: 'Alicante',
    regionCode: 'ES-A',
    country: 'ES',
    countryName: { es: 'España', en: 'Spain' },
  },
  geo: { lat: 38.6428757, lng: 0.0509588 },
  mapsUrl:
    'https://www.google.com/maps/place/Asociaci%C3%B3n+Green+Rabbit+Cannabis+Social+Club/@38.6428757,0.0509588,17z/data=!4m6!3m5!1s0x129dff779bc4a06b:0x797da815958ddfd!8m2!3d38.6428757!4d0.0509588',
  // Same hours every day (Mo–Su). 24h format.
  hours: { opens: '12:30', closes: '22:00' },
  phone: '+34601926578',
  phoneDisplay: '+34 601 926 578',
  whatsapp: 'https://wa.me/34601926578',
  email: 'greenrabbitcalpe@gmail.com',
  instagram: 'https://instagram.com/greenrabbitcalpe',
  tiktok: 'https://www.tiktok.com/@greenrabbitcalpe',
  handle: '@greenrabbitcalpe',
  minAge: 18,
  membershipByReferral: true,
  // Google rating: shown only when verified against the live Google listing
  // (e.g. '5.0'). null shows a neutral link to the listing instead.
  googleRating: null,
};

// Date shown as "last updated" on the legal pages (ISO yyyy-mm-dd).
export const LEGAL_UPDATED = '2026-10-09';

// Open items. Leave entries here (and visible "TODO" text on the page)
// until confirmed; never guess legal or contact data.
export const TODO = [];
