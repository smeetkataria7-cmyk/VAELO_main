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

    /* The browser's back/forward button can restore this exact page from
       bfcache without re-running any script - including the moment right
       after the block above set the curtain to "in" on the way out. Left
       alone, that freezes the page under a solid green curtain until the
       visitor manually reloads. Force it back to hidden on any bfcache
       restore. */
    on(window, 'pageshow', function (e) {
      if (e.persisted) { wipe.classList.remove('in'); wipe.classList.add('out'); }
    });
  }

  /* ------------------------------------------------------- smooth scroll ---
     Wheel input is captured and eased into the real scroll position rather
     than a transformed wrapper. That distinction matters here: position:
     sticky, IntersectionObserver, anchor links and the rail's own maths all
     read genuine scrollY, so they keep working untouched — a wrapper
     transform would break the pinned rail outright.

     Only pointer devices are affected. Touch already has momentum of its own
     and is left alone, as is reduced-motion. */
  (function () {
    if (reduce) return;
    if (!matchMedia('(hover:hover) and (pointer:fine)').matches) return;

    var target = scrollY, current = scrollY, running = false, ease = 0.115;

    var maxScroll = function () {
      return Math.max(0, doc.documentElement.scrollHeight - innerHeight);
    };

    /* a wheel inside something that scrolls on its own is left to it */
    var nativeZone = function (node) {
      for (var el = node; el && el !== doc.body; el = el.parentElement) {
        if (el.dataset && el.dataset.nativeScroll !== undefined) return true;
        var s = getComputedStyle(el);
        var oy = s.overflowY, ox = s.overflowX;
        if ((oy === 'auto' || oy === 'scroll') && el.scrollHeight > el.clientHeight + 2) return true;
        if ((ox === 'auto' || ox === 'scroll') && el.scrollWidth > el.clientWidth + 2) return true;
        if (/^(textarea|select|input)$/i.test(el.tagName)) return true;
      }
      return false;
    };

    /* what the easing itself last wrote, so anything else that moves the page
       mid-glide can be told apart from our own writes and handed control —
       otherwise find-in-page, a scrollbar drag or another script gets dragged
       back every frame */
    var lastSet = -1;

    var run = function () {
      if (lastSet >= 0 && Math.abs(scrollY - lastSet) > 2) {
        target = current = scrollY;                  /* someone else moved us */
        running = false; lastSet = -1;
        return;
      }
      var d = target - current;
      if (Math.abs(d) < 0.4) {
        current = target; running = false; lastSet = -1;
        scrollTo(0, Math.round(current));
        return;
      }
      current += d * ease;
      lastSet = Math.round(current);
      scrollTo(0, lastSet);
      requestAnimationFrame(run);
    };
    var start = function () {
      if (!running) { running = true; lastSet = Math.round(scrollY); current = scrollY; requestAnimationFrame(run); }
    };

    addEventListener('wheel', function (e) {
      if (e.ctrlKey || e.defaultPrevented) return;      /* pinch-zoom stays native */
      if (nativeZone(e.target)) return;
      e.preventDefault();
      var dy = e.deltaY;
      if (e.deltaMode === 1) dy *= 16;                  /* lines  */
      else if (e.deltaMode === 2) dy *= innerHeight;    /* pages  */
      target = Math.max(0, Math.min(maxScroll(), target + dy));
      start();
    }, { passive: false });

    /* anything that moves the page by other means — scrollbar, keyboard,
       find-in-page — resets the target so the two never disagree */
    addEventListener('scroll', function () {
      if (!running) { target = current = scrollY; }
    }, { passive: true });

    addEventListener('resize', function () {
      target = current = scrollY;
    });

    /* in-page links glide instead of jumping, without scroll-behavior fighting us */
    doc.documentElement.style.scrollBehavior = 'auto';
    doc.querySelectorAll('a[href^="#"]').forEach(function (a) {
      on(a, 'click', function (e) {
        var id = a.getAttribute('href').slice(1);
        if (!id) return;
        var el = doc.getElementById(id);
        if (!el) return;
        e.preventDefault();
        target = Math.max(0, Math.min(maxScroll(),
          el.getBoundingClientRect().top + scrollY - 10));
        start();
      });
    });
  })();

  /* ------------------------------------------------------------ nav state */
  var navBar = doc.querySelector('nav.top');
  if (navBar) {
    var markNav = function () {
      doc.body.classList.toggle('scrolled', scrollY > innerHeight * 0.72);
    };
    markNav(); onScroll(markNav);
  }

  /* --------------------------------------------------- hero, split to chars ---
     Each letter carries its own delay, so the headline assembles rather than
     sliding in as three blocks. Done in script: the markup stays plain text
     for screen readers until this runs, and the line keeps its own aria text. */
  (function () {
    var lines = doc.querySelectorAll('.hero .mask > i, .case-hero .mask > i');
    if (!lines.length || reduce) return;
    lines.forEach(function (line) {
      var text = line.textContent, n = 0;
      line.setAttribute('aria-label', text);
      line.textContent = '';
      /* Letters within a word are grouped into one inline-block wrapper, so
         the browser can only wrap the line between words (or at a space),
         never between two letters of the same word - splitting into plain
         sibling <b> elements let it break mid-word whenever a long word
         didn't quite fit the line. */
      var word = null;
      text.split('').forEach(function (ch) {
        var b = doc.createElement('b');
        b.setAttribute('aria-hidden', 'true');
        b.style.setProperty('--i', n++);
        if (ch === ' ') {
          b.className = 'sp'; b.innerHTML = '&nbsp;';
          line.appendChild(b);
          word = null;
        } else {
          b.textContent = ch;
          if (!word) { word = doc.createElement('span'); word.className = 'wgrp'; line.appendChild(word); }
          word.appendChild(b);
        }
      });
    });
  })();

  /* ------------------------------------------------------ opening curtain ---
     Built by script rather than sitting in the markup, so a page without JS
     never faces a cover that cannot lift. The count follows real document
     progress where the browser reports it and a clock where it does not, and
     it always resolves: the curtain cannot outstay 1.9 seconds. */
  var startLit = function () {
    requestAnimationFrame(function () { doc.body.classList.add('lit'); });
  };
  /* the home page is the one with a full hero; case pages get the wipe */
  var wantsCurtain = !!doc.querySelector('.hero') && !reduce;

  if (wantsCurtain) {
    var curt = doc.createElement('div');
    curt.className = 'curtain';
    curt.setAttribute('aria-hidden', 'true');
    curt.innerHTML =
      '<div class="c-sub">Mumbai \u00b7 Independent, AI-native creative company</div>' +
      '<div class="c-bar"><i></i></div>' +
      '<div class="c-row"><div class="c-word"><i>Vaelo</i></div><div class="c-num">0</div></div>';
    doc.body.appendChild(curt);
    doc.body.style.overflow = 'hidden';

    var cBar = curt.querySelector('.c-bar i'),
        cNum = curt.querySelector('.c-num'),
        shown = 0, lifted = false, t0 = performance.now();

    var lift = function () {
      if (lifted) return;
      lifted = true;
      cNum.textContent = '100';
      cBar.style.width = '100%';
      setTimeout(function () {
        curt.classList.add('up');
        doc.body.style.overflow = '';
        startLit();
        setTimeout(function () {
          if (curt.parentNode) curt.parentNode.removeChild(curt);
        }, 1150);
      }, 280);
    };

    var count = function (t) {
      var byTime = Math.min(1, (t - t0) / 1400);
      var byLoad = doc.readyState === 'complete' ? 1
                 : (doc.readyState === 'interactive' ? 0.72 : 0.4);
      var p = Math.min(byTime, Math.max(byTime * 0.55, byLoad));
      shown = Math.max(shown, Math.round(p * 100));
      cNum.textContent = shown;
      cBar.style.width = shown + '%';
      if (shown < 100 && !lifted) requestAnimationFrame(count);
      else lift();
    };
    requestAnimationFrame(count);
    on(window, 'load', function () { setTimeout(lift, 240); });
    setTimeout(lift, 1900);                    /* the hard ceiling */
  } else {
    startLit();
  }

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
    var dir = 1;
    onScroll(function () {
      var dy = scrollY - lastY;
      if (Math.abs(dy) > 2) dir = dy > 0 ? 1 : -1;   /* it runs with you */
      boost = Math.min(2.6, Math.abs(dy) / 26);
      lastY = scrollY;
    });
    (function run(t, prev) {
      var dt = prev ? Math.min(48, t - prev) : 16;
      mx -= dir * (speed * (1 + boost)) * dt;
      boost *= 0.94;
      if (half) {
        if (-mx >= half) mx += half;
        else if (mx > 0) mx -= half;
      }
      track.style.transform = 'translate3d(' + mx + 'px,0,0)';
      requestAnimationFrame(function (n) { run(n, t); });
    })(0, 0);
  }

  /* -------------------------------------------------------- work rail ---
     Sticky section driven by its own scroll progress. The rail eases toward
     the scroll position rather than tracking it 1:1 — that lag is what gives
     the movement weight instead of feeling mechanical. Pure transform, so
     the page itself never scrolls sideways. Below 900px it unpins and the
     rail stacks vertically (handled in CSS). */
  var railWrap = doc.getElementById('railWrap'),
      rail = doc.getElementById('rail'),
      prog = doc.getElementById('prog');

  if (rail && railWrap) {
    var wide = false, travel = 0, target = 0, current = 0, gliding = false;

    var fit = function () {
      wide = innerWidth > 720 && !reduce;
      if (!wide) {
        rail.style.transform = '';
        railWrap.style.height = '';
        if (prog) prog.style.width = '100%';
        return;
      }
      travel = Math.max(0, rail.scrollWidth - innerWidth + innerWidth * 0.08);
      /* the section is exactly as tall as the distance the rail must cover,
         plus one viewport to hold it — never an arbitrary multiple */
      railWrap.style.height = (innerHeight + travel * 1.15) + 'px';
    };

    var aim = function () {
      if (!wide) return;
      var box = railWrap.getBoundingClientRect();
      var span = railWrap.offsetHeight - innerHeight;
      var p = span > 0 ? Math.min(1, Math.max(0, -box.top / span)) : 0;
      target = -p * travel;
      if (prog) prog.style.width = (5 + p * 95) + '%';
      if (!gliding) { gliding = true; requestAnimationFrame(glide); }
    };

    var glide = function () {
      var d = target - current;
      if (Math.abs(d) < 0.12) { current = target; gliding = false; d = 0; }
      current += d * 0.11;                       /* the ease */
      /* the outstanding distance is also the lean: the strip flexes into a
         flick and stands upright again as it catches up */
      var lean = Math.max(-7, Math.min(7, d * 0.012));
      rail.style.transform = 'translate3d(' + current.toFixed(2) + 'px,0,0) ' +
                             'skewX(' + lean.toFixed(2) + 'deg)';
      if (gliding) requestAnimationFrame(glide);
    };

    var settle = function () { fit(); aim(); current = target;
      if (wide) rail.style.transform = 'translate3d(' + current + 'px,0,0)'; };
    settle();
    on(window, 'resize', settle);
    onScroll(aim);
    setTimeout(settle, 60);                       /* tiles render from data */
    on(window, 'load', settle);
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

  /* ------------------------------------------------------ scroll progress */
  var sprog = doc.createElement('div');
  sprog.className = 'sprog';
  doc.body.appendChild(sprog);
  var tickProg = function () {
    var max = doc.documentElement.scrollHeight - innerHeight;
    sprog.style.width = (max > 0 ? (scrollY / max) * 100 : 0) + '%';
  };
  tickProg(); onScroll(tickProg);

  /* ------------------------------------------------- rail tile depth ----
     Tiles swell slightly as they cross the middle of the screen and settle
     back as they leave, so the strip reads as depth rather than a flat row. */
  var tiles = doc.querySelectorAll('.tile');
  if (tiles.length && !reduce) {
    var depth = function () {
      var mid = innerWidth / 2;
      tiles.forEach(function (t) {
        var b = t.getBoundingClientRect();
        if (b.right < -100 || b.left > innerWidth + 100) return;
        var d = Math.min(1, Math.abs((b.left + b.width / 2) - mid) / (innerWidth * 0.75));
        t.style.setProperty('--depth', (1 - d * 0.06).toFixed(3));
        t.style.setProperty('--lift', (d * 14).toFixed(1) + 'px');
      });
    };
    depth(); onScroll(depth); on(window, 'resize', depth);
  }

  /* --------------------------------------------------- decoding eyebrows */
  var GLYPH = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ/\\<>*+-—·';
  var decode = function (el) {
    var final = el.dataset.txt, len = final.length, frame = 0;
    var run = function () {
      var out = '';
      for (var i = 0; i < len; i++) {
        if (final[i] === ' ') { out += ' '; continue; }
        if (i < frame / 2.2) out += final[i];
        else out += GLYPH[(Math.random() * GLYPH.length) | 0];
      }
      el.textContent = out;
      if (frame / 2.2 < len) { frame++; requestAnimationFrame(run); }
      else el.textContent = final;
    };
    run();
  };
  var brows = doc.querySelectorAll('.lab.ac');
  if (brows.length && !reduce && 'IntersectionObserver' in window) {
    var bio = new IntersectionObserver(function (en) {
      en.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target;
        if (el.querySelector('a')) { bio.unobserve(el); return; }
        el.dataset.txt = el.textContent;
        decode(el);
        bio.unobserve(el);
      });
    }, { threshold: 0.9 });
    brows.forEach(function (el) { bio.observe(el); });
  }

  /* -------------------------------------------------- magnetic buttons */
  if (matchMedia('(hover:hover)').matches && !reduce) {
    doc.querySelectorAll('.mail, .go, .btn').forEach(function (el) {
      el.classList.add('magnet');
      var host = el.closest('a, button') || el;
      on(host, 'pointermove', function (e) {
        var b = el.getBoundingClientRect();
        var dx = (e.clientX - (b.left + b.width / 2)) * 0.22;
        var dy = (e.clientY - (b.top + b.height / 2)) * 0.22;
        el.style.transform = 'translate(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px)';
      });
      on(host, 'pointerleave', function () { el.style.transform = ''; });
    });
  }

  /* --------------------------------------------------- converge, then wash ---
     Pinned like the rail, but reads scroll as one 0-1 progress value instead
     of a horizontal position. Cards scattered by --tx/--ty/--rot (vw/vh/deg,
     set inline per card in the HTML) ease toward dead centre as progress
     climbs, each on its own slightly delayed window so they don't all land
     at once; a gradient wash fades in behind them on the same progress and
     carries straight into the footer. */
  var converge = doc.getElementById('converge');
  if (converge && !reduce) {
    var convItems = Array.prototype.slice.call(converge.querySelectorAll('.conv-item')).map(function (el, i) {
      var s = getComputedStyle(el);
      return {
        el: el,
        tx: parseFloat(s.getPropertyValue('--tx')) || 0,
        ty: parseFloat(s.getPropertyValue('--ty')) || 0,
        rot: parseFloat(s.getPropertyValue('--rot')) || 0,
        delay: i * 0.07
      };
    });
    var wash = converge.querySelector('.conv-wash');
    var convTick = function () {
      var box = converge.getBoundingClientRect();
      var span = converge.offsetHeight - innerHeight;
      var p = span > 0 ? Math.min(1, Math.max(0, -box.top / span)) : 0;
      convItems.forEach(function (d) {
        var local = Math.min(1, Math.max(0, (p - d.delay) / (1 - d.delay)));
        var ease = local * local * (3 - 2 * local);           /* smoothstep */
        var tx = d.tx * (1 - ease), ty = d.ty * (1 - ease), rot = d.rot * (1 - ease);
        d.el.style.transform = 'translate(-50%,-50%) translate(' + tx.toFixed(2) + 'vw,' +
          ty.toFixed(2) + 'vh) scale(' + (1 - ease * 0.08).toFixed(3) + ') rotate(' + rot.toFixed(2) + 'deg)';
        /* The cards used to shrink to 12% of their size and end as a speck
           in the middle of an empty screen. They now hold their size, gather
           into a single stack at centre, and dissolve into the wash. */
        d.el.style.opacity = (ease > 0.72 ? Math.max(0, 1 - (ease - 0.72) / 0.28) : 1).toFixed(3);
      });
      if (wash) wash.style.opacity = p.toFixed(3);
    };
    convTick(); onScroll(convTick); on(window, 'resize', convTick);
  }

  /* ------------------------------------------------------ closing wordmark */
  var endmark = doc.querySelector('.endmark span');
  if (endmark) {
    var fill = function () {
      var b = endmark.getBoundingClientRect();
      /* runs from the moment the word appears to the moment it is fully in
         view, and is pinned at full once the page bottom is reached */
      var start = innerHeight, end = innerHeight * 0.42;
      var p = (start - b.top) / (start - end);
      var atBottom = (innerHeight + scrollY) >= (doc.documentElement.scrollHeight - 4);
      if (atBottom) p = 1;
      endmark.style.setProperty('--fill', (Math.max(0, Math.min(1, p)) * 100).toFixed(1) + '%');
    };
    fill(); onScroll(fill);
  }

  /* -------------------------------------------------------- hero parallax */
  var heroIn = doc.querySelector('.hero-in');
  if (heroIn && !reduce) {
    var drift = function () {
      var p = Math.min(1, Math.max(0, scrollY / innerHeight));
      heroIn.style.transform = 'translate3d(0,' + (p * 90).toFixed(1) + 'px,0)';
      heroIn.style.opacity = (1 - p * 0.85).toFixed(3);
    };
    drift(); onScroll(drift);
  }

  /* ------------------------------------------------------------- tilt ---
     Cards lean toward the pointer on a real perspective plane. Small angles
     only — the point is that the surface feels physical, not that it spins. */
  if (matchMedia('(hover:hover)').matches && !reduce) {
    doc.querySelectorAll('.tile, .arch-item').forEach(function (card) {
      var frame = card.querySelector('.frame');
      if (!frame) return;
      on(card, 'pointermove', function (e) {
        var b = card.getBoundingClientRect();
        var x = (e.clientX - b.left) / b.width - 0.5;
        var y = (e.clientY - b.top) / b.height - 0.5;
        card.classList.add('tilt');
        frame.style.transform =
          'rotateY(' + (x * 7).toFixed(2) + 'deg) rotateX(' + (-y * 7).toFixed(2) + 'deg) ' +
          'translateZ(14px)';
      });
      on(card, 'pointerleave', function () {
        card.classList.remove('tilt');
        frame.style.transform = '';
      });
    });
  }

  /* ------------------------------------------------------ scrambled titles ---
     A title resolves out of noise the first time you touch it. Same glyph set
     as the eyebrows, so the two effects read as one idea. */
  if (matchMedia('(hover:hover)').matches && !reduce) {
    var SET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#%&/\\';
    doc.querySelectorAll('.tile .meta h3, .arch-item h3, .next h2').forEach(function (el) {
      var real = el.textContent, busy = false;
      on(el.closest('a') || el, 'pointerenter', function () {
        if (busy) return;
        busy = true;
        var frame = 0;
        (function churn() {
          var out = '', done = frame / 1.8;
          for (var i = 0; i < real.length; i++) {
            out += (real[i] === ' ' || i < done) ? real[i]
                 : SET[(Math.random() * SET.length) | 0];
          }
          el.textContent = out;
          if (done < real.length) { frame++; requestAnimationFrame(churn); }
          else { el.textContent = real; busy = false; }
        })();
      });
    });
  }

  /* --------------------------------------------------------- rail dragging ---
     The strip can be grabbed and thrown, and the page scroll follows, so the
     pinned section and the drag stay in agreement instead of fighting. */
  var stickEl = doc.querySelector('.rail-stick');
  if (stickEl && rail && railWrap && !reduce) {
    var down = false, startX = 0, startScroll = 0, moved = 0, pid = null;

    on(stickEl, 'pointerdown', function (e) {
      if (innerWidth <= 720) return;             /* narrow uses native scroll */
      down = true; moved = 0; pid = e.pointerId;
      startX = e.clientX; startScroll = scrollY;
      stickEl.classList.add('dragging');
      /* Capture is only claimed once an actual drag starts (see pointermove) -
         claiming it here unconditionally would redirect every plain tap's
         click event to stickEl instead of the link underneath it, which is
         exactly what silently broke every tile/card link on this rail. */
    });
    on(stickEl, 'pointermove', function (e) {
      if (!down) return;
      var dx = e.clientX - startX;
      moved = Math.max(moved, Math.abs(dx));
      if (moved > 6 && stickEl.setPointerCapture) {
        try { stickEl.setPointerCapture(pid); } catch (err) {}
      }
      /* horizontal distance maps back onto page scroll, 1:1 with the rail */
      var span = railWrap.offsetHeight - innerHeight;
      var perPx = travelRatio();
      scrollTo(0, startScroll - dx * perPx);
      e.preventDefault();
    });
    function travelRatio() {
      var span = railWrap.offsetHeight - innerHeight;
      var dist = rail.scrollWidth - innerWidth + innerWidth * 0.08;
      return dist > 0 ? span / dist : 1;
    }
    var release = function () {
      if (!down) return;
      down = false;
      stickEl.classList.remove('dragging');
      if (pid != null && stickEl.releasePointerCapture) {
        try { stickEl.releasePointerCapture(pid); } catch (err) {}
      }
      pid = null;
    };
    on(stickEl, 'pointerup', release);
    on(stickEl, 'pointercancel', release);
    on(stickEl, 'pointerleave', release);
    /* a drag must not open the project it ended on */
    on(stickEl, 'click', function (e) {
      if (moved > 6) { e.preventDefault(); e.stopPropagation(); moved = 0; }
    }, true);
  }

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
