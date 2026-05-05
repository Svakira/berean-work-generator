#!/usr/bin/env node
/**
 * test-qwen.js — LLM prompt testing script
 * Tests different prompt structures against Qwen3-30B-A3B
 * Run: node --env-file=.env scripts/test-qwen.js
 *
 * Best practices applied (Inductive Bible Study method):
 *   1. Observation   — What does Scripture say?
 *   2. Interpretation — What does it mean?
 *   3. Application   — What does it mean for my life?
 *
 * A good workbook also has:
 *   - Warm-up / check-in (retrospective)
 *   - Scripture reading (anchor passage)
 *   - Guided questions (observation → interpretation → application)
 *   - Personal commitment / next step
 */

const API_URL = "https://api.totalgpt.ai/v1/completions";
const MODEL = "Qwen-Qwen3-30B-A3B";
const API_KEY = process.env.TOTALGPT_API_KEY;

if (!API_KEY) {
  console.error("ERROR: TOTALGPT_API_KEY not set");
  process.exit(1);
}

// Strip thinking model output (<think>...</think> blocks AND any "Okay, the user..." preamble)
function stripThinking(text) {
  // Remove <think>...</think> blocks (Qwen3 reasoning traces)
  let cleaned = text.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  // Remove any preamble like "Okay, the user wants..." or "Let me..." or "I need to..."
  cleaned = cleaned.replace(/^(Okay|Sure|Alright|Let me|I need|I will|I'll|Now|First)[^.!?\n]*[.!?\n]\s*/gi, "");
  // Remove bracketed markers like [text], [/text], [Opening: ...], etc.
  cleaned = cleaned.replace(/\[\/?(text|Opening|Reading|Key|Analytical|Personal)[^\]]*\]/gi, "").trim();
  return cleaned;
}

// Quality scorer — checks for key markers of a good Bible study
function scoreOutput(text, theme) {
  let score = 0;
  const issues = [];
  const wins = [];

  // Check: not echoing the theme verbatim in the title
  const themeWords = theme.toLowerCase().split(/\s+/).slice(0, 4).join(" ");
  const firstLine = text.split("\n")[0].toLowerCase();
  if (firstLine.includes(themeWords)) {
    issues.push("First line echoes theme verbatim");
  } else {
    score += 10;
    wins.push("Title is original");
  }

  // Check: uses second person "you" for personal studies
  const youCount = (text.match(/\byou\b|\byour\b/gi) || []).length;
  if (youCount > 5) {
    score += 15;
    wins.push(`Personal voice (${youCount} 'you' hits)`);
  } else {
    issues.push(`Weak personal voice (only ${youCount} 'you' hits)`);
  }

  // Check: references at least 3 Bible passages
  const bibleRefs = text.match(/[1-3]?\s?[A-Z][a-z]+\s+\d+:\d+/g) || [];
  const uniqueRefs = [...new Set(bibleRefs)];
  if (uniqueRefs.length >= 3) {
    score += 20;
    wins.push(`${uniqueRefs.length} Bible references`);
  } else {
    issues.push(`Only ${uniqueRefs.length} Bible references (need ≥3)`);
  }

  // Check: has a retrospective/check-in section
  if (/past week|this week|looking back|reflect on|recently|lately/i.test(text)) {
    score += 10;
    wins.push("Has retrospective check-in");
  } else {
    issues.push("Missing retrospective check-in");
  }

  // Check: has actual questions
  const questions = (text.match(/\?/g) || []).length;
  if (questions >= 4) {
    score += 15;
    wins.push(`${questions} questions present`);
  } else {
    issues.push(`Only ${questions} questions (need ≥4)`);
  }

  // Check: has application section
  if (/this week|take action|practice|commit|next step|apply/i.test(text)) {
    score += 15;
    wins.push("Has application / next step");
  } else {
    issues.push("Missing application section");
  }

  // Check: length is substantial
  const wordCount = text.split(/\s+/).length;
  if (wordCount > 600) {
    score += 15;
    wins.push(`Good length (${wordCount} words)`);
  } else {
    issues.push(`Too short (${wordCount} words, need >600)`);
  }

  // Check: no leaked thinking artifacts
  if (/<think>|Okay, the user|Let me review|the user wants/i.test(text)) {
    score -= 30;
    issues.push("CRITICAL: Thinking artifacts leaked into content");
  } else {
    wins.push("No thinking artifacts");
  }

  return { score, issues, wins, wordCount, bibleRefs: uniqueRefs };
}

async function callQwen(prompt, maxTokens = 2000) {
  const start = Date.now();
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: MODEL,
      prompt,
      max_tokens: maxTokens,
      temperature: 0.7
    })
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const raw = data?.choices?.[0]?.text || "";
  const elapsed = Date.now() - start;
  return { raw, cleaned: stripThinking(raw), elapsed, tokens: data?.usage?.total_tokens };
}

