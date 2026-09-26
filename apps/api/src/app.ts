import cookieParser from "cookie-parser";
import cors from "cors";
import express, { ErrorRequestHandler } from "express";
import helmet from "helmet";
import { assetsRouter } from "./routes/assets";
import { authRouter } from "./routes/auth";
import { postersRouter } from "./routes/posters";
import { templatesRouter } from "./routes/templates";
import { uploadsRouter } from "./routes/uploads";
import { AssetStorage } from "./services/storage";
import { DesignSuggestion } from "./services/design-suggestion";

export type AppOptions = { jwtSecret: string; jwtExpiresIn: string; webOrigin: string; production: boolean; storage: AssetStorage; suggestDesign?: (occasion: string) => Promise<DesignSuggestion | null> };

export function createApp(options: AppOptions) {
  const app = express();
  app.disable("x-powered-by");
  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(cors({ origin: options.webOrigin, credentials: true }));
  app.use((request, response, next) => {
    const mutating = ["POST", "PUT", "PATCH", "DELETE"].includes(request.method);
    const origin = request.get("origin");
    if (mutating && origin && origin !== options.webOrigin) return response.status(403).json({ error: "Request origin is not allowed" });
    return next();
  });
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());
  app.get("/health", (_request, response) => response.json({ status: "ok" }));
  app.use("/api/v1/auth", authRouter(options.jwtSecret, options.jwtExpiresIn, options.production));
  app.use("/api/v1/assets", assetsRouter(options.jwtSecret, options.storage));
  app.use("/api/v1/templates", templatesRouter);
  app.use("/api/v1/uploads", uploadsRouter(options.jwtSecret, options.storage));
  app.use("/api/v1/posters", postersRouter(options.jwtSecret, options.storage, options.suggestDesign));
  app.use((_request, response) => response.status(404).json({ error: "Not found" }));
  const errors: ErrorRequestHandler = (error, _request, response, next) => {
    if (!error) return next();
    if (error instanceof SyntaxError && "body" in error) return response.status(400).json({ error: "Malformed JSON request" });
    if (error instanceof Error && error.name === "MulterError") return response.status(400).json({ error: "Upload rejected", message: error.message });
    console.error("Request failed", error);
    return response.status(500).json({ error: "Internal server error" });
  };
  app.use(errors);
  return app;
}