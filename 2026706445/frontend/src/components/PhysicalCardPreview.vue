<script setup>
import { computed } from "vue";
import { formatPrintSize, getPhysicalCardSpec } from "../services/physicalCard";

const props = defineProps({
  profile: {
    type: Object,
    required: true
  },
  options: {
    type: Object,
    required: true
  },
  printSpec: {
    type: Object,
    default: null
  },
  qrDataUrl: {
    type: String,
    default: ""
  },
  publicUrl: {
    type: String,
    required: true
  }
});

const selectedSpec = computed(() => props.printSpec || getPhysicalCardSpec(props.options.cardSize));
const templateClass = computed(() => `template-${props.options.template || "classic"}`);
const frontHasQr = computed(() => props.options.qrPlacement === "front" && props.qrDataUrl);
const frontCardClasses = computed(() => [templateClass.value, { "has-front-qr": frontHasQr.value }]);
const previewStyle = computed(() => ({
  "--card-accent": props.options.accentColor,
  "--print-card-ratio": `${selectedSpec.value.trim.width} / ${selectedSpec.value.trim.height}`
}));
</script>

<template>
  <div class="physical-preview" :style="previewStyle">
    <div class="preview-spec-caption">
      <strong>{{ selectedSpec.label }}</strong>
      <span>
        완성 {{ formatPrintSize(selectedSpec.trim) }} · 작업 {{ formatPrintSize(selectedSpec.document) }} · 안전영역
        {{ formatPrintSize(selectedSpec.safe) }}
      </span>
    </div>

    <article class="print-card print-card-front" :class="frontCardClasses">
      <div class="print-card-safe-area" aria-hidden="true"></div>
      <div class="print-card-identity">
        <p class="eyebrow print-card-organization">{{ profile.organization || "Business Card" }}</p>
        <h2 class="print-card-title">{{ profile.displayName || profile.name }}</h2>
        <p class="print-card-role">{{ profile.position || profile.role }}</p>
      </div>

      <div class="print-card-contact">
        <strong>{{ profile.cardTagline || profile.headline }}</strong>
        <span v-if="profile.phone">{{ profile.phone }}</span>
        <span v-if="profile.email">{{ profile.email }}</span>
        <span v-if="profile.websiteUrl">{{ profile.websiteUrl }}</span>
      </div>

      <img
        v-if="options.qrPlacement === 'front' && qrDataUrl"
        class="print-qr"
        :src="qrDataUrl"
        alt="전자명함 QR"
      />
    </article>

    <article class="print-card print-card-back" :class="templateClass">
      <div class="print-card-safe-area" aria-hidden="true"></div>
      <div class="print-card-qr-block">
        <img v-if="qrDataUrl" class="print-qr large" :src="qrDataUrl" alt="전자명함 QR" />
        <div v-else class="print-qr-skeleton">QR</div>
        <p>스캔하면 전자명함으로 이동합니다.</p>
        <strong>{{ publicUrl }}</strong>
      </div>
    </article>
  </div>
</template>
