import express from "express";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { askBereanPastoral, askBereanScholar } from "./bereanClient.js";
import { buildWorkbook, workbookToMarkdown, evaluateWorkbookQuality } from "./workbookEngine.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 4173;
const CACHE_TTL_MS = 12 * 60 * 60 * 1000;

const PREMADE_WORKBOOKS = [
  {
    id: "teen_anxiety_identity",
    token: "[template-teens]",
    contentFormat: "worksheet",
    category: "Teens",
    title: "Teen Workbook: Anxiety and Identity",
    audience: "student",
    theme: "How to handle anxiety and social pressure with biblical identity",
    prompt: "Create a teen-focused workbook on anxiety, social pressure, and identity in Christ. Include short reading blocks, practical weekly actions, emotional honesty prompts, and Scripture-based reframing. Keep language clear, non-shaming, and highly actionable.",
    preview: "Short readings, reflection prompts, and a practical weekly action for anxious students learning biblical identity.",
    level: "beginner",
    duration: "35 minutes"
  },
  {
    id: "teen_purity_boundaries",
    token: "[template-teens-boundaries]",
    contentFormat: "worksheet",
    category: "Teens",
    title: "Teen Workbook: Purity and Boundaries",
    audience: "student",
    theme: "Healthy boundaries, purity, and wise choices in relationships",
    prompt: "Build a workbook for teenagers about purity, consent, boundaries, and wise relationships. Include pastoral clarity, practical boundaries, accountability ideas, and biblical identity. Keep tone compassionate and direct.",
    preview: "Compassionate teaching on boundaries, consent, purity, and wise choices with practical accountability steps.",
    level: "intermediate",
    duration: "40 minutes"
  },
  {
    id: "kids_fear_night",
    token: "[template-kids]",
    contentFormat: "worksheet",
    category: "Kids",
    title: "Kids Workbook: Fear at Night",
    audience: "student",
    theme: "God's care when children feel afraid at night",
    prompt: "Create a child-friendly workbook about fear at night with very short readings, simple prayers, memory verses, and parent-guided reflection prompts. Keep vocabulary easy and hopeful.",
    preview: "Very short readings, simple prayers, and reassuring Scripture for children who struggle with fear at night.",
    level: "beginner",
    duration: "25 minutes"
  },
  {
    id: "kids_kindness_friends",
    token: "[template-kids-friends]",
    contentFormat: "worksheet",
    category: "Kids",
    title: "Kids Workbook: Kindness and Friends",
    audience: "student",
    theme: "How to be kind, forgive, and build healthy friendships",
    prompt: "Create a child workbook on kindness, forgiveness, and friendship. Include playful practical exercises, short role-play prompts, and one weekly kindness challenge grounded in Scripture.",
    preview: "Friendship and kindness exercises with child-friendly prompts, role-play ideas, and a weekly challenge.",
    level: "beginner",
    duration: "25 minutes"
  },
  {
    id: "women_worth_healing",
    token: "[template-women]",
    contentFormat: "worksheet",
    category: "Women",
    title: "Women Workbook: Worth and Healing",
    audience: "student",
    theme: "Healing shame and rebuilding worth through God's truth",
    prompt: "Create a workbook for women on healing shame and restoring identity in Christ. Include trauma-aware language, gentle reflection prompts, practical boundaries, and weekly healing practices rooted in Scripture.",
    preview: "Trauma-aware reflection, identity work, and practical healing rhythms rooted in Scripture.",
    level: "intermediate",
    duration: "45 minutes"
  },
  {
    id: "men_purpose_integrity",
    token: "[template-men]",
    contentFormat: "worksheet",
    category: "Men",
    title: "Men Workbook: Purpose and Integrity",
    audience: "student",
    theme: "Purpose, integrity, and emotional responsibility as a man of faith",
    prompt: "Create a workbook for men focused on purpose, integrity, emotional responsibility, and spiritual leadership. Include practical habits, repentance framework, and measurable weekly commitments from Scripture.",
    preview: "Purpose, integrity, repentance, and measurable commitments for men pursuing spiritual maturity.",
    level: "intermediate",
    duration: "45 minutes"
  },
  {
    id: "husbands_love_lead",
    token: "[template-husbands]",
    contentFormat: "workbook",
    category: "Husbands",
    title: "Husbands Workbook: Love and Leadership",
    audience: "teacher",
    theme: "Christlike leadership, sacrificial love, and communication in marriage",
    prompt: "Create a teacher-grade workbook for husbands on Christlike love, communication repair, conflict de-escalation, and servant leadership. Include session flow, couple exercises, and multi-week reinforcement plan.",
    preview: "A teacher-grade marriage workbook with session flow, couple exercises, and reinforcement structure.",
    level: "intermediate",
    duration: "60 minutes"
  },
  {
    id: "wives_strength_wisdom",
    token: "[template-wives]",
    contentFormat: "workbook",
    category: "Wives",
    title: "Wives Workbook: Strength and Wisdom",
    audience: "teacher",
    theme: "Biblical strength, wisdom, and peace-building in marriage",
    prompt: "Create a teacher-grade workbook for wives on biblical wisdom, emotional resilience, peacemaking, and healthy communication in marriage. Include weekly checkpoints and practical home application.",
    preview: "A guided marriage study on wisdom, resilience, peace-building, and practical home application.",
    level: "intermediate",
    duration: "60 minutes"
  }
];

