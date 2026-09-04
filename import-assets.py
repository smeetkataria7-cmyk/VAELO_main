#!/usr/bin/env python3
"""Wire a folder of real images and video into the site.

Download your Drive folder, drop it anywhere, then:

    python3 import-assets.py ~/Downloads/vaelo-work

Every file is copied into assets/work/<slug>/, sorted, and written into
assets/work.js as that project's hero and gallery. Then run build-cases.py.

How files are matched to projects
---------------------------------
* A subfolder whose name resembles a project title or slug wins outright
  ("Launch Not A Rollout/", "d2c-launch/", "01 Launch/").
* Otherwise a file whose name starts with a project slug is matched
  ("launch-not-a-rollout-03.jpg").
* Anything unmatched is listed at the end and left alone — nothing is
  silently dropped.

A file named *hero*, *cover*, *main* or *01* becomes the hero image;
otherwise the first file in sort order does.
"""
import json, re, shutil, sys, pathlib, unicodedata

ROOT = pathlib.Path(__file__).parent
WORKJS = ROOT / "assets" / "work.js"
DEST = ROOT / "assets" / "work"

IMG = {".jpg", ".jpeg", ".png", ".webp", ".avif", ".gif"}
VID = {".mp4", ".webm", ".mov", ".m4v"}
KEEP = IMG | VID
HERO_HINT = re.compile(r"(hero|cover|main|banner|key|_01\b|-01\b|\b01\b)", re.I)
SKIP = re.compile(r"(^\.|^~\$|thumbs\.db|\.ds_store|desktop\.ini)", re.I)


def norm(s):
    s = unicodedata.normalize("NFKD", str(s)).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "", s.lower())


def load_work():
    src = WORKJS.read_text(encoding="utf-8")
    raw = src[src.index("["): src.rindex("]") + 1]
    raw = re.sub(r"/\*.*?\*/", "", raw, flags=re.S)
    raw = re.sub(r"'((?:[^'\\]|\\.)*)'",
                 lambda m: json.dumps(m.group(1).replace("\\'", "'")), raw)
    raw = re.sub(r"(?m)([{,]\s*)([A-Za-z_]\w*)\s*:", r'\1"\2":', raw)
    raw = re.sub(r",\s*([\]}])", r"\1", raw)
    return json.loads(raw)


def esc(s):
    return str(s or "").replace("\\", "\\\\").replace("'", "\\'")


def write_work(work):
    body = []
    for i, w in enumerate(work):
        kp = ", ".join("['%s', '%s']" % (esc(k[0]), esc(k[1])) for k in w.get("kpis", []))
        imgs = w.get("images") or {}
        gal = ", ".join("'%s'" % esc(g) for g in imgs.get("gallery", []))
        block = ["  {"]
        for key in ("slug", "idx", "title", "cat", "scope", "year", "client",
                    "tile", "summary", "brief", "did"):
            block.append("    %s: '%s'," % (key, esc(w.get(key, ""))))
        block.append("    kpis: [%s]," % kp)
        block.append("    images: { hero: '%s', gallery: [%s] }" %
                     (esc(imgs.get("hero", "")), gal))
        block.append("  }")
        body.append("\n".join(block))
    WORKJS.write_text(
        "/* ==========================================================================\n"
        "   VAELO — work data. One object per case study.\n"
        "   Image paths are written by import-assets.py; everything else is yours\n"
        "   to edit here or in editor.html. After changing this file run\n"
        "   `python3 build-cases.py` to regenerate the pages in /work.\n"
        "   ========================================================================== */\n"
        "window.VAELO_WORK = [\n" + ",\n".join(body) + "\n];\n", encoding="utf-8")


def sort_key(p):
    """Natural sort, so 2 comes before 10."""
    return [int(t) if t.isdigit() else t.lower()
            for t in re.split(r"(\d+)", p.name)]


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    src = pathlib.Path(sys.argv[1]).expanduser()
    if not src.is_dir():
        print("Not a folder: %s" % src)
        sys.exit(1)

    work = load_work()
    index = {}
    for w in work:
        for key in (w["slug"], w["title"], w.get("cat", "")):
            if key:
                index.setdefault(norm(key), w["slug"])

    def match(name):
        n = norm(name)
        if n in index:
            return index[n]
        for w in work:                       # prefix / containment
            s = norm(w["slug"])
            if n.startswith(s) or s in n:
                return w["slug"]
            t = norm(w["title"])
            if t and (n.startswith(t) or t in n):
                return w["slug"]
        return None

    buckets, orphans = {}, []
    files = [p for p in src.rglob("*")
             if p.is_file() and p.suffix.lower() in KEEP and not SKIP.search(p.name)]
    if not files:
        print("No images or video found under %s" % src)
        sys.exit(1)

    for f in files:
        slug = None
        for parent in list(f.relative_to(src).parents)[:-1]:   # nearest folder first
            slug = match(parent.name)
            if slug:
                break
        if not slug:
            slug = match(f.stem)
        (buckets.setdefault(slug, []) if slug else orphans).append(f)

    DEST.mkdir(parents=True, exist_ok=True)
    total = 0
    for w in work:
        got = sorted(buckets.get(w["slug"], []), key=sort_key)
        if not got:
            continue
        out = DEST / w["slug"]
        out.mkdir(parents=True, exist_ok=True)
        rel = []
        for i, f in enumerate(got):
            name = "%02d%s" % (i + 1, f.suffix.lower())
            shutil.copy2(f, out / name)
            rel.append("assets/work/%s/%s" % (w["slug"], name))
            total += 1
        hero = next((r for r, f in zip(rel, got) if HERO_HINT.search(f.name)), rel[0])
        w["images"] = {"hero": hero, "gallery": [r for r in rel if r != hero]}
        print("%-30s %2d files  hero: %s" % (w["title"][:30], len(rel), pathlib.Path(hero).name))

    write_work(work)
    print("\n%d files copied into assets/work/, assets/work.js updated." % total)
    if orphans:
        print("\n%d files could not be matched to a project:" % len(orphans))
        seen = set()
        for f in orphans[:20]:
            folder = f.parent.name
            if folder in seen:
                continue
            seen.add(folder)
            print("   %s/  (e.g. %s)" % (folder, f.name))
        if len(orphans) > 20:
            print("   … and more")
        print("\nRename those folders to match a project title or slug, or add the\n"
              "project in editor.html first, then run this again.")
    print("\nNext: python3 build-cases.py")


if __name__ == "__main__":
    main()