// ============================================================
// PROMPT TEMPLATES — 10 different structures to test
// ============================================================

const TESTS = [
  {
    id: "T01",
    label: "Baseline (current system)",
    theme: "forgiveness",
    format: "workbook",
    buildPrompt: ({ theme }) => `You are a biblical educator. Create a Bible study workbook on "${theme}" for a beginner personal learner, 40 minutes. Include: retrospective reflection, reading section (4-6 paragraphs), key insights, questions, application. Plain text only. No markdown. Write in second person ("you").`
  },
  {
    id: "T02",
    label: "Inductive method explicit (OIA)",
    theme: "fear and anxiety",
    format: "workbook",
    buildPrompt: ({ theme }) => `You are a biblical educator writing a personal Bible study workbook.

TOPIC: ${theme}
FORMAT: 40-minute personal workbook
AUDIENCE: Beginner

Write in warm, second-person voice ("you", "your"). Use plain text only — no markdown, no asterisks, no brackets.

Structure the workbook in this order:

CHECKING IN (100-150 words)
A warm opening that invites the reader to pause and reflect on the past week. Ask one gentle question about where this topic showed up in their life recently.

SCRIPTURE READING (50-80 words)
Introduce 1-2 key Bible passages with their reference. Invite the reader to read them slowly and notice what stands out.

THE PASSAGE OPENS UP (4-6 paragraphs, 400-600 words)
Expound the theme biblically and historically. Write as if you are sitting with the reader, explaining what the text means and why it matters for everyday life. Reference at least 4 different Bible passages.

WHAT DO YOU SEE? (Observation questions — 3 questions)
Questions that help the reader notice what the text actually says. Start with "What..." or "Where..."

WHAT DOES IT MEAN? (Interpretation questions — 2 questions)
Questions that help the reader understand the meaning. Start with "Why..." or "How..."

HOW DOES THIS CHANGE YOU? (Application questions — 3 questions)
Questions that connect the text to this week's life. Start with "Where in your life..." or "What would it look like if..."

THIS WEEK (50-80 words)
One simple, concrete practice for the week. One sentence of commitment.

Write the full workbook now. Do not explain what you are doing. Just write the content.`
  },
  {
    id: "T03",
    label: "Devotional warmth + inductive",
    theme: "identity in Christ",
    format: "workbook",
    buildPrompt: ({ theme }) => `Write a 40-minute personal Bible study workbook on the topic of ${theme}.

Write in warm, personal second-person voice. Plain text only.

---
OPENING REFLECTION

Start with a short (2-3 sentence) invitation to slow down and check in. Ask: where has this topic been showing up in your life lately?

---
THIS WEEK'S SCRIPTURE

Present 2-3 key passages with book, chapter, and verse. Briefly explain why each one was chosen.

---
READING

Write 5 substantial paragraphs that open up the theme biblically. Bring in history, theology, and real life. Quote at least 5 Scripture references throughout. Write as a guide sitting with the reader — warm, curious, inviting them to think.

---
QUESTIONS FOR REFLECTION

Write 6 questions total. First 2 are observation (what the text says). Next 2 are interpretation (what it means). Final 2 are application (what it means for this week). Number each question.

---
PRACTICE THIS WEEK

One practical spiritual exercise the reader can do before the next study. Keep it simple.

---

Write the full workbook. Do not announce sections with dashes or explain what you are writing. Just write it naturally.`
  },
  {
    id: "T04",
    label: "Structured section headers (plain)",
    theme: "grief and lament",
    format: "workbook",
    buildPrompt: ({ theme }) => `You are writing a Bible study workbook. Topic: ${theme}. 40 minutes. Personal learner, beginner level.

Rules:
- Second person only (you, your)
- Plain text, no markdown, no asterisks
- Use simple, clear section headings followed by a colon
- Each section on its own line
- Warm, pastoral, accessible tone
- Minimum 700 words total

Sections to write in order:

Where Have You Been This Week:
(2 paragraphs inviting the reader to reflect on their week and where this topic appeared)

Key Scriptures:
(List 2-3 passages with reference, one sentence about each)

Reading:
(5 paragraphs expounding the theme. Warm, rich, theologically grounded. At least 5 Bible references woven in naturally.)

Reflection Questions:
(6 numbered questions — 2 observation, 2 interpretation, 2 application)

This Week's Practice:
(One simple commitment)

Write the full workbook now.`
  },
  {
    id: "T05",
    label: "Short focused prompt, high temp",
    theme: "patience",
    format: "workbook",
    buildPrompt: ({ theme }) => `Write a 40-minute personal Bible study workbook for a beginner on the topic of ${theme}.

Use second-person voice. Plain text only. Warm, pastoral tone.

Include these sections in order (label each with its name):
- Opening Check-In: reflect on the past week (2 paragraphs)
- Scripture Focus: 2-3 key passages with brief context
- Reading: 5 paragraphs opening up the theme biblically, theologically, practically
- Reflection Questions: 6 numbered questions (2 observation, 2 interpretation, 2 application)
- This Week: one simple spiritual practice

Do not use any markdown. Write warmly and directly. Start writing immediately without preamble.`
  },
  {
    id: "T06",
    label: "No section headers, flowing prose",
    theme: "anger and self-control",
    format: "workbook",
    buildPrompt: ({ theme }) => `You are writing a personal Bible study workbook for a beginner on ${theme}. 40 minutes. Plain text, no markdown, no bullet points, no section headers.

Write it as a flowing, warm guide — like a letter from a pastoral mentor sitting across the table. Use second-person throughout. Include naturally: an opening check-in about the past week, 3 key Scripture passages (referenced with book/chapter/verse), 5 paragraphs of biblical exposition, 6 thoughtful reflection questions (2 on what you observe, 2 on what it means, 2 on how to live it), and a simple practice for the week.

Do not label the sections. Just write. Begin immediately.`
  },
  {
    id: "T07",
    label: "OIA + retrospective + sensitive topic",
    theme: "shame and God's acceptance",
    format: "workbook",
    buildPrompt: ({ theme }) => `Write a personal Bible study workbook (40 minutes, beginner) on the topic: ${theme}.

This is a sensitive pastoral topic. Write with great care, warmth, and theological precision.

Voice: warm second-person ("you"). No markdown. No bullet points. Use simple section labels.

Checking In This Week:
Invite the reader to reflect gently on where shame has shown up in the past few days. Acknowledge that this topic is difficult without being heavy. 2 paragraphs.

Scripture for Today:
Choose 2-3 passages that speak directly to shame and acceptance. Write the reference and a sentence about why it matters.

Reading: What God Says About You:
Write 5 paragraphs. Expound the theme with gentleness and theological depth. Use at least 5 Scripture references. Avoid clinical language. Write as if you are sitting with someone who is struggling.

What Do You Notice? (Observation):
Write 2 questions about what the text actually says.

What Does This Mean? (Interpretation):
Write 2 questions about the meaning behind the text.

How Does This Touch Your Life? (Application):
Write 2 questions connecting the text to this week.

Before You Close:
Write a brief (3-4 sentence) pastoral encouragement. Then one simple practice for the week.

Write the full workbook now.`
  },
  {
    id: "T08",
    label: "Worksheet format (shorter)",
    theme: "trusting God in uncertainty",
    format: "worksheet",
    buildPrompt: ({ theme }) => `Write a 20-minute personal Bible study worksheet for a beginner on: ${theme}.

Voice: second-person. Plain text, no markdown. Warm and practical.

Format:
- This Week's Check-In: (1 short paragraph, 1 reflection question)
- Key Scripture: (1 passage with reference)
- Main Idea: (2-3 sentences summarizing the biblical truth)
- 4 Short Reflection Questions: (numbered, mix of what/why/how)
- One Practice: (one sentence commitment)

Keep it tight, clear, actionable. Write immediately.`
  },
  {
    id: "T09",
    label: "Conversational pastoral letter",
    theme: "loneliness and community",
    format: "workbook",
    buildPrompt: ({ theme }) => `You are a pastor writing a personal Bible study letter to a beginner Christian who is struggling with ${theme}. The letter doubles as a 40-minute study workbook.

Write in warm, direct second-person. Plain text only. Around 800 words.

Your letter should:
1. Open by checking in — acknowledging where the reader might be coming from this week
2. Introduce 2-3 key Bible passages that speak to this topic, with their references
3. Unpack the theme in 4-5 paragraphs — be theologically grounded but humanly warm
4. Offer 5-6 reflection questions (blend of observation, meaning, and personal application)
5. Close with a simple practice for the week and a brief prayer prompt

Write the full letter now. Do not begin with "Dear" — start in the middle of the conversation.`
  },
  {
    id: "T10",
    label: "Tight structural spec with forbidden list",
    theme: "pride and humility",
    format: "workbook",
    buildPrompt: ({ theme }) => `Write a complete 40-minute personal Bible study workbook for a beginner on the topic of ${theme}.

REQUIRED:
- Second-person voice throughout ("you", "your")
- Plain text only
- At least 5 unique Scripture references (book chapter:verse format)
- Minimum 700 words
- 6 reflection questions total
- One practical commitment for the week
- Warm, pastoral, accessible tone

FORBIDDEN:
- Markdown formatting (no **, no ##, no -, no >)
- Echoing the theme title in the first line
- Third-person references to "the student" or "the learner"
- Explaining what you are about to write
- Bullet points

STRUCTURE (label each section simply):
Checking In — 2 paragraphs about the past week and where pride/humility showed up
Today's Scriptures — 2-3 key passages with brief context
Reading — 5 paragraphs of biblical and theological exposition, weaving in Scripture naturally
Reflection Questions — 6 numbered questions (2 observation, 2 interpretation, 2 application)
This Week — one simple practice

Write it now.`
  }
];

