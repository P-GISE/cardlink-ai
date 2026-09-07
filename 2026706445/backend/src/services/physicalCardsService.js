import { badRequest, forbidden, notFound } from "../utils/httpErrors.js";

const allowedTemplates = new Set(["classic", "modern", "portfolio"]);
const allowedCardSizes = new Set(["kr_standard", "eu_standard", "us_standard"]);
const allowedPaperTypes = new Set(["snow_250", "art_300", "rendezvous_310"]);
const allowedFinishes = new Set(["matte", "glossy", "none"]);
const allowedQrPlacements = new Set(["front", "back"]);
const allowedOrderStatuses = new Set([
  "payment_pending",
  "production_pending",
  "preparing",
  "printing",
  "printed",
  "shipping",
  "completed",
  "cancelled"
]);

const toOrder = (row) => ({
  id: row.id,
  userId: row.user_id,
  profileId: row.profile_id,
  cardSize: row.card_size || "kr_standard",
  template: row.template,
  accentColor: row.accent_color,
  paperType: row.paper_type,
  finish: row.finish,
  quantity: row.quantity,
  qrPlacement: row.qr_placement,
  recipientName: row.recipient_name,
  recipientPhone: row.recipient_phone,
  shippingAddress: row.shipping_address,
  shippingAddressDetail: row.shipping_address_detail,
  memo: row.memo,
  status: row.status,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

const cleanText = (value) => String(value || "").trim();

const pickAllowed = (value, allowed, fallback) => (allowed.has(value) ? value : fallback);

const requireAllowed = (value, allowed, message) => {
  const normalized = cleanText(value);
  if (!allowed.has(normalized)) throw badRequest(message);
  return normalized;
};

const buildOrderRow = (user, payload) => {
  const quantity = Number(payload.quantity || 100);
  const recipientName = cleanText(payload.recipientName);
  const recipientPhone = cleanText(payload.recipientPhone);
  const shippingAddress = cleanText(payload.shippingAddress);

  if (!payload.profileId) throw badRequest("프로필 ID가 필요합니다.");
  if (!recipientName) throw badRequest("수령자 이름을 입력해주세요.");
  if (!recipientPhone) throw badRequest("수령자 연락처를 입력해주세요.");
  if (!shippingAddress) throw badRequest("배송 주소를 입력해주세요.");
  if (!Number.isInteger(quantity) || quantity <= 0) throw badRequest("수량은 1 이상이어야 합니다.");

  return {
    user_id: user.id,
    profile_id: payload.profileId,
    card_size: requireAllowed(payload.cardSize || "kr_standard", allowedCardSizes, "지원하지 않는 명함 규격입니다."),
    template: pickAllowed(payload.template, allowedTemplates, "classic"),
    accent_color: cleanText(payload.accentColor) || "#2357d3",
    paper_type: pickAllowed(payload.paperType, allowedPaperTypes, "snow_250"),
    finish: pickAllowed(payload.finish, allowedFinishes, "matte"),
    quantity,
    qr_placement: pickAllowed(payload.qrPlacement, allowedQrPlacements, "back"),
    recipient_name: recipientName,
    recipient_phone: recipientPhone,
    shipping_address: shippingAddress,
    shipping_address_detail: cleanText(payload.shippingAddressDetail) || null,
    memo: cleanText(payload.memo) || null,
    status: "payment_pending"
  };
};

export const createPhysicalCardsService = (supabase) => ({
  async listOwnOrders(user) {
    const { data, error } = await supabase
      .from("physical_card_orders")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return data.map(toOrder);
  },

  async createOrder(user, payload) {
    const row = buildOrderRow(user, payload);
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, user_id")
      .eq("id", row.profile_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (profileError) throw profileError;
    if (!profile) throw forbidden("본인 전자명함으로만 실물 명함을 제작할 수 있습니다.");

    const { data, error } = await supabase
      .from("physical_card_orders")
      .insert(row)
      .select()
      .single();

    if (error) throw error;

    return toOrder(data);
  },

  async listAllOrders() {
    const { data, error } = await supabase
      .from("physical_card_orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return data.map(toOrder);
  },

  async updateOrderStatus(orderId, payload = {}) {
    const status = String(payload.status || "").trim();

    if (!allowedOrderStatuses.has(status)) {
      throw badRequest("Unsupported physical card order status.");
    }

    const { data, error } = await supabase
      .from("physical_card_orders")
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq("id", orderId)
      .select()
      .single();

    if (error) throw error;
    if (!data) throw notFound("Physical card order not found.");

    return toOrder(data);
  }
});
