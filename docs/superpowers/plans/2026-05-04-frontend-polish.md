# Frontend Polish & Production Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Polish the Studio Berean frontend for production launch — fixing visual bugs, unifying navigation, improving information architecture, adding the correct brand lockup, and making all pages properly responsive and production-ready.

**Architecture:** Vanilla HTML/CSS/JS with no build tool. All changes are in `public/` — HTML files, `styles.css`, and JS files. The design system uses CSS custom properties already defined in `:root`. We add one new Google Font (Barlow Condensed), fix a broken font reference (Fraunces), unify the 4-page navigation pattern, simplify the Generator page, fix the Guide page header, and add production meta/favicon assets.

**Tech Stack:** HTML5, CSS3 custom properties, vanilla ES modules, Google Fonts

---

## File Map

| File | Action | What changes |
|---|---|---|
| `public/index.html` | Modify | Meta description, OG tags, favicon link, logo markup, hide continue section by default |
| `public/generator.html` | Modify | Meta description, OG tags, favicon link, logo markup, remove workspace hero image + quickstart, add compact page heading |
| `public/guide.html` | Modify | Meta description, OG tags, favicon link, replace `guide-topbar` with standard `site-header`, move back link below header, consolidate sidebar panels |
| `public/templates.html` | Modify | Meta description, OG tags, favicon link, logo markup |
| `public/styles.css` | Modify | Add Barlow Condensed brand styles, remove Fraunces (or keep but load), fix SVG icon button, add print styles, add generate loading state, add mobile nav tightening, hide continue section by default class, tighten home page section gaps |
| `public/site.js` | Modify | Replace Unicode icons with inline SVG; handle generate button loading state |
| `public/home.js` | Modify | Hide continue section when no data |
| `public/app.js` | Modify | Disable generate button during generation, re-enable on complete/error |
| `public/favicon.svg` | Create | Simple "B" brand mark SVG |
| `public/favicon.ico` | Create (optional) | ICO fallback — can use SVG-only for modern browsers |
| `public/robots.txt` | Create | Allow all |
| `public/sitemap.xml` | Create | 4-page sitemap |

---

## Task 1: Load Correct Fonts & Fix Fraunces Bug

**Files:**
- Modify: `public/index.html`
- Modify: `public/generator.html`
- Modify: `public/guide.html`
- Modify: `public/templates.html`

**Context:** All 4 HTML files currently load only Libre Baskerville + Source Sans 3. Fraunces is referenced in `styles.css` (`.history-item strong`, `.library-card h2`, `.signal-stack article strong`, `.template-card strong`) but never loaded — silently falls back to Georgia. We will replace all Fraunces references in CSS with Libre Baskerville (they're both serifs, it's consistent), and add Barlow Condensed for the brand logo.

- [ ] **Step 1: Update all 4 HTML `<link>` font tags**

Replace the existing Google Fonts `<link>` tag in all 4 HTML files. The old tag:

```html
<link href="https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&family=Source+Sans+3:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
```

New tag (add Barlow Condensed 700):

```html
<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700&family=Libre+Baskerville:wght@400;700&family=Source+Sans+3:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
```

Apply this change to: `public/index.html`, `public/generator.html`, `public/guide.html`, `public/templates.html`

- [ ] **Step 2: Replace Fraunces with Libre Baskerville in styles.css**

In `public/styles.css`, find all occurrences of `"Fraunces"` and replace with `"Libre Baskerville"`. There are 4 occurrences:

```css
/* OLD */
font-family: "Fraunces", Georgia, serif;
/* NEW */
font-family: "Libre Baskerville", Georgia, serif;
```

Run this replacement on lines: 845, 992, 1336, 1406 (search for `Fraunces` to confirm line numbers).

- [ ] **Step 3: Verify fonts load**

Open http://localhost:4173 in a browser. Open DevTools → Network → filter "font". Confirm Barlow Condensed and Libre Baskerville requests appear. Confirm no 404s.

- [ ] **Step 4: Commit**

