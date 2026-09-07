import { describe, expect, it } from "vitest";
import {
  buildPublicProfileUrl,
  defaultPhysicalCardOptions,
  getFinishLabel,
  getPaperTypeLabel,
  getPhysicalCardSpec,
  mapOrderStatusLabel,
  normalizePhysicalCardOrderPayload
} from "./physicalCard.js";

describe("physical card helpers", () => {
  it("builds the public electronic card URL for QR data", () => {
    expect(buildPublicProfileUrl("https://cardlink.example.test", "my-card")).toBe(
      "https://cardlink.example.test/profiles/my-card"
    );
  });

  it("normalizes order payload and forces quantity to a number", () => {
    expect(
      normalizePhysicalCardOrderPayload({
        ...defaultPhysicalCardOptions(),
        profileId: "profile-1",
        cardSize: "kr_standard",
        quantity: "200",
        recipientName: " 박기성 ",
        recipientPhone: " 010-1234-5678 ",
        shippingAddress: " 서울시 ",
        shippingAddressDetail: " 101호 ",
        memo: " 요청 "
      })
    ).toEqual({
      profileId: "profile-1",
      cardSize: "kr_standard",
      template: "classic",
      accentColor: "#2357d3",
      paperType: "snow_250",
      finish: "matte",
      quantity: 200,
      qrPlacement: "back",
      recipientName: "박기성",
      recipientPhone: "010-1234-5678",
      shippingAddress: "서울시",
      shippingAddressDetail: "101호",
      memo: "요청"
    });
  });

  it("maps payment pending status to Korean label", () => {
    expect(mapOrderStatusLabel("payment_pending")).toBe("결제대기");
  });

  it("describes real print specs for Korean business cards", () => {
    const options = defaultPhysicalCardOptions();
    const spec = getPhysicalCardSpec(options.cardSize);

    expect(options.cardSize).toBe("kr_standard");
    expect(spec).toMatchObject({
      label: "한국 일반 명함",
      trim: { width: 90, height: 50 },
      bleedMm: 2,
      safeMarginMm: 3,
      document: { width: 94, height: 54 },
      safe: { width: 84, height: 44 }
    });
  });

  it("maps production paper and coating labels", () => {
    expect(getPaperTypeLabel("snow_250")).toBe("스노우지 250g");
    expect(getFinishLabel("matte")).toBe("무광 코팅");
  });
});
