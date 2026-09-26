import sharp from "sharp";
import { PosterInput } from "../schemas/poster";
import { DesignSuggestion } from "./design-suggestion";
import { AssetStorage } from "./storage";

const escapeXml = (value: string): string => value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[character]!);

export async function renderPoster(input: PosterInput, storage: AssetStorage, design?: DesignSuggestion | null): Promise<Buffer> {
  const width = 1600;
  const height = 2000;
  const photos = await Promise.all(input.photoKeys.map(async (key) => {
    const image = await sharp(await storage.load(key)).rotate().resize(560, 660, { fit: "cover" }).png().toBuffer();
    return `data:image/png;base64,${image.toString("base64")}`;
  }));
  const photoWidth = photos.length > 1 ? 250 : 330;
  const photoHeight = 330;
  const photoGap = 28;
  const photoStartX = (width - (photos.length * photoWidth + Math.max(0, photos.length - 1) * photoGap)) / 2;
  const photoMarkup = photos.map((photo, index) => {
    const x = photoStartX + index * (photoWidth + photoGap);
    return `<image href="${photo}" x="${x}" y="100" width="${photoWidth}" height="${photoHeight}" preserveAspectRatio="xMidYMid slice" clip-path="url(#photo${index})"/>`;
  }).join("");
  const data = input.formData;
  const background = design?.palette[0] ?? "#f8f2e4";
  const accent = design?.palette[1] ?? "#d83239";
  const footer = design?.palette[2] ?? "#176b4b";
  const decoration = design?.decoration === "floral"
    ? `<path d="M80 1080c120-130 100-190 40-225m1000 225c-120-130-100-190-40-225" fill="none" stroke="${accent}" stroke-width="8" opacity=".32"/><circle cx="120" cy="850" r="15" fill="${accent}" opacity=".5"/><circle cx="1080" cy="850" r="15" fill="${accent}" opacity=".5"/>`
    : design?.decoration === "ribbon"
      ? `<path d="M0 990h1200v40H0z" fill="${accent}" opacity=".22"/><path d="M0 1050h1200v12H0z" fill="${footer}" opacity=".35"/>`
      : design?.decoration === "paddy"
        ? `<path d="M60 1110q75-140 135-10m870 10q-75-140-135-10" fill="none" stroke="${footer}" stroke-width="9" opacity=".35"/>`
        : `<path d="M600 70v30m-180 45 24 24m336-24-24 24M300 350h44m512 0h44" stroke="${accent}" stroke-width="8" opacity=".28"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 1200 1500">
    <defs><linearGradient id="bg" x2=".8" y2="1"><stop stop-color="#f8f2e4"/><stop offset="1" stop-color="#dce8d5"/></linearGradient><clipPath id="photo0"><rect x="${photoStartX}" y="100" width="${photoWidth}" height="${photoHeight}" rx="130"/></clipPath><clipPath id="photo1"><rect x="${photoStartX + photoWidth + photoGap}" y="100" width="${photoWidth}" height="${photoHeight}" rx="130"/></clipPath><clipPath id="photo2"><rect x="${photoStartX + 2 * (photoWidth + photoGap)}" y="100" width="${photoWidth}" height="${photoHeight}" rx="130"/></clipPath></defs>
    <rect width="1200" height="1500" fill="${background}"/><rect width="1200" height="18" fill="${accent}"/><circle cx="600" cy="350" r="200" fill="${footer}" opacity=".1"/><circle cx="600" cy="350" r="95" fill="${accent}" opacity=".75"/>${decoration}${photoMarkup}
    <text x="600" y="660" text-anchor="middle" font-family="Noto Sans Bengali, sans-serif" font-size="31" font-weight="700" fill="#54715d">${escapeXml(input.templateSlug.replaceAll("-", " ").toUpperCase())} · ২০২৬</text>
    <text x="600" y="790" text-anchor="middle" font-family="Noto Sans Bengali, sans-serif" font-size="70" font-weight="700" fill="#173d30">${escapeXml(data.headline)}</text>
    <path d="M390 850h170m80 0h170" stroke="#bdaa75" stroke-width="2"/><path d="M600 838l12 12-12 12-12-12z" fill="#d6483d"/>
    <text x="600" y="915" text-anchor="middle" font-family="Noto Sans Bengali, sans-serif" font-size="32" fill="#506c58">স্বাধীনতার চেতনায় এগিয়ে চলি</text>
    <path d="M0 1190l60-14 60 14 60-14 60 14 60-14 60 14 60-14 60 14 60-14 60 14 60-14 60 14 60-14 60 14 60-14 60 14 60-14 60 14v310H0z" fill="${footer}"/>
    <text x="600" y="1320" text-anchor="middle" font-family="Noto Sans Bengali, sans-serif" font-size="48" font-weight="700" fill="#fffdf1">${escapeXml(data.name)}</text>
    <text x="600" y="1380" text-anchor="middle" font-family="Noto Sans Bengali, sans-serif" font-size="28" fill="#f7f3e8">${escapeXml([data.designation, data.organization].filter(Boolean).join(" · "))}</text>
    <text x="600" y="1440" text-anchor="middle" font-family="Noto Sans Bengali, sans-serif" font-size="22" fill="#e4ecdf">প্রচারে: ${escapeXml(data.name)} · ${escapeXml(data.location)}</text>
  </svg>`;
  return sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
}