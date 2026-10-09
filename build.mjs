// Static site generator for greenrabbit.es. Zero dependencies: `node build.mjs`
// renders dist/ from site.config.mjs, src/ templates below and src/static/.
import { readFile, writeFile, mkdir, rm, cp } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { CLUB, SITE_URL, LEGAL_UPDATED, TODO } from './site.config.mjs';
import es from './src/i18n/es.mjs';
import en from './src/i18n/en.mjs';
import fr from './src/i18n/fr.mjs';
import de from './src/i18n/de.mjs';
import it from './src/i18n/it.mjs';
import nl from './src/i18n/nl.mjs';
import sv from './src/i18n/sv.mjs';
import ru from './src/i18n/ru.mjs';
import ar from './src/i18n/ar.mjs';

const ROOT = dirname(new URL(import.meta.url).pathname);
// Content fingerprint for static asset URLs, so browsers never keep a stale
// copy after an image or font is regenerated under the same file name.
const versions = new Map();
const asset = (path) => {
  if (!versions.has(path)) {
    const hash = createHash('sha1').update(readFileSync(join(ROOT, 'src/static', path))).digest('hex').slice(0, 8);
    versions.set(path, `${path}?v=${hash}`);
  }
  return versions.get(path);
};
const DIST = join(ROOT, 'dist');
const IMAGES = JSON.parse(await readFile(join(ROOT, 'src/image-manifest.json'), 'utf8'));
const CSS = (await readFile(join(ROOT, 'src/site.css'), 'utf8'))
  .replace(/url\('(\/assets\/[^']+)'\)/g, (_, path) => `url('${asset(path)}')`)
  .replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s*\n\s*/g, '\n').trim();
const JS = (await readFile(join(ROOT, 'src/site.js'), 'utf8'))
  .replace(/^\s*\/\/.*$/gm, '').replace(/\n\s*\n/g, '\n').trim();
const YEAR = new Date().getFullYear();

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const stripTags = (s) => s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
const abs = (path) => SITE_URL + path;

const A = CLUB.address;
const HOURS = `${CLUB.hours.opens}–${CLUB.hours.closes}`;
// <bdi> keeps Latin/number runs (hours, phone, address) in order inside right-to-left text.
const bdi = (s) => `<bdi>${s}</bdi>`;
const HOURS_HTML = bdi(HOURS);
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
// Languages: path, html lang, hreflang, OG locale, direction, native name, country name.
const LANGS = [
  { code: 'es', lang: 'es', hreflang: 'es', path: '/', locale: 'es_ES', dir: 'ltr', name: 'Español', country: 'España', copy: es },
  { code: 'en', lang: 'en', hreflang: 'en', path: '/en/', locale: 'en_GB', dir: 'ltr', name: 'English', country: 'Spain', copy: en },
  { code: 'fr', lang: 'fr', hreflang: 'fr', path: '/fr/', locale: 'fr_FR', dir: 'ltr', name: 'Français', country: 'Espagne', copy: fr },
  { code: 'de', lang: 'de', hreflang: 'de', path: '/de/', locale: 'de_DE', dir: 'ltr', name: 'Deutsch', country: 'Spanien', copy: de },
  { code: 'it', lang: 'it', hreflang: 'it', path: '/it/', locale: 'it_IT', dir: 'ltr', name: 'Italiano', country: 'Spagna', copy: it },
  { code: 'nl', lang: 'nl', hreflang: 'nl', path: '/nl/', locale: 'nl_NL', dir: 'ltr', name: 'Nederlands', country: 'Spanje', copy: nl },
  { code: 'sv', lang: 'sv', hreflang: 'sv', path: '/sv/', locale: 'sv_SE', dir: 'ltr', name: 'Svenska', country: 'Spanien', copy: sv },
  { code: 'ru', lang: 'ru', hreflang: 'ru', path: '/ru/', locale: 'ru_RU', dir: 'ltr', name: 'Русский', country: 'Испания', copy: ru },
  { code: 'ar', lang: 'ar-MA', hreflang: 'ar-MA', path: '/ar/', locale: 'ar_MA', dir: 'rtl', name: 'العربية', country: 'إسبانيا', copy: ar },
];
// Heading font file to preload per language (the hero h1 uses the serif).
const SERIF_PRELOAD = { ru: '/assets/fonts/cormorant-cyrillic-500.woff2', ar: '/assets/fonts/amiri-arabic-400.woff2' };
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
  globe: `<svg viewBox="0 0 24 24" ${STROKE} aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3Z"/></svg>`,
  info: `<svg viewBox="0 0 24 24" ${STROKE} aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.8v.4"/></svg>`,
};
const icon = (name) => ICONS[name];
// Directional arrow: mirrored in right-to-left layouts.
ICONS.arrow = ICONS.arrow.replace('<svg ', '<svg class="icon-flip" ');

