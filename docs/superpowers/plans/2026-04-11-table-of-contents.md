# Table of Contents Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a sticky right-sidebar TOC on desktop and an inline TOC on mobile to every blog post, with active-heading highlighting driven by IntersectionObserver.

**Architecture:** `rehype-slug` stamps heading IDs at build time; Astro's `render()` returns the heading list for SSG rendering of the TOC; a vanilla JS `IntersectionObserver` script handles active state at runtime. Layout switches from a single centred column to a CSS grid on the post page.

**Tech Stack:** Astro 6, rehype-slug, vanilla JS, plain CSS custom properties

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `package.json` | Modify | Add `rehype-slug` dependency |
| `astro.config.mjs` | Modify | Register `rehype-slug` in `rehypePlugins` |
| `src/components/TableOfContents.astro` | Create | TOC markup, depth-indent styles, IntersectionObserver script |
| `src/pages/posts/[post].astro` | Modify | Destructure `headings`, render TOC, switch to grid layout |

---

## Task 1: Install rehype-slug

**Files:**
- Modify: `package.json`
- Modify: `pnpm-lock.yaml` (auto-updated by pnpm)

- [ ] **Step 1: Install the package**

Run from `services/blog-new/`:
```bash
pnpm add rehype-slug
```
Expected output: something like `+ rehype-slug 6.0.0` and lockfile updated.

- [ ] **Step 2: Verify package.json**

`package.json` `dependencies` should now include:
```json
"rehype-slug": "^6.0.0"
```

- [ ] **Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: add rehype-slug dependency"
```

---

## Task 2: Register rehype-slug in Astro config

**Files:**
- Modify: `astro.config.mjs`

- [ ] **Step 1: Update the config**

Replace the entire contents of `astro.config.mjs` with:

```js
// @ts-check
import { defineConfig } from 'astro/config';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeSlug from 'rehype-slug';
import mdx from '@astrojs/mdx';

// https://astro.build/config
export default defineConfig({
  base: process.env.BASE_PATH || '/',

  markdown: {
      remarkPlugins: [remarkMath],
      rehypePlugins: [rehypeKatex, rehypeSlug],
      shikiConfig: {
          theme: 'github-dark',
      },
  },

  integrations: [mdx()],
});
```

- [ ] **Step 2: Verify the build succeeds**

```bash
pnpm build
```
Expected: build completes with no errors. Check that a sample post's heading has an `id` in the output HTML:
```bash
grep -m3 'id="' dist/posts/deriving-homography-matrix/index.html
```
Expected: lines like `<h2 id="some-heading-text">`.

- [ ] **Step 3: Commit**

```bash
git add astro.config.mjs
git commit -m "feat: add rehype-slug to stamp heading IDs at build time"
```

---

## Task 3: Create TableOfContents.astro component

**Files:**
- Create: `src/components/TableOfContents.astro`

- [ ] **Step 1: Create the component**

Create `src/components/TableOfContents.astro` with the following content:

```astro
---
interface Props {
    headings: { depth: number; slug: string; text: string }[];
}

const { headings } = Astro.props;

// Find the shallowest depth present so indentation is relative
const minDepth = headings.length > 0 ? Math.min(...headings.map(h => h.depth)) : 2;
---

<nav class="toc" aria-label="Table of contents">
    <p class="toc-label">Table of Contents</p>
    <ol class="toc-list">
        {headings.map((heading) => (
            <li
                class="toc-item"
                style={`--indent: ${(heading.depth - minDepth) * 0.75}rem`}
            >
                <a
                    class="toc-link"
                    href={`#${heading.slug}`}
                    data-heading-slug={heading.slug}
                >
                    {heading.text}
                </a>
            </li>
        ))}
    </ol>
</nav>

