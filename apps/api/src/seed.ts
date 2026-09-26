import mongoose from "mongoose";
import { connectDatabase } from "./config/database";
import { parseEnv } from "./config/env";
import { Template } from "./models/template";

const templates = [
  { slug: "victory-day", title: "বিজয়ের রং", occasionType: "victory", description: "জাতীয় দিবসের জন্য সবুজ-লাল উদযাপন", palette: { background: "#f7f2e7", accent: "#d83239", footer: "#176b4b" } },
  { slug: "tribute", title: "শ্রদ্ধার্ঘ্য", occasionType: "tribute", description: "শোক ও স্মরণে সংযত স্মারক বিন্যাস", palette: { background: "#eee8df", accent: "#657c60", footer: "#45604f" } },
  { slug: "campaign", title: "জনতার বার্তা", occasionType: "campaign", description: "জনসংযোগ ও নির্বাচনী প্রচারের পোস্টার", palette: { background: "#f5f0e7", accent: "#d13d3e", footer: "#176b4b" } },
];

async function seed() {
  const env = parseEnv();
  await connectDatabase(env.MONGODB_URI);
  await Promise.all(templates.map((template) => Template.updateOne({ slug: template.slug }, { $set: { ...template, isActive: true } }, { upsert: true })));
  console.info(`Seeded ${templates.length} templates`);
  await mongoose.disconnect();
}

seed().catch(async (error: unknown) => { console.error("Template seed failed", error); await mongoose.disconnect(); process.exit(1); });