<script setup>
import { onMounted, ref, watch } from "vue";
import { generateQrDataUrl } from "../services/physicalCard";

const props = defineProps({
  shareUrl: {
    type: String,
    required: true
  }
});

const copied = ref(false);
const qrDataUrl = ref("");
const qrError = ref("");

const refreshQr = async () => {
  try {
    qrDataUrl.value = await generateQrDataUrl(props.shareUrl);
    qrError.value = "";
  } catch {
    qrDataUrl.value = "";
    qrError.value = "QR 이미지를 생성하지 못했습니다.";
  }
};

const copyLink = async () => {
  try {
    await navigator.clipboard.writeText(props.shareUrl);
    copied.value = true;
    window.setTimeout(() => {
      copied.value = false;
    }, 1600);
  } catch {
    copied.value = false;
  }
};

const downloadQrImage = () => {
  if (!qrDataUrl.value) return;

  const link = document.createElement("a");
  link.href = qrDataUrl.value;
  link.download = "cardlink-qr.png";
  link.click();
};

onMounted(refreshQr);
watch(() => props.shareUrl, refreshQr);
</script>

<template>
  <aside class="share-panel">
    <div>
      <p class="eyebrow">Share</p>
      <h2>전자명함 공유</h2>
      <p>공개 링크를 복사하거나 QR 이미지를 저장해 온/오프라인에서 공유할 수 있습니다.</p>
    </div>

    <div class="qr-box" aria-label="전자명함 QR">
      <img v-if="qrDataUrl" class="share-qr-image" :src="qrDataUrl" alt="전자명함 공유 QR" />
      <p v-else>{{ qrError || "QR 이미지를 생성하는 중입니다." }}</p>
      <button type="button" class="secondary full" :disabled="!qrDataUrl" @click="downloadQrImage">
        QR 이미지 다운로드
      </button>
    </div>

    <div class="copy-row">
      <input :value="shareUrl" readonly aria-label="공유 링크" />
      <button type="button" @click="copyLink">{{ copied ? "복사됨" : "링크 복사" }}</button>
    </div>
  </aside>
</template>
