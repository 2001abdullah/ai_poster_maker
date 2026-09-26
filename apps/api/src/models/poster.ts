import { HydratedDocument, Model, Schema, model, models, Types } from "mongoose";

export type PosterRecord = {
  userId: Types.ObjectId;
  templateId: Types.ObjectId;
  formData: { name: string; designation: string; organization: string; location: string; headline: string };
  photoKeys: string[];
  generatedKey: string | null;
  status: "generating" | "completed" | "failed";
  retryCount: number;
  generationError: string | null;
  designSuggestion?: { palette: string[]; decoration: "rays" | "floral" | "paddy" | "ribbon"; photoArrangement: "single" | "balanced" } | null;
  createdAt: Date;
};
export type PosterDocument = HydratedDocument<PosterRecord>;

const posterSchema = new Schema<PosterRecord>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  templateId: { type: Schema.Types.ObjectId, ref: "Template", required: true },
  formData: {
    name: { type: String, required: true, maxlength: 80 },
    designation: { type: String, default: "", maxlength: 80 },
    organization: { type: String, default: "", maxlength: 100 },
    location: { type: String, default: "", maxlength: 100 },
    headline: { type: String, required: true, maxlength: 120 },
  },
  photoKeys: { type: [String], default: [], validate: [(keys: string[]) => keys.length <= 3, "At most 3 photos are allowed"] },
  generatedKey: { type: String, default: null },
  status: { type: String, enum: ["generating", "completed", "failed"], default: "generating", index: true },
  retryCount: { type: Number, default: 0, min: 0, max: 3 },
  generationError: { type: String, default: null, maxlength: 300 },
  designSuggestion: { type: Schema.Types.Mixed, default: null },
}, { timestamps: true, versionKey: false });

posterSchema.index({ userId: 1, createdAt: -1 });
export const Poster = (models.Poster as Model<PosterRecord> | undefined) ?? model<PosterRecord>("Poster", posterSchema);