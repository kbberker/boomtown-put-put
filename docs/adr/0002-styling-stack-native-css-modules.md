# Styling stack: native CSS + CSS Modules, no headless UI library

We style with **native CSS** (nesting + custom properties, no SCSS) using a
small **global base layer** (`@layer base`: reset, neutral `:root` tokens,
semantic-element defaults) plus co-located **CSS Modules** (`*.module.css`) for
component styles. We **defer adopting a headless UI library** and **defer dark
mode / a real palette** to a later design task. Layouts are mobile-first: a
fluid, `max-width`-capped container, not a fixed desktop column.

## Considered options

- **Headless UI library (Radix / React Aria / Base UI) — rejected for now.** The
  only widget that would justify one is the 1–9 score selector, and that is
  better built as a **native radio group**: accessible keyboard navigation,
  screen-reader semantics, and `:checked` styling come for free. No other
  non-native widgets (combobox, focus-trapped modal, popover, tabs) are on the
  roadmap. A headless lib renders real DOM and takes `className`/`asChild`, so
  styling transfers if we ever adopt one — author styles against classes and
  `data-`/`aria-` attributes (not native-only pseudo-classes) to keep that path
  open.
- **SCSS — rejected.** Native CSS nesting and custom properties are Baseline
  Widely Available and already in use in the repo. Sass's remaining extras
  (mixins, `@for`, partials) don't pay for the dependency on a 6-screen app.
  Adding `sass` later is a one-line dependency and a file rename.
- **Global stylesheets only / CSS Modules everywhere — rejected.** Split by role
  instead: global for design tokens and element defaults, Modules for
  component-specific layout, so the cascade stays predictable and component
  styles can't leak.

## Consequences

- `src/index.css` and `src/App.css` (Vite-template scaffolding, including the
  desktop-first `#root { width: 1126px }`) are deleted and replaced by a fresh
  minimal base; the dead `import './App.css'` in `App.tsx` is removed.
- The "native controls only" convention stays in force; the score control's
  eventual richer form is a styled native radio group, not a library widget.
- Re-evaluate the headless-library decision only when a genuinely non-native,
  accessibility-hard widget appears.
