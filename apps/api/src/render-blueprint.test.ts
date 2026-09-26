import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";

type BlueprintService = { name: string; runtime: string; plan: string; initialDeployHook?: string; envVars?: { key: string; value?: string; sync?: boolean }[] };

const blueprintPath = resolve(process.cwd(), "../../render.yaml");

describe("Render Blueprint", () => {
  it("defines a free API service with template seeding", () => {
    const blueprint = parse(readFileSync(blueprintPath, "utf8")) as { services: BlueprintService[] };
    expect(blueprint.services).toHaveLength(1);
    const api = blueprint.services.find((service) => service.name === "poster-api");
    expect(api).toMatchObject({ runtime: "docker", plan: "free", initialDeployHook: "npm run seed --workspace @poster/api" });
    expect(api?.envVars).toContainEqual({ key: "WEB_ORIGIN", sync: false });
  });
});
