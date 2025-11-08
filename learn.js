// ==============================
// 🤖 FLOWMIND NIGHTLY LEARNING JOB
// ==============================
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const OpenAI = require("openai");

dotenv.config();
const openai = new OpenAI({ apiKey: process.env.OPENAI_KEY });

const CONVO_DIR = path.join(__dirname, "data", "conversations");
const KNOW_PATH = path.join(__dirname, "data", "business_knowledge.json");
const LOG_PATH = path.join(__dirname, "data", "learning_log.txt");

// --- Load current knowledge ---
function loadKnowledge() {
  try {
    return JSON.parse(fs.readFileSync(KNOW_PATH, "utf-8"));
  } catch {
    return {
      company: { name: "FlowMind AI", tone: "Friendly" },
      faq: [],
      products: [],
      notes: "",
    };
  }
}

// --- Summarize conversations ---
async function summarizeConversations() {
  const files = fs.readdirSync(CONVO_DIR).filter((f) => f.endsWith(".json"));
  const summaries = [];

  for (const f of files) {
    const data = JSON.parse(fs.readFileSync(path.join(CONVO_DIR, f), "utf-8"));
    const text = data.messages.map((m) => `${m.role}: ${m.text}`).join("\n");

    const prompt = `
      Analyze this business conversation log.
      Identify new or recurring customer questions, needs, or key insights.
      Suggest new FAQs in JSON format:
      [{"question": "...", "answer": "..."}]
      Only include NEW or UNIQUE topics not already known.
      Conversation:
      ${text.slice(-6000)}
    `;

    try {
      const res = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a business AI summarizer." },
          { role: "user", content: prompt },
        ],
      });
      const reply = res.choices[0].message.content;
      summaries.push(reply);
    } catch (err) {
      console.error("❌ Summarization error:", err.message);
    }
  }

  return summaries.join("\n\n");
}

// --- Merge new FAQs into knowledge ---
async function learnAndSave() {
  const knowledge = loadKnowledge();
  console.log("📖 Current FAQ count:", (knowledge.faq || []).length);

  const summaryText = await summarizeConversations();
  console.log("📋 Extracted new conversation insights...");

  const parsePrompt = `
    Merge these new FAQs into the existing list.
    Avoid duplicates by matching similar questions.
    Return valid JSON array only.
    Current FAQs: ${JSON.stringify(knowledge.faq || [])}
    New data: ${summaryText}
  `;

  try {
    const merge = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a JSON merging engine." },
        { role: "user", content: parsePrompt },
      ],
    });

    // --- Sanitize JSON output ---
    let raw = merge.choices[0].message.content.trim();
    raw = raw.replace(/```json/gi, "").replace(/```/g, "").trim();

    let mergedFaq = [];
    try {
      mergedFaq = JSON.parse(raw);
    } catch (e) {
      console.error("⚠️ Could not parse JSON. Raw output:", raw);
      return;
    }

    // --- Update knowledge base ---
    const beforeCount = (knowledge.faq || []).length;
    knowledge.faq = mergedFaq;
    fs.writeFileSync(KNOW_PATH, JSON.stringify(knowledge, null, 2));

    // --- Log the learning update ---
    const log = `
[${new Date().toLocaleString()}]
Learned from ${fs.readdirSync(CONVO_DIR).length} conversation(s)
Old FAQs: ${beforeCount} → New FAQs: ${mergedFaq.length}
-------------------------------------------------------
${summaryText.slice(0, 1000)}...
=======================================================

`;
    fs.appendFileSync(LOG_PATH, log);

    console.log("✅ Knowledge base updated successfully!");
  } catch (err) {
    console.error("❌ Merge error:", err.message);
  }
}

learnAndSave();
