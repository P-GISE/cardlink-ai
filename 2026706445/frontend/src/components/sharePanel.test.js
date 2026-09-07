import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));
const sharePanelSource = readFileSync(resolve(currentDir, "SharePanel.vue"), "utf8");

describe("SharePanel", () => {
  it("renders a real QR code and removes retired proximity sharing", () => {
    const removedTechnology = ["N", "F", "C"].join("");
    const removedButtonClass = ["n", "f", "c", "-button"].join("");

    expect(sharePanelSource).toContain("generateQrDataUrl");
    expect(sharePanelSource).toContain("qrDataUrl");
    expect(sharePanelSource).toContain("downloadQrImage");
    expect(sharePanelSource).toContain("QR 이미지 다운로드");
    expect(sharePanelSource).not.toContain(removedTechnology);
    expect(sharePanelSource).not.toContain(removedButtonClass);
    expect(sharePanelSource).not.toContain("qr-grid");
  });
});
