# Design system

Every colour, type size, type family, space, radius and shadow is a custom property in [`assets/css/tokens.css`](../assets/css/tokens.css). No other stylesheet holds a raw colour, a pixel or rem font size or a font name. `node tests/design-tokens.cjs` (part of `node verify.cjs`) fails if one appears.

## Colour roles

Each role has a light value on `:root` and a dark value on `html[data-theme=dark]`. Use the role, not a lookalike, so both themes stay right.

| Role | Use for |
| --- | --- |
| `--page`, `--surface`, `--sunken`, `--raised` | Page background, cards and panels, wells and hover fills, quiet raised blocks |
| `--text`, `--muted` | Body text, secondary text |
| `--line`, `--control` | Dividers and card borders, form control borders |
| `--brand`, `--brand-hover`, `--on-brand` | Primary buttons and pressed controls, and their text |
| `--highlight`, `--on-highlight` | The lime accent and text placed on it |
| `--feature-bg`, `--on-feature` | Large dark panels such as the "Start here" card, lab results, worked examples and the selected sidebar item |
| `--logo-bg`, `--logo-text` | The logo mark, the same in both themes |
| `--link`, `--focus`, `--focus-ring` | Links and the keyboard focus ring |
| `--code-bg`, `--code-header`, `--syntax-*` | Code panels and highlighting |
| `--{green,blue,amber,red,purple}-{bg,line,text}` | Tinted states and diagram families: a fill, a border and a readable text shade |
| `--success`, `--warning`, `--danger` (and `-bg`) | Aliases of green, amber and red for status |

Brand fills are for controls. A panel larger than a button uses the feature tokens, because the dark-mode brand is a bright lime.

## Type

Headings use `--font-heading` (a serif). Body and interface text use `--font-text`, and code uses `--font-code`. Sizes come from eight steps: `--size-meta` (13px), `small` (15), `body` (17), `label` (18), `sub` (22), `section` (28), `title` (36) and `display` (48). The four largest steps shrink below 700px.

## Space and shape

Spacing uses `--space-1` to `--space-9` (4px to 96px). Corners use `--radius-control` for controls and `--radius-card` for cards. Elevation uses `--shadow`, which is flat in dark mode.

## Page frame

`index.html`, `course.html` and `offline.html` share one header: the logo, a short note, the Search, Progress and Offline links, and the theme switch. They also share one footer. Their styles are at the end of `assets/css/styles.css`. Every page loads `tokens.css` before any other stylesheet.
