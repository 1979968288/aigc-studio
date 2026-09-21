import { readDB, writeDB } from '@/shared/mock/db';
import type { PCAsset } from '@/modules/production/types';
import type { AssetListItem, AssetVersionRecord } from './types';

/**
 * 资产清单 API 契约层（Mock 实现）
 * 复用制作工坊的 production.assets 数据，保证两处入口同源。
 */

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function readAssets(projectId: string): PCAsset[] {
  return readDB().production[projectId]?.assets ?? [];
}

function writeAssets(projectId: string, assets: PCAsset[]): void {
  const db = readDB();
  if (!db.production[projectId]) {
    db.production[projectId] = { scripts: [], scenes: [], tasks: [], assets: [] };
  }
  db.production[projectId].assets = assets;
  writeDB(db);
}

/** 依据当前版本号派生一段确定性的版本历史，用于详情层下钻展示 */
function buildVersionHistory(asset: PCAsset): AssetVersionRecord[] {
  const current = asset.version || 'v1.0';
  const match = /^v(\d+)\.(\d+)$/.exec(current);
  const records: AssetVersionRecord[] = [];

  if (match) {
    const major = Number(match[1]);
    for (let i = 1; i <= major; i += 1) {
      const ver = `v${i}.0`;
      if (ver === current) continue;
      records.push({
        id: `${asset.id}-${ver}`,
        version: ver,
        status: '已发布',
        updatedAt: `v${i}.0 迭代`,
        note: `${i === 1 ? '初版' : '迭代更新'}`,
      });
    }
  }

  records.push({
    id: `${asset.id}-${current}`,
    version: current,
    status: asset.status,
    updatedAt: '当前版本',
    note: '当前版本',
  });

  return records.reverse();
}

function enrich(asset: PCAsset): AssetListItem {
  return { ...asset, versions: buildVersionHistory(asset) };
}

/** 读取资产清单 */
export async function fetchAssets(projectId: string): Promise<AssetListItem[]> {
  await delay(140);
  return readAssets(projectId).map(enrich);
}

/** 新建资产 */
export async function createAsset(projectId: string, input: PCAsset): Promise<AssetListItem> {
  await delay(120);
  const assets = readAssets(projectId);
  assets.push(input);
  writeAssets(projectId, assets);
  return enrich(input);
}

/** 更新资产 */
export async function updateAsset(projectId: string, asset: PCAsset): Promise<AssetListItem> {
  await delay(120);
  const assets = readAssets(projectId);
  const index = assets.findIndex((item) => item.id === asset.id);
  if (index >= 0) {
    assets[index] = asset;
    writeAssets(projectId, assets);
  }
  return enrich(asset);
}

/** 删除资产 */
export async function deleteAsset(projectId: string, assetId: string): Promise<void> {
  await delay(120);
  writeAssets(
    projectId,
    readAssets(projectId).filter((item) => item.id !== assetId)
  );
}