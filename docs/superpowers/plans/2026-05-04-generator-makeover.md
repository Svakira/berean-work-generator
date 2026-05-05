# Generator Makeover Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current 3-column (left-rail / center / right-rail) generator layout with an app-shell design: fixed navy sidebar, thin topbar, centered form with collapsible Study Coach, and a right column for history/progress/trace.

**Architecture:** Pure CSS/HTML change — no JS logic changes needed. The sidebar replaces the top `<header>` on the generator page only. The `workspace-grid` inside becomes a 2-column layout (form + right column). A new `.gen-shell` wrapper provides the full-height flex row.

**Tech Stack:** Vanilla HTML, CSS custom properties, no build tool. Files in `public/`.

---

## Files

- Modify: `public/generator.html` — restructure markup
- Modify: `public/styles.css` — add `.gen-shell`, `.gen-sidebar`, `.gen-topbar`, `.gen-form-col`, `.gen-right-col`, coach toggle styles; remove old generator-specific overrides that conflict

---

### Task 1: Restructure generator.html

**Files:**
- Modify: `public/generator.html`

- [ ] Replace the entire `<main class="site-shell page-generator">` with the new app-shell structure. The new structure is:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="Generate Bible study worksheets and workbooks with the Studio Berean generator. Powered by BEREAN research." />
    <meta property="og:title" content="Generator — Studio Berean" />
    <meta property="og:description" content="Build a study brief, choose a template, and generate a pastoral workbook in minutes." />
    <meta property="og:type" content="website" />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <title>Studio Berean - Generator</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700&family=Libre+Baskerville:wght@400;700&family=Source+Sans+3:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
    <link rel="stylesheet" href="/styles.css" />
  </head>
  <body class="body-gen">
    <div class="gen-shell">

      <!-- LEFT SIDEBAR -->
      <aside class="gen-sidebar">
        <div class="gen-sidebar-logo">
          <a class="site-brand" href="/"><span class="brand-studio">Studio</span><span class="brand-berean">BEREAN</span></a>
        </div>
        <nav class="gen-sidebar-nav" aria-label="Primary">
          <p class="gen-nav-label">Workspace</p>
          <a class="gen-nav-item" href="/">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M2 8L8 2l6 6"/><path d="M3 7v7h4v-4h2v4h4V7"/></svg>
            Home
          </a>
          <a class="gen-nav-item gen-nav-active" href="/generator" aria-current="page">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="2" y="2" width="12" height="12" rx="2"/><path d="M5 6h6M5 9h4"/></svg>
            Generator
          </a>
          <a class="gen-nav-item" href="/templates">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M2 4h12M2 8h8M2 12h10"/></svg>
            Templates
          </a>
          <p class="gen-nav-label">Resources</p>
          <a class="gen-nav-item" href="/guide">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 2"/></svg>
            Recent Guide
          </a>
          <a id="open-berean" class="gen-nav-item" href="https://berean.ai" target="_blank" rel="noreferrer">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="8" cy="8" r="6"/><path d="M8 6v2M8 10h.01"/></svg>
            Ask Berean ↗
          </a>
        </nav>
        <div class="gen-sidebar-status">
          <span class="gen-status-pill">
            <span id="service-status-dot" class="status-dot dot-warn"></span>
            <span id="service-status-text">Checking...</span>
          </span>
        </div>
        <div class="gen-sidebar-bottom">
          <button class="theme-icon-button gen-theme-btn" type="button" aria-label="Switch theme" title="Switch theme">
            <span class="theme-icon theme-icon-sun" aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/>
                <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/>
                <line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/>
                <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>
              </svg>
            </span>
            <span class="theme-icon theme-icon-moon" aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            </span>
            <span style="font-size:0.8rem;margin-left:4px;">Theme</span>
          </button>
        </div>
      </aside>

      <!-- MAIN AREA -->
      <div class="gen-main">

        <!-- TOPBAR -->
        <div class="gen-topbar">
          <p class="gen-topbar-title">Generator Workspace</p>
          <div class="gen-topbar-pills">
            <span class="gen-tpill">Trace enabled</span>
            <span class="gen-tpill">Preset loaded</span>
          </div>
        </div>

        <!-- CONTENT -->
        <div class="gen-content">

          <!-- FORM COLUMN -->
          <div class="gen-form-col">

            <!-- Template row -->
            <section class="gen-template-row template-band">
              <div>
                <p class="eyebrow">Template Library</p>
                <p id="template-status" class="gen-template-desc">Selected: <strong id="preset-label">Custom</strong></p>
              </div>
              <div id="premade-list" class="template-strip gen-template-strip" aria-label="Visible templates"></div>
              <a class="gen-browse-btn" href="/templates">Browse all →</a>
            </section>

            <!-- Main form card -->
            <section class="gen-form-card builder-panel">
              <form id="generator-form" class="builder-form">
                <input id="preset-id" name="presetId" type="hidden" value="" />
                <input id="lesson-context" name="lessonContext" type="hidden" value="" />
                <input id="desired-outcome" name="desiredOutcome" type="hidden" value="" />
                <input id="anchor-scriptures" name="anchorScriptures" type="hidden" value="" />
                <input id="custom-questions" name="customQuestions" type="hidden" value="" />
                <input id="sensitivities" name="sensitivities" type="hidden" value="" />

                <div class="gen-field-group">
                  <label class="gen-field-label" for="title">Guide title</label>
                  <input class="gen-input" id="title" name="title" required value="Workbook: Philippians 4:6-7" />
                </div>

                <div class="gen-field-group">
                  <label class="gen-field-label" for="theme">Your prompt</label>
                  <textarea class="gen-textarea" id="theme" name="theme" rows="5" required>Philippians 4:6-7 and anxiety</textarea>
                </div>

                <div class="gen-config-row">
                  <div class="gen-field-group">
                    <label class="gen-field-label" for="content-format">Format</label>
                    <select class="gen-select" id="content-format" name="contentFormat">
                      <option value="worksheet">Worksheet</option>
                      <option value="workbook">Workbook</option>
                    </select>
                  </div>
                  <div class="gen-field-group">
                    <label class="gen-field-label" for="audience">Audience</label>
                    <select class="gen-select" id="audience" name="audience">
                      <option value="student">Student</option>
                      <option value="teacher">Teacher / Leader</option>
                    </select>
                  </div>
                  <div class="gen-field-group">
                    <label class="gen-field-label" for="level">Level</label>
                    <select class="gen-select" id="level" name="level">
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                  <div class="gen-field-group">
                    <label class="gen-field-label" for="duration">Duration</label>
                    <input class="gen-input" id="duration" name="duration" value="45 minutes" />
                  </div>
                </div>

                <details id="teacher-advanced" class="teacher-builder" hidden>
                  <summary>Teacher build settings</summary>
                  <div class="config-grid config-grid-two">
                    <label>Workbook type<select id="workbook-type" name="workbookType"><option value="session_worksheet">Session Worksheet</option><option value="weekly_plan">Weekly Plan</option><option value="discipleship_track">Discipleship Track</option></select></label>
                    <label>Timeframe<select id="timeframe" name="timeframe"><option value="single_session">Single Session</option><option value="4_weeks">4 Weeks</option><option value="8_weeks">8 Weeks</option><option value="3_months">3 Months</option></select></label>
                  </div>
                  <div class="field-stack">
                    <label>Prior studies<input id="prior-studies" name="priorStudies" /></label>
                    <label>Books to use<input id="source-books" name="sourceBooks" /></label>
                    <label>Themes to reinforce<textarea id="reinforce-topics" name="reinforceTopics" rows="2"></textarea></label>
                    <label>Teacher annotations<textarea id="annotations" name="annotations" rows="2"></textarea></label>
                    <label>Improvement focus<textarea id="improvement-focus" name="improvementFocus" rows="2"></textarea></label>
                  </div>
                </details>

                <!-- Study Coach — collapsible -->
                <details class="gen-coach-details">
                  <summary class="gen-coach-toggle">
                    <span class="gen-coach-icon" aria-hidden="true">✦</span>
                    <span class="gen-coach-toggle-text">
                      <span class="gen-coach-label">Study Coach</span>
                      <span class="gen-coach-sub">Add pastoral context to shape the brief</span>
                    </span>
                    <span class="gen-coach-arrow" aria-hidden="true"></span>
                  </summary>
                  <div class="gen-coach-body">
                    <div class="gen-field-group">
                      <label class="gen-field-label" for="coach-lesson">Topic / lesson context</label>
                      <textarea class="gen-textarea gen-textarea-sm" id="coach-lesson" rows="2" placeholder="What did you teach or what topic are you covering?"></textarea>
                    </div>
                    <div class="gen-field-group">
                      <label class="gen-field-label" for="coach-outcome">Desired outcome</label>
                      <textarea class="gen-textarea gen-textarea-sm" id="coach-outcome" rows="2" placeholder="What should learners understand spiritually?"></textarea>
                    </div>
                    <div class="gen-field-group">
                      <label class="gen-field-label" for="coach-scriptures">Anchor scriptures</label>
                      <textarea class="gen-textarea gen-textarea-sm" id="coach-scriptures" rows="2" placeholder="Which Scriptures matter most?"></textarea>
                    </div>
                    <div class="gen-field-group">
                      <label class="gen-field-label" for="coach-questions">Questions to include</label>
                      <textarea class="gen-textarea gen-textarea-sm" id="coach-questions" rows="2" placeholder="What questions should they wrestle with?"></textarea>
                    </div>
                    <div class="gen-field-group">
                      <label class="gen-field-label" for="coach-sensitive">Sensitive context</label>
                      <textarea class="gen-textarea gen-textarea-sm" id="coach-sensitive" rows="2" placeholder="Any pastoral note or sensitivity?"></textarea>
                    </div>
                    <div class="gen-coach-actions">
                      <button id="coach-build" type="button" class="btn btn-subtle">Build study brief</button>
                      <button id="coach-clear" type="button" class="text-button">Clear</button>
                    </div>
                  </div>
                </details>

                <!-- Brief preview -->
                <div id="brief-preview" class="gen-brief-preview">
                  <p class="gen-brief-label">Study brief preview</p>
                  <p>Use Study Coach to build a structured brief or write your own prompt directly.</p>
                </div>

                <!-- Footer -->
                <div class="gen-form-footer">
                  <p id="status" class="status-line">Ready.</p>
                  <button id="generate" type="submit" class="btn btn-primary btn-large">Generate workbook →</button>
                </div>
              </form>
            </section>

          </div>

          <!-- RIGHT COLUMN -->
          <aside class="gen-right-col">

            <section class="gen-right-section">
              <p class="eyebrow">Recent Guides</p>
              <div id="history-summary" class="history-summary-panel">
                <strong>No recent guide yet.</strong>
                <p>Your latest generated guide will appear here.</p>
              </div>
              <div id="history-list" class="history-list"></div>
            </section>

            <section class="gen-right-section">
              <p class="eyebrow">Progress &amp; Quality</p>
              <div class="gen-quality-score">
                <span id="quality-overall">0</span><span class="gen-quality-denom">/100</span>
              </div>
              <div class="progress-meter">
                <div class="progress-meta"><span>Session progress</span><strong id="progress-label">0%</strong></div>
                <progress id="session-progress" max="100" value="0"></progress>
              </div>
              <div class="signal-inline">
                <article><span>Streak</span><strong id="study-streak">0 days</strong></article>
                <article><span>Sessions</span><strong id="session-count">0</strong></article>
              </div>
              <div id="progress-tasks" class="checklist"></div>
              <ul id="quality-feedback" class="feedback-list"></ul>
              <p id="perk-message" class="panel-copy">Complete your checklist to unlock a celebration.</p>
            </section>

            <section class="gen-right-section">
              <p class="eyebrow">Berean Trace</p>
              <p id="berean-summary" class="panel-copy">Generate a guide to see what Berean searched and cited.</p>
              <ol id="trace-steps" class="trace-list"></ol>
              <details class="detail-block">
                <summary>Prompt trace</summary>
                <pre id="trace-prompts">No prompts yet.</pre>
              </details>
              <details class="detail-block">
                <summary>Response preview</summary>
                <pre id="trace-preview">No answer preview yet.</pre>
              </details>
            </section>

          </aside>
        </div>
      </div>
    </div>
    <script type="module" src="/site.js"></script>
    <script type="module" src="/app.js"></script>
  </body>
