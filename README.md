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

## Tuas Mega Port map

- `TuasPort/index.html` renders a 2D Mapbox GL visualization of Tuas Mega Port centered at _(1.24448, 103.62857)_.
- Vessels, quay cranes (QT), yard cranes (YC), automated guided vehicles (AGVs), and perpendicular container stacks are drawn using geo-referenced rectangles/points so they scale with zoom.
- The page ships with a public demo token. To use your own Mapbox token without modifying source, run `localStorage.setItem("tuas-port-mapbox-token", "pk.YOUR_TOKEN")` in the browser console before reloading the page.
- For best compatibility run a lightweight local server (e.g., `npx serve TuasPort`) instead of opening the file directly; some browsers block `file://` module scripts and WebGL workers otherwise.

## Customization

- Update translations by editing the paired `data-lang="en"` / `data-lang="zh"` nodes.
- Extend styling via CSS variables inside `style.css`.
- Connect the contact form to a backend or form service by replacing the placeholder submit handler in `script.js`.
