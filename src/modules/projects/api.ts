import { readDB, writeDB, type DemoProject } from '@/shared/mock/db';
import type {
  ProjectSummary,
  ProjectCreateInput,
  PipelineTemplate,
  PipelineTemplateKey,
} from './types';
import { PROJECT_STATUS_META, PIPELINE_TEMPLATE_LABELS } from './constants';

/**
 * 项目 API 契约层（Mock 实现）
 * 函数签名对齐未来真实后端：list / create / update / delete / favorite。
 */

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function toSummary(
  project: ReturnType<typeof readDB>['projects'][number]
): ProjectSummary {
  const statusMeta = PROJECT_STATUS_META[String(project.status)] ?? {
    label: '未知',
    color: 'var(--color-text-secondary)',
    bgColor: 'var(--color-bg-disabled)',
  };
  return {
    id: project.id,
    name: project.name,
    type_name: project.type_name,
    status: project.status,
    statusLabel: statusMeta.label,
    statusColor: statusMeta.color,
    statusBg: statusMeta.bgColor,
    progress: project.progress,
    favorited: project.favorited,
    owner: project.owner,
    planned_delivery: project.planned_delivery,
    create_time: project.create_time,
    description: project.description,
    pipeline_template: project.pipeline_template,
    pipelineLabel: PIPELINE_TEMPLATE_LABELS[project.pipeline_template] ?? project.pipeline_template,
    pipelineSteps:
      readDB().pipelineTemplates.find((template) => template.key === project.pipeline_template)
        ?.steps ?? [],
    members: project.members,
    segmentMembers: project.segmentMembers ?? [],
    project_alias: project.project_alias,
    nicknames: project.nicknames,
    project_level: project.project_level,
    product_name: project.product_name,
    director: project.director,
    producer: project.producer,
    create_by: project.create_by,
    approval_date: project.approval_date,
    actual_delivery: project.actual_delivery,
    health_score: project.health_score,
    risk_level: project.risk_level,
    references: project.references,
    total_episodes: project.total_episodes,
    episode_duration: project.episode_duration,
    duration_minutes: project.duration_minutes,
    schedule: project.schedule,
    languages: project.languages,
    resolution: project.resolution,
    frame_rate: project.frame_rate,
    budget: project.budget,
    has_lip_sync: project.has_lip_sync,
    has_digital_assets: project.has_digital_assets,
    gen_model: project.gen_model,
  };
}

export async function fetchProjects(): Promise<ProjectSummary[]> {
  await delay(200);
  return readDB().projects.map(toSummary);
}

export async function fetchPipelineTemplates(): Promise<PipelineTemplate[]> {
  await delay(120);
  return readDB().pipelineTemplates;
}

export async function createProject(input: ProjectCreateInput): Promise<ProjectSummary> {
  await delay(280);
  const db = readDB();
  const createTime = new Date().toISOString().slice(0, 10);
  const project: DemoProject = {
    id: `p-${Date.now()}`,
    name: input.name,
    type_name: input.type_name,
    status: 1,
    progress: 0,
    favorited: false,
    owner: input.owner,
    planned_delivery: input.planned_delivery,
    create_time: createTime,
    description: input.description,
    pipeline_template: input.pipeline_template,
    members: input.members,
    segmentMembers: input.segmentMembers,
    project_alias: input.project_alias,
    nicknames: '',
    project_level: (input.project_level || 'B') as DemoProject['project_level'],
    product_name: input.product_name,
    director: input.director,
    producer: input.producer,
    create_by: input.owner,
    approval_date: input.approval_date,
    actual_delivery: input.actual_delivery,
    health_score: null,
    risk_level: 0,
    references: input.references,
    total_episodes: null,
    episode_duration: null,
    duration_minutes: input.duration_minutes,
    schedule: '',
    languages: input.languages,
    resolution: input.resolution,
    frame_rate: input.frame_rate,
    budget: input.budget,
    has_lip_sync: input.has_lip_sync,
    has_digital_assets: input.has_digital_assets,
    gen_model: input.gen_model,
    business_type: input.business_type,
    test_label: input.test_label,
    application_date: input.application_date,
    initiator: input.initiator,
    initiator_position: input.initiator_position,
    department: input.department,
    production_start: input.production_start,
    production_end: input.production_end,
    has_ai_voice: input.has_ai_voice,
    has_digital_human: input.has_digital_human,
    has_style_lora: input.has_style_lora,
  };
  db.projects.unshift(project);
  writeDB(db);
  return toSummary(project);
}

export async function deleteProject(id: string): Promise<void> {
  await delay(180);
  const db = readDB();
  db.projects = db.projects.filter((project) => project.id !== id);
  writeDB(db);
}

export async function toggleFavorite(id: string): Promise<ProjectSummary[]> {
  await delay(120);
  const db = readDB();
  const project = db.projects.find((item) => item.id === id);
  if (project) {
    project.favorited = !project.favorited;
    writeDB(db);
  }
  return db.projects.map(toSummary);
}

export async function updateProject(
  id: string,
  patch: Partial<Omit<DemoProject, 'id'>>
): Promise<ProjectSummary | null> {
  await delay(200);
  const db = readDB();
  const project = db.projects.find((item) => item.id === id);
  if (project) {
    Object.assign(project, patch);
    writeDB(db);
    return toSummary(project);
  }
  return null;
}

export { PIPELINE_TEMPLATE_LABELS };
export type { PipelineTemplateKey };
