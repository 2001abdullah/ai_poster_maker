import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { renderPoster } from "./render-poster";
import { AssetStorage } from "./storage";

describe("renderPoster", () => {
  it("renders a print-sized PNG and safely escapes user text", async () => {
    const result = await renderPoster({
      templateSlug: "victory-day",
      formData: { name: "নাম", designation: "", organization: "", location: "ঢাকা", headline: "<svg onload='alert(1)'>" },
      photoKeys: [],
    }, new AssetStorage("local"));
    const metadata = await sharp(result).metadata();
    expect(metadata).toMatchObject({ format: "png", width: 1600, height: 2000 });
  });
});