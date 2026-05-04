# Studio Berean Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the Studio Berean home, generator, template library, and guide flows while preserving generation logic and adding minimal backend support for the new template browsing route.

**Architecture:** Keep the existing Express server and workbook-generation engine intact, then reshape the UI around clearer page responsibilities. Add one dedicated template library page and enrich the premade template payload so the frontend can present prompt and preview details without inventing client-only data.

**Tech Stack:** Express, vanilla HTML/CSS/JS, Node test runner

---

## File Structure

- Modify: `src/server.js`
  - Add `/templates` route
  - Enrich premade template records with display metadata used by the template library page
- Modify: `public/index.html`
  - Replace current home layout with approved editorial landing structure
- Modify: `public/generator.html`
  - Replace current generator layout with compact template band, service band, rails, and central brief builder
- Modify: `public/guide.html`
  - Replace current guide layout with reading-first structure and export-focused sidebar
- Modify: `public/styles.css`
  - Replace visual system and layout styles to support the redesigned pages
- Modify: `public/app.js`
  - Rebind generator logic to the new DOM and add template-library navigation helpers
- Modify: `public/guide.js`
  - Simplify guide interactions to match the new reading/export-first layout
- Create: `public/templates.html`
  - Dedicated template library page
- Create: `public/templates.js`
  - Fetch, filter, preview, copy, and route templates into the generator
- Create: `test/server.test.js`
  - Route and payload tests for `/health`, `/templates`, and `/api/premade`

### Task 1: Backend Template Library Support

**Files:**
- Modify: `src/server.js`
- Test: `test/server.test.js`

- [ ] **Step 1: Write the failing route/payload tests**

```js
import test from "node:test";
import assert from "node:assert/strict";
import { createServerApp } from "../src/server.js";

test("GET /templates returns the template library page", async () => {
  const app = createServerApp();
  const server = app.listen(0);
  const port = server.address().port;

  try {
    const response = await fetch(`http://127.0.0.1:${port}/templates`);
    const html = await response.text();
    assert.equal(response.status, 200);
    assert.match(html, /Template Library/);
  } finally {
    server.close();
  }
});

