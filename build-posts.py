#!/usr/bin/env python3
"""Regenerate /blog/<slug>.html and /blog/index.html from assets/blog.js.

Add or edit a post in assets/blog.js, then run:  python3 build-posts.py
Every post is a real static file with its own URL and share card.
"""
import json, re, pathlib, html
from datetime import datetime

SRC = pathlib.Path("assets/blog.js").read_text(encoding="utf-8")
raw = SRC[SRC.index("["): SRC.rindex("]") + 1]
raw = re.sub(r"/\*.*?\*/", "", raw, flags=re.S)
raw = re.sub(r"'((?:[^'\\]|\\.)*)'",
             lambda m: json.dumps(m.group(1).replace("\\'", "'")), raw)
raw = re.sub(r"(?m)([{,]\s*)([A-Za-z_]\w*)\s*:", r'\1"\2":', raw)
raw = re.sub(r",\s*([\]}])", r"\1", raw)
POSTS = json.loads(raw)
POSTS.sort(key=lambda p: p.get("date", ""), reverse=True)


def fmt_date(iso):
    try:
        return datetime.strptime(iso, "%Y-%m-%d").strftime("%d %b %Y")
    except ValueError:
        return iso


POST_TPL = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{title} | Vaelo Blog</title>
<meta name="description" content="{excerpt}">
<link rel="canonical" href="https://www.vaelocreative.com/blog/{slug}.html">
<meta name="theme-color" content="#0a0a0a">
<meta property="og:type" content="article">
<meta property="og:site_name" content="Vaelo Creative">
<meta property="og:title" content="{title} | Vaelo Blog">
<meta property="og:description" content="{excerpt}">
<meta property="og:url" content="https://www.vaelocreative.com/blog/{slug}.html">
<meta property="og:image" content="https://www.vaelocreative.com/assets/og.jpg">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{title} | Vaelo Blog">
<meta name="twitter:description" content="{excerpt}">
<meta name="twitter:image" content="https://www.vaelocreative.com/assets/og.jpg">
<link rel="icon" href="../assets/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400..800&family=Archivo:wght@300;400;500;600&family=Montserrat:wght@600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../assets/vaelo.css">
<script type="application/ld+json">
{{"@context":"https://schema.org","@type":"BlogPosting","headline":{title_j},
"datePublished":"{date}","author":{{"@type":"Organization","name":"Vaelo Creative LLP"}}}}
</script>
</head>
<body>
<div class="wipe"></div>
<div class="cursor" aria-hidden="true"></div>

<nav class="top">
  <a href="../index.html" class="word">Vaelo</a>
  <div class="nav-links">
    <a href="../work/">Work</a><a href="../blog/">Blog</a><a href="../services/">Services</a><a href="../index.html#process">Process</a><a href="../index.html#contact">Contact</a>
  </div>
  <button class="burger" aria-label="Menu" aria-expanded="false"><i></i><i></i><i></i></button>
</nav>

<main>
  <header class="arch-hd" style="padding-bottom:0">
    <p class="crumb"><a href="./">Blog</a> <span>/</span> <span>{tag}</span></p>
    <h1 style="margin-top:16px"><span class="mask"><i>{title_line1}</i></span>{title_line2_html}</h1>
    <p class="lab" style="margin-top:22px">{date_fmt} · {author}</p>
  </header>

  <section class="case-body" style="grid-template-columns:1fr;max-width:74ch;margin:0 auto" data-rev>
    <div class="prose" data-rev data-stagger>
{paragraphs}
    </div>
  </section>
</main>

<a class="next" href="./">
  <p class="lab ac">Back to</p>
  <h2>All posts</h2>
  <span class="arrow" aria-hidden="true">↗</span>
</a>

<div class="endmark"><span>Vaelo</span></div>

<footer>
  <div>Vaelo Creative LLP, Mumbai, India</div>
  <div><a href="mailto:hello@vaelocreative.com">hello@vaelocreative.com</a></div>
  <div>© 2026</div>
