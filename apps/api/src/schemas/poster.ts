import { z } from "zod";

const textField = (max: number) => z.string().trim().max(max);

export const posterInputSchema = z.object({
  templateSlug: z.enum(["victory-day", "tribute", "campaign"]),
  formData: z.object({
    name: textField(80).min(1),
    designation: textField(80).default(""),
    organization: textField(100).default(""),
    location: textField(100).default(""),
    headline: textField(120).min(1),
  }).strict(),
  photoKeys: z.array(z.string().regex(/^[a-zA-Z0-9_-]{1,80}$/)).max(3).default([]),
}).strict();

export type PosterInput = z.infer<typeof posterInputSchema>;