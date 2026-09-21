import { readDB, writeDB, type DemoProject, type DemoReferenceItem } from '@/shared/mock/db';
import { toSummary, updateProject } from '../api';
import type { ProjectSummary } from '../types';
import type { ProjectDetail, ReferenceScope } from './types';
import { PRODUCTION_PINNED_STORAGE_KEY } from './constants';

/**
 * 项目详情 API 契约层（Mock 实现）
 * 聚合项目 + 核心输出 + 生产统计；参考库 CRUD 走同一 db。
 */

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchProjectDetail(projectId: string): Promise<ProjectDetail | null> {
  await delay(220);
  const db = readDB();
  const project = db.projects.find((item) => item.id === projectId);
  if (!project) return null;

  const projectTasks = db.tasks.filter((task) => task.projectId === projectId);
  const shotTasks = projectTasks.filter((task) => task.line === 'video');

  return {
    project: toSummary(project),
    outputs: db.projectOutputs[projectId] ?? [],
    stats: {
      shotsTotal: shotTasks.length,
      shotsDone: shotTasks.filter((task) => task.status === 'done').length,
      todoTasks: projectTasks.filter((task) => task.status === 'todo').length,
      memberCount: project.members.length,
    },
  };
}

export async function updateProjectDetail(
  projectId: string,
  patch: Partial<Omit<DemoProject, 'id'>>
): Promise<ProjectSummary | null> {
  const updated = await updateProject(projectId, patch);
  return updated;
}

/* ---------------- 参考库 ---------------- */

export async function fetchReferenceItems(projectId: string): Promise<DemoReferenceItem[]> {
  await delay(160);
  return readDB().referenceLibrary.filter((item) => item.projectId === projectId);
}

export async function createReferenceFolder(
  projectId: string,
  scope: ReferenceScope,
  module: string,
  name: string
): Promise<DemoReferenceItem> {
  await delay(160);
  const db = readDB();
  const folder: DemoReferenceItem = {
    id: `rf-folder-${Date.now()}`,
    projectId,
    scope,
    module,
    name,
    kind: 'other',
    isFolder: true,
    parentId: null,
    date: new Date().toISOString().slice(0, 10),
  };
  db.referenceLibrary.push(folder);
  writeDB(db);
  return folder;
}

export async function addReferenceItem(
  projectId: string,
  input: {
    scope: ReferenceScope;
    module: string;
    name: string;
    kind: DemoReferenceItem['kind'];
    parentId: string | null;
  }
): Promise<DemoReferenceItem> {
  await delay(160);
  const db = readDB();
  const item: DemoReferenceItem = {
    id: `rf-${Date.now()}`,
    projectId,
    scope: input.scope,
    module: input.module,
    name: input.name,
    kind: input.kind,
    isFolder: false,
    parentId: input.parentId,
    date: new Date().toISOString().slice(0, 10),
  };
  db.referenceLibrary.push(item);
  writeDB(db);
  return item;
}

export async function renameReferenceItem(id: string, name: string): Promise<void> {
  await delay(120);
  const db = readDB();
  const item = db.referenceLibrary.find((entry) => entry.id === id);
  if (item) {
    item.name = name;
    writeDB(db);
  }
}

export async function deleteReferenceItem(id: string): Promise<void> {
  await delay(140);
  const db = readDB();
  db.referenceLibrary = db.referenceLibrary.filter(
    (entry) => entry.id !== id && entry.parentId !== id
  );
  writeDB(db);
}

/* ---------------- 置顶字段 ---------------- */

function loadPinnedMap(): Record<string, string[]> {
  try {
    const raw = localStorage.getItem(PRODUCTION_PINNED_STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Record<string, string[]>;
  } catch {
    // 损坏时回退空
  }
  return {};
}

export function loadPinnedKeys(projectId: string): string[] {
  return loadPinnedMap()[projectId] ?? [];
}

export function savePinnedKeys(projectId: string, keys: string[]): void {
  const map = loadPinnedMap();
  if (keys.length === 0) {
    delete map[projectId];
  } else {
    map[projectId] = keys;
  }
  localStorage.setItem(PRODUCTION_PINNED_STORAGE_KEY, JSON.stringify(map));
}