/* ---------- images ---------- */
function srcset(slug, ext) {
  return IMAGES[slug].widths.map((w) => `${asset(`/assets/img/${slug}-${w}.${ext}`)} ${w}w`).join(', ');
}
function picture(slug, { alt, sizes, eager = false }) {
  const { widths, ratio } = IMAGES[slug];
  const max = widths.at(-1);
  const fallback = widths[Math.min(1, widths.length - 1)];
  const loading = eager ? 'fetchpriority="high" decoding="async"' : 'loading="lazy" decoding="async"';
  return `<picture><source type="image/avif" srcset="${srcset(slug, 'avif')}" sizes="${sizes}"><source type="image/webp" srcset="${srcset(slug, 'webp')}" sizes="${sizes}"><img src="${asset(`/assets/img/${slug}-${fallback}.jpg`)}" srcset="${srcset(slug, 'jpg')}" sizes="${sizes}" width="${max}" height="${Math.round(max * ratio)}" alt="${esc(alt)}" ${loading}></picture>`;
}
const LOGO = (size, alt = '', eager = false) =>
  `<img src="${asset(`/assets/img/logo-${size <= 52 ? 96 : size <= 96 ? 192 : 384}.webp`)}" width="${size}" height="${size}" alt="${esc(alt)}"${eager ? '' : ' loading="lazy"'} decoding="async">`;

/* ---------- copy ---------- */

/* ---------- copy ---------- */
const CTX = { AGE, A, HOURS: HOURS_HTML, CLUB, esc };
const T = Object.fromEntries(LANGS.map(({ copy, ...meta }) => [meta.code, { ...meta, ...copy(CTX) }]));
const HOME_ALTERNATES = [...LANGS.map((l) => [l.hreflang, l.path]), ['x-default', '/']];

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
    logo: { '@type': 'ImageObject', url: abs(asset('/assets/img/logo-512.png')), width: 512, height: 512 },
    image: abs(asset('/assets/img/logo-512.png')),
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
        inLanguage: LANGS.map((l) => l.hreflang),
        publisher: { '@id': abs('/#organization') },
      },
      {
        '@type': 'FAQPage',
        '@id': `${pageUrl}#faq`,
        url: pageUrl,
        inLanguage: t.hreflang,
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
    ? `<link rel="preload" as="image" type="image/avif" imagesrcset="${srcset('hero-lounge', 'avif')}" imagesizes="${HERO_SIZES}" fetchpriority="high">`
    : '';
  const gateCheck = gate
    ? `;try{if(localStorage.getItem('gr-age-ok')!=='1')d.classList.add('age-pending')}catch(e){d.classList.add('age-pending')}`
    : '';
  return `<!DOCTYPE html>
<html lang="${t.lang}" dir="${t.dir}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
${noindex ? '<meta name="robots" content="noindex, follow">' : '<meta name="robots" content="index, follow, max-image-preview:large">'}
<link rel="canonical" href="${url}">
${hreflang}
<script>var d=document.documentElement;d.classList.add('js')${gateCheck}</script>
<link rel="preload" href="${asset(SERIF_PRELOAD[t.code] || '/assets/fonts/cormorant-500.woff2')}" as="font" type="font/woff2" crossorigin>
${heroPreload}
<style>${CSS}</style>
<meta name="theme-color" content="#f8f6f1">
<link rel="icon" href="${asset('/favicon.ico')}" sizes="48x48">
<link rel="icon" href="${asset('/favicon-32.png')}" type="image/png" sizes="32x32">
<link rel="apple-touch-icon" href="${asset('/apple-touch-icon.png')}">
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
<meta property="og:image" content="${abs(asset('/og-image.jpg'))}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(t.ogAlt)}">
<meta property="og:locale" content="${t.locale}">
${LANGS.filter((l) => l.code !== t.code).map((l) => `<meta property="og:locale:alternate" content="${l.locale}">`).join('\n')}
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${abs(asset('/og-image.jpg'))}">
<meta name="twitter:image:alt" content="${esc(t.ogAlt)}">
${schema ? jsonld(schema) : ''}
</head>`;
}