</html>
```

- [ ] Verify the file saved correctly — open `http://localhost:4173/generator` and confirm the page loads (it will look broken until CSS is added in Task 2).

---

### Task 2: Add gen-shell CSS to styles.css

**Files:**
- Modify: `public/styles.css` — append a new `/* === GENERATOR APP SHELL === */` block at the end of the file (before any existing media queries for generator that need to be removed).

- [ ] Append this CSS block near the end of `styles.css`, before the final `@media` blocks:

```css
/* === GENERATOR APP SHELL === */

body.body-gen {
  margin: 0;
  padding: 0;
  min-height: 100vh;
  overflow-x: hidden;
}

.gen-shell {
  display: flex;
  min-height: 100vh;
  background: var(--bg);
}

/* ── Sidebar ── */
.gen-sidebar {
  width: 220px;
  flex-shrink: 0;
  background: var(--navy-hero);
  display: flex;
  flex-direction: column;
  position: sticky;
  top: 0;
  height: 100vh;
  overflow-y: auto;
}

.gen-sidebar-logo {
  padding: 20px 20px 16px;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}

.gen-sidebar .site-brand {
  text-decoration: none;
}

.gen-sidebar .brand-studio {
  display: block;
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.15em;
  color: rgba(255,255,255,0.45);
  text-transform: uppercase;
}

.gen-sidebar .brand-berean {
  font-size: 1.3rem;
  font-weight: 800;
  color: white;
  letter-spacing: -0.01em;
  line-height: 1;
  font-family: "Barlow Condensed", "Source Sans 3", sans-serif;
}

.gen-sidebar-nav {
  padding: 12px 10px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
}

.gen-nav-label {
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: rgba(255,255,255,0.3);
  text-transform: uppercase;
  padding: 12px 10px 4px;
  margin: 0;
}

.gen-nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 10px;
  border-radius: 8px;
  color: rgba(255,255,255,0.55);
  font-size: 0.87rem;
  font-weight: 500;
  text-decoration: none;
  transition: background 0.15s, color 0.15s;
}

.gen-nav-item:hover {
  background: rgba(255,255,255,0.07);
  color: rgba(255,255,255,0.85);
}

.gen-nav-item.gen-nav-active {
  background: rgba(86,175,226,0.22);
  color: white;
  font-weight: 600;
}

.gen-nav-item svg {
  flex-shrink: 0;
  opacity: 0.7;
}

.gen-nav-item.gen-nav-active svg {
  opacity: 1;
}

.gen-sidebar-status {
  padding: 12px 14px;
  border-top: 1px solid rgba(255,255,255,0.08);
}

.gen-status-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  background: rgba(255,255,255,0.07);
  border-radius: 999px;
  font-size: 0.75rem;
  color: rgba(255,255,255,0.55);
}

.gen-sidebar-bottom {
  padding: 10px 14px 16px;
  border-top: 1px solid rgba(255,255,255,0.08);
}

.gen-theme-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  color: rgba(255,255,255,0.4);
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 0.82rem;
  padding: 4px 0;
}

.gen-theme-btn:hover {
  color: rgba(255,255,255,0.7);
}

/* ── Main area ── */
.gen-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
}

/* ── Topbar ── */
.gen-topbar {
  background: var(--surface, white);
  border-bottom: 1px solid var(--line);
  padding: 12px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.gen-topbar-title {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: var(--muted);
  text-transform: uppercase;
  margin: 0;
}

.gen-topbar-pills {
  display: flex;
  gap: 8px;
  align-items: center;
}

.gen-tpill {
  padding: 4px 10px;
  border-radius: 999px;
  background: var(--pastel-blue);
  color: var(--accent-strong, #2b7db0);
  font-size: 0.73rem;
  font-weight: 600;
}

/* ── Content split ── */
.gen-content {
  display: flex;
  flex: 1;
  overflow: hidden;
  min-height: 0;
}

/* ── Form column ── */
.gen-form-col {
  flex: 1;
  min-width: 0;
  padding: 20px 24px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Template row */
.gen-template-row {
  background: var(--pastel-blue);
  border: 1px solid rgba(86,175,226,0.2);
  border-radius: 12px;
  padding: 14px 16px;
  display: flex;
  align-items: center;
  gap: 16px;
  /* override template-band defaults */
  border-bottom: 1px solid rgba(86,175,226,0.2) !important;
  padding-inline: 16px !important;
  box-shadow: none;
}

.gen-template-desc {
  font-size: 0.83rem;
  color: var(--muted);
  margin: 2px 0 0;
}

.gen-template-strip {
  flex: 1;
  display: flex;
  gap: 10px;
  overflow: hidden;
}

.gen-template-strip > *:not(:first-child) {
  display: none;
}

.gen-browse-btn {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--accent-strong, #2b7db0);
  text-decoration: none;
  white-space: nowrap;
  flex-shrink: 0;
}

.gen-browse-btn:hover {
  text-decoration: underline;
}

/* Form card */
.gen-form-card {
  background: var(--surface, white);
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.gen-field-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.gen-field-label {
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--muted-strong, #5b7a94);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.gen-input {
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 0.93rem;
  color: var(--text);
  background: var(--bg);
  font-family: inherit;
  width: 100%;
  outline: none;
  transition: border-color 0.15s;
}

.gen-input:focus {
  border-color: var(--accent);
  background: var(--surface, white);
}

.gen-textarea {
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 0.93rem;
  color: var(--text);
  background: var(--bg);
  font-family: inherit;
  width: 100%;
  outline: none;
  resize: vertical;
  min-height: 90px;
  transition: border-color 0.15s;
  line-height: 1.55;
}

.gen-textarea:focus {
  border-color: var(--accent);
  background: var(--surface, white);
}

.gen-textarea-sm {
  min-height: 56px;
}

.gen-config-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  gap: 12px;
}

.gen-select {
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 9px 12px;
  font-size: 0.88rem;
  color: var(--text);
  background: var(--bg);
  font-family: inherit;
  width: 100%;
  outline: none;
}

.gen-select:focus {
  border-color: var(--accent);
}

/* Study Coach collapsible */
.gen-coach-details {
  border: 1px solid var(--line);
  border-radius: 10px;
  overflow: hidden;
}

.gen-coach-toggle {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  background: var(--surface-soft, #f4f7fb);
  cursor: pointer;
  list-style: none;
  user-select: none;
}

.gen-coach-toggle::-webkit-details-marker { display: none; }

.gen-coach-details[open] .gen-coach-toggle {
  border-bottom: 1px solid var(--line);
}

.gen-coach-icon {
  width: 28px;
  height: 28px;
  background: var(--pastel-blue);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent);
  font-size: 14px;
  flex-shrink: 0;
}

.gen-coach-toggle-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.gen-coach-label {
  font-size: 0.88rem;
  font-weight: 700;
  color: var(--text);
}

.gen-coach-sub {
  font-size: 0.76rem;
  color: var(--muted);
}

.gen-coach-arrow {
  width: 8px;
  height: 8px;
  border-right: 2px solid var(--muted);
  border-bottom: 2px solid var(--muted);
  transform: rotate(45deg);
  transition: transform 0.2s;
  flex-shrink: 0;
}

.gen-coach-details[open] .gen-coach-arrow {
  transform: rotate(-135deg);
}

.gen-coach-body {
  padding: 16px 14px;
  background: var(--surface-soft, #f4f7fb);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.gen-coach-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

/* Brief preview */
.gen-brief-preview {
  background: var(--pastel-peach);
  border: 1px solid rgba(200,140,60,0.2);
  border-radius: 10px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.gen-brief-label {
  font-size: 0.7rem;
  font-weight: 700;
  color: #c47f00;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.gen-brief-preview p {
  font-size: 0.88rem;
  color: var(--text);
  line-height: 1.55;
  margin: 0;
}

/* Form footer */
.gen-form-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 4px;
}

/* ── Right column ── */
.gen-right-col {
  width: 260px;
  flex-shrink: 0;
  background: var(--surface, white);
  border-left: 1px solid var(--line);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.gen-right-section {
  padding: 16px;
  border-bottom: 1px solid var(--line);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.gen-right-section .eyebrow {
  margin: 0;
}

.gen-quality-score {
  display: flex;
  align-items: baseline;
  gap: 3px;
}

.gen-quality-score span:first-child {
  font-size: 2rem;
  font-weight: 800;
  color: var(--text);
  line-height: 1;
}

.gen-quality-denom {
  font-size: 0.9rem;
  color: var(--muted);
}

/* Override history items inside gen-right-col */
.gen-right-col .history-item {
  background: transparent;
  border-left: 0;
  border-right: 0;
  border-radius: 0;
  padding: 10px 0;
  border-top: 1px solid var(--line);
  border-bottom: 0;
  box-shadow: none;
}

.gen-right-col .history-item:first-child {
  border-top: 0;
}

.gen-right-col .history-item strong {
  font-size: 0.88rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.35;
  color: var(--text);
}

.gen-right-col .history-item p {
  display: none;
}

.gen-right-col .history-item small {
  font-size: 0.75rem;
  color: var(--muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
}

.gen-right-col .history-actions {
  display: flex;
  gap: 0;
  flex-wrap: nowrap;
  align-items: center;
}

.gen-right-col .history-actions a,
.gen-right-col .history-actions button {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--accent-strong, #2b7db0);
  padding: 0 8px 0 0;
  margin-right: 8px;
  border-right: 1px solid var(--line);
  border-top: 0; border-bottom: 0; border-left: 0;
  background: transparent;
  text-decoration: none;
  cursor: pointer;
}

.gen-right-col .history-actions a:last-child,
.gen-right-col .history-actions button:last-child {
  border-right: 0; margin-right: 0; padding-right: 0;
}

.gen-right-col .history-actions .history-delete {
  color: var(--muted);
}

/* Responsive: collapse right col at narrow widths */
@media (max-width: 900px) {
  .gen-right-col { display: none; }
  .gen-config-row { grid-template-columns: 1fr 1fr; }
}

@media (max-width: 600px) {
  .gen-sidebar { display: none; }
  .gen-config-row { grid-template-columns: 1fr; }
}
```

