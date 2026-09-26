import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";

type BlueprintService = { name: string; runtime: string; plan: string; initialDeployHook?: string; envVars?: { key: string; value?: string }[] };

const blueprintPath = resolve(process.cwd(), "../../render.yaml");

describe("Render Blueprint", () => {
  it("defines the web and API services with production routing and template seeding", () => {
    const blueprint = parse(readFileSync(blueprintPath, "utf8")) as { services: BlueprintService[] };
    expect(blueprint.services).toHaveLength(2);
    const api = blueprint.services.find((service) => service.name === "poster-api");
    const web = blueprint.services.find((service) => service.name === "poster-press");
    expect(api).toMatchObject({ runtime: "docker", plan: "0.5c-512mb", initialDeployHook: "npm run seed --workspace @poster/api" });
    expect(web).toMatchObject({ runtime: "node", plan: "0.5c-512mb" });
    expect(web?.envVars).toContainEqual({ key: "NEXT_PUBLIC_API_URL", value: "/api/v1" });
    expect(web?.envVars).toContainEqual({ key: "API_ORIGIN", value: "https://poster-api.onrender.com" });
  });
});