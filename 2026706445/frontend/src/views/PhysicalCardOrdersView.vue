<script setup>
import { onMounted, ref } from "vue";
import ErrorState from "../components/ErrorState.vue";
import LoadingState from "../components/LoadingState.vue";
import PageHeader from "../components/PageHeader.vue";
import { getPhysicalCardOrders } from "../services/api";
import { getAccessToken } from "../services/auth";
import { formatPrintSize, getFinishLabel, getPaperTypeLabel, getPhysicalCardSpec, mapOrderStatusLabel } from "../services/physicalCard";

const orders = ref([]);
const loading = ref(true);
const error = ref("");

onMounted(async () => {
  try {
    const token = await getAccessToken();
    const data = await getPhysicalCardOrders(token);
    orders.value = data.items;
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <PageHeader
    eyebrow="Orders"
    title="실물 명함 주문 내역"
    description="제작 요청한 QR 명함의 진행 상태를 확인합니다."
  />

  <LoadingState v-if="loading" />
  <ErrorState v-else-if="error" :message="error" />

  <section v-else class="order-list">
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
          <dt>수령자</dt>
          <dd>{{ order.recipientName }}</dd>
        </div>
        <div>
          <dt>배송지</dt>
          <dd>{{ order.shippingAddress }}</dd>
        </div>
      </dl>
    </article>

    <div v-if="orders.length === 0" class="state-box">
      아직 실물 명함 제작 요청이 없습니다. 결제대기 주문을 만들려면 실물 명함 만들기에서 제작 요청을 진행하세요.
    </div>
  </section>
</template>