<script>
    // IntersectionObserver: highlight TOC link for the heading closest to top of viewport
    const links = document.querySelectorAll<HTMLAnchorElement>('.toc-link[data-heading-slug]');
    if (links.length > 0) {
        const slugToLink = new Map<string, HTMLAnchorElement>();
        links.forEach(link => {
            const slug = link.dataset.headingSlug!;
            slugToLink.set(slug, link);
        });

        // Collect all heading elements that have a matching TOC link
        const headingEls: Element[] = [];
        slugToLink.forEach((_, slug) => {
            const el = document.getElementById(slug);
            if (el) headingEls.push(el);
        });

        function setActive(slug: string) {
            links.forEach(l => l.classList.remove('toc-link--active'));
            slugToLink.get(slug)?.classList.add('toc-link--active');
        }

        // Pre-activate the first heading on load
        if (headingEls.length > 0) {
            setActive(headingEls[0].id);
        }

        // -10% top margin means heading must be within top 10% of viewport to activate.
        // -80% bottom margin ignores headings in the bottom 80% of viewport.
        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting) {
                        setActive(entry.target.id);
                    }
                }
            },
            { rootMargin: '-10% 0px -80% 0px' }
        );

        headingEls.forEach(el => observer.observe(el));
    }
</script>

<style>
    .toc {
        font-size: 0.9rem;
        line-height: 1.5;
    }

    .toc-label {
        margin: 0 0 0.5rem;
        font-size: 0.75rem;
        font-weight: 600;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: var(--text-muted-color);
    }

    .toc-list {
        margin: 0;
        padding: 0;
        list-style: none;
    }

    .toc-item {
        padding-left: var(--indent, 0rem);
    }

    .toc-link {
        display: block;
        padding: 0.2rem 0 0.2rem 0.5rem;
        color: var(--text-muted-color);
        text-decoration: none;
        border-left: 2px solid transparent;
        transition: color 0.15s, border-color 0.15s;
        overflow-wrap: anywhere;
    }

    .toc-link:hover {
        color: var(--text-muted-highlight-color);
        text-decoration: none;
    }

    .toc-link--active {
        color: var(--heading-color);
        border-left-color: var(--link-color);
    }
</style>
```

- [ ] **Step 2: Verify the build still succeeds**

```bash
pnpm build
```
Expected: no errors. The component isn't wired up yet so no visual change.

- [ ] **Step 3: Commit**

```bash
git add src/components/TableOfContents.astro
git commit -m "feat: add TableOfContents component with IntersectionObserver active state"
```

---

## Task 4: Wire TOC into post page and switch to grid layout

**Files:**
- Modify: `src/pages/posts/[post].astro`

- [ ] **Step 1: Replace the entire file**

Replace `src/pages/posts/[post].astro` with:

```astro
---
import { getCollection, render } from "astro:content";
import Nav from "../../components/Nav.astro";
import Tag from "../../components/Tag.astro";
import TableOfContents from "../../components/TableOfContents.astro";
import { navItems, parsePost } from "../../data/home";
import BaseLayout from "../../layouts/BaseLayout.astro";

export async function getStaticPaths() {
    const allPosts = await getCollection("posts");
    const allPostsMdx = await getCollection("postsMdx");
    return [...allPosts, ...allPostsMdx].map((post) => ({
        params: { post: post.id },
        props: { post },
    }));
}

const { post } = Astro.props;
const { tags } = parsePost(post);

const { Content, headings } = await render(post);
---

