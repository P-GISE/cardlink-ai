import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));

const readSource = (fileName) => readFileSync(resolve(currentDir, fileName), "utf8");
const readStyles = () => readFileSync(resolve(currentDir, "../assets/styles.css"), "utf8").replace(/\r\n/g, "\n");

describe("physical card views", () => {
  it("renders a QR-based physical card builder", () => {
    const source = readSource("PhysicalCardBuilderView.vue");

    expect(source).toContain("실물 명함 만들기");
    expect(source).toContain("PhysicalCardPreview");
    expect(source).toContain("generateQrDataUrl");
    expect(source).toContain("cardSizeOptions");
    expect(source).toContain("templateOptions");
    expect(source).toContain("인쇄 규격");
    expect(source).toContain("도련");
    expect(source).toContain("클래식");
    expect(source).toContain("모던");
    expect(source).toContain("포트폴리오");
    expect(source).toContain("제작 요청");
  });

  it("renders order request and order history screens", () => {
    expect(readSource("PhysicalCardOrderView.vue")).toContain("배송 주소");
    expect(readSource("PhysicalCardOrderView.vue")).toContain("createPhysicalCardOrder");
    expect(readSource("PhysicalCardOrderView.vue")).toContain("getPaperTypeLabel");
    expect(readSource("PhysicalCardOrdersView.vue")).toContain("getPhysicalCardSpec");
    expect(readSource("PhysicalCardOrdersView.vue")).toContain("결제대기");
    expect(readSource("PhysicalCardOrdersView.vue")).toContain("getPhysicalCardOrders");
  });

  it("keeps physical card previews inside narrow mobile screens", () => {
    const styles = readStyles();

    expect(styles).toContain("@media (max-width: 640px)");
    expect(styles).toContain(".print-card");
    expect(styles).toContain("min-height: 190px");
    expect(styles).toContain(".print-qr.large");
  });

  it("uses aligned option controls for templates and paper settings", () => {
    const source = readSource("PhysicalCardBuilderView.vue");
    const styles = readStyles();

    expect(source).toContain("template-choice-grid");
    expect(source).toContain("production-options");
    expect(source).toContain("paper-option-field");
    expect(styles).toContain(".template-choice-grid");
    expect(styles).toContain(".option-segment");
    expect(styles).toContain(".paper-option-field");
  });

  it("applies distinct preview layouts for each template option", () => {
    const source = readFileSync(resolve(currentDir, "../components/PhysicalCardPreview.vue"), "utf8");
    const styles = readStyles();

    expect(source).toContain("print-card-identity");
    expect(source).toContain("print-card-title");
    expect(source).toContain("print-card-organization");
    expect(styles).toContain(".template-modern.print-card-front");
    expect(styles).toContain(".template-modern .print-card-contact");
    expect(styles).toContain(".template-portfolio.print-card-front");
    expect(styles).toContain(".template-portfolio .print-card-title");
  });

  it("keeps front QR placement from falling into the normal card grid", () => {
    const styles = readStyles();

    expect(styles).toContain(".print-card > :not(.print-card-safe-area, .print-qr)");
    expect(styles).toContain(".print-card-front.has-front-qr .print-qr");
    expect(styles).toContain(".template-modern.print-card-front.has-front-qr {\n  grid-template-columns: 1fr;");
    expect(styles).toContain(".template-modern.print-card-front.has-front-qr .print-qr {\n  position: absolute;");
    expect(styles).toContain("max-width: min(360px, calc(100% - 128px))");
    expect(styles).toContain("z-index: 2");
  });
});
