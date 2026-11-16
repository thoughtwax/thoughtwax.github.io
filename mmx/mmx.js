/* MMX: tag index, tag pages, timeline, and a lightbox that zooms out of the grid.
   Data: /mmx/items.json, built by _mmx/build.py. No dependencies. */
(function () {
  'use strict';

  var main = document.getElementById('mmx');
  var lb = document.getElementById('lb');
  var stage = lb.querySelector('.lb-stage');
  var cap = lb.querySelector('.lb-cap');
  var bg = lb.querySelector('.lb-bg');
  var DUR = 420;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var DATA = null, byId = {};
  var current = { view: null, tag: null, list: [] };

  // ---------- helpers ----------
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function slug(t) { return encodeURIComponent(t.replace(/ /g, '-')); }
  function unslug(s) { return decodeURIComponent(s).replace(/-/g, ' '); }
  function media(i, k) { return '/mmx/' + i.media[k]; }
  function ratio(i) { return i.media ? i.media.w / i.media.h : 1.25; }
  function host(u) { try { return new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return ''; } }
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function day(d) { d = new Date(d); return d.getUTCDate() + ' ' + MONTHS[d.getUTCMonth()] + ' ' + d.getUTCFullYear(); }
  function month(d) { d = new Date(d); return MONTHS[d.getUTCMonth()] + ' ' + d.getUTCFullYear(); }
  function title(i) { return i.title || (i.excerpt ? i.excerpt.slice(0, 80) : '') || host(i.url) || 'Untitled'; }

  // ---------- routing: #/  #/tag/<t>  #/timeline  (+ /i/<id>) ----------
  function parse() {
    var h = location.hash.replace(/^#\/?/, '');
    var m = h.match(/^(.*?)(?:\/?i\/([\w-]+))?$/);
    var base = m[1], item = m[2] || null, p = base.split('/');
    if (p[0] === 'tag' && p[1]) return { view: 'tag', tag: unslug(p[1]), item: item, base: '#/tag/' + p[1] };
    if (p[0] === 'timeline') return { view: 'timeline', item: item, base: '#/timeline' };
    return { view: 'tags', item: item, base: '#/' };
  }
  function itemHash(id) { var b = parse().base; return (b === '#/' ? '#/timeline' : b) + '/i/' + id; }

  function route() {
    var r = parse();
    if (r.view !== current.view || r.tag !== current.tag) render(r);
    if (r.item && !LB.isOpen && byId[r.item]) {
      if (r.view === 'tags') { history.replaceState(null, '', '#/timeline/i/' + r.item); return route(); }
      LB.open(r.item, findTile(r.item), false);
    } else if (!r.item && LB.isOpen) {
      LB.close(true);
    }
  }

  // ---------- views ----------
  function render(r) {
    current.view = r.view; current.tag = r.tag || null;
    document.querySelectorAll('.mmx-nav a').forEach(function (a) {
      a.classList.toggle('on', a.dataset.view === (r.view === 'tag' ? 'tags' : r.view));
    });
    main.innerHTML = '';
    window.scrollTo(0, 0);
    if (r.view === 'tags') return renderIndex();
    if (r.view === 'tag') {
      var list = DATA.items.filter(function (i) { return (i.tags || []).indexOf(r.tag) > -1; });
      current.list = list;
      var head = el('div', 'view-head', '<h2>' + esc(r.tag) + '</h2><span class="n">' + list.length + ' things</span>');
      main.appendChild(head);
      var g = el('div', 'grid'); main.appendChild(g); fill(g, list);
      main.appendChild(el('a', 'back', '← All tags')).href = '#/';
      document.title = r.tag + ' — MMX';
      return;
    }
    // timeline, grouped by month
    current.list = DATA.items;
    document.title = 'Timeline — MMX';
    var groups = [], last = null;
    DATA.items.forEach(function (i) {
      var m = month(i.added);
      if (m !== last) { groups.push({ m: m, items: [] }); last = m; }
      groups[groups.length - 1].items.push(i);
    });
    groups.forEach(function (gr) {
      main.appendChild(el('h3', 'month', gr.m + ' <span>· ' + gr.items.length + '</span>'));
      var g = el('div', 'grid'); main.appendChild(g); fill(g, gr.items);
    });
  }

  function renderIndex() {
    document.title = 'MMX — thoughtwax';
    current.list = [];
    var ul = el('ul', 'tag-index');
    Object.keys(DATA.tags).forEach(function (t) {
      var items = DATA.items.filter(function (i) { return (i.tags || []).indexOf(t) > -1 && i.media; }).slice(0, 8);
      var strip = items.map(function (i) {
        return '<span style="width:' + Math.round(56 * Math.min(Math.max(ratio(i), .6), 1.8)) + 'px;background-color:' + (i.media.color || '#e9e7e0') + ';background-image:url(' + media(i, 'thumb') + ')"></span>';
      }).join('');
      var li = el('li', null, '<a href="#/tag/' + slug(t) + '"><span class="tag-name">' + esc(t) + '<sup>' + DATA.tags[t] + '</sup></span><span class="tag-strip">' + strip + '</span></a>');
      ul.appendChild(li);
    });
    var untagged = DATA.items.filter(function (i) { return !(i.tags || []).length; }).length;
    main.appendChild(ul);
    if (untagged) main.appendChild(el('p', 'month', untagged + ' more things are untagged. <a href="#/timeline">See everything in the timeline →</a>'));
  }

  // ---------- justified grid ----------
  var grids = [];
  function fill(g, list) {
    list.forEach(function (i) {
      var a = el('a', 'tile' + (i.media ? '' : ' text') + (i.media && i.media.video ? ' vid' : ''));
      a.href = '#'; a.dataset.id = i.id;
      a.setAttribute('aria-label', title(i));
      if (i.media) {
        a.style.backgroundColor = i.media.color || '';
        var img = new Image();
        img.loading = 'lazy'; img.decoding = 'async'; img.alt = '';
        img.onload = function () { img.classList.add('in'); };
        img.src = media(i, 'thumb');
        a.appendChild(img);
      } else {
        a.innerHTML = '<b>' + esc(i.excerpt || i.title || '') + '</b><small>' + esc(i.creator || host(i.url)) + '</small>';
      }
      g.appendChild(a);
    });
    grids.push({ g: g, list: list });
    layout(g, list);
  }
  function layout(g, list) {
    var W = g.clientWidth; if (!W) return;
    var gap = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--gap')) || 8;
    var H = W < 600 ? 132 : 224;
    var tiles = g.children, row = [], sum = 0;
    function flush(last) {
      var avail = W - gap * (row.length - 1);
      var h = last ? Math.min(H, avail / sum) : avail / sum;
      row.forEach(function (r) {
        tiles[r.k].style.width = Math.floor(r.ar * h) + 'px';
        tiles[r.k].style.height = Math.round(h) + 'px';
      });
      row = []; sum = 0;
    }
    for (var k = 0; k < list.length; k++) {
      var ar = Math.min(Math.max(ratio(list[k]), .4), 3);
      row.push({ k: k, ar: ar }); sum += ar;
      if (sum * H + gap * (row.length - 1) >= W) flush(false);
    }
    if (row.length) flush(true);
  }
  var rz;
  window.addEventListener('resize', function () {
    clearTimeout(rz);
    rz = setTimeout(function () {
      grids = grids.filter(function (x) { return document.body.contains(x.g); });
      grids.forEach(function (x) { layout(x.g, x.list); });
    }, 80);
  });

  function findTile(id) { return main.querySelector('.tile[data-id="' + id + '"]'); }

  main.addEventListener('click', function (e) {
    var t = e.target.closest('.tile');
    if (!t || e.metaKey || e.ctrlKey) return;
    e.preventDefault();
    LB.open(t.dataset.id, t, true);
  });

  // ---------- lightbox ----------
  var LB = (function () {
    var api = { isOpen: false }, list = [], idx = 0, fig = null, tile = null, pushed = false, busy = false;

    function vp() { return { w: window.innerWidth, h: window.innerHeight }; }
    // Where an item sits when open: fitted into the space above the caption.
    function target(i) {
      var v = vp(), phone = v.w < 640;
      var top = phone ? 56 : 64, side = phone ? 0 : 80, bottom = phone ? 152 : 136;
      var bw = v.w - side * 2, bh = v.h - top - bottom;
      if (!i.media) { var w = Math.min(560, v.w - 32); return { x: (v.w - w) / 2, y: top + Math.max(0, (bh - 320) / 2), w: w, h: Math.min(320, bh) }; }
      var ar = i.media.w / i.media.h;
      var maxW = Math.min(bw, i.media.w * (phone ? 3 : 1.5)), w = maxW, h = w / ar;
      if (h > bh) { h = bh; w = h * ar; }
      return { x: (v.w - w) / 2, y: top + (bh - h) / 2, w: w, h: h };
    }
    function place(f, t, from) {
      // f is sized to t; from (optional) is the rect it appears to come from
      f.style.width = t.w + 'px'; f.style.height = t.h + 'px';
      if (from) f.style.transform = 'translate(' + from.left + 'px,' + from.top + 'px) scale(' + from.width / t.w + ',' + from.height / t.h + ')';
      else f.style.transform = 'translate(' + t.x + 'px,' + t.y + 'px)';
    }
    function anim(f, on, ms) { f.style.transition = on ? 'transform ' + (ms || DUR) + 'ms var(--ease), opacity ' + (ms || DUR) + 'ms var(--ease)' : 'none'; }

    function build(i) {
      var f = el('div', 'lb-fig');
      if (i.media) {
        f.style.backgroundColor = i.media.color || '#e9e7e0';
        var th = new Image(); th.src = media(i, 'thumb'); th.alt = ''; f.appendChild(th);
        if (i.media.video) {
          var v = document.createElement('video');
          v.src = media(i, 'video'); v.muted = true; v.loop = true; v.autoplay = true; v.playsInline = true; v.className = 'full';
          v.addEventListener('playing', function () { v.classList.add('in'); });
          f.appendChild(v);
        } else {
          var full = new Image(); full.alt = title(i); full.className = 'full'; full.decoding = 'async';
          full.onload = function () { full.classList.add('in'); };
          full.src = media(i, 'src');
          f.appendChild(full);
        }
      } else {
        f.className += ' textcard';
        f.innerHTML = '<p>' + esc(i.excerpt || i.title) + '</p>';
      }
      return f;
    }
    function caption(i) {
      var bits = [];
      if (i.creator || i.url) bits.push(i.url ? '<a href="' + esc(i.url) + '" target="_blank" rel="noopener">' + esc(i.creator || host(i.url)) + ' ↗</a>' : esc(i.creator));
      bits.push('Saved ' + day(i.added));
      bits.push((idx + 1) + ' / ' + list.length);
      var tags = (i.tags || []).map(function (t) { return '<a href="#/tag/' + slug(t) + '">' + esc(t) + '</a>'; }).join('');
      cap.innerHTML = (i.title ? '<h3>' + esc(i.title) + '</h3>' : '') + '<div class="meta">' + bits.join(' · ') + '</div>' + (tags ? '<div class="tags">' + tags + '</div>' : '');
      cap.classList.remove('in'); void cap.offsetWidth; cap.classList.add('in');
    }
    function preload(k) { var i = list[k]; if (i && i.media && !i.media.video) { var im = new Image(); im.src = media(i, 'src'); } }
    function setTile(t) { if (tile) tile.classList.remove('ghost'); tile = t; if (tile) tile.classList.add('ghost'); }

    api.open = function (id, fromTile, push) {
      if (api.isOpen || busy) return;
      list = current.list.length ? current.list : DATA.items;
      idx = Math.max(0, list.findIndex(function (x) { return x.id === id; }));
      var i = list[idx];
      api.isOpen = true; busy = true;
      if (push) { history.pushState(null, '', itemHash(id)); pushed = true; } else pushed = false;
      lb.hidden = false; document.body.classList.add('lb-on');
      fig = build(i); stage.appendChild(fig);
      var t = target(i), r = fromTile && i.media && !reduced ? fromTile.getBoundingClientRect() : null;
      anim(fig, false);
      if (r) { place(fig, t, r); setTile(fromTile); }
      else { place(fig, t); fig.style.opacity = 0; fig.style.transform += ' scale(.96)'; }
      void fig.offsetWidth;
      requestAnimationFrame(function () {
        lb.classList.add('open');
        anim(fig, true); place(fig, t); fig.style.opacity = 1;
        caption(i);
        setTimeout(function () { busy = false; }, DUR);
      });
      preload(idx + 1); preload(idx - 1);
      lb.querySelector('.lb-close').focus({ preventScroll: true });
    };

    api.close = function (fromHistory) {
      if (!api.isOpen) return;
      if (!fromHistory && pushed) { history.back(); return; } // popstate brings us back here
      if (!fromHistory) history.replaceState(null, '', parse().base);
      api.isOpen = false; busy = true;
      var i = list[idx], f = fig, t = findTile(i.id), r = t && i.media && !reduced ? t.getBoundingClientRect() : null;
      var onScreen = r && r.bottom > 0 && r.top < window.innerHeight;
      setTile(onScreen ? t : null);
      lb.classList.remove('open'); cap.classList.remove('in');
      anim(f, true, onScreen ? DUR : 260);
      if (onScreen) place(f, target(i), r);
      else { f.style.opacity = 0; f.style.transform += ' scale(.96)'; }
      setTimeout(function () {
        f.remove(); setTile(null); fig = null; busy = false;
        lb.hidden = true; document.body.classList.remove('lb-on');
        if (t) t.focus({ preventScroll: true });
      }, onScreen ? DUR : 260);
    };

    api.go = function (dir) {
      if (!api.isOpen || busy) return;
      var n = idx + dir; if (n < 0 || n >= list.length) { bounce(dir); return; }
      busy = true;
      var old = fig, v = vp();
      idx = n; var i = list[idx];
      history.replaceState(null, '', itemHash(i.id));
      var t = target(i);
      fig = build(i); stage.appendChild(fig);
      anim(fig, false); place(fig, t);
      fig.style.transform = 'translate(' + (t.x + dir * v.w * .35) + 'px,' + t.y + 'px)'; fig.style.opacity = 0;
      void fig.offsetWidth;
      anim(old, true, 360); anim(fig, true, 360);
      var ot = old.style.transform.match(/translate\(([-\d.]+)px,\s*([-\d.]+)px\)/);
      old.style.transform = 'translate(' + (parseFloat(ot[1]) - dir * v.w * .35) + 'px,' + ot[2] + 'px)'; old.style.opacity = 0;
      place(fig, t); fig.style.opacity = 1;
      caption(i);
      var nt = findTile(i.id); setTile(null); tile = null;
      if (nt) { var rr = nt.getBoundingClientRect(); if (rr.bottom < 0 || rr.top > v.h) nt.scrollIntoView({ block: 'center' }); }
      setTimeout(function () { old.remove(); busy = false; }, 360);
      preload(idx + dir);
    };
    function bounce(dir) {
      var t = target(list[idx]);
      anim(fig, true, 160); fig.style.transform = 'translate(' + (t.x + dir * 24) + 'px,' + t.y + 'px)';
      setTimeout(function () { place(fig, t); }, 160);
    }

    // drag: sideways to step through, down to dismiss
    var drag = null;
    stage.addEventListener('pointerdown', function (e) {
      if (!api.isOpen || busy || e.button) return;
      drag = { x: e.clientX, y: e.clientY, t: Date.now(), axis: null, onFig: !!e.target.closest('.lb-fig') };
      stage.setPointerCapture(e.pointerId);
    });
    stage.addEventListener('pointermove', function (e) {
      if (!drag) return;
      var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (!drag.axis && Math.hypot(dx, dy) > 8) drag.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      if (!drag.axis) return;
      var t = target(list[idx]); anim(fig, false);
      if (drag.axis === 'x') {
        var edge = (idx === 0 && dx > 0) || (idx === list.length - 1 && dx < 0);
        fig.style.transform = 'translate(' + (t.x + (edge ? dx / 3 : dx)) + 'px,' + t.y + 'px)';
      } else {
        var s = 1 - Math.min(Math.max(dy, 0) / window.innerHeight, .4);
        fig.style.transform = 'translate(' + (t.x + dx * .5 + t.w * (1 - s) / 2) + 'px,' + (t.y + dy) + 'px) scale(' + s + ')';
        bg.style.transition = 'none'; bg.style.opacity = .97 * (1 - Math.min(Math.abs(dy) / 400, .8));
        cap.style.opacity = 1 - Math.min(Math.abs(dy) / 120, 1);
      }
      drag.dx = dx; drag.dy = dy;
    });
    function endDrag(e) {
      if (!drag) return;
      var d = drag; drag = null;
      bg.style.transition = ''; bg.style.opacity = ''; cap.style.opacity = '';
      var dt = Math.max(Date.now() - d.t, 1);
      if (!d.axis) { if (!d.onFig) api.close(); return; }
      var t = target(list[idx]);
      if (d.axis === 'x' && (Math.abs(d.dx) > 80 || Math.abs(d.dx) / dt > .5)) { api.go(d.dx < 0 ? 1 : -1); return; }
      if (d.axis === 'y' && (d.dy > 120 || d.dy / dt > .6)) { api.close(); return; }
      anim(fig, true, 300); place(fig, t);
    }
    stage.addEventListener('pointerup', endDrag);
    stage.addEventListener('pointercancel', endDrag);

    lb.querySelector('.lb-close').onclick = function () { api.close(); };
    lb.querySelector('.lb-prev').onclick = function () { api.go(-1); };
    lb.querySelector('.lb-next').onclick = function () { api.go(1); };
    cap.addEventListener('click', function (e) {
      var a = e.target.closest('a[href^="#/tag/"]'); if (!a) return;
      e.preventDefault();
      var href = a.getAttribute('href');
      api.isOpen = false; // close quietly, then go to the tag
      fig && fig.remove(); fig = null; setTile(null);
      lb.classList.remove('open'); lb.hidden = true; document.body.classList.remove('lb-on');
      history.replaceState(null, '', href); route();
    });
    document.addEventListener('keydown', function (e) {
      if (!api.isOpen) return;
      if (e.key === 'Escape') api.close();
      else if (e.key === 'ArrowRight') api.go(1);
      else if (e.key === 'ArrowLeft') api.go(-1);
    });
    window.addEventListener('resize', function () { if (api.isOpen && fig && !busy) { anim(fig, false); place(fig, target(list[idx])); } });
    return api;
  })();

  // ---------- boot ----------
  fetch('/mmx/items.json').then(function (r) { return r.json(); }).then(function (d) {
    DATA = d;
    d.items.forEach(function (i) { byId[i.id] = i; });
    document.getElementById('mmx-count').textContent = d.items.length + ' things so far.';
    window.addEventListener('popstate', route);
    window.addEventListener('hashchange', route);
    route();
  });
})();
