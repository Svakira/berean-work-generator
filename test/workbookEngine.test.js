import test from "node:test";
import assert from "node:assert/strict";
import { buildWorkbook, workbookToMarkdown, evaluateWorkbookQuality } from "../src/workbookEngine.js";

test("buildWorkbook returns expected section structure", () => {
  const workbook = buildWorkbook({
    audience: "student",
    title: "Workbook de prueba",
    theme: "Juan 3:16",
    level: "principiante",
    duration: "45 minutos",
    scholarData: {
      answer: "Juan 3:16 enseña sobre el amor de Dios.",
      sources: [{ tier: 1, collection: "bible_texts", source: "KJV", text: "John 3:16" }]
    },
    pastoralData: {
      answer: "Dios ama al mundo y ofrece salvacion en Cristo."
    }
  });

  assert.equal(workbook.meta.title, "Workbook de prueba");
  assert.ok(workbook.sections.length >= 6);
  assert.ok(workbook.sources.length >= 1);
  assert.ok(workbook.sources.some((source) => /John 3:16|Juan 3:16/i.test(source.text)));
});

test("workbookToMarkdown includes key headings", () => {
  const workbook = {
    meta: {
      title: "Titulo",
      audience: "student",
      theme: "Fe",
      level: "principiante",
      duration: "30 minutos",
      createdAt: "2026-01-01T00:00:00.000Z"
    },
    sections: [{ title: "Objetivo", content: "Crecer en fe." }],
    sources: []
  };

  const markdown = workbookToMarkdown(workbook);
  assert.match(markdown, /# Titulo/);
  assert.match(markdown, /## Objetivo/);
  assert.match(markdown, /## Sources/);
});

test("evaluateWorkbookQuality returns role scores and overall", () => {
  const workbook = buildWorkbook({
    audience: "teacher",
    title: "Teacher workbook",
    theme: "Hope in conflict",
    level: "intermediate",
    duration: "60 minutes",
    teacherPlan: {
      workbookType: "discipleship_track",
      timeframe: "8_weeks",
      priorStudies: ["Identity in Christ"],
      sourceBooks: ["Psalms"],
      reinforceTopics: ["forgiveness"],
      annotations: "context",
      improvementFocus: "shorter reads"
    },
    scholarData: {
      answer: "Academic insight sentence. Another useful sentence for class.",
      sources: [
        { tier: 1, collection: "bible_texts", source: "KJV", text: "Psalm 27:10" },
        { tier: 1, collection: "commentaries", source: "Calvin", text: "Comment" },
        { tier: 1, collection: "church_fathers", source: "Augustine", text: "Text" }
      ]
    },
    pastoralData: { answer: "Pastoral summary sentence." }
  });

  const quality = evaluateWorkbookQuality(workbook);
  assert.equal(typeof quality.overall, "number");
  assert.equal(typeof quality.byRole.professor, "number");
  assert.ok(Array.isArray(quality.feedback));
});

test("buildWorkbook preserves explicit Scripture range from the requested theme", () => {
  const workbook = buildWorkbook({
    audience: "student",
    contentFormat: "worksheet",
    title: "Philippians workbook",
    theme: "Philippians 4:6-7 and anxiety",
    level: "beginner",
    duration: "45 minutes",
    scholarData: {
      answer: "Philippians 4:6 reminds believers not to be anxious.",
      sources: [{ tier: 1, collection: "bible_texts", source: "BSB", text: "Philippians 4:6 (BSB) text" }]
    },
    pastoralData: {
      answer: "God gives peace when anxious hearts turn to Him in prayer."
    }
  });

  const overview = workbook.sections.find((section) => section.type === "worksheet_intro");
  assert.match(overview.content, /Main Scripture: Philippians 4:6-7\./);
});

test("teacher workbook focus is specific and quality flags formatting artifacts", () => {
  const workbook = buildWorkbook({
    audience: "teacher",
    contentFormat: "workbook",
    title: "Marriage Peace",
    theme: "Biblical peacemaking in marriage",
    level: "intermediate",
    duration: "60 minutes",
    teacherPlan: {
      workbookType: "discipleship_track",
      timeframe: "8_weeks",
      priorStudies: ["conflict"],
      sourceBooks: ["Ephesians"],
      reinforceTopics: ["gentleness"],
      annotations: "adult couples",
      improvementFocus: "clear prompts"
    },
    scholarData: {
      answer: "### Workbook: Biblical Peacemaking in Marriage. Peace in marriage grows through truth, repentance, gentleness, and patient listening.",
      sources: [
        { tier: 1, collection: "bible_texts", source: "KJV", text: "Romans 14:19 peace and edification" },
        { tier: 1, collection: "commentaries", source: "Calvin", text: "marriage peace and gentleness" },
        { tier: 1, collection: "church_fathers", source: "Augustine", text: "peace in marriage" }
      ]
    },
    pastoralData: {
      answer: "Lead your group toward peace with patient listening, confession, prayer, and visible reconciliation."
    }
  });

  const focus = workbook.sections.find((section) => section.type === "focus");
  assert.doesNotMatch(focus.content, /^How this study helps with/i);

  const noisyWorkbook = {
    ...workbook,
    sections: workbook.sections.map((section, index) =>
      index === 1
        ? { ...section, content: `${section.content} ### Workbook: Example "This is crowded"(Romans 14:19)` }
        : section
    )
  };

  const quality = evaluateWorkbookQuality(noisyWorkbook);
  assert.ok(quality.overall < 100);
  assert.ok(quality.feedback.some((item) => /formatting artifacts/i.test(item)));
});

test("buildWorkbook uses structured divorce intent for overview, scripture, questions, and Berean reflection", () => {
  const workbook = buildWorkbook({
    audience: "student",
    contentFormat: "worksheet",
    title: "Workbook: Guilt, Divided Loyalty, and Talking With Both Parents During Divorce",
    theme: "guilt, divided loyalty, and talking with both parents during divorce",
    level: "beginner",
    duration: "45 minutes",
    intent: {
      primaryEmotion: "guilt",
      relationalConflict: "divided loyalty between both parents",
      pastoralAim: "help the student understand false guilt, resist pressure to choose sides, and speak with both parents peacefully and truthfully",
      suggestedPassages: ["Psalm 34:18", "James 1:19", "Romans 12:18", "Ephesians 4:29"],
      questionAngles: ["pressure to choose sides", "false guilt", "peaceful communication", "healthy boundaries"],
      reflectionFocus: "false guilt, divided loyalty, healthy boundaries, peaceful communication"
    },
    scholarData: {
      answer: "This study explores divided loyalty, false guilt, and peaceful communication with both parents during divorce. Psalm 34:18 and James 1:19 are especially relevant.",
      sources: []
    },
    pastoralData: {
      answer: "This study helps the student understand false guilt and resist pressure to choose sides while speaking peacefully with both parents."
    }
  });

  const overview = workbook.sections.find((section) => section.type === "worksheet_intro");
  const questions = workbook.sections.find((section) => section.type === "questions");
  const action = workbook.sections.find((section) => section.type === "worksheet_action");
  const reflectionPrompt = workbook.sections.find((section) => section.type === "reflection_prompt");

  assert.doesNotMatch(overview.content, /I want something|why i feel/i);
  assert.doesNotMatch(overview.content, /help the student help the student/i);
  assert.match(overview.content, /false guilt|divided loyalty|both parents/i);
  assert.doesNotMatch(overview.content, /Philippians 4:8/);
  assert.match(overview.content, /Psalm 34:18|James 1:19|Romans 12:18|Ephesians 4:29/);
  assert.match(questions.content, /choose sides|false guilt|healthy boundaries|peaceful communication/i);
  assert.doesNotMatch(questions.content, /pressure around pressure/i);
  assert.match(action.content, /both parents|emotion|boundary|prayer/i);
  assert.match(reflectionPrompt.content, /Berean|false guilt|both parents|healthy boundaries/i);

  const quality = evaluateWorkbookQuality(workbook);
  assert.equal(quality.metrics.relevantSources, 4);
});