// ============================================================
// MAIN — run all tests sequentially to avoid rate limiting
// ============================================================

async function main() {
  console.log(`\n${"=".repeat(70)}`);
  console.log(`QWEN3 PROMPT TESTING — ${new Date().toISOString()}`);
  console.log(`${"=".repeat(70)}\n`);

  const results = [];

  for (const test of TESTS) {
    console.log(`\n${"─".repeat(70)}`);
    console.log(`[${test.id}] ${test.label}`);
    console.log(`Theme: "${test.theme}" | Format: ${test.format}`);
    console.log(`${"─".repeat(70)}`);

    try {
      const prompt = test.buildPrompt({ theme: test.theme, format: test.format });
      const { raw, cleaned, elapsed, tokens } = await callQwen(prompt);
      const result = scoreOutput(cleaned, test.theme);

      console.log(`\nElapsed: ${elapsed}ms | Tokens: ${tokens} | Words: ${result.wordCount}`);
      console.log(`SCORE: ${result.score}/100`);
      console.log(`WINS: ${result.wins.join(", ")}`);
      if (result.issues.length) console.log(`ISSUES: ${result.issues.join(", ")}`);
      console.log(`Bible refs found: ${result.bibleRefs.slice(0, 6).join(", ")}`);
      console.log(`\n--- CONTENT PREVIEW (first 400 chars) ---`);
      console.log(cleaned.slice(0, 400));
      console.log(`...`);

      results.push({ ...test, score: result.score, issues: result.issues, wins: result.wins, wordCount: result.wordCount, elapsed, output: cleaned });
    } catch (err) {
      console.error(`FAILED: ${err.message}`);
      results.push({ ...test, score: -1, issues: [err.message], wins: [], wordCount: 0, elapsed: 0, output: "" });
    }

    // 3 second pause between calls to be gentle on the API
    await new Promise(r => setTimeout(r, 3000));
  }

  // Final ranking
  console.log(`\n${"=".repeat(70)}`);
  console.log("FINAL RANKING");
  console.log(`${"=".repeat(70)}`);
  const ranked = [...results].sort((a, b) => b.score - a.score);
  for (const r of ranked) {
    const bar = "█".repeat(Math.max(0, Math.floor(r.score / 5)));
    console.log(`[${r.id}] ${String(r.score).padStart(3)}/100 ${bar} — ${r.label}`);
  }

  // Print the winner's full output
  const winner = ranked[0];
  if (winner && winner.output) {
    console.log(`\n${"=".repeat(70)}`);
    console.log(`WINNER: [${winner.id}] ${winner.label}`);
    console.log(`${"=".repeat(70)}`);
    console.log(winner.output);
  }
}

main().catch(console.error);
