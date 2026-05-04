import test from "node:test";
import assert from "node:assert/strict";
import { createServerApp, normalizeStudyRequest, buildLocalFallbackResponses } from "../src/server.js";

test("GET /templates returns the template library page", async () => {
  const app = createServerApp();
  const server = app.listen(0);
  const port = server.address().port;

  try {
    const response = await fetch(`http://127.0.0.1:${port}/templates`);
    const html = await response.text();
    assert.equal(response.status, 200);
    assert.match(html, /Template Library/i);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  }
});

test("GET /api/premade exposes template previews for the library page", async () => {
  const app = createServerApp();
  const server = app.listen(0);
  const port = server.address().port;

  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/premade`);
    const payload = await response.json();
    assert.equal(response.status, 200);
    assert.ok(Array.isArray(payload.items));
    assert.equal(typeof payload.items[0].prompt, "string");
    assert.equal(typeof payload.items[0].preview, "string");
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  }
});

test("normalizeStudyRequest reframes first-person divorce guilt input into a usable study topic", () => {
  const normalized = normalizeStudyRequest({
    title: "Divorce and parents I want something to unveil why i feel guilty to",
    theme: "Divorce and parents I want something to unveil why i feel guilty to talk to them"
  });

  assert.equal(normalized.title, "Workbook: Guilt, Divided Loyalty, and Talking With Both Parents During Divorce");
  assert.equal(normalized.theme, "guilt, divided loyalty, and talking with both parents during divorce");
  assert.equal(normalized.intent.primaryEmotion, "guilt");
  assert.equal(normalized.intent.relationalConflict, "divided loyalty between both parents");
  assert.match(normalized.intent.pastoralAim, /false responsibility|choose sides|both parents/i);
  assert.ok(Array.isArray(normalized.intent.suggestedPassages));
  assert.ok(Array.isArray(normalized.intent.questionAngles));
});

test("buildLocalFallbackResponses creates contextual family-divorce guidance and a Berean reflection prompt", () => {
  const fallback = buildLocalFallbackResponses({
    audience: "student",
    theme: "guilt, divided loyalty, and talking with both parents during divorce",
    level: "beginner",
    contentFormat: "worksheet",
    intent: {
      primaryEmotion: "guilt",
      relationalConflict: "divided loyalty between both parents",
      pastoralAim: "help the student understand false guilt, resist pressure to choose sides, and speak with both parents peacefully and truthfully",
      suggestedPassages: ["Psalm 34:18", "James 1:19", "Romans 12:18", "Ephesians 4:29"],
      questionAngles: ["pressure to choose sides", "false guilt", "peaceful communication", "healthy boundaries"],
      reflectionFocus: "false guilt, divided loyalty, healthy boundaries, peaceful communication"
    }
  });

  assert.match(fallback.scholar.answer, /Psalm 34:18|James 1:19|Romans 12:18|Ephesians 4:29/i);
  assert.match(fallback.pastoral.answer, /false guilt|choose sides|both parents|divorce/i);
  assert.match(fallback.bereanReflectionPrompt, /false guilt|choose sides|both parents|peacefully/i);
  assert.doesNotMatch(fallback.pastoral.answer, /I want something|why i feel/i);
});
