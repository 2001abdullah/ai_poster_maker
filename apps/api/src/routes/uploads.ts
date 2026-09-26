import { Router } from "express";
import multer from "multer";
import sharp from "sharp";
import { AuthRequest, requireAuth } from "../middleware/auth";
import { UploadAsset } from "../models/upload-asset";
import { AssetStorage } from "../services/storage";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024, files: 1 } });

export function uploadsRouter(secret: string, storage: AssetStorage) {
  const router = Router();
  router.post("/", requireAuth(secret), upload.single("photo"), async (request: AuthRequest, response, next) => {
    try {
      if (!request.file) return response.status(400).json({ error: "A photo file is required" });
      const metadata = await sharp(request.file.buffer, { limitInputPixels: 25_000_000 }).metadata();
      if (!metadata.format || !["jpeg", "png", "webp"].includes(metadata.format)) return response.status(415).json({ error: "Only JPEG, PNG, and WebP photos are allowed" });
      const normalized = await sharp(request.file.buffer, { limitInputPixels: 25_000_000 }).rotate().resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true }).toFormat(metadata.format === "jpeg" ? "jpeg" : metadata.format).toBuffer();
      const extension = metadata.format === "jpeg" ? "jpg" : metadata.format as "png" | "webp";
      const asset = await storage.save(normalized, extension);
      await UploadAsset.create({ userId: request.userId, key: asset.key, contentType: `image/${metadata.format}` });
      return response.status(201).json({ asset });
    } catch (error) { return next(error); }
  });
  return router;
}