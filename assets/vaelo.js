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

  /* ---------- hero video: keep the page whole if it refuses to play ---------- */
  var hv = document.getElementById('heroVideo');
  if (hv) {
    if (reduce) { hv.pause(); }
    else {
      var p = hv.play();
      if (p && p.catch) p.catch(function () { hv.style.display = 'none'; });
    }
  }

  /* ---------- marquee drift ---------- */
  var track = document.querySelector('.track');
  if (track && !reduce) {
    if (hasGsap) {
      gsap.to(track, { xPercent: -50, duration: 28, ease: 'none', repeat: -1 });
    }
  }

  /* ---------- work tiles: clip-path reveal + image parallax ---------- */
  if (hasGsap && window.ScrollTrigger && !reduce) {
    gsap.utils.toArray('.tile .frame').forEach(function (frame, i) {
      gsap.fromTo(frame,
        { clipPath: 'inset(0 0 100% 0)' },
        { clipPath: 'inset(0 0 0% 0)', duration: 1.15, ease: 'power3.out',
          scrollTrigger: { trigger: frame, start: 'top 88%' } });
      var layer = frame.querySelector('.slot');
      if (layer) {
        gsap.fromTo(layer, { yPercent: -7 }, { yPercent: 7, ease: 'none',
          scrollTrigger: { trigger: frame, start: 'top bottom', end: 'bottom top', scrub: true } });
      }
    });
    gsap.utils.toArray('.gal .slot').forEach(function (s) {
      gsap.fromTo(s, { yPercent: -5 }, { yPercent: 5, ease: 'none',
        scrollTrigger: { trigger: s, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
  } else {
    document.querySelectorAll('.tile .frame').forEach(function (f) { f.style.clipPath = 'none'; });
  }

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
