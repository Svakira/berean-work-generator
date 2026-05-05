function uniquePassagesFromText(text) {
  if (!text) return [];
  const pattern = /\b([1-3]?\s?[A-Z][a-z]+\s\d{1,3}:\d{1,3}(?:-\d{1,3})?)\b/g;
  const matches = text.match(pattern) || [];
  return [...new Set(matches.map((m) => m.replace(/\s+/g, " ").trim()))].slice(0, 10);
}

function trimParagraphs(text, maxParagraphs = 2) {
  if (!text) return "";
  const chunks = String(text)
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  return chunks.slice(0, maxParagraphs).join("\n\n");
}

function cleanInline(text) {
  return String(text || "").replace(/\s+/g, " ").trim();
}

function uniqueOrdered(items, max = 10) {
  return [...new Set((items || []).filter(Boolean))].slice(0, max);
}

function uniqueSourcesByText(items, max = 5) {
  const seen = new Set();
  const result = [];

  for (const item of items || []) {
    if (!item) continue;
    const key = stripHtml(`${item.collection || ""}::${item.text || ""}`).toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
    if (result.length >= max) break;
  }

  return result;
}

function extractThemeKeywords(theme, teacherPlan = {}) {
  const stopwords = new Set([
    "about", "with", "from", "into", "your", "this", "that", "will", "what", "when", "where",
    "then", "they", "them", "their", "have", "been", "being", "through", "should", "would",
    "could", "bible", "study", "workbook", "worksheet", "biblical", "christian"
  ]);

  const raw = [
    theme,
    ...(teacherPlan?.sourceBooks || []),
    ...(teacherPlan?.reinforceTopics || [])
  ].join(" ");

  return uniqueOrdered(
    raw
      .toLowerCase()
      .match(/[a-z]{4,}/g)
      ?.filter((token) => !stopwords.has(token)) || [],
    12
  );
}

function explicitThemePassages(theme) {
  return uniquePassagesFromText(theme);
}

function sourceRelevanceScore(source, keywords, passages) {
  const haystack = stripHtml(`${source?.text || ""} ${source?.source || ""} ${source?.collection || ""}`).toLowerCase();
  let score = 0;

  if (source?.collection === "bible_texts") score += 2;
  if (source?.collection === "cross_references") score += 1;
  if (source?.collection === "derived_references") score += 2;
  if (passages.some((passage) => haystack.includes(passage.toLowerCase()))) score += 6;

  for (const keyword of keywords) {
    if (haystack.includes(keyword)) score += 1;
  }

  if (keywords.some((keyword) => ["marriage", "couples", "peacemaking", "gentleness", "communication"].includes(keyword))
    && /(marriage|husband|wife|wives|spouse|couple|love|respect|peace)/.test(haystack)) {
    score += 2;
  }

  if (keywords.some((keyword) => ["anxiety", "fear", "worry", "stress", "philippians"].includes(keyword))
    && /(anxious|anxiety|peace|philippians|worry|fear)/.test(haystack)) {
    score += 2;
  }

  return score;
}

