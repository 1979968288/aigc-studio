import { computed, inject, provide, reactive, ref, watch } from 'vue';
import type { ComputedRef, InjectionKey, Ref } from 'vue';
import { message } from 'ant-design-vue';
import { DEMO_USERS, type DemoUser, type RoleCode } from '@/constants/roles';
import {
  readDB,
  type DemoProject,
  type DemoProjectDemand,
  type DemoProjectMember,
  type DemoProjectSegmentMember,
} from '@/shared/mock/db';
import {
  buildSegmentStates,
  collectSegmentOwnerIds,
  segmentStatesToMembers,
  setSegmentGroupSelection,
  toggleSegmentMember,
  type SegmentState,
} from '../../shared/segmentMembers';
import { findStaffById, readStaffList } from '@/modules/staff/api';
import { useAuthStore } from '@/stores/auth';
import { createProject } from '../../api';
import type { ProjectCreateInput } from '../../types';
import {
  BUSINESS_TYPE_OPTIONS,
  CREATE_PROJECT_STEPS,
  FRAME_RATE_OPTIONS,
  GEN_MODEL_OPTIONS,
  LANGUAGE_OPTIONS,
  PROJECT_LEVEL_OPTIONS,
  PROJECT_TOGGLE_CARDS,
  PROJECT_TYPES,
  RESOLUTION_OPTIONS,
  TEST_LABEL_OPTIONS,
  type StepTemplateCard,
} from './createProjectModalOptions';

export type { SegmentState };

/** 表单数据（对齐 KK formData 结构，映射 AIGC 域） */
export interface CreateProjectFormData {
  name: string;
  projectAlias: string;
  projectLevel: DemoProject['project_level'] | '';
  businessType: 0 | 1;
  productName: string;
  initiatorId: string;
  initiatorPosition: string;
  department: string;
  pmId: string;
  directorId: string[];
  producerId: string[];
  applicationDate: string;
  approvalDate: string;
  plannedDeliveryDate: string;
  productionStart: string;
  productionEnd: string;
  durationMinutes: number | null;
  languages: string[];
  resolution: string;
  frameRate: string;
  budget: number | null;
  testLabel: DemoProject['test_label'] | '';
  description: string;
  referenceWorks: string;
  genModel: string;
  hasLipSync: 0 | 1;
  hasDigitalAssets: 0 | 1;
  hasAiVoice: 0 | 1;
  hasDigitalHuman: 0 | 1;
  hasStyleLora: 0 | 1;
}

function buildDefaultFormData(): CreateProjectFormData {
  return {
    name: '',
    projectAlias: '',
    projectLevel: '',
    businessType: 0,
    productName: '',
    initiatorId: '',
    initiatorPosition: '',
    department: '',
    pmId: '',
    directorId: [],
    producerId: [],
    applicationDate: '',
    approvalDate: '',
    plannedDeliveryDate: '',
    productionStart: '',
    productionEnd: '',
    durationMinutes: null,
    languages: [],
    resolution: '',
    frameRate: '',
    budget: null,
    testLabel: '',
    description: '',
    referenceWorks: '',
    genModel: '',
    hasLipSync: 0,
    hasDigitalAssets: 0,
    hasAiVoice: 0,
    hasDigitalHuman: 0,
    hasStyleLora: 0,
  };
}

/** 按管线模板的工序链生成环节配置（角色要求来自固定工序→角色映射表） */
function buildSegmentsFromTemplate(templateKey: string): SegmentState[] {
  const db = readDB();
  const template = db.pipelineTemplates.find((item) => item.key === templateKey);
  if (!template) return [];
  const staff = readStaffList().filter((user) => user.employmentStatus === 'active');
  return buildSegmentStates(template.steps, staff);
}

