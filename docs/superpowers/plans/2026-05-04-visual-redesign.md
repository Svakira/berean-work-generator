# Visual Redesign — Option C Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the approved "Option C" visual redesign: navy hero with SVG book illustration on the Home page, pastel color-coded cards, navy navbar on all pages, and a dark CTA footer section on Home.

**Architecture:** All changes are CSS + HTML only — no JS needed. New CSS variables for pastel palette and navy header are added to `styles.css`. HTML pages get modifier classes and the SVG illustration is inlined in `index.html`.

**Tech Stack:** Vanilla HTML/CSS, no build tool. Dev server: `http://localhost:4173`. Files in `public/`.

---

### Task 1: Add pastel + navy CSS variables and base styles

**Files:**
- Modify: `public/styles.css` (lines 1–39 — add vars after existing root block)

- [ ] **Step 1: Add new CSS variables to `:root`**

In `styles.css`, after the existing `:root { ... }` block (after line 21), add:

```css
:root {
  /* existing vars … */
  --pastel-blue: #e8f5ff;
  --pastel-green: #eef9f0;
  --pastel-lavender: #f3ecfa;
  --pastel-peach: #fef6ec;
  --navy-hero: #17324b;
  --navy-hero-mid: #1f3e5a;
  --navy-hero-soft: rgba(255,255,255,0.08);
}
```

- [ ] **Step 2: Add dark-mode overrides for pastel vars**

In `[data-theme="dark"]` block, add (pastels become dark-tinted surfaces in dark mode):

```css
[data-theme="dark"] {
  /* existing … */
  --pastel-blue: #0d2030;
  --pastel-green: #0d2318;
  --pastel-lavender: #1a1328;
  --pastel-peach: #271c0d;
  --navy-hero: #091520;
  --navy-hero-mid: #0f2233;
}
```

- [ ] **Step 3: Verify server is running, open browser to confirm no visual breakage**

Open `http://localhost:4173` — page should look identical (vars not used yet).

---

### Task 2: Navy navbar on all pages (via `.site-header-navy` modifier)

**Files:**
- Modify: `public/styles.css` (near `.site-header` block ~line 119)
- Modify: `public/index.html` (line 19)
- Modify: `public/generator.html` (header line)
- Modify: `public/guide.html` (header line)
- Modify: `public/templates.html` (line 19)

- [ ] **Step 1: Add `.site-header-navy` CSS class**

After the `.site-header` block in `styles.css`, add:

```css
.site-header-navy {
  background: var(--navy-hero);
  border-color: transparent;
  border-radius: var(--radius-md);
  padding: 12px 20px 12px;
  margin-bottom: 4px;
}

.site-header-navy .brand-studio {
  color: rgba(255,255,255,0.5);
}

.site-header-navy .brand-berean {
  color: #ffffff;
}

.site-header-navy .site-nav a {
  color: rgba(255,255,255,0.65);
}

.site-header-navy .site-nav a:hover,
.site-header-navy .site-nav a[aria-current="page"] {
  color: #ffffff;
}

.site-header-navy .theme-icon-button {
  border-color: rgba(255,255,255,0.18);
  background: rgba(255,255,255,0.08);
  color: rgba(255,255,255,0.7);
}

.site-header-navy .theme-icon-button:hover {
  background: rgba(255,255,255,0.15);
}

[data-theme="dark"] .site-header-navy {
  background: var(--navy-hero);
}
```

- [ ] **Step 2: Add class to all four HTML headers**

In `public/index.html` line 19:
```html
<header class="site-header site-header-navy">
```

In `public/generator.html` header:
```html
<header class="site-header site-header-navy site-header-tight">
```

In `public/guide.html` header:
```html
<header class="site-header site-header-navy site-header-tight">
```

In `public/templates.html` line 19:
```html
<header class="site-header site-header-navy site-header-tight">
```

- [ ] **Step 3: Verify all 4 pages show navy navbar**

Open `http://localhost:4173`, `/generator`, `/templates`, `/guide` — each should show white text on navy header.

---

### Task 3: Home hero — navy background with SVG book illustration

**Files:**
- Modify: `public/index.html` (lines 45–73 — hero section)
- Modify: `public/styles.css` (near `.hero-block` ~line 260)

- [ ] **Step 1: Add hero redesign CSS**

Add after the `.page-home .hero-block .lede` block in `styles.css`:

