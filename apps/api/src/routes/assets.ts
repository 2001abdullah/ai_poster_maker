import { Router } from "express";
import sharp from "sharp";
import { AuthRequest, requireAuth } from "../middleware/auth";
import { Poster } from "../models/poster";
import { UploadAsset } from "../models/upload-asset";
import { AssetStorage } from "../services/storage";

export function assetsRouter(secret: string, storage: AssetStorage) {
  const router = Router();
  router.get("/:key", requireAuth(secret), async (request: AuthRequest, response, next) => {
    try {
      const key = request.params.key;
      if (typeof key !== "string" || !/^[a-f0-9-]{36}$/.test(key)) return response.status(404).json({ error: "Asset not found" });
      const ownsUpload = await UploadAsset.exists({ key, userId: request.userId });
      const ownsPoster = await Poster.exists({ generatedKey: key, userId: request.userId });
      if (!ownsUpload && !ownsPoster) return response.status(404).json({ error: "Asset not found" });
      const buffer = await storage.load(key);
      const metadata = await sharp(buffer).metadata();
      response.setHeader("Cache-Control", "private, max-age=300");
      response.type(metadata.format === "jpeg" ? "jpg" : metadata.format ?? "png");
      return response.send(buffer);
    } catch (error) { return next(error); }
  });
  return router;
}