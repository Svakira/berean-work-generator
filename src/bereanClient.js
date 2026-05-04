const API_BASE_URL = "https://berean.ai/api/v1";

function sanitizeQuestion(input) {
  return String(input || "")
    .replace(/\s+/g, " ")
    .trim();
}

export async function askBereanScholar(question) {
  const clean = sanitizeQuestion(question);
  if (!clean) {
    throw new Error("Question is required.");
  }

  const response = await fetch(`${API_BASE_URL}/scholar`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ question: clean })
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMessage = data?.error || data?.message || "BEREAN scholar request failed.";
    throw new Error(errorMessage);
  }

  return data;
}

export async function askBereanPastoral(question) {
  const clean = sanitizeQuestion(question);
  if (!clean) {
    throw new Error("Question is required.");
  }

  const response = await fetch(`${API_BASE_URL}/question`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ question: clean })
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMessage = data?.error || data?.message || "BEREAN pastoral request failed.";
    throw new Error(errorMessage);
  }

  return data;
}
