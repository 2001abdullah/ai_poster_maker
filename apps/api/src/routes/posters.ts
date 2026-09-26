import { Router } from "express";
import rateLimit from "express-rate-limit";
import { AuthRequest, requireAuth } from "../middleware/auth";
import { Poster, PosterDocument } from "../models/poster";
import { Template } from "../models/template";
import { UploadAsset } from "../models/upload-asset";
import { posterInputSchema } from "../schemas/poster";
import { renderPoster } from "../services/render-poster";
import { AssetStorage } from "../services/storage";
import { DesignSuggestion } from "../services/design-suggestion";

export function postersRouter(secret: string, storage: AssetStorage, suggestDesign?: (occasion: string) => Promise<DesignSuggestion | null>) {
  const router = Router();
  const generationLimit = rateLimit({ windowMs: 60 * 60 * 1000, limit: 10, standardHeaders: "draft-8", legacyHeaders: false, message: { error: "Generation limit reached. Try again later." } });
  router.use(requireAuth(secret));

  router.post("/", generationLimit, async (request: AuthRequest, response, next) => {
    let poster: PosterDocument | undefined;
    try {
      const input = posterInputSchema.safeParse(request.body);
      if (!input.success) return response.status(400).json({ error: "Invalid poster details", details: input.error.flatten() });
      const ownedPhotoCount = await UploadAsset.countDocuments({ userId: request.userId, key: { $in: input.data.photoKeys } });
      if (ownedPhotoCount !== new Set(input.data.photoKeys).size) return response.status(400).json({ error: "One or more photos are not available to this account" });
      const template = await Template.findOne({ slug: input.data.templateSlug, isActive: true });
      if (!template) return response.status(404).json({ error: "Template not found. Run npm run seed." });
      let designSuggestion: DesignSuggestion | null = null;
      if (suggestDesign) {
        try { designSuggestion = await suggestDesign(template.occasionType); } catch (error) { console.warn("Gemini design suggestion unavailable; using template defaults", error); }
      }
      poster = await Poster.create({ userId: request.userId, templateId: template._id, formData: input.data.formData, photoKeys: input.data.photoKeys, status: "generating", designSuggestion });
      const image = await renderPoster(input.data, storage, designSuggestion);
      const generatedAsset = await storage.save(image, "png");
      poster.generatedKey = generatedAsset.key;
      poster.status = "completed";
      await poster.save();
      return response.status(201).json({ poster: { id: String(poster._id), status: poster.status, generatedImageUrl: generatedAsset.url, createdAt: poster.createdAt } });
    } catch (error) {
      if (poster) {
        poster.status = "failed";
        poster.generationError = error instanceof Error ? error.message.slice(0, 300) : "Poster generation failed";
        await poster.save().catch(() => undefined);
      }
      return next(error);
    }
  });

  router.get("/", async (request: AuthRequest, response, next) => {
    try {
      const posters = await Poster.find({ userId: request.userId }).populate("templateId", "slug title occasionType").sort({ createdAt: -1 }).limit(100).lean();
      return response.json({ posters: posters.map((poster) => ({ ...poster, generatedImageUrl: poster.generatedKey ? `/api/v1/assets/${poster.generatedKey}` : null })) });
    } catch (error) { return next(error); }
  });

  router.get("/:id", async (request: AuthRequest, response, next) => {
    try {
      const poster = await Poster.findOne({ _id: request.params.id, userId: request.userId }).populate("templateId", "slug title occasionType").lean();
      if (!poster) return response.status(404).json({ error: "Poster not found" });
      return response.json({ poster: { ...poster, generatedImageUrl: poster.generatedKey ? `/api/v1/assets/${poster.generatedKey}` : null } });
    } catch (error) { return next(error); }
  });

  router.post("/:id/regenerate", generationLimit, async (request: AuthRequest, response, next) => {
    try {
      const poster = await Poster.findOne({ _id: request.params.id, userId: request.userId }).populate("templateId");
      if (!poster) return response.status(404).json({ error: "Poster not found" });
      if (poster.retryCount >= 2) return response.status(429).json({ error: "This poster has reached its regeneration limit" });
      const template = poster.templateId as unknown as { slug: "victory-day" | "tribute" | "campaign" };
      const input = { templateSlug: template.slug, formData: poster.formData, photoKeys: poster.photoKeys };
      const ownedPhotoCount = await UploadAsset.countDocuments({ userId: request.userId, key: { $in: poster.photoKeys } });
      if (ownedPhotoCount !== new Set(poster.photoKeys).size) return response.status(400).json({ error: "One or more photos are no longer available" });
      poster.status = "generating";
      poster.retryCount += 1;
      const image = await renderPoster(input, storage, poster.designSuggestion as DesignSuggestion | null);
      const asset = await storage.save(image, "png");
      if (poster.generatedKey) await storage.remove(poster.generatedKey);
      poster.generatedKey = asset.key;
      poster.status = "completed";
      poster.generationError = null;
      await poster.save();
      return response.json({ poster: { id: String(poster._id), status: poster.status, generatedImageUrl: asset.url } });
    } catch (error) { return next(error); }
  });

  router.delete("/:id", async (request: AuthRequest, response, next) => {
    try {
      const poster = await Poster.findOne({ _id: request.params.id, userId: request.userId }).select("generatedKey");
      if (!poster) return response.status(404).json({ error: "Poster not found" });
      await poster.deleteOne();
      if (poster.generatedKey) await storage.remove(poster.generatedKey);
      return response.status(204).end();
    } catch (error) { return next(error); }
  });
  return router;
}