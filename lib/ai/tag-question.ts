// ============================================================
// AskWomensAI — Auto-Tagging Pipeline
// lib/ai/tag-question.ts
//
// Called on every question submission.
// Uses Claude Haiku — fast and cheap (~$0.001/question).
// Populates topic_tags, primary_topic, life_stage, category,
// sentiment on every search_requests row.
//
// NEVER rename existing taxonomy tags — it breaks trend
// continuity across weeks in topic_trends.
// Add new tags at the bottom of each section only.
// ============================================================

import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export type QuestionTags = {
  topic_tags: string[];  // up to 5, from TOPIC_TAXONOMY only
  primary_topic: string;
  life_stage: LifeStage;
  category: Category;
  sentiment: Sentiment;
};

type LifeStage =
  | "teen"
  | "reproductive"
  | "perimenopause"
  | "menopause"
  | "postmenopause"
  | "unknown";

type Category =
  | "health"
  | "fitness"
  | "wellness"
  | "beauty"
  | "nutrition"
  | "mental_health"
  | "other";

type Sentiment = "concerned" | "curious" | "urgent" | "informational";

// ============================================================
// CANONICAL TOPIC TAXONOMY
// Stable identifiers — never rename, only append.
// ============================================================
export const TOPIC_TAXONOMY = [
  // hormones & cycles
  "PCOS",
  "endometriosis",
  "fibroids",
  "hormones",
  "thyroid",
  "adrenal",
  "insulin_resistance",
  "irregular_periods",
  "heavy_periods",
  "PMS",
  "PMDD",
  // fertility & pregnancy
  "fertility",
  "trying_to_conceive",
  "IVF",
  "miscarriage",
  "pregnancy",
  "postpartum",
  "breastfeeding",
  // perimenopause & menopause
  "perimenopause",
  "menopause",
  "hot_flashes",
  "HRT",
  "vaginal_dryness",
  "sleep_disruption",
  // birth control
  "birth_control",
  "IUD",
  "pill",
  "hormonal_contraception",
  // mental health
  "anxiety",
  "depression",
  "mood",
  "stress",
  "burnout",
  // nutrition & weight
  "weight_loss",
  "nutrition",
  "gut_health",
  "inflammation",
  "blood_sugar",
  "supplements",
  // fitness
  "exercise",
  "strength_training",
  "cardio",
  "recovery",
  // skin & beauty
  "acne",
  "hair_loss",
  "skin",
  "aging",
  // sexual health
  "libido",
  "sexual_health",
  "pelvic_floor",
  // general
  "fatigue",
  "sleep",
  "autoimmune",
  "bone_health",
  "heart_health",
  "cancer_screening",
  "lab_results",
  "medications",
] as const;

const TAGGING_PROMPT = `You are a women's health taxonomy classifier.
Extract structured metadata from a health question.

Respond ONLY with valid JSON. No explanation, no markdown, no backticks.

Taxonomy — use ONLY tags from this exact list:
${TOPIC_TAXONOMY.join(", ")}

Return this exact JSON shape:
{
  "topic_tags": string[],    // 1-5 most relevant tags from the taxonomy
  "primary_topic": string,   // single most relevant tag
  "life_stage": "teen" | "reproductive" | "perimenopause" | "menopause" | "postmenopause" | "unknown",
  "category": "health" | "fitness" | "wellness" | "beauty" | "nutrition" | "mental_health" | "other",
  "sentiment": "concerned" | "curious" | "urgent" | "informational"
}

Rules:
- Only use tags from the taxonomy list above
- Use "unknown" for life_stage when it cannot be inferred
- "urgent" = language suggesting immediate distress or serious symptoms
- "concerned" = worry without urgency
- Return valid JSON only — no other text`;

export async function tagQuestion(
  questionText: string
): Promise<QuestionTags> {
  const fallback: QuestionTags = {
    topic_tags: [],
    primary_topic: "other",
    life_stage: "unknown",
    category: "health",
    sentiment: "informational",
  };

  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 256,
      messages: [
        {
          role: "user",
          content: `${TAGGING_PROMPT}\n\nQuestion: ${questionText}`,
        },
      ],
    });

    const raw = response.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { type: "text"; text: string }).text)
      .join("");

    const parsed = JSON.parse(raw) as QuestionTags;

    // Sanitize: only allow known taxonomy tags
    const validTags = new Set(TOPIC_TAXONOMY as readonly string[]);
    parsed.topic_tags = parsed.topic_tags.filter((t) => validTags.has(t));
    if (!validTags.has(parsed.primary_topic)) {
      parsed.primary_topic = parsed.topic_tags[0] ?? "other";
    }

    return parsed;
  } catch (err) {
    // Tagging is best-effort — never block the main search flow
    console.error("[tagQuestion] failed, using fallback:", err);
    return fallback;
  }
}
