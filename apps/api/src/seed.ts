import mongoose from "mongoose";
import { connectDatabase } from "./config/database";
import { parseEnv } from "./config/env";
import { defaultTemplates, ensureDefaultTemplates } from "./services/seed-templates";

async function seed() {
  const env = parseEnv();
  await connectDatabase(env.MONGODB_URI);
  await ensureDefaultTemplates();
  console.info(`Seeded ${defaultTemplates.length} templates`);
  await mongoose.disconnect();
}

seed().catch(async (error: unknown) => { console.error("Template seed failed", error); await mongoose.disconnect(); process.exit(1); });
