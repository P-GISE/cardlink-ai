import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));

const readSource = (fileName) => readFileSync(resolve(currentDir, fileName), "utf8");

describe("community project actions", () => {
  it("connects project application actions to authenticated API flow", () => {
    const viewSource = readSource("CommunityView.vue");
    const cardSource = readSource("../components/ProjectCard.vue");

    expect(viewSource).toContain("applyToProject");
    expect(viewSource).toContain("applicationStates");
    expect(viewSource).toContain("handleApply");
    expect(viewSource).toContain("redirectToLogin");
    expect(cardSource).toContain("defineEmits");
    expect(cardSource).toContain("@click=\"$emit('apply', project)\"");
    expect(cardSource).toContain("applicationState");
  });
});
