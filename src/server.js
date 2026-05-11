import express from "express";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { askBereanPastoral, askBereanScholar } from "./bereanClient.js";
import { generateStudyContent } from "./qwenClient.js";
import { buildWorkbook, workbookToMarkdown, evaluateWorkbookQuality } from "./workbookEngine.js";
import { scoreContent } from "./qualityScorer.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 4173;
const CACHE_TTL_MS = 12 * 60 * 60 * 1000;

const PREMADE_WORKBOOKS = [
  // ── Personal Growth ─────────────────────────────────────────────────────
  {
    id: "anxiety_peace_philippians",
    token: "[template-anxiety]",
    contentFormat: "workbook",
    category: "Personal Growth",
    title: "Anxiety and the Peace of God",
    audience: "student",
    theme: "Replacing anxiety with biblical peace through prayer, gratitude, and trust in Philippians 4",
    prompt: "Anchor this study in Philippians 4:4-7 and Isaiah 41:10. Help the student identify the specific fears underneath their anxiety, distinguish healthy concern from anxious spiraling, and practice the disciplines of prayer and thanksgiving as Paul describes. Include space to name what the student cannot control and what God has promised. Weekly practice: three-day prayer journaling exercise.",
    preview: "A personal workbook anchored in Philippians 4 — name your fears, practice gratitude, and build a daily rhythm of peace.",
    level: "beginner",
    duration: "45 minutes"
  },
  {
    id: "identity_christ_not_performance",
    token: "[template-identity]",
    contentFormat: "workbook",
    category: "Personal Growth",
    title: "Your Identity Is Not Your Performance",
    audience: "student",
    theme: "Resting in who God says you are instead of what you accomplish or how others see you",
    prompt: "Ground this study in Ephesians 1:3-14, Galatians 2:20, and Romans 8:1. Help the student expose the lies of performance-based identity (I am what I do, I am what others say, I am my failures) and replace them with specific biblical truths. Include a personal identity audit and a practical exercise to interrupt self-critical thoughts with Scripture. Weekly practice: one affirming truth to memorize and repeat.",
    preview: "Expose performance-based identity lies and replace them with what Scripture actually says about who you are.",
    level: "intermediate",
    duration: "50 minutes"
  },
  {
    id: "forgiveness_releasing_offense",
    token: "[template-forgiveness]",
    contentFormat: "workbook",
    category: "Personal Growth",
    title: "Forgiveness: Releasing What You Cannot Change",
    audience: "student",
    theme: "What biblical forgiveness is and is not — and how to release an offense without minimizing the wound",
    prompt: "Use Matthew 18:21-35, Colossians 3:13, and Luke 23:34 as anchors. Clarify the difference between forgiveness and trust, forgiveness and reconciliation, and forgiveness and excusing harm. Help the student process the specific offense they are carrying, name the wound honestly, and take one practical step toward release. Include a reflection on what forgiveness costs and what it frees. Avoid toxic positivity.",
    preview: "A clear, honest guide through what forgiveness is, what it isn't, and how to take one real step toward releasing an offense.",
    level: "intermediate",
    duration: "50 minutes"
  },
  {
    id: "grief_god_present_in_loss",
    token: "[template-grief]",
    contentFormat: "workbook",
    category: "Personal Growth",
    title: "Grief: God Is Present in the Loss",
    audience: "student",
    theme: "Lamenting honestly before God and finding his presence in grief, not beyond it",
    prompt: "Ground this study in Psalm 22, John 11:33-35, and 2 Corinthians 1:3-4. Normalize grief as a biblical response and create space for honest lament. Help the student name what they have lost, what they feel, and what they fear losing next. Distinguish grief from hopelessness. Include a guided lament exercise modeled on the Psalms. Do not rush toward resolution — let the study sit in honest pain before pointing to hope.",
    preview: "Space to grieve honestly, lament biblically, and discover that God meets us in loss — not after it.",
    level: "beginner",
    duration: "45 minutes"
  },
  // ── Teens ────────────────────────────────────────────────────────────────
  {
    id: "teens_identity_social_pressure",
    token: "[template-teens-identity]",
    contentFormat: "worksheet",
    category: "Teens",
    title: "Who Are You When No One Is Watching?",
    audience: "student",
    theme: "Building biblical identity that holds when social pressure, comparison, and rejection hit hardest",
    prompt: "Write this for high schoolers. Use 1 Peter 2:9, Romans 12:2, and Galatians 1:10 as anchors. Start with a direct question: what changes about you depending on who you're around? Help the student identify social masks they wear, the fear underneath them, and what God's Word says about their worth. Include a short reflection on comparison and social media. End with one daily practice to hold identity steady. Keep language direct, non-preachy, and honest about how hard this actually is.",
    preview: "A teen worksheet on the social masks we wear, the fear underneath them, and the one truth that holds when everything else shifts.",
    level: "beginner",
    duration: "35 minutes"
  },
  {
    id: "teens_anger_family_conflict",
    token: "[template-teens-anger]",
    contentFormat: "worksheet",
    category: "Teens",
    title: "Anger at Home: How to Fight Without Destroying",
    audience: "student",
    theme: "Understanding anger, managing conflict with family, and learning to speak truth without escalating",
    prompt: "Write for teenagers navigating conflict with parents or siblings. Use Ephesians 4:26-27, James 1:19-20, and Proverbs 15:1 as anchors. Help the student understand what their anger is protecting, the difference between righteous anger and reactive anger, and one practical communication skill (pausing before speaking, naming the feeling not the attack). Include a real-scenario exercise. Keep tone non-condescending. Acknowledge that sometimes home situations are genuinely unfair.",
    preview: "A practical teen worksheet on anger, family conflict, and how to say what's true without making things worse.",
    level: "beginner",
    duration: "35 minutes"
  },
  // ── Marriage ─────────────────────────────────────────────────────────────
  {
    id: "marriage_communication_repair",
    token: "[template-marriage]",
    contentFormat: "workbook",
    category: "Marriage",
    title: "Communication Repair in Marriage",
    audience: "teacher",
    theme: "Rebuilding honest, safe communication after cycles of conflict, silence, or emotional withdrawal",
    prompt: "Ground this in Ephesians 4:15, 29, James 1:19, and 1 Peter 3:7. Build a structured couple workbook: (1) identify the specific communication breakdown pattern (stonewalling, criticism, contempt, defensiveness), (2) understand the fear or wound underneath each partner's response, (3) practice one de-escalation tool (time-out with return commitment), (4) write one repair statement each partner will use this week. Include separate reflection space for each spouse before a joint discussion. Session flow: 60 min with 15-min individual reading + 45-min guided discussion.",
    preview: "A structured couple workbook to identify communication breakdown patterns and practice one specific repair this week.",
    level: "intermediate",
    duration: "60 minutes"
  },
  {
    id: "marriage_intimacy_distance",
    token: "[template-marriage-intimacy]",
    contentFormat: "workbook",
    category: "Marriage",
    title: "Emotional Distance in Marriage",
    audience: "teacher",
    theme: "Understanding and closing emotional distance — when spouses feel like roommates more than partners",
    prompt: "Use Song of Solomon 5:1-6, 1 Corinthians 13:4-7, and Ephesians 5:25-33. Help the couple name the emotional distance honestly without shame. Identify the season when distance grew and what fear or hurt is underneath it. Guide each spouse to name one thing they have withheld (emotionally, physically, spiritually) and one invitation they can extend this week. Avoid prescriptive gender roles. Include a 10-minute daily reconnection practice. End with a shared commitment prayer.",
    preview: "A gentle, honest couple workbook for naming emotional distance and building one real reconnection practice together.",
    level: "intermediate",
    duration: "60 minutes"
  },
  // ── Family ───────────────────────────────────────────────────────────────
  {
    id: "parenting_grace_discipline",
    token: "[template-parenting]",
    contentFormat: "workbook",
    category: "Family",
    title: "Parenting with Grace and Boundaries",
    audience: "teacher",
    theme: "How to set firm, loving limits without fear-based parenting or permissive avoidance",
    prompt: "Ground this in Proverbs 22:6, Ephesians 6:4, Deuteronomy 6:6-7, and Hebrews 12:10-11. Help parents identify their default discipline style (punitive, permissive, or authoritative) and the fear underneath it. Teach the difference between consequences that teach and punishment that shames. Include a practical framework: connect first, then correct, then coach. Session exercise: parents write one real scenario and apply the framework. Weekly practice: one family conversation about a household value.",
    preview: "A workbook for parents learning to lead with both grace and limits — connect first, then correct, then coach.",
    level: "intermediate",
    duration: "55 minutes"
  },
  // ── Prayer & Devotion ────────────────────────────────────────────────────
  {
    id: "prayer_dry_seasons",
    token: "[template-prayer]",
    contentFormat: "workbook",
    category: "Prayer & Devotion",
    title: "Prayer When God Feels Silent",
    audience: "student",
    theme: "Sustaining prayer through seasons of spiritual dryness, doubt, or unanswered petitions",
    prompt: "Anchor this in Psalm 13, Luke 18:1-8, and Romans 8:26-27. Normalize spiritual dryness as a common and biblical experience. Help the student name what prayer feels like right now (rote, hopeless, one-sided, afraid). Teach three forms of honest prayer: lament, intercession, and waiting. Include a 7-day structured prayer plan with one short daily exercise. Do not offer easy answers. Acknowledge that some prayers go unanswered and that Scripture itself asks hard questions of God.",
    preview: "A workbook for dry seasons — honest about unanswered prayer, grounded in the psalms of lament, with a 7-day prayer plan.",
    level: "beginner",
    duration: "45 minutes"
  },
  // ── Community & Church ───────────────────────────────────────────────────
  {
    id: "loneliness_belonging_community",
    token: "[template-community]",
    contentFormat: "workbook",
    category: "Community",
    title: "Loneliness and the Body of Christ",
    audience: "student",
    theme: "Understanding loneliness biblically and taking one real step toward belonging in Christian community",
    prompt: "Use Psalm 68:6, Acts 2:42-47, and 1 Corinthians 12:21-26 as anchors. Start by naming what loneliness actually feels like — invisible, unnecessary, too different. Distinguish surface belonging (attendance) from deep belonging (known and knowing others). Help the student identify the specific fear keeping them from deeper connection (rejection, burden, vulnerability). End with one concrete relational risk this week. Include a reflection on what the church is supposed to be vs. what it often feels like.",
    preview: "An honest workbook on loneliness — what keeps us from real belonging, and one concrete step toward finding it.",
    level: "beginner",
    duration: "45 minutes"
  },
  // ── Leadership & Ministry ────────────────────────────────────────────────
  {
    id: "leader_burnout_calling",
    token: "[template-leader]",
    contentFormat: "workbook",
    category: "Leadership",
    title: "Ministry Burnout and the Renewal of Calling",
    audience: "teacher",
    theme: "Recovering from ministry exhaustion, reconnecting with calling, and establishing sustainable rhythms of rest and service",
    prompt: "Ground this in 1 Kings 19:1-18 (Elijah's burnout), Matthew 11:28-30, and Mark 6:31. This is for pastors, small group leaders, volunteers in ministry — anyone running on empty. Help the leader name honestly what they have given, what they have lost, and what fear keeps them from stopping. Distinguish healthy sacrifice from unsustainable performance. Include a sabbath rhythm audit and one boundary to establish this month. End with a reflection on God's care for the exhausted servant — not more productivity, but rest.",
    preview: "A workbook for burnt-out leaders — name what you've lost, audit your rhythms, and establish one boundary this month.",
    level: "intermediate",
    duration: "55 minutes"
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
    const coachParts = [
      input.lessonContext ? `Lesson context: ${input.lessonContext}.` : "",
      input.desiredOutcome ? `Desired spiritual outcome: ${input.desiredOutcome}.` : "",
      input.anchorScriptures ? `Please include these anchor Scriptures: ${input.anchorScriptures}.` : "",
      input.customQuestions.length ? `Also address these questions: ${input.customQuestions.join(" | ")}.` : "",
      input.sensitivities ? `Pastoral note: ${input.sensitivities}.` : ""
    ].filter(Boolean).join(" ");

    // Berean Scholar question (for citations/sources — conserves daily rate limit: 20/day/IP)
    const bereanQuestion = [
      preset?.prompt ||
        `What Bible passages and scholarly sources are most relevant to "${effectiveTheme}"? List key scriptures and their context.`,
      coachParts
    ].filter(Boolean).join(" ");

    const localFallback = buildLocalFallbackResponses({
      audience: input.audience,
      theme: effectiveTheme,
      level: input.level,
      contentFormat: effectiveFormat,
      intent: input.intent
    });

    // Run Qwen (content generation) and Berean (citations) in parallel
    let qwenResult = null;
    let bereanData = null;
    let qwenWarning = null;
    let bereanWarning = null;

    // Qwen with one retry if quality score < 65
    async function generateWithRetry(params) {
      const result = await generateStudyContent(params);
      const { score, issues } = scoreContent(result.content);
      if (score >= 65) {
        return { ...result, qualityScore: score, qualityIssues: issues, retried: false };
      }
      const retryParams = {
        ...params,
        lessonContext: [
          params.lessonContext,
          `Important: previous attempt scored ${score}/100. Issues: ${issues.join("; ")}. Please focus on second-person voice and including at least 5 scripture references.`
        ].filter(Boolean).join(" ")
      };
      const retryResult = await generateStudyContent(retryParams);
      const retry = scoreContent(retryResult.content);
      return { ...retryResult, qualityScore: retry.score, qualityIssues: retry.issues, retried: true };
    }

    const [qwenOutcome, bereanOutcome] = await Promise.allSettled([
      generateWithRetry({
        theme: effectiveTheme,
        format: effectiveFormat,
        audience: input.audience,
        level: input.level,
        duration: input.duration,
        lessonContext: input.lessonContext,
        desiredOutcome: input.desiredOutcome,
        anchorScriptures: input.anchorScriptures,
        customQuestions: input.customQuestions.length ? input.customQuestions.join(" | ") : "",
        sensitivities: input.sensitivities
      }),
      askBereanScholar(bereanQuestion)
    ]);

    if (qwenOutcome.status === "fulfilled") {
      qwenResult = qwenOutcome.value;
    } else {
      qwenWarning = `Qwen generation fallback: ${String(qwenOutcome.reason?.message || "unknown error")}`;
    }

    if (bereanOutcome.status === "fulfilled") {
      bereanData = bereanOutcome.value;
    } else {
      bereanWarning = `Berean citation fallback: ${String(bereanOutcome.reason?.message || "unknown error")}`;
    }

    // scholarData: use Qwen content as the answer (rich LLM content),
    // but keep Berean sources for traceability. Fallback to localFallback if both fail.
    const scholarData = {
      answer: qwenResult?.content || localFallback.scholar?.answer || "No content generated.",
      sources: bereanData?.sources || [],
      model: qwenResult ? `Qwen3 + Berean (citations)` : "local-fallback",
      elapsed_ms: qwenResult?.elapsed_ms || null,
      sources_count: bereanData?.sources_count || 0
    };

    const pastoralData = localFallback.pastoral;

    const warning = [qwenWarning, bereanWarning].filter(Boolean).join("; ") || null;
    const mode = qwenResult ? (bereanData ? "qwen+berean" : "qwen-only") : "hybrid";

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
      bereanAnswer: bereanData?.answer || "",
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
        sourcesCount: scholarData?.sources_count || 0,
        qualityScore: qwenResult?.qualityScore ?? null,
        qualityIssues: qwenResult?.qualityIssues ?? [],
        retried: qwenResult?.retried ?? false
      },
      provenance: {
        presetId: preset?.id || input.presetId || null,
        mode,
        steps: [
          "Input normalized locally",
          "Qwen3-30B-A3B (TotalGPT) generated study content",
          "BEREAN /api/v1/scholar provided biblical citations (rate limit: 20/day/IP)",
          "Workbook composed from Qwen content with Berean sources",
          "Sources filtered and attached for Berean traceability"
        ],
        prompts: {
          scholar: bereanQuestion
        },
        berean: {
          scholarModel: bereanData?.model || "unknown",
          scholarElapsedMs: bereanData?.elapsed_ms || null,
          scholarSourcesCount: bereanData?.sources_count || 0,
          sourceCollections
        },
        qwen: {
          model: qwenResult?.model || "Qwen-Qwen3-30B-A3B",
          elapsed_ms: qwenResult?.elapsed_ms || null,
          tokens: qwenResult?.tokens || null
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
