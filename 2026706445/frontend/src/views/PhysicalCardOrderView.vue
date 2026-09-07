<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import ErrorState from "../components/ErrorState.vue";
import LoadingState from "../components/LoadingState.vue";
import PageHeader from "../components/PageHeader.vue";
import { createPhysicalCardOrder, getMe } from "../services/api";
import { getAccessToken } from "../services/auth";
import {
  formatPrintSize,
  getFinishLabel,
  getPaperTypeLabel,
  getPhysicalCardSpec,
  normalizePhysicalCardOrderPayload,
  readPhysicalCardDraft
} from "../services/physicalCard";

const router = useRouter();
const profile = ref(null);
const loading = ref(true);
const saving = ref(false);
const error = ref("");
const draft = reactive(readPhysicalCardDraft());
const selectedSpec = computed(() => getPhysicalCardSpec(draft.cardSize));

const form = reactive({
  recipientName: "",
  recipientPhone: "",
  shippingAddress: "",
  shippingAddressDetail: "",
  memo: ""
});

onMounted(async () => {
  try {
    const token = await getAccessToken();
    const data = await getMe(token);

    if (!data.profile) {
      await router.replace("/profile/edit");
      return;
    }

    profile.value = data.profile;
    form.recipientName = data.profile.displayName || data.profile.name || "";
    form.recipientPhone = data.profile.phone || "";
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
});

const submitOrder = async () => {
  saving.value = true;
  error.value = "";

  try {
    const token = await getAccessToken();
    await createPhysicalCardOrder(
      token,
      normalizePhysicalCardOrderPayload({
        ...draft,
        ...form,
        profileId: draft.profileId || profile.value.id
      })
    );
    await router.replace("/print-cards/orders");
  } catch (err) {
    error.value = err.message;
  } finally {
    saving.value = false;
  }
};
</script>

<template>
  <PageHeader
    eyebrow="Order"
    title="실물 명함 제작 요청"
    description="결제 연동 전 단계로 주문은 결제대기 상태로 생성됩니다."
  />

  <LoadingState v-if="loading" />
  <ErrorState v-else-if="error && !profile" :message="error" />

  <form v-else class="profile-editor" @submit.prevent="submitOrder">
    <section class="form-section">
      <div class="panel-heading">
        <p class="eyebrow">Shipping</p>
        <h2>배송 정보</h2>
        <p>제작 요청 확인을 위해 받을 사람과 배송 주소를 입력합니다.</p>
      </div>

      <div class="form-grid two">
        <label>
          수령자 이름
          <input v-model="form.recipientName" type="text" required />
        </label>

        <label>
          수령자 연락처
          <input v-model="form.recipientPhone" type="tel" required />
        </label>
      </div>

      <label>
        배송 주소
        <input v-model="form.shippingAddress" type="text" required placeholder="서울시 강남구 테헤란로" />
      </label>

      <label>
        상세 주소
        <input v-model="form.shippingAddressDetail" type="text" placeholder="101호" />
      </label>

      <label>
        요청사항
        <textarea v-model="form.memo" rows="4" placeholder="인쇄나 배송 관련 요청사항을 입력하세요." />
      </label>
    </section>

    <section class="state-box order-summary">
      <strong>주문 요약</strong>
      <span>
        {{ draft.quantity }}매 · {{ selectedSpec.label }} {{ formatPrintSize(selectedSpec.trim) }} ·
        {{ getPaperTypeLabel(draft.paperType) }} · {{ getFinishLabel(draft.finish) }}
      </span>
      <span>작업 사이즈 {{ formatPrintSize(selectedSpec.document) }} · 도련 {{ selectedSpec.bleedMm }}mm · 안전여백 {{ selectedSpec.safeMarginMm }}mm</span>
      <span>상태는 생성 후 결제대기로 표시됩니다.</span>
    </section>

    <div class="editor-footer">
      <button type="submit" class="primary" :disabled="saving">
        {{ saving ? "요청 중..." : "제작 요청 생성" }}
      </button>
    </div>

    <p v-if="error" class="state-box error">{{ error }}</p>
  </form>
</template>
