import { computed, reactive, ref, watch } from 'vue';
import { message } from 'ant-design-vue';
import type { DemoReferenceItem } from '@/shared/mock/db';
import {
  addReferenceItem,
  createReferenceFolder,
  deleteReferenceItem,
  fetchReferenceItems,
  renameReferenceItem,
} from './api';
import {
  REFERENCE_KIND_OPTIONS,
  REFERENCE_MODULES_BY_SCOPE,
  REFERENCE_SCOPE_OPTIONS,
} from './constants';
import type { ReferenceGroup, ReferenceScope } from './types';

export type ScopeKey = 'all' | ReferenceScope;
export type FileKind = 'all' | DemoReferenceItem['kind'];

export function useProjectReferenceLibrary(projectId: string) {
  const items = ref<DemoReferenceItem[]>([]);
  const loading = ref(false);
  const activeScope = ref<ScopeKey>('all');
  const activeKind = ref<FileKind>('all');
  const activeModule = ref<string | null>(null);
  const activeFolderId = ref<string | null>(null);
  const searchKeyword = ref('');
  const managementMode = ref(false);
  const selectedItemId = ref<string | null>(null);
  const editingItemId = ref<string | null>(null);
  const editingName = ref('');
  const addModalOpen = ref(false);
  const createFolderOpen = ref(false);
  const collapsedGroups = ref<string[]>([]);

  const cardContextMenu = reactive({ open: false, x: 0, y: 0, itemId: '' });

  const currentScopeLabel = computed(
    () =>
      REFERENCE_SCOPE_OPTIONS.find((item) => item.key === activeScope.value)?.label ?? '全部资料'
  );

  const activeFolder = computed(
    () => items.value.find((item) => item.id === activeFolderId.value && item.isFolder) ?? null
  );

  /** 当前作用域可见的模块列表（用于模块行 chips） */
  const visibleModuleOptions = computed(() => {
    if (activeScope.value === 'all') return [];
    return REFERENCE_MODULES_BY_SCOPE[activeScope.value] ?? [];
  });

  function matchesScope(item: DemoReferenceItem): boolean {
    return activeScope.value === 'all' || item.scope === activeScope.value;
  }

  function matchesKind(item: DemoReferenceItem): boolean {
    return activeKind.value === 'all' || item.kind === activeKind.value;
  }

  function matchesModule(item: DemoReferenceItem): boolean {
    return !activeModule.value || item.module === activeModule.value;
  }

  function matchesKeyword(item: DemoReferenceItem): boolean {
    const keyword = searchKeyword.value.trim();
    return !keyword || item.name.toLowerCase().includes(keyword.toLowerCase());
  }

  /** 可见条目（含文件夹，未进文件夹时） */
  const rootItems = computed(() =>
    items.value.filter(
      (item) =>
        item.parentId === null &&
        matchesScope(item) &&
        matchesKind(item) &&
        matchesModule(item) &&
        matchesKeyword(item)
    )
  );

  const visibleGroups = computed<ReferenceGroup[]>(() => {
    if (activeFolder.value) {
      return [
        {
          key: activeFolder.value.id,
          label: activeFolder.value.name,
          items: items.value.filter(
            (item) => item.parentId === activeFolder.value!.id && matchesKeyword(item)
          ),
        },
      ];
    }
    const groups = new Map<string, DemoReferenceItem[]>();
    for (const item of rootItems.value) {
      if (!groups.has(item.module)) groups.set(item.module, []);
      groups.get(item.module)?.push(item);
    }
    return Array.from(groups.entries()).map(([module, entries]) => ({
      key: module,
      label: module,
      items: entries,
    }));
  });

  function isGroupCollapsed(key: string): boolean {
    return collapsedGroups.value.includes(key);
  }

  function toggleGroup(key: string): void {
    const index = collapsedGroups.value.indexOf(key);
    if (index >= 0) {
      collapsedGroups.value.splice(index, 1);
    } else {
      collapsedGroups.value.push(key);
    }
  }

  async function loadItems(): Promise<void> {
    const requestId = ++latestRequestId;
    loading.value = true;
    try {
      const list = await fetchReferenceItems(projectId);
      if (requestId !== latestRequestId) return;
      items.value = list;
    } catch (error) {
      console.error('load reference items failed', error);
      message.error('参考库加载失败');
    } finally {
      if (requestId === latestRequestId) {
        loading.value = false;
      }
    }
  }

  let latestRequestId = 0;

  function refresh(): void {
    void loadItems();
  }

  function handleScopeChange(scope: ScopeKey): void {
    activeScope.value = scope;
    activeModule.value = null;
    activeFolderId.value = null;
  }

  function handleKindClick(): void {
    activeModule.value = null;
    activeFolderId.value = null;
  }

  function handleModuleClick(module: string | null): void {
    activeModule.value = module;
    activeFolderId.value = null;
  }

  function openItem(item: DemoReferenceItem): void {
    if (item.isFolder) {
      activeFolderId.value = item.id;
      return;
    }
    selectedItemId.value = item.id;
  }

  function resetToRoot(): void {
    activeFolderId.value = null;
  }

  function openCardContextMenu(event: MouseEvent, item: DemoReferenceItem): void {
    cardContextMenu.open = true;
    cardContextMenu.x = event.clientX;
    cardContextMenu.y = event.clientY;
    cardContextMenu.itemId = item.id;
  }

  function closeCardContextMenu(): void {
    cardContextMenu.open = false;
  }

  function startRename(item: DemoReferenceItem): void {
    editingItemId.value = item.id;
    editingName.value = item.name;
  }

  async function commitRename(item: DemoReferenceItem): Promise<void> {
    const next = editingName.value.trim();
    editingItemId.value = null;
    if (!next || next === item.name) return;
    try {
      await renameReferenceItem(item.id, next);
      item.name = next;
      message.success('已重命名');
    } catch (error) {
      console.error('rename reference item failed', error);
      message.error('重命名失败');
    }
  }

  function cancelRename(): void {
    editingItemId.value = null;
  }

  async function handleDelete(item: DemoReferenceItem): Promise<void> {
    try {
      await deleteReferenceItem(item.id);
      if (activeFolderId.value === item.id) activeFolderId.value = null;
      await loadItems();
      message.success('已删除');
    } catch (error) {
      console.error('delete reference item failed', error);
      message.error('删除失败');
    }
  }

  async function handleCreateFolder(name: string, scope: ReferenceScope): Promise<void> {
    const module = REFERENCE_MODULES_BY_SCOPE[scope]?.[0] ?? '';
    await createReferenceFolder(projectId, scope, module, name.trim() || '新建文件夹');
    await loadItems();
    message.success('文件夹已创建');
  }

  async function handleAddReference(input: {
    name: string;
    scope: ReferenceScope;
    kind: DemoReferenceItem['kind'];
    parentId: string | null;
  }): Promise<void> {
    const module = REFERENCE_MODULES_BY_SCOPE[input.scope]?.[0] ?? '';
    await addReferenceItem(projectId, { ...input, module, name: input.name.trim() });
    await loadItems();
    message.success('参考已添加');
  }

  watch(activeScope, () => undefined);

  return {
    items,
    loading,
    activeScope,
    activeKind,
    activeModule,
    activeFolderId,
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
    kindOptions: REFERENCE_KIND_OPTIONS,
    scopeOptions: REFERENCE_SCOPE_OPTIONS,
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
  };
}

export type ProjectReferenceLibraryContext = ReturnType<typeof useProjectReferenceLibrary>;
