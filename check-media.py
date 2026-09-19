#!/usr/bin/env python3
"""Fail loudly if any file in assets/work/<slug>/ is not referenced by that
project in assets/work.js.

Media kept arriving in a project folder without being added to its gallery,
so a case study would silently show a fraction of what had been delivered.
Run this after importing assets, before committing.
"""
import re, os, sys

s = open('assets/work.js', encoding='utf-8').read()
starts = [m.start() for m in re.finditer(r"\n  \{\n", s)]
ends = [(starts[k+1] if k+1 < len(starts) else s.rindex('\n];')) for k in range(len(starts))]

problems = 0
for st, en in zip(starts, ends):
    blk = s[st:en]
    slug = re.search(r"slug: '([^']+)'", blk).group(1)
    d = 'assets/work/' + slug
    if not os.path.isdir(d):
        print(f"MISSING FOLDER  {d}"); problems += 1; continue
    listed = set(re.findall(r"assets/work/%s/([^']+)" % re.escape(slug), blk))
    disk = {f for f in os.listdir(d) if not f.startswith('.')}
    # a poster is reached through its video, a cover/logo is not a gallery item
    skip = lambda f: f.endswith('-poster.jpg') or f.startswith(('cover.', 'logo.'))
    unused = sorted(f for f in disk if f not in listed and not skip(f))
    absent = sorted(f for f in listed if f not in disk)
    for f in unused:
        print(f"UNUSED          {slug}/{f}  (on disk, not in any gallery)"); problems += 1
    for f in absent:
        print(f"BROKEN LINK     {slug}/{f}  (referenced, not on disk)"); problems += 1

print(f"\n{problems} problem(s)." if problems else "\nEvery file is accounted for.")
sys.exit(1 if problems else 0)
