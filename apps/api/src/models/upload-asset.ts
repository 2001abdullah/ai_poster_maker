import { Model, Schema, model, models, Types } from "mongoose";

export type UploadAssetRecord = { userId: Types.ObjectId; key: string; contentType: string; createdAt: Date };

const uploadAssetSchema = new Schema<UploadAssetRecord>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  key: { type: String, required: true, unique: true },
  contentType: { type: String, enum: ["image/jpeg", "image/png", "image/webp"], required: true },
}, { timestamps: true, versionKey: false });

export const UploadAsset = (models.UploadAsset as Model<UploadAssetRecord> | undefined) ?? model<UploadAssetRecord>("UploadAsset", uploadAssetSchema);