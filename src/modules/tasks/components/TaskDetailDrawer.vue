<script setup lang="ts">
import { computed, inject } from 'vue';
import dayjs from 'dayjs';
import { DeleteOutlined, ReloadOutlined } from '@ant-design/icons-vue';
import RefImageUploader from '@/shared/components/RefImageUploader.vue';
import { GEN_MODEL_GROUPS } from '@/shared/aigc/genConfig';
import { TASK_LINE_META, TASK_PRIORITY_OPTIONS, TASK_STATUS_META } from '../constants';
import { taskListPageKey } from '../injection';

defineOptions({ name: 'TaskDetailDrawer' });

const page = inject(taskListPageKey)!;

/** 生成模型分组选项（图像 / 视频 / 音频） */
const genModelGroups = GEN_MODEL_GROUPS.map((group) => ({
  label: group.label,
  options: group.options.map((option) => ({ value: option.value, label: option.label })),
}));

const task = computed(() => page.detailTask);

/** 状态胶囊填充色（TASK_STATUS_META 仅含文字色，本地补齐） */
const STATUS_BG: Record<string, string> = {
  todo: 'var(--color-fill-info-subtle)',
  in_progress: 'var(--color-fill-warning-subtle)',
  review: 'var(--color-fill-primary-subtle)',
  done: 'var(--color-fill-success-subtle)',
  blocked: 'var(--color-fill-error-subtle)',
};

const lineMeta = (line: string) => TASK_LINE_META[line] ?? { label: line, color: '', bg: '' };
const statusMeta = (status: string) => TASK_STATUS_META[status] ?? { label: status, color: '' };

const dueDateValue = computed(() => (task.value?.dueDate ? dayjs(task.value.dueDate) : null));
</script>

<template>
  <a-drawer
    :open="page.drawerOpen"
    title="任务详情"
    width="460"
    :closable="true"
    @close="page.closeDetail"
  >
    <template v-if="task">
      <div class="td-detail__head">
        <div class="td-detail__head-row">
          <span
            class="td-detail__pill"
            :style="{ color: lineMeta(task.line).color, background: lineMeta(task.line).bg }"
          >
            {{ lineMeta(task.line).label }}
          </span>
          <span
            class="td-detail__pill"
            :style="{
              color: statusMeta(task.status).color,
              background: STATUS_BG[task.status] ?? 'var(--color-bg-hover)',
            }"
          >
            {{ statusMeta(task.status).label }}
          </span>
          <span class="td-detail__code">{{ task.id }}</span>
        </div>
        <h3 class="td-detail__title">{{ task.name }}</h3>
      </div>

      <div class="td-detail__rows">
        <div class="td-detail__row">
          <span class="td-detail__label">状态</span>
          <span class="td-detail__value">
            <a-select
              :value="task.status"
              :options="Object.entries(TASK_STATUS_META).map(([value, meta]) => ({ value, label: meta.label }))"
              class="td-detail__control"
              @change="(value: unknown) => page.handleStatusChange(value as typeof task.status)"
            />
          </span>
        </div>
        <div class="td-detail__row">
          <span class="td-detail__label">项目</span>
          <span class="td-detail__value">{{ page.projectMap.get(task.projectId) ?? task.projectId }}</span>
        </div>
        <div class="td-detail__row">
          <span class="td-detail__label">环节</span>
          <span class="td-detail__value">{{ task.stageText || '—' }}</span>
        </div>
        <div class="td-detail__row">
          <span class="td-detail__label">负责人</span>
          <span class="td-detail__value">
            <a-select
              :value="task.assignee"
              :options="page.staffOptions"
              class="td-detail__control"
              show-search
              option-filter-prop="label"
              @change="(value: unknown) => page.handleSavePatch({ assignee: String(value) })"
            />
          </span>
        </div>
        <div class="td-detail__row">
          <span class="td-detail__label">优先级</span>
          <span class="td-detail__value">
            <a-select
              :value="task.priority"
              :options="TASK_PRIORITY_OPTIONS"
              class="td-detail__control"
              @change="(value: unknown) => page.handleSavePatch({ priority: value as typeof task.priority })"
            />
          </span>
        </div>
        <div class="td-detail__row">
          <span class="td-detail__label">截止日期</span>
          <span class="td-detail__value">
            <a-date-picker
              :value="dueDateValue ?? undefined"
              class="td-detail__control"
              @change="(value: string | dayjs.Dayjs) =>
                page.handleSavePatch({ dueDate: dayjs.isDayjs(value) ? value.format('YYYY-MM-DD') : value })"
            />
          </span>
        </div>
        <div class="td-detail__row">
          <span class="td-detail__label">创建时间</span>
          <span class="td-detail__value">{{ task.createdAt ?? '—' }}</span>
        </div>
      </div>

      <div class="td-detail__section-title">描述</div>
      <div class="td-detail__card">
        <a-textarea
          :value="task.description"
          :auto-size="{ minRows: 2, maxRows: 6 }"
          placeholder="暂无描述"
          :bordered="false"
          @blur="(event: FocusEvent) =>
            page.handleSavePatch({ description: (event.target as HTMLTextAreaElement).value || undefined })"
        />
      </div>

      <div class="td-detail__section-title">生成数据</div>
      <div class="td-detail__gen">
        <div class="td-detail__gen-row">
          <span class="td-detail__gen-label">所用模型</span>
          <a-select
            :value="task.genModel"
            :options="genModelGroups"
            class="td-detail__control"
            placeholder="选择生成模型"
            allow-clear
            show-search
            option-filter-prop="label"
            @change="(value: unknown) => page.handleSavePatch({ genModel: value ? String(value) : undefined })"
          />
        </div>
        <div class="td-detail__gen-field">
          <span class="td-detail__gen-label">提示词</span>
          <div class="td-detail__card">
            <a-textarea
              :value="task.prompt"
              :auto-size="{ minRows: 2, maxRows: 6 }"
              placeholder="记录该镜头 / 图像的生成提示词"
              :bordered="false"
              @blur="(event: FocusEvent) =>
                page.handleSavePatch({ prompt: (event.target as HTMLTextAreaElement).value || undefined })"
            />
          </div>
        </div>
        <div class="td-detail__gen-field">
          <span class="td-detail__gen-label">参考图</span>
          <RefImageUploader
            :model-value="task.refImages ?? []"
            :max="3"
            @update:model-value="(value: string[]) =>
              page.handleSavePatch({ refImages: value.length ? value : undefined })"
          />
        </div>
      </div>

      <template v-if="task.reworkReason">
        <div class="td-detail__section-title">返工原因</div>
        <div class="td-detail__rework">
          <ReloadOutlined class="td-detail__rework-icon" />
          <div class="td-detail__rework-text">{{ task.reworkReason }}</div>
        </div>
      </template>
    </template>

    <template #footer>
      <a-space>
        <a-button @click="page.closeDetail">关闭</a-button>
        <a-button v-if="task" @click="page.openRework(task)">
          <template #icon><ReloadOutlined /></template>
          发起返工
        </a-button>
        <a-popconfirm
          v-if="task"
          title="确定删除该任务？"
          ok-text="删除"
          cancel-text="取消"
          @confirm="page.handleDelete(task)"
        >
          <a-button danger>
            <template #icon><DeleteOutlined /></template>
            删除
          </a-button>
        </a-popconfirm>
      </a-space>
    </template>
  </a-drawer>
