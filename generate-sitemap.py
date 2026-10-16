#!/usr/bin/env python3
"""Generate sitemap.xml and robots.txt for the live site.

Run after any content change: python3 generate-sitemap.py
Walks the public HTML files (skips internal tools, wireframes, scratch
files) and writes sitemap.xml with each page's canonical URL and last
modified date, plus a robots.txt that points search engines at it.
"""
import pathlib
from datetime import date

BASE_URL = "https://www.vaelocreative.com"

EXCLUDE_DIRS = {".git", ".claude", "node_modules", "scratchpad", "wireframes", "automation"}
EXCLUDE_FILES = {"editor.html", "manage.html", "vaelo-agency.html", "vaelo-content.html", "vaelo-ops.html"}

root = pathlib.Path(__file__).parent

def public_html_files():
    for p in sorted(root.rglob("*.html")):
        rel = p.relative_to(root)
        if any(part in EXCLUDE_DIRS for part in rel.parts):
            continue
        if rel.name in EXCLUDE_FILES:
            continue
        yield rel

def url_for(rel: pathlib.Path) -> str:
    if rel.name == "index.html":
        if rel.parent == pathlib.Path("."):
            return BASE_URL + "/"
        return f"{BASE_URL}/{rel.parent.as_posix()}/"
    return f"{BASE_URL}/{rel.as_posix()}"

today = date.today().isoformat()

urls = []
for rel in public_html_files():
    loc = url_for(rel)
    mtime = date.fromtimestamp((root / rel).stat().st_mtime).isoformat()
    # homepage and top-level listing pages get a higher priority
    depth = loc.replace(BASE_URL, "").strip("/").count("/")
    priority = "1.0" if loc == BASE_URL + "/" else ("0.8" if depth == 0 else "0.6")
    urls.append((loc, mtime, priority))

urls.sort(key=lambda u: u[0])

lines = ['<?xml version="1.0" encoding="UTF-8"?>',
         '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
for loc, mtime, priority in urls:
    lines.append("  <url>")
    lines.append(f"    <loc>{loc}</loc>")
    lines.append(f"    <lastmod>{mtime}</lastmod>")
    lines.append(f"    <priority>{priority}</priority>")
    lines.append("  </url>")
lines.append("</urlset>")

(root / "sitemap.xml").write_text("\n".join(lines) + "\n", encoding="utf-8")
print(f"wrote sitemap.xml with {len(urls)} URLs")

robots = f"""User-agent: *
Allow: /
Disallow: /editor.html
Disallow: /manage.html
Disallow: /vaelo-agency.html
Disallow: /vaelo-content.html
Disallow: /vaelo-ops.html
Disallow: /wireframes/
Disallow: /automation/

Sitemap: {BASE_URL}/sitemap.xml
"""
(root / "robots.txt").write_text(robots, encoding="utf-8")
print("wrote robots.txt")