```bash
cd /Users/svak/berean-workbook-mvp
git add public/index.html public/generator.html public/guide.html public/templates.html public/styles.css
git commit -m "fix: load Barlow Condensed, replace broken Fraunces font reference"
```

---

## Task 2: Brand Logo Treatment

**Files:**
- Modify: `public/styles.css` (add `.brand-studio`, `.brand-berean` styles)
- Modify: `public/index.html`
- Modify: `public/generator.html`
- Modify: `public/guide.html`
- Modify: `public/templates.html`

**Context:** The current brand link renders as plain text "Studio Berean" in Libre Baskerville. The goal is "Studio" in small uppercase Source Sans 3 + "BEREAN" in large Barlow Condensed Bold, resembling the BEREAN.AI image provided by the user.

- [ ] **Step 1: Add brand CSS to styles.css**

Add after the `.site-brand` rule (around line 148 in current CSS):

```css
.site-brand {
  font-family: "Libre Baskerville", Georgia, serif;
  font-size: 1.35rem;
  text-decoration: none;
  display: inline-flex;
  flex-direction: column;
  line-height: 1;
  gap: 1px;
}

.brand-studio {
  font-family: "Source Sans 3", "Segoe UI", sans-serif;
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--muted);
  line-height: 1;
}

.brand-berean {
  font-family: "Barlow Condensed", sans-serif;
  font-size: 1.5rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--text);
  line-height: 1;
}
```

- [ ] **Step 2: Update logo HTML in all 4 files**

Replace every instance of:
```html
<a class="site-brand" href="/">Studio Berean</a>
```
with:
```html
<a class="site-brand" href="/"><span class="brand-studio">Studio</span><span class="brand-berean">BEREAN</span></a>
```

There are 3 instances in headers (index.html, generator.html, templates.html) and 3 in footers (all pages). The guide.html header will also get this after Task 3 replaces the guide topbar.

Footer brand links:
```html
<a class="site-brand footer-brand" href="/">Studio Berean</a>
```
Replace with:
```html
<a class="site-brand footer-brand" href="/"><span class="brand-studio">Studio</span><span class="brand-berean">BEREAN</span></a>
```

- [ ] **Step 3: Visual check**

Open http://localhost:4173. The navbar should show "Studio" (small, spaced, muted) above "BEREAN" (large, bold condensed, dark). Check all 4 pages.

- [ ] **Step 4: Commit**

```bash
git add public/styles.css public/index.html public/generator.html public/guide.html public/templates.html
git commit -m "feat: implement Studio/BEREAN brand logo with Barlow Condensed"
```

---

## Task 3: Unify Navigation — Guide Page Header

**Files:**
- Modify: `public/guide.html`
- Modify: `public/styles.css`

**Context:** The Guide page uses a `guide-topbar` instead of `site-header`. It has no brand logo and no links to Home or Templates. We replace it with the standard `site-header` and add the "Back to generator" link as the first element after the header, inside the page content.

- [ ] **Step 1: Replace guide-topbar in guide.html**

Remove this block entirely:
```html
<header class="guide-topbar">
  <div class="plain-link plain-link-arrow"><span aria-hidden="true">&larr;</span><a href="/generator">Back to generator</a></div>
  <div class="guide-topbar-actions">
    <p class="eyebrow">Guide workspace</p>
    <button class="theme-icon-button" type="button" aria-label="Switch to dark theme" title="Switch to dark theme">
      <span class="theme-icon theme-icon-sun" aria-hidden="true">☼</span>
      <span class="theme-icon theme-icon-moon" aria-hidden="true">◐</span>
    </button>
  </div>
</header>
```

Replace with:
```html
<header class="site-header site-header-tight">
  <a class="site-brand" href="/"><span class="brand-studio">Studio</span><span class="brand-berean">BEREAN</span></a>
  <div class="site-header-tools">
    <nav class="site-nav" aria-label="Primary">
      <a href="/">Home</a>
      <a href="/generator">Generator</a>
      <a href="/templates">Templates</a>
    </nav>
    <button class="theme-icon-button" type="button" aria-label="Switch to dark theme" title="Switch to dark theme">
      <span class="theme-icon theme-icon-sun" aria-hidden="true">☼</span>
      <span class="theme-icon theme-icon-moon" aria-hidden="true">◐</span>
    </button>
  </div>
</header>
```

