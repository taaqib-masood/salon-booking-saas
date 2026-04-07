import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "http://localhost:11434/v1",
  apiKey: "ollama",
});

const SYSTEM_PROMPT =
  "You are a senior full-stack developer. Generate clean, production-ready Node.js, Express, and MongoDB code. Use ES modules (import/export). Follow best practices. Output ONLY code. No explanations, no comments beyond inline ones, no markdown fences.";

/**
 * Ask DeepSeek (via Ollama) to generate code for a step.
 * DeepSeek is the ONLY model allowed to generate code.
 * @param {string} step - Step description from Claude's plan
 * @param {string} filename - Target filename for context
 * @returns {Promise<string>}
 */
export async function askDeepSeek(step, filename = "") {
  const fileContext = filename
    ? `Generate code for file: ${filename}\nThis is part of a Node.js + Express + MongoDB backend using ES modules.\n\n`
    : "";

  const prompt = `${fileContext}${step}`;

  console.log("🚀 Calling DeepSeek...");
  console.log(`📌 Prompt: ${prompt}\n`);

  let response;
  try {
    response = await client.chat.completions.create({
      model: "deepseek-coder:33b",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
    });
  } catch (err) {
    console.error("❌ DeepSeek request failed:", err.message);
    console.error("⚠️  Make sure:");
    console.error("   - Ollama is running  (ollama serve)");
    console.error("   - Model is pulled    (ollama pull deepseek-coder:33b)");
    console.error("   - Port 11434 is open");
    throw err;
  }

  const content = response.choices[0]?.message?.content?.trim();
  if (!content) throw new Error("DeepSeek returned an empty response.");

  console.log("✅ DeepSeek response received\n");
  return content;
}
