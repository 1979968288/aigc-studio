import { computed, onMounted, ref } from 'vue';
import { message } from 'ant-design-vue';
import {
  fetchStaff,
  createStaff,
  updateStaff,
  deleteStaff,
  setStaffEmploymentStatus,
} from './api';
import { STAFF_DEPT_TREE } from './constants';
import type { StaffItem, StaffQuery, StaffCreateInput, StaffEditorModel } from './types';

/** 人员管理页组合式：部门树 + 列表 + 筛选 + 新增/编辑/离职/删除 */
export function useStaffManagementPage() {
  const list = ref<StaffItem[]>([]);
  const loading = ref(false);
  const keyword = ref('');
  const selectedDeptKey = ref('all');
  const employmentFilter = ref<'all' | 'active' | 'inactive'>('all');
  const roleFilter = ref('');

  const stats = computed(() => ({
    total: list.value.length,
    active: list.value.filter((user) => user.employmentStatus === 'active').length,
    inactive: list.value.filter((user) => user.employmentStatus === 'inactive').length,
  }));

  const deptTree = STAFF_DEPT_TREE;

  const filteredList = computed(() => {
    const kw = keyword.value.trim().toLowerCase();
    if (!kw) return list.value;
    return list.value.filter(
      (user) =>
        user.name.toLowerCase().includes(kw) ||
        user.roleLabel.toLowerCase().includes(kw) ||
        user.department.toLowerCase().includes(kw)
    );
  });

  async function load(): Promise<void> {
    loading.value = true;
    try {
      const query: StaffQuery = {
        keyword: keyword.value,
        department: selectedDeptKey.value,
        employmentStatus: employmentFilter.value,
        role: roleFilter.value,
      };
      list.value = await fetchStaff(query);
    } finally {
      loading.value = false;
    }
  }

  function handleDeptChange(key: string): void {
    selectedDeptKey.value = key;
    void load();
  }

  function handleEmploymentChange(value: unknown): void {
    employmentFilter.value = (value as 'all' | 'active' | 'inactive') || 'all';
    void load();
  }

  function handleRoleChange(value: unknown): void {
    roleFilter.value = typeof value === 'string' ? value : '';
    void load();
  }

  function handleSearch(value: string): void {
    keyword.value = value;
    void load();
  }

  function handleReset(): void {
    keyword.value = '';
    selectedDeptKey.value = 'all';
    employmentFilter.value = 'all';
    roleFilter.value = '';
    void load();
  }

  /** ---------- 新建 / 编辑 ---------- */
  const editorOpen = ref(false);
  const editingItem = ref<StaffItem | null>(null);

  const editorModel = ref<StaffEditorModel>({
    name: '',
    role: 'art_generator',
    roleLabel: '美术生成师',
    department: '美术部',
    employmentStatus: 'active',
    description: '',
    color: '#0055ff',
  });

  function openCreate(): void {
    editingItem.value = null;
    editorModel.value = {
      name: '',
      role: 'art_generator',
      roleLabel: '美术生成师',
      department: '美术部',
      employmentStatus: 'active',
      description: '',
      color: '#0055ff',
    };
    editorOpen.value = true;
  }

  function openEdit(item: StaffItem): void {
    editingItem.value = item;
    editorModel.value = {
      name: item.name,
      role: item.role,
      roleLabel: item.roleLabel,
      department: item.department,
      employmentStatus: item.employmentStatus,
      description: item.description ?? '',
      color: item.color,
    };
    editorOpen.value = true;
  }

  function closeEditor(): void {
    editorOpen.value = false;
    editingItem.value = null;
  }

  async function handleEditorSave(): Promise<void> {
    const name = editorModel.value.name.trim();
    if (!name) {
      message.warning('请输入姓名');
      return;
    }
    if (editingItem.value) {
      const updated = await updateStaff(editingItem.value.id, {
        name,
        role: editorModel.value.role,
        department: editorModel.value.department,
        employmentStatus: editorModel.value.employmentStatus,
        description: editorModel.value.description,
      });
      if (updated) message.success('人员已更新');
    } else {
      const input: StaffCreateInput = {
        name,
        role: editorModel.value.role,
        department: editorModel.value.department,
        employmentStatus: editorModel.value.employmentStatus,
        description: editorModel.value.description,
      };
      await createStaff(input);
      message.success('人员已添加');
    }
    editorOpen.value = false;
    editingItem.value = null;
    void load();
  }

  async function handleToggleEmployment(item: StaffItem): Promise<void> {
    const next = item.employmentStatus === 'active' ? 'inactive' : 'active';
    await setStaffEmploymentStatus(item.id, next);
    message.success(next === 'active' ? '已恢复在职' : '已标记离职');
    void load();
  }

  async function handleDelete(item: StaffItem): Promise<void> {
    await deleteStaff(item.id);
    message.success(`已删除「${item.name}」`);
    void load();
  }

  onMounted(() => {
    void load();
  });

  return {
    list,
    filteredList,
    loading,
    stats,
    deptTree,
    keyword,
    selectedDeptKey,
    employmentFilter,
    roleFilter,
    handleDeptChange,
    handleEmploymentChange,
    handleRoleChange,
    handleSearch,
    handleReset,
    load,
    editorOpen,
    editorModel,
    editingItem,
    openCreate,
    openEdit,
    closeEditor,
    handleEditorSave,
    handleToggleEmployment,
    handleDelete,
  };
}
