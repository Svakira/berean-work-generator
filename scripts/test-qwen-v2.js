#!/usr/bin/env node
/**
 * test-qwen-v2.js — Focused fix tests
 * Tests the /no_think flag + CONTENT_START marker + better stripping
 * Run: node --env-file=.env scripts/test-qwen-v2.js
 */

const API_URL = "https://api.totalgpt.ai/v1/completions";
const MODEL = "Qwen-Qwen3-30B-A3B";
const API_KEY = process.env.TOTALGPT_API_KEY;

if (!API_KEY) { console.error("ERROR: TOTALGPT_API_KEY not set"); process.exit(1); }

// V2 stripper — much more aggressive
function stripThinking(text) {
  // Remove <think>...</think> blocks
  let cleaned = text.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  // Remove JSON wrapper artifacts (T07 produced JSON output)
  cleaned = cleaned.replace(/^\{[\s\S]*?\}(\n|$)/m, "").trim();
  // Find CONTENT_START marker if present and take everything after it
  const markerIdx = cleaned.indexOf("CONTENT_START");
  if (markerIdx !== -1) {
    cleaned = cleaned.slice(markerIdx + "CONTENT_START".length).trim();
  }
  // Strip instruction-echo lines at start (lines that are instructions, not content)
  const lines = cleaned.split("\n");
  let startIdx = 0;
  for (let i = 0; i < Math.min(lines.length, 30); i++) {
    const line = lines[i].trim();
    // Skip empty lines
    if (!line) { startIdx = i + 1; continue; }
    // Skip lines that look like thinking/reasoning
    if (/^(Okay|Sure|Alright|Let me|I need|I will|I'll|Now,|First,|The user|They want|Let's go|Let's start|Looking at|I should|I have to|I can|I'll need|I must|I want to|Check for|Write in|Do not|Make sure|Make it|Keep|Use |Avoid|Include|The following|This is|Below is|Here is|Here's)/i.test(line)) {
      startIdx = i + 1;
      continue;
    }
    // Skip numbered instruction-like lines
    if (/^\d+\.\s+(First|Next|Then|After|Finally|Start|Begin|End|Write|Include|Add|Create|Make|Use|Avoid)/i.test(line)) {
      startIdx = i + 1;
      continue;
    }
    // If line looks like real content, stop skipping
    break;
  }
  cleaned = lines.slice(startIdx).join("\n").trim();
  // Remove leading/trailing blank lines
  cleaned = cleaned.replace(/^\n+/, "").replace(/\n+$/, "");
  return cleaned;
}

// Quality scorer
function scoreOutput(text, theme) {
  let score = 0;
  const issues = [];
  const wins = [];

  const themeWords = theme.toLowerCase().split(/\s+/).slice(0, 4).join(" ");
  const firstLine = text.split("\n")[0].toLowerCase();
  if (firstLine.includes(themeWords)) {
    issues.push("First line echoes theme");
  } else {
    score += 10; wins.push("Original title/opening");
  }

  const youCount = (text.match(/\byou\b|\byour\b/gi) || []).length;
  if (youCount > 5) { score += 15; wins.push(`Personal voice (${youCount})`); }
  else { issues.push(`Weak personal voice (${youCount})`); }

  const bibleRefs = text.match(/[1-3]?\s?[A-Z][a-z]+\.?\s+\d+:\d+/g) || [];
  const uniqueRefs = [...new Set(bibleRefs)];
  if (uniqueRefs.length >= 3) { score += 20; wins.push(`${uniqueRefs.length} Bible refs`); }
  else { issues.push(`Only ${uniqueRefs.length} Bible refs`); }

  if (/past week|this week|looking back|reflect on|recently|lately/i.test(text)) {
    score += 10; wins.push("Retrospective check-in");
  } else { issues.push("No retrospective"); }

  const questions = (text.match(/\?/g) || []).length;
  if (questions >= 4) { score += 15; wins.push(`${questions} questions`); }
  else { issues.push(`Only ${questions} questions`); }

  if (/this week|take action|practice|commit|next step|apply/i.test(text)) {
    score += 15; wins.push("Application/next step");
  } else { issues.push("No application"); }

  const wordCount = text.split(/\s+/).length;
  if (wordCount > 500) { score += 15; wins.push(`${wordCount} words`); }
  else { issues.push(`Too short (${wordCount})`); }

  if (/<think>|Okay, the user|Let me review|the user wants|They want|Let me start|I need to|I'll need to|I should|I have to|Let's go\.|Let's start/i.test(text)) {
    score -= 30; issues.push("THINKING LEAKED");
  } else {
    score += 0; wins.push("Clean (no thinking)");
  }

  return { score, issues, wins, wordCount, bibleRefs: uniqueRefs };
}

async function callQwen(prompt, maxTokens = 3500) {
  const start = Date.now();
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Authorization": `Bearer ${API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: MODEL, prompt, max_tokens: maxTokens, temperature: 0.7 })
  });
  if (!res.ok) { const err = await res.text(); throw new Error(`API ${res.status}: ${err}`); }
  const data = await res.json();
  const raw = data?.choices?.[0]?.text || "";
  return { raw, cleaned: stripThinking(raw), elapsed: Date.now() - start, tokens: data?.usage?.total_tokens };
}