/** 需求池 → 模板选项 */
function buildDemandTemplateCards(): StepTemplateCard[] {
  const db = readDB();
  return db.pipelineTemplates.map((template, index) => {
    const firstType = PROJECT_TYPES[0];
    const matchedType =
      PROJECT_TYPES.find((type) => type.name === '短片') ?? firstType;
    return {
      id: template.key,
      name: template.label,
      description: template.description,
      projectTypeId: matchedType.id,
      projectTypeName: matchedType.name,
      projectTypeColor: matchedType.color,
      isDefault: index === 0,
      steps: template.steps,
    };
  });
}

export interface CreateProjectModalContext {
  currentStep: Ref<number>;
  totalSteps: number;
  steps: typeof CREATE_PROJECT_STEPS;
  isFirstStep: ComputedRef<boolean>;
  isLastStep: ComputedRef<boolean>;
  submitButtonDisabled: ComputedRef<boolean>;
  submitting: Ref<boolean>;
  formData: CreateProjectFormData;
  demands: Ref<DemoProjectDemand[]>;
  selectedDemandId: Ref<string>;
  selectedDemand: ComputedRef<DemoProjectDemand | null>;
  selectedTemplateId: Ref<string>;
  templates: Ref<StepTemplateCard[]>;
  currentTemplates: ComputedRef<StepTemplateCard[]>;
  mappedProjectTypeName: ComputedRef<string>;
  mappedProjectTypeColor: ComputedRef<string>;
  segments: Ref<SegmentState[]>;
  validationErrors: Record<string, string>;
  fieldHelp: (field: string) => string;
  clearFieldError: (field: string) => void;
  noModelConfirmVisible: Ref<boolean>;
  noModelConfirmCountdown: Ref<number>;
  closeNoModelConfirm: () => void;
  handleDemandChange: (value: string) => void;
  handleTemplateSelect: (templateId: string) => void;
  handleProjectTypeSelect: (typeId: string) => void;
  handleInitiatorChange: (userId: string) => void;
  handleToggleCard: (key: string) => void;
  handleToggleSwitch: (key: string, checked: boolean | number | string) => void;
  handleGenModelChange: (value: unknown) => void;
  handleSegmentOwnerToggle: (segment: SegmentState, userId: string) => void;
  handleSegmentOwnerSelectAll: (segment: SegmentState, selected: boolean) => void;
  handleSegmentParticipantToggle: (segment: SegmentState, userId: string) => void;
  handleSegmentParticipantSelectAll: (segment: SegmentState, selected: boolean) => void;
  handleSegmentPrincipalChange: (segment: SegmentState, userId: string) => void;
  handlePrevious: () => void;
  handleNext: () => void;
  handleClose: () => void;
  userOptions: ComputedRef<Array<{ label: string; value: string }>>;
  currentUser: ComputedRef<DemoUser>;
  optionGroups: {
    businessTypeOptions: typeof BUSINESS_TYPE_OPTIONS;
    testLabelOptions: typeof TEST_LABEL_OPTIONS;
    projectLevelOptions: typeof PROJECT_LEVEL_OPTIONS;
    languageOptions: typeof LANGUAGE_OPTIONS;
    resolutionOptions: typeof RESOLUTION_OPTIONS;
    frameRateOptions: typeof FRAME_RATE_OPTIONS;
    genModelOptions: typeof GEN_MODEL_OPTIONS;
  };
  toggleCards: typeof PROJECT_TOGGLE_CARDS;
}

export const CREATE_PROJECT_MODAL_CONTEXT_KEY: InjectionKey<CreateProjectModalContext> =
  Symbol('create-project-modal-context');