- [ ] **Step 2: Add back link below header**

After the new `</header>` and before `<section class="guide-hero">`, add:
```html
<div class="plain-link plain-link-arrow page-back-link">
  <span aria-hidden="true">&larr;</span><a href="/generator">Back to generator</a>
</div>
```

- [ ] **Step 3: Add page-back-link CSS to styles.css**

Add after `.page-header-block` rules:
```css
.page-back-link {
  padding: 8px 0 0;
}
```

- [ ] **Step 4: Verify guide page**

Open http://localhost:4173/guide. The header should now match the other pages. "Back to generator" link appears below the header.

- [ ] **Step 5: Commit**

```bash
git add public/guide.html public/styles.css
git commit -m "fix: unify guide page header with standard site-header and nav"
```

---

## Task 4: Dark Mode — SVG Icons

**Files:**
- Modify: `public/site.js`
- Modify: `public/styles.css`
- Modify: `public/index.html`, `public/generator.html`, `public/guide.html`, `public/templates.html`

**Context:** The theme toggle button uses Unicode text characters `☼` and `◐`. We replace with clean inline SVG icons. The JS-driven approach stays the same (toggle via `data-theme` attribute).

- [ ] **Step 1: Replace icon spans in all HTML files**

In every HTML file, find:
```html
<span class="theme-icon theme-icon-sun" aria-hidden="true">☼</span>
<span class="theme-icon theme-icon-moon" aria-hidden="true">◐</span>
```

Replace with:
```html
<span class="theme-icon theme-icon-sun" aria-hidden="true">
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/>
    <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/>
    <line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/>
    <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>
  </svg>
</span>
<span class="theme-icon theme-icon-moon" aria-hidden="true">
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
</span>
```

Apply to all 4 HTML files.

- [ ] **Step 2: Update .theme-icon CSS**

In `styles.css`, the `.theme-icon` class uses `font-size: 0.9rem`. Update to work with SVGs:

```css
.theme-icon {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 140ms ease;
}
```

Remove the `line-height: 1;` and `font-size: 0.9rem` from the original `.theme-icon` rule.

- [ ] **Step 3: Visual check**

Open all 4 pages. Theme toggle button shows sun icon in light mode, moon icon in dark mode. Icons should be crisp SVG lines, not text glyphs.

- [ ] **Step 4: Commit**

```bash
git add public/index.html public/generator.html public/guide.html public/templates.html public/styles.css
git commit -m "fix: replace Unicode theme toggle icons with SVG"
```

---

## Task 5: Generator Page — Remove Redundant Hero, Add Compact Heading

**Files:**
- Modify: `public/generator.html`
- Modify: `public/styles.css`

**Context:** The generator `workspace-hero` section contains a large h1, lede paragraph, hero image, and 3-step quickstart list. This duplicates the home page "How it flows" section. User decision: keep a minimal compact heading (eyebrow + h1 + one-line description), remove the image and quickstart steps.

- [ ] **Step 1: Replace workspace-hero section in generator.html**

Remove the entire `<section class="workspace-hero">` block (lines 29–64 in current generator.html):
```html
<section class="workspace-hero">
  <div class="workspace-hero-main">
    ...
  </div>
  <figure class="generator-hero-image-frame">...</figure>
  <section class="generator-quickstart">
    ...
  </section>
</section>
```

Replace with a compact heading:
```html
<section class="generator-page-header">
  <p class="eyebrow">Generator workspace</p>
  <h1>Build a study brief and generate with confidence.</h1>
</section>
```

- [ ] **Step 2: Add generator-page-header CSS**

In `styles.css`, add:
```css
.generator-page-header {
  display: grid;
  gap: 6px;
  padding: 20px 0 4px;
  border-bottom: 1px solid var(--line);
  margin-bottom: 4px;
}

.generator-page-header h1 {
  font-size: clamp(1.5rem, 2.5vw, 2rem);
  line-height: 1.12;
  max-width: 24ch;
}
```

