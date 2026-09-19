#!/usr/bin/env python3
"""Stamp assets/vaelo.css and assets/vaelo.js links with a content hash.

Without this, a browser or CDN that has the old stylesheet keeps using it
against freshly deployed HTML. That combination is worse than a plain
stale page: the new markup renders against old rules, so things appear
missing or broken that are actually fine on disk.

Run after changing the CSS or JS, before committing. Safe to re-run.
"""
import hashlib, os, re, glob, sys

def h(path):
    return hashlib.md5(open(path, 'rb').read()).hexdigest()[:8]

css, js = h('assets/vaelo.css'), h('assets/vaelo.js')

files = ['index.html', 'editor.html', 'manage.html',
         'build-cases.py', 'build-posts.py'] \
        + glob.glob('work/*.html') + glob.glob('blog/*.html') + glob.glob('services/*.html')

changed = 0
for f in files:
    if not os.path.exists(f):
        continue
    s = open(f, encoding='utf-8').read()
    o = s
    # strip any existing stamp, then apply the current one
    s = re.sub(r'(vaelo\.css)(\?v=[0-9a-f]+)?', r'\1?v=' + css, s)
    s = re.sub(r'(vaelo\.js)(\?v=[0-9a-f]+)?', r'\1?v=' + js, s)
    if s != o:
        open(f, 'w', encoding='utf-8').write(s)
        changed += 1

print(f"css={css} js={js} -> stamped {changed} file(s)")
