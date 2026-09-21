<script setup lang="ts">
import { ref } from 'vue';
import { message } from 'ant-design-vue';
import { CloseOutlined, PlusOutlined } from '@ant-design/icons-vue';

/**
 * 参考图上传器（生成配方用）
 *
 * Demo 无后端：图片读取后经 canvas 压缩为 DataURL 直接存入 localStorage，
 * 因此限制数量与单边尺寸，避免撑爆存储。对外以 v-model 绑定 DataURL 数组。
 */
const props = withDefaults(
  defineProps<{
    modelValue?: string[];
    max?: number;
    disabled?: boolean;
  }>(),
  { modelValue: () => [], max: 3, disabled: false }
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: string[]): void;
}>();

const MAX_EDGE = 480;
const uploading = ref(false);

/** 压缩为 DataURL（等比缩放到 MAX_EDGE 内，输出 JPEG） */
function compress(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('读取失败'));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error('解析失败'));
      image.onload = () => {
        const scale = Math.min(1, MAX_EDGE / Math.max(image.width, image.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('画布不可用'));
          return;
        }
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.72));
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

async function handleFiles(files: File[]): Promise<void> {
  const remain = props.max - props.modelValue.length;
  if (remain <= 0) {
    message.warning(`最多上传 ${props.max} 张参考图`);
    return;
  }
  uploading.value = true;
  try {
    const accepted = files.filter((file) => file.type.startsWith('image/')).slice(0, remain);
    if (!accepted.length) {
      message.warning('请选择图片文件');
      return;
    }
    // 单张处理（一次选一张，避免异步回写互相覆盖）
    for (const file of accepted) {
      const dataUrl = await compress(file);
      emit('update:modelValue', [...props.modelValue, dataUrl]);
    }
    if (files.length > remain) message.info(`已达上限，仅添加前 ${remain} 张`);
  } catch {
    message.error('参考图处理失败，请重试');
  } finally {
    uploading.value = false;
  }
}

/** a-upload 钩子：接管上传，不走网络 */
function beforeUpload(file: File): boolean {
  void handleFiles([file]);
  return false;
}

function removeAt(index: number): void {
  const next = [...props.modelValue];
  next.splice(index, 1);
  emit('update:modelValue', next);
}
</script>

<template>
  <div class="ref-uploader">
    <div v-for="(src, index) in modelValue" :key="index" class="ref-uploader__item">
      <img :src="src" alt="参考图" class="ref-uploader__image" />
      <button
        v-if="!disabled"
        type="button"
        class="ref-uploader__remove"
        @click.stop="removeAt(index)"
      >
        <CloseOutlined />
      </button>
    </div>

    <a-upload
      v-if="!disabled && modelValue.length < max"
      accept="image/*"
      :show-upload-list="false"
      :before-upload="beforeUpload"
    >
      <button type="button" class="ref-uploader__add" :disabled="uploading">
        <PlusOutlined />
        <span>{{ uploading ? '处理中' : '参考图' }}</span>
      </button>
    </a-upload>
  </div>
</template>

<style scoped>
.ref-uploader {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-3);
}

.ref-uploader__item {
  position: relative;
  width: 64px;
  height: 64px;
}

.ref-uploader__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: var(--radius-3);
  background: var(--color-bg-page-alt);
}

.ref-uploader__remove {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 18px;
  height: 18px;
  padding: 0;
  border: 0;
  border-radius: var(--radius-full);
  background: var(--color-text-primary);
  color: var(--color-bg-card);
  font-size: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0.72;
  transition: opacity 0.15s ease;
}

.ref-uploader__remove:hover {
  opacity: 1;
}

.ref-uploader__add {
  width: 64px;
  height: 64px;
  padding: 0;
  border: 0;
  border-radius: var(--radius-3);
  background: var(--color-bg-page-alt);
  color: var(--color-text-tertiary);
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  font-size: var(--font-size-12);
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.ref-uploader__add:hover {
  background: var(--color-bg-hover);
  color: var(--color-action-primary);
}

.ref-uploader__add:disabled {
  cursor: default;
  opacity: 0.6;
}
</style>