- [ ] **Step 3: Remove now-unused CSS**

In `styles.css`, find and remove (or comment out) these rules that are now unused:
- `.page-generator .workspace-hero h1` (line ~876)
- `.page-generator .workspace-hero` (line ~881)
- `.workspace-hero-main` (line ~890)
- `.generator-side-list` and its children (lines ~896–918)
- `.page-generator .workspace-hero .lede` (lines ~920–929)
- `.generator-hero-image-frame` (lines ~932–944)
- `.generator-hero-image` (lines ~946–953)
- `.generator-quickstart` (lines ~955–959)
- `.generator-quickstart-list` and its children (lines ~961–1000)

**Important:** Only remove these if they're truly unused after the HTML change. Search all HTML files to confirm no other page uses these classes before removing.

- [ ] **Step 4: Visual check**

Open http://localhost:4173/generator. The page should now start with: header → compact "Generator workspace" heading → template strip → service band → 3-column workspace. No image, no quickstart steps.

- [ ] **Step 5: Commit**

```bash
git add public/generator.html public/styles.css
git commit -m "refactor: simplify generator page header, remove redundant hero content"
```

---

## Task 6: Home Page — Fix Continue Section

**Files:**
- Modify: `public/home.js`
- Modify: `public/styles.css`

**Context:** The "Continue" section (`#continue-panel`) shows "No recent guide yet" as an `<h2>` by default — a prominent broken-looking empty state that shows on every first visit. It should be hidden when there's no data in localStorage, and revealed only when a guide exists. Read `home.js` to understand the current logic before editing.

- [ ] **Step 1: Read current home.js**

Read `public/home.js` to understand how `continue-panel`, `continue-title`, `continue-copy`, and `continue-link` are currently populated.

- [ ] **Step 2: Add hidden-by-default class to continue section in index.html**

In `public/index.html`, find:
```html
<section id="continue-panel" class="continue-inline">
```
Change to:
```html
<section id="continue-panel" class="continue-inline continue-hidden">
```

- [ ] **Step 3: Add CSS for continue-hidden**

In `public/styles.css`, add:
```css
.continue-hidden {
  display: none;
}
```

- [ ] **Step 4: Update home.js to reveal the section when data exists**

In `public/home.js`, find where `continue-title` or `continue-link` is set (the code that populates the continue panel from localStorage). After that code successfully finds a guide to show, add:

```javascript
const continuePanel = document.getElementById('continue-panel');
if (continuePanel) {
  continuePanel.classList.remove('continue-hidden');
}
```

If no guide is found, the `continue-hidden` class stays and the panel remains `display: none`.

- [ ] **Step 5: Visual check**

Open http://localhost:4173 in a fresh private/incognito window (no localStorage). The "Continue" section should not appear. Generate a workbook on /generator, then return to home — the section should appear with the guide info.

- [ ] **Step 6: Commit**

```bash
git add public/index.html public/styles.css public/home.js
git commit -m "fix: hide continue section on home page when no recent guide exists"
```

---

## Task 7: Generator — Loading State for Generate Button

**Files:**
- Modify: `public/app.js`
- Modify: `public/styles.css`

**Context:** The "Generate workbook" submit button has no loading/disabled state. During generation (which can take several seconds), the user can click it multiple times. Read `app.js` to understand the form submission flow before editing.

- [ ] **Step 1: Read app.js**

Read `public/app.js` to understand the generate form submission, where status messages are set, and where the response is handled.

- [ ] **Step 2: Add loading state CSS**

In `styles.css`, add:
```css
.btn[disabled],
.btn[aria-busy="true"] {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  pointer-events: none;
}
```

- [ ] **Step 3: Update app.js to disable button during generation**

In `app.js`, find the form `submit` event handler. At the start of generation:

```javascript
const generateBtn = document.getElementById('generate');
generateBtn.disabled = true;
generateBtn.setAttribute('aria-busy', 'true');
generateBtn.textContent = 'Generating…';
```

After generation completes (success or error):
```javascript
generateBtn.disabled = false;
generateBtn.removeAttribute('aria-busy');
generateBtn.textContent = 'Generate workbook';
```

