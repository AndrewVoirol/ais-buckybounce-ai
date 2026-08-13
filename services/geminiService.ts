import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Theme, DEFAULT_THEME } from "../types";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';

const ai = new GoogleGenAI({ apiKey });

export const generateTheme = async (prompt: string): Promise<Theme> => {
  if (!apiKey) {
    console.warn("No API Key provided, returning customized fallback theme based on prompt.");
    return {
      ...DEFAULT_THEME,
      name: prompt.charAt(0).toUpperCase() + prompt.slice(1),
      lore: `Custom simulated environment derived from '${prompt}'.`
    };
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate a visual and physical scientific material configuration for a 3D fullerene & molecular physics simulation based on this concept: "${prompt}".
      Return valid JSON matching the schema.
      Physics guidelines:
      - gravity: 3-number array [gx, gy, gz], where gy is typically between -12 and +2.
      - bounciness: restitution between 0.2 (soft/damped) and 0.95 (super-elastic).
      - linkStiffness: Hooke's spring constant between 500 (flexible jelly) and 2500 (rigid crystal).
      - blastForce: shatter explosion velocity between 10 and 45.
      - damping: viscous damping between 0.1 and 0.8.
      - yieldStrength: breaking strain threshold between 1.5 and 4.0.
      - temperature: Kelvin temperature between 0 and 1000 K.
      - resonanceFreq: natural vibration frequency in Hz between 1.0 and 15.0 Hz.
      - lore: A short 1-2 sentence science-fiction or physical explanation of this material.
      Colors must be valid Hex codes (#rrggbb).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            lore: { type: Type.STRING },
            colors: {
              type: Type.OBJECT,
              properties: {
                node: { type: Type.STRING },
                link: { type: Type.STRING },
                background: { type: Type.STRING },
                glow: { type: Type.STRING },
                pentagon: { type: Type.STRING },
                hexagon: { type: Type.STRING },
                particle: { type: Type.STRING },
              },
              required: ["node", "link", "background", "glow", "pentagon", "hexagon", "particle"],
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
                damping: { type: Type.NUMBER },
                yieldStrength: { type: Type.NUMBER },
                temperature: { type: Type.NUMBER },
                resonanceFreq: { type: Type.NUMBER },
              },
              required: ["gravity", "bounciness", "linkStiffness", "blastForce", "damping", "yieldStrength", "temperature", "resonanceFreq"],
            },
          },
          required: ["name", "colors", "physics"],
        } as Schema,
      },
    });

    if (response.text) {
      const data = JSON.parse(response.text);
      if (!Array.isArray(data.physics.gravity) || data.physics.gravity.length !== 3) {
        data.physics.gravity = [0, -3, 0];
      }
      return data as Theme;
    }
    throw new Error("No text returned by AI");
  } catch (error) {
    console.error("Theme generation failed:", error);
    return {
      ...DEFAULT_THEME,
      name: prompt,
      lore: `Simulated state configured for '${prompt}'.`
    };
  }
};