import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { v2 as cloudinary } from "cloudinary";

export type StorageDriver = "local" | "cloudinary";
export type StoredAsset = { key: string; url: string };

export class AssetStorage {
  private readonly localRoot = path.resolve(process.cwd(), "storage", "uploads");

  constructor(private readonly driver: StorageDriver, cloudConfig?: { cloudName: string; apiKey: string; apiSecret: string }) {
    if (driver === "cloudinary" && cloudConfig) {
      cloudinary.config({ cloud_name: cloudConfig.cloudName, api_key: cloudConfig.apiKey, api_secret: cloudConfig.apiSecret, secure: true });
    }
  }

  async save(buffer: Buffer, extension: "png" | "jpg" | "webp"): Promise<StoredAsset> {
    const id = randomUUID();
    if (this.driver === "local") {
      await mkdir(this.localRoot, { recursive: true });
      const key = `${id}.${extension}`;
      await writeFile(path.join(this.localRoot, key), buffer, { flag: "wx" });
      return { key: id, url: `/api/v1/assets/${id}` };
    }
    await new Promise<void>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream({ folder: "poster-maker", public_id: id, resource_type: "image", type: "authenticated" }, (error, response) => {
        if (error || !response) return reject(error ?? new Error("Cloudinary upload failed"));
        resolve();
      });
      stream.end(buffer);
    });
    return { key: id, url: `/api/v1/assets/${id}` };
  }

  async load(key: string): Promise<Buffer> {
    if (!/^[a-f0-9-]{36}$/.test(key)) throw new Error("Invalid asset key");
    if (this.driver === "local") {
      for (const extension of ["png", "jpg", "webp"] as const) {
        try { return await readFile(path.join(this.localRoot, `${key}.${extension}`)); } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
        }
      }
      throw new Error("Asset not found");
    }
    const url = cloudinary.url(`poster-maker/${key}`, { secure: true, resource_type: "image", type: "authenticated", sign_url: true });
    const response = await fetch(url);
    if (!response.ok) throw new Error("Stored asset could not be loaded");
    return Buffer.from(await response.arrayBuffer());
  }

  async remove(key: string): Promise<void> {
    if (!/^[a-f0-9-]{36}$/.test(key)) return;
    if (this.driver === "local") {
      for (const extension of ["png", "jpg", "webp"] as const) {
        try { await unlink(path.join(this.localRoot, `${key}.${extension}`)); } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
        }
      }
      return;
    }
    await cloudinary.uploader.destroy(`poster-maker/${key}`, { resource_type: "image", type: "authenticated" });
  }
}