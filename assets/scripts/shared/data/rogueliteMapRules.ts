import type { RogueliteMapRoomType } from "./rogueliteRoomTypes";
import { ROGUELITE_STAGE_SCALING } from "./rogueliteBalance";

export interface RogueliteMapLayerRule {
  stageModulo: number;
  nodeCount: 1 | 2 | 3 | 4;
  notes: string;
}

export interface RogueliteMapDesignRule {
  item: string;
  currentRule: string;
  notes: string;
}

export interface RogueliteMapRouteSuggestion {
  phase: "early" | "mid" | "late";
  recommendedNodeCount: 1 | 2 | 3;
  recommendedRooms: readonly RogueliteMapRoomType[];
  purpose: string;
  notes: string;
}

export interface RogueliteMapNodeDraft {
  id: string;
  stage: number;
  branch: number;
  type: RogueliteMapRoomType;
  x: number;
  enemyTemplateId?: string;
  bossTemplateId?: string;
}

export interface RogueliteMapConnectionInput {
  id: string;
  x: number;
}

export const ROGUELITE_MAP_RULES = {
  pregenAhead: 10,
  lookBack: 1,
  worldBaseY: 3200,
  stageGapY: 125,
  cycleLength: 15,
  branchX: {
    1: [50],
    2: [35, 65],
    3: [24, 50, 76],
    4: [17, 39, 61, 83],
  },
  layerPattern: [
    { stageModulo: 1, nodeCount: 1, notes: "起点或收束层" },
    { stageModulo: 2, nodeCount: 2, notes: "普通分叉" },
    { stageModulo: 3, nodeCount: 3, notes: "主要选择层" },
    { stageModulo: 4, nodeCount: 2, notes: "收束层" },
    { stageModulo: 5, nodeCount: 3, notes: "事件/商店混合层" },
    { stageModulo: 6, nodeCount: 2, notes: "普通分叉" },
    { stageModulo: 7, nodeCount: 3, notes: "精英风险层" },
    { stageModulo: 8, nodeCount: 2, notes: "休息/奖励层" },
    { stageModulo: 0, nodeCount: 1, notes: "远端 Boss 目标层" },
  ] satisfies readonly RogueliteMapLayerRule[],
  typePattern: ["normal", "event", "rest", "shop", "elite", "boss", "normal", "shop", "event", "elite", "boss", "reward", "event", "rest", "boss"] satisfies readonly RogueliteMapRoomType[],
  cycleLayers: {
    1: ["normal"],
    2: ["normal", "event"],
    3: ["normal", "rest"],
    4: ["normal", "event", "shop"],
    5: ["normal", "elite"],
    6: ["boss"],
    7: ["normal", "event"],
    8: ["normal", "shop", "elite"],
    9: ["rest", "event", "normal"],
    10: ["elite", "normal"],
    11: ["boss"],
    12: ["reward", "shop"],
    13: ["normal", "elite", "event"],
    14: ["rest", "reward"],
    15: ["boss"],
  } satisfies Readonly<Partial<Record<number, readonly RogueliteMapRoomType[]>>>,
  routePools: [
    ["normal", "elite", "event"],
    ["normal", "rest", "elite"],
    ["elite", "normal", "shop"],
    ["normal", "event", "reward"],
    ["normal", "shop", "rest"],
  ] satisfies readonly (readonly RogueliteMapRoomType[])[],
  maxConnectionsFromNode: 2,
  maxConnectionsBetweenLayers: 6,
} as const;

export function getRogueliteCycleStage(stage: number): number {
  return ((stage - 1) % ROGUELITE_MAP_RULES.cycleLength) + 1;
}

export const ROGUELITE_MAP_DESIGN_RULES = [
  { item: "可见未来层", currentRule: "当前关后预生成 10 层", notes: "UI 只渲染视口附近节点。" },
  { item: "层节点数", currentRule: "以 2-3 个为主", notes: "起点和部分收束层为 1 个。" },
  { item: "4 节点层", currentRule: "暂不作为主要节奏", notes: "后续可小规模加入。" },
  { item: "单节点连接数", currentRule: "最多 2 条", notes: "保持路线清楚。" },
  { item: "相邻层总连线", currentRule: "约 3-5 条", notes: "避免一团线；当前生成上限为 4 条。" },
  { item: "Boss 节奏", currentRule: "作为远处目标出现", notes: "当前战斗节奏仍由 Boss 间隔配置控制。" },
  { item: "路线目标", currentRule: "左 / 中 / 右尽量清楚", notes: "让玩家一眼看懂风险。" },
] as const satisfies readonly RogueliteMapDesignRule[];