export function useCreateProjectModalController(
  props: { open: Ref<boolean> },
  emit: { (event: 'update:open', value: boolean): void; (event: 'created'): void }
): CreateProjectModalContext {
  const currentStep = ref(1);
  const submitting = ref(false);
  const formData = reactive<CreateProjectFormData>(buildDefaultFormData());
  const demands = ref<DemoProjectDemand[]>([]);
  const selectedDemandId = ref('');
  const selectedTemplateId = ref<string>('');
  const templates = ref<StepTemplateCard[]>([]);
  const segments = ref<SegmentState[]>([]);
  const validationErrors = reactive<Record<string, string>>({});
  const noModelConfirmVisible = ref(false);
  const noModelConfirmCountdown = ref(0);

  /** 当前登录用户（默认制片） */
  const authStore = useAuthStore();
  const currentUser = computed(() => authStore.currentUser ?? DEMO_USERS[0]);

  /** 候选人员：实时读人员集合（仅在职） */
  const userOptions = computed(() =>
    readStaffList()
      .filter((user) => user.employmentStatus === 'active')
      .map((user) => ({ label: `${user.name}（${user.roleLabel}）`, value: user.id }))
  );

  const selectedDemand = computed(
    () => demands.value.find((item) => item.id === selectedDemandId.value) ?? null
  );

  const currentTemplates = computed(() => {
    const selectedType = templates.value.find(
      (item) => item.id === selectedTemplateId.value
    );
    const typeId = selectedType?.projectTypeId;
    if (!typeId) return templates.value;
    return templates.value.filter((item) => item.projectTypeId === typeId);
  });

  const mappedProjectType = computed(() => {
    const selected = templates.value.find((item) => item.id === selectedTemplateId.value);
    return PROJECT_TYPES.find((type) => type.id === selected?.projectTypeId) ?? null;
  });

  const mappedProjectTypeName = computed(() => mappedProjectType.value?.name ?? '未配置');
  const mappedProjectTypeColor = computed(() => mappedProjectType.value?.color ?? '');

  const totalSteps = CREATE_PROJECT_STEPS.length;
  const isFirstStep = computed(() => currentStep.value === 1);
  const isLastStep = computed(() => currentStep.value === totalSteps);

  const isStepOneComplete = computed(
    () =>
      Boolean(selectedDemandId.value) &&
      formData.name.trim().length > 0 &&
      Boolean(selectedTemplateId.value)
  );

  const submitButtonDisabled = computed(() => {
    if (currentStep.value === 1) return !isStepOneComplete.value;
    if (currentStep.value === 3) {
      return (
        !formData.name.trim() ||
        !formData.initiatorId ||
        !formData.applicationDate ||
        !formData.plannedDeliveryDate ||
        !formData.testLabel
      );
    }
    if (currentStep.value === 4) return !formData.genModel;
    return false;
  });

  let countdownTimer: ReturnType<typeof setInterval> | null = null;

  function closeNoModelConfirm(): void {
    noModelConfirmVisible.value = false;
    if (countdownTimer) {
      clearInterval(countdownTimer);
      countdownTimer = null;
    }
  }

  function openNoModelConfirm(): void {
    noModelConfirmVisible.value = true;
    noModelConfirmCountdown.value = 3;
    if (countdownTimer) clearInterval(countdownTimer);
    countdownTimer = setInterval(() => {
      noModelConfirmCountdown.value -= 1;
      if (noModelConfirmCountdown.value <= 0) {
        closeNoModelConfirm();
      }
    }, 1000);
  }

  function fieldHelp(field: string): string {
    return validationErrors[field] ?? '';
  }

  function clearFieldError(field: string): void {
    delete validationErrors[field];
  }

  /** 选择需求单 → 自动回填（对齐 KK applySelectedOaProjectDefaults） */
  function applyDemandDefaults(demand: DemoProjectDemand | null): void {
    if (!demand) {
      formData.name = '';
      formData.projectLevel = '';
      formData.businessType = 0;
      formData.productName = '';
      formData.initiatorId = '';
      formData.initiatorPosition = '';
      formData.department = '';
      formData.directorId = [];
      formData.producerId = [];
      formData.applicationDate = '';
      formData.plannedDeliveryDate = '';
      formData.description = '';
      selectedTemplateId.value = '';
      return;
    }
    const initiator = findStaffById(demand.initiator_id);
    formData.name = demand.title;
    formData.projectLevel = demand.project_level;
    formData.businessType = demand.business_type;
    formData.productName = demand.client_name;
    formData.initiatorId = demand.initiator_id;
    formData.initiatorPosition = initiator?.roleLabel ?? '';
    formData.department = initiator?.roleLabel === '导演' ? '创作部' : '制作中心';
    formData.directorId = [];
    formData.producerId = [];
    formData.applicationDate = demand.application_date;
    formData.plannedDeliveryDate = demand.planned_delivery;
    formData.description = demand.remark;
  }

  function handleDemandChange(value: string): void {
    selectedDemandId.value = value;
    clearFieldError('demand');
    clearFieldError('name');
    clearFieldError('template');
    const demand = demands.value.find((item) => item.id === value) ?? null;
    applyDemandDefaults(demand);
  }

  function handleTemplateSelect(templateId: string): void {
    selectedTemplateId.value = templateId;
    clearFieldError('template');
  }

  function handleProjectTypeSelect(typeId: string): void {
    const inType = templates.value.filter((item) => item.projectTypeId === typeId);
    if (inType.length === 0) return;
    const defaultCard = inType.find((item) => item.isDefault) ?? inType[0];
    selectedTemplateId.value = defaultCard.id;
    clearFieldError('template');
  }

  function handleInitiatorChange(userId: string): void {
    formData.initiatorId = userId;
    clearFieldError('initiatorId');
    const user = findStaffById(userId);
    formData.initiatorPosition = user?.roleLabel ?? '';
    formData.department = user?.roleLabel === '导演' ? '创作部' : '制作中心';
  }

  function handleToggleCard(key: string): void {
    const card = PROJECT_TOGGLE_CARDS.find((item) => item.key === key);
    if (!card) return;
    const field = card.field as keyof CreateProjectFormData;
    const next = formData[field] === 1 ? 0 : 1;
    (formData as Record<string, unknown>)[field] = next;
  }

  function handleToggleSwitch(key: string, checked: boolean | number | string): void {
    const enabled = checked === true || checked === 1 || checked === '1';
    const card = PROJECT_TOGGLE_CARDS.find((item) => item.key === key);
    if (!card) return;
    const field = card.field as keyof CreateProjectFormData;
    const currentEnabled = formData[field] === 1;
    if (enabled !== currentEnabled) {
      (formData as Record<string, unknown>)[field] = enabled ? 1 : 0;
    }
  }

  function handleGenModelChange(value: unknown): void {
    clearFieldError('genModel');
    const model = Array.isArray(value)
      ? String(value[0] ?? '')
      : value == null
        ? ''
        : String(value);
    formData.genModel = model;
    if (model === '') {
      openNoModelConfirm();
    } else {
      closeNoModelConfirm();
    }
  }

  /** 默认负责人兜底：原默认负责人被移出时顺延到首位负责人 */
  function syncPrincipal(segment: SegmentState): void {
    const ownerIds = collectSegmentOwnerIds(segment);
    if (!ownerIds.includes(segment.principalUserId)) {
      segment.principalUserId = ownerIds[0] ?? '';
    }
  }

  function handleSegmentOwnerToggle(segment: SegmentState, userId: string): void {
    toggleSegmentMember(segment.ownerGroups, userId);
    syncPrincipal(segment);
  }

  function handleSegmentOwnerSelectAll(segment: SegmentState, selected: boolean): void {
    setSegmentGroupSelection(segment.ownerGroups, selected);
    syncPrincipal(segment);
  }

  function handleSegmentParticipantToggle(segment: SegmentState, userId: string): void {
    toggleSegmentMember(segment.participantGroups, userId);
  }

  function handleSegmentParticipantSelectAll(segment: SegmentState, selected: boolean): void {
    setSegmentGroupSelection(segment.participantGroups, selected);
  }

  function handleSegmentPrincipalChange(segment: SegmentState, userId: string): void {
    if (!collectSegmentOwnerIds(segment).includes(userId)) return;
    segment.principalUserId = userId;
  }

  /** 步骤校验（对齐 KK validateCurrentStep） */
  function validateCurrentStep(): boolean {
    if (currentStep.value === 1) {
      if (!selectedDemandId.value) validationErrors.demand = '请选择需求单';
      if (!formData.name.trim()) validationErrors.name = '请输入项目标题';
      if (!selectedTemplateId.value) validationErrors.template = '请选择模板';
      return !validationErrors.demand && !validationErrors.name && !validationErrors.template;
    }
    if (currentStep.value === 3) {
      if (!formData.initiatorId) validationErrors.initiatorId = '请选择项目立项人';
      if (!formData.applicationDate) validationErrors.applicationDate = '请选择申请日期';
      if (!formData.plannedDeliveryDate) {
        validationErrors.plannedDeliveryDate = '请选择计划交付日期';
      }
      if (!formData.testLabel) validationErrors.testLabel = '请选择测试标签';
      return Object.keys(validationErrors).length === 0;
    }
    if (currentStep.value === 4) {
      if (!formData.genModel) validationErrors.genModel = '请选择主要生成模型';
      return !validationErrors.genModel;
    }
    return true;
  }

  function handlePrevious(): void {
    if (!isFirstStep.value) currentStep.value -= 1;
  }

  function handleNext(): void {
    if (!validateCurrentStep()) return;
    if (isLastStep.value) {
      void handleSubmit();
      return;
    }
    currentStep.value += 1;
    // Step2 进入时按当前模板构建环节配置
    if (currentStep.value === 2) {
      segments.value = buildSegmentsFromTemplate(selectedTemplateId.value);
    }
  }

  async function handleSubmit(): Promise<void> {
    if (submitting.value) return;
    submitting.value = true;
    try {
      /** 汇总成员：显式角色优先（导演/制片），其余按岗位；仅接收在职人员 */
      const memberMap = new Map<string, DemoProjectMember>();
      const joinDate = new Date().toISOString().slice(0, 10);
      const addMember = (userId: string, projectRole?: RoleCode): void => {
        if (!userId || memberMap.has(userId)) return;
        const user = findStaffById(userId);
        if (!user || user.employmentStatus !== 'active') return;
        memberMap.set(userId, {
          userId,
          projectRole: projectRole ?? user.role,
          joinedAt: joinDate,
        });
      };
      const ownerId = formData.pmId || currentUser.value.id;
      formData.directorId.forEach((id) => addMember(id, 'director'));
      formData.producerId.forEach((id) => addMember(id, 'producer'));
      addMember(formData.initiatorId);
      addMember(ownerId);
      segments.value.forEach((segment) => {
        segment.ownerGroups.forEach((group) => group.selectedUserIds.forEach((id) => addMember(id)));
        segment.participantGroups.forEach((group) =>
          group.selectedUserIds.forEach((id) => addMember(id))
        );
      });

      const segmentMembers: DemoProjectSegmentMember[] = segmentStatesToMembers(segments.value);

      const input: ProjectCreateInput = {
        name: formData.name.trim(),
        type_name: mappedProjectTypeName.value,
        description: formData.description,
        pipeline_template: (selectedTemplateId.value ||
          'standard') as ProjectCreateInput['pipeline_template'],
        members: [...memberMap.values()],
        segmentMembers,
        owner: ownerId,
        planned_delivery: formData.plannedDeliveryDate,
        project_alias: formData.projectAlias,
        project_level: formData.projectLevel || 'B',
        product_name: formData.productName,
        director: formData.directorId[0] || ownerId,
        producer: formData.producerId[0] || ownerId,
        approval_date: formData.approvalDate,
        actual_delivery: '',
        references: formData.referenceWorks,
        duration_minutes: formData.durationMinutes,
        languages: formData.languages.join('、'),
        resolution: formData.resolution,
        frame_rate: formData.frameRate,
        budget: formData.budget,
        has_lip_sync: formData.hasLipSync,
        has_digital_assets: formData.hasDigitalAssets,
        gen_model: formData.genModel,
        business_type: formData.businessType,
        test_label: (formData.testLabel || 'none') as DemoProject['test_label'],
        application_date: formData.applicationDate,
        initiator: formData.initiatorId,
        initiator_position: formData.initiatorPosition,
        department: formData.department,
        production_start: formData.productionStart,
        production_end: formData.productionEnd,
        has_ai_voice: formData.hasAiVoice,
        has_digital_human: formData.hasDigitalHuman,
        has_style_lora: formData.hasStyleLora,
      };
      await createProject(input);
      message.success('项目创建成功');
      emit('created');
      handleClose();
    } catch (error) {
      console.error('create project failed', error);
      message.error('项目创建失败，请重试');
    } finally {
      submitting.value = false;
    }
  }

  function resetForm(): void {
    Object.assign(formData, buildDefaultFormData());
    selectedDemandId.value = '';
    selectedTemplateId.value = '';
    segments.value = [];
    Object.keys(validationErrors).forEach((key) => delete validationErrors[key]);
    closeNoModelConfirm();
  }

  function handleClose(): void {
    currentStep.value = 1;
    resetForm();
    emit('update:open', false);
  }

  function initializeVisibleState(): void {
    currentStep.value = 1;
    const db = readDB();
    demands.value = db.projectDemands;
    templates.value = buildDemandTemplateCards();
    Object.keys(validationErrors).forEach((key) => delete validationErrors[key]);
    resetForm();
  }

  watch(
    () => props.open,
    (open) => {
      if (open) initializeVisibleState();
    },
    { immediate: true }
  );

  return {
    currentStep,
    totalSteps,
    steps: CREATE_PROJECT_STEPS,
    isFirstStep,
    isLastStep,
    submitButtonDisabled,
    submitting,
    formData,
    demands,
    selectedDemandId,
    selectedDemand,
    selectedTemplateId,
    templates,
    currentTemplates,
    mappedProjectTypeName,
    mappedProjectTypeColor,
    segments,
    validationErrors,
    fieldHelp,
    clearFieldError,
    noModelConfirmVisible,
    noModelConfirmCountdown,
    closeNoModelConfirm,
    handleDemandChange,
    handleTemplateSelect,
    handleProjectTypeSelect,
    handleInitiatorChange,
    handleToggleCard,
    handleToggleSwitch,
    handleGenModelChange,
    handleSegmentOwnerToggle,
    handleSegmentOwnerSelectAll,
    handleSegmentParticipantToggle,
    handleSegmentParticipantSelectAll,
    handleSegmentPrincipalChange,
    handlePrevious,
    handleNext,
    handleClose,
    userOptions,
    currentUser,
    optionGroups: {
      businessTypeOptions: BUSINESS_TYPE_OPTIONS,
      testLabelOptions: TEST_LABEL_OPTIONS,
      projectLevelOptions: PROJECT_LEVEL_OPTIONS,
      languageOptions: LANGUAGE_OPTIONS,
      resolutionOptions: RESOLUTION_OPTIONS,
      frameRateOptions: FRAME_RATE_OPTIONS,
      genModelOptions: GEN_MODEL_OPTIONS,
    },
    toggleCards: PROJECT_TOGGLE_CARDS,
  };
}

export function provideCreateProjectModal(context: CreateProjectModalContext): void {
  provide(CREATE_PROJECT_MODAL_CONTEXT_KEY, context);
}

export function useCreateProjectModalContext(): CreateProjectModalContext {
  const context = inject(CREATE_PROJECT_MODAL_CONTEXT_KEY);
  if (!context) {
    throw new Error('CreateProjectModal context not provided');
  }
  return context;
}
