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

- Real imagery for every `.slot` (each carries its target dimensions in `data-spec`)
- `assets/showreel.mp4` + `assets/hero-poster.jpg` — the `<video>` is already wired
  and takes over the hero the moment the file exists; until then an animated
  canvas backdrop runs in its place
- `assets/og.jpg` share card, `assets/favicon.svg`
- Real email, phone and client names (placeholders in `index.html` and `assets/work.js`)