const requestCache = new Map();

function cacheGet(key) {
  const hit = requestCache.get(key);
  if (!hit) return null;
  const isExpired = Date.now() - hit.timestamp > CACHE_TTL_MS;
  if (isExpired) {
    requestCache.delete(key);
    return null;
  }
  return hit.value;
}

function cacheSet(key, value) {
  requestCache.set(key, { timestamp: Date.now(), value });
}

function tokenizeTopic(text) {
  return uniqueWords(
    String(text || "")
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter(Boolean)
  );
}

function uniqueWords(items) {
  return [...new Set(items)];
}

function hasAny(tokens, values) {
  return values.some((value) => tokens.includes(value));
}

function detectEmotions(rawText) {
  const lowered = String(rawText || "").toLowerCase();
  const emotions = [];
  if (/(guilt|guilty)/.test(lowered)) emotions.push("guilt");
  if (/(shame|ashamed)/.test(lowered)) emotions.push("shame");
  if (/(fear|afraid|scared|anxiety|anxious|worry|worried)/.test(lowered)) emotions.push("fear and anxiety");
  if (/(anger|angry|resentment|resentful)/.test(lowered)) emotions.push("anger");
  if (/(sad|sadness|grief|grieving|hurt)/.test(lowered)) emotions.push("grief and hurt");
  return emotions;
}

function buildIntentForDivorceParents() {
  return {
    primaryEmotion: "guilt",
    relationalConflict: "divided loyalty between both parents",
    pastoralAim: "help the student understand false guilt, resist pressure to choose sides, and speak with both parents peacefully and truthfully without carrying false responsibility",
    suggestedPassages: ["Psalm 34:18", "James 1:19", "Romans 12:18", "Ephesians 4:29"],
    questionAngles: ["pressure to choose sides", "false guilt", "peaceful communication", "healthy boundaries"],
    reflectionFocus: "false guilt, divided loyalty, peaceful communication, healthy boundaries"
  };
}

function buildGenericIntent(rawTheme, combinedTokens) {
  const emotionalParts = detectEmotions(rawTheme);
  const primaryEmotion = emotionalParts[0] || "emotional struggle";

  let relationalConflict = "a difficult personal situation";
  if (hasAny(combinedTokens, ["parent", "parents", "mother", "father", "mom", "dad"])) {
    relationalConflict = "a difficult relationship with parents";
  } else if (hasAny(combinedTokens, ["marriage", "spouse", "husband", "wife", "couple"])) {
    relationalConflict = "a strained marriage relationship";
  }

  return {
    primaryEmotion,
    relationalConflict,
    pastoralAim: `help the student understand ${primaryEmotion}, name what is true, and respond with peaceful, truthful obedience`,
    suggestedPassages: hasAny(combinedTokens, ["anxiety", "fear", "worry", "worried"])
      ? ["Philippians 4:6-7", "Psalm 56:3", "Isaiah 41:10"]
      : ["Psalm 34:18", "James 1:19", "Romans 12:18"],
    questionAngles: [primaryEmotion, "truth and lies", "peaceful communication", "next step of obedience"],
    reflectionFocus: `${primaryEmotion}, truth, peaceful communication, next step of obedience`
  };
}

