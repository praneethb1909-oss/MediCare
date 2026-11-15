# Project memory

## Product intent & audience

- MediCare: a healthcare/medical management web application.
- Role-based access with three user types: admin, doctor, patient — each gets a tailored sidebar menu.
- Core features: appointment booking, telemedicine, medical records, digital prescriptions, billing, emergency dispatch, lab diagnostics, hospital/bed management.
- Audience: hospital staff, doctors, and patients interacting with the same platform.

## Brand personality & voice

- Professional healthcare brand; copy should be specific and concrete, not marketing filler.
- User actively wants the site to read as human-made and avoids "AI slop" tells (generic copy, template references, missing supporting pages).

## Visual design & UX direction

- Vite + React + Tailwind CSS + Lucide React icons (per `.bolt/prompt`; no other UI/icon packages).
- Typography: Inter loaded via Google Fonts with preconnect; set as default `sans` in `tailwind.config.js`; `font-sans` applied to body in `src/index.css` with Inter-specific font feature settings.
- Layout: `DashboardLayout` wraps page content with a `Sidebar` (left) and `Footer` (bottom); footer receives a navigation function for link routing.
- Routing: `App.tsx` owns a `View` type and conditional rendering; shared views (about, services, contact) are available to all roles.
- Sidebar uses role-grouped menu items with Lucide icons (e.g., `Layers` for Services).
- Footer includes brand description, quick-access app links, info links (About/Services/Contact), and real contact details + emergency number.

## Decisions, constraints & rationale

- All `bolt.new` references (script URLs, meta tags, HTML comments, og/twitter image URLs) removed from `index.html`.
- Added real meta description (site-specific, 30+ chars) and full Open Graph + Twitter card tags in `index.html`; og:image uses a real hospital photo, not a bolt.new placeholder.
- Supporting pages required to avoid AI-slop flags: AboutUs and ContactUs already existed; added a new ServicesPage with 8 detailed service descriptions, stats bar, and CTA.
- ServicesPage linked from all three role menus in Sidebar and registered as a `services` view in `App.tsx`.
- No GitHub link added because no real repo/profile was referenced in the project.
- Build verified clean after changes; no `bolt.new` strings in built output.

## Open questions & assumptions

- Font loading currently via Google Fonts CDN; user expressed preference for self-hosted woff2 — may need migration if performance/ownership becomes a priority.
- No real GitHub profile was available to link; if one exists it should be added to footer/header.
- OG image points to an external hospital photo URL; a brand-owned, self-hosted image would be more durable.