- [ ] Verify styles are appended and valid — no duplicate braces, save the file.

---

### Task 3: Remove conflicting old generator CSS

**Files:**
- Modify: `public/styles.css`

The old generator styles (`.page-generator .template-band`, `.page-generator .service-band`, `.page-generator .workspace-grid`, `.page-generator .rail`, etc.) are no longer needed since the generator page now uses `.gen-shell` classes. They won't conflict much because the new HTML doesn't use `.page-generator`, but the `.service-band` and `.workspace-grid` classes on the new page don't exist — so old rules are dead code. No action needed unless visual bugs appear.

- [ ] Open `http://localhost:4173/generator` and check for obvious visual conflicts. If any `.panel`, `.builder-panel`, or `.template-band` default styles conflict with the new layout, add targeted overrides inside the `=== GENERATOR APP SHELL ===` block:

```css
/* Ensure gen-form-card overrides panel defaults */
.gen-form-card.builder-panel {
  padding: 24px;
  border-radius: 12px;
  box-shadow: none;
}

/* Ensure gen-template-row overrides template-band defaults */
.gen-template-row.template-band {
  padding: 14px 16px;
  border-bottom: 1px solid rgba(86,175,226,0.2);
  padding-inline: 16px;
}
```

---

### Task 4: Dark mode support

