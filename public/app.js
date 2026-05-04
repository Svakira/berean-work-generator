const form = document.querySelector("#generator-form");
const statusEl = document.querySelector("#status");
const premadeListEl = document.querySelector("#premade-list");
const templateStatusEl = document.querySelector("#template-status");
const presetLabelEl = document.querySelector("#preset-label");
const audienceEl = document.querySelector("#audience");
const teacherAdvancedEl = document.querySelector("#teacher-advanced");
const coachLessonEl = document.querySelector("#coach-lesson");
const coachOutcomeEl = document.querySelector("#coach-outcome");
const coachScripturesEl = document.querySelector("#coach-scriptures");
const coachQuestionsEl = document.querySelector("#coach-questions");
const coachSensitiveEl = document.querySelector("#coach-sensitive");
const coachBuildEl = document.querySelector("#coach-build");
const coachClearEl = document.querySelector("#coach-clear");
const generateButtonEl = document.querySelector("#generate");
const serviceDotEl = document.querySelector("#service-status-dot");
const serviceTextEl = document.querySelector("#service-status-text");
const historySummaryEl = document.querySelector("#history-summary");
const historyListEl = document.querySelector("#history-list");
const progressContainer = document.querySelector("#progress-tasks");
const sessionProgressEl = document.querySelector("#session-progress");
const progressLabelEl = document.querySelector("#progress-label");
const qualityOverallEl = document.querySelector("#quality-overall");
const qualityFeedbackEl = document.querySelector("#quality-feedback");
const bereanSummaryEl = document.querySelector("#berean-summary");
const traceStepsEl = document.querySelector("#trace-steps");
const tracePromptsEl = document.querySelector("#trace-prompts");
const tracePreviewEl = document.querySelector("#trace-preview");
const studyStreakEl = document.querySelector("#study-streak");
const sessionCountEl = document.querySelector("#session-count");
const perkMessageEl = document.querySelector("#perk-message");
const briefPreviewEl = document.querySelector("#brief-preview");

const GUIDE_HISTORY_KEY = "sb-guides-history";
const METRICS_KEYS = {
  streak: "sb-streak",
  sessions: "sb-sessions",
  lastDay: "sb-last-day"
};

let premadeItems = [];
let currentPresetId = "";
let progressState = [];

const metrics = {
  streak: Number(localStorage.getItem(METRICS_KEYS.streak) || 0),
  sessions: Number(localStorage.getItem(METRICS_KEYS.sessions) || 0),
  lastDay: localStorage.getItem(METRICS_KEYS.lastDay) || ""
};

