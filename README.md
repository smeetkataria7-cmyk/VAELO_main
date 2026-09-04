# Vaelo Creative — website

Static site. No build step for the pages themselves; one small generator for case studies.

Every path is relative, so the site works three ways: opened straight off disk
by double-clicking `index.html`, served from a folder, or hosted at a domain
root. Two things still need the internet — Google Fonts and nothing else — so
offline the type falls back to the system sans.

```
index.html              home
work/index.html         work archive with category filter tabs
work/<slug>.html        one page per case study (generated — do not hand-edit)
assets/vaelo.css        all styles; brand tokens at the top
assets/vaelo.js         motion (GSAP + ScrollTrigger)
assets/work.js          the work data — the only file you edit to change projects
build-cases.py          regenerates work/ from assets/work.js
wireframes/             audit + exploratory layouts, not part of the site
```

## Adding your images

Download the folder of work, then point the importer at it:

```
python3 import-assets.py ~/Downloads/vaelo-work
python3 build-cases.py
```

Every file is copied into `assets/work/<slug>/`, numbered in natural order, and
written into `assets/work.js` as that project's hero and gallery. The site then
renders real images wherever they exist and keeps the labelled placeholder
wherever they don't — so a half-imported folder still looks finished.

Matching is by folder name first (`Launch Not A Rollout/`, `catalogue-at-scale/`,
`01 Launch/` all find the right project), then by filename prefix. A file named
*hero*, *cover*, *main* or *01* becomes the hero. Anything it cannot match is
listed at the end and left untouched — nothing is silently dropped.

Videos (`.mp4`, `.webm`, `.mov`) are imported too and render as muted autoplay
loops in the galleries.

## Adding or editing a project

1. Edit the object in `assets/work.js` (slug, title, category, scope, year, copy, KPIs).
2. Run `python3 build-cases.py`.
3. Commit the regenerated `work/*.html`.

The home rail and the archive both render from the same file, so they update
on their own — including the archive's category tabs, which are derived from
the categories actually present in the data.

## Brand tokens

Palette, type pairing and motion language are inherited from the original
`vaelo-agency.html` and are treated as fixed:

| Token      | Value                      |
|------------|----------------------------|
| `--black`  | `#0a0a0a`                  |
| `--off`    | `#f4f2ec`                  |
| `--dim`    | `#8c887e`                  |
| `--accent` | `#d6ff3f`                  |
| `--line`   | `rgba(244,242,236,0.14)`   |

Display: Bricolage Grotesque 400–800. Text: Archivo 300–600.

## Still needed before launch

- Real imagery — run `import-assets.py`; until then each `.slot` carries its target dimensions in `data-spec`
- `assets/showreel.mp4` + `assets/hero-poster.jpg` — the `<video>` is already wired
  and takes over the hero the moment the file exists; until then an animated
  canvas backdrop runs in its place
- `assets/og.jpg` share card, `assets/favicon.svg`
- Real email, phone and client names (placeholders in `index.html` and `assets/work.js`)
