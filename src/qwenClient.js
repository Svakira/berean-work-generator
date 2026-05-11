/**
 * qwenClient.js
 * Client for TotalGPT API — Qwen3-30B-A3B model (thinking model)
 *
 * ARCHITECTURE:
 * - Qwen3-30B-A3B is a reasoning/thinking model. It outputs its thought process
 *   before the actual content. We suppress this with /no_think and strip residual.
 * - Winning prompt structure (tested across 10 variations, 4/5 scored 100/100):
 *   T07 / F02 style: specific section labels, OIA method, warm second-person,
 *   CONTENT_START marker to anchor stripping.
 */

const TOTALGPT_API_URL = "https://api.totalgpt.ai/v1/completions";
const TOTALGPT_MODEL = "Qwen-Qwen3-235B-A22B-Thinking-2507";

// Known section openers — used to find where real content starts
const SECTION_OPENERS = [
  /^Checking In/im,
  /^This Week.s Check.In/im,
  /^Opening Reflection/im,
  /^Where Have You Been/im,
  /^Scripture for Today/im,
  /^Key Scripture/im,
  /^Reading:/im,
];

/**
 * Strip all thinking artifacts from Qwen3 output.
 * The model outputs thinking in 3 forms:
 *   1. <think>...</think> XML tags
 *   2. Plain-text reasoning ("Okay, let's...", "I need to...")
 *   3. Instruction echoing ("Please write in English...", "Do not use...")
 * We also handle JSON wrapping ({"content": "..."}) that appears occasionally.
 */
