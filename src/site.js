// Inlined at the end of <body> by build.mjs. No dependencies.
(function () {
  var KEY = 'gr-age-ok';
  var root = document.documentElement;

  // Mobile menu. Without JS the nav renders as a plain wrapped list (see CSS).
  var header = document.querySelector('.site-header');
  var toggle = document.querySelector('[data-menu-toggle]');
  if (header && toggle) {
    var isOpen = function () { return toggle.getAttribute('aria-expanded') === 'true'; };
    var setOpen = function (open, returnFocus) {
      header.classList.toggle('menu-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      if (!open && returnFocus) toggle.focus();
    };
    toggle.addEventListener('click', function () {
      var open = !isOpen();
      setOpen(open);
      if (open) document.querySelector('#site-nav a').focus();
    });
    document.getElementById('site-nav').addEventListener('click', function (e) {
      if (e.target.closest('a')) setOpen(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isOpen()) setOpen(false, true);
    });
    document.addEventListener('click', function (e) {
      if (isOpen() && !header.contains(e.target)) setOpen(false);
    });
    var desktop = window.matchMedia('(min-width: 960px)');
    var onChange = function (e) { if (e.matches) setOpen(false); };
    if (desktop.addEventListener) desktop.addEventListener('change', onChange);
  }

  // Language dropdown: a native <details>; JS only adds outside-click and Escape closing.
  var langMenu = document.querySelector('.lang-menu');
  if (langMenu) {
    document.addEventListener('click', function (e) {
      if (langMenu.open && !langMenu.contains(e.target)) langMenu.open = false;
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && langMenu.open) {
        langMenu.open = false;
        langMenu.querySelector('summary').focus();
      }
    });
    if (toggle) toggle.addEventListener('click', function () { langMenu.open = false; });
  }

  // Age gate: an overlay on top of fully rendered content. A tiny inline
  // script in <head> adds .age-pending before first paint when needed.
  var gate = document.getElementById('age-gate');
  if (gate) {
    var others = Array.prototype.filter.call(document.body.children, function (el) {
      return el !== gate && el.tagName !== 'SCRIPT';
    });
    var yes = gate.querySelector('[data-age-yes]');
    var setInert = function (on) { others.forEach(function (el) { el.inert = on; }); };
    var close = function () { root.classList.remove('age-pending'); setInert(false); };

    if (root.classList.contains('age-pending')) {
      setInert(true);
      yes.focus();
    }
    yes.addEventListener('click', function () {
      try { localStorage.setItem(KEY, '1'); } catch (e) { /* storage blocked: gate shows again next visit */ }
      close();
    });
    gate.querySelector('[data-age-no]').addEventListener('click', function () {
      gate.classList.add('is-denied');
      gate.querySelector('[data-age-back]').focus();
    });
    gate.querySelector('[data-age-back]').addEventListener('click', function () {
      gate.classList.remove('is-denied');
      yes.focus();
    });
  }

  // Click-to-load Google Maps (no request to Google until the visitor asks).
  Array.prototype.forEach.call(document.querySelectorAll('[data-map-src]'), function (map) {
    var controls = map.querySelector('[data-map-controls]');
    map.querySelector('[data-map-load]').addEventListener('click', function () {
      var frame = document.createElement('iframe');
      frame.src = map.getAttribute('data-map-src');
      frame.title = map.getAttribute('data-map-title');
      frame.allowFullscreen = true;
      frame.referrerPolicy = 'no-referrer-when-downgrade';
      map.querySelector('.map-media').replaceChildren(frame);
      if (controls) controls.hidden = true;
      frame.focus();
    });
  });

  // "El espacio" gallery: tabs switch the featured image (WAI-ARIA tabs pattern).
  // Without JS every panel is shown and the tab row is hidden (see CSS).
  var tablist = document.querySelector('.space-tabs');
  if (tablist) {
    var tabs = Array.prototype.slice.call(tablist.querySelectorAll('[role="tab"]'));
    var select = function (index, focus) {
      tabs.forEach(function (tab, i) {
        var on = i === index;
        tab.setAttribute('aria-selected', String(on));
        tab.tabIndex = on ? 0 : -1;
        document.getElementById(tab.getAttribute('aria-controls')).classList.toggle('is-active', on);
      });
      if (focus) tabs[index].focus();
    };
    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { select(i); });
      tab.addEventListener('keydown', function (e) {
        var n = tabs.length, next = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (i + 1) % n;
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (i - 1 + n) % n;
        else if (e.key === 'Home') next = 0;
        else if (e.key === 'End') next = n - 1;
        if (next !== null) { e.preventDefault(); select(next, true); }
      });
    });
  }

  // Highlight today's row in the opening-hours table (club time zone).
  try {
    var today = new Intl.DateTimeFormat('en-GB', { weekday: 'short', timeZone: 'Europe/Madrid' }).format(new Date());
    var row = document.querySelector('.hours-table tr[data-day="' + today + '"]');
    if (row) row.classList.add('is-today');
  } catch (e) { /* older browsers: no highlight */ }
})();