- [ ] **Step 4: Visual check**

Open /generator, click "Generate workbook". Button should immediately show "Generating…" and be unclickable. After the response, it returns to "Generate workbook".

- [ ] **Step 5: Commit**

```bash
git add public/app.js public/styles.css
git commit -m "feat: add loading/disabled state to generate button"
```

---

## Task 8: Guide Page — Sidebar Cleanup

**Files:**
- Modify: `public/guide.html`
- Modify: `public/styles.css`

**Context:** The guide sidebar currently has 7+ action buttons across two panels plus a compare panel. The "Delete guide" action is destructive and should be guarded. The Trace details panel should default to collapsed.

- [ ] **Step 1: Guard the delete button in guide.html**

Find the delete button in guide.html:
```html
<button id="guide-delete" type="button" class="text-button text-button-block">Delete guide</button>
```

Wrap it in a `<details>` to require deliberate expansion:
```html
<details class="danger-action-detail">
  <summary>Danger zone</summary>
  <button id="guide-delete" type="button" class="text-button text-button-block guide-delete-btn">Delete this guide</button>
</details>
```

- [ ] **Step 2: Add danger-action-detail CSS**

```css
.danger-action-detail summary {
  cursor: pointer;
  color: var(--danger);
  font-size: 0.85rem;
  font-weight: 700;
}

.guide-delete-btn {
  color: var(--danger);
  margin-top: 8px;
}
```

- [ ] **Step 3: Collapse trace details by default**

In guide.html, find:
```html
<details class="detail-block" open>
  <summary>Trace summary</summary>
```
Remove `open`:
```html
<details class="detail-block">
  <summary>Trace summary</summary>
```

- [ ] **Step 4: Visual check**

Open /guide. The sidebar should not have a visible "Delete guide" button — only a subtle "Danger zone" summary link. Trace summary should be collapsed by default.

- [ ] **Step 5: Commit**

```bash
git add public/guide.html public/styles.css
git commit -m "fix: guard delete action in guide sidebar, collapse trace by default"
```

---

## Task 9: Responsive — Mobile Nav & Generator Layout

**Files:**
- Modify: `public/styles.css`

**Context:** On mobile (≤760px), the 3-column generator workspace needs to stack correctly. The current `@media (max-width: 1080px)` query already collapses `workspace-grid` to 1 column, but the order should be: main builder first, then Study Coach (left rail), then right rail (progress, trace). We use CSS `order` to reorder on mobile since the HTML order is left-rail → main → right-rail.

Also tighten mobile nav spacing and ensure the brand logo treatment looks good on small screens.

- [ ] **Step 1: Fix column order on mobile in styles.css**

In the `@media (max-width: 1080px)` block, add:
```css
.page-generator .workspace-grid {
  grid-template-columns: 1fr;
}

.page-generator .builder-column {
  order: -1;
}

.page-generator .rail-left {
  order: 0;
}

.page-generator .rail-right {
  order: 1;
}
```

- [ ] **Step 2: Ensure rail-right class exists in generator.html**

In generator.html, find:
```html
<aside class="rail rail-right">
```
This class already exists. Confirm it's there; no change needed if so.

- [ ] **Step 3: Brand logo mobile sizing**

In the `@media (max-width: 760px)` block, add:
```css
.brand-berean {
  font-size: 1.3rem;
}

.brand-studio {
  font-size: 0.55rem;
}
```

- [ ] **Step 4: Mobile nav — reduce gap**

Already handled by existing `@media (max-width: 760px)` rules. Verify the nav wraps cleanly. If nav overflows at very small screens (320px), add:

```css
@media (max-width: 480px) {
  .site-nav {
    display: none;
  }
}
```

This hides the nav links entirely at very small screens (the brand and theme toggle still show). Only add this if testing reveals overflow issues.

- [ ] **Step 5: Visual check at multiple widths**

Resize browser to: 1440px (full), 1080px (tablet), 760px (large mobile), 390px (iPhone 14). Check:
- Header brand logo renders correctly at all widths
- Generator 3 columns collapse to: builder → study coach → right rail
- Guide page header consistent with others