test("GET /api/premade exposes template previews for the library page", async () => {
  const app = createServerApp();
  const server = app.listen(0);
  const port = server.address().port;

  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/premade`);
    const payload = await response.json();
    assert.equal(response.status, 200);
    assert.ok(Array.isArray(payload.items));
    assert.equal(typeof payload.items[0].prompt, "string");
    assert.equal(typeof payload.items[0].preview, "string");
  } finally {
    server.close();
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- test/server.test.js`
Expected: FAIL because `createServerApp` does not exist and `/templates` is not routed

- [ ] **Step 3: Write minimal backend implementation**

```js
export function createServerApp() {
  const app = express();
  app.use(express.json({ limit: "1mb" }));
  app.use(express.static(path.join(__dirname, "..", "public")));

  app.get("/generator", (_req, res) => {
    res.sendFile(path.join(__dirname, "..", "public", "generator.html"));
  });

  app.get("/guide", (_req, res) => {
    res.sendFile(path.join(__dirname, "..", "public", "guide.html"));
  });

  app.get("/guide/print", (_req, res) => {
    res.sendFile(path.join(__dirname, "..", "public", "guide.html"));
  });

  app.get("/templates", (_req, res) => {
    res.sendFile(path.join(__dirname, "..", "public", "templates.html"));
  });

  app.get("/api/premade", (_req, res) => {
    res.json({ count: PREMADE_WORKBOOKS.length, items: PREMADE_WORKBOOKS });
  });

  return app;
}
```

- [ ] **Step 4: Add preview metadata to premade templates**

```js
{
  id: "teen_anxiety_identity",
  category: "Teens",
  title: "Teen Workbook: Anxiety and Identity",
  theme: "How to handle anxiety and social pressure with biblical identity",
  prompt: "Create a teen-focused workbook on anxiety, social pressure, and identity in Christ...",
  preview: "Short readings, honest reflection prompts, and a practical weekly action for anxious students.",
  audience: "student",
  contentFormat: "worksheet",
  duration: "35 minutes"
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test -- test/server.test.js`
Expected: PASS

### Task 2: Redesign Shared Visual System and Home Page

**Files:**
- Modify: `public/styles.css`
- Modify: `public/index.html`

- [ ] **Step 1: Replace the home markup with the approved layout**

```html
<main class="site-shell page-home">
  <header class="site-header">
    <a class="site-brand" href="/">Studio Berean</a>
    <nav class="site-nav">
      <a href="/generator">Generator</a>
      <a href="/templates">Templates</a>
      <a href="https://berean.ai" target="_blank" rel="noreferrer">Berean.ai</a>
    </nav>
  </header>

  <section class="hero-block">
    <p class="eyebrow">Pastoral, practical, transparent</p>
    <h1>Build studies that feel trustworthy, practical, and ready to teach.</h1>
    <p class="lede">Studio Berean helps teachers, students, and ministry leaders turn real struggles into Scripture-guided workbooks with traceable Berean context.</p>
    <div class="hero-actions">
      <a class="btn btn-primary" href="/generator">Open Generator</a>
      <a class="btn btn-subtle" href="/templates">Browse Templates</a>
    </div>
  </section>
</main>
```

- [ ] **Step 2: Replace the visual system in `public/styles.css`**

```css
:root {
  --bg: #fdfefd;
  --surface: #ffffff;
  --surface-soft: #f7fbfe;
  --line: rgba(76, 101, 126, 0.14);
  --text: #17324b;
  --muted: #5f7286;
  --accent: #56afe2;
  --accent-strong: #2f8dc4;
}

body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font-family: "Instrument Sans", "Segoe UI", sans-serif;
}

.site-shell {
  max-width: 1240px;
  margin: 0 auto;
  padding: 24px;
}

.hero-block {
  display: grid;
  gap: 18px;
  padding: 42px 0 28px;
  border-top: 1px solid var(--line);
}
```

- [ ] **Step 3: Run manual visual check**

Run: `npm start`
Expected: home page loads with bright white background, editorial hero, and working links to generator and templates

### Task 3: Implement Generator Layout and Behavior Binding

**Files:**
- Modify: `public/generator.html`
- Modify: `public/app.js`
- Modify: `public/styles.css`

- [ ] **Step 1: Replace generator markup with the approved structure**

```html
<main class="site-shell page-generator">
  <header class="workspace-hero">
    <div>
      <p class="eyebrow">Generator workspace</p>
      <h1>Build a study with a clear brief, then generate with confidence.</h1>
    </div>
    <div class="workspace-mode-switches">...</div>
  </header>

  <section class="template-band">
    <div class="template-band-head">...</div>
    <div id="premade-list" class="template-strip"></div>
  </section>

  <section class="service-band">
    <div class="service-context">...</div>
    <div class="service-actions">
      <a id="open-berean" class="btn btn-primary" href="https://berean.ai" target="_blank" rel="noreferrer">Ask a question</a>
    </div>
  </section>

  <section class="workspace-grid">
    <aside class="rail rail-left">...</aside>
    <section class="builder-panel">...</section>
    <aside class="rail rail-right">...</aside>
  </section>
</main>
```

- [ ] **Step 2: Rework template rendering in `public/app.js` to match the new row**

```js
function renderPremadeRow(items) {
  if (!premadeListEl) return;
  premadeListEl.innerHTML = `${items.slice(0, 3).map((item) => `
    <button type="button" class="template-card${item.id === (templateSelectEl?.value || "") ? " active" : ""}" data-template-id="${escapeHtml(item.id)}">
      <span class="template-card__eyebrow">${escapeHtml(item.category)}</span>
      <strong>${escapeHtml(item.title)}</strong>
    </button>
  `).join("")}
  <a class="template-card template-card--more" href="/templates">+</a>`;
}
```

- [ ] **Step 3: Keep generator logic working against the new DOM**

```js
function applyPremade(item) {
  if (!item || !form) return;
  form.title.value = item.title;
  form.theme.value = item.token || `[template-${item.id}]`;
  form.audience.value = item.audience;
  form.level.value = item.level;
  form.duration.value = item.duration;
  if (form.presetId) form.presetId.value = item.id;
  renderPremadeRow(premadeItems);
  renderTemplateMeta(item);
}
```

- [ ] **Step 4: Run generator flow manually**

Run: `npm start`
Expected:
- compact template strip renders
- `+` links to `/templates`
- `Ask a question` opens Berean.ai
- generation still submits and opens a saved guide

### Task 4: Add Dedicated Template Library Page

**Files:**
- Create: `public/templates.html`
- Create: `public/templates.js`
- Modify: `public/styles.css`

- [ ] **Step 1: Create template library page structure**

```html
<main class="site-shell page-templates">
  <header class="page-header">
    <a class="plain-back-link" href="/generator">&larr; Back to generator</a>
    <p class="eyebrow">Template Library</p>
    <h1>Browse ready-made study templates.</h1>
  </header>

  <section class="template-library-tools">
    <input id="template-search" type="search" placeholder="Search templates..." />
    <select id="template-filter"><option value="all">All audiences</option></select>
  </section>

  <section id="template-library-grid" class="template-library-grid"></section>
</main>
```

- [ ] **Step 2: Implement template library behavior**

```js
const searchEl = document.querySelector("#template-search");
const filterEl = document.querySelector("#template-filter");
const gridEl = document.querySelector("#template-library-grid");

function renderTemplateLibrary(items) {
  gridEl.innerHTML = items.map((item) => `
    <article class="library-card">
      <p class="eyebrow">${escapeHtml(item.category)}</p>
      <h2>${escapeHtml(item.title)}</h2>
      <p>${escapeHtml(item.preview)}</p>
      <details>
        <summary>View prompt</summary>
        <pre>${escapeHtml(item.prompt)}</pre>
      </details>
      <div class="library-card__actions">
        <a class="btn btn-primary" href="/generator?preset=${encodeURIComponent(item.id)}">Use template</a>
        <button type="button" data-copy-prompt="${escapeHtml(item.id)}">Copy prompt</button>
      </div>
    </article>
  `).join("");
}
```

- [ ] **Step 3: Run manual template-library check**

Run: `npm start`
Expected:
- `/templates` loads
- prompt details expand
- `Use template` routes back into generator with preset query applied

### Task 5: Simplify Guide Viewer to Reading + Export

**Files:**
- Modify: `public/guide.html`
- Modify: `public/guide.js`
- Modify: `public/styles.css`

- [ ] **Step 1: Replace guide markup with the approved reading-first layout**

```html
<main class="site-shell page-guide">
  <header class="guide-topbar">
    <a class="plain-back-link" href="/generator"><span aria-hidden="true">&larr;</span> Back to generator</a>
    <p class="eyebrow">Guide workspace</p>
  </header>

  <section class="guide-grid">
    <article id="guide-view" class="guide-reading-surface"></article>
    <aside class="guide-sidebar">
      <section class="guide-export-panel">...</section>
      <section class="guide-utility-panel">...</section>
    </aside>
  </section>
</main>
```

- [ ] **Step 2: Remove guide script dependencies on deleted edit/quality modules**

```js
const copyMdButton = document.querySelector("#guide-copy-md");
const downloadMdButton = document.querySelector("#guide-download-md");
const downloadHtmlButton = document.querySelector("#guide-download-html");
const printPdfButton = document.querySelector("#guide-print-pdf");
const saveVersionButton = document.querySelector("#guide-save-version");
const pinButton = document.querySelector("#guide-pin");

function renderGuide(record) {
  if (guideTitleEl) guideTitleEl.textContent = record.title;
  if (guideSubtitleEl) guideSubtitleEl.textContent = `${record.workbook.meta.theme} · ${record.workbook.meta.level} · ${record.workbook.meta.duration}`;
  if (guideViewEl) {
    guideViewEl.innerHTML = `...reading-first rendered markup...`;
  }
}
```

- [ ] **Step 3: Manually verify guide page**

Run: `npm start`
Expected:
- guide page opens after generation
- reading surface is dominant
- back link is plain text with arrow
- export actions still work

### Task 6: Run Full Verification

**Files:**
- Test: `test/server.test.js`
- Test: `test/workbookEngine.test.js`

- [ ] **Step 1: Run targeted server tests**

Run: `npm test -- test/server.test.js`
Expected: PASS

- [ ] **Step 2: Run existing workbook engine tests**

Run: `npm test -- test/workbookEngine.test.js`
Expected: PASS

- [ ] **Step 3: Run full test suite**

Run: `npm test`
Expected: PASS

- [ ] **Step 4: Run manual smoke checks**

Run: `npm start`
Expected:
- `/` home page renders redesigned landing page
- `/generator` renders redesigned generator
- `/templates` renders template library
- selecting a template on `/templates` routes into generator and loads it
- generation still returns a guide and opens `/guide?id=...`
- guide export actions still work