function contentArtifactCount(sections) {
  return sections.reduce((count, section) => {
    const text = String(section?.content || "");
    return count
      + (/"[A-Z]/.test(text) ? 1 : 0)
      + (/"\(/.test(text) ? 1 : 0)
      + (/#{2,}\s*(Workbook|Academic|Key|Week|Lesson)/i.test(text) ? 1 : 0)
      + (/(Workbook:|Insights for Study|Week\s+\d+:)/i.test(text) ? 1 : 0);
  }, 0);
}

function stripTeachingBoilerplate(text) {
  return String(text || "")
    .replace(/\b[A-Z][A-Z\s:]{6,}\b/g, " ")
    .replace(/\bACADEMIC OVERVIEW\b/gi, " ")
    .replace(/\bKEY INSIGHTS FOR STUDY\b/gi, " ")
    .replace(/\bInsights for Study\b/gi, " ")
    .replace(/\bSCRIPTURE READING\b/gi, " ")
    .replace(/\bWORKBOOK SECTIONS\b.*$/i, " ")
    .replace(/\bWEEK\s+1:.*$/i, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function enumeratedInsights(text, count = 5) {
  const raw = String(text || "");
  const numberedMatches = [...raw.matchAll(/(?:^|\s)(\d+)\.\s+(.+?)(?=(?:\s+\d+\.\s+)|$)/g)];
  const insightMatches = [...raw.matchAll(/Insight\s*(\d+)[:.]\s+(.+?)(?=(?:\s+Insight\s*\d+[:.]\s+)|$)/gi)];
  const matches = insightMatches.length ? insightMatches : numberedMatches;
  return matches
    .map((match) => cleanInline(match[2]))
    .filter((item) => item.length > 20)
    .slice(0, count);
}

function sanitizeGeneratedText(text) {
  return String(text || "")
    .replace(/\r/g, "")
    .replace(/I appreciate your .*?\./gi, "")
    .replace(/What I can offer instead:.*?\./gi, "")
    .replace(/Note:\s*As a research tool[^.]*\./gi, "")
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/---+/g, "")
    .replace(/\s*"\s*/g, '"')
    .replace(/,"/g, ', "')
    .replace(/"\(/g, '" (')
    .replace(/([.!?])([A-Z])/g, "$1 $2")
    .replace(/([a-z])"([A-Z])/g, '$1" $2')
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeQuotes(text) {
  return String(text || "")
    .replace(/\s*"\s*/g, '"')
    .replace(/([a-zA-Z])"([a-zA-Z])/g, '$1 "$2')
    .replace(/([.!?])([A-Z])/g, '$1 $2')
    .trim();
}

function stripHtml(text) {
  return String(text || "")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function answerLines(count = 3) {
  return Array.from({ length: count })
    .map(() => "- [ ] Notes: ______________________________")
    .join("\n");
}

function sentenceBullets(text, count = 4) {
  const sentences = String(text || "")
    .replace(/[#*_`>\[\]]/g, "")
    .replace(/\s+/g, " ")
    .replace(/\s*"\s*/g, '"')
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, count);

  if (!sentences.length) {
    return "- No concise teaching notes were generated.";
  }

  return sentences.map((s) => `- ${s}`).join("\n");
}

function concisePastoralBullets(text, count = 3) {
  const blocked = /(biblical studies|scholarly|commentary|historical|research tool|framework|tradition|lexically|hermeneutics|discipleship track|workbook:|core insights)/i;
  const sentences = String(text || "")
    .replace(/[#*_`>\[\]]/g, "")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .filter((s) => !blocked.test(s))
    .map((s) => (s.length > 220 ? `${s.slice(0, 217).trim()}...` : s))
    .slice(0, count);

  if (!sentences.length) {
    return sentenceBullets(text, count);
  }

  return sentences.map((s) => `- ${s}`).join("\n");
}

function conciseParagraphs(text, count = 2) {
  const blocked = /(research tool|scholarly|commentary tradition|historical commentary|note:|discipleship track|workbook:|core insights)/i;
  const sentences = normalizeQuotes(text)
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((s) => !blocked.test(s))
    .slice(0, count);

  return sentences.join(" ");
}

function teachingPointBullets(text, count = 6) {
  const cleanedText = stripTeachingBoilerplate(text);
  const numbered = enumeratedInsights(cleanedText, count);
  if (numbered.length) {
    return numbered
      .map((line, idx) => `- **Teaching point ${idx + 1}:** ${line}`)
      .join("\n");
  }

  const candidates = cleanedText
    .split(/\n+/)
    .map((line) =>
      line
        .replace(/^[\-\*\d\.\s]+/, "")
        .replace(/[#*_`>\[\]]/g, "")
        .replace(/\s+/g, " ")
        .trim()
    )
    .filter((line) => line.length > 35)
    .filter((line) => !/^lesson|^section|^review$/i.test(line));

  if (!candidates.length) {
    return sentenceBullets(text, count);
  }

  return candidates
    .slice(0, count)
    .map((line, idx) => `- **Teaching point ${idx + 1}:** ${line}`)
    .join("\n");
}

function distilledTeachingBullets(text, count = 5) {
  const cleanedText = stripTeachingBoilerplate(text);
  const numbered = enumeratedInsights(cleanedText, count);
  if (numbered.length) {
    return numbered.map((line, idx) => `- **Teaching point ${idx + 1}:** ${line}`).join("\n");
  }

  const sentences = cleanedText
    .split(/(?<=[.!?])\s+/)
    .map((item) => cleanInline(item))
    .filter((item) => item.length > 40)
    .slice(0, count);

  if (!sentences.length) {
    return teachingPointBullets(cleanedText, count);
  }

  return sentences.map((line, idx) => `- **Teaching point ${idx + 1}:** ${line}`).join("\n");
}

function shortPassageBullets(passages, count = 6) {
  const cleaned = passages
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .slice(0, count);
  if (!cleaned.length) return "- No passages were auto-detected.";
  return cleaned.map((p) => `- ${p}`).join("\n");
}

function inferredPassageSources(passages) {
  return passages.slice(0, 5).map((passage) => ({
    tier: 1,
    collection: "derived_references",
    source: "Detected reference",
    tradition: "Parsed from BEREAN answer",
    text: passage
  }));
}

function practicalTools(theme, intent = {}) {
  const t = String(theme || "").toLowerCase();
  const reflectionFocus = String(intent?.reflectionFocus || "").toLowerCase();
  if (/(divorce|resentment|family conflict|parent|parents|mother|father|mom|dad|divided loyalty|choose sides)/.test(`${t} ${reflectionFocus}`)) {
    return [
      "- Name the emotion before reacting (hurt, anger, fear, shame).",
      "- Write down what responsibility belongs to you and what belongs to the adults around you.",
      "- Write one sentence of truth from Scripture for each emotion.",
      "- Use a 24-hour pause before sending any emotionally loaded message.",
      "- Pray for both parents without taking sides in your prayer language."
    ].join("\n");
  }

  if (/(anxiety|fear|worry|stress)/.test(t)) {
    return [
      "- Practice a 3-minute prayer reset (inhale: 'God is near', exhale: 'I release this').",
      "- List your top 3 worries and attach one verse to each.",
      "- Replace one doom-thought with one gratitude sentence.",
      "- End each day by writing one evidence of God's faithfulness."
    ].join("\n");
  }

  if (/(marriage|spouse|husband|wife|peacemaking|communication|gentleness|conflict)/.test(t)) {
    return [
      "- Begin hard conversations by naming one shared goal instead of one accusation.",
      "- Ask each spouse to restate the other's concern before responding.",
      "- Pray together before solving the disagreement, not only after it escalates.",
      "- End the week with one act of peace-building that is visible, practical, and specific."
    ].join("\n");
  }

  return [
    "- Read one short passage aloud.",
    "- Write one insight and one action.",
    "- Share one takeaway with a trusted person.",
    "- Close with a 2-minute prayer of surrender and trust."
  ].join("\n");
}

function worksheetPurpose(theme, audience) {
  return [
    `- Understand what Scripture says about ${cleanInline(theme)} and why it matters.`,
    `- Identify one spiritual truth to hold onto and act on this week.`,
    `- Take one concrete, real-world step — not just reflection, but obedience.`
  ].join("\n");
}

function firstSentence(text, fallback = "") {
  const match = String(text || "")
    .replace(/\s+/g, " ")
    .match(/.+?[.!?](?=\s|$)/);
  return (match ? match[0] : fallback || String(text || "")).trim();
}

function safeSummarySentence(theme, text, audience = "student", intent = {}) {
  if (intent?.pastoralAim) {
    const rawAim = cleanInline(intent.pastoralAim);
    const normalizedAim = rawAim
      .replace(/^help the student\s+/i, "")
      .replace(/^help the group\s+/i, "")
      .replace(/^to\s+/i, "");
    const aimSentence = audience === "teacher"
      ? `This study helps the group ${normalizedAim}.`
      : `This study helps the student ${normalizedAim}.`;
    return aimSentence.charAt(0).toUpperCase() + aimSentence.slice(1);
  }

  let sentence = firstSentence(text, "");
  if (sentence.includes('"')) {
    sentence = sentence.split('"')[0].trim();
  }
  sentence = sentence.replace(/[,:;\-\s]+$/g, "").trim();

  if (!sentence || sentence.length < 24) {
    return audience === "teacher"
      ? `Lead your group through ${cleanInline(theme)} with biblical clarity, gentleness, and practical next steps.`
      : `God meets ${cleanInline(theme)} with grace, truth, and a practical path of trust.`;
  }

  if (sentence.length > 170) {
    sentence = `${sentence.slice(0, 167).trimEnd()}.`;
  } else if (!/[.!?]$/.test(sentence)) {
    sentence = `${sentence}.`;
  }

  return sentence;
}

function worksheetQuestions(audience, theme) {
  if (audience === "teacher") {
    return [
      `What is the clearest spiritual need underneath the topic of ${theme}?`,
      "What single truth from Scripture should anchor the whole session?",
      "Where will the group struggle most to obey this in their daily lives?",
      "What one exercise can move this from conversation into real practice?"
    ];
  }

  return [
    `Looking back at this past week — where did ${theme} show up in your daily life?`,
    `What part of this topic feels most real or most difficult for you right now?`,
    "What truth from Scripture do you need to believe more fully this week?",
    "What fear, pressure, or lie is this study helping you confront?",
    "What is one real-world step you can take before the next time you study?"
  ];
}

function answerBlankLines(count = 4) {
  return Array.from({ length: count })
    .map(() => "____________________________________________________________")
    .join("\n");
}

function worksheetQuestionBlocks(questions) {
  return questions
    .map((q, idx) => `${idx + 1}. ${q}\n${answerBlankLines(4)}`)
    .join("\n\n");
}

function focusStatement(theme, pastoralAnswer, intent = {}) {
  const sentence = safeSummarySentence(theme, pastoralAnswer, "student", intent);
  return sentence || cleanInline(theme);
}

function teacherFocusStatement(theme, pastoralAnswer, intent = {}) {
  const sentence = safeSummarySentence(theme, pastoralAnswer, "teacher", intent);
  return sentence || `Lead your group through ${cleanInline(theme)} with biblical clarity and practical peace-building.`;
}

function themeVerse(passages, intent = {}) {
  return passages[0] || intent?.suggestedPassages?.[0] || "Philippians 4:8";
}

function firstPassages(passages) {
  const cleaned = passages.slice(0, 2);
  if (!cleaned.length) return "- Choose one short passage related to this theme and read it twice slowly.";
  return cleaned.map((p) => `- ${p}`).join("\n");
}

function buildQuestions(audience, theme, customQuestions = [], intent = {}) {
  if (Array.isArray(customQuestions) && customQuestions.length) {
    return customQuestions.slice(0, 6);
  }

  if (Array.isArray(intent?.questionAngles) && intent.questionAngles.length) {
    const primaryAngle = String(intent.questionAngles[0] || "this situation").replace(/^pressure to /i, "");
    const pressureQuestion = /^pressure to /i.test(String(intent.questionAngles[0] || ""))
      ? `Thinking about this past week — where did you feel the pressure to ${primaryAngle} most strongly?`
      : `Thinking about this past week — where did you feel the most pressure around ${primaryAngle}?`;
    if (audience === "teacher") {
      return [
        /^pressure to /i.test(String(intent.questionAngles[0] || ""))
          ? `Where does your group feel the pressure to ${primaryAngle} most strongly?`
          : `Where does your group feel the most pressure around ${primaryAngle}?`,
        `How can Scripture speak into ${intent.questionAngles[1]} with truth and tenderness?`,
        `What practice would strengthen ${intent.questionAngles[2]} and ${intent.questionAngles[3]} this week?`
      ];
    }

    return [
      pressureQuestion,
      "What guilt or responsibility are you carrying that may not actually belong to you?",
      "What would peaceful, truthful obedience look like in this situation this week?",
      "What healthy boundary or step forward would help you stay grounded and calm?"
    ];
  }

  const studentQuestions = [
    `Looking back at this past week — where did ${cleanInline(theme)} show up in your daily life?`,
    "Which verse or sentence in this study speaks most directly to your current situation?",
    "What fear, pressure, or false belief is this study helping you recognize and replace?",
    "What will you do differently in the real world this week because of what you read here?"
  ];

  const teacherQuestions = [
    `What is the clearest spiritual takeaway your group needs from this study on ${cleanInline(theme)}?`,
    "Where might your group struggle most to apply this teaching in real life?",
    "What concrete practice can move this lesson from discussion into lived obedience?"
  ];

  return audience === "teacher" ? teacherQuestions : studentQuestions;
}

function buildBereanReflectionPrompt(theme, audience, intent = {}) {
  const passages = Array.isArray(intent?.suggestedPassages) && intent.suggestedPassages.length
    ? intent.suggestedPassages.join(", ")
    : "a relevant Scripture passage";
  const focus = intent?.reflectionFocus || theme;

  return audience === "teacher"
    ? `I am preparing to guide a group through ${theme}. Help me reflect on ${focus}, identify what responsibility belongs to the people in the room and what does not, and shape peaceful, truthful questions and next steps using Scripture such as ${passages}.`
    : `I am reflecting on ${theme}. Help me examine ${focus}, understand what responsibility belongs to me and what does not, and learn how to respond peacefully and truthfully using Scripture such as ${passages}.`;
}

function shortReadingBullets(text) {
  return sentenceBullets(text, 2);
}

export function buildWorkbook({
  audience,
  contentFormat,
  title,
  theme,
  level,
  duration,
  lessonContext,
  customQuestions,
  teacherPlan,
  intent,
  scholarData,
  pastoralData
}) {
  const scholarAnswer = sanitizeGeneratedText(scholarData?.answer || "No academic response was returned.");
  const pastoralAnswer = sanitizeGeneratedText(pastoralData?.answer || "No pastoral summary was returned.");
  const requestedPassages = explicitThemePassages(theme);
  const passages = uniqueOrdered([
    ...requestedPassages,
    ...((Array.isArray(intent?.suggestedPassages) ? intent.suggestedPassages : [])),
    ...uniquePassagesFromText(`${scholarAnswer}\n${pastoralAnswer}`)
  ]);
  const rawSources = Array.isArray(scholarData?.sources) ? scholarData.sources : [];
  const keywords = extractThemeKeywords(theme, teacherPlan);
  const selectedSources = rawSources
    .filter((s) => ["bible_texts", "commentaries", "church_fathers", "cross_references"].includes(s.collection))
    .map((source) => ({ source, relevance: sourceRelevanceScore(source, keywords, passages) }))
    .sort((left, right) => right.relevance - left.relevance || Number(left.source.tier || 9) - Number(right.source.tier || 9))
    .filter((entry, index, entries) => entry.relevance > 0 || index < Math.min(3, entries.length))
    .slice(0, 5);
  const relevantSelectedSources = selectedSources.filter((entry) => entry.relevance > 0).map((entry) => entry.source);
  const displaySources = relevantSelectedSources.length >= 2
    ? selectedSources.map((entry) => entry.source)
    : uniqueSourcesByText([
        ...inferredPassageSources(passages),
        ...relevantSelectedSources
      ], 5);
  const passageList = shortPassageBullets(passages, 6);
  const format = contentFormat === "worksheet" ? "worksheet" : "workbook";

  const plan = teacherPlan || {
    workbookType: "session_worksheet",
    timeframe: "single_session",
    priorStudies: [],
    sourceBooks: [],
    reinforceTopics: [],
    annotations: "",
    improvementFocus: ""
  };

  const timelineGuide = {
    single_session: ["Session focus", "Discussion + activity", "Reflection + commitment"],
    "4_weeks": ["Week 1 foundation", "Week 2 healing", "Week 3 practice", "Week 4 review"],
    "8_weeks": ["Weeks 1-2 foundation", "Weeks 3-4 transformation", "Weeks 5-6 discipline", "Weeks 7-8 integration"],
    "3_months": ["Month 1 biblical foundations", "Month 2 emotional healing", "Month 3 mission and maturity"]
  };

  const hasTeacherContext =
    plan.priorStudies.length > 0
    || plan.sourceBooks.length > 0
    || plan.reinforceTopics.length > 0
    || Boolean(plan.annotations)
    || Boolean(plan.improvementFocus)
    || plan.workbookType !== "session_worksheet"
    || plan.timeframe !== "single_session";

  const teacherExtraSections =
    audience === "teacher" && hasTeacherContext
      ? [
          {
            type: "teacher_plan",
            title: "Teacher Plan",
            content: [
              `- Workbook type: ${plan.workbookType}`,
              `- Timeframe: ${plan.timeframe}`,
              `- Suggested structure: ${(timelineGuide[plan.timeframe] || timelineGuide.single_session).join(" -> ")}`,
              `- Primary books: ${plan.sourceBooks.length ? plan.sourceBooks.join(", ") : "Not specified"}`
            ].join("\n")
          },
          {
            type: "bridge",
            title: "Bridge From Prior Studies",
            content: [
              "- Prior studies completed:",
              `- ${plan.priorStudies.length ? plan.priorStudies.join("\n- ") : "No prior studies provided."}`,
              "- How to connect this new workbook:",
              "- Highlight continuity with previous lessons in your opening 5 minutes.",
              "- Ask 1 review question before introducing new material."
            ].join("\n")
          },
          {
            type: "reinforce",
            title: "Themes to Reinforce",
            content: [
              `- ${plan.reinforceTopics.length ? plan.reinforceTopics.join("\n- ") : "No reinforcement themes provided."}`,
              "- Add one repeated memory verse for each reinforcement theme.",
              "- Track progress with short verbal check-ins each week."
            ].join("\n")
          },
          {
            type: "notes",
            title: "Teacher Notes and Improvements",
            content: [
              `- Context notes: ${plan.annotations || "No special notes."}`,
              `- Improvement focus: ${plan.improvementFocus || "No improvement focus provided."}`,
              "- After session: write what worked, what confused students, and what to shorten next time."
            ].join("\n")
          }
        ]
      : [];

  const worksheetSections = [
    {
      type: "key_concept",
      title: "Key Concept",
      content: focusStatement(theme, pastoralAnswer, intent)
    },
    {
      type: "worksheet_intro",
      title: "Overview",
      content: [
        `This worksheet explores how Scripture speaks to ${cleanInline(theme)} from a spiritual and practical perspective.`,
        lessonContext ? `Lesson context: ${cleanInline(lessonContext)}.` : null,
        safeSummarySentence(theme, pastoralAnswer, audience, intent),
        `Main Scripture: ${themeVerse(passages, intent)}.`
      ].filter(Boolean).join(" ")
    },
    {
      type: "worksheet_goals",
      title: "What this worksheet will help the learner do",
      content: worksheetPurpose(theme, audience)
    },
    {
      type: "scripture_reading",
      title: "Read and mark",
      content: [
        `Read the following passage(s) slowly. Underline or circle words that stand out.`,
        "",
        passageList,
        "",
        `After reading: What word or phrase did you notice first?`,
        answerBlankLines(2)
      ].join("\n")
    },
    {
      type: "teaching_insight",
      title: "What Scripture teaches here",
      content: [
        sentenceBullets(scholarAnswer, 4)
      ].join("\n")
    },
    {
      type: "questions",
      title: audience === "teacher" ? "Leader reflection questions" : "Reflection questions",
      content: worksheetQuestionBlocks(buildQuestions(audience, theme, customQuestions, intent))
    },
    {
      type: "worksheet_action",
      title: "Real-world application",
      content: [
        "What will the learner practice in real life this week?",
        answerBlankLines(3),
        "",
        practicalTools(theme, intent)
      ].join("\n")
    },
    {
      type: "reflection",
      title: "Prayer and commitment",
      content: [
        "Lord, renew my mind, steady my heart, and help me live this truth in everyday life.",
        "",
        "My one step this week:",
        "- [ ] __________________________________________",
        "- [ ] __________________________________________"
      ].join("\n")
    },
    {
      type: "reflection_prompt",
      title: "Continue with Berean",
      content: buildBereanReflectionPrompt(theme, audience, intent)
    }
  ];

  const workbookSections = [
      {
        type: "focus",
        title: "Focus",
        content: teacherFocusStatement(theme, pastoralAnswer, intent)
      },
      {
        type: "anchor_verse",
        title: "Anchor Scripture",
        content: [
          firstPassages(passages),
          "",
          "Read this passage at least twice. The second time, read it aloud slowly.",
          "",
          "What word or phrase stands out?",
          answerBlankLines(1)
        ].join("\n")
      },
      {
        type: "reading",
        title: "Reading",
        content: [
          `The following is a biblical study of ${cleanInline(theme)}. Read it carefully and mark insights as you go.`,
          "",
          sanitizeGeneratedText(scholarAnswer)
        ].join("\n")
      },
      {
        type: "study_intro",
        title: "1. Why does this matter?",
        content: [
          "After reading — write your answer below:",
          answerBlankLines(2),
          "",
          safeSummarySentence(theme, pastoralAnswer, audience, intent)
        ].join("\n")
      },
      {
        type: "study",
        title: "2. What does Scripture reveal?",
        content: [
          "Based on the reading above, what did Scripture show you? Write 2–3 key points in your own words:",
          answerBlankLines(3),
          "",
          "Key insights from the reading:",
          distilledTeachingBullets(scholarAnswer, 4)
        ].join("\n")
      },
      {
        type: "retrospective",
        title: "3. Looking back — where has this been true in your life?",
        content: [
          `Reflect on the past week or month. Where did ${cleanInline(theme)} show up in your daily life?`,
          answerBlankLines(3),
          "",
          "What was your natural response — and what would a biblical response have looked like?",
          answerBlankLines(2)
        ].join("\n")
      },
      {
        type: "tools",
        title: "4. How can this be lived in the real world?",
        content: [
          "Write one area of your life where this applies right now:",
          answerBlankLines(2),
          "",
          practicalTools(theme, intent)
        ].join("\n")
      },
      {
        type: "questions",
        title: "Discussion and reflection questions",
        content: [
          ...buildQuestions(audience, theme, customQuestions, intent).map((q) => `- ${q}\n${answerBlankLines(2)}`)
        ].join("\n")
      },
      {
        type: "activity",
        title: "This week's practice",
        content: audience === "teacher"
          ? [
              "- Review the reading with your group and ask each member to share one thing they marked.",
              "- Ask one heart-level question before moving to application.",
              "- End with one practical group commitment and a closing prayer."
            ].join("\n")
          : [
              "- Re-read the anchor Scripture on three different days this week.",
              "- Write one change you need to make as a result of this study.",
              "- Share one takeaway with someone you trust.",
              answerBlankLines(2)
            ].join("\n")
      },
      {
        type: "reflection",
        title: "Review and commitment",
        content: [
          "Main truth from this study:",
          answerBlankLines(1),
          "What I will practice before the next session:",
          answerBlankLines(1),
          "Prayer: Lord, renew my mind, steady my heart, and help me live this truth in everyday life."
        ].join("\n")
      },
      {
        type: "reflection_prompt",
        title: "Continue with Berean",
        content: buildBereanReflectionPrompt(theme, audience, intent)
      },
      ...teacherExtraSections
    ];

  return {
    id: `wb_${Date.now()}`,
    meta: {
      title,
      audience,
      contentFormat: format,
      theme,
      level,
      duration,
      workbookType: plan.workbookType,
      timeframe: plan.timeframe,
      createdAt: new Date().toISOString()
    },
    sections: format === "worksheet" ? worksheetSections : workbookSections,
    sources: displaySources.map((s) => ({
      tier: s.tier,
      collection: s.collection,
      source: s.source,
      tradition: s.tradition || "N/A",
      text: stripHtml(String(s.text || "").slice(0, 400)).slice(0, 280)
    }))
  };
}

export function workbookToMarkdown(workbook) {
  const header = [
    `# ${workbook.meta.title}`,
    "",
    `> ${workbook.meta.theme} · ${workbook.meta.level} · ${workbook.meta.duration}`,
    ""
  ]
    .filter(Boolean)
    .join("\n");

  const sectionLines = workbook.sections
    .map((section) => `## ${section.title}\n\n${section.content}`)
    .join("\n\n");

  const sourceLines = workbook.sources.length
    ? workbook.sources
        .map(
          (s, i) =>
            `${i + 1}. [Tier ${s.tier}] ${s.source} (${s.tradition})\n   - ${s.text}`
        )
        .join("\n")
    : "No sources available.";

  return `${header}\n${sectionLines}\n\n## Sources\n\n${sourceLines}\n`;
}

export function evaluateWorkbookQuality(workbook) {
  const sections = Array.isArray(workbook?.sections) ? workbook.sections : [];
  const sectionTypes = new Set(sections.map((s) => s.type));
  const sources = Array.isArray(workbook?.sources) ? workbook.sources : [];
  const totalChars = sections.reduce((sum, s) => sum + String(s.content || "").length, 0);
  const avgSectionChars = sections.length ? totalChars / sections.length : 0;
  const format = workbook?.meta?.contentFormat === "worksheet" ? "worksheet" : "workbook";
  const artifacts = contentArtifactCount(sections);
  const themePassages = explicitThemePassages(workbook?.meta?.theme || "");
  const effectivePassages = themePassages.length ? themePassages : sources.map((source) => source.text).filter(Boolean);
  const themeKeywords = extractThemeKeywords(workbook?.meta?.theme || "");
  const relevantSources = sources.filter((source) => sourceRelevanceScore(source, themeKeywords, effectivePassages) >= 3).length;
  const genericFocus = sections.some((section) => section.type === "focus" && /^How this study helps with /i.test(String(section.content || "")));

  const teacherChecks = format === "worksheet"
    ? [
        sectionTypes.has("questions"),
        sectionTypes.has("worksheet_action"),
        sectionTypes.has("reflection"),
        avgSectionChars < 1200,
        artifacts === 0
      ]
    : [
        sectionTypes.has("teacher_plan"),
        sectionTypes.has("bridge"),
        sectionTypes.has("reinforce"),
        sectionTypes.has("notes"),
        artifacts === 0,
        !genericFocus
      ];

  const studentChecks = format === "worksheet"
    ? [
        sectionTypes.has("key_concept"),
        sectionTypes.has("worksheet_intro"),
        sectionTypes.has("scripture_reading"),
        sectionTypes.has("questions"),
        sectionTypes.has("worksheet_action"),
        artifacts === 0
      ]
    : [
        sectionTypes.has("focus"),
        sectionTypes.has("reading"),
        sectionTypes.has("study_intro"),
        sectionTypes.has("retrospective"),
        sectionTypes.has("questions"),
        sectionTypes.has("activity"),
        artifacts === 0
      ];

  const interestedChecks = format === "worksheet"
    ? [
        sectionTypes.has("key_concept"),
        sectionTypes.has("worksheet_goals"),
        sectionTypes.has("scripture_reading"),
        sectionTypes.has("questions"),
        avgSectionChars < 1400,
        artifacts === 0
      ]
    : [
        sectionTypes.has("focus"),
        sectionTypes.has("reading"),
        sectionTypes.has("questions"),
        avgSectionChars < 1600,
        artifacts === 0,
        !genericFocus
      ];

  const criticChecks = [
    sections.length >= (format === "worksheet" ? 7 : 9),
    sources.length >= 3,
    format === "worksheet" ? sectionTypes.has("scripture_reading") : sectionTypes.has("reading"),
    sectionTypes.has("questions"),
    relevantSources >= Math.min(2, sources.length),
    artifacts === 0
  ];

  function score(checks) {
    const passed = checks.filter(Boolean).length;
    return Math.round((passed / checks.length) * 100);
  }

  const byRole = {
    professor: score(teacherChecks),
    student: score(studentChecks),
    interested: score(interestedChecks),
    critic: score(criticChecks)
  };

  const feedback = [];
  if (byRole.professor < 75) feedback.push("Add stronger teacher planning scaffolding (plan/bridge/reinforce/notes).");
  if (byRole.student < 75) feedback.push("Increase interactive student guidance (quick read, practical tools, challenge).");
  if (byRole.interested < 75) feedback.push("Improve first-time clarity and shorten dense sections.");
  if (byRole.critic < 75) feedback.push("Increase source coverage and tighten structure consistency.");
  if (artifacts > 0) feedback.push("Clean formatting artifacts such as punctuation glitches, quote spacing, and heading leakage before scoring this workbook highly.");
  if (genericFocus) feedback.push("Replace generic workbook framing with a sharper theme-specific focus statement.");
  if (relevantSources < Math.min(2, sources.length)) feedback.push("Rank and prefer sources that directly match the requested passage or topic.");
  if (!feedback.length) feedback.push("Workbook quality is strong across all evaluation roles.");

  const overall = Math.round((byRole.professor + byRole.student + byRole.interested + byRole.critic) / 4);

  return {
    overall,
    byRole,
    metrics: {
      sectionCount: sections.length,
      sourceCount: sources.length,
      avgSectionChars: Math.round(avgSectionChars),
      relevantSources,
      artifacts
    },
    feedback
  };
}
