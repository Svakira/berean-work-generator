const continueTitleEl = document.querySelector("#continue-title");
const continueCopyEl = document.querySelector("#continue-copy");
const continueLinkEl = document.querySelector("#continue-link");

const GUIDE_HISTORY_KEY = "sb-guides-history";

function readGuideHistory() {
  try {
    const parsed = JSON.parse(localStorage.getItem(GUIDE_HISTORY_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

const latest = readGuideHistory()[0];

if (latest) {
  if (continueTitleEl) continueTitleEl.textContent = latest.title;
  if (continueCopyEl) {
    continueCopyEl.textContent = `${latest.theme} · ${latest.subtitle} · saved ${new Date(latest.savedAt).toLocaleString()}`;
  }
  if (continueLinkEl) {
    continueLinkEl.textContent = "Open Latest Guide";
    continueLinkEl.href = `/guide?id=${encodeURIComponent(latest.id)}`;
  }
}