- [ ] **Step 6: Commit**

```bash
git add public/styles.css
git commit -m "fix: correct generator column order on mobile, tighten mobile nav"
```

---

## Task 10: Production Meta Tags & Favicon

**Files:**
- Create: `public/favicon.svg`
- Create: `public/robots.txt`
- Create: `public/sitemap.xml`
- Modify: `public/index.html`, `public/generator.html`, `public/guide.html`, `public/templates.html`

- [ ] **Step 1: Create favicon.svg**

Create `public/favicon.svg`:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="6" fill="#17324b"/>
  <text x="5" y="24" font-family="Georgia, serif" font-size="22" font-weight="700" fill="#fdfefd">B</text>
</svg>
```

- [ ] **Step 2: Create robots.txt**

Create `public/robots.txt`:
```
User-agent: *
Allow: /
```

- [ ] **Step 3: Create sitemap.xml**

Create `public/sitemap.xml` (replace `https://your-domain.com` with the actual production domain when known):
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://your-domain.com/</loc><priority>1.0</priority></url>
  <url><loc>https://your-domain.com/generator</loc><priority>0.9</priority></url>
  <url><loc>https://your-domain.com/templates</loc><priority>0.7</priority></url>
  <url><loc>https://your-domain.com/guide</loc><priority>0.5</priority></url>
</urlset>
```

- [ ] **Step 4: Add meta tags to index.html**

In `public/index.html`, add to `<head>` after `<meta name="viewport">`:
```html
<meta name="description" content="Studio Berean helps teachers, students, and ministry leaders build traceable Bible workbooks with pastoral clarity." />
<meta property="og:title" content="Studio Berean" />
<meta property="og:description" content="Build Bible study workbooks with visible Berean traceability. Practical, pastoral, transparent." />
<meta property="og:type" content="website" />
<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
```

- [ ] **Step 5: Add meta tags to generator.html**

```html
<meta name="description" content="Generate Bible study worksheets and workbooks with the Studio Berean generator. Powered by BEREAN research." />
<meta property="og:title" content="Generator — Studio Berean" />
<meta property="og:description" content="Build a study brief, choose a template, and generate a pastoral workbook in minutes." />
<meta property="og:type" content="website" />
<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
```

- [ ] **Step 6: Add meta tags to guide.html**

```html
<meta name="description" content="View, export, and compare your generated Bible study guides." />
<meta property="og:title" content="Guide Viewer — Studio Berean" />
<meta property="og:description" content="View and export your generated Bible study guide. Download as PDF, Markdown, or HTML." />
<meta property="og:type" content="website" />
<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
```

- [ ] **Step 7: Add meta tags to templates.html**

```html
<meta name="description" content="Browse ready-made Bible study templates for students, teachers, families, and ministry leaders." />
<meta property="og:title" content="Template Library — Studio Berean" />
<meta property="og:description" content="Ready-made workbook prompts for every pastoral context. Open directly in the generator." />
<meta property="og:type" content="website" />
<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
```

- [ ] **Step 8: Verify favicon shows in browser tab**

Open http://localhost:4173 and confirm the "B" favicon appears in the browser tab.

- [ ] **Step 9: Commit**

```bash
git add public/favicon.svg public/robots.txt public/sitemap.xml public/index.html public/generator.html public/guide.html public/templates.html
git commit -m "feat: add favicon, meta descriptions, OG tags, robots.txt, sitemap"
```

---

## Task 11: Print Styles for Guide Page

**Files:**
- Modify: `public/styles.css`

**Context:** The Guide page has an "Export PDF" button that calls `window.print()`. Without print CSS, the sidebar, header, and footer will print too. We want only the `#guide-view` reading surface to print.

- [ ] **Step 1: Add print CSS to styles.css**

At the very end of `styles.css`, add:
```css
@media print {
  .site-header,
  .guide-topbar,
  .guide-hero,
  .guide-sidebar,
  .site-footer,
  .page-back-link {
    display: none !important;
  }

  .guide-grid {
    display: block;
  }

  .guide-reading-surface {
    border: none;
    box-shadow: none;
    padding: 0;
  }

  body {
    background: white;
    color: black;
  }
}
```

