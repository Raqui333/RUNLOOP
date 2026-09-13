import Decimal from "break_infinity.js";
import type {
  BreakthroughDef,
  ChallengeDef,
  GeneratorDef,
  MilestoneDef,
  ResearchDef,
  ScaleTierDef,
  SpecDef,
  UpgradeDef,
  GameState,
} from "./types";

export const GENERATORS: GeneratorDef[] = [
  {
    id: "compileCore",
    name: "Compile Core",
    badge: "CC",
    description: "Runs a single build pipeline. Executes code nonstop.",
    baseCost: 40,
    costGrowth: 1.2,
    baseProduction: 4,
    unlockCount: 0,
    unlockGenerator: null,
    unlockResearch: null,
  },
  {
    id: "cpu",
    name: "Execution CPU",
    badge: "CPU",
    description: "A dedicated processor executing work in parallel with the core.",
    baseCost: 1200,
    costGrowth: 1.22,
    baseProduction: 30,
    unlockCount: 15,
    unlockGenerator: "compileCore",
    unlockResearch: null,
  },
  {
    id: "server",
    name: "Build Server",
    badge: "SRV",
    description: "A rack-mounted server. Compiles, tests and ships artifacts.",
    baseCost: 25000,
    costGrowth: 1.24,
    baseProduction: 480,
    unlockCount: 25,
    unlockGenerator: "cpu",
    unlockResearch: "server",
  },
  {
    id: "gpuArray",
    name: "GPU Array",
    badge: "GPU",
    description: "A wall of graphics cards crunching tensor workloads in parallel.",
    baseCost: 650000,
    costGrowth: 1.26,
    baseProduction: 8000,
    unlockCount: 25,
    unlockGenerator: "server",
    unlockResearch: "gpu",
  },
  {
    id: "database",
    name: "Sharded Database",
    badge: "DB",
    description: "A horizontally sharded datastore feeding hot data to every pipeline.",
    baseCost: 15000000,
    costGrowth: 1.28,
    baseProduction: 160000,
    unlockCount: 25,
    unlockGenerator: "gpuArray",
    unlockResearch: "db",
  },
  {
    id: "apiGateway",
    name: "API Gateway",
    badge: "API",
    description: "Load balances, routes and shapes every request into executions.",
    baseCost: 500000000,
    costGrowth: 1.29,
    baseProduction: 4000000,
    unlockCount: 25,
    unlockGenerator: "database",
    unlockResearch: "mesh",
  },
  {
    id: "orchestrator",
    name: "Cluster Orchestrator",
    badge: "CO",
    description: "Schedules containers across the fleet and self-heals failures.",
    baseCost: 18000000000,
    costGrowth: 1.3,
    baseProduction: 95000000,
    unlockCount: 25,
    unlockGenerator: "apiGateway",
    unlockResearch: "orch",
  },
  {
    id: "datacenter",
    name: "Regional Datacenter",
    badge: "DC",
    description: "A full region with redundant power, fabric and storage pools.",
    baseCost: 650000000000,
    costGrowth: 1.32,
    baseProduction: 2800000000,
    unlockCount: 25,
    unlockGenerator: "orchestrator",
    unlockResearch: "region",
  },
  {
    id: "cloudRegion",
    name: "Cloud Region",
    badge: "CR",
    description: "An elastic cloud region exporting compute across continents.",
    baseCost: 30000000000000,
    costGrowth: 1.34,
    baseProduction: 110000000000,
    unlockCount: 25,
    unlockGenerator: "datacenter",
    unlockResearch: "cloud",
  },
  {
    id: "inference",
    name: "Inference Cluster",
    badge: "INF",
    description: "A dedicated cluster serving autonomous inference at model scale.",
    baseCost: 1600000000000000,
    costGrowth: 1.36,
    baseProduction: 4200000000000,
    unlockCount: 25,
    unlockGenerator: "cloudRegion",
    unlockResearch: "inference",
  },
];

