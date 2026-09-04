# Vaelo Creative — website

Static site. No build step for the pages themselves; one small generator for case studies.

```
index.html              home
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

The home page grid renders from the same file, so it updates on its own.

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
- `assets/showreel.mp4` + `assets/hero-poster.jpg` — uncomment the `<video>` in `index.html`
- `assets/og.jpg` share card, `assets/favicon.svg`
- Real email, phone and client names (placeholders in `index.html` and `assets/work.js`)