</footer>
<script src="../assets/vaelo.js"></script>
</body>
</html>
"""

INDEX_TPL = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Blog | Vaelo</title>
<meta name="description" content="Notes from Vaelo Creative on brand, AI-native production and performance work.">
<link rel="canonical" href="https://www.vaelocreative.com/blog/">
<meta name="theme-color" content="#0a0a0a">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Vaelo Creative">
<meta property="og:title" content="Blog | Vaelo">
<meta property="og:description" content="Notes from Vaelo Creative on brand, AI-native production and performance work.">
<meta property="og:url" content="https://www.vaelocreative.com/blog/">
<meta property="og:image" content="https://www.vaelocreative.com/assets/og.jpg">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Blog | Vaelo">
<meta name="twitter:image" content="https://www.vaelocreative.com/assets/og.jpg">
<link rel="icon" href="../assets/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400..800&family=Archivo:wght@300;400;500;600&family=Montserrat:wght@600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../assets/vaelo.css">
</head>
<body>
<div class="wipe"></div>
<div class="cursor" aria-hidden="true"></div>

<nav class="top">
  <a href="../index.html" class="word">Vaelo</a>
  <div class="nav-links">
    <a href="../work/">Work</a><a href="">Blog</a><a href="../services/">Services</a><a href="../index.html#process">Process</a><a href="../index.html#contact">Contact</a>
  </div>
  <button class="burger" aria-label="Menu" aria-expanded="false"><i></i><i></i><i></i></button>
</nav>

<main>
  <header class="arch-hd">
    <p class="lab ac">Blog</p>
    <h1 style="margin-top:16px"><span class="mask"><i>Notes from</i></span><span class="mask"><i class="out">the studio.</i></span></h1>
  </header>

  <div class="post-list">
{cards}
  </div>
</main>

<div class="endmark"><span>Vaelo</span></div>

<footer>
  <div>Vaelo Creative LLP, Mumbai, India</div>
  <div><a href="mailto:hello@vaelocreative.com">hello@vaelocreative.com</a></div>
  <div>© 2026</div>
</footer>
<script src="../assets/vaelo.js"></script>
</body>
</html>
"""


def esc(s):
    return html.escape(s or "")


def build_post(p):
    title = p["title"]
    paras = "\n".join("      <p>%s</p>" % esc(par) for par in p.get("body", []))
    words = title.split(" ", 1)
    # letter-reveal mask wants the headline pre-split; keep it to one or two
    # lines, breaking after the first word only if the title is long
    if len(title) > 22 and len(words) > 1:
        line1, line2 = words[0], words[1]
        title_line2_html = '<span class="mask"><i>%s</i></span>' % esc(line2)
    else:
        line1, line2 = title, ""
        title_line2_html = ""
    page = POST_TPL.format(
        title=esc(title), title_j=json.dumps(title), slug=p["slug"],
        excerpt=esc(p.get("excerpt", "")), date=p.get("date", ""),
        date_fmt=fmt_date(p.get("date", "")), author=esc(p.get("author", "")),
        tag=esc(p.get("tag", "")), title_line1=esc(line1),
        title_line2_html=title_line2_html, paragraphs=paras,
    )
    out = pathlib.Path("blog") / (p["slug"] + ".html")
    out.write_text(page, encoding="utf-8")
    print("wrote blog/%s.html" % p["slug"])


def build_index():
    cards = []
    for p in POSTS:
        cards.append(
            '    <a class="post-card" data-rev href="%s.html">\n'
            '      <div class="post-meta"><span class="tag">%s</span><span class="date">%s</span></div>\n'
            '      <h2>%s</h2>\n'
            '      <p>%s</p>\n'
            '      <span class="more">Read more <i class="arrow">↗</i></span>\n'
            '    </a>' % (
                p["slug"], esc(p.get("tag", "")), fmt_date(p.get("date", "")),
                esc(p["title"]), esc(p.get("excerpt", "")),
            )
        )
    page = INDEX_TPL.format(cards="\n".join(cards))
    (pathlib.Path("blog") / "index.html").write_text(page, encoding="utf-8")
    print("wrote blog/index.html")


out_dir = pathlib.Path("blog")
out_dir.mkdir(exist_ok=True)
for post in POSTS:
    build_post(post)
build_index()