export const GENERATOR_BY_ID: Record<string, GeneratorDef> = Object.fromEntries(
  GENERATORS.map((g) => [g.id, g]),
);

export const RESEARCH: ResearchDef[] = [
  {
    id: "runtime",
    name: "Runtime Init",
    description: "Boots the first runtime. All pipelines execute +20% faster.",
    cost: 1500,
    tier: 0,
    prereq: null,
    effect: { type: "prodMul", value: 0.2 },
  },
  {
    id: "compiler",
    name: "Efficient Compiler",
    description: "Optimizes hot paths. +35% total production.",
    cost: 10000,
    tier: 1,
    prereq: "runtime",
    effect: { type: "prodMul", value: 0.35 },
  },
  {
    id: "parallel",
    name: "Parallel Compilation",
    description: "Splits builds across threads. +35% total production.",
    cost: 20000,
    tier: 1,
    prereq: "runtime",
    effect: { type: "prodMul", value: 0.35 },
  },
  {
    id: "jit",
    name: "JIT Runtime",
    description: "Just-in-time compiles hot methods. +70% total production.",
    cost: 30000,
    tier: 2,
    prereq: "compiler",
    effect: { type: "prodMul", value: 0.7 },
  },
  {
    id: "workers",
    name: "Worker Pool",
    description: "Execution workers become autonomous. +10% production each.",
    cost: 150000,
    tier: 2,
    prereq: "parallel",
    effect: { type: "workerEfficiency", value: 0.1 },
  },
  {
    id: "server",
    name: "Server Provisioning",
    description: "Unlocks the Build Server generator.",
    cost: 600000,
    tier: 2,
    prereq: "compiler",
    effect: { type: "unlockGenerator", generatorId: "server" },
  },
  {
    id: "gpu",
    name: "Parallel Hardware",
    description: "Unlocks the GPU Array generator.",
    cost: 12000000,
    tier: 3,
    prereq: "server",
    effect: { type: "unlockGenerator", generatorId: "gpuArray" },
  },
  {
    id: "cache",
    name: "Caching Layer",
    description: "Hot results served from memory. +70% total production.",
    cost: 5000000,
    tier: 3,
    prereq: "jit",
    effect: { type: "prodMul", value: 0.7 },
  },
  {
    id: "autoscale",
    name: "Auto Scaling",
    description: "Unlocks automated purchasing for generators.",
    cost: 25000000,
    tier: 3,
    prereq: "workers",
    effect: { type: "unlockAutobuy" },
  },
  {
    id: "db",
    name: "Data Sharding",
    description: "Unlocks the Sharded Database generator.",
    cost: 250000000,
    tier: 4,
    prereq: "gpu",
    effect: { type: "unlockGenerator", generatorId: "database" },
  },
  {
    id: "cacheidx",
    name: "Cache Indexing",
    description: "Bloom-filter lookups everywhere. +100% total production.",
    cost: 100000000,
    tier: 4,
    prereq: "cache",
    effect: { type: "prodMul", value: 1.0 },
  },
  {
    id: "elastic",
    name: "Elastic Workers",
    description: "Workers scale with load. +15% production each.",
    cost: 300000000,
    tier: 4,
    prereq: "autoscale",
    effect: { type: "workerEfficiency", value: 0.15 },
  },
  {
    id: "mesh",
    name: "Service Mesh",
    description: "Unlocks the API Gateway generator.",
    cost: 5000000000,
    tier: 5,
    prereq: "db",
    effect: { type: "unlockGenerator", generatorId: "apiGateway" },
  },
  {
    id: "snapshot",
    name: "State Snapshot",
    description: "Captures state offline. +20% offline production.",
    cost: 2000000000,
    tier: 5,
    prereq: "cacheidx",
    effect: { type: "offlineMul", value: 0.2 },
  },
  {
    id: "healing",
    name: "Self Healing",
    description: "Recovers crashed processes. +40% offline production.",
    cost: 6000000000,
    tier: 5,
    prereq: "elastic",
    effect: { type: "offlineMul", value: 0.4 },
  },
  {
    id: "orch",
    name: "Cluster Orchestration",
    description: "Unlocks the Cluster Orchestrator generator.",
    cost: 75000000000,
    tier: 6,
    prereq: "mesh",
    effect: { type: "unlockGenerator", generatorId: "orchestrator" },
  },
  {
    id: "replicate",
    name: "Data Replication",
    description: "Multi-region replicas. +80% offline production.",
    cost: 40000000000,
    tier: 6,
    prereq: "snapshot",
    effect: { type: "offlineMul", value: 0.8 },
  },
  {
    id: "agents",
    name: "Autonomous Agents",
    description: "Self-driving pipelines everywhere. +150% total production.",
    cost: 150000000000,
    tier: 6,
    prereq: "healing",
    effect: { type: "prodMul", value: 1.5 },
  },
  {
    id: "region",
    name: "Regional Replication",
    description: "Unlocks the Regional Datacenter generator.",
    cost: 1500000000000,
    tier: 7,
    prereq: "orch",
    effect: { type: "unlockGenerator", generatorId: "datacenter" },
  },
  {
    id: "vectors",
    name: "Vector Indexes",
    description: "Embedding search feeds the build loop. Builds gain +70%.",
    cost: 600000000000,
    tier: 7,
    prereq: "replicate",
    effect: { type: "clickMul", value: 0.7 },
  },
  {
    id: "cloud",
    name: "Cloud Distribution",
    description: "Unlocks the Cloud Region generator.",
    cost: 25000000000000,
    tier: 8,
    prereq: "region",
    effect: { type: "unlockGenerator", generatorId: "cloudRegion" },
  },
  {
    id: "quantum",
    name: "Speculative Execution",
    description: "Branch prediction at scale. +200% total production.",
    cost: 1000000000000000,
    tier: 8,
    prereq: "vectors",
    effect: { type: "prodMul", value: 2.0 },
  },
  {
    id: "inference",
    name: "Inference Acceleration",
    description: "Unlocks the Inference Cluster generator.",
    cost: 4000000000000000,
    tier: 9,
    prereq: "cloud",
    effect: { type: "unlockGenerator", generatorId: "inference" },
  },
  {
    id: "autonomous",
    name: "Autonomous Infrastructure",
    description: "The system governs itself. +200% total production.",
    cost: 50000000000000000000,
    tier: 10,
    prereq: "inference",
    effect: { type: "prodMul", value: 2.0 },
  },
  {
    id: "canary",
    name: "Canary Deploys",
    description: "New code rolls out to one node at a time. +70% total production.",
    cost: 60000000000,
    tier: 6,
    prereq: "mesh",
    effect: { type: "prodMul", value: 0.7 },
  },
  {
    id: "shard",
    name: "Dynamic Sharding",
    description: "Data splits across nodes on the fly. +90% total production.",
    cost: 9000000000000,
    tier: 7,
    prereq: "agents",
    effect: { type: "prodMul", value: 0.9 },
  },
  {
    id: "telemetry",
    name: "Real-Time Telemetry",
    description: "Every subsystem reports live. +100% total production.",
    cost: 750000000000000,
    tier: 8,
    prereq: "canary",
    effect: { type: "prodMul", value: 1.0 },
  },
  {
    id: "fleet",
    name: "Split-Brain Tolerance",
    description: "The fleet agrees without a master. +150% total production.",
    cost: 100000000000000000,
    tier: 9,
    prereq: "shard",
    effect: { type: "prodMul", value: 1.5 },
  },
  {
    id: "optimizer",
    name: "Meta-Optimizer",
    description: "Optimizes the optimizers. +200% total production.",
    cost: 400000000000000000000,
    tier: 10,
    prereq: "autonomous",
    effect: { type: "prodMul", value: 2.0 },
  },
];

