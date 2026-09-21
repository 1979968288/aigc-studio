<script setup lang="ts">
import {
  FileTextOutlined,
  HomeOutlined,
  PictureOutlined,
  PlaySquareOutlined,
  PlusOutlined,
  ReloadOutlined,
  RightOutlined,
  SettingOutlined,
  SoundOutlined,
  CloseOutlined,
  FolderAddOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons-vue';
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { message } from 'ant-design-vue';
import { useProjectReferenceLibrary, type ScopeKey } from '../useProjectReferenceLibrary';
import type { ReferenceScope } from '../types';
import { REFERENCE_KIND_LABELS } from '../constants';

defineOptions({ name: 'ProjectReferenceLibraryPanel' });

const props = defineProps<{
  projectId: string;
}>();

const {
  loading,
  activeScope,
  activeKind,
  activeModule,
  activeFolder,
  searchKeyword,
  managementMode,
  selectedItemId,
  editingItemId,
  editingName,
  addModalOpen,
  createFolderOpen,
  cardContextMenu,
  currentScopeLabel,
  visibleModuleOptions,
  visibleGroups,
  kindOptions,
  scopeOptions,
  isGroupCollapsed,
  toggleGroup,
  loadItems,
  refresh,
  handleScopeChange,
  handleKindClick,
  handleModuleClick,
  openItem,
  resetToRoot,
  openCardContextMenu,
  closeCardContextMenu,
  startRename,
  commitRename,
  cancelRename,
  handleDelete,
  handleCreateFolder,
  handleAddReference,
} = useProjectReferenceLibrary(props.projectId);

/* ---------- 卡片视觉辅助 ---------- */
function iconForKind(kind: string): unknown {
  if (kind === 'text') return FileTextOutlined;
  if (kind === 'media') return SoundOutlined;
  return PictureOutlined;
}

function itemKindLabel(kind: string, isFolder: boolean): string {
  return isFolder ? '文件夹' : REFERENCE_KIND_LABELS[kind] ?? '其他';
}

/* ---------- 右键菜单 ---------- */
const contextMenuStyle = computed(() => ({
  left: `${cardContextMenu.x}px`,
  top: `${cardContextMenu.y}px`,
}));

const contextMenuItem = computed(
  () => visibleGroups.value.flatMap((group) => group.items).find((item) => item.id === cardContextMenu.itemId) ?? null
);

function handleContextMenuAction(action: string): void {
  const item = contextMenuItem.value;
  closeCardContextMenu();
  if (!item) return;
  if (action === 'open') {
    openItem(item);
  } else if (action === 'rename') {
    startRename(item);
  } else if (action === 'delete') {
    void handleDelete(item);
  }
}

function onGlobalClick(): void {
  closeCardContextMenu();
}

onMounted(() => {
  void loadItems();
  window.addEventListener('click', onGlobalClick);
});

onBeforeUnmount(() => {
  window.removeEventListener('click', onGlobalClick);
});

/* ---------- 新建文件夹弹窗 ---------- */
const folderForm = reactive({ name: '', scope: 'asset' as ReferenceScope });
const folderModalOpen = computed({
  get: () => createFolderOpen.value,
  set: (value: boolean) => {
    createFolderOpen.value = value;
  },
});

watch(folderModalOpen, (open) => {
  if (open) {
    folderForm.name = '';
    folderForm.scope = activeScope.value === 'all' ? 'asset' : (activeScope.value as ReferenceScope);
  }
});

async function submitCreateFolder(): Promise<void> {
  if (!folderForm.name.trim()) {
    message.warning('请输入文件夹名称');
    return;
  }
  await handleCreateFolder(folderForm.name, folderForm.scope);
  folderModalOpen.value = false;
}

/* ---------- 添加参考弹窗 ---------- */
const addForm = reactive({
  name: '',
  scope: 'asset' as ReferenceScope,
  kind: 'image' as 'image' | 'text' | 'media',
});

watch(addModalOpen, (open) => {
  if (open) {
    addForm.name = '';
    addForm.scope = activeScope.value === 'all' ? 'asset' : (activeScope.value as ReferenceScope);
    addForm.kind = 'image';
  }
});

async function submitAddReference(): Promise<void> {
  if (!addForm.name.trim()) {
    message.warning('请输入参考名称');
    return;
  }
  await handleAddReference({
    name: addForm.name,
    scope: addForm.scope,
    kind: addForm.kind,
    parentId: activeFolder.value?.id ?? null,
  });
  addModalOpen.value = false;
}
</script>

<template>
  <section class="reference-library">
    <!-- 头部 -->
    <header class="reference-library__header">
      <div class="reference-library__title">
        <span class="reference-library__title-icon">
          <PlaySquareOutlined />
        </span>
        <div>
          <h2>项目全局参考资料库</h2>
          <p>资源多端协同 · 权限管控</p>
        </div>
      </div>
    </header>

    <!-- 作用域行 -->
    <div class="reference-library__scope-row">
      <div class="reference-library__scope">
        <button
          v-for="item in scopeOptions"
          :key="item.key"
          type="button"
          class="scope-tab"
          :class="{ 'scope-tab--active': activeScope === item.key }"
          @click="handleScopeChange(item.key as ScopeKey)"
        >
          {{ item.label }}
        </button>
      </div>
      <div class="reference-library__current">
        当前归属分类：
        <a-tag color="geekblue">{{ currentScopeLabel }}</a-tag>
      </div>
    </div>

    <!-- 类型 + 模块行 -->
    <div class="reference-library__kind-row">
      <div class="reference-library__kind-tags">
        <button
          type="button"
          class="kind-tag"
          :class="{ 'kind-tag--active': activeKind === 'all' && !activeModule }"
          @click="handleKindClick(); activeKind = 'all'"
        >
          全部类型
        </button>
        <button
          v-for="kind in kindOptions.slice(1)"
          :key="kind.key"
          type="button"
          class="kind-tag"
          :class="{ 'kind-tag--active': activeKind === kind.key }"
          @click="activeKind = kind.key as typeof activeKind"
        >
          {{ kind.label }}
        </button>
        <span v-if="visibleModuleOptions.length" class="kind-divider" aria-hidden="true" />
        <button
          v-for="module in visibleModuleOptions"
          :key="module"
          type="button"
          class="kind-tag kind-tag--module"
          :class="{ 'kind-tag--active': activeModule === module }"
          @click="handleModuleClick(activeModule === module ? null : module)"
        >
          {{ module }}
        </button>
      </div>
    </div>

    <!-- 操作行 -->
    <div class="reference-library__action-row">
      <a-input
        v-model:value="searchKeyword"
        class="reference-library__search"
        placeholder="搜索文件名"
        allow-clear
      >
        <template #prefix>
          <SearchOutlined />
        </template>
      </a-input>

      <div class="reference-library__actions">
        <a-button @click="folderModalOpen = true">
          <template #icon>
            <FolderAddOutlined />
          </template>
          新建文件夹
        </a-button>
        <a-button @click="refresh(); message.success('已刷新')">
          <template #icon>
            <ReloadOutlined />
          </template>
          刷新
        </a-button>
        <a-button type="primary" @click="addModalOpen = true">
          <template #icon>
            <PlusOutlined />
          </template>
          添加参考
        </a-button>
      </div>
    </div>

    <!-- 浏览区 -->
    <main class="reference-library__browser">
      <div class="reference-library__crumb-row">
        <div class="reference-library__crumb">
          <button type="button" class="crumb-home" @click="resetToRoot">
            <HomeOutlined />
          </button>
          <template v-if="activeFolder">
            <RightOutlined class="crumb-sep" />
            <strong>{{ activeFolder.name }}</strong>
          </template>
          <template v-else-if="activeModule">
            <RightOutlined class="crumb-sep" />
            <button type="button" class="crumb-link" @click="handleModuleClick(null)">
              {{ activeModule }}
            </button>
          </template>
        </div>
        <button
          v-if="managementMode"
          type="button"
          class="exit-manage"
          @click="managementMode = false"
        >
          <CloseOutlined />
          退出管理模式
        </button>
        <a-button v-else size="small" @click="managementMode = true">
          <template #icon>
            <SettingOutlined />
          </template>
          管理资源
        </a-button>
      </div>

      <a-spin :spinning="loading" wrapper-class-name="reference-library__spin">
        <template v-if="visibleGroups.length">
          <section
            v-for="group in visibleGroups"
            :key="group.key"
            class="reference-library__group"
          >
            <div class="reference-library__group-title">
              <button
                type="button"
                class="group-title-main"
                @click="toggleGroup(group.key)"
              >
                <component :is="iconForKind(group.items[0]?.kind ?? 'image')" />
                {{ group.label }}
                <span>{{ group.items.length }}</span>
                <RightOutlined class="group-title-caret" :class="{ 'is-collapsed': isGroupCollapsed(group.key) }" />
              </button>
            </div>

            <div v-if="!isGroupCollapsed(group.key)" class="reference-library__grid">
              <article
                v-for="item in group.items"
                :key="item.id"
                class="reference-card"
                :class="{
                  'reference-card--selected': selectedItemId === item.id,
                  'reference-card--editing': editingItemId === item.id,
                  'reference-card--folder': item.isFolder,
                  'reference-card--manage': managementMode,
                }"
                @click="openItem(item)"
                @contextmenu.stop.prevent="openCardContextMenu($event, item)"
              >
                <div class="reference-card__preview" :class="`reference-card__preview--${item.kind}`">
                  <template v-if="managementMode">
                    <button
                      type="button"
                      class="reference-card__manage-btn reference-card__manage-btn--delete"
                      aria-label="删除资源"
                      @click.stop="handleDelete(item)"
                    >
                      <DeleteOutlined />
                    </button>
                    <button
                      type="button"
                      class="reference-card__manage-btn reference-card__manage-btn--edit"
                      aria-label="编辑资源"
                      @click.stop="startRename(item)"
                    >
                      <EditOutlined />
                    </button>
                  </template>

                  <!-- 文件夹视觉 -->
                  <div v-if="item.isFolder" class="card-folder-visual">
                    <div class="card-folder-stack">
                      <div class="card-folder-back" />
                      <div class="card-folder-front">
                        <span class="card-folder-tab" />
                        <div class="card-folder-lines">
                          <span />
                          <span />
                          <span />
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- 文档视觉 -->
                  <div v-else-if="item.kind === 'text'" class="card-doc-visual">
                    <div class="card-doc-sheet">
                      <div class="card-doc-header">
                        <span>DOC</span>
                        <FileTextOutlined />
                      </div>
                      <div class="card-doc-title-line" />
                      <div class="card-doc-line card-doc-line--long" />
                      <div class="card-doc-line" />
                      <div class="card-doc-line card-doc-line--short" />
                      <div class="card-doc-footer">
                        <span />
                        <span />
                      </div>
                    </div>
                  </div>

                  <!-- 媒体视觉 -->
                  <div v-else-if="item.kind === 'media'" class="card-media-visual">
                    <div class="card-media-screen">
                      <span class="card-media-badge">AV</span>
                      <span class="card-media-play">
                        <PlaySquareOutlined />
                      </span>
                    </div>
                    <div class="card-media-waveform">
                      <span v-for="n in 9" :key="n" :style="{ height: `${20 + ((n * 13) % 60)}%` }" />
                    </div>
                    <div class="card-media-track">
                      <span />
                    </div>
                  </div>

                  <!-- 图片/其他 -->
                  <component
                    v-else
                    :is="iconForKind(item.kind)"
                    class="card-generic-icon"
                  />
                </div>

                <div class="reference-card__body">
                  <input
                    v-if="editingItemId === item.id"
                    v-model="editingName"
                    class="reference-card__rename-input"
                    type="text"
                    maxlength="120"
                    @click.stop
                    @keydown.enter.stop.prevent="commitRename(item)"
                    @keydown.esc.stop.prevent="cancelRename"
                    @blur="commitRename(item)"
                  />
                  <h3 v-else>{{ item.name }}</h3>
                  <div class="reference-card__meta">
                    <span>{{ itemKindLabel(item.kind, item.isFolder) }}</span>
                    <time>{{ item.date }}</time>
                  </div>
                </div>
              </article>
            </div>
          </section>
        </template>

        <div v-else-if="!loading" class="reference-library__empty">
          <h3>暂无参考资料</h3>
          <p>点击右上角「添加参考」上传项目素材，或新建文件夹分类管理。</p>
        </div>
      </a-spin>
    </main>

    <!-- 卡片右键菜单 -->
    <div
      v-if="cardContextMenu.open"
      class="reference-context-menu"
      :style="contextMenuStyle"
      @click.stop
    >
      <button type="button" class="context-menu-item" @click="handleContextMenuAction('open')">
        打开
      </button>
      <button type="button" class="context-menu-item" @click="handleContextMenuAction('rename')">
        重命名
      </button>
      <button type="button" class="context-menu-item context-menu-item--danger" @click="handleContextMenuAction('delete')">
        删除
      </button>
    </div>

    <!-- 新建文件夹弹窗 -->
    <a-modal
      v-model:open="folderModalOpen"
      title="新建文件夹"
      :width="420"
      ok-text="创建"
      cancel-text="取消"
      @ok="submitCreateFolder"
    >
      <a-form layout="vertical">
        <a-form-item label="文件夹名称" required>
          <a-input v-model:value="folderForm.name" placeholder="例如：角色参考包" :maxlength="40" />
        </a-form-item>
        <a-form-item label="归属分类" required>
          <a-select
            v-model:value="folderForm.scope"
            :options="scopeOptions.slice(1).map((item) => ({ label: item.label, value: item.key }))"
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 添加参考弹窗 -->
    <a-modal
      v-model:open="addModalOpen"
      title="添加参考"
      :width="420"
      ok-text="添加"
      cancel-text="取消"
      @ok="submitAddReference"
    >
      <a-form layout="vertical">
        <a-form-item label="参考名称" required>
          <a-input v-model:value="addForm.name" placeholder="例如：角色三视图参考" :maxlength="40" />
        </a-form-item>
        <a-form-item label="归属分类" required>
          <a-select
            v-model:value="addForm.scope"
            :options="scopeOptions.slice(1).map((item) => ({ label: item.label, value: item.key }))"
          />
        </a-form-item>
        <a-form-item label="类型" required>
          <a-select
            v-model:value="addForm.kind"
            :options="[
              { label: '图片', value: 'image' },
              { label: '文本', value: 'text' },
              { label: '音视频', value: 'media' },
            ]"
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </section>
</template>

