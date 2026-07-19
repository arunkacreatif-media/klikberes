import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

// Load environment variables
dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
} else {
  console.warn("WARNING: GEMINI_API_KEY environment variable is not set.");
}

// Helper function for calling Gemini with automatic retries on rate limits or service unavailability (503/429)
async function generateContentWithRetry(
  aiClient: GoogleGenAI,
  params: {
    model: string;
    contents: string;
    config: any;
  },
  maxRetries = 2
) {
  let lastError: any = null;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await aiClient.models.generateContent(params);
    } catch (error: any) {
      lastError = error;
      const errorStr = String(error);
      const isTransient =
        error?.status === 503 ||
        error?.status === 429 ||
        errorStr.includes("503") ||
        errorStr.includes("429") ||
        errorStr.toLowerCase().includes("unavailable") ||
        errorStr.toLowerCase().includes("busy") ||
        errorStr.toLowerCase().includes("rate limit") ||
        errorStr.toLowerCase().includes("exhausted");

      if (isTransient && attempt < maxRetries) {
        console.warn(`Gemini API returned retryable error (attempt ${attempt}/${maxRetries}):`, error.message || errorStr);
        // Wait 1.5 seconds before retrying
        await new Promise((resolve) => setTimeout(resolve, 1500));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

// API endpoint for summarizing minutes
app.post("/api/notulensi-ai", async (req, res) => {
  try {
    const { namaKegiatan, acara, inputUser } = req.body;

    if (!inputUser || !inputUser.trim()) {
      return res.status(400).json({ error: "Catatan rapat mentah tidak boleh kosong." });
    }

    if (!ai) {
      // Graceful fallback if no API key is set
      return res.status(500).json({
        error: "Kunci API Gemini (GEMINI_API_KEY) belum dikonfigurasi di server. Silakan tambahkan kunci API di panel Secrets.",
      });
    }

    const prompt = `Ubah catatan rapat mentah berikut menjadi poin-poin Hasil Rapat yang formal dan terstruktur dalam Bahasa Indonesia baku.
Konteks Rapat:
Nama Rapat: ${namaKegiatan || "Rapat Desa"}
Acara: ${acara || "Koordinasi"}

Catatan mentah:
${inputUser}

Kembalikan HANYA dalam format JSON array sesuai dengan skema yang diminta, di mana setiap objek memiliki 'judul' (singkat, 3-6 kata) dan 'uraian' (1-2 kalimat detail).`;

    const modelConfig = {
      systemInstruction: "Anda adalah asisten administrasi desa yang profesional dan ahli dalam menyusun notulen rapat resmi pemerintahan desa dalam Bahasa Indonesia baku.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            judul: {
              type: Type.STRING,
              description: "Judul singkat poin hasil rapat (3-6 kata)",
            },
            uraian: {
              type: Type.STRING,
              description: "Uraian hasil rapat dalam 1-2 kalimat bahasa Indonesia baku",
            },
          },
          required: ["judul", "uraian"],
        },
      },
    };

    let response;
    const modelsToTry = [
      "gemini-2.5-flash",
      "gemini-1.5-flash",
      "gemini-2.5-pro",
      "gemini-3.5-flash"
    ];

    let lastError: any = null;
    for (const modelName of modelsToTry) {
      try {
        console.log(`Attempting to generate notulensi with model: ${modelName}`);
        response = await generateContentWithRetry(ai, {
          model: modelName,
          contents: prompt,
          config: modelConfig,
        }, 2);
        if (response) {
          break; // Successfully got response, break out of loop
        }
      } catch (err: any) {
        console.warn(`Model ${modelName} failed or was unavailable:`, err.message || String(err));
        lastError = err;
      }
    }

    if (!response) {
      throw new Error(
        `Seluruh model AI saat ini sedang mengalami lonjakan beban yang tinggi. Silakan coba kembali beberapa saat lagi.\nDetail: ${lastError?.message || String(lastError)}`
      );
    }

    const textOutput = response.text;
    if (!textOutput) {
      throw new Error("Tidak ada respon teks dari model Gemini.");
    }

    // Try parsing JSON response
    const parsedData = JSON.parse(textOutput.trim());
    return res.json({ success: true, data: parsedData });
  } catch (error: any) {
    console.error("Error calling Gemini API:", error);
    return res.status(500).json({
      error: "Gagal menyusun notulensi dengan AI: " + (error.message || String(error)),
    });
  }
});

// Setup Vite or static files
async function setupServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // Support React Router or SPA fallback
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || "development"} mode`);
  });
}

setupServer().catch((err) => {
  console.error("Failed to start server:", err);
});
