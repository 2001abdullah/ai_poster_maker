import { Router } from "express";
import { Template } from "../models/template";

export const templatesRouter = Router();

templatesRouter.get("/", async (_request, response, next) => {
  try {
    const templates = await Template.find({ isActive: true }).select("slug title occasionType description palette").sort({ occasionType: 1, title: 1 }).lean();
    return response.json({ templates });
  } catch (error) { return next(error); }
});

templatesRouter.get("/:slug", async (request, response, next) => {
  try {
    const template = await Template.findOne({ slug: request.params.slug, isActive: true }).select("slug title occasionType description palette").lean();
    if (!template) return response.status(404).json({ error: "Template not found" });
    return response.json({ template });
  } catch (error) { return next(error); }
});