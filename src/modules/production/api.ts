import { readDB, writeDB } from '@/shared/mock/db';
import type {
  PCScene,
  PCTask,
  PCAsset,
  ProductionData,
} from './types';

/**
 * 制作工坊 API 契约层（Mock 实现）
 * 函数签名对齐未来真实后端：list / create / update / delete。
 */

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const EMPTY_PRODUCTION: ProductionData = { scripts: [], scenes: [], tasks: [], assets: [] };

function readProduction(projectId: string): ProductionData {
  const db = readDB();
  return db.production[projectId] ?? EMPTY_PRODUCTION;
}

function writeProduction(projectId: string, data: ProductionData): void {
  const db = readDB();
  db.production[projectId] = data;
  writeDB(db);
}

/** 读取制作工坊整份数据 */
export async function fetchProduction(projectId: string): Promise<ProductionData> {
  await delay(150);
  return readProduction(projectId);
}

/** ---------- 场次 ---------- */

export async function addScene(projectId: string, input: PCScene): Promise<PCScene> {
  await delay(120);
  const data = readProduction(projectId);
  data.scenes.push(input);
  writeProduction(projectId, data);
  return input;
}

export async function updateScene(projectId: string, scene: PCScene): Promise<PCScene> {
  await delay(120);
  const data = readProduction(projectId);
  const index = data.scenes.findIndex((item) => item.id === scene.id);
  if (index >= 0) {
    data.scenes[index] = scene;
    writeProduction(projectId, data);
  }
  return scene;
}

export async function deleteScene(projectId: string, sceneId: string): Promise<void> {
  await delay(120);
  const data = readProduction(projectId);
  data.scenes = data.scenes.filter((item) => item.id !== sceneId);
  data.tasks = data.tasks.filter((item) => item.sceneId !== sceneId);
  writeProduction(projectId, data);
}

/** ---------- 任务 ---------- */

export async function addTask(projectId: string, input: PCTask): Promise<PCTask> {
  await delay(120);
  const data = readProduction(projectId);
  data.tasks.push(input);
  // 同步更新场次的关联任务计数
  const scene = data.scenes.find((item) => item.id === input.sceneId);
  if (scene) {
    scene.tasks = data.tasks.filter((item) => item.sceneId === scene.id).length;
  }
  writeProduction(projectId, data);
  return input;
}

export async function updateTask(projectId: string, task: PCTask): Promise<PCTask> {
  await delay(120);
  const data = readProduction(projectId);
  const index = data.tasks.findIndex((item) => item.id === task.id);
  if (index >= 0) {
    data.tasks[index] = task;
    writeProduction(projectId, data);
  }
  return task;
}

export async function deleteTask(projectId: string, taskId: string): Promise<void> {
  await delay(120);
  const data = readProduction(projectId);
  const target = data.tasks.find((item) => item.id === taskId);
  data.tasks = data.tasks.filter((item) => item.id !== taskId);
  if (target) {
    const scene = data.scenes.find((item) => item.id === target.sceneId);
    if (scene) {
      scene.tasks = data.tasks.filter((item) => item.sceneId === scene.id).length;
    }
  }
  writeProduction(projectId, data);
}

/** ---------- 资产 ---------- */

export async function addAsset(projectId: string, input: PCAsset): Promise<PCAsset> {
  await delay(120);
  const data = readProduction(projectId);
  data.assets.push(input);
  writeProduction(projectId, data);
  return input;
}

export async function updateAsset(projectId: string, asset: PCAsset): Promise<PCAsset> {
  await delay(120);
  const data = readProduction(projectId);
  const index = data.assets.findIndex((item) => item.id === asset.id);
  if (index >= 0) {
    data.assets[index] = asset;
    writeProduction(projectId, data);
  }
  return asset;
}

export async function deleteAsset(projectId: string, assetId: string): Promise<void> {
  await delay(120);
  const data = readProduction(projectId);
  data.assets = data.assets.filter((item) => item.id !== assetId);
  writeProduction(projectId, data);
}