<script setup>
import { onMounted, ref } from "vue";
import ErrorState from "../components/ErrorState.vue";
import LoadingState from "../components/LoadingState.vue";
import PageHeader from "../components/PageHeader.vue";
import { getAdminPhysicalCardOrders, updateAdminPhysicalCardOrderStatus } from "../services/api";
import { getAccessToken } from "../services/auth";
import { formatPrintSize, getFinishLabel, getPaperTypeLabel, getPhysicalCardSpec, mapOrderStatusLabel } from "../services/physicalCard";

const orders = ref([]);
const loading = ref(true);
const error = ref("");
const updatingId = ref("");
const draftStatuses = ref({});

const statusOptions = [
  "payment_pending",
  "production_pending",
  "printing",
  "printed",
  "shipping",
  "completed",
  "cancelled"
];

const setDraftStatuses = () => {
  draftStatuses.value = Object.fromEntries(orders.value.map((order) => [order.id, order.status]));
};

const loadOrders = async () => {
  loading.value = true;
  error.value = "";

  try {
    const token = await getAccessToken();
    const data = await getAdminPhysicalCardOrders(token);
    orders.value = data.items || [];
    setDraftStatuses();
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};

const handleStatusUpdate = async (order) => {
  updatingId.value = order.id;
  error.value = "";

  try {
    const token = await getAccessToken();
    const updated = await updateAdminPhysicalCardOrderStatus(token, order.id, {
      status: draftStatuses.value[order.id]
    });
    orders.value = orders.value.map((item) => (item.id === order.id ? updated : item));
    setDraftStatuses();
  } catch (err) {
    error.value = err.message;
  } finally {
    updatingId.value = "";
  }
};

onMounted(loadOrders);
</script>

<template>
  <PageHeader
    eyebrow="Admin"
    title="실물 명함 주문 관리"
    description="결제 이후 제작과 배송 진행 상태를 운영자가 직접 업데이트합니다."
  />

  <LoadingState v-if="loading" />
  <ErrorState v-else-if="error" :message="error" />

  <section v-else class="order-list" aria-label="전체 실물 명함 주문 목록">
    <article v-for="order in orders" :key="order.id" class="order-card">
      <div>
        <p class="eyebrow">Order</p>
        <h2>{{ order.quantity }}매 {{ order.template }}</h2>
        <p>
          {{ getPhysicalCardSpec(order.cardSize).label }} {{ formatPrintSize(getPhysicalCardSpec(order.cardSize).trim) }}
          · {{ getPaperTypeLabel(order.paperType) }} · {{ getFinishLabel(order.finish) }}
        </p>
      </div>
      <span class="status-pill">{{ mapOrderStatusLabel(order.status) }}</span>

      <dl>
        <div>
          <dt>수령인</dt>
          <dd>{{ order.recipientName }}</dd>
        </div>
        <div>
          <dt>연락처</dt>
          <dd>{{ order.recipientPhone }}</dd>
        </div>
        <div>
          <dt>배송지</dt>
          <dd>{{ order.shippingAddress }} {{ order.shippingAddressDetail }}</dd>
        </div>
        <div>
          <dt>요청사항</dt>
          <dd>{{ order.memo || "없음" }}</dd>
        </div>
      </dl>

      <div class="form-grid two admin-order-actions">
        <label>
          제작 상태
          <select v-model="draftStatuses[order.id]">
            <option v-for="status in statusOptions" :key="status" :value="status">
              {{ mapOrderStatusLabel(status) }}
            </option>
          </select>
        </label>
        <button
          type="button"
          class="primary"
          :disabled="updatingId === order.id || draftStatuses[order.id] === order.status"
          @click="handleStatusUpdate(order)"
        >
          {{ updatingId === order.id ? "저장 중..." : "상태 저장" }}
        </button>
      </div>
    </article>

    <div v-if="orders.length === 0" class="state-box">
      아직 실물 명함 주문이 없습니다.
    </div>
  </section>
</template>
