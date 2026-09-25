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
<title>{title} | Vaelo</title>
<meta name="description" content="{summary}">
<link rel="canonical" href="https://www.vaelocreative.com/work/{slug}.html">
<meta name="theme-color" content="#0a0a0a">
<meta property="og:type" content="article">
<meta property="og:site_name" content="Vaelo Creative">
<meta property="og:title" content="{title} | Vaelo">
<meta property="og:description" content="{summary}">
<meta property="og:url" content="https://www.vaelocreative.com/work/{slug}.html">
<meta property="og:image" content="https://www.vaelocreative.com/assets/work/{slug}-og.jpg">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{title} | Vaelo">
<meta name="twitter:description" content="{summary}">
<meta name="twitter:image" content="https://www.vaelocreative.com/assets/work/{slug}-og.jpg">
<link rel="icon" href="../assets/favicon.png" type="image/png">
<link rel="apple-touch-icon" href="../assets/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400..800&family=Archivo:wght@300;400;500;600&family=Montserrat:wght@600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../assets/vaelo.css?v=3986daac">
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
  <a href="../index.html" class="word">Vaelo</a>
  <div class="nav-links">
    <a href="index.html">Work</a><a href="../blog/">Blog</a><a href="../services/">Services</a><a href="../index.html#contact">Contact</a>
  </div>
  <button class="burger" aria-label="Menu" aria-expanded="false"><i></i><i></i><i></i></button>
</nav>

<main>
<header class="case-hero bare">
  <div class="in">
    <p class="crumb"><a href="index.html">Work</a> <span>/</span> <span>{idx}</span> <span>/</span> <span>{cat}</span></p>
    <h1><span class="mask"><i>{title}</i></span></h1>
  </div>
</header>

<div class="facts" data-rev data-stagger>
  <div><span class="lab">Client</span><b>{client}</b></div>
  <div><span class="lab">Category</span><b>{cat}</b></div>
  <div><span class="lab">Scope</span><b>{scope}</b></div>
  <div><span class="lab">Year</span><b>{year}</b></div>
  {link_cell}
</div>

<section class="case-body" data-rev>
  <div class="stick"><p class="lab ac">The brief</p><h2 style="margin-top:12px">What was<br>in the way</h2></div>
  <div class="prose" data-rev data-stagger><p>{brief}</p></div>
</section>

{gallery}

<section class="case-body" data-rev style="padding-top:0">
  <div class="stick"><p class="lab ac">What we did</p><h2 style="margin-top:12px">The work<br>itself</h2></div>
  <div class="prose" data-rev data-stagger><p>{did}</p></div>
</section>

<div class="kpis" data-rev data-stagger>{kpis}</div>
</main>

<a class="next" href="{next_slug}.html" style="--tone:{next_tone}">
  <div class="next-txt">
    <p class="lab ac">Next project · {next_idx}</p>
    <h2>{next_title}</h2>
  </div>
  <div class="next-shot">{next_cover}</div>
  <span class="arrow" aria-hidden="true">↗</span>
</a>

<div class="endmark"><span>Vaelo</span></div>

<footer>
  <div>Vaelo Creative LLP, Mumbai, India</div>
  <div><a href="mailto:hello@vaelocreative.com">hello@vaelocreative.com</a></div>
  <div>© 2026</div>
</footer>

