import { describe, expect, it } from "vitest";
import { defaultTemplates } from "./seed-templates";

describe("default templates", () => {
  it("contains the three active template slugs required by the editor", () => {
    expect(defaultTemplates.map((template) => template.slug)).toEqual(["victory-day", "tribute", "campaign"]);
    expect(defaultTemplates.every((template) => template.isActive)).toBe(true);
  });
});