function socialLinks(t) {
  return `<a class="icon-link" href="${CLUB.instagram}" rel="noopener" target="_blank" aria-label="${esc(t.social.instagram)}">${ICONS.instagram}</a>
<a class="icon-link" href="${CLUB.tiktok}" rel="noopener" target="_blank" aria-label="${esc(t.social.tiktok)}">${ICONS.tiktok}</a>`;
}

function langMenu(t) {
  return `<details class="lang-menu">
<summary aria-label="${esc(t.langLabel)}: ${esc(t.name)}">${ICONS.globe}<span>${t.code.toUpperCase()}</span></summary>
<ul>
${LANGS.map((l) => `<li><a href="${l.path}" hreflang="${l.hreflang}" lang="${l.lang}"${l.code === t.code ? ' aria-current="page"' : ''}>${l.name}</a></li>`).join('\n')}
</ul>
</details>`;
}

function header(t, { onHome }) {
  const base = onHome ? '' : t.path;
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
${langMenu(t)}
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
<div class="lockup">${LOGO(56, '')}<div><p class="lockup-name">${CLUB.shortName}</p><p class="lockup-sub">Cannabis Social Club · ${A.locality}</p></div></div>
<p class="footer-legal"><strong>${CLUB.legalName}</strong><br>CIF ${CLUB.cif}<br>${f.registry}</p>
</div>
<div>
<h2>${f.visit}</h2>
<address>${bdi(A.street)}<br>${bdi(`${A.postalCode} ${A.localityDisplay}, ${A.province}`)}<br>${t.country}</address>
<p class="footer-hours">${f.daily}: ${HOURS_HTML}</p>
</div>
<div>
<h2>${f.contact}</h2>
<ul class="footer-links">
<li><a href="tel:${CLUB.phone}">${bdi(CLUB.phoneDisplay)}</a></li>
<li><a href="mailto:${CLUB.email}">${bdi(CLUB.email)}</a></li>
<li><a href="${CLUB.whatsapp}" rel="noopener" target="_blank">WhatsApp</a></li>
</ul>
</div>
<div>
<h2>${f.follow}</h2>
<ul class="footer-links">
<li><a href="${CLUB.instagram}" rel="noopener" target="_blank">${ICONS.instagram}Instagram</a></li>
<li><a href="${CLUB.tiktok}" rel="noopener" target="_blank">${ICONS.tiktok}TikTok</a></li>
</ul>
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
    ? `<a class="text-link text-link-light" ${mapsAttrs} aria-label="${esc(h.ratingLabel(rating))}"><span aria-hidden="true">★ ${t.lang === 'es' ? rating.replace('.', ',') : rating} ${h.rating}</span></a>`
    : `<a class="text-link text-link-light" ${mapsAttrs}>${ICONS.pin}${h.mapsLink}</a>`;
  const iconList = (items) =>
    `<ul class="icon-list">${items.map(([ic, text]) => `<li><span class="icon-badge">${icon(ic)}</span><span>${text}</span></li>`).join('')}</ul>`;
  const card = (ic, title, text, tag = '') =>
    `<span class="icon-badge icon-badge-lg">${icon(ic)}</span>${tag ? `<span class="tag">${tag}</span>` : ''}<h3>${title}</h3><p>${text}</p>`;
  const STEP_ICONS = ['idcard', 'referral', 'approved'];
  const LAW_ICONS = ['scale', 'people', 'shield', 'lock'];
  const pad = (n) => String(n).padStart(2, '0');

  const body = `<body>
${header(t, { onHome: true })}
<main id="main">
<section class="hero" aria-labelledby="hero-title">
<figure class="hero-media">${picture('hero-lounge', { alt: h.alt, sizes: HERO_SIZES, eager: true })}<figcaption class="media-label">${t.illustrative}</figcaption></figure>
<div class="wrap hero-inner">
<div class="hero-content">
<p class="eyebrow">${h.eyebrow}</p>
<h1 id="hero-title">${h.h1}</h1>
<p class="lead">${h.sub}</p>
<div class="btn-row">
<a class="btn btn-light" href="#membership">${h.cta1}${ICONS.arrow}</a>
<a class="btn btn-outline-light" href="#location">${ICONS.pin}${h.cta2}</a>
</div>
${googleLink}
</div>
</div>
</section>

<div class="quick-info">
<div class="wrap">
<div class="qi-card">
<div class="qi-item">${ICONS.pin}<div><span class="qi-label">${q.address}</span><span class="qi-value">${bdi(`${A.street}, ${A.localityDisplay}`)}</span></div></div>
<div class="qi-item">${ICONS.clock}<div><span class="qi-label">${q.hours}</span><span class="qi-value">${q.daily} · ${HOURS_HTML}</span></div></div>
${directionsBtn(q.directions)}
</div>
</div>
</div>

<section class="section" id="about" aria-labelledby="about-title">
<div class="wrap">
<div class="section-head section-head-split">
<div><p class="eyebrow">${ab.eyebrow}</p><h2 id="about-title">${ab.h2}</h2></div>
<p class="lead">${ab.lead}</p>
</div>
<div class="about-grid">
<div class="green-panel">
<p class="green-panel-lead">${ab.body}</p>
<h3>${ab.notTitle}</h3>
${iconList(ab.nots)}
</div>
<ul class="card-grid">
${ab.pillars.map(([title, text], i) => `<li class="card">${card(ab.pillarIcons[i], title, text)}</li>`).join('\n')}
</ul>
</div>
</div>
</section>

<section class="section section-stone" aria-labelledby="space-title">
<div class="wrap space-grid">
<div class="space-head">
<p class="eyebrow">${ab.spaceEyebrow}</p>
<h2 id="space-title">${ab.spaceH2}</h2>
<p class="lead">${ab.spaceLead}</p>
</div>
<div class="space-tabs" role="tablist" aria-label="${esc(t.spaceTabs)}">
${ab.space.map(([slug, title], i) => `<button class="space-tab" type="button" role="tab" id="space-tab-${i}" aria-controls="space-panel-${i}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}">${picture(slug, { alt: '', sizes: '120px' })}<span>${title}</span></button>`).join('\n')}
</div>
<p class="note note-icon space-note">${ICONS.info}<span>${ab.imagesNote}</span></p>
<div class="space-stage">
${ab.space.map(([slug, title, text, alt], i) => `<figure class="space-panel${i === 0 ? ' is-active' : ''}" role="tabpanel" id="space-panel-${i}" aria-labelledby="space-tab-${i}">${picture(slug, { alt, sizes: '(min-width: 1000px) 700px, calc(100vw - 2.25rem)' })}<figcaption><h3>${title}</h3><p>${text}</p></figcaption></figure>`).join('\n')}
</div>
</div>
</section>

<section class="section" id="membership" aria-labelledby="membership-title">
<div class="wrap">
<div class="membership-layout">
<div class="section-head">
<p class="eyebrow">${m.eyebrow}</p>
<h2 id="membership-title">${m.h2}</h2>
<p class="lead">${m.lead}</p>
<ul class="chips">${m.chips.map((c) => `<li>${ICONS.no}${c}</li>`).join('')}</ul>
</div>
<div class="brand-panel">
<img src="${asset('/assets/img/logo-384.webp')}" width="200" height="200" alt="${esc(CLUB.shortName)}" loading="lazy" decoding="async">
<p class="brand-panel-name">${CLUB.shortName}</p>
<p class="brand-panel-sub">${t.brandPanel.sub}</p>
<p class="brand-panel-tag">${t.brandPanel.tag}</p>
</div>
<ol class="steps">
${m.steps.map(([title, text], i) => `<li class="step"><span class="icon-badge icon-badge-lg">${icon(STEP_ICONS[i])}</span><div><span class="tag">${pad(i + 1)}</span><h3>${title}</h3><p>${text}</p></div></li>`).join('\n')}
</ol>
</div>
<div class="membership-panels">
<div class="panel">
<h3>${m.reqTitle}</h3>
${iconList(m.reqs)}
</div>
<div class="panel panel-stone">
<h3>${m.contactTitle}</h3>
<p>${m.contact}</p>
<div class="btn-row">
<a class="btn btn-primary" href="${CLUB.whatsapp}" rel="noopener" target="_blank">${ICONS.whatsapp}WhatsApp</a>
<a class="btn btn-secondary btn-wrap" href="mailto:${CLUB.email}">${ICONS.mail}${bdi(CLUB.email)}</a>
</div>
</div>
</div>
</div>
</section>

<section class="section section-stone" id="how-it-works" aria-labelledby="law-title">
<div class="wrap">
<div class="section-head section-head-split">
<div><p class="eyebrow">${law.eyebrow}</p><h2 id="law-title">${law.h2}</h2></div>
<p class="lead">${law.lead}</p>
</div>
<ul class="card-grid card-grid-2">
${law.items.map(([tag, title, text], i) => `<li class="card">${card(LAW_ICONS[i], title, text, tag)}</li>`).join('\n')}
</ul>
<p class="note note-icon law-note">${ICONS.info}<span>${law.disclaimer}</span></p>
</div>
</section>

<section class="section section-white" id="location" aria-labelledby="location-title">
<div class="wrap">
<div class="section-head section-head-split">
<div><p class="eyebrow">${loc.eyebrow}</p><h2 id="location-title">${loc.h2}</h2></div>
<p class="lead">${loc.lead}</p>
</div>
<div class="travel-row">
<p class="travel-label">${ICONS.car}${loc.byCar}</p>
<ul class="chips chips-travel" aria-label="${esc(loc.byCar)}">${loc.travel.map(([place, time]) => `<li><strong>${place}</strong> ${time}</li>`).join('')}</ul>
</div>
<div class="location-grid">
<div class="visit-card">
<div class="visit-block">
<span class="qi-label">${loc.address}</span>
<address class="address-lg">${bdi(A.street)}<br>${bdi(`${A.postalCode} ${A.localityDisplay}, ${A.province}`)}<br>${t.country}</address>
${directionsBtn(loc.directions)}
</div>
<div class="visit-block visit-hours">
<span class="icon-badge icon-badge-lg">${ICONS.clock}</span>
<div>
<span class="qi-label">${loc.hours}</span>
<span class="hours-big">${HOURS_HTML}</span>
<span class="hours-days">${loc.hoursSummary}</span>
<details class="hours-more">
<summary>${loc.hoursMore}</summary>
<table class="hours-table">
<thead class="visually-hidden"><tr><th scope="col">${loc.days}</th><th scope="col">${loc.time}</th></tr></thead>
<tbody>
${DAYS.map((d, i) => `<tr data-day="${d[0]}"><th scope="row">${t.days[i]}</th><td>${HOURS_HTML}</td></tr>`).join('\n')}
</tbody>
</table>
</details>
</div>
</div>
<div class="visit-block">
<span class="qi-label">${loc.contact}</span>
<ul class="contact-list">
<li><a href="tel:${CLUB.phone}">${ICONS.phone}${bdi(CLUB.phoneDisplay)}</a></li>
<li><a href="${CLUB.whatsapp}" rel="noopener" target="_blank">${ICONS.whatsapp}WhatsApp</a></li>
<li><a href="mailto:${CLUB.email}">${ICONS.mail}${bdi(CLUB.email)}</a></li>
<li><a href="${CLUB.instagram}" rel="noopener" target="_blank">${ICONS.instagram}${bdi(`Instagram ${CLUB.handle}`)}</a></li>
<li><a href="${CLUB.tiktok}" rel="noopener" target="_blank">${ICONS.tiktok}${bdi(`TikTok ${CLUB.handle}`)}</a></li>
</ul>
</div>
</div>
<figure class="map" data-map-src="${esc(MAP_EMBED(t.code))}" data-map-title="${esc(loc.mapTitle)}">
<div class="map-media">
${picture('map', { alt: loc.mapAlt, sizes: '(min-width: 960px) 640px, calc(100vw - 2.25rem)' })}
<span class="map-attrib">© <a href="https://www.openstreetmap.org/copyright" rel="noopener" target="_blank">OpenStreetMap</a></span>
</div>
<figcaption class="map-controls" data-map-controls>
<button class="btn btn-secondary" type="button" data-map-load>${ICONS.map}${loc.mapLoad}</button>
<p class="note">${loc.mapNote}</p>
</figcaption>
</figure>
</div>
</div>
</section>

<section class="section" id="faq" aria-labelledby="faq-title">
<div class="wrap faq-grid">
<div class="section-head">
<p class="eyebrow">${t.faqEyebrow}</p>
<h2 id="faq-title">${t.faqTitle}</h2>
<p class="faq-aside">${t.faqAside[0]} <a href="${CLUB.whatsapp}" rel="noopener" target="_blank">${t.faqAside[1]}</a></p>
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
    alternates: HOME_ALTERNATES,
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
${header(t, { onHome: false })}
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
${header(t, { onHome: false })}
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
  const alt = HOME_ALTERNATES.map(([l, p]) => `<xhtml:link rel="alternate" hreflang="${l}" href="${abs(p)}"/>`).join('');
  const homes = LANGS.map((l) => `<url><loc>${abs(l.path)}</loc><lastmod>${LEGAL_UPDATED}</lastmod>${alt}</url>`);
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
    { src: asset('/icon-192.png'), sizes: '192x192', type: 'image/png' },
    { src: asset('/icon-512.png'), sizes: '512x512', type: 'image/png' },
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
for (const l of LANGS) await out(`${l.path.slice(1)}index.html`, homePage(T[l.code]));
for (const p of LEGAL) await out(p.path + 'index.html', legalPage(p));
await out('404.html', notFoundPage());
await out('sitemap.xml', sitemap());
await out('robots.txt', ROBOTS);
await out('site.webmanifest', MANIFEST);

// Report SEO lengths and open TODOs.
for (const t of Object.values(T)) {
  console.log(`[${t.code}] title ${t.title.length} chars, description ${t.description.length} chars`);
}
const pending = [...TODO];
for (const [k, v] of Object.entries(CLUB)) if (typeof v === 'string' && v.includes('TODO')) pending.push(`CLUB.${k}`);
if (pending.length) console.warn('TODO placeholders still open:\n - ' + pending.join('\n - '));
console.log('built ->', DIST);