export const RESEARCH_BY_ID: Record<string, ResearchDef> = Object.fromEntries(
  RESEARCH.map((r) => [r.id, r]),
);

export const UPGRADES: UpgradeDef[] = [
  {
    id: "refine",
    name: "Code Refinement",
    description: "Relentless micro-optimizations. +3% production per level.",
    baseCost: 5000,
    growth: 1.26,
    perLevel: 0.03,
    unlockResearch: "runtime",
    badge: "REF",
  },
  {
    id: "pgo",
    name: "Profile-Guided Optimization",
    description: "Rewrites hot code with real profiles. +5% production per level.",
    baseCost: 150000,
    growth: 1.32,
    perLevel: 0.05,
    unlockResearch: "jit",
    badge: "PGO",
  },
  {
    id: "prefetch",
    name: "Cache Prefetch",
    description: "Predicts and prefetches keys. +6% production per level.",
    baseCost: 50000000,
    growth: 1.34,
    perLevel: 0.06,
    unlockResearch: "cacheidx",
    badge: "PRE",
  },
  {
    id: "dispatch",
    name: "Dynamic Dispatch",
    description: "Routes work at runtime. +8% production per level.",
    baseCost: 7500000000,
    growth: 1.37,
    perLevel: 0.08,
    unlockResearch: "mesh",
    badge: "RST",
  },
  {
    id: "specbranch",
    name: "Speculative Branching",
    description: "Executes every path at once. +10% production per level.",
    baseCost: 750000000000,
    growth: 1.4,
    perLevel: 0.1,
    unlockResearch: "orch",
    badge: "SBP",
  },
  {
    id: "neuralco",
    name: "Neural Co-Processors",
    description: "Tensor cores accelerate everything. +12% production per level.",
    baseCost: 40000000000000,
    growth: 1.42,
    perLevel: 0.12,
    unlockResearch: "autonomous",
    badge: "NCP",
  },
];

