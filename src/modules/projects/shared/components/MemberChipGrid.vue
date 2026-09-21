<script setup lang="ts">
import { CheckOutlined, StarFilled, StarOutlined } from '@ant-design/icons-vue';
import type { DemoUser } from '@/constants/roles';

defineOptions({ name: 'MemberChipGrid' });

const props = withDefaults(
  defineProps<{
    /** 候选人（已按角色分组过滤） */
    users: DemoUser[];
    /** 已勾选的成员 userId */
    selectedIds: string[];
    /** 默认负责人 userId */
    principalId?: string;
    /** 是否展示默认负责人切换（仅负责人分组使用） */
    showPrincipal?: boolean;
    emptyText?: string;
  }>(),
  {
    principalId: '',
    showPrincipal: false,
    emptyText: '该角色暂无在职成员',
  }
);

const emit = defineEmits<{
  (event: 'toggle', userId: string): void;
  (event: 'set-principal', userId: string): void;
}>();

function isSelected(userId: string): boolean {
  return props.selectedIds.includes(userId);
}
</script>

<template>
  <div v-if="users.length > 0" class="chip-grid">
    <button
      v-for="user in users"
      :key="user.id"
      type="button"
      :class="['member-chip', { 'member-chip--active': isSelected(user.id) }]"
      @click="emit('toggle', user.id)"
    >
      <span class="member-chip__avatar" :style="{ background: user.color }">
        {{ user.name.charAt(0) }}
      </span>
      <span class="member-chip__meta">
        <strong class="member-chip__name">{{ user.name }}</strong>
        <small class="member-chip__sub">{{ user.department }}</small>
      </span>
      <span
        v-if="showPrincipal && isSelected(user.id)"
        class="member-chip__star"
        :class="{ 'member-chip__star--active': principalId === user.id }"
        :title="principalId === user.id ? '默认负责人' : '设为默认负责人'"
        @click.stop="emit('set-principal', user.id)"
      >
        <StarFilled v-if="principalId === user.id" />
        <StarOutlined v-else />
      </span>
      <CheckOutlined v-else-if="isSelected(user.id)" class="member-chip__check" />
    </button>
  </div>
  <p v-else class="chip-grid-empty">{{ emptyText }}</p>
</template>

<style scoped>
.chip-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(184px, 1fr));
  gap: var(--spacing-2);
}

.member-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border: 0;
  border-radius: var(--radius-3);
  background: var(--color-bg-page-alt);
  cursor: pointer;
  text-align: left;
  transition: background-color 0.15s ease;
}

.member-chip:hover {
  background: var(--color-bg-hover);
}

.member-chip--active {
  background: var(--color-fill-primary-subtle);
}

.member-chip__avatar {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-full);
  color: #fff;
  font-size: 12px;
  flex-shrink: 0;
}

.member-chip__meta {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.member-chip__name {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.member-chip__sub {
  font-size: 11px;
  color: var(--color-text-tertiary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.member-chip__check {
  flex-shrink: 0;
  font-size: 12px;
  color: var(--color-action-primary);
}

.member-chip__star {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: var(--radius-full);
  font-size: 12px;
  color: var(--color-text-quaternary, var(--color-text-tertiary));
}

.member-chip__star--active {
  color: var(--color-action-primary);
}

.chip-grid-empty {
  margin: 0;
  padding: var(--spacing-3);
  border-radius: var(--radius-3);
  background: var(--color-bg-page-alt);
  color: var(--color-text-tertiary);
  font-size: 12px;
}
</style>
