# Table of Contents for Blog Posts

**Date:** 2026-04-11
**Status:** Approved

## Overview

Add a table of contents (TOC) to each blog post. On desktop it appears as a sticky sidebar to the right of the content. On mobile it appears inline between the post header (title + tags) and the post body.

## Requirements

- All heading levels (h2–h6) included
- Always shown (even for posts with 0–2 headings)
- Always expanded (no collapse toggle)
- Desktop: sticky sidebar on the right, active heading highlighted as user scrolls
- Mobile: inline between post header and content, always expanded, no active highlighting needed

## Approach

Pure Astro + `rehype-slug` + vanilla JS `IntersectionObserver`. No new UI frameworks.

- `rehype-slug` stamps IDs onto headings at build time
- Astro's `render()` returns `headings[]` used to build the TOC list at SSG time
- Tiny vanilla `<script>` drives active-heading state at runtime

## Data Pipeline

1. `rehype-slug` added to `rehypePlugins` in `astro.config.mjs` — runs at build time, adds `id` attributes to all headings in rendered HTML (e.g. `"My Section"` → `id="my-section"`)
2. In `[post].astro`, destructure `headings` from `render(post)` alongside `Content`
3. Pass `headings` as a prop to `TableOfContents.astro`

No MDX file changes required.

## New Component: `src/components/TableOfContents.astro`

**Props:** `headings: { depth: number; slug: string; text: string }[]`

**Markup:**
- `<nav class="toc">` wrapper
- `"Table of Contents"` label at top
- Flat `<ol>` — one `<li>` per heading
- Each `<li>` contains `<a href="#slug">text</a>`
- Depth represented via CSS `padding-left` scaled by `(depth - minDepth) * 0.75rem` — flat list, not nested `<ul>`

**Script (inline `<script>` tag, Astro-hoisted):**
- `IntersectionObserver` watches all heading elements within `.post-body`
- Root margin: `-10% 0px -80% 0px` — heading is considered "active" when near the top of viewport
- When a heading enters the active zone, its corresponding TOC `<a>` gets class `.toc-link--active`; all others lose it
- On page load, first heading is pre-activated

**Styling:**
- Font size: `0.9rem`
- Link color: `var(--text-muted-color)` default, `var(--heading-color)` when active
- Active link: left border `2px solid var(--link-color)`, slight `padding-left` shift
- Depth indentation: `(depth - minDepth) * 0.75rem` padding-left on each `<a>`
- No box/card — clean, borderless (Chirpy-style)
- On mobile: top and bottom `1px solid var(--border-color)` separators, `padding: var(--space-sm) 0`

## Layout Change: `[post].astro`

### Desktop (≥ ~72rem viewport)

The post page switches from a single centred column to a CSS grid:

```
[ content (max 52rem) ] [ TOC sidebar (16rem) ]
←——————————————————————————————————————————————→
max-width: calc(52rem + 2rem + 16rem) = 70rem, centred via margin: auto
```

Grid definition:
```css
display: grid;
grid-template-columns: minmax(0, 52rem) 16rem;
grid-template-areas: "header header" "body toc";
gap: var(--space-lg) 2rem;
max-width: calc(52rem + 2rem + 16rem);
margin: 0 auto;
padding: 0 var(--space-md);
```

- `post-header` spans both columns (`grid-area: header`)
- `.post-body` (content) in `body` area
- `.toc-sidebar` in `toc` area, `position: sticky; top: 2rem; align-self: start`

### Mobile (< ~72rem viewport)

Grid collapses to single column via media query. DOM order naturally produces:

1. Nav
2. Post header (title + tags)
3. TOC (inline, full width)
4. Post body

The `.toc-sidebar` loses `position: sticky` on mobile. The `Nav` component sits outside the grid (full width as now).

### DOM structure (simplified)

```html
<div class="page">
  <Nav />
  <div class="post-grid">
    <header class="post-header">…</header>
    <aside class="toc-sidebar"><TableOfContents headings={headings} /></aside>
    <div class="post-body"><Content /></div>
  </div>
</div>
```

**Important:** `<aside>` comes before `<div class="post-body">` in DOM order so that on mobile (single column, no grid-area reordering) the natural flow is: header → TOC → body. On desktop, `grid-template-areas` places `toc-sidebar` in the right column regardless of DOM order.

## Files Touched

| File | Change |
|---|---|
| `astro.config.mjs` | Add `rehype-slug` to `rehypePlugins` |
| `package.json` / `pnpm-lock.yaml` | Add `rehype-slug` dependency |
| `src/components/TableOfContents.astro` | New component (TOC list + IntersectionObserver script) |
| `src/pages/posts/[post].astro` | Destructure `headings`, render `TableOfContents`, switch to grid layout |
| `src/styles/global.css` | No changes expected |

## Non-Goals

- No collapse/expand toggle
- No smooth-scroll override (browser default is fine)
- No TOC on non-post pages (index, about, tags)
- No nested `<ul>` markup — flat list with indent via CSS only