export const UPGRADE_BY_ID: Record<string, UpgradeDef> = Object.fromEntries(
  UPGRADES.map((u) => [u.id, u]),
);

export const BREAKTHROUGHS: BreakthroughDef[] = [
  {
    id: "monorepo",
    name: "Monorepo Collapse",
    description: "Folds every repo into one build graph. +80% production.",
    cost: 20000,
    unlockResearch: "compiler",
    prodMul: 0.8,
    badge: "MONO",
  },
  {
    id: "strict",
    name: "Strict Typing",
    description: "Whole-crate type inference. +60% production.",
    cost: 120000,
    unlockResearch: "jit",
    prodMul: 0.6,
    badge: "TY",
  },
  {
    id: "edge",
    name: "Edge Functions",
    description: "Work executes at the edge. +120% production.",
    cost: 80000000,
    unlockResearch: "cache",
    prodMul: 1.2,
    badge: "EDGE",
  },
  {
    id: "routing",
    name: "Edge Routing",
    description: "Requests land on the nearest node. +150% production.",
    cost: 1000000000,
    unlockResearch: "mesh",
    prodMul: 1.5,
    badge: "ER",
  },
  {
    id: "serverless",
    name: "Serverless Functions",
    description: "Scale-to-zero, scale-to-everything. +200% production.",
    cost: 60000000000,
    unlockResearch: "orch",
    prodMul: 2.0,
    badge: "SLS",
  },
  {
    id: "faultproof",
    name: "Fault-Proof Execution",
    description: "Deterministic replay everywhere. +250% production.",
    cost: 500000000000,
    unlockResearch: "replicate",
    prodMul: 2.5,
    badge: "FP",
  },
  {
    id: "neural",
    name: "Neural Schedulers",
    description: "The scheduler learns from telemetry. +300% production.",
    cost: 25000000000000,
    unlockResearch: "cloud",
    prodMul: 3.0,
    badge: "NN",
  },
  {
    id: "rollout",
    name: "Zero-Downtime Rollouts",
    description: "Deploy without ever taking the stack offline. +200% production.",
    cost: 2000000000000,
    unlockResearch: "canary",
    prodMul: 2.0,
    badge: "ZDR",
  },
  {
    id: "predict",
    name: "Predictive Telemetry",
    description: "The system forecasts load before it arrives. +300% production.",
    cost: 120000000000000000,
    unlockResearch: "telemetry",
    prodMul: 3.0,
    badge: "PTL",
  },
];