</template>

<style scoped>
/* 清爽精简风：无实线分隔，头部与内容之间用留白分区 */
:deep(.ant-drawer-header) {
  border-bottom: none;
  padding-bottom: var(--spacing-3);
}

:deep(.ant-drawer-footer) {
  border-top: none;
  padding-top: var(--spacing-3);
}

.td-detail__head {
  margin-bottom: var(--spacing-5);
}

.td-detail__head-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.td-detail__pill {
  display: inline-block;
  padding: 1px 10px;
  border-radius: var(--radius-full);
  font-size: var(--font-size-12);
  line-height: 20px;
}

.td-detail__code {
  margin-left: auto;
  color: var(--color-text-tertiary);
  font-size: var(--font-size-12);
  font-variant-numeric: tabular-nums;
}

.td-detail__title {
  margin: var(--spacing-2) 0 0;
  font-size: var(--font-size-16);
  font-weight: 600;
  color: var(--color-text-primary);
  line-height: 1.4;
  word-break: break-word;
}

.td-detail__rows {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.td-detail__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-4);
}

.td-detail__label {
  flex-shrink: 0;
  font-size: var(--font-size-13);
  color: var(--color-text-tertiary);
}

.td-detail__value {
  min-width: 0;
  font-size: var(--font-size-13);
  color: var(--color-text-primary);
  text-align: right;
}

.td-detail__control {
  width: 200px;
}

.td-detail__section-title {
  margin: var(--spacing-5) 0 var(--spacing-2);
  font-size: var(--font-size-13);
  font-weight: 600;
  color: var(--color-text-secondary);
}

.td-detail__card {
  padding: 2px var(--spacing-3);
  border-radius: var(--radius-3);
  background: var(--color-bg-page-alt);
}

.td-detail__gen {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
}

.td-detail__gen-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-4);
}

.td-detail__gen-field {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.td-detail__gen-label {
  font-size: var(--font-size-13);
  color: var(--color-text-tertiary);
}

.td-detail__rework {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-2);
  padding: var(--spacing-3) var(--spacing-4);
  border-radius: var(--radius-3);
  background: var(--color-fill-warning-subtle);
}

.td-detail__rework-icon {
  margin-top: 2px;
  flex-shrink: 0;
  color: var(--color-feedback-warning);
}

.td-detail__rework-text {
  color: var(--color-feedback-warning);
  font-size: var(--font-size-13);
  line-height: 1.6;
}
</style>
