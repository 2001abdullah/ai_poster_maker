import { Model, Schema, model, models } from "mongoose";

export type TemplateRecord = {
  slug: string;
  title: string;
  occasionType: "victory" | "tribute" | "campaign";
  description: string;
  palette: { background?: string; accent?: string; footer?: string };
  isActive: boolean;
};

const templateSchema = new Schema<TemplateRecord>({
  slug: { type: String, required: true, unique: true, lowercase: true },
  title: { type: String, required: true, trim: true, maxlength: 100 },
  occasionType: { type: String, enum: ["victory", "tribute", "campaign"], required: true, index: true },
  description: { type: String, required: true, maxlength: 300 },
  palette: { background: String, accent: String, footer: String },
  isActive: { type: Boolean, default: true, index: true },
}, { timestamps: true, versionKey: false });

export const Template = (models.Template as Model<TemplateRecord> | undefined) ?? model<TemplateRecord>("Template", templateSchema);