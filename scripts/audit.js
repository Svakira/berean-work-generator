import { buildWorkbook, evaluateWorkbookQuality } from "../src/workbookEngine.js";

const checks = [];

function runCheck(name, fn) {
  try {
    fn();
    checks.push({ name, status: "pass" });
  } catch (error) {
    checks.push({ name, status: "fail", error: error.message });
  }
}

runCheck("Workbook engine creates basic sections", () => {
  const workbook = buildWorkbook({
    audience: "teacher",
    title: "Auditoria",
    theme: "Romanos 8",
    level: "intermedio",
    duration: "1 hora",
    scholarData: { answer: "Respuesta academica", sources: [] },
    pastoralData: { answer: "Respuesta pastoral" }
  });

  if (!Array.isArray(workbook.sections) || workbook.sections.length < 6) {
    throw new Error("Insufficient workbook sections.");
  }
});

runCheck("Workbook includes core study framing section", () => {
  const workbook = buildWorkbook({
    audience: "student",
    contentFormat: "worksheet",
    title: "Auditoria",
    theme: "Fe",
    level: "principiante",
    duration: "30 minutos",
    scholarData: { answer: "Respuesta academica", sources: [] },
    pastoralData: { answer: "Respuesta pastoral" }
  });

  const hasCore = workbook.sections.some((section) => section.type === "key_concept");
  if (!hasCore) {
    throw new Error("Key concept section missing.");
  }
});

runCheck("Teacher workbook includes advanced planning sections", () => {
  const workbook = buildWorkbook({
    audience: "teacher",
    title: "Teacher Audit",
    theme: "Family healing",
    level: "intermediate",
    duration: "60 minutes",
    teacherPlan: {
      workbookType: "discipleship_track",
      timeframe: "8_weeks",
      priorStudies: ["Identity in Christ"],
      sourceBooks: ["Psalms"],
      reinforceTopics: ["forgiveness"],
      annotations: "context notes",
      improvementFocus: "shorter readings"
    },
    scholarData: {
      answer: "Long practical insight with Scripture references.",
      sources: [{ tier: 1, collection: "bible_texts", source: "KJV", text: "Psalm 27:10" }]
    },
    pastoralData: { answer: "Pastoral response" }
  });

  const required = ["teacher_plan", "bridge", "reinforce", "notes", "tools"];
  for (const type of required) {
    if (!workbook.sections.some((section) => section.type === type)) {
      throw new Error(`Missing section: ${type}`);
    }
  }
});

runCheck("Quality evaluator produces role-based scores", () => {
  const workbook = buildWorkbook({
    audience: "student",
    title: "Quality audit",
    theme: "Anxiety and peace",
    level: "beginner",
    duration: "30 minutes",
    scholarData: {
      answer: "Insight sentence one. Insight sentence two. Insight sentence three.",
      sources: [
        { tier: 1, collection: "bible_texts", source: "KJV", text: "Phil 4:6" },
        { tier: 1, collection: "commentaries", source: "Gill", text: "Comment" },
        { tier: 1, collection: "church_fathers", source: "Chrysostom", text: "Comment" }
      ]
    },
    pastoralData: { answer: "God is near in anxiety." }
  });

  const quality = evaluateWorkbookQuality(workbook);
  if (typeof quality.overall !== "number") {
    throw new Error("Overall score missing.");
  }
  if (!quality.byRole || typeof quality.byRole.student !== "number") {
    throw new Error("Role score missing.");
  }
});

const failed = checks.filter((check) => check.status === "fail");

for (const check of checks) {
  const prefix = check.status === "pass" ? "PASS" : "FAIL";
  console.log(`${prefix}: ${check.name}`);
  if (check.error) {
    console.log(`  -> ${check.error}`);
  }
}

if (failed.length > 0) {
  process.exitCode = 1;
}
