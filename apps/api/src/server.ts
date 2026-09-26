import { createApp } from "./app";
import { connectDatabase } from "./config/database";
import { parseEnv } from "./config/env";
import { suggestDesign } from "./services/design-suggestion";
import { defaultTemplates, ensureDefaultTemplates } from "./services/seed-templates";
import { AssetStorage } from "./services/storage";

async function start() {
  const env = parseEnv();
  await connectDatabase(env.MONGODB_URI);
  await ensureDefaultTemplates();
  console.info(`Ensured ${defaultTemplates.length} templates`);
  const storage = new AssetStorage(env.STORAGE_DRIVER, {
    cloudName: env.CLOUDINARY_CLOUD_NAME ?? "",
    apiKey: env.CLOUDINARY_API_KEY ?? "",
    apiSecret: env.CLOUDINARY_API_SECRET ?? "",
  });
  const app = createApp({ jwtSecret: env.JWT_SECRET, jwtExpiresIn: env.JWT_EXPIRES_IN, webOrigin: env.WEB_ORIGIN, production: env.NODE_ENV === "production", storage, suggestDesign: (occasion) => suggestDesign(occasion, env) });
  const server = app.listen(env.API_PORT, () => console.info(`API listening on port ${env.API_PORT}`));
  const shutdown = () => server.close(() => process.exit(0));
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

start().catch((error: unknown) => {
  console.error("API startup failed", error);
  process.exit(1);
});
