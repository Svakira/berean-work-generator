const guideTitleEl = document.querySelector("#guide-title");
const guideSubtitleEl = document.querySelector("#guide-subtitle");
const guideViewEl = document.querySelector("#guide-view");
const guideTraceStepsEl = document.querySelector("#guide-trace-steps");
const guideTracePromptsEl = document.querySelector("#guide-trace-prompts");
const guideTracePreviewEl = document.querySelector("#guide-trace-preview");
const guideMetaViewEl = document.querySelector("#guide-meta-view");
const compareSelectEl = document.querySelector("#guide-compare-select");
const compareRunEl = document.querySelector("#guide-compare-run");
const compareOutputEl = document.querySelector("#guide-compare-output");
const copyMdButton = document.querySelector("#guide-copy-md");
const downloadMdButton = document.querySelector("#guide-download-md");
const downloadHtmlButton = document.querySelector("#guide-download-html");
const printPdfButton = document.querySelector("#guide-print-pdf");
const reflectBereanButton = document.querySelector("#guide-reflect-berean");
const copyReflectionButton = document.querySelector("#guide-copy-reflection");
const saveVersionButton = document.querySelector("#guide-save-version");
const pinButton = document.querySelector("#guide-pin");
const deleteButton = document.querySelector("#guide-delete");

const GUIDE_HISTORY_KEY = "sb-guides-history";

