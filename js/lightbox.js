/* Lightbox for note image strips.
 *
 * Without this script every thumbnail is a plain link to its full JPEG, which
 * works everywhere. With it, a click lifts the thumbnail out of the strip and
 * grows it into the full image (the square crop opens out to the whole
 * picture), with arrows, swipes and keys to move between the note's images.
 * Closing shrinks it back into its thumbnail.
 */
(function () {
  'use strict';
  if (!document.querySelector || !('animate' in Element.prototype)) return;

  var EASE = 'cubic-bezier(.2,.8,.2,1)';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var OPEN_MS = reduce ? 160 : 460;
  var CLOSE_MS = reduce ? 140 : 360;
  var GUTTER = 24; // space kept around the image on each side

  var box, bg, stage, frame, counter, prevBtn, nextBtn, closeBtn;
  var links = [], index = 0, opener = null, busy = false, sizes = {};

  function el(tag, cls, parent) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (parent) parent.appendChild(n);
    return n;
  }

  function build() {
    box = el('div', 'lb', document.body);
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-label', 'Image viewer');
    box.hidden = true;
    bg = el('div', 'lb-bg', box);
    stage = el('div', 'lb-stage', box);
    closeBtn = el('button', 'lb-btn lb-close', box);
    closeBtn.type = 'button';
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.textContent = '×';
    prevBtn = el('button', 'lb-btn lb-prev', box);
    prevBtn.type = 'button';
    prevBtn.setAttribute('aria-label', 'Previous image');
    prevBtn.textContent = '←';
    nextBtn = el('button', 'lb-btn lb-next', box);
    nextBtn.type = 'button';
    nextBtn.setAttribute('aria-label', 'Next image');
    nextBtn.textContent = '→';
    counter = el('div', 'lb-count', box);
    counter.setAttribute('aria-live', 'polite');

    closeBtn.addEventListener('click', close);
    prevBtn.addEventListener('click', function (e) { e.stopPropagation(); go(-1); });
    nextBtn.addEventListener('click', function (e) { e.stopPropagation(); go(1); });
    bg.addEventListener('click', close);
    stage.addEventListener('click', function (e) { if (!dragged) close(); });
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', function () { if (!box.hidden && frame && !busy) place(frame, links[index]); });
    setupSwipe();
  }

  // ---- geometry ------------------------------------------------------------
  function natural(a) {
    var w = +a.getAttribute('data-width'), h = +a.getAttribute('data-height');
    if (w && h) return { w: w, h: h };
    if (sizes[a.href]) return sizes[a.href];
    var t = a.querySelector('img');
    if (t && t.naturalWidth && t.currentSrc === a.href) return { w: t.naturalWidth, h: t.naturalHeight };
    return null;
  }
  function loadSize(a) {
    var s = natural(a);
    if (s) return Promise.resolve(s);
    return new Promise(function (res) {
      var i = new Image();
      i.onload = function () { res(sizes[a.href] = { w: i.naturalWidth, h: i.naturalHeight }); };
      i.onerror = function () { res(sizes[a.href] = { w: 4, h: 3 }); };
      i.src = a.href;
    });
  }
  // Where the full image sits on screen: as large as fits, never upscaled.
  function target(s) {
    var vw = document.documentElement.clientWidth, vh = window.innerHeight;
    var pad = vw < 550 ? 0 : GUTTER * 2, padY = vw < 550 ? 72 : 112;
    var k = Math.min(1, (vw - pad * 2) / s.w, (vh - padY) / s.h);
    var w = Math.round(s.w * k), h = Math.round(s.h * k);
    return { left: Math.round((vw - w) / 2), top: Math.round((vh - h) / 2), width: w, height: h };
  }
  // The transform + clip that make the full-size frame look exactly like the
  // square thumbnail: scaled down so its short side matches, cropped square.
  function fromThumb(r, thumb) {
    var side = Math.min(r.width, r.height);
    var k = thumb.width / side;
    var cx = thumb.left + thumb.width / 2, cy = thumb.top + thumb.height / 2;
    var dx = cx - (r.left + r.width / 2), dy = cy - (r.top + r.height / 2);
    var ix = (r.width - side) / 2, iy = (r.height - side) / 2;
    return {
      transform: 'translate(' + dx + 'px,' + dy + 'px) scale(' + k + ')',
      clipPath: 'inset(' + iy + 'px ' + ix + 'px ' + iy + 'px ' + ix + 'px)'
    };
  }
  var REST = { transform: 'translate(0px,0px) scale(1)', clipPath: 'inset(0px 0px 0px 0px)' };

  function visible(r) {
    return r.width > 0 && r.bottom > 0 && r.top < window.innerHeight && r.right > 0 && r.left < document.documentElement.clientWidth;
  }

  // ---- frame ---------------------------------------------------------------
  // A frame holds the thumbnail (placed over the centre square, so it shows
  // straight away) with the full image fading in on top once it has loaded.
  function makeFrame(a) {
    var f = el('div', 'lb-frame');
    var t = a.querySelector('img');
    var thumb = el('img', 'lb-thumb', f);
    thumb.alt = '';
    thumb.src = t ? (t.currentSrc || t.src) : a.href;
    var full = el('img', 'lb-full', f);
    full.alt = t ? t.alt : '';
    full.decoding = 'async';
    full.addEventListener('load', function () { full.classList.add('ready'); });
    full.src = a.href;
    stage.appendChild(f);
    return f;
  }
  function place(f, a) {
    var r = target(natural(a) || { w: 1, h: 1 });
    f.style.left = r.left + 'px';
    f.style.top = r.top + 'px';
    f.style.width = r.width + 'px';
    f.style.height = r.height + 'px';
    var side = Math.min(r.width, r.height);
    var th = f.querySelector('.lb-thumb');
    th.style.left = (r.width - side) / 2 + 'px';
    th.style.top = (r.height - side) / 2 + 'px';
    th.style.width = th.style.height = side + 'px';
    return r;
  }

  function setUi() {
    var many = links.length > 1;
    counter.textContent = many ? (index + 1) + ' / ' + links.length : '';
    prevBtn.hidden = nextBtn.hidden = !many;
    prevBtn.disabled = index === 0;
    nextBtn.disabled = index === links.length - 1;
  }
  function hideThumb(a, hide) {
    var li = a && a.parentNode;
    if (li) li.classList.toggle('lb-lifted', !!hide);
  }

  // ---- open / close ----------------------------------------------------------
  function open(a) {
    if (busy) return;
    if (!box) build();
    var strip = a.closest('[data-lightbox]');
    links = Array.prototype.slice.call(strip.querySelectorAll('a'));
    index = links.indexOf(a);
    opener = a;
    busy = true;
    loadSize(a).then(function () {
      document.documentElement.classList.add('lb-open');
      box.hidden = false;
      setUi();
      frame = makeFrame(a);
      var r = place(frame, a);
      var thumbRect = a.getBoundingClientRect();
      hideThumb(a, true);
      bg.animate([{ opacity: 0 }, { opacity: 1 }], { duration: OPEN_MS * 0.7, easing: 'ease-out', fill: 'both' });
      box.querySelectorAll('.lb-btn, .lb-count').forEach(function (b) {
        b.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, delay: OPEN_MS * 0.5, fill: 'both' });
      });
      var anim = reduce
        ? frame.animate([{ opacity: 0 }, { opacity: 1 }], { duration: OPEN_MS, easing: 'ease-out' })
        : frame.animate([fromThumb(r, thumbRect), REST], { duration: OPEN_MS, easing: EASE });
      anim.onfinish = function () { busy = false; };
      closeBtn.focus({ preventScroll: true });
      // warm up the neighbours
      [index - 1, index + 1].forEach(function (i) { if (links[i]) { loadSize(links[i]); new Image().src = links[i].href; } });
    });
  }

  function close() {
    if (busy || !box || box.hidden) return;
    busy = true;
    var a = links[index];
    var f = frame;
    var r = f.getBoundingClientRect();
    var r0 = { left: parseFloat(f.style.left), top: parseFloat(f.style.top), width: parseFloat(f.style.width), height: parseFloat(f.style.height) };
    var thumbRect = a.getBoundingClientRect();
    var back = !reduce && visible(thumbRect);
    var current = getComputedStyle(f).transform;
    var start = { transform: current === 'none' ? REST.transform : current, clipPath: REST.clipPath, opacity: 1 };
    var end = back ? fromThumb(r0, thumbRect) : { transform: 'translate(0px,0px) scale(.94)', clipPath: REST.clipPath };
    end.opacity = back ? 1 : 0;
    bg.animate([{ opacity: 1 }, { opacity: 0 }], { duration: CLOSE_MS, easing: 'ease-in', fill: 'both' });
    box.querySelectorAll('.lb-btn, .lb-count').forEach(function (b) {
      b.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 120, fill: 'both' });
    });
    var anim = f.animate([start, end], { duration: CLOSE_MS, easing: back ? EASE : 'ease-in', fill: 'forwards' });
    anim.onfinish = function () {
      hideThumb(a, false);
      f.remove();
      frame = null;
      box.hidden = true;
      document.documentElement.classList.remove('lb-open');
      busy = false;
      // Return focus to the thumbnail now showing, without jumping the page.
      a.focus({ preventScroll: true });
    };
  }

  // Move to the previous (-1) or next (+1) image: the old one slides and fades
  // out, the new one slides in from the side it came from.
  function go(dir, fromDrag) {
    var to = index + dir;
    if (busy || !links[to]) {
      if (fromDrag && frame) frame.animate([{ transform: frame.style.transform || REST.transform }, REST], { duration: 220, easing: EASE });
      if (frame) frame.style.transform = '';
      return;
    }
    busy = true;
    var old = frame, oldA = links[index];
    index = to;
    var a = links[index];
    setUi();
    loadSize(a).then(function () {
      var shift = reduce ? 0 : 60;
      var oldT = old.style.transform || REST.transform;
      old.style.transform = '';
      old.animate([{ transform: oldT, opacity: 1 }, { transform: 'translateX(' + (-dir * shift) + 'px)', opacity: 0 }],
        { duration: 260, easing: 'ease-in', fill: 'forwards' }).onfinish = function () { old.remove(); };
      hideThumb(oldA, false);
      hideThumb(a, true);
      frame = makeFrame(a);
      place(frame, a);
      frame.animate([{ transform: 'translateX(' + (dir * shift) + 'px)', opacity: 0 }, { transform: 'translateX(0px)', opacity: 1 }],
        { duration: 320, delay: 60, easing: EASE, fill: 'backwards' }).onfinish = function () { busy = false; };
      var next = links[index + dir];
      if (next) { loadSize(next); new Image().src = next.href; }
    });
  }

  function onKey(e) {
    if (!box || box.hidden) return;
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
    else if (e.key === 'Tab') {
      // keep focus inside the viewer
      var f = Array.prototype.filter.call(box.querySelectorAll('button'), function (b) { return !b.hidden && !b.disabled; });
      var i = f.indexOf(document.activeElement);
      e.preventDefault();
      f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
    }
  }

  // ---- swipe: sideways moves between images, down closes ---------------------
  var dragged = false;
  function setupSwipe() {
    var x0, y0, dx, dy, id = null, axis;
    stage.addEventListener('pointerdown', function (e) {
      if (busy || !frame || e.button > 0) return;
      id = e.pointerId; x0 = e.clientX; y0 = e.clientY; dx = dy = 0; axis = null; dragged = false;
    });
    stage.addEventListener('pointermove', function (e) {
      if (e.pointerId !== id || !frame) return;
      dx = e.clientX - x0; dy = e.clientY - y0;
      if (!axis && Math.abs(dx) + Math.abs(dy) > 8) {
        axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
        dragged = true;
        try { stage.setPointerCapture(id); } catch (err) {}
      }
      if (axis === 'x') {
        var edge = (dx > 0 && index === 0) || (dx < 0 && index === links.length - 1);
        frame.style.transform = 'translateX(' + (edge ? dx / 3 : dx) + 'px)';
      } else if (axis === 'y' && dy > 0) {
        frame.style.transform = 'translateY(' + dy + 'px) scale(' + Math.max(0.8, 1 - dy / 1200) + ')';
        bg.style.opacity = Math.max(0.3, 1 - dy / 400);
      }
    });
    function end(e) {
      if (e.pointerId !== id) return;
      id = null;
      if (!frame) return;
      if (axis === 'x' && Math.abs(dx) > 60) { go(dx < 0 ? 1 : -1, true); }
      else if (axis === 'y' && dy > 90) { bg.style.opacity = ''; close(); }
      else if (axis) {
        var t = frame.style.transform;
        frame.style.transform = '';
        frame.animate([{ transform: t }, { transform: REST.transform }], { duration: 220, easing: EASE });
        bg.style.opacity = '';
      }
      setTimeout(function () { dragged = false; }, 0);
    }
    stage.addEventListener('pointerup', end);
    stage.addEventListener('pointercancel', end);
  }

  // ---- hook up the strips ------------------------------------------------------
  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest && e.target.closest('[data-lightbox] a');
    if (!a) return;
    e.preventDefault();
    open(a);
  });
})();
