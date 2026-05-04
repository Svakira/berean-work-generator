const searchEl = document.querySelector("#template-search");
const filterEl = document.querySelector("#template-filter");
const gridEl = document.querySelector("#template-library-grid");

let templateItems = [];

function escapeHtml(text) {
  return String(text || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function downloadFile(content, mimeType, filename) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function fillAudienceFilter(items) {
  if (!filterEl) return;
  const audiences = [...new Set(items.map((item) => item.audience).filter(Boolean))];
  filterEl.innerHTML = ["<option value=\"all\">All audiences</option>"]
    .concat(audiences.map((audience) => `<option value="${escapeHtml(audience)}">${escapeHtml(audience)}</option>`))
    .join("");
}

function filteredItems() {
  const query = String(searchEl?.value || "").trim().toLowerCase();
  const audience = filterEl?.value || "all";
  return templateItems.filter((item) => {
    const matchesAudience = audience === "all" || item.audience === audience;
    const haystack = [item.category, item.title, item.theme, item.prompt, item.preview, item.contentFormat, item.audience].join(" ").toLowerCase();
    return matchesAudience && (!query || haystack.includes(query));
  });
}

function renderTemplates(items) {
  if (!gridEl) return;
  if (!items.length) {
    gridEl.innerHTML = "<article class=\"library-card\"><h2>No matching templates</h2><p>Try a different search or audience filter.</p></article>";
    return;
  }

  gridEl.innerHTML = items.map((item) => `
    <article class="library-card">
      <p class="eyebrow">${escapeHtml(item.category)}</p>
      <h2>${escapeHtml(item.title)}</h2>
      <div class="library-card__meta">
        <span class="meta-pill">${escapeHtml(item.audience)}</span>
        <span class="meta-pill">${escapeHtml(item.contentFormat)}</span>
        <span class="meta-pill">${escapeHtml(item.duration)}</span>
      </div>
      <p class="section-copy">${escapeHtml(item.preview || item.theme)}</p>
      <details>
        <summary>View prompt</summary>
        <pre>${escapeHtml(item.prompt)}</pre>
      </details>
      <div class="library-card__actions">
        <a class="btn btn-primary" href="/generator?preset=${encodeURIComponent(item.id)}">Use template</a>
        <button type="button" data-copy-prompt="${escapeHtml(item.id)}">Copy prompt</button>
        <button type="button" data-download-template="${escapeHtml(item.id)}">Download template</button>
      </div>
    </article>
  `).join("");
}

async function loadTemplates() {
  const response = await fetch("/api/premade");
  const payload = await response.json();
  templateItems = Array.isArray(payload.items) ? payload.items : [];
  fillAudienceFilter(templateItems);
  renderTemplates(templateItems);
}

gridEl?.addEventListener("click", async (event) => {
  const target = event.target;
  if (!(target instanceof Element)) return;

  const copyButton = target.closest("[data-copy-prompt]");
  if (copyButton instanceof HTMLButtonElement) {
    const item = templateItems.find((entry) => entry.id === copyButton.dataset.copyPrompt);
    if (!item) return;
    await navigator.clipboard.writeText(item.prompt || "");
    copyButton.textContent = "Prompt copied";
    setTimeout(() => {
      copyButton.textContent = "Copy prompt";
    }, 1400);
    return;
  }

  const downloadButton = target.closest("[data-download-template]");
  if (!(downloadButton instanceof HTMLButtonElement)) return;
  const item = templateItems.find((entry) => entry.id === downloadButton.dataset.downloadTemplate);
  if (!item) return;
  const content = `# ${item.title}\n\nAudience: ${item.audience}\nFormat: ${item.contentFormat}\nDuration: ${item.duration}\n\nTheme\n${item.theme}\n\nPrompt\n${item.prompt}\n\nPreview\n${item.preview}`;
  downloadFile(content, "text/markdown;charset=utf-8", `${item.id}.md`);
});

searchEl?.addEventListener("input", () => renderTemplates(filteredItems()));
filterEl?.addEventListener("change", () => renderTemplates(filteredItems()));

loadTemplates().catch(() => {
  if (gridEl) {
    gridEl.innerHTML = "<article class=\"library-card\"><h2>Templates unavailable</h2><p>Could not load templates right now.</p></article>";
  }
});