export const BREAKTHROUGH_BY_ID: Record<string, BreakthroughDef> = Object.fromEntries(
  BREAKTHROUGHS.map((b) => [b.id, b]),
);

export const SPECS: SpecDef[] = [
  {
    id: "performance",
    name: "Performance",
    description: "Favor throughput over everything.",
    effect: "+4% total production per point",
  },
  {
    id: "reliability",
    name: "Reliability",
    description: "Never lose a cycle to downtime.",
    effect: "+2% offline efficiency per point",
  },
  {
    id: "automation",
    name: "Automation",
    description: "The system makes its own decisions.",
    effect: "+4% auto-buyer speed per point",
  },
];

export const SPEC_BY_ID: Record<string, SpecDef> = Object.fromEntries(
  SPECS.map((s) => [s.id, s]),
);

export const CHALLENGES: ChallengeDef[] = [
  {
    id: "blackout",
    name: "Blackout Protocol",
    badge: "DWN",
    description: "Simulate total power loss at idle. The fleet sleeps the moment you look away.",
    flaw: "No offline production while active",
    unlockRefactors: 1,
    targetBase: 5e6,
    targetGrowth: 28,
    rewardPerTier: 0.08,
    modifier: { offlineMul: 0 },
  },
  {
    id: "baremetal",
    name: "Bare Metal",
    badge: "BMR",
    description: "No research, no abstractions. The system runs on raw silicon intent.",
    flaw: "Research is disabled while active",
    unlockRefactors: 1,
    targetBase: 1e7,
    targetGrowth: 33,
    rewardPerTier: 0.12,
    modifier: { disableResearch: true },
  },
  {
    id: "vanilla",
    name: "Zero-Dependency Build",
    badge: "ZDB",
    description: "Every optimization library is stripped from the dependency tree.",
    flaw: "Upgrades are disabled while active",
    unlockRefactors: 1,
    targetBase: 2e7,
    targetGrowth: 42,
    rewardPerTier: 0.16,
    modifier: { disableUpgrades: true },
  },
  {
    id: "skeleton",
    name: "Skeleton Crew",
    badge: "SKL",
    description: "Execute everything with a single, exhausted senior engineer.",
    flaw: "Workers are disabled while active",
    unlockRefactors: 2,
    targetBase: 5e7,
    targetGrowth: 55,
    rewardPerTier: 0.16,
    modifier: { disableWorkers: true },
  },
  {
    id: "nomagic",
    name: "No Magic",
    badge: "NMG",
    description: "Ban the pattern libraries. Everything ships bespoke and hand-rolled.",
    flaw: "Breakthroughs are disabled while active",
    unlockRefactors: 3,
    targetBase: 1.5e8,
    targetGrowth: 66,
    rewardPerTier: 0.2,
    modifier: { disableBreakthroughs: true },
  },
  {
    id: "manual",
    name: "Manual Labor",
    badge: "MTL",
    description: "Automation is unlawful. Every deploy is a hand-cranked ceremony.",
    flaw: "Auto-buyers and manual builds are disabled while active",
    unlockRefactors: 5,
    targetBase: 5e8,
    targetGrowth: 82,
    rewardPerTier: 0.25,
    modifier: { disableAutobuy: true, clickMul: 0 },
  },
  {
    id: "throttle",
    name: "Thermal Throttle",
    badge: "THR",
    description: "Radiators fail at half duty cycle. Throughput collapses.",
    flaw: "Total production is halved while active",
    unlockRefactors: 7,
    targetBase: 2.5e9,
    targetGrowth: 99,
    rewardPerTier: 0.3,
    modifier: { prodMul: 0.5 },
  },
];

