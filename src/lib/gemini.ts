import { GoogleGenAI } from '@google/genai';
import { ProjectFile } from '../types';

let ai: GoogleGenAI | null = null;

export function setApiKey(key: string) {
  if (key) {
    localStorage.setItem('USER_GEMINI_API_KEY', key);
  } else {
    localStorage.removeItem('USER_GEMINI_API_KEY');
  }
  ai = null; // force re-init
}

export function hasApiKey(): boolean {
  return !!(localStorage.getItem('USER_GEMINI_API_KEY') || import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY);
}

function getAi() {
  if (!ai) {
    // Safely access API key. For Vite client code, VITE_ prefixed env vars are available.
    // We also check process.env for Node setup.
    const apiKey = localStorage.getItem('USER_GEMINI_API_KEY') || import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY_MISSING");
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
}

export async function sendMessage(
  prompt: string,
  images: { mimeType: string; data: string }[],
  contextFiles: ProjectFile[] | null
): Promise<string> {
  const aiInstance = getAi();
  
  let systemInstruction = "You are Codexa AI, a highly capable coding assistant supporting more than 30 programming languages. If anyone asks who made you or created you, cheerfully answer that you were made by Swastik Rasal. If anyone asks how to run or preview this code, say that the running and previewing tool is coming soon in a new update.";
  let fullPrompt = prompt || '';

  if (contextFiles && contextFiles.length > 0) {
    const contextText = contextFiles.map(f => `--- ${f.name} ---\n${f.content}\n`).join('\n');
    fullPrompt = `[Context from current workspace files]\n${contextText}\n\nUser Message:\n${prompt}`;
  }

  const parts: any[] = [];
  if (fullPrompt) {
    parts.push(fullPrompt);
  }
  
  for (const img of images) {
    parts.push({
      inlineData: {
        mimeType: img.mimeType,
        data: img.data /* base64 without data URL scheme prefix */
      }
    });
  }

  try {
    const response = await aiInstance.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: parts,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction,
      }
    });
    return response.text || 'No response generated.';
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    if (error.message === "GEMINI_API_KEY_MISSING") {
      throw error;
    }
    throw new Error(error.message || "An error occurred during AI generation.");
  }
}

