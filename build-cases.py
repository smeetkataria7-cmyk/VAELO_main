#!/usr/bin/env python3
"""Regenerate /work/<slug>.html from assets/work.js.

Add or edit a project in assets/work.js, then run:  python3 build-cases.py
Every case page is a real static file with its own URL, title and share card.
"""
import json, re, pathlib, html

SRC = pathlib.Path("assets/work.js").read_text(encoding="utf-8")
raw = SRC[SRC.index("["): SRC.rindex("]") + 1]
raw = re.sub(r"/\*.*?\*/", "", raw, flags=re.S)
# single-quoted JS strings -> JSON strings (escape-aware, so \' survives)
raw = re.sub(r"'((?:[^'\\]|\\.)*)'",
             lambda m: json.dumps(m.group(1).replace("\\'", "'")), raw)
raw = re.sub(r"(?m)([{,]\s*)([A-Za-z_]\w*)\s*:", r'\1"\2":', raw)   # bare keys -> quoted
raw = re.sub(r",\s*([\]}])", r"\1", raw)                        # trailing commas
WORK = json.loads(raw)

TPL = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{title} — Vaelo</title>
<meta name="description" content="{summary}">
<link rel="canonical" href="https://www.vaelocreative.com/work/{slug}.html">
<meta name="theme-color" content="#0a0a0a">
<meta property="og:type" content="article">
<meta property="og:site_name" content="Vaelo Creative">
<meta property="og:title" content="{title} — Vaelo">
<meta property="og:description" content="{summary}">
<meta property="og:url" content="https://www.vaelocreative.com/work/{slug}.html">
<meta property="og:image" content="https://www.vaelocreative.com/assets/work/{slug}-og.jpg">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{title} — Vaelo">
<meta name="twitter:description" content="{summary}">
<meta name="twitter:image" content="https://www.vaelocreative.com/assets/work/{slug}-og.jpg">
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400..800&family=Archivo:wght@300;400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/vaelo.css">
<script type="application/ld+json">
{{"@context":"https://schema.org","@type":"CreativeWork","name":{title_j},
"about":{cat_j},"dateCreated":"{year}",
"creator":{{"@type":"Organization","name":"Vaelo Creative LLP","url":"https://www.vaelocreative.com/"}}}}
</script>
</head>
<body>
<div class="wipe"></div>
<div class="cursor" aria-hidden="true"></div>

<nav class="top">
  <a href="/" class="word">Vaelo</a>
  <div class="nav-links">
    <a href="/#work">Work</a><a href="/#capabilities">Capabilities</a><a href="/#studio">Studio</a><a href="/#contact">Contact</a>
  </div>
  <button class="burger" aria-label="Menu" aria-expanded="false"><i></i><i></i><i></i></button>
</nav>

<main>
<header class="case-hero">
  <div class="slot" data-spec="Case hero · 2400×1400"></div>
  <div class="tint"></div>
  <div class="in">
    <p class="crumb"><a href="/#work">Work</a> <span>/</span> <span>{idx}</span> <span>/</span> <span>{cat}</span></p>
    <h1><span class="mask"><i>{title}</i></span></h1>
  </div>
</header>

<div class="facts">
  <div><span class="lab">Client</span><b>{client}</b></div>
  <div><span class="lab">Category</span><b>{cat}</b></div>
  <div><span class="lab">Scope</span><b>{scope}</b></div>
  <div><span class="lab">Year</span><b>{year}</b></div>
</div>

<section class="case-body rev">
  <div class="stick"><p class="lab ac">The brief</p><h2 style="margin-top:12px">What was<br>in the way</h2></div>
  <div class="prose"><p>{brief}</p></div>
</section>

<div class="gal">
  <div class="slot g-full" data-spec="Campaign still · 1920×1080"></div>
  <div class="slot g-half" data-spec="Detail · 1200×1500"></div>
  <div class="slot g-half" data-spec="Detail · 1200×1500"></div>
</div>

<section class="case-body rev" style="padding-top:0">
  <div class="stick"><p class="lab ac">What we did</p><h2 style="margin-top:12px">The work<br>itself</h2></div>
  <div class="prose"><p>{did}</p></div>
</section>

<div class="gal">
  <div class="slot g-third" data-spec="Asset · 1200×1200"></div>
  <div class="slot g-third" data-spec="Asset · 1200×1200"></div>
  <div class="slot g-third" data-spec="Asset · 1200×1200"></div>
  <div class="slot g-full" data-spec="Film still · 1920×1080"></div>
</div>

<div class="kpis">{kpis}</div>
</main>

<a class="next" href="/work/{next_slug}.html">
  <p class="lab ac">Next project — {next_idx}</p>
  <h2>{next_title}</h2>
  <span class="arrow" aria-hidden="true">↗</span>
</a>

<footer>
  <div>Vaelo Creative LLP, Mumbai, India</div>
  <div><a href="mailto:hello@vaelocreative.com">hello@vaelocreative.com</a></div>
  <div>© 2026</div>
</footer>

<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"></script>
<script src="/assets/vaelo.js"></script>
</body>
</html>
"""

out = pathlib.Path("work"); out.mkdir(exist_ok=True)
for i, w in enumerate(WORK):
    nxt = WORK[(i + 1) % len(WORK)]
    kpis = "".join(
        '<div><div class="v">{}</div><div class="l">{}</div></div>'.format(html.escape(v), html.escape(l))
        for v, l in w["kpis"])
    page = TPL.format(
        slug=w["slug"], idx=w["idx"], title=html.escape(w["title"]), cat=html.escape(w["cat"]),
        scope=html.escape(w["scope"]), year=w["year"], client=html.escape(w["client"]),
        summary=html.escape(w["summary"], quote=True),
        brief=html.escape(w["brief"]), did=html.escape(w["did"]), kpis=kpis,
        title_j=json.dumps(w["title"]), cat_j=json.dumps(w["cat"]),
        next_slug=nxt["slug"], next_idx=nxt["idx"], next_title=html.escape(nxt["title"]))
    (out / (w["slug"] + ".html")).write_text(page, encoding="utf-8")
    print("wrote work/%s.html" % w["slug"])