<style scoped>
.reference-library {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  gap: var(--spacing-3);
}

/* 头部 */
.reference-library__header {
  padding: var(--spacing-3) var(--spacing-4);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-4);
  background: var(--component-panel-background);
}

.reference-library__title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.reference-library__title-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-3);
  background: var(--color-fill-primary-subtle);
  color: var(--color-action-primary);
  font-size: 20px;
}

.reference-library__title h2 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.reference-library__title p {
  margin: 2px 0 0;
  font-size: 12px;
  color: var(--color-text-tertiary);
}

/* 作用域行 */
.reference-library__scope-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--spacing-2);
}

.reference-library__scope {
  display: inline-flex;
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-3);
  overflow: hidden;
}

.scope-tab {
  height: 30px;
  padding: 0 14px;
  border: 0;
  background: var(--component-panel-background);
  color: var(--color-text-secondary);
  font-size: 13px;
  cursor: pointer;
  transition:
    background-color 0.15s ease,
    color 0.15s ease;
}

.scope-tab + .scope-tab {
  border-left: 1px solid var(--color-border-default);
}

.scope-tab:hover {
  color: var(--color-action-primary);
}

.scope-tab--active {
  background: var(--color-fill-primary-subtle);
  color: var(--color-action-primary);
  font-weight: 600;
}

