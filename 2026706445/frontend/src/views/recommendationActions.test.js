import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));

const readSource = (fileName) => readFileSync(resolve(currentDir, fileName), "utf8");

describe("recommendation actions", () => {
  it("connects recommendation runs and contact requests to authenticated API flow", () => {
    const viewSource = readSource("RecommendationsView.vue");
    const cardSource = readSource("../components/RecommendationCard.vue");

    expect(viewSource).toContain("createRecommendationRun");
    expect(viewSource).toContain("requestContact");
    expect(viewSource).toContain("recommendationRun");
    expect(viewSource).toContain("contactStates");
    expect(viewSource).toContain("redirectToLogin");
    expect(cardSource).toContain("defineEmits");
    expect(cardSource).toContain("@click=\"$emit('contact', user)\"");
    expect(cardSource).toContain("contactState");
  });
});