// ============================================================
// Best prompt from V1 (T07 structure) + 3 variants with fixes
// ============================================================

// This is the WINNING PROMPT TEMPLATE — T07 structure adapted for production
const MASTER_PROMPT = ({ theme, audience = "personal", level = "beginner", duration = "40 min", format = "workbook" }) => {
  const audienceNote = audience === "teacher"
    ? `a group leader preparing a ${level}-level group session`
    : `a ${level} individual studying personally`;

  if (format === "worksheet") {
    return `/no_think

You are a warm, biblically grounded pastoral educator. Write a personal Bible study worksheet.

Topic: ${theme}
Audience: ${audienceNote}
Duration: ${duration}

Write in warm, second-person voice ("you", "your"). Plain text only. No markdown. No asterisks. No brackets.

Write the content now. Start directly with the first section. No preamble. No explanation.

CONTENT_START

Checking In This Week
(2 short paragraphs inviting the reader to pause and reflect on where this topic showed up in their life this past week)

Key Scripture
(1-2 passages with reference and one sentence of context)

The Main Idea
(2-3 clear sentences summarizing the biblical truth on this topic)

Questions for Reflection
1.
2.
3.
4.
(4 questions: 2 about what the text says, 2 about how it applies to this week)

This Week's Practice
(One simple, concrete action the reader can take before the next study)`;
  }

  return `/no_think

You are a warm, biblically grounded pastoral educator. Write a personal Bible study workbook.

Topic: ${theme}
Audience: ${audienceNote}
Duration: ${duration}

Write in warm, second-person voice ("you", "your"). Plain text only. No markdown. No asterisks. No brackets. Write as if sitting across the table from the reader.

Write the content now. Start directly with the first section. No preamble. No explanation.

CONTENT_START

Checking In This Week
(2 paragraphs gently inviting the reader to reflect on the past week. Ask where this topic has shown up in their daily life. Acknowledge it may be difficult. Be pastoral and warm.)

Scripture for Today
(Introduce 2-3 key Bible passages with their reference — book, chapter, verse. One sentence explaining why each one was chosen.)

Reading: What Scripture Reveals
(5 substantial paragraphs opening up the topic biblically and theologically. Weave in at least 5 different Scripture references naturally. Write with warmth, curiosity, and depth — not as a lecture, but as a guided exploration. Help the reader see what they might have missed.)

What Do You Notice? (Observation)
(2 questions about what the text actually says. Start with "What..." or "Where...")

What Does This Mean? (Interpretation)
(2 questions about the meaning behind the text. Start with "Why..." or "How...")

How Does This Touch Your Life? (Application)
(2 questions connecting the text to this specific week. Start with "Where in your life..." or "What would it look like...")

Before You Go
(3-4 sentences of warm pastoral encouragement. Then: one simple spiritual practice for the week.)`;
};