function generateTitleFromTheme(theme) {
  const t = String(theme || "").trim();
  if (!t) return "Bible Study Guide";
  const clean = t.replace(/\s+/g, " ").replace(/[^\w\s,.:'-]/g, "").trim();
  const capped = clean.charAt(0).toUpperCase() + clean.slice(1);
  return `Study Guide: ${capped.slice(0, 80)}`;
}

export function normalizeStudyRequest({ title = "", theme = "" }) {
  const rawTitle = String(title || "").trim();
  const rawTheme = String(theme || "").trim();
  const combinedTokens = tokenizeTopic(`${rawTitle} ${rawTheme}`);

  if (hasAny(combinedTokens, ["divorce", "divorcing"]) && hasAny(combinedTokens, ["parent", "parents", "mom", "mother", "dad", "father"])) {
    return {
      title: "Workbook: Guilt, Divided Loyalty, and Talking With Both Parents During Divorce",
      theme: "guilt, divided loyalty, and talking with both parents during divorce",
      intent: buildIntentForDivorceParents()
    };
  }

  if (/(^|\s)i\s/.test(rawTheme.toLowerCase()) || /(i feel|i want|help me|why i feel)/i.test(rawTheme)) {
    const emotionalParts = detectEmotions(rawTheme);
    const emotionLabel = emotionalParts.length ? emotionalParts.join(", ") : "emotional struggle";
    const intent = buildGenericIntent(rawTheme, combinedTokens);

    let context = "a difficult family situation";
    if (hasAny(combinedTokens, ["parent", "parents"])) context = "a difficult relationship with parents";
    if (hasAny(combinedTokens, ["marriage", "divorce", "divorcing"])) context = "family conflict and divided loyalties";

    return {
      title: `Workbook: ${emotionLabel.charAt(0).toUpperCase()}${emotionLabel.slice(1)} and ${context}`,
      theme: `${emotionLabel} in ${context}`,
      intent
    };
  }

  return {
    title: rawTitle,
    theme: rawTheme,
    intent: buildGenericIntent(rawTheme, combinedTokens)
  };
}

export function buildLocalFallbackResponses({ audience, theme, level, contentFormat, intent = {} }) {
  const passages = Array.isArray(intent.suggestedPassages) && intent.suggestedPassages.length
    ? intent.suggestedPassages
    : ["Psalm 34:18", "James 1:19", "Romans 12:18"];
  const passageLine = passages.join(", ");
  const aim = intent.pastoralAim || `help the student reflect on ${theme} with truth, peace, and practical obedience`;
  const reflectionFocus = intent.reflectionFocus || theme;
  const questionAngles = Array.isArray(intent.questionAngles) ? intent.questionAngles : [];

  const scholarAnswer = audience === "teacher"
    ? [
        `Lead a ${level} ${contentFormat} on ${theme}.`,
        `Use passages such as ${passageLine}.`,
        `Clarify the central biblical problem, name the emotional pressure honestly, and move the group toward truthful, peaceful, and practical obedience.`,
        questionAngles.length ? `Build discussion around ${questionAngles.join(", ")}.` : null
      ].filter(Boolean).join(" ")
    : [
        `This study explores ${theme}.`,
        `Use passages such as ${passageLine}.`,
        `Explain the main biblical truth in plain language, help the student name the emotional pressure honestly, and move toward one practical step of obedience this week.`,
        questionAngles.length ? `Reflect especially on ${questionAngles.join(", ")}.` : null
      ].filter(Boolean).join(" ");

  const pastoralAnswer = audience === "teacher"
    ? `Help the group reflect on ${reflectionFocus}. ${aim.charAt(0).toUpperCase()}${aim.slice(1)}. Keep the tone calm, truthful, and pastorally gentle.`
    : `This study helps the student reflect on ${reflectionFocus}. ${aim.charAt(0).toUpperCase()}${aim.slice(1)}. Keep the tone calm, truthful, and pastorally gentle.`;

  const bereanReflectionPrompt = audience === "teacher"
    ? `I am preparing to guide a group through ${theme}. Help me reflect on ${reflectionFocus}, identify what responsibility belongs to the group members and what does not, and shape peaceful, truthful questions and next steps using Scripture such as ${passageLine}.`
    : `I am reflecting on ${theme}. Help me examine ${reflectionFocus}, understand what responsibility belongs to me and what does not, and learn how to respond peacefully and truthfully using Scripture such as ${passageLine}.`;

  return {
    scholar: {
      answer: scholarAnswer,
      sources: passages.map((passage) => ({
        tier: 1,
        collection: "derived_references",
        source: "Local fallback reference",
        tradition: "Fallback reference map",
        text: passage
      })),
      model: "fallback-local",
      elapsed_ms: null,
      sources_count: passages.length
    },
    pastoral: {
      answer: pastoralAnswer,
      sources: [],
      model: "fallback-local",
      elapsed_ms: null,
      sources_count: 0
    },
    bereanReflectionPrompt
  };
}

function normalizeInput(body) {
  const splitCsv = (value) =>
    String(value || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 20);

  const splitLines = (value) =>
    String(value || "")
      .split(/\n|;/)
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 8);

  const normalizedStudy = normalizeStudyRequest({
    title: String(body?.title || "Bible Study Workbook").trim().slice(0, 120),
    theme: String(body?.theme || "Biblical topic").trim().slice(0, 1200)
  });

  return {
    audience: body?.audience === "teacher" ? "teacher" : "student",
    contentFormat: body?.contentFormat === "worksheet" ? "worksheet" : "workbook",
    title: String(normalizedStudy.title || generateTitleFromTheme(String(body?.theme || ""))).trim().slice(0, 120),
    theme: String(normalizedStudy.theme || "Biblical topic").trim().slice(0, 1200),
    intent: normalizedStudy.intent || buildGenericIntent(String(body?.theme || "Biblical topic"), tokenizeTopic(String(body?.theme || "Biblical topic"))),
    level: String(body?.level || "beginner").trim().slice(0, 60),
    duration: String(body?.duration || "45 minutes").trim().slice(0, 60),
    lessonContext: String(body?.lessonContext || "").trim().slice(0, 1200),
    desiredOutcome: String(body?.desiredOutcome || "").trim().slice(0, 600),
    anchorScriptures: String(body?.anchorScriptures || "").trim().slice(0, 600),
    sensitivities: String(body?.sensitivities || "").trim().slice(0, 600),
    customQuestions: splitLines(body?.customQuestions),
    teacherPlan: {
      workbookType: String(body?.workbookType || "session_worksheet").trim().slice(0, 60),
      timeframe: String(body?.timeframe || "single_session").trim().slice(0, 60),
      priorStudies: splitCsv(body?.priorStudies),
      sourceBooks: splitCsv(body?.sourceBooks),
      reinforceTopics: splitCsv(body?.reinforceTopics),
      annotations: String(body?.annotations || "").trim().slice(0, 1000),
      improvementFocus: String(body?.improvementFocus || "").trim().slice(0, 1000)
    },
    presetId: String(body?.presetId || "").trim().slice(0, 80)
  };
}

function resolvePreset(input) {
  if (input.presetId) {
    return PREMADE_WORKBOOKS.find((item) => item.id === input.presetId) || null;
  }
  const tokenMatch = String(input.theme || "").trim().match(/^\[(template-[^\]]+)\]$/i);
  if (!tokenMatch) return null;
  const token = `[${tokenMatch[1].toLowerCase()}]`;
  return PREMADE_WORKBOOKS.find((item) => String(item.token || "").toLowerCase() === token) || null;
}

