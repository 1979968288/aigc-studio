<script setup lang="ts">
import { ref } from 'vue';
import { Empty as AEmpty } from 'ant-design-vue';
import PageHeader from './PageHeader.vue';
import PageContent from './PageContent.vue';

const props = defineProps<{
  moduleTitle?: string;
  title: string;
  description?: string;
  /** 开放里程碑（如 P2.1） */
  milestone: string;
}>();

const mountedAt = new Date().toLocaleTimeString('zh-CN');
const keepAliveProbe = ref('');
void props;
</script>

<script lang="ts">
export default { name: 'ComingSoonPanel' };
</script>

<template>
  <div>
    <PageHeader :module-title="moduleTitle" :title="title" :description="description">
      <template #extra>
        <a-tag color="purple">{{ milestone }} 里程碑开放</a-tag>
      </template>
    </PageHeader>
    <PageContent>
      <div class="coming-soon">
        <AEmpty description="本模块在后续里程碑开发中开放" />
        <div class="coming-soon__probe">
          <span class="coming-soon__probe-label">keep-alive 探针</span>
          <a-input
            v-model:value="keepAliveProbe"
            placeholder="输入内容后切换标签再回来，验证页面状态被缓存"
          />
          <span class="coming-soon__probe-time">挂载于 {{ mountedAt }}</span>
        </div>
      </div>
    </PageContent>
  </div>
</template>

<style scoped>
.coming-soon {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
  padding: var(--spacing-6) var(--spacing-5);
  border: 1px solid var(--color-border-divider);
  border-radius: var(--radius-5);
  background: var(--component-card-background);
  box-shadow: var(--shadow-card);
}

.coming-soon__probe {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: var(--spacing-3);
  align-items: center;
  padding: var(--spacing-3) var(--spacing-4);
  border: 1px dashed var(--color-border-default);
  border-radius: var(--radius-4);
  background: var(--color-bg-card-soft);
}

.coming-soon__probe-label {
  font-size: 12px;
  color: var(--color-text-tertiary);
  white-space: nowrap;
}

.coming-soon__probe-time {
  font-size: 12px;
  color: var(--color-text-tertiary);
  white-space: nowrap;
  font-family: var(--font-family-mono);
}
</style>