export const CHALLENGE_BY_ID: Record<string, ChallengeDef> = Object.fromEntries(
  CHALLENGES.map((c) => [c.id, c]),
);

export const TEXT_CYCLES = "cycles";

export const REFACTOR_THRESHOLD = new Decimal(2500000);

export const MILESTONES: MilestoneDef[] = [
  {
    id: "first",
    label: "First Compile",
    description: "Build your first Compile Core.",
    check: (s) => (s.generators.compileCore ?? 0) >= 1,
  },
  {
    id: "cores",
    label: "Core Farm",
    description: "Own 25 Compile Cores.",
    check: (s) => (s.generators.compileCore ?? 0) >= 25,
  },
  {
    id: "cpus",
    label: "Parallel Execution",
    description: "Own 10 Execution CPUs.",
    check: (s) => (s.generators.cpu ?? 0) >= 10,
  },
  {
    id: "research",
    label: "First Research",
    description: "Complete any research node.",
    check: (s) => Object.values(s.research).some(Boolean),
  },
  {
    id: "prod1k",
    label: "Kilocycle",
    description: "Reach 1K cycles/s.",
    check: (s) => s.totals.runCycles.gte(1e3),
  },
  {
    id: "workers",
    label: "Auto Worker",
    description: "Hire your first execution worker.",
    check: (s) => s.workers >= 1,
  },
  {
    id: "upgrade10",
    label: "Optimizer",
    description: "Buy 10 upgrade levels in total.",
    check: (s) => Object.values(s.upgrades).reduce((a, b) => a + b, 0) >= 10,
  },
  {
    id: "prod1m",
    label: "Megacycle",
    description: "Reach 1M cycles/s.",
    check: (s) => s.totals.runCycles.gte(1e6),
  },
  {
    id: "autobuy",
    label: "Autopilot",
    description: "Enable your first auto-buyer.",
    check: (s) => Object.values(s.autoBuyers).some((a) => a.enabled),
  },
  {
    id: "prod1b",
    label: "Gigacycle",
    description: "Reach 1B cycles/s.",
    check: (s) => s.totals.runCycles.gte(1e9),
  },
  {
    id: "refactor1",
    label: "First Refactor",
    description: "Refactor the system for architecture points.",
    check: (s) => s.prestige.refactors >= 1,
  },
  {
    id: "prod1t",
    label: "Teracycle",
    description: "Reach 1T cycles/s.",
    check: (s) => s.totals.runCycles.gte(1e12),
  },
  {
    id: "datacenter",
    label: "Datacenter Live",
    description: "Deploy a Regional Datacenter.",
    check: (s) => !!s.research.region,
  },
  {
    id: "cloud",
    label: "Cloud Scale",
    description: "Unlock Cloud Distribution.",
    check: (s) => !!s.research.cloud,
  },
  {
    id: "inference",
    label: "Inference Era",
    description: "Unlock Inference Acceleration.",
    check: (s) => !!s.research.inference,
  },
  {
    id: "prod1Qa",
    label: "Quintacycle",
    description: "Reach 1Qa cycles/s.",
    check: (s) => s.totals.runCycles.gte(1e15),
  },
  {
    id: "scale",
    label: "Global Infrastructure",
    description: "Reach the Global Infrastructure scale.",
    check: (s) => getScaleIndex(s.totals.runCycles) >= 7,
  },
  {
    id: "builds100",
    label: "Build Machine",
    description: "Execute 100 manual builds.",
    check: (s) => s.totals.builds >= 100,
  },
  {
    id: "canary",
    label: "Canary Live",
    description: "Complete Canary Deploys research.",
    check: (s) => !!s.research.canary,
  },
  {
    id: "metaopt",
    label: "Meta-Optimizer",
    description: "Reach the tip of the research tree.",
    check: (s) => !!s.research.optimizer,
  },
  {
    id: "deploy1000",
    label: "Orchestration Overload",
    description: "Own 1000 total systems.",
    check: (s) => totalGeneratorCount(s) >= 1000,
  },
];