.reference-library__current {
  font-size: 12px;
  color: var(--color-text-tertiary);
}

/* 类型行 */
.kind-tags {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--spacing-2);
}

.kind-tag {
  height: 26px;
  padding: 0 12px;
  border: 1px solid transparent;
  border-radius: var(--radius-full);
  background: transparent;
  color: var(--color-text-secondary);
  font-size: 12px;
  cursor: pointer;
  transition:
    background-color 0.15s ease,
    color 0.15s ease;
}

.kind-tag:hover {
  color: var(--color-action-primary);
}

.kind-tag--active {
  border-color: color-mix(in srgb, var(--color-action-primary) 38%, transparent);
  background: var(--color-fill-primary-subtle);
  color: var(--color-action-primary);
  font-weight: 600;
}

.kind-divider {
  width: 1px;
  height: 14px;
  background: var(--color-border-default);
}

/* 操作行 */
.reference-library__action-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--spacing-2);
}

.reference-library__search {
  width: 240px;
}

.reference-library__actions {
  display: flex;
  gap: var(--spacing-2);
}

/* 浏览区 */
.reference-library__browser {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-4);
  background: var(--component-panel-background);
  padding: var(--spacing-3) var(--spacing-4);
}

.reference-library__spin {
  height: 100%;
}

.reference-library__crumb-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-3);
}

