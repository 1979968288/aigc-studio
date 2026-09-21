import { h } from 'vue';
import type { TableColumnsType } from 'ant-design-vue';
import {
  ASSET_STATUS_META,
  RISK_LEVEL_META,
  SCENE_STATUS_META,
  TASK_STATUS_META,
} from '@/modules/production/constants';
import { resolveStaffName } from '@/modules/staff/api';
import type {
  CheckStatus,
  DataListAllCategory,
  DataListAllRow,
  DataListAssetRow,
  DataListSceneRow,
  DataListTab,
  DataListTaskRow,
} from './types';

export const DATA_LIST_TABS: { key: DataListTab; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'scene', label: '场次' },
  { key: 'task', label: '任务' },
  { key: 'asset', label: '资产' },
  { key: 'script', label: '剧本' },
];

/** 搜索框占位文案（按 Tab 切换） */
export const DATA_LIST_SEARCH_PLACEHOLDER: Record<DataListTab, string> = {
  all: '全部字段',
  script: '剧本名 / 幕 / 场段 / 文本',
  scene: '场次号 / 名称 / 地点 / 负责人',
  task: '编号 / 场次 / 工序 / 负责人',
  asset: '编号 / 名称 / 类型 / 制作',
};

/** 统计区标题（按 Tab 切换，对齐 KK「核心指标统计」命名） */
export const DATA_LIST_STATS_TITLE: Record<DataListTab, string> = {
  all: '全部核心指标统计',
  script: '剧本结构统计',
  scene: '场次核心指标统计',
  task: '任务核心指标统计',
  asset: '资产核心指标统计',
};

/** 统计卡「总数」名词（按 Tab 切换） */
export const DATA_LIST_TOTAL_NOUN: Record<DataListTab, string> = {
  all: '对象',
  script: '剧本段',
  scene: '场次',
  task: '任务',
  asset: '资产',
};

/** 全部 Tab 类别标签色（四类对象同表混排时的区分色） */
export const DATA_LIST_CATEGORY_META: Record<
  DataListAllCategory,
  { label: string; color: string; bg: string }
> = {
  剧本: { label: '剧本', color: '#7c3aed', bg: 'rgba(124, 58, 237, 0.1)' },
  场次: { label: '场次', color: 'var(--color-feedback-info)', bg: 'var(--color-fill-info-subtle)' },
  任务: { label: '任务', color: 'var(--color-feedback-warning)', bg: 'var(--color-fill-warning-subtle)' },
  资产: { label: '资产', color: 'var(--color-feedback-success)', bg: 'var(--color-fill-success-subtle)' },
};

/** 核对状态元数据（对齐 KK 数据修复状态：需要修复/已修复/无需修复） */
export const CHECK_STATUS_META: Record<CheckStatus, { label: string; color: string }> = {
  need_fix: { label: '需要修复', color: 'var(--color-feedback-warning)' },
  fixed: { label: '已修复', color: 'var(--color-feedback-success)' },
  ok: { label: '无需修复', color: 'var(--color-text-tertiary)' },
};

function statusDot(meta: { label: string; color: string }) {
  return h('span', { class: 'dl-cell-status' }, [
    h('i', { class: 'dl-cell-status__dot', style: { background: meta.color } }),
    meta.label,
  ]);
}

function coloredText(text: string, color: string) {
  return h('span', { style: { color } }, text);
}

function passOrPending(value: string) {
  const pass = value === 'PASS';
  return coloredText(
    pass ? '通过' : '待检',
    pass ? 'var(--color-feedback-success)' : 'var(--color-text-tertiary)'
  );
}

/** 核对状态单元格：需要修复时附带问题数（对齐 KK「done/total」计数） */
function checkStatusCell(record: { checkStatus: CheckStatus; issues?: string[] }) {
  const meta = CHECK_STATUS_META[record.checkStatus];
  const issueCount = record.issues?.length ?? 0;
  const label =
    record.checkStatus === 'need_fix' && issueCount > 0
      ? `${meta.label} · ${issueCount} 项`
      : meta.label;
  return h(
    'span',
    { class: 'dl-issue-chip', style: { color: meta.color, borderColor: meta.color } },
    label
  );
}

const CHECK_COLUMN: TableColumnsType[number] = {
  title: '核对状态',
  dataIndex: 'checkStatus',
  key: 'checkStatus',
  width: 130,
  customRender: ({ record }) => checkStatusCell(record),
};

/** 类别标签（全部 Tab：四类对象同表混排的区分标记） */
function categoryTag(category: DataListAllCategory) {
  const meta = DATA_LIST_CATEGORY_META[category];
  return h(
    'span',
    { class: 'dl-category-tag', style: { color: meta.color, background: meta.bg } },
    meta.label
  );
}

