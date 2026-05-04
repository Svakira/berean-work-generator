const THEME_KEY = "sb-theme";

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem(THEME_KEY, theme);
  document.querySelectorAll(".theme-icon-button").forEach((button) => {
    if (!(button instanceof HTMLButtonElement)) return;
    const nextTheme = theme === "dark" ? "light" : "dark";
    const label = nextTheme === "dark" ? "Switch to dark theme" : "Switch to light theme";
    button.setAttribute("aria-label", label);
    button.setAttribute("title", label);
    button.dataset.nextTheme = nextTheme;
  });
}

function initializeTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === "dark" || saved === "light") {
    applyTheme(saved);
    return;
  }
  const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  applyTheme(prefersDark ? "dark" : "light");
}

document.querySelectorAll(".theme-icon-button").forEach((button) => {
  button.addEventListener("click", () => {
    const nextTheme = button.dataset.nextTheme || "dark";
    applyTheme(nextTheme);
  });
});

initializeTheme();