.reference-library__crumb {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--color-text-secondary);
}

.crumb-home {
  width: 26px;
  height: 26px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-2);
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
}

.crumb-home:hover {
  color: var(--color-action-primary);
  border-color: var(--color-border-strong);
}

.crumb-sep {
  font-size: 10px;
  color: var(--color-text-tertiary);
}

.crumb-link {
  border: 0;
  background: transparent;
  color: var(--color-action-link);
  cursor: pointer;
  padding: 0;
}

.exit-manage {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  padding: 0 10px;
  border: 1px solid color-mix(in srgb, var(--color-action-primary) 40%, transparent);
  border-radius: var(--radius-3);
  background: var(--color-fill-primary-subtle);
  color: var(--color-action-primary);
  font-size: 12px;
  cursor: pointer;
}

/* 分组 */
.reference-library__group {
  margin-bottom: var(--spacing-4);
}

.reference-library__group-title {
  margin-bottom: var(--spacing-2);
}

.group-title-main {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 0;
  background: transparent;
  color: var(--color-text-secondary);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
}

.group-title-main span {
  color: var(--color-text-tertiary);
  font-weight: 500;
}

.group-title-main:hover {
  color: var(--color-action-primary);
}

.group-title-caret {
  font-size: 10px;
  transition: transform 0.2s ease;
}