export const SCALE_TIERS: ScaleTierDef[] = [
  { name: "Developer Workstation", accent: "#34d399" },
  { name: "Powerful Workstation", accent: "#4ade80" },
  { name: "Build Server", accent: "#22d3ee" },
  { name: "Server Farm", accent: "#38bdf8" },
  { name: "Compute Cluster", accent: "#60a5fa" },
  { name: "Datacenter", accent: "#a78bfa" },
  { name: "Cloud Region", accent: "#f472b6" },
  { name: "Global Infrastructure", accent: "#fbbf24" },
  { name: "Distributed Intelligence", accent: "#fb923c" },
  { name: "Autonomous Hyperstack", accent: "#f87171" },
];

export function getScaleIndex(production: Decimal): number {
  const e = production.log10();
  const idx = e < 3 ? 0 : Math.min(Math.floor((e - 3) / 3 + 1), SCALE_TIERS.length - 1);
  return idx;
}

export function getScaleTier(production: Decimal): ScaleTierDef {
  return SCALE_TIERS[getScaleIndex(production)] ?? SCALE_TIERS[SCALE_TIERS.length - 1];
}

export function isGeneratorUnlocked(state: GameState, gen: GeneratorDef): boolean {
  if (gen.unlockResearch && state.research[gen.unlockResearch]) return true;
  if (gen.unlockGenerator && (state.generators[gen.unlockGenerator] ?? 0) >= gen.unlockCount)
    return true;
  return !gen.unlockGenerator && !gen.unlockResearch;
}

export function isUpgradeUnlocked(state: GameState, def: UpgradeDef): boolean {
  if (def.unlockResearch) return !!state.research[def.unlockResearch];
  return true;
}

export function isBreakthroughUnlocked(state: GameState, def: BreakthroughDef): boolean {
  if (def.unlockResearch) return !!state.research[def.unlockResearch];
  return true;
}

export function isResearchAvailable(state: GameState, def: ResearchDef): boolean {
  if (state.research[def.id]) return false;
  if (!def.prereq) return true;
  return !!state.research[def.prereq];
}

export function isSpecUnlocked(state: GameState): boolean {
  return state.prestige.refactors >= 1 || state.totals.runCycles.gte(REFACTOR_THRESHOLD);
}

export function isChallengeUnlocked(state: GameState, def: ChallengeDef): boolean {
  return state.prestige.refactors >= def.unlockRefactors;
}

export function generatorCost(gen: GeneratorDef, count: number): Decimal {
  return new Decimal(gen.costGrowth).pow(count).times(gen.baseCost);
}

export function moduleCost(gen: GeneratorDef, level: number): Decimal {
  return new Decimal(1.7).pow(level).times(gen.baseCost * 75);
}

export function workerCost(count: number): Decimal {
  return new Decimal(1.42).pow(count).times(2500);
}

export function upgradeCost(def: UpgradeDef, level: number): Decimal {
  return new Decimal(def.growth).pow(level).times(def.baseCost);
}

export function breakthroughCost(def: BreakthroughDef): Decimal {
  return new Decimal(def.cost);
}

export function researchCost(def: ResearchDef): Decimal {
  return new Decimal(def.cost);
}

export function specCost(level: number): number {
  return 2 + Math.floor(level * 0.8);
}

export function moduleLevel(state: GameState, genId: string): number {
  return state.modules[genId] ?? 0;
}

export function totalGeneratorCount(state: GameState): number {
  return Object.values(state.generators).reduce((a, b) => a + b, 0);
}