export function createServerApp() {
  const app = express();
  app.use(express.json({ limit: "1mb" }));
  app.use(express.static(path.join(__dirname, "..", "public")));

  app.get("/generator", (_req, res) => {
    res.sendFile(path.join(__dirname, "..", "public", "generator.html"));
  });

  app.get("/guide", (_req, res) => {
    res.sendFile(path.join(__dirname, "..", "public", "guide.html"));
  });

  app.get("/guide/print", (_req, res) => {
    res.sendFile(path.join(__dirname, "..", "public", "guide.html"));
  });

  app.get("/templates", (_req, res) => {
    res.sendFile(path.join(__dirname, "..", "public", "templates.html"));
  });

  app.get("/health", (_req, res) => {
    res.json({ ok: true, service: "berean-workbook-mvp" });
  });

  app.get("/api/premade", (_req, res) => {
    res.json({
      count: PREMADE_WORKBOOKS.length,
      items: PREMADE_WORKBOOKS
    });
  });

  app.post("/api/generate", async (req, res) => {
  const input = normalizeInput(req.body);
  const preset = resolvePreset(input);
  const effectiveTheme = preset?.theme || input.theme;
  const effectiveTitle = preset?.title || input.title;
  const effectiveFormat = preset?.contentFormat || input.contentFormat;
  const cacheKey = JSON.stringify(input);
  const cached = cacheGet(cacheKey);
  if (cached) {
    return res.json({ ...cached, cache: "hit" });
  }

  try {
    // Build rich, focused question for Berean Scholar (single API call to preserve rate limit: 20/day per IP)
    const formatInstruction = effectiveFormat === "worksheet"
      ? "Focus on key practical insights a student can immediately apply in daily life."
      : "Provide a thorough biblical exposition with enough depth for a learner to read, analyze, and draw their own conclusions from.";

    const coachParts = [
      input.lessonContext ? `Lesson context: ${input.lessonContext}.` : "",
      input.desiredOutcome ? `Desired spiritual outcome: ${input.desiredOutcome}.` : "",
      input.anchorScriptures ? `Please include these anchor Scriptures: ${input.anchorScriptures}.` : "",
      input.customQuestions.length ? `Also address these questions: ${input.customQuestions.join(" | ")}.` : "",
      input.sensitivities ? `Pastoral note: ${input.sensitivities}.` : ""
    ].filter(Boolean).join(" ");

    const audienceNote = input.audience === "teacher"
      ? `for group leaders preparing a ${input.level} session`
      : `for a ${input.level} individual learner`;

    const scholarQuestion = [
      preset?.prompt ||
        `What does Scripture teach about "${effectiveTheme}"? ${formatInstruction}`,
      `This is ${audienceNote} with approximately ${input.duration} available.`,
      `Include the most relevant Bible passages and their meaning in context, 4 to 6 key spiritual insights or theological points, and at least one practical application for real life.`,
      coachParts
    ].filter(Boolean).join(" ");

    const localFallback = buildLocalFallbackResponses({
      audience: input.audience,
      theme: effectiveTheme,
      level: input.level,
      contentFormat: effectiveFormat,
      intent: input.intent
    });

    // Single Berean Scholar call (conserves daily rate limit: 20 requests/day/IP)
    let scholarData;
    let warning = null;

    try {
      scholarData = await askBereanScholar(scholarQuestion);
    } catch (err) {
      scholarData = localFallback.scholar;
      warning = `Scholar request fallback: ${String(err?.message || "unknown error")}`;
    }

    // Pastoral summary derived locally from scholar response (no second API call)
    const pastoralData = localFallback.pastoral;
    const mode = warning ? "hybrid" : "berean";

    const sourceCollections = Array.isArray(scholarData?.sources)
      ? [...new Set(scholarData.sources.map((s) => s.collection).filter(Boolean))]
      : [];

    const workbook = buildWorkbook({
      ...input,
      contentFormat: effectiveFormat,
      title: effectiveTitle,
      theme: effectiveTheme,
      intent: {
        ...input.intent,
        bereanReflectionPrompt: localFallback.bereanReflectionPrompt
      },
      scholarData,
      pastoralData
    });

    const payload = {
      workbook,
      markdown: workbookToMarkdown(workbook),
      cache: "miss",
      warning,
      telemetry: {
        scholarModel: scholarData?.model || "unknown",
        scholarElapsedMs: scholarData?.elapsed_ms || null,
        sourcesCount: scholarData?.sources_count || 0
      },
      provenance: {
        presetId: preset?.id || input.presetId || null,
        mode,
        steps: [
          "Input normalized locally",
          "Single prompt sent to BEREAN /api/v1/scholar (rate limit: 20/day/IP)",
          "Pastoral summary derived locally from intent data",
          "Workbook composed from scholar response",
          "Sources filtered and attached for Berean traceability"
        ],
        prompts: {
          scholar: scholarQuestion
        },
        berean: {
          scholarModel: scholarData?.model || "unknown",
          scholarElapsedMs: scholarData?.elapsed_ms || null,
          scholarSourcesCount: scholarData?.sources_count || 0,
          sourceCollections
        },
        answerPreview: {
          scholar: String(scholarData?.answer || "").slice(0, 700)
        }
      },
      quality: {
        ...evaluateWorkbookQuality(workbook),
        roleCoverage: ["teacher", "student", "interested", "critic"],
        didacticSections: workbook.sections.length
      }
    };

    cacheSet(cacheKey, payload);
    res.json(payload);
  } catch (error) {
    const message = String(error?.message || "Unknown generation error.");
    const isRateLimit = /rate|limit|20/i.test(message);
    res.status(isRateLimit ? 429 : 500).json({
      error: message,
      guidance: isRateLimit
        ? "BEREAN daily limit reached (20 requests/day per IP). Retry tomorrow or contact berean.ai for higher limits."
        : "Workbook generation failed. Try a narrower topic and run again."
    });
  }
  });

  return app;
}

const entryUrl = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : null;

if (entryUrl === import.meta.url) {
  createServerApp().listen(PORT, () => {
    console.log(`Berean Workbook MVP running on http://localhost:${PORT}`);
  });
}