**Files:**
- Modify: `public/styles.css`

- [ ] Add dark mode overrides inside the `=== GENERATOR APP SHELL ===` block:

```css
[data-theme="dark"] .gen-sidebar {
  background: #0d1e2e;
}

[data-theme="dark"] .gen-topbar {
  background: var(--surface);
  border-color: var(--line);
}

[data-theme="dark"] .gen-form-card {
  background: var(--surface);
}

[data-theme="dark"] .gen-coach-toggle,
[data-theme="dark"] .gen-coach-body {
  background: var(--surface-soft);
}

[data-theme="dark"] .gen-right-col {
  background: var(--surface);
}
```

---

### Task 5: Final visual check

- [ ] Open `http://localhost:4173/generator` — verify:
  - Sidebar visible on the left, navy background, logo, nav items
  - Topbar shows "Generator Workspace" + pills
  - Template row shows with pastel blue background
  - Form card is white with proper spacing
  - Study Coach `<details>` toggles open/closed
  - Right column shows with history + progress sections
  - Generate button is prominent at the bottom right of the form
  - Page is scrollable if content is taller than viewport

- [ ] Switch to dark mode (theme toggle) and verify no broken colors.

- [ ] Resize browser to 900px — verify right column hides. Resize to 600px — verify sidebar hides.

- [ ] Commit:
```bash
cd /Users/svak/berean-workbook-mvp
git add public/generator.html public/styles.css
git commit -m "feat: generator app-shell redesign — sidebar, topbar, collapsible coach"
```
