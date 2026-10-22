# Meow Yoga Birthday invitation

React + TypeScript + Vite + Tailwind v4 + three.js (react-three-fiber) + Supabase.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build
```

Needs `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env`.

## How the hero physics works (`src/three/physics.ts`)

Plain TypeScript with no three.js dependency, so it can be tested headlessly.

**Balloons.** Every balloon is its own rigid body: position, velocity, orientation and angular velocity.

- *String*: a rope constraint is applied at the balloon's knot, so pushing a balloon makes it tilt and pivot around the knot.
- *Strings are drawn* as ribbons that sag and swing with their own spring-mass mid-point.
- *Helium*: each balloon bobs with its own frequency and phase, plus a soft breeze.
- *Shape memory*: a spring pulls each balloon back to its spot in the bunch.
- *Collisions*: restitution plus friction, so balloons bounce off each other and pass on spin.
- *Pointer*: hovering gives an air cushion and a swiping hand drags the skin and spins the balloon. Click or tap bounces whatever is under the pointer.
- *Jelly puff*: a small squash and stretch spring on impacts.

**Disco balls** hang from the top of their chain as damped pendulums with a gentle breeze, so they always sway a little. Swiping drags them, a tap kicks them, and holding one stops its spin.

Tuning lives in `DEFAULT_BALLOON_TUNING` and the `SwingingPendulum` options. `prefers-reduced-motion` turns off all idle motion (balloons and disco balls only move when you touch them).

## Design system (`src/index.css`)

- Semantic tokens for colour, radius, elevation and motion.
- System UI font for reading text, Montserrat only for display moments.
- Component classes (`.btn`, `.icon-btn`, `.field`, `.material`) live in `@layer components`, so Tailwind utilities in the markup always win.
- Minimum 44px touch targets, 16px form fields (no iOS zoom), visible focus rings.
- Honours `prefers-reduced-motion`, `prefers-reduced-transparency`, `prefers-contrast` and forced colours.
