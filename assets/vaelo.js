/* ==========================================================================
   VAELO — motion. Zero dependencies.

   Everything here used to run on GSAP from a CDN. When that request fails
   (blocked network, offline, ad-blocker, CSP) the page lost every animation
   and the pinned work rail stopped moving entirely. So the motion is now
   native: sticky positioning, IntersectionObserver, requestAnimationFrame
   and CSS transitions. Nothing to fetch, nothing to fail.

   The `js` class on <html> gates every hide-then-reveal rule, so with
   scripting off the page is simply static and fully readable.
   ========================================================================== */
(function () {
  'use strict';
  var doc = document, root = doc.documentElement;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  root.classList.add('js');
  if (reduce) root.classList.add('no-motion');

  function on(el, ev, fn, o) { if (el) el.addEventListener(ev, fn, o); }
  var rafQueue = [], rafPending = false;
  function onScroll(fn) { rafQueue.push(fn); }
  function pump() {
    rafPending = false;
    for (var i = 0; i < rafQueue.length; i++) rafQueue[i]();
  }
  addEventListener('scroll', function () {
    if (!rafPending) { rafPending = true; requestAnimationFrame(pump); }
  }, { passive: true });
  addEventListener('resize', function () {
    if (!rafPending) { rafPending = true; requestAnimationFrame(pump); }
  });

  /* ---------------------------------------------------------------- nav */
  var burger = doc.querySelector('.burger');
  on(burger, 'click', function () {
    var open = doc.body.classList.toggle('menu');
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  doc.querySelectorAll('.nav-links a').forEach(function (a) {
    on(a, 'click', function () {
      doc.body.classList.remove('menu');
      if (burger) burger.setAttribute('aria-expanded', 'false');
    });
  });

  /* ------------------------------------------------------------- cursor */
  var cur = doc.querySelector('.cursor');
  if (cur && matchMedia('(hover:hover)').matches && !reduce) {
    var cx = 0, cy = 0, tx = 0, ty = 0;
    on(window, 'pointermove', function (e) { tx = e.clientX; ty = e.clientY; });
    (function spin() {
      cx += (tx - cx) * 0.17; cy += (ty - cy) * 0.17;
      cur.style.transform = 'translate(' + cx + 'px,' + cy + 'px) translate(-50%,-50%)';
      requestAnimationFrame(spin);
    })();
    doc.querySelectorAll('a,button').forEach(function (el) {
      on(el, 'pointerenter', function () { cur.classList.add('big'); });
      on(el, 'pointerleave', function () { cur.classList.remove('big'); });
    });
  }

  /* ----------------------------------------------------- page transition */
  var wipe = doc.querySelector('.wipe');
  if (wipe && !reduce) {
    wipe.classList.add('in');
    requestAnimationFrame(function () {
      setTimeout(function () { wipe.classList.remove('in'); wipe.classList.add('out'); }, 30);
    });
    doc.querySelectorAll('a[href]').forEach(function (a) {
      var url = a.getAttribute('href');
      if (!url || url.charAt(0) === '#' || url.indexOf('mailto:') === 0 || a.target) return;
      on(a, 'click', function (e) {
        if (e.metaKey || e.ctrlKey || e.shiftKey) return;
        e.preventDefault();
        wipe.classList.remove('out'); wipe.classList.add('in');
        setTimeout(function () { location.href = url; }, 470);
      });
    });
  }

  /* ---------------------------------------------------------- hero intro */
  /* CSS runs the masked lines; the class just starts them in sequence. */
  requestAnimationFrame(function () { doc.body.classList.add('lit'); });

  /* --------------------------------------------------- hero backdrop ---
     A showreel takes over when the file exists. Until then a generative
     canvas carries the motion so the hero is never a flat black box. */
  var hv = doc.getElementById('heroVideo'), canvas = doc.getElementById('heroCanvas');
  if (hv) {
    on(hv, 'canplay', function () {
      hv.style.display = '';
      if (canvas) canvas.style.display = 'none';
      var pr = hv.play();
      if (pr && pr.catch) pr.catch(function () {
        hv.style.display = 'none';
        if (canvas) canvas.style.display = '';
      });
    });
    on(hv, 'error', function () { hv.style.display = 'none'; });
    if (reduce) hv.pause();
  }
  if (canvas && canvas.getContext) {
    var ctx = canvas.getContext('2d'), W = 0, H = 0, live = true;
    var plumes = [
      { x: .30, y: .32, r: .52, c: 'rgba(214,255,63,',  a: .30, sx: .00021, sy: .00014, p: 0 },
      { x: .74, y: .62, r: .60, c: 'rgba(180,178,166,', a: .26, sx: -.00016, sy: .00019, p: 2 },
      { x: .52, y: .84, r: .46, c: 'rgba(120,124,110,', a: .30, sx: .00013, sy: -.00021, p: 4 },
      { x: .12, y: .74, r: .38, c: 'rgba(244,242,236,', a: .13, sx: .00019, sy: .00011, p: 1 }
    ];
    var sizeCanvas = function () {
      W = canvas.width = Math.max(1, Math.round(innerWidth / 6));
      H = canvas.height = Math.max(1, Math.round(innerHeight / 6));
    };
    sizeCanvas();
    on(window, 'resize', sizeCanvas);
    var paint = function (t) {
      ctx.fillStyle = '#050505'; ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';
      for (var i = 0; i < plumes.length; i++) {
        var pl = plumes[i];
        var px = (pl.x + Math.sin(t * pl.sx + pl.p) * 0.16) * W;
        var py = (pl.y + Math.cos(t * pl.sy + pl.p) * 0.14) * H;
        var rad = pl.r * Math.max(W, H) * (0.85 + Math.sin(t * 0.0002 + pl.p) * 0.15);
        var g = ctx.createRadialGradient(px, py, 0, px, py, rad);
        g.addColorStop(0, pl.c + pl.a + ')');
        g.addColorStop(1, pl.c + '0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(px, py, rad, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';
    };
    if (reduce) { paint(0); }
    else {
      (function draw(t) { if (live) { paint(t); requestAnimationFrame(draw); } })(0);
      on(doc, 'visibilitychange', function () {
        live = !doc.hidden;
        if (live) requestAnimationFrame(function d(t) { if (live) { paint(t); requestAnimationFrame(d); } });
      });
    }
  }

  /* ------------------------------------------------------------ marquee */
  var track = doc.querySelector('.track');
  if (track && !reduce) {
    var mx = 0, half = 0, speed = 0.035, boost = 0, lastY = scrollY;
    var measure = function () { half = track.scrollWidth / 2; };
    measure();
    on(window, 'resize', measure);
    onScroll(function () {
      boost = Math.min(2.6, Math.abs(scrollY - lastY) / 26);
      lastY = scrollY;
    });
    (function run(t, prev) {
      var dt = prev ? Math.min(48, t - prev) : 16;
      mx -= (speed * (1 + boost)) * dt;
      boost *= 0.94;
      if (half && -mx >= half) mx += half;
      track.style.transform = 'translate3d(' + mx + 'px,0,0)';
      requestAnimationFrame(function (n) { run(n, t); });
    })(0, 0);
  }

  /* -------------------------------------------------------- work rail ---
     Sticky section, driven by its own scroll progress. Pure transform, so
     the page itself never scrolls sideways. Below 900px it unpins and the
     rail stacks vertically (handled in CSS). */
  var railWrap = doc.getElementById('railWrap'),
      rail = doc.getElementById('rail'),
      prog = doc.getElementById('prog');

  if (rail && railWrap) {
    var wide = false, travel = 0;
    var fit = function () {
      wide = innerWidth > 900 && !reduce;
      if (!wide) {
        rail.style.transform = '';
        railWrap.style.height = '';
        return;
      }
      travel = Math.max(0, rail.scrollWidth - innerWidth + innerWidth * 0.08);
      /* the section is exactly as tall as the distance the rail must cover,
         plus one viewport to hold it — no arbitrary 360vh */
      railWrap.style.height = (innerHeight + travel) + 'px';
    };
    var drive = function () {
      if (!wide) { if (prog) prog.style.width = '100%'; return; }
      var box = railWrap.getBoundingClientRect();
      var span = railWrap.offsetHeight - innerHeight;
      var p = span > 0 ? Math.min(1, Math.max(0, -box.top / span)) : 0;
      rail.style.transform = 'translate3d(' + (-p * travel) + 'px,0,0)';
      if (prog) prog.style.width = (5 + p * 95) + '%';
    };
    fit(); drive();
    on(window, 'resize', function () { fit(); drive(); });
    onScroll(drive);
    /* the rail is built from data after this file may have run, so re-fit */
    setTimeout(function () { fit(); drive(); }, 60);
    on(window, 'load', function () { fit(); drive(); });
  }

  /* ------------------------------------------------------- scroll reveal */
  var revs = doc.querySelectorAll('[data-rev]');
  if (revs.length) {
    if (reduce || !('IntersectionObserver' in window)) {
      revs.forEach(function (el) { el.classList.add('in'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          var el = e.target;
          /* stagger children of a group */
          var kids = el.hasAttribute('data-stagger') ? el.children : null;
          if (kids) {
            Array.prototype.forEach.call(kids, function (k, i) {
              k.style.transitionDelay = (i * 80) + 'ms';
              k.classList.add('in');
            });
          }
          el.classList.add('in');
          io.unobserve(el);
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
      revs.forEach(function (el) { io.observe(el); });
    }
  }

  /* ------------------------------------------------------------ parallax */
  var pars = doc.querySelectorAll('[data-par]');
  if (pars.length && !reduce) {
    var move = function () {
      var vh = innerHeight;
      pars.forEach(function (el) {
        var b = el.getBoundingClientRect();
        if (b.bottom < -200 || b.top > vh + 200) return;
        var mid = (b.top + b.height / 2 - vh / 2) / vh;   /* -1 … 1 */
        var amt = parseFloat(el.dataset.par) || 6;
        el.style.setProperty('--py', (mid * amt).toFixed(2) + '%');
      });
    };
    move(); onScroll(move); on(window, 'load', move);
  }

  /* ------------------------------------------------- statement warm-up */
  var stmt = doc.querySelector('[data-warm]');
  if (stmt) {
    var walk = doc.createTreeWalker(stmt, NodeFilter.SHOW_TEXT), nodes = [], n;
    while ((n = walk.nextNode())) nodes.push(n);
    nodes.forEach(function (node) {
      if (!node.nodeValue.trim()) return;
      var frag = doc.createDocumentFragment();
      node.nodeValue.split(/(\s+)/).forEach(function (part) {
        if (!part.trim()) { frag.appendChild(doc.createTextNode(part)); return; }
        var s = doc.createElement('span'); s.className = 'w'; s.textContent = part;
        frag.appendChild(s);
      });
      node.parentNode.replaceChild(frag, node);
    });
    var words = stmt.querySelectorAll('.w');
    if (reduce) { words.forEach(function (w) { w.classList.add('on'); }); }
    else {
      var warm = function () {
        var line = innerHeight * 0.74;
        for (var i = 0; i < words.length; i++) {
          if (words[i].getBoundingClientRect().top < line) words[i].classList.add('on');
        }
      };
      warm(); onScroll(warm);
    }
  }

  /* ------------------------------------------------------------ counters */
  var counters = doc.querySelectorAll('[data-count]');
  if (counters.length) {
    if (reduce || !('IntersectionObserver' in window)) {
      counters.forEach(function (el) { el.textContent = el.dataset.count; });
    } else {
      var cio = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          var el = e.target, to = parseFloat(el.dataset.count), t0 = performance.now();
          (function step(t) {
            var k = Math.min(1, (t - t0) / 1300);
            el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3)));
            if (k < 1) requestAnimationFrame(step);
          })(t0);
          cio.unobserve(el);
        });
      }, { threshold: 0.4 });
      counters.forEach(function (el) { el.textContent = '0'; cio.observe(el); });
    }
  }

  /* -------------------------------------------------------- accordions */
  doc.querySelectorAll('.svc-hd').forEach(function (hd) {
    on(hd, 'click', function () {
      var open = hd.parentElement.classList.toggle('open');
      hd.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  });

  /* ------------------------------------------------------- archive tabs */
  var tabs = doc.querySelectorAll('.tab-btn');
  if (tabs.length) {
    tabs.forEach(function (btn) {
      on(btn, 'click', function () {
        var cat = btn.dataset.cat;
        tabs.forEach(function (b) {
          var sel = b === btn;
          b.classList.toggle('on', sel);
          b.setAttribute('aria-selected', sel ? 'true' : 'false');
        });
        doc.querySelectorAll('.arch-item').forEach(function (item, i) {
          var show = cat === 'all' || item.dataset.cat === cat;
          item.hidden = !show;
          if (show) {
            item.classList.remove('in');
            item.style.transitionDelay = (i * 55) + 'ms';
            requestAnimationFrame(function () {
              requestAnimationFrame(function () { item.classList.add('in'); });
            });
          }
        });
      });
    });
  }
})();