<BaseLayout title={post.data.title}>
    <div class="page">
        <Nav items={navItems} />
        <div class="post-grid">
            <header class="post-header">
                <h1 class="post-title">{post.data.title}</h1>
                {
                    tags.length > 0 && (
                        <div class="post-meta-line">
                            <ul class="post-page-tags">
                                {tags.map((tag) => (
                                    <li>
                                        <Tag tag={tag} />
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )
                }
            </header>
            <aside class="toc-sidebar">
                <TableOfContents headings={headings} />
            </aside>
            <div class="post-body">
                <Content />
            </div>
        </div>
    </div>
</BaseLayout>

<style>
    /* ── Grid layout ────────────────────────────────────────────── */
    .post-grid {
        display: grid;
        grid-template-columns: minmax(0, 52rem) 16rem;
        grid-template-areas:
            "header header"
            "body   toc";
        column-gap: 2rem;
        row-gap: var(--space-md);
        max-width: calc(52rem + 2rem + 16rem);
        margin: 0 auto;
        padding: 0 var(--space-md);
    }

    .post-header {
        grid-area: header;
        margin-bottom: 0;
        text-align: center;
    }

    /* aside comes before post-body in DOM (mobile natural order: header → toc → body).
       On desktop grid-template-areas places it in the right column. */
    .toc-sidebar {
        grid-area: toc;
        position: sticky;
        top: 2rem;
        align-self: start;
        max-height: calc(100vh - 4rem);
        overflow-y: auto;
    }

    .post-body {
        grid-area: body;
        font-size: 1.5rem;
        font-weight: 400;
        min-width: 0;
    }

    /* ── Mobile: collapse to single column ─────────────────────── */
    @media (max-width: 72rem) {
        .post-grid {
            grid-template-columns: 1fr;
            grid-template-areas:
                "header"
                "toc"
                "body";
            max-width: 52rem;
        }

        .toc-sidebar {
            position: static;
            max-height: none;
            overflow-y: visible;
            border-top: 1px solid var(--border-color);
            border-bottom: 1px solid var(--border-color);
            padding: var(--space-sm) 0;
        }
    }

    /* ── Post header styles (unchanged from before) ─────────────── */
    .post-title {
        margin: 0;
        font-size: 2.5rem;
        font-weight: 400;
        color: var(--heading-color);
    }

    .post-meta-line {
        margin: var(--space-xs) 0 0;
        display: flex;
        flex-wrap: wrap;
        align-items: baseline;
        justify-content: center;
        gap: 0.4rem 0.55rem;
        font-family: var(--font-family-base);
        font-size: 1rem;
        color: var(--text-muted-color);
    }

    .post-page-tags {
        margin: 0;
        padding: 0;
        list-style: none;
        display: flex;
        flex-wrap: wrap;
        gap: 0.35rem 0.65rem;
        justify-content: center;
    }
</style>
```

- [ ] **Step 2: Build and visually verify**

```bash
pnpm build && pnpm preview
```

Open `http://localhost:4321/posts/deriving-homography-matrix` (adjust port if needed).

Check:
- Desktop (wide window): TOC visible on the right of the content, content column stays ~52rem wide
- Desktop: scrolling highlights the current heading in the TOC
- Mobile / narrow window (< 72rem): TOC appears between header and post body, full width, with separator lines
- No layout shift or overflow

- [ ] **Step 3: Commit**

```bash
git add src/pages/posts/[post].astro
git commit -m "feat: wire TableOfContents into post page with grid layout"
```

---

## Self-Review Checklist

- [x] `rehype-slug` installed and registered → Task 1 + 2
- [x] `headings` from `render()` passed to component → Task 4 Step 1
- [x] All heading levels rendered (no depth filter) → Task 3 Step 1: no filtering applied
- [x] Always shown (even 0 headings) → no conditional render in Task 4
- [x] Always expanded → no toggle in component
- [x] Desktop sticky sidebar → `position: sticky` in Task 4
- [x] Active heading highlight → `IntersectionObserver` in Task 3
- [x] Mobile inline between header and body → DOM order `aside` before `post-body` + grid-area in Task 4
- [x] Mobile border separators → `border-top/bottom` in mobile media query Task 4
- [x] Depth indentation → `--indent` CSS var computed from `minDepth` in Task 3
- [x] Type consistency → `headings` prop type `{ depth, slug, text }[]` used identically across Tasks 3 and 4
- [x] `post-body` class replaces old `.post-content` class for content area — old `.post-content` on `.page` removed; font-size 1.5rem moved to `.post-body`
