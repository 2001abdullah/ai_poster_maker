import { describe, expect, it } from "vitest";
import { posterInputSchema } from "./poster";

describe("posterInputSchema", () => {
  const validInput = {
    templateSlug: "victory-day",
    formData: { name: "মোঃ রফিকুল ইসলাম", designation: "সাধারণ সম্পাদক", organization: "সংগঠন", location: "ঢাকা", headline: "মহান বিজয় দিবস" },
    photoKeys: [],
  };

  it("accepts exact Bangla copy and optional fields", () => {
    expect(posterInputSchema.parse(validInput).formData.headline).toBe("মহান বিজয় দিবস");
  });

  it("rejects missing required copy, oversized text, and more than three photos", () => {
    expect(posterInputSchema.safeParse({ ...validInput, formData: { ...validInput.formData, name: " " } }).success).toBe(false);
    expect(posterInputSchema.safeParse({ ...validInput, photoKeys: ["a", "b", "c", "d"] }).success).toBe(false);
    expect(posterInputSchema.safeParse({ ...validInput, extra: true }).success).toBe(false);
  });
});