/** 全部 Tab 列（四类对象打平为统一列，不分类分区） */
export const ALL_COLUMNS: TableColumnsType = [
  {
    title: '类型',
    dataIndex: 'category',
    key: 'category',
    width: 90,
    customRender: ({ record }) => categoryTag((record as DataListAllRow).category),
  },
  { title: '编号', dataIndex: 'code', key: 'code', width: 130 },
  { title: '名称', dataIndex: 'name', key: 'name' },
  {
    title: '状态',
    dataIndex: 'statusText',
    key: 'statusText',
    width: 110,
    customRender: ({ record }) => {
      const row = record as DataListAllRow;
      return row.statusText === '—'
        ? coloredText('—', 'var(--color-text-tertiary)')
        : statusDot({ label: row.statusText, color: row.statusColor });
    },
  },
  CHECK_COLUMN,
];

export const SCRIPT_COLUMNS: TableColumnsType = [
  { title: '剧本', dataIndex: 'scriptName', key: 'scriptName' },
  { title: '版本', dataIndex: 'versionNo', key: 'versionNo', width: 80 },
  { title: '幕', dataIndex: 'actName', key: 'actName', width: 120 },
  { title: '场段', dataIndex: 'sceneTitle', key: 'sceneTitle', width: 200 },
  { title: '段落预览', dataIndex: 'preview', key: 'preview' },
];

export const SCENE_COLUMNS: TableColumnsType = [
  { title: '场次号', dataIndex: 'sceneNo', key: 'sceneNo', width: 110 },
  { title: '名称', dataIndex: 'name', key: 'name' },
  {
    title: '类型 · 时长',
    dataIndex: 'type',
    key: 'type',
    width: 150,
    customRender: ({ record }) => `${record.type} · ${record.duration}`,
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 100,
    customRender: ({ record }) => statusDot(SCENE_STATUS_META[record.status as DataListSceneRow['status']]),
  },
  {
    title: '风险',
    dataIndex: 'riskLevel',
    key: 'riskLevel',
    width: 90,
    customRender: ({ record }) =>
      coloredText(
        RISK_LEVEL_META[record.riskLevel as DataListSceneRow['riskLevel']].label,
        RISK_LEVEL_META[record.riskLevel as DataListSceneRow['riskLevel']].color
      ),
  },
  { title: '地点', dataIndex: 'location', key: 'location', width: 130 },
  {
    title: '负责人',
    dataIndex: 'assigneeName',
    key: 'assigneeName',
    width: 100,
    customRender: ({ record }) => resolveStaffName(record.assigneeName),
  },
  { title: '排期', dataIndex: 'schedule', key: 'schedule', width: 120 },
  { title: '任务数', dataIndex: 'tasks', key: 'tasks', width: 90 },
  {
    title: '资产就绪',
    dataIndex: 'assetsReady',
    key: 'assetsReady',
    width: 100,
    customRender: ({ record }) => `${record.assetsReady}/${record.assetsTotal}`,
  },
  CHECK_COLUMN,
];

export const TASK_COLUMNS: TableColumnsType = [
  { title: '编号', dataIndex: 'code', key: 'code', width: 90 },
  { title: '所属场次', dataIndex: 'sceneName', key: 'sceneName', width: 180 },
  { title: '工序', dataIndex: 'stage', key: 'stage', width: 120 },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 100,
    customRender: ({ record }) => statusDot(TASK_STATUS_META[record.status as DataListTaskRow['status']]),
  },
  {
    title: '负责人',
    dataIndex: 'responsible',
    key: 'responsible',
    width: 100,
    customRender: ({ record }) => resolveStaffName(record.responsible),
  },
  { title: '部门', dataIndex: 'department', key: 'department', width: 100 },
  {
    title: '时间',
    dataIndex: 'startTime',
    key: 'startTime',
    width: 150,
    customRender: ({ record }) => `${record.startTime}–${record.endTime}`,
  },
  { title: '进度', dataIndex: 'progress', key: 'progress', width: 90 },
  { title: '描述', dataIndex: 'description', key: 'description' },
  CHECK_COLUMN,
];

export const ASSET_COLUMNS: TableColumnsType = [
  { title: '编号', dataIndex: 'id', key: 'id', width: 100 },
  { title: '名称', dataIndex: 'name', key: 'name' },
  { title: '类型', dataIndex: 'assetType', key: 'assetType', width: 100 },
  { title: '版本', dataIndex: 'version', key: 'version', width: 80 },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 100,
    customRender: ({ record }) => statusDot(ASSET_STATUS_META[record.status as DataListAssetRow['status']]),
  },
  {
    title: '制作',
    dataIndex: 'artist',
    key: 'artist',
    width: 100,
    customRender: ({ record }) => resolveStaffName(record.artist),
  },
  {
    title: '大小 / 格式',
    dataIndex: 'size',
    key: 'size',
    width: 140,
    customRender: ({ record }) => `${record.size} ${record.format}`.trim(),
  },
  {
    title: '引用场次',
    dataIndex: 'usedInScenes',
    key: 'usedInScenes',
    width: 200,
    customRender: ({ record }) => (record.usedInScenes ?? []).join('、') || '-',
  },
  {
    title: '质检',
    dataIndex: 'qualityCheck',
    key: 'qualityCheck',
    width: 90,
    customRender: ({ record }) => passOrPending(record.qualityCheck),
  },
  CHECK_COLUMN,
];