function escapeHtml(text) {
  return String(text || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

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

function saveGuideVersion(payload) {
  const history = readGuideHistory();
  const baseKey = `${payload.workbook.meta.title}::${payload.workbook.meta.theme}::${payload.workbook.meta.contentFormat}`;
  const version = history.filter((item) => item.baseKey === baseKey).length + 1;
  const id = `${payload.workbook.id}_${Date.now()}`;
  const record = {
    id,
    baseKey,
    version,
    savedAt: new Date().toISOString(),
    title: payload.workbook.meta.title,
    theme: payload.workbook.meta.theme,
    subtitle: `${payload.workbook.meta.contentFormat} · ${payload.workbook.meta.level} · ${payload.workbook.meta.duration}`,
    workbook: payload.workbook,
    markdown: payload.markdown,
    telemetry: payload.telemetry,
    provenance: payload.provenance,
    quality: payload.quality,
    warning: payload.warning || null,
    pinned: false,
    renderedHtml: null
  };
  writeGuideHistory([record, ...history]);
  return record;
}

function duplicateGuideVersion(id) {
  const history = readGuideHistory();
  const source = history.find((item) => item.id === id);
  if (!source) return null;
  const version = history.filter((item) => item.baseKey === source.baseKey).length + 1;
  const clone = {
    ...source,
    id: `${source.id}_dup_${Date.now()}`,
    version,
    savedAt: new Date().toISOString(),
    pinned: false
  };
  writeGuideHistory([clone, ...history]);
  return clone;
}

function togglePinnedGuide(id) {
  const history = readGuideHistory();
  const updated = history.map((item) => (item.id === id ? { ...item, pinned: !item.pinned } : item));
  writeGuideHistory(updated.sort((a, b) => Number(b.pinned) - Number(a.pinned) || new Date(b.savedAt) - new Date(a.savedAt)));
}

function deleteGuideVersion(id) {
  const history = readGuideHistory();
  writeGuideHistory(history.filter((item) => item.id !== id));
}

function setServiceStatus(kind, text) {
  if (!serviceDotEl || !serviceTextEl) return;
  serviceDotEl.classList.remove("dot-ok", "dot-warn", "dot-down");
  serviceDotEl.classList.add(kind === "ok" ? "dot-ok" : kind === "down" ? "dot-down" : "dot-warn");
  serviceTextEl.textContent = text;
}

async function checkServiceHealth() {
  try {
    const response = await fetch("/health");
    if (!response.ok) throw new Error("unhealthy");
    setServiceStatus("ok", "Berean available");
  } catch {
    setServiceStatus("down", "Berean unavailable");
  }
}

function showTeacherAdvanced(isTeacher) {
  if (teacherAdvancedEl) {
    teacherAdvancedEl.hidden = !isTeacher;
  }
}

function buildCoachBrief() {
  const lesson = String(coachLessonEl?.value || "").trim();
  const outcome = String(coachOutcomeEl?.value || "").trim();
  const scriptures = String(coachScripturesEl?.value || "").trim();
  const questions = String(coachQuestionsEl?.value || "").trim();
  const sensitive = String(coachSensitiveEl?.value || "").trim();

  const parts = [
    lesson ? `Topic / lesson context: ${lesson}` : "",
    outcome ? `Desired spiritual outcome: ${outcome}` : "",
    scriptures ? `Anchor scriptures: ${scriptures}` : "",
    questions ? `Questions to include: ${questions}` : "",
    sensitive ? `Sensitive context: ${sensitive}` : ""
  ].filter(Boolean);

  return parts.join("\n");
}

function renderBriefPreview(content, label = "Study brief preview") {
  if (!briefPreviewEl) return;
  briefPreviewEl.innerHTML = `<strong>${escapeHtml(label)}</strong><p>${escapeHtml(content || "Use Study Coach to build a structured brief or write your own prompt directly.")}</p>`;
}

function applyCoachToForm() {
  if (!form) return;
  const brief = buildCoachBrief();
  if (!brief) {
    if (statusEl) statusEl.textContent = "Add at least the lesson topic in Study Coach first.";
    return;
  }

  if (form.lessonContext) form.lessonContext.value = String(coachLessonEl?.value || "").trim();
  if (form.desiredOutcome) form.desiredOutcome.value = String(coachOutcomeEl?.value || "").trim();
  if (form.anchorScriptures) form.anchorScriptures.value = String(coachScripturesEl?.value || "").trim();
  if (form.customQuestions) form.customQuestions.value = String(coachQuestionsEl?.value || "").trim();
  if (form.sensitivities) form.sensitivities.value = String(coachSensitiveEl?.value || "").trim();
  form.theme.value = brief;
  renderBriefPreview(brief, "Study brief preview");
  if (statusEl) statusEl.textContent = "Study Coach built your brief. Review it or generate now.";
}

function clearCoach() {
  [coachLessonEl, coachOutcomeEl, coachScripturesEl, coachQuestionsEl, coachSensitiveEl].forEach((element) => {
    if (element) element.value = "";
  });
  if (form?.lessonContext) form.lessonContext.value = "";
  if (form?.desiredOutcome) form.desiredOutcome.value = "";
  if (form?.anchorScriptures) form.anchorScriptures.value = "";
  if (form?.customQuestions) form.customQuestions.value = "";
  if (form?.sensitivities) form.sensitivities.value = "";
  renderBriefPreview("");
  if (statusEl) statusEl.textContent = "Study Coach cleared.";
}

function renderTemplateRow(items) {
  if (!premadeListEl) return;
  const visible = items.slice(0, 3);
  premadeListEl.innerHTML = visible
    .map((item) => `
      <button type="button" class="template-card${item.id === currentPresetId ? " active" : ""}" data-template-id="${escapeHtml(item.id)}">
        <span class="template-card__eyebrow">${escapeHtml(item.category)}</span>
        <strong>${escapeHtml(item.title)}</strong>
      </button>
    `)
    .concat('<a class="template-card--more" href="/templates" aria-label="Open template library">+</a>')
    .join("");
}

function renderTemplateStatus(item) {
  if (!templateStatusEl || !presetLabelEl) return;
  if (!item) {
    presetLabelEl.textContent = "Custom";
    templateStatusEl.textContent = "Choose a visible template or use the + shortcut to open the full library.";
    return;
  }
  presetLabelEl.textContent = item.title;
  templateStatusEl.textContent = item.preview || item.theme;
}

function applyPremade(item) {
  if (!item || !form) return;
  form.title.value = item.title || form.title.value;
  form.theme.value = item.token || `[template-${item.id}]`;
  if (form.contentFormat) form.contentFormat.value = item.contentFormat || form.contentFormat.value;
  if (form.audience) form.audience.value = item.audience || form.audience.value;
  if (form.level) form.level.value = item.level || form.level.value;
  if (form.duration) form.duration.value = item.duration || form.duration.value;
  if (form.presetId) form.presetId.value = item.id || "";
  currentPresetId = item.id;
  renderTemplateStatus(item);
  renderTemplateRow(premadeItems);
  renderBriefPreview(item.preview || item.theme, "Selected template");
  showTeacherAdvanced(form.audience.value === "teacher");
  if (statusEl) statusEl.textContent = `Template loaded: ${item.title}`;
}

async function loadPremadeWorkbooks() {
  try {
    const response = await fetch("/api/premade");
    if (!response.ok) throw new Error("premade unavailable");
    const payload = await response.json();
    premadeItems = Array.isArray(payload.items) ? payload.items : [];
    renderTemplateRow(premadeItems);
    return premadeItems;
  } catch {
    if (templateStatusEl) {
      templateStatusEl.textContent = "Templates unavailable right now.";
    }
    return [];
  }
}

function initializePresetFromQuery(items) {
  const params = new URLSearchParams(window.location.search);
  const presetId = params.get("preset");
  if (!presetId) return;
  const preset = items.find((item) => item.id === presetId);
  if (preset) applyPremade(preset);
}

function renderHistorySummary() {
  if (!historySummaryEl) return;
  const latest = readGuideHistory()[0];
  historySummaryEl.innerHTML = latest
    ? `<strong>${escapeHtml(latest.title)}</strong><p>${escapeHtml(latest.theme)} · v${latest.version}</p><a class="plain-link-strong" href="/guide?id=${encodeURIComponent(latest.id)}">Open latest guide</a>`
    : `<strong>No recent guide yet.</strong><p>Your latest generated guide will appear here.</p>`;
}

function renderHistoryList() {
  if (!historyListEl) return;
  const history = readGuideHistory();
  renderHistorySummary();

  if (!history.length) {
    historyListEl.innerHTML = "<div class=\"history-item\"><strong>No guides yet</strong><p>Generate a worksheet or workbook and it will appear here.</p></div>";
    return;
  }

  historyListEl.innerHTML = history.slice(0, 5)
    .map((item) => `
      <article class="history-item ${item.pinned ? "pinned" : ""}">
        <div>
          <strong>${escapeHtml(item.title)}</strong>
          <p>${escapeHtml(item.theme)}</p>
          <small>${item.pinned ? "Pinned · " : ""}v${item.version} · ${escapeHtml(item.subtitle)}</small>
        </div>
        <div class="history-actions">
          <a href="/guide?id=${encodeURIComponent(item.id)}">Open</a>
          <button type="button" class="history-pin" data-history-id="${escapeHtml(item.id)}">${item.pinned ? "Unpin" : "Pin"}</button>
          <button type="button" class="history-duplicate" data-history-id="${escapeHtml(item.id)}">Duplicate</button>
          <button type="button" class="history-delete" data-history-id="${escapeHtml(item.id)}">Delete</button>
        </div>
      </article>
    `)
    .join("");
}

function renderProgressChecklist(workbook) {
  if (!progressContainer) return;
  const studentWorksheet = [
    "Read the key concept",
    "Answer two worksheet questions",
    "Write one practical action",
    "Pray the closing prayer"
  ];
  const studentWorkbook = [
    "Read the study sections",
    "Answer two reflection prompts",
    "Complete one challenge",
    "Write one weekly commitment"
  ];
  const teacherGuide = [
    "Review the session flow",
    "Customize the main questions",
    "Prepare one application exercise",
    "Write one improvement note"
  ];

  const list = workbook.meta.audience === "teacher"
    ? teacherGuide
    : workbook.meta.contentFormat === "worksheet"
      ? studentWorksheet
      : studentWorkbook;

  progressState = list.map((label) => ({ label, done: false }));
  progressContainer.innerHTML = progressState.map((item, index) => `
    <label><input type="checkbox" data-progress-idx="${index}" /> <span>${escapeHtml(item.label)}</span></label>
  `).join("");
  updateProgressBar();
}

function updateProgressBar() {
  if (!sessionProgressEl || !progressLabelEl) return;
  if (!progressState.length) {
    sessionProgressEl.value = 0;
    progressLabelEl.textContent = "0%";
    return;
  }

  const complete = progressState.filter((item) => item.done).length;
  const percent = Math.round((complete / progressState.length) * 100);
  sessionProgressEl.value = percent;
  progressLabelEl.textContent = `${percent}%`;
  if (percent === 100 && perkMessageEl) {
    perkMessageEl.textContent = "Great work. You completed this session checklist.";
  }
}

function renderQuality(quality) {
  if (qualityOverallEl) {
    qualityOverallEl.textContent = `${Number(quality?.overall || 0)}/100`;
  }

  if (qualityFeedbackEl) {
    const feedback = Array.isArray(quality?.feedback) ? quality.feedback : ["No quality feedback yet."];
    qualityFeedbackEl.innerHTML = feedback.slice(0, 4).map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  }
}

function updateBereanTransparency(data) {
  if (!bereanSummaryEl) return;
  const sources = Array.isArray(data?.workbook?.sources) ? data.workbook.sources : [];
  const collections = [...new Set(sources.map((source) => source.collection).filter(Boolean))];
  const modeHint = data?.workbook?.meta?.audience === "teacher"
    ? "Teacher mode used expanded prompts for planning depth."
    : "Student mode used shorter, practical prompts for personal growth.";
  bereanSummaryEl.textContent = `${modeHint} Retrieved ${data?.telemetry?.sourcesCount || sources.length} source hits across ${collections.length || 0} collections (${collections.join(", ") || "n/a"}).`;
}

function renderTrace(provenance) {
  if (traceStepsEl) {
    const steps = Array.isArray(provenance?.steps) ? provenance.steps : [];
    traceStepsEl.innerHTML = steps.length
      ? steps.map((step) => `<li>${escapeHtml(step)}</li>`).join("")
      : "<li>No generation steps available yet.</li>";
  }

  if (tracePromptsEl) {
    tracePromptsEl.textContent = provenance?.prompts
      ? `Scholar prompt:\n${provenance.prompts.scholar}\n\nPastoral prompt:\n${provenance.prompts.pastoral}`
      : "No prompts yet.";
  }

  if (tracePreviewEl) {
    tracePreviewEl.textContent = provenance?.answerPreview
      ? `Scholar preview:\n${provenance.answerPreview.scholar}\n\nPastoral preview:\n${provenance.answerPreview.pastoral}`
      : "No answer preview yet.";
  }
}

function renderMetrics() {
  if (studyStreakEl) studyStreakEl.textContent = `${metrics.streak} day${metrics.streak === 1 ? "" : "s"}`;
  if (sessionCountEl) sessionCountEl.textContent = String(metrics.sessions);
}

function trackGeneration() {
  const today = new Date().toISOString().slice(0, 10);
  if (metrics.lastDay !== today) {
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    metrics.streak = metrics.lastDay === yesterday ? metrics.streak + 1 : 1;
    metrics.lastDay = today;
  }
  metrics.sessions += 1;
  localStorage.setItem(METRICS_KEYS.streak, String(metrics.streak));
  localStorage.setItem(METRICS_KEYS.sessions, String(metrics.sessions));
  localStorage.setItem(METRICS_KEYS.lastDay, metrics.lastDay);
  renderMetrics();
}

function setGeneratingState(isGenerating) {
  if (!generateButtonEl) return;
  generateButtonEl.disabled = isGenerating;
  generateButtonEl.textContent = isGenerating ? "Generating..." : "Generate workbook";
}

async function generateWorkbook(payload) {
  const response = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  if (!response.ok) {
    const hint = data?.guidance ? ` ${data.guidance}` : "";
    throw new Error((data?.error || "Generation failed.") + hint);
  }
  return data;
}

function buildPayload() {
  return {
    title: form.title.value,
    theme: form.theme.value,
    contentFormat: form.contentFormat?.value || "worksheet",
    audience: form.audience.value,
    level: form.level.value,
    duration: form.duration.value,
    lessonContext: form.lessonContext?.value || "",
    desiredOutcome: form.desiredOutcome?.value || "",
    anchorScriptures: form.anchorScriptures?.value || "",
    customQuestions: form.customQuestions?.value || "",
    sensitivities: form.sensitivities?.value || "",
    workbookType: form.workbookType?.value || "session_worksheet",
    timeframe: form.timeframe?.value || "single_session",
    priorStudies: form.priorStudies?.value || "",
    sourceBooks: form.sourceBooks?.value || "",
    reinforceTopics: form.reinforceTopics?.value || "",
    annotations: form.annotations?.value || "",
    improvementFocus: form.improvementFocus?.value || "",
    presetId: form.presetId?.value || ""
  };
}

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  setGeneratingState(true);
  if (statusEl) statusEl.textContent = "Generating workbook with BEREAN...";

  try {
    const payload = buildPayload();
    const data = await generateWorkbook(payload);
    const savedGuide = saveGuideVersion(data);
    renderProgressChecklist(data.workbook);
    renderQuality(data.quality);
    updateBereanTransparency(data);
    renderTrace(data.provenance);
    renderBriefPreview(`${data.workbook.meta.title}\n${data.workbook.meta.theme}`, "Latest generated guide");
    renderHistoryList();
    trackGeneration();
    if (perkMessageEl) perkMessageEl.textContent = "Complete your checklist to unlock a celebration.";
    const warnText = data.warning ? ` Warning: ${data.warning}` : "";
    if (statusEl) statusEl.textContent = `Done. Cache: ${data.cache}. Sources: ${data.telemetry.sourcesCount}.${warnText}`;
    const guideUrl = `/guide?id=${encodeURIComponent(savedGuide.id)}`;
    const popup = window.open(guideUrl, "_blank");
    if (!popup) window.location.href = guideUrl;
  } catch (error) {
    if (statusEl) statusEl.textContent = `Error: ${error.message}`;
  } finally {
    setGeneratingState(false);
  }
});

