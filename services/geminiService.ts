import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Theme, DEFAULT_THEME } from "../types";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';

const ai = new GoogleGenAI({ apiKey });

export const generateTheme = async (prompt: string): Promise<Theme> => {
  if (!apiKey) {
    console.warn("No API Key provided, returning default theme.");
    return DEFAULT_THEME;
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate a visual and physical theme for a 3D buckyball physics toy based on this concept: "${prompt}". 
      Return valid JSON matching the schema. 
      For physics: 
      - gravity: usually between -10 and 10 for y. 
      - bounciness: 0 to 1. 
      - linkStiffness: 100 to 2000 (higher is more rigid).
      - blastForce: 5 to 50.
      For colors: Hex codes.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            colors: {
              type: Type.OBJECT,
              properties: {
                node: { type: Type.STRING },
                link: { type: Type.STRING },
                background: { type: Type.STRING },
                glow: { type: Type.STRING },
              },
              required: ["node", "link", "background", "glow"],
            },
            physics: {
              type: Type.OBJECT,
              properties: {
                gravity: {
                  type: Type.ARRAY,
                  items: { type: Type.NUMBER },
                },
                bounciness: { type: Type.NUMBER },
                linkStiffness: { type: Type.NUMBER },
                blastForce: { type: Type.NUMBER },
              },
              required: ["gravity", "bounciness", "linkStiffness", "blastForce"],
            },
          },
          required: ["name", "colors", "physics"],
        } as Schema,
      },
    });

    if (response.text) {
      const data = JSON.parse(response.text);
      // Validate gravity array length
      if (data.physics.gravity.length !== 3) {
        data.physics.gravity = [0, -5, 0];
      }
      return data as Theme;
    }
    throw new Error("No text in response");
  } catch (error) {
    console.error("Theme generation failed:", error);
    return DEFAULT_THEME;
  }
};