const TESTS = [
  {
    id: "F01",
    label: "Master prompt — no_think + CONTENT_START marker",
    theme: "dealing with loneliness",
    format: "workbook",
    buildPrompt: ({ theme }) => MASTER_PROMPT({ theme, format: "workbook" })
  },
  {
    id: "F02",
    label: "Master prompt — sensitive topic (divorce/guilt)",
    theme: "guilt and divided loyalty during a parent's divorce",
    format: "workbook",
    buildPrompt: ({ theme }) => MASTER_PROMPT({ theme, format: "workbook" })
  },
  {
    id: "F03",
    label: "Master prompt — worksheet format",
    theme: "trusting God in uncertain times",
    format: "worksheet",
    buildPrompt: ({ theme }) => MASTER_PROMPT({ theme, format: "worksheet" })
  },
  {
    id: "F04",
    label: "Master prompt — abstract topic",
    theme: "prayer and listening to God",
    format: "workbook",
    buildPrompt: ({ theme }) => MASTER_PROMPT({ theme, format: "workbook" })
  },
  {
    id: "F05",
    label: "Master prompt — identity topic",
    theme: "finding your worth in Christ, not in performance",
    format: "workbook",
    buildPrompt: ({ theme }) => MASTER_PROMPT({ theme, format: "workbook" })
  }
];

async function main() {
  console.log(`\n${"=".repeat(70)}`);
  console.log(`QWEN3 V2 FIX TESTS — ${new Date().toISOString()}`);
  console.log(`${"=".repeat(70)}\n`);

  const results = [];

  for (const test of TESTS) {
    console.log(`\n${"─".repeat(70)}`);
    console.log(`[${test.id}] ${test.label}`);
    console.log(`Theme: "${test.theme}"`);
    console.log(`${"─".repeat(70)}`);

    try {
      const prompt = test.buildPrompt({ theme: test.theme });
      const { raw, cleaned, elapsed, tokens } = await callQwen(prompt);
      const result = scoreOutput(cleaned, test.theme);

      console.log(`\nElapsed: ${elapsed}ms | Tokens: ${tokens} | Words: ${result.wordCount}`);
      console.log(`SCORE: ${result.score}/100`);
      console.log(`WINS:   ${result.wins.join(", ")}`);
      if (result.issues.length) console.log(`ISSUES: ${result.issues.join(", ")}`);
      console.log(`Refs: ${result.bibleRefs.slice(0, 6).join(", ")}`);
      console.log(`\n--- CLEANED PREVIEW (first 500 chars) ---`);
      console.log(cleaned.slice(0, 500));
      console.log(`...`);

      results.push({ ...test, score: result.score, issues: result.issues, wins: result.wins, wordCount: result.wordCount, elapsed, output: cleaned });
    } catch (err) {
      console.error(`FAILED: ${err.message}`);
      results.push({ ...test, score: -1, issues: [err.message], wins: [], wordCount: 0, elapsed: 0, output: "" });
    }

    await new Promise(r => setTimeout(r, 3000));
  }

  console.log(`\n${"=".repeat(70)}`);
  console.log("FINAL RANKING");
  console.log(`${"=".repeat(70)}`);
  const ranked = [...results].sort((a, b) => b.score - a.score);
  for (const r of ranked) {
    const bar = "█".repeat(Math.max(0, Math.floor(r.score / 5)));
    console.log(`[${r.id}] ${String(r.score).padStart(3)}/100 ${bar}  ${r.label}`);
  }

  // Print F02 full output (the divorce/guilt test — closest to original problem)
  const f02 = results.find(r => r.id === "F02");
  if (f02?.output) {
    console.log(`\n${"=".repeat(70)}`);
    console.log(`FULL OUTPUT: [F02] — guilt/divorce (original problem topic)`);
    console.log(`${"=".repeat(70)}`);
    console.log(f02.output);
  }
}

main().catch(console.error);
