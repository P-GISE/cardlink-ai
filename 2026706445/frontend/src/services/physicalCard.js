import QRCode from "qrcode";

export const PHYSICAL_CARD_DRAFT_KEY = "cardlink.physicalCardDraft";

const buildPrintSpec = ({ value, label, region, trim, bleedMm, safeMarginMm, note }) => ({
  value,
  label,
  region,
  trim,
  bleedMm,
  safeMarginMm,
  document: {
    width: Number((trim.width + bleedMm * 2).toFixed(2)),
    height: Number((trim.height + bleedMm * 2).toFixed(2))
  },
  safe: {
    width: Number((trim.width - safeMarginMm * 2).toFixed(2)),
    height: Number((trim.height - safeMarginMm * 2).toFixed(2))
  },
  note
});

export const cardSizeOptions = [
  buildPrintSpec({
    value: "kr_standard",
    label: "한국 일반 명함",
    region: "국내 기본",
    trim: { width: 90, height: 50 },
    bleedMm: 2,
    safeMarginMm: 3,
    note: "국내 인쇄소에서 가장 일반적인 완성 사이즈입니다."
  }),
  buildPrintSpec({
    value: "eu_standard",
    label: "유럽 표준 명함",
    region: "유럽권",
    trim: { width: 85, height: 55 },
    bleedMm: 3,
    safeMarginMm: 3,
    note: "신용카드에 가까운 비율로 지갑 수납성이 좋습니다."
  }),
  buildPrintSpec({
    value: "us_standard",
    label: "미국/캐나다 표준",
    region: "북미권",
    trim: { width: 88.9, height: 50.8 },
    bleedMm: 3.175,
    safeMarginMm: 3.175,
    note: "3.5 × 2 inch 기반의 북미 표준 사이즈입니다."
  })
];

export const paperTypeOptions = [
  {
    value: "snow_250",
    label: "스노우지 250g",
    description: "차분한 무광 질감의 국내 기본 명함 용지"
  },
  {
    value: "art_300",
    label: "아트지 300g",
    description: "사진과 컬러가 선명한 유광 계열 코팅지"
  },
  {
    value: "rendezvous_310",
    label: "랑데뷰 310g",
    description: "두께감과 질감이 있는 고급 러프글로스지"
  }
];

export const finishOptions = [
  { value: "matte", label: "무광 코팅", description: "반사를 줄이고 차분하게 마감" },
  { value: "glossy", label: "유광 코팅", description: "컬러와 사진을 선명하게 강조" },
  { value: "none", label: "코팅 없음", description: "필기감과 종이 질감을 우선" }
];

export const defaultPhysicalCardOptions = () => ({
  cardSize: "kr_standard",
  template: "classic",
  accentColor: "#2357d3",
  paperType: "snow_250",
  finish: "matte",
  quantity: 100,
  qrPlacement: "back"
});

export const buildPublicProfileUrl = (origin, slug) =>
  `${String(origin).replace(/\/$/, "")}/profiles/${slug}`;

export const generateQrDataUrl = (value) =>
  QRCode.toDataURL(value, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 320
  });

const cleanText = (value) => String(value || "").trim();

const findByValue = (items, value, fallbackValue) =>
  items.find((item) => item.value === value) || items.find((item) => item.value === fallbackValue);

export const getPhysicalCardSpec = (value) => findByValue(cardSizeOptions, value, "kr_standard");

export const getPaperType = (value) => findByValue(paperTypeOptions, value, "snow_250");

export const getFinish = (value) => findByValue(finishOptions, value, "matte");

export const getPaperTypeLabel = (value) => getPaperType(value).label;

export const getFinishLabel = (value) => getFinish(value).label;

export const formatMillimeters = (value) =>
  Number.isInteger(value) ? `${value}mm` : `${Number(value).toFixed(1)}mm`;

export const formatPrintSize = ({ width, height }) =>
  `${formatMillimeters(width)} × ${formatMillimeters(height)}`;

export const normalizePhysicalCardOrderPayload = (payload) => ({
  profileId: payload.profileId,
  cardSize: payload.cardSize || "kr_standard",
  template: payload.template || "classic",
  accentColor: payload.accentColor || "#2357d3",
  paperType: payload.paperType || "snow_250",
  finish: payload.finish || "matte",
  quantity: Number(payload.quantity || 100),
  qrPlacement: payload.qrPlacement || "back",
  recipientName: cleanText(payload.recipientName),
  recipientPhone: cleanText(payload.recipientPhone),
  shippingAddress: cleanText(payload.shippingAddress),
  shippingAddressDetail: cleanText(payload.shippingAddressDetail),
  memo: cleanText(payload.memo)
});

const statusLabels = {
  payment_pending: "결제대기",
  production_pending: "제작대기",
  preparing: "제작준비",
  printing: "제작중",
  printed: "제작완료",
  shipping: "배송중",
  completed: "완료",
  cancelled: "취소"
};

export const mapOrderStatusLabel = (status) => statusLabels[status] || status;

export const savePhysicalCardDraft = (draft, storage = sessionStorage) => {
  storage.setItem(PHYSICAL_CARD_DRAFT_KEY, JSON.stringify(draft));
};

export const readPhysicalCardDraft = (storage = sessionStorage) => {
  const rawDraft = storage.getItem(PHYSICAL_CARD_DRAFT_KEY);
  if (!rawDraft) return defaultPhysicalCardOptions();

  try {
    return {
      ...defaultPhysicalCardOptions(),
      ...JSON.parse(rawDraft)
    };
  } catch {
    storage.removeItem(PHYSICAL_CARD_DRAFT_KEY);
    return defaultPhysicalCardOptions();
  }
};