function readGuideHistory() {
  try {
    const parsed = JSON.parse(localStorage.getItem(GUIDE_HISTORY_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeGuideHistory(items) {
  localStorage.setItem(GUIDE_HISTORY_KEY, JSON.stringify(items.slice(0, 24)));
}

function replaceGuideRecord(updatedRecord) {
  const history = readGuideHistory();
  const next = history.map((item) => (item.id === updatedRecord.id ? updatedRecord : item));
  writeGuideHistory(next);
}

function deleteGuideRecord(id) {
  const history = readGuideHistory();
  writeGuideHistory(history.filter((item) => item.id !== id));
}

function escapeHtml(text) {
  return String(text || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function formatInlineMarkdown(text) {
  let output = escapeHtml(text);
  output = output.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  output = output.replace(/\*(.+?)\*/g, "<em>$1</em>");
  output = output.replace(/`(.+?)`/g, "<code>$1</code>");
  return output;
}

function markdownToHtml(markdownText) {
  const lines = String(markdownText || "").split("\n");
  const html = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];

    if (!line.trim()) {
      index += 1;
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      const level = heading[1].length;
      html.push(`<h${level}>${formatInlineMarkdown(heading[2])}</h${level}>`);
      index += 1;
      continue;
    }

    if (/^>\s?/.test(line)) {
      html.push(`<blockquote>${formatInlineMarkdown(line.replace(/^>\s?/, ""))}</blockquote>`);
      index += 1;
      continue;
    }

    if (/^_+$/.test(line.trim())) {
      const blanks = [];
      while (index < lines.length && /^_+$/.test(lines[index].trim())) {
        blanks.push('<div class="answer-line"></div>');
        index += 1;
      }
      html.push(`<div class="answer-stack">${blanks.join("")}</div>`);
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      const items = [];
      while (index < lines.length && /^\d+\.\s+/.test(lines[index])) {
        items.push(lines[index].replace(/^\d+\.\s+/, ""));
        index += 1;
      }
      html.push(`<ol>${items.map((item) => `<li>${formatInlineMarkdown(item)}</li>`).join("")}</ol>`);
      continue;
    }

    if (/^-\s+/.test(line)) {
      const items = [];
      while (index < lines.length && /^-\s+/.test(lines[index])) {
        items.push(lines[index].replace(/^-\s+/, ""));
        index += 1;
      }
      html.push(`<ul>${items.map((item) => `<li>${formatInlineMarkdown(item)}</li>`).join("")}</ul>`);
      continue;
    }

    const paragraph = [line];
    index += 1;
    while (index < lines.length && lines[index].trim() && !/^(#{1,6})\s+/.test(lines[index]) && !/^\d+\.\s+/.test(lines[index]) && !/^-\s+/.test(lines[index]) && !/^>\s?/.test(lines[index])) {
      paragraph.push(lines[index]);
      index += 1;
    }
    html.push(`<p>${formatInlineMarkdown(paragraph.join(" "))}</p>`);
  }

  return html.join("\n");
}

function renderWorksheetSection(section) {
  return `
    <section class="worksheet-section worksheet-${escapeHtml(section.type || "section")}">
      <h3>${escapeHtml(section.title)}</h3>
      <div class="worksheet-content">${markdownToHtml(section.content || "")}</div>
    </section>
  `;
}

function documentPresentation(meta) {
  if (meta?.audience === "teacher") {
    return { label: "Teacher Guide", className: "teacher-guide" };
  }
  if (meta?.contentFormat === "worksheet") {
    return { label: "Student Worksheet", className: "student-worksheet" };
  }
  return { label: "Study Workbook", className: "study-workbook" };
}

function renderTrace(record) {
  if (guideTraceStepsEl) {
    guideTraceStepsEl.innerHTML = (record.provenance?.steps || []).map((step) => `<li>${escapeHtml(step)}</li>`).join("");
  }
  if (guideTracePromptsEl) {
    guideTracePromptsEl.textContent = record.provenance?.prompts
      ? `Scholar prompt:\n${record.provenance.prompts.scholar}\n\nPastoral prompt:\n${record.provenance.prompts.pastoral}`
      : "No prompts yet.";
  }
  if (guideTracePreviewEl) {
    guideTracePreviewEl.textContent = record.provenance?.answerPreview
      ? `Scholar preview:\n${record.provenance.answerPreview.scholar}\n\nPastoral preview:\n${record.provenance.answerPreview.pastoral}`
      : "No answer preview yet.";
  }
  if (guideMetaViewEl) {
    guideMetaViewEl.textContent = JSON.stringify({
      telemetry: record.telemetry,
      warning: record.warning,
      sources: record.workbook.sources
    }, null, 2);
  }
}

function renderGuide(record) {
  const meta = record.workbook.meta;
  const presentation = documentPresentation(meta);
  if (guideTitleEl) guideTitleEl.textContent = record.title;
  if (guideSubtitleEl) guideSubtitleEl.textContent = `${meta.theme} · ${meta.level} · ${meta.duration} · v${record.version}`;
  if (pinButton) pinButton.textContent = record.pinned ? "Unpin guide" : "Pin guide";
  if (guideViewEl) {
    guideViewEl.innerHTML = `
      <header class="workbook-head ${presentation.className}">
        <p class="workbook-kicker">${presentation.label}</p>
        <h2>${escapeHtml(record.title)}</h2>
        <p class="workbook-subtitle">${escapeHtml(meta.theme)} · ${escapeHtml(meta.level)} · ${escapeHtml(meta.duration)}</p>
      </header>
      <div class="worksheet-sheet ${presentation.className} worksheet-format-${escapeHtml(meta.contentFormat || "workbook")}">
        ${(record.workbook.sections || []).map(renderWorksheetSection).join("")}
      </div>
    `;
  }
  renderTrace(record);
}

function currentRecord() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const history = readGuideHistory();
  return history.find((item) => item.id === id) || null;
}

function renderCompareOptions(record) {
  if (!compareSelectEl) return;
  const history = readGuideHistory();
  const related = history.filter((item) => item.baseKey === record.baseKey && item.id !== record.id);
  compareSelectEl.innerHTML = ["<option value=\"\">Select a version</option>"]
    .concat(related.map((item) => `<option value="${escapeHtml(item.id)}">v${item.version} · ${new Date(item.savedAt).toLocaleString()}</option>`))
    .join("");
}

function compareRecords(current, other) {
  if (!compareOutputEl) return;
  if (!other) {
    compareOutputEl.innerHTML = "<p>No comparison loaded.</p>";
    return;
  }

  const currentSections = current.workbook.sections.length;
  const otherSections = other.workbook.sections.length;
  const currentSources = current.workbook.sources.length;
  const otherSources = other.workbook.sources.length;
  const currentScore = current.quality?.overall || 0;
  const otherScore = other.quality?.overall || 0;

  compareOutputEl.innerHTML = `
    <p><strong>Current:</strong> v${current.version} · ${new Date(current.savedAt).toLocaleString()}</p>
    <p><strong>Compared with:</strong> v${other.version} · ${new Date(other.savedAt).toLocaleString()}</p>
    <ul class="feedback-list">
      <li>Sections: ${currentSections} vs ${otherSections}</li>
      <li>Sources: ${currentSources} vs ${otherSources}</li>
      <li>Quality score: ${currentScore} vs ${otherScore}</li>
    </ul>
  `;
}

function saveVersion(record) {
  const history = readGuideHistory();
  const version = history.filter((item) => item.baseKey === record.baseKey).length + 1;
  const saved = {
    ...record,
    id: `${record.id}_saved_${Date.now()}`,
    version,
    savedAt: new Date().toISOString(),
    pinned: false,
    renderedHtml: guideViewEl?.innerHTML || null
  };
  writeGuideHistory([saved, ...history]);
  return saved;
}

function togglePinned(record) {
  const history = readGuideHistory();
  const updated = history.map((item) => (item.id === record.id ? { ...item, pinned: !item.pinned } : item));
  writeGuideHistory(updated);
  return updated.find((item) => item.id === record.id) || record;
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

function buildStandaloneHtml(record) {
  return `<!doctype html><html lang="en"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>${escapeHtml(record.title)}</title><style>body{font-family:Charter,Georgia,serif;margin:0;color:#17212b;line-height:1.65}.page{max-width:860px;margin:0 auto;padding:2rem 2rem 3rem}.cover{border-bottom:2px solid #d2dfeb;margin-bottom:1.4rem;padding-bottom:1rem}.cover h1{margin:0 0 .35rem;font-size:2rem;color:#0d3251}.cover p{margin:0;color:#263b4d}.doc-kind{margin:0 0 .35rem;font:700 .78rem/1.2 Arial,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#2f8dc4}.worksheet-sheet{display:grid;gap:1rem}.worksheet-sheet.student-worksheet{grid-template-columns:repeat(2,minmax(0,1fr))}.worksheet-sheet.study-workbook,.worksheet-sheet.teacher-guide{grid-template-columns:1fr}.worksheet-section{border-bottom:1px solid #dbe5ee;padding-bottom:1rem}.worksheet-content ul,.worksheet-content ol{margin:.4rem 0 1rem 1.2rem}.worksheet-content p{margin:0 0 .75rem}.answer-stack{display:grid;gap:10px;margin:.5rem 0 1rem}.answer-line{width:100%;border-bottom:1.5px solid #9fb6c7;height:18px}@media (max-width:760px){.worksheet-sheet.student-worksheet{grid-template-columns:1fr}}</style></head><body><main class="page"><section class="cover"><p class="doc-kind">${escapeHtml(documentPresentation(record.workbook.meta).label)}</p><h1>${escapeHtml(record.title)}</h1><p>${escapeHtml(record.workbook.meta.theme)} · ${escapeHtml(record.workbook.meta.level)} · ${escapeHtml(record.workbook.meta.duration)}</p></section>${guideViewEl?.innerHTML || ""}</main></body></html>`;
}

function reflectionPromptForRecord(record) {
  const promptSection = record?.workbook?.sections?.find((section) => section.type === "reflection_prompt");
  if (promptSection?.content) return promptSection.content;
  return `I am reflecting on ${record?.workbook?.meta?.theme || "this study topic"}. Help me understand what is true, what requires repentance or healing, and what practical next step would honor God in this situation.`;
}

const record = currentRecord();
if (record) {
  renderGuide(record);
  renderCompareOptions(record);
  document.title = `${record.title} | Studio Berean Guide`;
}

compareRunEl?.addEventListener("click", () => {
  if (!record) return;
  const other = readGuideHistory().find((item) => item.id === compareSelectEl?.value) || null;
  compareRecords(record, other);
});

saveVersionButton?.addEventListener("click", () => {
  if (!record) return;
  const saved = saveVersion(record);
  window.location.href = `/guide?id=${encodeURIComponent(saved.id)}`;
});

pinButton?.addEventListener("click", () => {
  if (!record) return;
  const updated = togglePinned(record);
  window.location.href = `/guide?id=${encodeURIComponent(updated.id)}`;
});

deleteButton?.addEventListener("click", () => {
  if (!record) return;
  deleteGuideRecord(record.id);
  window.location.href = "/generator";
});

copyMdButton?.addEventListener("click", async () => {
  if (!record) return;
  await navigator.clipboard.writeText(record.markdown || "");
});

downloadMdButton?.addEventListener("click", () => {
  if (!record) return;
  downloadFile(record.markdown || "", "text/markdown;charset=utf-8", `${record.title}.md`);
});

downloadHtmlButton?.addEventListener("click", () => {
  if (!record) return;
  downloadFile(buildStandaloneHtml(record), "text/html;charset=utf-8", `${record.title}.html`);
});

printPdfButton?.addEventListener("click", () => {
  if (!record) return;
  const popup = window.open("", "_blank");
  if (!popup) return;
  popup.document.open();
  popup.document.write(buildStandaloneHtml(record));
  popup.document.close();
  popup.focus();
  setTimeout(() => popup.print(), 200);
});

copyReflectionButton?.addEventListener("click", async () => {
  if (!record) return;
  await navigator.clipboard.writeText(reflectionPromptForRecord(record));
});

reflectBereanButton?.addEventListener("click", async () => {
  if (!record) return;
  const prompt = reflectionPromptForRecord(record);
  await navigator.clipboard.writeText(prompt);
  window.open("https://berean.ai", "_blank", "noopener,noreferrer");
});
