/**
 * qwenClient.js
 * Client for TotalGPT API — Sao10K-72B-Qwen2.5-Kunou model (non-thinking)
 *
 * ARCHITECTURE:
 * - Uses Qwen2.5-72B fine-tune with no thinking mode. Direct completions output.
 * - Prompt structure: direct pastoral instruction, strict second-person, 5-paragraph OIA framework.
 */

const TOTALGPT_API_URL = "https://api.totalgpt.ai/v1/completions";
const TOTALGPT_MODEL = "Sao10K-72B-Qwen2.5-Kunou-v1-FP8-Dynamic";

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

  return `You are a warm, biblically grounded pastoral educator writing directly to ${audienceNote}.

Write a 5-paragraph biblical reading passage on: ${theme}
${coachAdditions ? `Pastoral guidance: ${coachAdditions}` : ""}

Structure: first paragraph anchors in a key scripture and what it says; second gives historical or cultural context for the original audience; third explores the theological meaning; fourth speaks directly to how this applies to the reader's daily life today; fifth offers a gentle concrete invitation for this week.

Requirements:
- Address the reader directly in second-person voice ("you", "your") throughout — never use "we", "us", or "our"
- Plain flowing prose only — no markdown, no headings, no bullet points
- Naturally weave in at least 5 specific Bible references (e.g., John 3:16, Philippians 4:6)
- 450-600 words total
- No section labels, no questions, no reflection prompts

Write the passage now, beginning with the first paragraph:`;
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
      max_tokens: 1200,
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