premadeListEl?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-template-id]");
  if (!(button instanceof HTMLElement)) return;
  const selected = premadeItems.find((item) => item.id === button.dataset.templateId);
  if (selected) applyPremade(selected);
});

historyListEl?.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof Element)) return;
  const deleteButton = target.closest(".history-delete");
  if (deleteButton instanceof HTMLButtonElement) {
    deleteGuideVersion(deleteButton.dataset.historyId || "");
    renderHistoryList();
    if (statusEl) statusEl.textContent = "Guide deleted.";
    return;
  }

  const pinButton = target.closest(".history-pin");
  if (pinButton instanceof HTMLButtonElement) {
    togglePinnedGuide(pinButton.dataset.historyId || "");
    renderHistoryList();
    if (statusEl) statusEl.textContent = "Guide pin updated.";
    return;
  }

  const duplicateButton = target.closest(".history-duplicate");
  if (!(duplicateButton instanceof HTMLButtonElement)) return;
  const copy = duplicateGuideVersion(duplicateButton.dataset.historyId || "");
  if (!copy) {
    if (statusEl) statusEl.textContent = "Could not duplicate that guide.";
    return;
  }
  renderHistoryList();
  if (statusEl) statusEl.textContent = `Duplicated ${copy.title} as version ${copy.version}.`;
});

coachBuildEl?.addEventListener("click", () => applyCoachToForm());
coachClearEl?.addEventListener("click", () => clearCoach());

audienceEl?.addEventListener("change", () => {
  showTeacherAdvanced(audienceEl.value === "teacher");
});

progressContainer?.addEventListener("change", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLInputElement)) return;
  const index = Number(target.dataset.progressIdx);
  if (Number.isNaN(index) || !progressState[index]) return;
  progressState[index].done = target.checked;
  updateProgressBar();
});

showTeacherAdvanced(audienceEl?.value === "teacher");
renderBriefPreview("");
renderMetrics();
renderHistoryList();
checkServiceHealth();
setInterval(checkServiceHealth, 25000);
loadPremadeWorkbooks().then((items) => initializePresetFromQuery(items));
