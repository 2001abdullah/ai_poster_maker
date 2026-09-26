import { Template, TemplateRecord } from "../models/template";

export const defaultTemplates = [
  { slug: "victory-day", title: "বিজয়ের রং", occasionType: "victory", description: "জাতীয় দিবসের জন্য সবুজ-লাল উদযাপন", palette: { background: "#f7f2e7", accent: "#d83239", footer: "#176b4b" }, isActive: true },
  { slug: "tribute", title: "শ্রদ্ধার্ঘ্য", occasionType: "tribute", description: "শোক ও স্মরণে সংযত স্মারক বিন্যাস", palette: { background: "#eee8df", accent: "#657c60", footer: "#45604f" }, isActive: true },
  { slug: "campaign", title: "জনতার বার্তা", occasionType: "campaign", description: "জনসংযোগ ও নির্বাচনী প্রচারের পোস্টার", palette: { background: "#f5f0e7", accent: "#d13d3e", footer: "#176b4b" }, isActive: true },
] satisfies TemplateRecord[];

export async function ensureDefaultTemplates(): Promise<void> {
  await Promise.all(defaultTemplates.map((template) => Template.updateOne(
    { slug: template.slug },
    { $set: template },
    { upsert: true },
  )));
}