- [ ] **Step 2: Test print preview**

Open /guide, open a guide (if available), then use Ctrl/Cmd+P to open print preview. Confirm only the reading surface content appears.

- [ ] **Step 3: Commit**

```bash
git add public/styles.css
git commit -m "feat: add print styles so guide export PDF hides sidebar and nav"
```

---

## Task 12: Visual Polish — Spacing, Hover States, Tightening

**Files:**
- Modify: `public/styles.css`

**Context:** Final pass of visual refinements — tighten home page section gaps, add subtle hover treatment to side list cards, clean up the service band, ensure the template card active/hover states have good contrast.

- [ ] **Step 1: Tighten home page section gap**

In `styles.css`, find:
```css
.page-home {
  gap: 34px;
}
```
Change to:
```css
.page-home {
  gap: 28px;
}
```

- [ ] **Step 2: Add hover treatment to hero side list items**

Find `.hero-side-list article`:
```css
.hero-side-list article {
  display: grid;
  gap: 4px;
  padding-top: 12px;
  border-top: 1px solid var(--line);
}
```
Add transition and hover:
```css
.hero-side-list article {
  display: grid;
  gap: 4px;
  padding-top: 12px;
  border-top: 1px solid var(--line);
  transition: border-color 150ms ease;
}

.hero-side-list article:hover {
  border-top-color: var(--accent);
}
```

- [ ] **Step 3: Home final CTA — replace second button with link**

In `public/index.html`, find the `.home-final` section buttons:
```html
<div class="hero-actions home-hero-actions">
  <a class="btn btn-primary" href="/generator">Open Generator</a>
  <a class="btn btn-subtle" href="/templates">View Templates</a>
</div>
```
Replace with:
```html
<div class="home-final-actions">
  <a class="btn btn-primary" href="/generator">Open Generator</a>
  <a class="plain-link-strong" href="/templates">Browse Templates &rarr;</a>
</div>
```

Add CSS:
```css
.home-final-actions {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}
```

- [ ] **Step 4: Template card active state contrast**

Find `.template-card.active`:
```css
.template-card.active {
  background: #ecf7fe;
  border-color: rgba(86, 175, 226, 0.28);
  box-shadow: 0 8px 18px rgba(86, 175, 226, 0.08);
}
```
Improve dark mode active state by adding:
```css
[data-theme="dark"] .template-card.active {
  background: rgba(103, 194, 241, 0.12);
  border-color: rgba(103, 194, 241, 0.35);
}
```

- [ ] **Step 5: Visual check across all pages and both themes**

Check light mode and dark mode on: Home, Generator, Guide, Templates. Confirm:
- Section gaps feel balanced on home page
- Side list items show subtle accent border on hover
- Final CTA uses link instead of two buttons
- Template cards have visible active state in dark mode

- [ ] **Step 6: Commit**

```bash
git add public/styles.css public/index.html
git commit -m "polish: tighten spacing, hover states, final CTA, dark mode template cards"
```

---

## Self-Review

**Spec coverage check:**
- ✅ Font fix (Fraunces bug) → Task 1
- ✅ Logo treatment (Studio + BEREAN) → Task 2
- ✅ Navigation unification → Task 3
- ✅ Dark mode SVG icons → Task 4
- ✅ Generator hero removal → Task 5
- ✅ Continue section hide-by-default → Task 6
- ✅ Generate button loading state → Task 7
- ✅ Guide sidebar cleanup + delete guard → Task 8
- ✅ Mobile responsive column order → Task 9
- ✅ Favicon, meta tags, robots.txt, sitemap → Task 10
- ✅ Print styles → Task 11
- ✅ Visual polish pass → Task 12

**Placeholder scan:** No TBDs, no "implement later" references. All code blocks are complete. Commands include expected outcomes.

**Type consistency:** CSS class names used in tasks match the HTML markup referenced. `rail-right` class confirmed in generator.html. `continue-hidden` is new and consistent across Task 6 HTML + CSS steps.