.group-title-caret.is-collapsed {
  transform: rotate(90deg);
}

/* 卡片网格 */
.reference-library__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: var(--spacing-3);
}

.reference-card {
  position: relative;
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-3);
  background: var(--component-card-background);
  overflow: hidden;
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

.reference-card:hover {
  border-color: var(--color-border-strong);
  box-shadow: var(--shadow-card-hover);
}

.reference-card--selected {
  border-color: var(--color-action-primary);
  box-shadow: 0 0 0 1px var(--color-action-primary);
}

.reference-card__preview {
  position: relative;
  aspect-ratio: 4 / 3;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--component-card-background-soft);
  border-bottom: 1px solid var(--color-border-divider);
}

/* 管理模式按钮 */
.reference-card__manage-btn {
  position: absolute;
  top: 6px;
  z-index: 2;
  width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: var(--radius-2);
  color: #fff;
  font-size: 12px;
  cursor: pointer;
}

.reference-card__manage-btn--delete {
  right: 6px;
  background: var(--color-feedback-error);
}

.reference-card__manage-btn--edit {
  right: 34px;
  background: var(--color-action-primary);
}

/* 文件夹视觉 */
.card-folder-stack {
  position: relative;
  width: 72px;
  height: 52px;
}

.card-folder-back {
  position: absolute;
  inset: 6px -4px -4px 6px;
  border-radius: var(--radius-2);
  background: color-mix(in srgb, var(--color-action-primary) 12%, transparent);
}

.card-folder-front {
  position: absolute;
  inset: 0;
  border-radius: var(--radius-2);
  background: color-mix(in srgb, var(--color-action-primary) 22%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-action-primary) 40%, transparent);
  overflow: hidden;
}

.card-folder-tab {
  position: absolute;
  top: -6px;
  left: 8px;
  width: 22px;
  height: 10px;
  border-radius: 4px 4px 0 0;
  background: color-mix(in srgb, var(--color-action-primary) 48%, transparent);
}