export const ROGUELITE_MAP_ROUTE_SUGGESTIONS = [
  {
    phase: "early",
    recommendedNodeCount: 2,
    recommendedRooms: ["normal", "event"],
    purpose: "教学和轻量选择",
    notes: "不要惩罚太重。",
  },
  {
    phase: "early",
    recommendedNodeCount: 3,
    recommendedRooms: ["normal", "elite", "shop"],
    purpose: "第一次风险收益",
    notes: "精英奖励要明显。",
  },
  {
    phase: "mid",
    recommendedNodeCount: 2,
    recommendedRooms: ["rest", "reward"],
    purpose: "缓冲和构筑整理",
    notes: "放在高压后。",
  },
  {
    phase: "mid",
    recommendedNodeCount: 3,
    recommendedRooms: ["normal", "elite", "event"],
    purpose: "形成路线差异",
    notes: "事件可带代价。",
  },
  {
    phase: "late",
    recommendedNodeCount: 1,
    recommendedRooms: ["boss"],
    purpose: "阶段目标",
    notes: "Boss 主题要强。",
  },
] as const satisfies readonly RogueliteMapRouteSuggestion[];

export function getRogueliteMapNodeId(stage: number, branch: number): string {
  return `n${stage}-${branch}`;
}

export function getRogueliteMapWorldY(stage: number): number {
  return ROGUELITE_MAP_RULES.worldBaseY - (stage - 1) * ROGUELITE_MAP_RULES.stageGapY;
}

export function getRogueliteMapLayerCount(stage: number): 1 | 2 | 3 | 4 {
  const fixedLayer = ROGUELITE_MAP_RULES.cycleLayers[getRogueliteCycleStage(stage) as keyof typeof ROGUELITE_MAP_RULES.cycleLayers];
  if (fixedLayer) return fixedLayer.length as 1 | 2 | 3 | 4;
  if (stage > 0 && getRogueliteCycleStage(stage) === ROGUELITE_STAGE_SCALING.bossInterval) return 1;
  if (stage <= 1) return 1;
  const modulo = stage % ROGUELITE_MAP_RULES.layerPattern.length;
  return ROGUELITE_MAP_RULES.layerPattern.find((item) => item.stageModulo === modulo)?.nodeCount ?? 2;
}

export function getRogueliteMapNodeX(branch: number, total: 1 | 2 | 3 | 4): number {
  return ROGUELITE_MAP_RULES.branchX[total][branch] ?? 50;
}

export function getRogueliteMapStagePrimaryType(stage: number): RogueliteMapRoomType {
  const fixedLayer = ROGUELITE_MAP_RULES.cycleLayers[getRogueliteCycleStage(stage) as keyof typeof ROGUELITE_MAP_RULES.cycleLayers];
  if (fixedLayer?.[0]) return fixedLayer[0];
  if (stage > 0 && getRogueliteCycleStage(stage) === ROGUELITE_STAGE_SCALING.bossInterval) return "boss";
  const pattern = ROGUELITE_MAP_RULES.typePattern;
  return pattern[(stage - 1) % pattern.length] ?? "normal";
}

export function getRogueliteMapNodeType(stage: number, branch: number, total: number): RogueliteMapRoomType {
  const fixedLayer = ROGUELITE_MAP_RULES.cycleLayers[getRogueliteCycleStage(stage) as keyof typeof ROGUELITE_MAP_RULES.cycleLayers];
  if (fixedLayer) return fixedLayer[branch] ?? fixedLayer[0] ?? "normal";
  if (stage > 0 && getRogueliteCycleStage(stage) === ROGUELITE_STAGE_SCALING.bossInterval) return "boss";
  if (stage <= 1 || total <= 1) return getRogueliteMapStagePrimaryType(stage);
  const pools = ROGUELITE_MAP_RULES.routePools;
  const pool = pools[stage % pools.length] ?? pools[0]!;
  return pool[(branch + stage) % pool.length] ?? "normal";
}

export function getRogueliteMapNodeEnemyTemplateId(stage: number, type: RogueliteMapRoomType, branch: number): string | undefined {
  const cycleStage = getRogueliteCycleStage(stage);
  if (type === "normal") {
    if (cycleStage <= 2) return "normal_training_dummy";
    return branch % 3 === 1 ? "normal_gambler" : branch % 3 === 2 ? "normal_shield_breaker" : "normal";
  }
  if (type === "elite") return branch % 2 === 0 ? "elite_iron_skin" : "elite_berserker";
  return undefined;
}

export function createRogueliteMapLayer(stage: number): RogueliteMapNodeDraft[] {
  const total = getRogueliteMapLayerCount(stage);
  return Array.from({ length: total }, (_, branch) => {
    const type = getRogueliteMapNodeType(stage, branch, total);
    return {
      id: getRogueliteMapNodeId(stage, branch),
      stage,
      branch,
      type,
      x: getRogueliteMapNodeX(branch, total),
      enemyTemplateId: getRogueliteMapNodeEnemyTemplateId(stage, type, branch),
    };
  });
}

export function getRogueliteConnectedNodeIds(from: RogueliteMapConnectionInput, nextLayer: readonly RogueliteMapConnectionInput[]): Set<string> {
  const sorted = [...nextLayer].sort((a, b) => Math.abs(a.x - from.x) - Math.abs(b.x - from.x));
  const maxTargets = Math.min(ROGUELITE_MAP_RULES.maxConnectionsFromNode, sorted.length);
  return new Set(sorted.slice(0, maxTargets).map((node) => node.id));
}
