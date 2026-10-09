// Inlined at the end of <body> by build.mjs. No dependencies.
(function () {
  var KEY = 'gr-age-ok';
  var root = document.documentElement;

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
  Array.prototype.forEach.call(document.querySelectorAll('[data-map-src]'), function (box) {
    box.querySelector('[data-map-load]').addEventListener('click', function () {
      var frame = document.createElement('iframe');
      frame.src = box.getAttribute('data-map-src');
      frame.title = box.getAttribute('data-map-title');
      frame.allowFullscreen = true;
      frame.referrerPolicy = 'no-referrer-when-downgrade';
      box.replaceChildren(frame);
      frame.focus();
    });
  });

  // Highlight today's row in the opening-hours table (club time zone).
  try {
    var today = new Intl.DateTimeFormat('en-GB', { weekday: 'short', timeZone: 'Europe/Madrid' }).format(new Date());
    var row = document.querySelector('.hours-table tr[data-day="' + today + '"]');
    if (row) row.classList.add('is-today');
  } catch (e) { /* older browsers: no highlight */ }
})();
