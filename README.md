# O²DES Orchestration Website

A multi-page bilingual (English/中文) marketing site for **O²DES Orchestration Pte. Ltd.**, built as a static experience with a shared design system.

## Structure

- `index.html` – Landing page with hero, value articulation, evolution timeline, and industries served.
- `solutions.html` – Detailed capabilities for consultancy and software/application development.
- `about.html` – Story, vision, principles, team, and culture highlights.
- `contact.html` – Contact channels, inquiry form, HQ information, and CTA.
- `style.css` – Global typography, layout system, gradients, animations, and responsive rules.
- `script.js` – Language toggle logic (persisted via `localStorage`), footer year sync, and contact form feedback.

## Bilingual experience

Text elements contain both English and Chinese content tagged with `data-lang`. The toggle in the header switches between `EN` and `中文`, updates the `lang` attribute, and stores the preference so every page loads in the last selected language.

## How to view

Open `index.html` in any modern browser (Chrome, Edge, Firefox, Safari). The design is responsive and works down to small-screen devices.

## Customization

- Update translations by editing the paired `data-lang="en"` / `data-lang="zh"` nodes.
- Extend styling via CSS variables inside `style.css`.
- Connect the contact form to a backend or form service by replacing the placeholder submit handler in `script.js`.
