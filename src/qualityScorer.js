// src/qualityScorer.js
// Pure scoring functions — no I/O, no side effects.

/**
 * Count Bible references in text (e.g. "John 3:16", "1 Cor 13:4-7").
 */
function countScriptureRefs(text) {
  const pattern = /\b([1-3]?\s?[A-Z][a-z]+\.?\s\d{1,3}:\d{1,3}(?:-\d{1,3})?)\b/g;
  return (text.match(pattern) || []).length;
}

/**
 * Check that content uses second-person voice consistently.
 * Returns ratio of second-person pronouns (you/your/yourself) to all pronouns.
 */
function secondPersonRatio(text) {
  const secondPerson = (text.match(/\b(you|your|yourself)\b/gi) || []).length;
  const thirdPerson = (text.match(/\b(he|she|they|his|her|their|them)\b/gi) || []).length;
  const total = secondPerson + thirdPerson;
  if (total === 0) return 0;
  return secondPerson / total;
}

/**
 * Count paragraphs (non-empty blocks separated by blank lines).
 */
function countParagraphs(text) {
  return text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean).length;
}

/**
 * Detect artifact patterns that indicate thinking leakage or boilerplate.
 */
function hasArtifacts(text) {
  const patterns = [
    /^Okay,\s/im,
    /^Let me\s/im,
    /^I will\s/im,
    /^I need to\s/im,
    /CONTENT_START/,
    /^Note:\s*As a research/im,
    /\bworkbook sections\b/im,
    /\bweek\s+\d+:/im,
  ];
  return patterns.some((p) => p.test(text));
}

/**
 * Count approximate words in text.
 */
function wordCount(text) {
  return (text.trim().match(/\S+/g) || []).length;
}

/**
 * Score a generated reading passage. Returns {score: 0-100, issues: string[]}.
 *
 * Rubric:
 *   25 pts — word count 350–650 (partial: 10 pts if 200–349 or 651–800)
 *   25 pts — ≥4 scripture references (partial: 12 pts if 2–3)
 *   25 pts — second-person ratio ≥65% (partial: 12 pts if 40–64%)
 *   15 pts — 4–6 paragraphs (partial: 7 pts if 3 or 7)
 *   10 pts — no thinking artifacts detected
 */
export function scoreContent(text) {
  const issues = [];
  let score = 0;

  // Word count
  const wc = wordCount(text);
  if (wc >= 350 && wc <= 650) {
    score += 25;
  } else {
    issues.push(`Word count ${wc} (expected 350–650)`);
    if ((wc >= 200 && wc < 350) || (wc > 650 && wc <= 800)) score += 10;
  }

  // Scripture references
  const refs = countScriptureRefs(text);
  if (refs >= 4) {
    score += 25;
  } else if (refs >= 2) {
    score += 12;
    issues.push(`Only ${refs} scripture references (expected ≥4)`);
  } else {
    issues.push(`Only ${refs} scripture references (expected ≥4)`);
  }

  // Second-person voice
  const ratio = secondPersonRatio(text);
  if (ratio >= 0.65) {
    score += 25;
  } else if (ratio >= 0.4) {
    score += 12;
    issues.push(`Second-person ratio ${(ratio * 100).toFixed(0)}% (expected ≥65%)`);
  } else {
    issues.push(`Second-person ratio ${(ratio * 100).toFixed(0)}% (expected ≥65%)`);
  }

  // Paragraph count
  const paras = countParagraphs(text);
  if (paras >= 4 && paras <= 6) {
    score += 15;
  } else {
    issues.push(`${paras} paragraphs (expected 4–6)`);
    if (paras === 3 || paras === 7) score += 7;
  }

  // No artifacts
  if (!hasArtifacts(text)) {
    score += 10;
  } else {
    issues.push("Thinking artifacts or boilerplate detected in output");
  }

  return { score, issues };
}