```css
.home-hero {
  background: var(--navy-hero);
  border-radius: var(--radius-xl);
  padding: 52px 48px 44px;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 32px;
  align-items: center;
  position: relative;
  overflow: hidden;
}

.home-hero::before {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at 70% 50%, rgba(86,175,226,0.12) 0%, transparent 65%);
  pointer-events: none;
}

.home-hero .eyebrow {
  color: rgba(255,255,255,0.55);
}

.home-hero h1 {
  color: #ffffff;
  max-width: 16ch;
}

.home-hero .lede {
  color: rgba(255,255,255,0.72);
  max-width: 55ch;
}

.home-hero-main {
  display: grid;
  gap: 16px;
  position: relative;
  z-index: 1;
}

.home-hero-illustration {
  width: 200px;
  flex-shrink: 0;
  position: relative;
  z-index: 1;
  opacity: 0.92;
}

.home-hero .hero-actions {
  margin-top: 4px;
}

.home-hero .btn-primary {
  background: var(--accent);
  color: #f0faff;
  box-shadow: 0 12px 28px rgba(86,175,226,0.35);
}

.home-hero .btn-subtle {
  background: rgba(255,255,255,0.1);
  border-color: rgba(255,255,255,0.22);
  color: rgba(255,255,255,0.85);
}

.home-hero .btn-subtle:hover {
  background: rgba(255,255,255,0.18);
}

/* Remove the old hero side panel on home */
.home-hero-side {
  display: none;
}

@media (max-width: 680px) {
  .home-hero {
    grid-template-columns: 1fr;
    padding: 36px 28px 32px;
  }
  .home-hero-illustration {
    display: none;
  }
}
```

- [ ] **Step 2: Replace hero section in `public/index.html`**

Replace the entire `<section class="hero-block home-hero">` block (lines 45–73) with:

```html
      <section class="hero-block home-hero">
        <div class="home-hero-main">
          <p class="eyebrow">Pastoral, practical, transparent</p>
          <h1>Build studies that feel trustworthy, practical, and ready to teach.</h1>
          <p class="lede">Studio Berean helps teachers, students, and ministry leaders turn real struggles into guided Bible workbooks with visible Berean traceability.</p>
          <div class="hero-actions home-hero-actions">
            <a class="btn btn-primary" href="/generator">Open Generator</a>
            <a class="btn btn-subtle" href="/templates">Browse Templates</a>
          </div>
        </div>
        <figure class="home-hero-illustration" aria-hidden="true">
          <svg viewBox="0 0 200 220" fill="none" xmlns="http://www.w3.org/2000/svg">
            <!-- Book spine -->
            <rect x="96" y="28" width="8" height="160" rx="2" fill="rgba(255,255,255,0.18)"/>
            <!-- Left page -->
            <rect x="28" y="36" width="68" height="148" rx="6" fill="rgba(232,245,255,0.14)" stroke="rgba(255,255,255,0.22)" stroke-width="1.5"/>
            <!-- Right page -->
            <rect x="104" y="36" width="68" height="148" rx="6" fill="rgba(243,236,250,0.14)" stroke="rgba(255,255,255,0.22)" stroke-width="1.5"/>
            <!-- Left page text lines -->
            <rect x="38" y="58" width="48" height="4" rx="2" fill="rgba(255,255,255,0.35)"/>
            <rect x="38" y="68" width="40" height="4" rx="2" fill="rgba(255,255,255,0.25)"/>
            <rect x="38" y="78" width="44" height="4" rx="2" fill="rgba(255,255,255,0.25)"/>
            <rect x="38" y="88" width="36" height="4" rx="2" fill="rgba(255,255,255,0.20)"/>
            <rect x="38" y="104" width="48" height="4" rx="2" fill="rgba(255,255,255,0.30)"/>
            <rect x="38" y="114" width="38" height="4" rx="2" fill="rgba(255,255,255,0.22)"/>
            <rect x="38" y="124" width="44" height="4" rx="2" fill="rgba(255,255,255,0.20)"/>
            <rect x="38" y="134" width="32" height="4" rx="2" fill="rgba(255,255,255,0.18)"/>
            <rect x="38" y="150" width="44" height="4" rx="2" fill="rgba(255,255,255,0.20)"/>
            <rect x="38" y="160" width="36" height="4" rx="2" fill="rgba(255,255,255,0.16)"/>
            <!-- Right page text lines -->
            <rect x="114" y="58" width="48" height="4" rx="2" fill="rgba(255,255,255,0.35)"/>
            <rect x="114" y="68" width="38" height="4" rx="2" fill="rgba(255,255,255,0.25)"/>
            <rect x="114" y="78" width="44" height="4" rx="2" fill="rgba(255,255,255,0.25)"/>
            <rect x="114" y="88" width="42" height="4" rx="2" fill="rgba(255,255,255,0.20)"/>
            <rect x="114" y="104" width="44" height="4" rx="2" fill="rgba(255,255,255,0.28)"/>
            <rect x="114" y="114" width="36" height="4" rx="2" fill="rgba(255,255,255,0.22)"/>
            <rect x="114" y="124" width="48" height="4" rx="2" fill="rgba(255,255,255,0.20)"/>
            <rect x="114" y="134" width="30" height="4" rx="2" fill="rgba(255,255,255,0.18)"/>
            <rect x="114" y="150" width="40" height="4" rx="2" fill="rgba(255,255,255,0.20)"/>
            <rect x="114" y="160" width="44" height="4" rx="2" fill="rgba(255,255,255,0.16)"/>
            <!-- Bookmark ribbon -->
            <path d="M148 36 L148 72 L142 66 L136 72 L136 36 Z" fill="rgba(86,175,226,0.7)"/>
            <!-- Sparkle top right -->
            <circle cx="178" cy="48" r="3" fill="rgba(255,255,255,0.4)"/>
            <circle cx="186" cy="38" r="1.5" fill="rgba(255,255,255,0.3)"/>
            <circle cx="170" cy="42" r="1.5" fill="rgba(255,255,255,0.25)"/>
          </svg>
        </figure>
      </section>
```

