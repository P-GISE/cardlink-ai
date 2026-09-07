<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import ErrorState from "../components/ErrorState.vue";
import LoadingState from "../components/LoadingState.vue";
import PageHeader from "../components/PageHeader.vue";
import PhysicalCardPreview from "../components/PhysicalCardPreview.vue";
import { getMe } from "../services/api";
import { getAccessToken } from "../services/auth";
import {
  buildPublicProfileUrl,
  cardSizeOptions,
  defaultPhysicalCardOptions,
  finishOptions,
  formatPrintSize,
  generateQrDataUrl,
  getFinish,
  getPaperType,
  getPhysicalCardSpec,
  paperTypeOptions,
  savePhysicalCardDraft
} from "../services/physicalCard";

const router = useRouter();
const profile = ref(null);
const qrDataUrl = ref("");
const loading = ref(true);
const error = ref("");
const options = reactive(defaultPhysicalCardOptions());
const templateOptions = [
  {
    value: "classic",
    label: "클래식",
    description: "이름과 연락처를 또렷하게 보여주는 기본형"
  },
  {
    value: "modern",
    label: "모던",
    description: "여백과 색상 대비를 살린 간결한 구성"
  },
  {
    value: "portfolio",
    label: "포트폴리오",
    description: "직무와 프로젝트 인상을 강조하는 소개형"
  }
];

const publicUrl = computed(() =>
  profile.value?.slug ? buildPublicProfileUrl(window.location.origin, profile.value.slug) : ""
);
const selectedSpec = computed(() => getPhysicalCardSpec(options.cardSize));
const selectedPaper = computed(() => getPaperType(options.paperType));
const selectedFinish = computed(() => getFinish(options.finish));

const loadProfile = async () => {
  const token = await getAccessToken();
  const data = await getMe(token);

  if (!data.profile) {
    await router.replace("/profile/edit");
    return;
  }

  profile.value = data.profile;
  qrDataUrl.value = await generateQrDataUrl(publicUrl.value);
};

onMounted(async () => {
  try {
    await loadProfile();
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
});

const downloadPrintFile = () => {
  window.print();
};

const requestOrder = async () => {
  savePhysicalCardDraft({
    ...options,
    profileId: profile.value.id
  });
  await router.push("/print-cards/order");
};
</script>

<template>
  <PageHeader
    eyebrow="Print Cards"
    title="실물 명함 만들기"
    description="전자명함 공개 URL이 담긴 QR을 실제 명함 앞면 또는 뒷면에 배치합니다."
  />

  <LoadingState v-if="loading" />
  <ErrorState v-else-if="error" :message="error" />

  <section v-else-if="profile" class="physical-builder">
    <form class="form-section physical-options">
      <div class="panel-heading">
        <p class="eyebrow">Design</p>
        <h2>제작 옵션</h2>
        <p>인쇄 전 미리보기와 주문 요청에 사용할 설정입니다.</p>
      </div>

      <label>
        인쇄 규격
        <select v-model="options.cardSize">
          <option v-for="spec in cardSizeOptions" :key="spec.value" :value="spec.value">
            {{ spec.label }} · {{ formatPrintSize(spec.trim) }}
          </option>
        </select>
      </label>

      <section class="print-spec-panel" aria-label="선택한 명함 인쇄 규격">
        <div>
          <span>완성 사이즈</span>
          <strong>{{ formatPrintSize(selectedSpec.trim) }}</strong>
        </div>
        <div>
          <span>작업 사이즈</span>
          <strong>{{ formatPrintSize(selectedSpec.document) }}</strong>
        </div>
        <div>
          <span>도련</span>
          <strong>사방 {{ selectedSpec.bleedMm }}mm</strong>
        </div>
        <div>
          <span>안전영역</span>
          <strong>{{ formatPrintSize(selectedSpec.safe) }}</strong>
        </div>
      </section>

      <p class="print-guidance">
        {{ selectedSpec.note }} 로고와 연락처는 안전영역 안에 두고, 배경색과 이미지는 도련까지 채워주세요.
      </p>

      <section class="option-block" aria-label="명함 템플릿 선택">
        <div class="option-block-header">
          <span>템플릿</span>
          <small>명함 성격에 맞는 구성을 선택하세요.</small>
        </div>
        <div class="template-choice-grid" role="group" aria-label="명함 템플릿">
          <button
            v-for="template in templateOptions"
            :key="template.value"
            type="button"
            class="option-segment"
            :class="{ active: options.template === template.value }"
            :aria-pressed="options.template === template.value"
            @click="options.template = template.value"
          >
            <strong>{{ template.label }}</strong>
            <span>{{ template.description }}</span>
          </button>
        </div>
      </section>

      <div class="form-grid two">
        <label>
          강조 색상
          <input v-model="options.accentColor" type="color" />
        </label>

        <label>
          QR 위치
          <select v-model="options.qrPlacement">
            <option value="back">뒷면</option>
            <option value="front">앞면</option>
          </select>
        </label>
      </div>

      <section class="production-options" aria-label="용지와 제작 수량">
        <label class="paper-option-field">
          용지
          <select v-model="options.paperType">
            <option v-for="paper in paperTypeOptions" :key="paper.value" :value="paper.value">
              {{ paper.label }}
            </option>
          </select>
          <small>{{ selectedPaper.description }}</small>
        </label>

        <label>
          코팅
          <select v-model="options.finish">
            <option v-for="finish in finishOptions" :key="finish.value" :value="finish.value">
              {{ finish.label }}
            </option>
          </select>
          <small>{{ selectedFinish.description }}</small>
        </label>

        <label>
          수량
          <input v-model="options.quantity" type="number" min="1" step="50" />
        </label>
      </section>

      <div class="form-actions">
        <button type="button" class="secondary" @click="downloadPrintFile">인쇄 파일 다운로드</button>
        <button type="button" class="primary" @click="requestOrder">제작 요청</button>
      </div>
    </form>

    <PhysicalCardPreview
      :profile="profile"
      :options="options"
      :print-spec="selectedSpec"
      :qr-data-url="qrDataUrl"
      :public-url="publicUrl"
    />
  </section>
</template>
