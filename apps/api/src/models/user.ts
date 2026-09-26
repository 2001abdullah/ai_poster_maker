import { Model, Schema, model, models } from "mongoose";

export type UserRecord = { name: string; email: string; passwordHash: string; role: "user" | "admin" };

const userSchema = new Schema<UserRecord>({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ["user", "admin"], default: "user", immutable: true },
}, { timestamps: true, versionKey: false });

export const User = (models.User as Model<UserRecord> | undefined) ?? model<UserRecord>("User", userSchema);