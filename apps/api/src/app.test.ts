import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "./app";
import { AssetStorage } from "./services/storage";

const app = createApp({ jwtSecret: "test-secret-that-is-at-least-thirty-two-characters", jwtExpiresIn: "1h", webOrigin: "http://localhost:3000", production: false, storage: new AssetStorage("local") });

describe("API baseline", () => {
  it("reports health without touching MongoDB", async () => {
    const response = await request(app).get("/health");
    expect(response.status).toBe(200);
    expect(response.body.status).toBe("ok");
  });

  it("protects uploads and poster history behind authentication", async () => {
    expect((await request(app).post("/api/v1/uploads")).status).toBe(401);
    expect((await request(app).get("/api/v1/posters")).status).toBe(401);
    expect((await request(app).get("/api/v1/assets/asset-key")).status).toBe(401);
  });

  it("rejects cross-origin browser mutations", async () => {
    const response = await request(app).post("/api/v1/auth/logout").set("Origin", "https://untrusted.example");
    expect(response.status).toBe(403);
  });
});