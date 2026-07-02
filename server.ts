import express, { Request, Response } from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Helper for lazy loading Google Gen AI SDK
let aiClient: GoogleGenAI | null = null;

function getAIClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not configured. Please add it via the secrets panel.");
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

// AI API endpoints

// 1. Generate study plan
app.post("/api/generate-study-plan", async (req: Request, res: Response) => {
  try {
    const { topic, difficulty, targetExamDate } = req.body;
    if (!topic) {
      return res.status(400).json({ error: "Topic is required" });
    }

    const ai = getAIClient();
    const prompt = `Create a structured study plan for the topic: "${topic}".
Difficulty level: ${difficulty || 'Intermediate'}.
${targetExamDate ? `Target completion date: ${targetExamDate}.` : ""}
Provide a clear timeline of 5 distinct days of study. Each day should have a specific theme and 2-3 focused study tasks. Each task needs a title, duration in minutes, and helpful short notes/tips.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            topic: { type: "STRING" },
            days: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  dayNumber: { type: "INTEGER" },
                  theme: { type: "STRING" },
                  tasks: {
                    type: "ARRAY",
                    items: {
                      type: "OBJECT",
                      properties: {
                        title: { type: "STRING" },
                        durationMinutes: { type: "INTEGER" },
                        notes: { type: "STRING" }
                      },
                      required: ["title", "durationMinutes", "notes"]
                    }
                  }
                },
                required: ["dayNumber", "theme", "tasks"]
              }
            }
          },
          required: ["topic", "days"]
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response content generated from Gemini.");
    }

    res.json(JSON.parse(text));
  } catch (error: any) {
    console.error("Error in generate-study-plan:", error);
    res.status(500).json({ error: error.message || "Failed to generate study plan" });
  }
});

// 2. Generate flashcards from a topic or text
app.post("/api/generate-flashcards", async (req: Request, res: Response) => {
  try {
    const { topic, notesText } = req.body;
    if (!topic && !notesText) {
      return res.status(400).json({ error: "Either topic or notes text must be provided" });
    }

    const ai = getAIClient();
    const inputContent = notesText ? `Notes content: "${notesText}"` : `Topic: "${topic}"`;
    const prompt = `Generate 8 high-quality study flashcards based on the following input:
${inputContent}

Each flashcard must contain:
- 'front': A concise, challenging question, term, or concept.
- 'back': A clear, accurate, and easy-to-understand explanation, answer, or definition.
Ensure that cards focus on the core educational concepts. Do not include meta text or markdown.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              front: { type: "STRING" },
              back: { type: "STRING" }
            },
            required: ["front", "back"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response content generated.");
    }

    res.json(JSON.parse(text));
  } catch (error: any) {
    console.error("Error in generate-flashcards:", error);
    res.status(500).json({ error: error.message || "Failed to generate flashcards" });
  }
});

// 3. Generate interactive quiz
app.post("/api/generate-quiz", async (req: Request, res: Response) => {
  try {
    const { topic, notesText, numQuestions = 5 } = req.body;
    if (!topic && !notesText) {
      return res.status(400).json({ error: "Either topic or notes text must be provided" });
    }

    const ai = getAIClient();
    const inputContent = notesText ? `Notes content: "${notesText}"` : `Topic: "${topic}"`;
    const prompt = `Generate an interactive multiple-choice quiz with ${numQuestions} questions based on:
${inputContent}

For each question, provide:
1. 'question': The question text.
2. 'options': Exactly 4 plausible options.
3. 'correctAnswerIndex': The 0-based index of the correct option (0 to 3).
4. 'explanation': A short, clear explanation of why that option is correct.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              question: { type: "STRING" },
              options: {
                type: "ARRAY",
                items: { type: "STRING" }
              },
              correctAnswerIndex: { type: "INTEGER" },
              explanation: { type: "STRING" }
            },
            required: ["question", "options", "correctAnswerIndex", "explanation"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response content generated.");
    }

    res.json(JSON.parse(text));
  } catch (error: any) {
    console.error("Error in generate-quiz:", error);
    res.status(500).json({ error: error.message || "Failed to generate quiz" });
  }
});

// 4. Topic Explainer (multi-mode)
app.post("/api/explain-topic", async (req: Request, res: Response) => {
  try {
    const { topic } = req.body;
    if (!topic) {
      return res.status(400).json({ error: "Topic to explain is required" });
    }

    const ai = getAIClient();
    const prompt = `Provide a comprehensive educational breakdown for the topic: "${topic}".
You must provide explanations at multiple depths:
1. 'simple': A simple, jargon-free explanation suitable for a child or absolute beginner.
2. 'analogy': A creative, memorable real-world analogy to help internalize the concept.
3. 'deep': A rigorous academic/technical deep dive explanation.
4. 'keyTakeaways': An array of 3 to 5 critical bullet points summarizing the essentials.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            simple: { type: "STRING" },
            analogy: { type: "STRING" },
            deep: { type: "STRING" },
            keyTakeaways: {
              type: "ARRAY",
              items: { type: "STRING" }
            }
          },
          required: ["simple", "analogy", "deep", "keyTakeaways"]
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response content generated.");
    }

    res.json(JSON.parse(text));
  } catch (error: any) {
    console.error("Error in explain-topic:", error);
    res.status(500).json({ error: error.message || "Failed to explain topic" });
  }
});

// 5. Chatbot general help
app.post("/api/chat", async (req: Request, res: Response) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Messages array is required" });
    }

    const ai = getAIClient();
    
    // Map custom messages format to Gemini contents parameter
    const geminiContents = messages.map((m: any) => ({
      role: m.sender === "user" ? "user" : "model",
      parts: [{ text: m.content }]
    }));

    // Append system instruction helper to focus on learning assistance
    const systemPrompt = "You are a helpful, encouraging academic study companion. Answer user questions with clear explanations, useful mnemonics, and practical learning tips. Keep formatting structured with markdown lists, bold text, or codeblocks if applicable.";

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: geminiContents,
      config: {
        systemInstruction: systemPrompt,
      }
    });

    const replyText = response.text || "I apologize, I wasn't able to generate a response. Please ask me another way!";
    res.json({ reply: replyText });
  } catch (error: any) {
    console.error("Error in chat:", error);
    res.status(500).json({ error: error.message || "Failed to fetch response" });
  }
});

// Integration with Vite development middleware or static production serve
async function setupServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Study Assistant Server running on http://0.0.0.0:${PORT}`);
  });
}

setupServer();