function stripThinking(text) {
  let cleaned = String(text || "");

  // 1. Remove <think>...</think> blocks
  cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

  // 2. Unwrap JSON {"content": "..."} if model wrapped output
  const jsonMatch = cleaned.match(/^\{["']?content["']?\s*:\s*["']([\s\S]+?)["']\s*\}\s*$/m);
  if (jsonMatch) {
    cleaned = jsonMatch[1].replace(/\\n/g, "\n").replace(/\\"/g, '"').trim();
  }

  // 3. Take everything AFTER CONTENT_START marker (if model respected it)
  const csIdx = cleaned.indexOf("CONTENT_START");
  if (csIdx !== -1) {
    cleaned = cleaned.slice(csIdx + "CONTENT_START".length).trim();
  }

  // 4. Find the first known section header and start there
  //    (skips any preamble the model emitted before actual content)
  let earliestIdx = -1;
  for (const pattern of SECTION_OPENERS) {
    const match = cleaned.match(pattern);
    if (match && match.index !== undefined) {
      if (earliestIdx === -1 || match.index < earliestIdx) {
        earliestIdx = match.index;
      }
    }
  }
  if (earliestIdx > 0) {
    cleaned = cleaned.slice(earliestIdx).trim();
  }

  // 5. Final cleanup — remove leading blank lines
  return cleaned.replace(/^\n+/, "").replace(/\n{3,}/g, "\n\n").trim();
}

/**
 * Build the master prompt for content generation.
 *
 * For workbooks: Qwen generates ONLY the reading exposition (5 paragraphs).
 * WorkbookEngine handles all structural sections (check-in, questions, application, etc.)
 *
 * For worksheets: Qwen generates a brief reading + main idea paragraph.
 *
 * Proven by 10-prompt A/B test — warm second-person, no preamble, CONTENT_START marker.
 */
function buildPrompt({ theme, format, audience, level, duration, lessonContext, desiredOutcome, anchorScriptures, customQuestions, sensitivities }) {
  const audienceNote = audience === "teacher"
    ? `a group leader preparing a ${level}-level group session`
    : `a ${level} individual studying personally`;

  const coachAdditions = [
    lessonContext ? `Context: ${lessonContext}.` : "",
    desiredOutcome ? `Spiritual outcome: ${desiredOutcome}.` : "",
    anchorScriptures ? `Key Scriptures to use: ${anchorScriptures}.` : "",
    customQuestions ? `Questions to address: ${customQuestions}.` : "",
    sensitivities ? `Handle with care — pastoral note: ${sensitivities}.` : ""
  ].filter(Boolean).join(" ");

  if (format === "worksheet") {
    return `/no_think

You are a warm, biblically grounded pastoral educator.

Write a brief biblical reading passage (2-3 paragraphs) on the topic of: ${theme}

This will be used in a personal Bible study worksheet for ${audienceNote}, lasting ${duration}.
${coachAdditions ? `Additional guidance: ${coachAdditions}` : ""}

Requirements:
- Write in warm, second-person voice ("you", "your")
- Plain text only. No markdown. No headings. No bullet points.
- Weave in 2-3 specific Bible references naturally (book chapter:verse)
- Warm, pastoral tone — like a mentor sitting with the reader
- Focus on the core biblical truth of the topic and what it means for daily life
- 150-250 words total

Write the passage directly. No preamble.

CONTENT_START`;
  }

  return `/no_think

You are a warm, biblically grounded pastoral educator writing for ${audienceNote}.

TOPIC: ${theme}
SESSION LENGTH: ${duration}
${coachAdditions ? `PASTORAL GUIDANCE: ${coachAdditions}` : ""}

Write a 5-paragraph biblical reading passage on the topic above. Follow this exact paragraph structure:

Paragraph 1 — OBSERVATION: Anchor the reader in a key scripture. Name the passage and what it literally says. Help the reader see what is actually there in the text. (~80 words)

Paragraph 2 — HISTORICAL CONTEXT: Briefly illuminate the original audience or historical moment. What did this mean to the first hearers? What was happening culturally or theologically? (~80 words)

Paragraph 3 — INTERPRETATION: What does this passage mean theologically? Connect it to a broader biblical truth or theme. Show how it fits the larger story of Scripture. (~100 words)

Paragraph 4 — PERSONAL APPLICATION: Speak directly to the reader ("you") about what this means for daily life right now. Be specific, warm, and honest about struggle and hope. (~100 words)

Paragraph 5 — INVITATION: Close with a gentle call to action or reflection. What is one concrete step or posture the reader can take this week? (~80 words)

Voice and style requirements:
- Write entirely in warm, second-person voice ("you", "your") throughout all paragraphs
- Plain prose only — no markdown, no headings, no bullet points, no numbered lists
- Weave in at least 5 specific Bible references naturally (Book Chapter:Verse format)
- Pastoral tone — like a trusted mentor sitting across the table
- Do NOT include section labels in the output (do not write "Paragraph 1" or "OBSERVATION:")
- Do NOT include questions, reflection prompts, or blanks — just flowing prose

Write the passage directly. No preamble. No postscript.

CONTENT_START`;
}

/**
 * Generate bible study content using Qwen3.
 *
 * @param {object} params
 * @returns {Promise<{content: string, elapsed_ms: number, model: string, tokens: number|null}>}
 */
export async function generateStudyContent(params) {
  const {
    theme,
    format = "workbook",
    audience = "personal",
    level = "intermediate",
    duration = "40 min",
    lessonContext,
    desiredOutcome,
    anchorScriptures,
    customQuestions,
    sensitivities
  } = params;

  const apiKey = process.env.TOTALGPT_API_KEY;
  if (!apiKey) throw new Error("TOTALGPT_API_KEY is not set in environment variables.");

  const prompt = buildPrompt({ theme, format, audience, level, duration, lessonContext, desiredOutcome, anchorScriptures, customQuestions, sensitivities });

  const startTime = Date.now();

  const response = await fetch(TOTALGPT_API_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
      body: JSON.stringify({
      model: TOTALGPT_MODEL,
      prompt,
      max_tokens: 2000,   // reading passage is 400-600 words; thinking model needs extra headroom
      temperature: 0.7,
      stop: null
    })
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`TotalGPT API error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const elapsed_ms = Date.now() - startTime;

  const raw = data?.choices?.[0]?.text || "";
  const content = stripThinking(raw);

  if (!content) throw new Error("TotalGPT returned an empty response after stripping thinking output.");

  return {
    content,
    elapsed_ms,
    model: TOTALGPT_MODEL,
    tokens: data?.usage?.total_tokens || null
  };
}