<script src="../assets/vaelo.js?v=6920936b"></script>
</body>
</html>
"""

def media(src, alt, cls, spec, par):
    """A real file when one was imported, the labelled placeholder when not."""
    if not src:
        return '<div class="slot %s" data-par="%s" data-spec="%s"></div>' % (cls, par, spec)
    a = html.escape(alt, quote=True)
    if src.lower().endswith((".mp4", ".webm", ".mov", ".m4v")):
        # a poster keeps the frame filled while the clip loads, and keeps it
        # visible at all if the browser refuses to decode the file
        stem = src.rsplit('.', 1)[0]
        poster = stem + '-poster.jpg'
        pa = (' poster="../%s"' % poster) if pathlib.Path(poster).exists() else ''
        inner = ('<video class="shot" src="../%s"%s muted loop playsinline '
                 'preload="metadata" data-par="%s"></video>' % (src, pa, par))
    else:
        inner = ('<img class="shot" src="../%s" alt="%s" loading="lazy" '
                 'decoding="async" data-par="%s">' % (src, a, par))
    return '<figure class="%s">%s</figure>' % (cls, inner) if cls else inner


def gallery(items, layout, alt):
    if not items:
        return ""
    cells = []
    for i, src in enumerate(items):
        cls = layout[i % len(layout)]
        spec = "Case image"
        cells.append(media(src, alt, cls, spec, "7"))
    return '<div class="gal" data-rev>\n  ' + "\n  ".join(cells) + '\n</div>'


out = pathlib.Path("work"); out.mkdir(exist_ok=True)
for i, w in enumerate(WORK):
    nxt = WORK[(i + 1) % len(WORK)]
    # the next-project block reads as more body copy without a picture of
    # what it leads to, so it carries that project's cover
    nimg = nxt.get("images", {})
    nsrc = nimg.get("cover") or nimg.get("heroPoster") or nimg.get("hero") or ""
    if nsrc.lower().endswith((".mp4", ".webm", ".mov")):
        nsrc = nimg.get("heroPoster", "")
    next_cover = ('<img src="../%s" alt="" loading="lazy" decoding="async">' % html.escape(nsrc, quote=True)) if nsrc else ""
    link = w.get("link", "")
    link_cell = ('<div><span class="lab">Live site</span>'
                 '<b><a class="live-link" href="%s" target="_blank" rel="noopener">%s \u2197</a></b></div>'
                 % (html.escape(link, quote=True),
                    html.escape(w.get("linkLabel") or link.replace("https://", "").rstrip("/")))) if link else ""
    kpis = "".join(
        '<div><div class="v">{}</div><div class="l">{}</div></div>'.format(html.escape(v), html.escape(l))
        for v, l in w["kpis"])
    imgs = w.get("images") or {}
    gal = list(imgs.get("gallery") or [])
    # Group the media so it reads as an ordered set, not a random wall: all the
    # stills together, then all the clips together, in one uninterrupted run
    # (no copy wedged between). Stills go 2-up, the vertical reels 3-up.
    is_vid = lambda s: s.lower().endswith((".mp4", ".webm", ".mov", ".m4v"))
    stills = [s for s in gal if not is_vid(s)]
    clips = [s for s in gal if is_vid(s)]
    blocks = []
    if stills:
        blocks.append(gallery(stills, ["g-half"], w["title"]))
    if clips:
        blocks.append(gallery(clips, ["g-third"], w["title"]))
    gallery_html = "\n\n".join(blocks) or (
        '<div class="gal" data-rev>\n'
        '  <div class="slot g-half" data-par="7" data-spec="Campaign still · 1920×1080"></div>\n'
        '  <div class="slot g-half" data-par="9" data-spec="Detail · 1200×1500"></div>\n'
        '</div>')
    page = TPL.format(
        gallery=gallery_html,
        slug=w["slug"], idx=w["idx"], title=html.escape(w["title"]), cat=html.escape(w["cat"]),
        scope=html.escape(w["scope"]), year=w["year"], client=html.escape(w["client"]),
        summary=html.escape(w["summary"], quote=True),
        brief=html.escape(w["brief"]), did=html.escape(w["did"]), kpis=kpis,
        link_cell=link_cell,
        title_j=json.dumps(w["title"]), cat_j=json.dumps(w["cat"]),
        next_slug=nxt["slug"], next_idx=nxt["idx"], next_title=html.escape(nxt["title"]),
        next_tone=nxt.get("tone", "#d6ff3f"), next_cover=next_cover)
    (out / (w["slug"] + ".html")).write_text(page, encoding="utf-8")
    print("wrote work/%s.html" % w["slug"])
