/* ==========================================================================
   VAELO — motion. GSAP + ScrollTrigger, matching the language of the
   original agency page and extending it: masked line rises, clip-path tile
   reveals, image parallax, word-by-word statement warm-up, counters,
   marquee drift, magnetic cursor, page-transition wipe.
   Every reveal animates transform or colour only — no element is ever left
   invisible if a script fails.
   ========================================================================== */
(function () {
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGsap = typeof window.gsap !== 'undefined';
  if (hasGsap && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

  /* ---------- mobile menu ---------- */
  var burger = document.querySelector('.burger');
  if (burger) {
    burger.addEventListener('click', function () {
      var on = document.body.classList.toggle('menu');
      burger.setAttribute('aria-expanded', on ? 'true' : 'false');
    });
    document.querySelectorAll('.nav-links a').forEach(function (a) {
      a.addEventListener('click', function () {
        document.body.classList.remove('menu');
        burger.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---------- cursor ---------- */
  var cur = document.querySelector('.cursor');
  if (cur && matchMedia('(hover:hover)').matches && !reduce) {
    var cx = 0, cy = 0, tx = 0, ty = 0;
    addEventListener('pointermove', function (e) { tx = e.clientX; ty = e.clientY; });
    (function loop() {
      cx += (tx - cx) * 0.17; cy += (ty - cy) * 0.17;
      cur.style.transform = 'translate(' + cx + 'px,' + cy + 'px) translate(-50%,-50%)';
      requestAnimationFrame(loop);
    })();
    document.querySelectorAll('a,button').forEach(function (el) {
      el.addEventListener('pointerenter', function () { cur.classList.add('big'); });
      el.addEventListener('pointerleave', function () { cur.classList.remove('big'); });
    });
  }

  /* ---------- page transition wipe ---------- */
  var wipe = document.querySelector('.wipe');
  if (wipe && !reduce) {
    wipe.classList.add('in');
    requestAnimationFrame(function () {
      setTimeout(function () { wipe.classList.remove('in'); wipe.classList.add('out'); }, 30);
    });
    document.querySelectorAll('a[href]').forEach(function (a) {
      var url = a.getAttribute('href');
      if (!url || url.charAt(0) === '#' || url.indexOf('mailto:') === 0 || a.target) return;
      a.addEventListener('click', function (e) {
        if (e.metaKey || e.ctrlKey || e.shiftKey) return;
        e.preventDefault();
        wipe.classList.remove('out'); wipe.classList.add('in');
        setTimeout(function () { location.href = url; }, 480);
      });
    });
  }

  /* ---------- hero: masked lines rise, tint blooms ---------- */
  var heroLines = document.querySelectorAll('.hero .mask > i, .case-hero .mask > i');
  if (hasGsap && !reduce && heroLines.length) {
    gsap.set(heroLines, { yPercent: 108 });
    gsap.set('.hero-line, .hero-foot, .crumb, .case-hero .facts', { opacity: 0 });
    gsap.set('.hero-tint', { opacity: 0.4 });
    var tl = gsap.timeline({ delay: 0.15 });
    tl.to('.hero-tint', { opacity: 1, duration: 1.8, ease: 'power2.out' }, 0)
      .to('.hero-line, .crumb', { opacity: 1, duration: .8, ease: 'power1.out' }, 0.35)
      .to(heroLines, { yPercent: 0, duration: 1.1, stagger: 0.085, ease: 'power3.out' }, 0.45)
      .to('.hero-foot, .case-hero .facts', { opacity: 1, duration: .9, ease: 'power1.out' }, 1.0);
  }

  /* ---------- hero backdrop ----------
     A real showreel takes over when the file loads. Until then (and whenever
     autoplay is refused) a generative canvas carries the motion: slow light
     plumes drifting behind the type. Drawn at 1/6 scale and blurred by CSS,
     so it costs almost nothing on a phone. */
  var hv = document.getElementById('heroVideo');
  var canvas = document.getElementById('heroCanvas');

  if (hv) {
    hv.addEventListener('canplay', function () {
      hv.style.display = '';
      if (canvas) canvas.style.display = 'none';
      var pr = hv.play();
      if (pr && pr.catch) pr.catch(function () {
        hv.style.display = 'none';
        if (canvas) canvas.style.display = '';
      });
    });
    hv.addEventListener('error', function () { hv.style.display = 'none'; });
    if (reduce) hv.pause();
  }

  if (canvas && canvas.getContext) {
    var ctx = canvas.getContext('2d'), W = 0, H = 0, running = true;
    var plumes = [
      { x: .30, y: .32, r: .52, hue: 'rgba(214,255,63,',  a: .30, sx: .00021, sy: .00014, p: 0 },
      { x: .74, y: .62, r: .60, hue: 'rgba(180,178,166,', a: .26, sx: -.00016, sy: .00019, p: 2 },
      { x: .52, y: .84, r: .46, hue: 'rgba(120,124,110,', a: .30, sx: .00013, sy: -.00021, p: 4 },
      { x: .12, y: .74, r: .38, hue: 'rgba(244,242,236,', a: .13, sx: .00019, sy: .00011, p: 1 }
    ];
    function size() {
      W = canvas.width = Math.max(1, Math.round(innerWidth / 6));
      H = canvas.height = Math.max(1, Math.round(innerHeight / 6));
    }
    size();
    addEventListener('resize', size);

    function paint(t) {
      ctx.fillStyle = '#050505';
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';
      plumes.forEach(function (pl) {
        var cx = (pl.x + Math.sin(t * pl.sx + pl.p) * 0.16) * W;
        var cy = (pl.y + Math.cos(t * pl.sy + pl.p) * 0.14) * H;
        var rad = pl.r * Math.max(W, H) * (0.85 + Math.sin(t * 0.0002 + pl.p) * 0.15);
        var g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
        g.addColorStop(0, pl.hue + pl.a + ')');
        g.addColorStop(1, pl.hue + '0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(cx, cy, rad, 0, Math.PI * 2); ctx.fill();
      });
      ctx.globalCompositeOperation = 'source-over';
    }

    if (reduce) {
      paint(0);
    } else {
      (function frame(t) { if (running) { paint(t); requestAnimationFrame(frame); } })(0);
      document.addEventListener('visibilitychange', function () {
        running = !document.hidden;
        if (running) requestAnimationFrame(function f(t) { if (running) { paint(t); requestAnimationFrame(f); } });
      });
    }
  }

  /* ---------- marquee drift ---------- */
  var track = document.querySelector('.track'), marquee = null;
  if (track && !reduce && hasGsap) {
    marquee = gsap.to(track, { xPercent: -50, duration: 28, ease: 'none', repeat: -1 });
  }

  /* ---------- work rail: pinned horizontal scroll ---------- */
  var railWrap = document.getElementById('railWrap'),
      rail = document.getElementById('rail'),
      prog = document.getElementById('prog');

  if (rail && hasGsap && window.ScrollTrigger && !reduce) {
    ScrollTrigger.matchMedia({
      '(min-width: 901px)': function () {
        var drive = function () {
          return Math.max(0, rail.scrollWidth - innerWidth + innerWidth * 0.10);
        };
        gsap.to(rail, {
          x: function () { return -drive(); },
          ease: 'none',
          scrollTrigger: {
            trigger: railWrap,
            start: 'top top',
            end: function () { return '+=' + drive(); },
            pin: '.rail-stick',
            scrub: 0.6,
            invalidateOnRefresh: true,
            onUpdate: function (self) {
              if (prog) prog.style.width = (5 + self.progress * 95) + '%';
            }
          }
        });
      }
    });

    /* each card lifts as it enters the viewport horizontally */
    gsap.utils.toArray('.tile .frame').forEach(function (frame) {
      gsap.fromTo(frame, { yPercent: 6, opacity: 0.55 },
        { yPercent: 0, opacity: 1, duration: .9, ease: 'power2.out',
          scrollTrigger: { trigger: frame, start: 'top 92%' } });
    });
  }

  /* gallery parallax on case pages */
  if (hasGsap && window.ScrollTrigger && !reduce) {
    gsap.utils.toArray('.gal .slot').forEach(function (s) {
      gsap.fromTo(s, { yPercent: -5 }, { yPercent: 5, ease: 'none',
        scrollTrigger: { trigger: s, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
  }

  /* ---------- services accordions ---------- */
  document.querySelectorAll('.svc-hd').forEach(function (hd) {
    hd.addEventListener('click', function () {
      var open = hd.parentElement.classList.toggle('open');
      hd.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (hasGsap && window.ScrollTrigger) setTimeout(ScrollTrigger.refresh, 480);
    });
  });

  /* ---------- statement: word-by-word warm-up ---------- */
  var stmt = document.querySelector('[data-warm]');
  if (stmt) {
    var walk = document.createTreeWalker(stmt, NodeFilter.SHOW_TEXT), nodes = [], n;
    while ((n = walk.nextNode())) nodes.push(n);
    nodes.forEach(function (node) {
      if (!node.nodeValue.trim()) return;
      var frag = document.createDocumentFragment();
      node.nodeValue.split(/(\s+)/).forEach(function (part) {
        if (!part.trim()) { frag.appendChild(document.createTextNode(part)); return; }
        var s = document.createElement('span'); s.className = 'w'; s.textContent = part;
        frag.appendChild(s);
      });
      node.parentNode.replaceChild(frag, node);
    });
    var words = stmt.querySelectorAll('.w');
    if (reduce || !hasGsap || !window.ScrollTrigger) {
      words.forEach(function (w) { w.classList.add('on'); });
    } else {
      words.forEach(function (w, i) {
        ScrollTrigger.create({
          trigger: w, start: 'top 78%',
          onEnter: function () { setTimeout(function () { w.classList.add('on'); }, i * 18); }
        });
      });
    }
  }

  /* ---------- counters ---------- */
  if (hasGsap && window.ScrollTrigger && !reduce) {
    gsap.utils.toArray('[data-count]').forEach(function (el) {
      var to = parseFloat(el.dataset.count), obj = { v: 0 };
      ScrollTrigger.create({
        trigger: el, start: 'top 92%', once: true,
        onEnter: function () {
          gsap.to(obj, { v: to, duration: 1.4, ease: 'power2.out',
            onUpdate: function () { el.textContent = Math.round(obj.v); } });
        }
      });
    });
  }

  /* ---------- scroll choreography ----------
     Everything here moves transform or colour only — text is legible even
     if the script never runs. */
  if (hasGsap && window.ScrollTrigger && !reduce) {

    /* section headings rise line by line out of their mask */
    gsap.utils.toArray('.sec-hd, .rail-head').forEach(function (hd) {
      gsap.from(hd.children, {
        yPercent: 34, opacity: 0, duration: 1, stagger: .1, ease: 'power3.out',
        scrollTrigger: { trigger: hd, start: 'top 86%' }
      });
    });

    /* eyebrow rules draw themselves in */
    gsap.utils.toArray('.lab.ac').forEach(function (el) {
      gsap.from(el, { xPercent: -6, opacity: 0, duration: .7, ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 92%' } });
    });

    /* service rows sweep in from the left, one after another */
    gsap.utils.toArray('.svc').forEach(function (row, i) {
      gsap.from(row, { x: -26, opacity: 0, duration: .75, ease: 'power2.out', delay: (i % 3) * .05,
        scrollTrigger: { trigger: row, start: 'top 93%' } });
    });

    /* process cards deal out like a hand of cards */
    gsap.from('.steps > div', {
      yPercent: 16, opacity: 0, duration: .8, stagger: .09, ease: 'power3.out',
      scrollTrigger: { trigger: '.steps', start: 'top 88%' }
    });

    /* counter strip lifts as a unit, then the numbers run */
    gsap.from('.strip > div', {
      yPercent: 22, opacity: 0, duration: .7, stagger: .07, ease: 'power2.out',
      scrollTrigger: { trigger: '.strip', start: 'top 92%' }
    });

    /* studio imagery drifts against the page */
    gsap.utils.toArray('.studio-grid .slot, .sec .slot').forEach(function (s) {
      gsap.fromTo(s, { yPercent: -6 }, { yPercent: 6, ease: 'none',
        scrollTrigger: { trigger: s, start: 'top bottom', end: 'bottom top', scrub: true } });
    });

    /* case-page prose settles paragraph by paragraph */
    gsap.utils.toArray('.prose p').forEach(function (para) {
      gsap.from(para, { y: 18, opacity: 0, duration: .8, ease: 'power2.out',
        scrollTrigger: { trigger: para, start: 'top 90%' } });
    });

    /* KPI figures count up from a scale-in */
    gsap.utils.toArray('.kpis > div').forEach(function (k, i) {
      gsap.from(k, { scale: .94, opacity: 0, duration: .7, delay: i * .07, ease: 'back.out(1.6)',
        transformOrigin: 'left bottom',
        scrollTrigger: { trigger: k, start: 'top 92%' } });
    });

    /* the contact headline is the last thing to land */
    gsap.from('.end h2', { yPercent: 12, opacity: 0, duration: 1.1, ease: 'power3.out',
      scrollTrigger: { trigger: '.end', start: 'top 82%' } });
    gsap.from('.mail, .cbits > div', { y: 16, opacity: 0, duration: .8, stagger: .08, ease: 'power2.out',
      scrollTrigger: { trigger: '.end', start: 'top 76%' } });

    /* the marquee reacts to scroll direction and speed */
    if (marquee) {
      ScrollTrigger.create({
        trigger: document.body, start: 'top top', end: 'bottom bottom',
        onUpdate: function (self) {
          gsap.to(marquee, { timeScale: 1 + Math.min(3, Math.abs(self.getVelocity()) / 900),
            overwrite: true, duration: .3 });
        }
      });
    }
  }

  /* ---------- work archive filter tabs ---------- */
  var tabs = document.querySelectorAll('.tab-btn');
  if (tabs.length) {
    tabs.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var cat = btn.dataset.cat;
        tabs.forEach(function (b) {
          var on = b === btn;
          b.classList.toggle('on', on);
          b.setAttribute('aria-selected', on ? 'true' : 'false');
        });
        document.querySelectorAll('.arch-item').forEach(function (item) {
          var show = cat === 'all' || item.dataset.cat === cat;
          item.hidden = !show;
          if (show && hasGsap && !reduce) {
            gsap.fromTo(item, { y: 18, opacity: 0 },
              { y: 0, opacity: 1, duration: .55, ease: 'power2.out' });
          }
        });
        if (hasGsap && window.ScrollTrigger) ScrollTrigger.refresh();
      });
    });
  }

  /* ---------- generic reveals ---------- */
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('on'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -10% 0px' });
    document.querySelectorAll('.rev').forEach(function (el) { io.observe(el); });
  } else {
    document.querySelectorAll('.rev').forEach(function (el) { el.classList.add('on'); });
  }
})();
