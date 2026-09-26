import { GoogleGenAI, Type } from "@google/genai";
import { z } from "zod";
import { AppEnv } from "../config/env";

const designSuggestionSchema = z.object({
  palette: z.array(z.string().regex(/^#[0-9a-fA-F]{6}$/)).min(2).max(3),
  decoration: z.enum(["rays", "floral", "paddy", "ribbon"]),
  photoArrangement: z.enum(["single", "balanced"]),
}).strict();
export type DesignSuggestion = z.infer<typeof designSuggestionSchema>;

export async function suggestDesign(occasion: string, env: AppEnv): Promise<DesignSuggestion | null> {
  if (!env.GEMINI_API_KEY) return null;
  const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  const response = await ai.models.generateContent({
    model: env.GEMINI_MODEL,
    contents: `Suggest only a restrained color palette and abstract decoration for a Bangladeshi ${occasion} poster. Do not produce text, slogans, political endorsements, or identity claims.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          palette: { type: Type.ARRAY, items: { type: Type.STRING }, minItems: 2, maxItems: 3 },
          decoration: { type: Type.STRING, enum: ["rays", "floral", "paddy", "ribbon"] },
          photoArrangement: { type: Type.STRING, enum: ["single", "balanced"] },
        },
        required: ["palette", "decoration", "photoArrangement"],
      },
    },
  });
  const parsed: unknown = JSON.parse(response.text ?? "null");
  const validated = designSuggestionSchema.safeParse(parsed);
  return validated.success ? validated.data : null;
}