.card-folder-lines {
  position: absolute;
  left: 12px;
  right: 12px;
  top: 14px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.card-folder-lines span {
  height: 3px;
  border-radius: 2px;
  background: color-mix(in srgb, var(--color-action-primary) 30%, transparent);
}

/* 文档视觉 */
.card-doc-sheet {
  width: 84px;
  height: 96px;
  border-radius: 4px;
  background: var(--component-card-background);
  border: 1px solid var(--color-border-default);
  box-shadow: var(--shadow-sm);
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.card-doc-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 9px;
  font-weight: 700;
  color: var(--color-action-primary);
  border-bottom: 1px solid var(--color-border-divider);
  padding-bottom: 4px;
}

.card-doc-title-line {
  height: 6px;
  width: 60%;
  border-radius: 2px;
  background: var(--color-fill-primary-subtle);
}

.card-doc-line {
  height: 3px;
  width: 100%;
  border-radius: 2px;
  background: var(--color-border-divider);
}

.card-doc-line--long {
  width: 88%;
}

.card-doc-line--short {
  width: 45%;
}

.card-doc-footer {
  margin-top: auto;
  display: flex;
  justify-content: space-between;
}

.card-doc-footer span {
  width: 14px;
  height: 3px;
  border-radius: 2px;
  background: var(--color-border-divider);
}

/* 媒体视觉 */
.card-media-visual {
  width: 96px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.card-media-screen {
  position: relative;
  height: 52px;
  border-radius: var(--radius-2);
  background: linear-gradient(135deg, color-mix(in srgb, var(--color-action-primary) 26%, transparent), color-mix(in srgb, var(--color-action-primary) 8%, transparent));
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-media-badge {
  position: absolute;
  top: 4px;
  left: 4px;
  font-size: 9px;
  font-weight: 700;
  color: #fff;
  background: color-mix(in srgb, black 45%, transparent);
  border-radius: 2px;
  padding: 0 4px;
}

.card-media-play {
  font-size: 18px;
  color: #fff;
  text-shadow: 0 0 8px color-mix(in srgb, black 60%, transparent);
}

.card-media-waveform {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 3px;
  height: 16px;
}

.card-media-waveform span {
  width: 3px;
  border-radius: 1px;
  background: color-mix(in srgb, var(--color-action-primary) 45%, transparent);
}

.card-media-track {
  height: 4px;
  border-radius: 2px;
  background: var(--color-border-divider);
  overflow: hidden;
}

.card-media-track span {
  display: block;
  width: 65%;
  height: 100%;
  background: var(--color-action-primary);
}

.card-generic-icon {
  font-size: 34px;
  color: var(--color-text-disabled);
}

/* 卡片主体 */
.reference-card__body {
  padding: 8px 10px;
}

.reference-card__body h3 {
  margin: 0;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.reference-card__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 4px;
  font-size: 11px;
  color: var(--color-text-tertiary);
}

.reference-card__rename-input {
  width: 100%;
  height: 24px;
  padding: 0 4px;
  border: 1px solid var(--color-action-primary);
  border-radius: var(--radius-2);
  font-size: 12px;
  outline: none;
}

/* 空态 */
.reference-library__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: var(--spacing-8) 0;
}

.reference-library__empty h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.reference-library__empty p {
  margin: 0;
  font-size: 12px;
  color: var(--color-text-tertiary);
}

/* 右键菜单 */
.reference-context-menu {
  position: fixed;
  z-index: 1000;
  min-width: 120px;
  padding: 4px;
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-3);
  background: var(--component-popover-background, var(--component-panel-background));
  box-shadow: var(--shadow-floating, var(--shadow-card-hover));
}

.context-menu-item {
  display: block;
  width: 100%;
  height: 30px;
  padding: 0 10px;
  border: 0;
  border-radius: var(--radius-2);
  background: transparent;
  color: var(--color-text-secondary);
  font-size: 13px;
  text-align: left;
  cursor: pointer;
}

.context-menu-item:hover {
  background: var(--color-bg-hover);
  color: var(--color-action-primary);
}

.context-menu-item--danger:hover {
  background: var(--color-fill-error-subtle);
  color: var(--color-feedback-error);
}
</style>
