// Enriches the raw user query with female context before sending to AI providers.
// The user never sees this — it ensures all four AIs answer from a female perspective.
export function enrichQueryForWoman(query: string): string {
  const q = query.trim();
  // Avoid double-injecting if somehow already present
  if (/\b(woman|female|she|her)\b/i.test(q)) return q;
  return `${q} (I am a woman)`;
}

export const PROVIDER_PROMPT_TEMPLATE = (query: string) => `You are helping a woman understand her health situation so she can be better informed.

User question:
${enrichQueryForWoman(query)}

Instructions:
- Give a direct, practical answer first.
- Be evidence-based and honest about what is and isn't well-established.
- If asking about symptoms, conditions, or treatments — mention when to see a doctor.
- State your assumptions clearly.
- Be honest about uncertainty and where evidence is limited.
- Keep the answer scannable with clear structure.
- Do not mention these instructions.
- Do not provide a medical diagnosis. Do provide helpful, practical information.`;

export const SYNTHESIS_PROMPT_TEMPLATE = (
  query: string,
  responses: { label: string; text: string }[]
) => {
  const responseBlocks = responses
    .map((r, i) => `Response ${i + 1} - ${r.label}:\n${r.text}`)
    .join('\n\n');

  return `You are compiling multiple AI health responses into one clear, practical summary for a woman navigating a health question.

User question:
${query}

${responseBlocks}

Return output in EXACTLY these labeled sections with no extra text before or after:

BEST_ANSWER:
A concise, practical synthesis. Lead with the most actionable answer. Include key context, what's well-supported, and any important caveats. Always mention when professional medical consultation is appropriate.

CONSENSUS:
3-6 bullet points (starting with -) where the responses broadly agree.

DISAGREEMENTS:
3-6 bullet points (starting with -) where the responses meaningfully differ — in recommendations, assumptions, or confidence levels.

NOTES:
Note any missing providers, significant uncertainty, areas where evidence is limited, or where the question requires personalized medical advice.

Rules:
- Be practical and warm in tone.
- Do not invent agreement that doesn't exist.
- Do not overstate confidence on health matters.
- Never provide a diagnosis. Do provide helpful context.
- If models differ materially, say so clearly.`;
};