- [ ] **Step 3: Verify hero looks correct at `http://localhost:4173`**

Open Home page. Should see: navy rounded hero, white heading, muted lede, SVG book on the right, blue CTA button.

---

### Task 4: Color-coded overview cards (Home)

**Files:**
- Modify: `public/styles.css` (near `.home-overview` section)
- Modify: `public/index.html` (lines 84–104 — overview section)

- [ ] **Step 1: Add pastel card styles for overview**

Add to `styles.css` after the `.home-overview` section:

```css
.home-overview-columns {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.home-overview-columns article {
  border-radius: var(--radius-md);
  padding: 24px 22px;
  border: 1px solid transparent;
}

.home-overview-columns article:nth-child(1) {
  background: var(--pastel-blue);
  border-color: rgba(86,175,226,0.18);
}

.home-overview-columns article:nth-child(2) {
  background: var(--pastel-green);
  border-color: rgba(47,142,102,0.15);
}

.home-overview-columns article:nth-child(3) {
  background: var(--pastel-lavender);
  border-color: rgba(120,80,180,0.14);
}

.home-overview-columns article span {
  font-size: 0.72rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  font-weight: 800;
  color: var(--muted);
}

.home-overview-columns article:nth-child(1) span { color: var(--accent-strong); }
.home-overview-columns article:nth-child(2) span { color: var(--success); }
.home-overview-columns article:nth-child(3) span { color: #7b4db0; }

[data-theme="dark"] .home-overview-columns article:nth-child(3) span { color: #b07ce8; }

.home-overview-columns article strong {
  display: block;
  margin-top: 8px;
  font-size: 1rem;
  line-height: 1.4;
  color: var(--text);
}

@media (max-width: 680px) {
  .home-overview-columns {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 2: Verify overview cards show pastel colors**

Open `http://localhost:4173` and scroll to "What it does". Each of the three cards should have a different pastel background.

---

### Task 5: Peach flow section + dark CTA on Home

**Files:**
- Modify: `public/styles.css`
- Modify: `public/index.html` (lines 106–139)

- [ ] **Step 1: Add flow section peach background and dark CTA styles**

Add to `styles.css`:

```css
.home-flow {
  background: var(--pastel-peach);
  border-radius: var(--radius-xl);
  padding: 40px 44px;
  border: 1px solid rgba(200,140,60,0.12);
}

.home-flow-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-top: 24px;
}

.home-flow-row article {
  display: grid;
  gap: 6px;
}

.home-flow-row article span {
  width: 32px;
  height: 32px;
  border-radius: 999px;
  background: rgba(200,130,50,0.15);
  color: #b06820;
  font-size: 0.82rem;
  font-weight: 800;
  display: inline-grid;
  place-items: center;
}

[data-theme="dark"] .home-flow-row article span {
  background: rgba(200,130,50,0.22);
  color: #e09848;
}

.home-flow-row article strong {
  font-size: 0.98rem;
  color: var(--text);
}

.home-flow-row article p {
  font-size: 0.88rem;
  color: var(--muted);
  margin: 0;
  line-height: 1.55;
}

@media (max-width: 680px) {
  .home-flow {
    padding: 28px 22px;
  }
  .home-flow-row {
    grid-template-columns: 1fr;
  }
}

/* Dark CTA — home-final */
.home-final {
  background: var(--navy-hero);
  border-radius: var(--radius-xl);
  padding: 44px 48px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

.home-final .eyebrow {
  color: rgba(255,255,255,0.5);
}

.home-final h2 {
  color: #ffffff;
  margin: 6px 0 0;
  font-size: clamp(1.4rem, 2.5vw, 2rem);
  max-width: 28ch;
}

.home-final-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  align-items: center;
}

.home-final .btn-primary {
  background: var(--accent);
  color: #f0faff;
  box-shadow: 0 10px 24px rgba(86,175,226,0.3);
}

.home-final .plain-link-strong {
  color: rgba(255,255,255,0.7);
}

.home-final .plain-link-strong:hover {
  color: #ffffff;
}

@media (max-width: 680px) {
  .home-final {
    padding: 32px 24px;
  }
}
```

- [ ] **Step 2: Add class `home-flow` to the flow section and `home-final` to the final CTA in `index.html`**

The flow section (line 106) already has class `home-flow`. Verify the final section (line 130) has class `home-final`. Both should already be in place from the current HTML; if any class is missing, add it.

- [ ] **Step 3: Verify peach flow and dark CTA sections**

Open `http://localhost:4173`, scroll to "How it flows" (should be peach-tinted) and "Start here" (should be dark navy). Both should look polished.

---

### Task 6: Commit

**Files:** All modified files in `public/`

- [ ] **Step 1: Commit the visual redesign**

```bash
cd /Users/svak/berean-workbook-mvp
git add public/styles.css public/index.html public/generator.html public/guide.html public/templates.html
git commit -m "feat: visual redesign option C — navy hero, pastel cards, dark CTA"
```
