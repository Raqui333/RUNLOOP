import Decimal from "break_infinity.js";
import type {
  ChallengeDef,
  ChallengeModifier,
  GameState,
  GeneratorDef,
  SpecId,
} from "./types";
import {
  BREAKTHROUGHS,
  BREAKTHROUGH_BY_ID,
  CHALLENGES,
  CHALLENGE_BY_ID,
  GENERATORS,
  GENERATOR_BY_ID,
  RESEARCH,
  UPGRADES,
  UPGRADE_BY_ID,
  MILESTONES,
  generatorCost,
  moduleCost,
  workerCost,
  upgradeCost,
  breakthroughCost,
  researchCost,
  specCost,
  moduleLevel,
  isGeneratorUnlocked,
  isUpgradeUnlocked,
  isChallengeUnlocked,
  isResearchAvailable,
  REFACTOR_THRESHOLD,
} from "./economy";
import { toDecimal } from "./numbers";

export type BuyResult = "ok" | "poor" | "locked" | "dup";

const MODULE_EFFECT = 0.15;
const WORKER_BASE_EFFICIENCY = 0.1;
const REFACTOR_EFFORT_BONUS = 0.01;

export function getActiveChallenge(state: GameState): ChallengeDef | null {
  if (!state.activeChallenge) return null;
  return CHALLENGE_BY_ID[state.activeChallenge] ?? null;
}

export function activeModifier(state: GameState): ChallengeModifier | null {
  return getActiveChallenge(state)?.modifier ?? null;
}

export function challengeTier(state: GameState, id: string): number {
  return state.challenges[id] ?? 0;
}

export function challengeRewardMultiplier(state: GameState): Decimal {
  let mul = new Decimal(1);
  for (const def of CHALLENGES) {
    const tier = challengeTier(state, def.id);
    if (tier > 0) mul = mul.times(1 + def.rewardPerTier * tier);
  }
  return mul;
}

export function challengeTarget(def: ChallengeDef, tier: number): Decimal {
  return new Decimal(def.targetBase).times(Decimal.pow(def.targetGrowth, tier));
}

export function challengeProgress(state: GameState, def: ChallengeDef): number {
  return state.totals.runCycles.div(challengeTarget(def, challengeTier(state, def.id))).toNumber();
}

export function canSolveChallenge(state: GameState): boolean {
  const def = getActiveChallenge(state);
  if (!def) return false;
  return state.totals.runCycles.gte(challengeTarget(def, challengeTier(state, def.id)));
}

export function challengeNextReward(state: GameState, def: ChallengeDef): number {
  return def.rewardPerTier * (challengeTier(state, def.id) + 1);
}

export function workerEfficiency(state: GameState): number {
  let eff = WORKER_BASE_EFFICIENCY;
  for (const def of RESEARCH) {
    if (
      state.research[def.id] &&
      def.effect.type === "workerEfficiency" &&
      def.effect.value > eff
    ) {
      eff = def.effect.value;
    }
  }
  return eff;
}

function researchProdMul(state: GameState, defs = RESEARCH): Decimal {
  let mul = new Decimal(1);
  for (const def of defs) {
    if (state.research[def.id] && def.effect.type === "prodMul") {
      mul = mul.times(1 + def.effect.value);
    }
  }
  return mul;
}

function researchClickMul(state: GameState, defs = RESEARCH): number {
  let sum = 0;
  for (const def of defs) {
    if (state.research[def.id] && def.effect.type === "clickMul") {
      sum += def.effect.value;
    }
  }
  return sum;
}

export function clickBonus(state: GameState): number {
  const mod = activeModifier(state);
  let bonus = 1 + researchClickMul(state);
  if (mod?.clickMul != null) bonus *= mod.clickMul;
  return bonus;
}

export function offlineEfficiency(state: GameState): number {
  const mod = activeModifier(state);
  if (mod?.offlineMul != null) return mod.offlineMul;
  let pct = 0;
  for (const def of RESEARCH) {
    if (state.research[def.id] && def.effect.type === "offlineMul") {
      pct += def.effect.value;
    }
  }
  pct += 0.03 * state.prestige.specs.reliability;
  return 1 + pct;
}

export function automationSpeed(state: GameState): number {
  return 1 + 0.05 * state.prestige.specs.automation;
}

export function computeProduction(state: GameState): Decimal {
  const mod = activeModifier(state);
  let genSum = new Decimal(0);
  for (const gen of GENERATORS) {
    const count = state.generators[gen.id] ?? 0;
    if (count <= 0) continue;
    const modLvl = moduleLevel(state, gen.id);
    const perUnit = new Decimal(gen.baseProduction).times(1 + MODULE_EFFECT * modLvl);
    genSum = genSum.plus(perUnit.times(count));
  }

  let mul = new Decimal(1);
  if (!mod?.disableUpgrades) {
    for (const def of UPGRADES) {
      const level = state.upgrades[def.id] ?? 0;
      if (level > 0 && isUpgradeUnlocked(state, def)) {
        mul = mul.times(1 + def.perLevel * level);
      }
    }
  }
  if (!mod?.disableBreakthroughs) {
    for (const def of BREAKTHROUGHS) {
      if (state.breakthroughs[def.id]) {
        mul = mul.times(1 + def.prodMul);
      }
    }
  }
  if (!mod?.disableResearch) {
    mul = mul.times(researchProdMul(state));
  }
  if (!mod?.disableWorkers) {
    mul = mul.times(1 + workerEfficiency(state) * (state.workers ?? 0));
  }
  mul = mul.times(1 + 0.05 * state.prestige.specs.performance);
  mul = mul.times(1 + REFACTOR_EFFORT_BONUS * state.prestige.refactors);
  mul = mul.times(challengeRewardMultiplier(state));
  if (mod?.prodMul != null) mul = mul.times(mod.prodMul);

  return genSum.times(mul);
}

export function productionPerGenerator(
  state: GameState,
  gen: GeneratorDef,
): Decimal {
  const count = state.generators[gen.id] ?? 0;
  if (count <= 0) return new Decimal(0);
  const mod = moduleLevel(state, gen.id);
  return new Decimal(gen.baseProduction)
    .times(1 + MODULE_EFFECT * mod)
    .times(count);
}

export interface MultiplierEntry {
  label: string;
  detail: string;
  value: Decimal;
}

export function getMultiplierStack(state: GameState): MultiplierEntry[] {
  let upgrades = new Decimal(1);
  let upgradeLevels = 0;
  for (const def of UPGRADES) {
    const level = state.upgrades[def.id] ?? 0;
    if (level > 0 && isUpgradeUnlocked(state, def)) {
      upgrades = upgrades.times(1 + def.perLevel * level);
      upgradeLevels += level;
    }
  }
  let breakthroughs = new Decimal(1);
  let breakthroughCount = 0;
  for (const def of BREAKTHROUGHS) {
    if (state.breakthroughs[def.id]) {
      breakthroughs = breakthroughs.times(1 + def.prodMul);
      breakthroughCount += 1;
    }
  }
  const researchMul = researchProdMul(state);
  const researchCount = RESEARCH.filter((r) => state.research[r.id]).length;
  const workersMul = new Decimal(1 + workerEfficiency(state) * (state.workers ?? 0));
  const perfLevel = state.prestige.specs.performance ?? 0;
  const specsMul = new Decimal(1 + 0.05 * perfLevel);
  const refactorMul = new Decimal(1 + REFACTOR_EFFORT_BONUS * (state.prestige.refactors ?? 0));

  const candidates: MultiplierEntry[] = [
    { label: "Optimizations", detail: `${upgradeLevels} levels`, value: upgrades },
    { label: "Breakthroughs", detail: `${breakthroughCount} adopted`, value: breakthroughs },
    { label: "Research", detail: `${researchCount} nodes`, value: researchMul },
    { label: "Workers", detail: `${state.workers ?? 0} online`, value: workersMul },
    { label: "Architecture", detail: `${perfLevel} pts`, value: specsMul },
    { label: "Refactor effort", detail: `${state.prestige.refactors ?? 0} runs`, value: refactorMul },
  ];
  const challengeRewardMul = challengeRewardMultiplier(state);
  const challengeTiers = CHALLENGES.reduce((a, c) => a + challengeTier(state, c.id), 0);
  if (challengeTiers > 0) {
    candidates.push({
      label: "Challenge clears",
      detail: `${challengeTiers} tiers`,
      value: challengeRewardMul,
    });
  }
  const active = getActiveChallenge(state);
  if (active && active.modifier.prodMul != null && active.modifier.prodMul !== 1) {
    candidates.push({
      label: `Challenge: ${active.name}`,
      detail: "active handicap",
      value: new Decimal(active.modifier.prodMul),
    });
  }
  return candidates.filter((c) => c.value.neq(1));
}

export function totalParts(state: GameState): number {
  return Object.values(state.generators).reduce((a, b) => a + b, 0);
}

export function upgradeLevelsTotal(state: GameState, includeModules = true): number {
  const up = Object.values(state.upgrades).reduce((a, b) => a + b, 0);
  if (!includeModules) return up;
  return up + Object.values(state.modules).reduce((a, b) => a + b, 0);
}

export function buildGain(state: GameState): Decimal {
  return computeProduction(state).times(5).plus(1).times(clickBonus(state));
}

export function getRefactorGain(state: GameState): Decimal {
  if (getActiveChallenge(state)) return new Decimal(0);
  const run = state.totals.runCycles;
  if (run.lt(REFACTOR_THRESHOLD)) return new Decimal(0);
  return run.div(REFACTOR_THRESHOLD).pow(0.6).floor();
}

export function applyProduction(state: GameState, dtSeconds: number): void {
  if (dtSeconds <= 0) return;
  const gain = computeProduction(state).times(dtSeconds);
  if (!gain.gte(0)) return;
  state.resources.cycles = state.resources.cycles.plus(gain);
  state.totals.runCycles = state.totals.runCycles.plus(gain);
  state.totals.lifetimeCycles = state.totals.lifetimeCycles.plus(gain);
}

export function computeOfflineGain(
  state: GameState,
  elapsedSeconds: number,
): { gained: Decimal; efficiency: number } {
  const efficiency = offlineEfficiency(state);
  const gained = elapsedSeconds > 0 ? computeProduction(state).times(elapsedSeconds).times(efficiency) : new Decimal(0);
  return { gained: gained.gte(0) ? gained : new Decimal(0), efficiency };
}

export function applyOfflineGain(state: GameState, gained: Decimal): void {
  if (!gained.gt(0)) return;
  state.resources.cycles = state.resources.cycles.plus(gained);
  state.totals.runCycles = state.totals.runCycles.plus(gained);
  state.totals.lifetimeCycles = state.totals.lifetimeCycles.plus(gained);
  state.stats.offlineCycles = (state.stats.offlineCycles ?? new Decimal(0)).plus(gained);
}

export function buyGenerator(
  state: GameState,
  genId: string,
  maxCostFraction?: number,
): BuyResult {
  const gen = GENERATOR_BY_ID[genId];
  if (!gen || !isGeneratorUnlocked(state, gen)) return "locked";
  const count = state.generators[genId] ?? 0;
  const cost = generatorCost(gen, count);
  const bal = state.resources.cycles;
  if (maxCostFraction != null && maxCostFraction > 0) {
    if (cost.gt(bal.times(maxCostFraction))) return "poor";
  }
  if (bal.lt(cost)) return "poor";
  state.resources.cycles = bal.minus(cost);
  state.generators[genId] = count + 1;
  state.stats.purchases = (state.stats.purchases ?? 0) + 1;
  return "ok";
}

export function buyModule(state: GameState, genId: string): BuyResult {
  const gen = GENERATOR_BY_ID[genId];
  if (!gen) return "locked";
  const level = moduleLevel(state, genId);
  const cost = moduleCost(gen, level);
  if (state.resources.cycles.lt(cost)) return "poor";
  state.resources.cycles = state.resources.cycles.minus(cost);
  state.modules[genId] = level + 1;
  return "ok";
}

export function buyUpgrade(state: GameState, upgradeId: string): BuyResult {
  if (activeModifier(state)?.disableUpgrades) return "locked";
  const def = UPGRADE_BY_ID[upgradeId];
  if (!def || (def.unlockResearch && !state.research[def.unlockResearch])) return "locked";
  const level = state.upgrades[upgradeId] ?? 0;
  const cost = upgradeCost(def, level);
  if (state.resources.cycles.lt(cost)) return "poor";
  state.resources.cycles = state.resources.cycles.minus(cost);
  state.upgrades[upgradeId] = level + 1;
  return "ok";
}

export function buyBreakthrough(state: GameState, id: string): BuyResult {
  if (activeModifier(state)?.disableBreakthroughs) return "locked";
  const def = BREAKTHROUGH_BY_ID[id];
  if (!def) return "locked";
  if (state.breakthroughs[id]) return "dup";
  if (def.unlockResearch && !state.research[def.unlockResearch]) return "locked";
  const cost = breakthroughCost(def);
  if (state.resources.cycles.lt(cost)) return "poor";
  state.resources.cycles = state.resources.cycles.minus(cost);
  state.breakthroughs[id] = true;
  return "ok";
}

export function buyResearch(state: GameState, id: string): BuyResult {
  if (activeModifier(state)?.disableResearch) return "locked";
  const def = RESEARCH.find((r) => r.id === id);
  if (!def) return "locked";
  if (!isResearchAvailable(state, def)) return "locked";
  const cost = researchCost(def);
  if (state.resources.cycles.lt(cost)) return "poor";
  state.resources.cycles = state.resources.cycles.minus(cost);
  state.research[id] = true;
  return "ok";
}

export function buyWorker(state: GameState): BuyResult {
  if (activeModifier(state)?.disableWorkers) return "locked";
  const cost = workerCost(state.workers ?? 0);
  if (state.resources.cycles.lt(cost)) return "poor";
  state.resources.cycles = state.resources.cycles.minus(cost);
  state.workers = (state.workers ?? 0) + 1;
  return "ok";
}

export function build(state: GameState): Decimal {
  const gain = buildGain(state);
  if (gain.gt(0)) {
    state.resources.cycles = state.resources.cycles.plus(gain);
    state.totals.runCycles = state.totals.runCycles.plus(gain);
    state.totals.lifetimeCycles = state.totals.lifetimeCycles.plus(gain);
    state.totals.builds += 1;
    state.stats.clicks += 1;
  }
  return gain;
}

const autoAccum: Record<string, number> = {};

export function resetAutoAccumulators(): void {
  for (const key of Object.keys(autoAccum)) delete autoAccum[key];
}

export function processAutoBuyers(state: GameState, dtMs: number): number {
  if (activeModifier(state)?.disableAutobuy) return 0;
  const speed = automationSpeed(state);
  let purchases = 0;
  for (const gen of GENERATORS) {
    const ab = state.autoBuyers[gen.id];
    if (!ab || !ab.enabled) continue;
    if (!isGeneratorUnlocked(state, gen)) continue;
    autoAccum[gen.id] = (autoAccum[gen.id] ?? 0) + dtMs * speed;
    if (autoAccum[gen.id] >= ab.interval) {
      autoAccum[gen.id] = 0;
      if (buyGenerator(state, gen.id, ab.budget / 100) === "ok") {
        purchases += 1;
        state.stats.autoPurchases = (state.stats.autoPurchases ?? 0) + 1;
      }
    }
  }
  return purchases;
}

export function resetRun(state: GameState): void {
  state.resources.cycles = new Decimal(0);
  state.totals.runCycles = new Decimal(0);
  state.generators = {};
  state.upgrades = {};
  state.modules = {};
  state.research = {};
  state.breakthroughs = {};
  state.workers = 0;
  state.autoBuyers = {};
  resetAutoAccumulators();
}

export function processRefactor(state: GameState): Decimal {
  const gain = getRefactorGain(state);
  state.prestige.architecturePoints = (state.prestige.architecturePoints ?? 0) + gain.toNumber();
  state.prestige.refactors = (state.prestige.refactors ?? 0) + 1;
  resetRun(state);
  return gain;
}

export function startChallenge(state: GameState, id: string): BuyResult {
  const def = CHALLENGE_BY_ID[id];
  if (!def || getActiveChallenge(state)) return "locked";
  if (!isChallengeUnlocked(state, def)) return "locked";
  resetRun(state);
  state.activeChallenge = id;
  return "ok";
}

export function abandonChallenge(state: GameState): boolean {
  if (!getActiveChallenge(state)) return false;
  resetRun(state);
  state.activeChallenge = null;
  return true;
}

export function processSolveChallenge(state: GameState): number {
  const def = getActiveChallenge(state);
  if (!def) return -1;
  const tier = challengeTier(state, def.id);
  if (state.totals.runCycles.lt(challengeTarget(def, tier))) return -1;
  const reward = def.rewardPerTier * (tier + 1);
  state.challenges[def.id] = tier + 1;
  state.stats.challengesCompleted = (state.stats.challengesCompleted ?? 0) + 1;
  state.activeChallenge = null;
  resetRun(state);
  return reward;
}

export function buySpec(state: GameState, specId: SpecId): boolean {
  const level = state.prestige.specs[specId] ?? 0;
  const cost = specCost(level);
  if ((state.prestige.architecturePoints ?? 0) < cost) return false;
  state.prestige.architecturePoints -= cost;
  state.prestige.specs[specId] = level + 1;
  return true;
}

export function setAutoBuyer(
  state: GameState,
  genId: string,
  patch: Partial<{ enabled: boolean; interval: number; budget: number }>,
): void {
  const current = state.autoBuyers[genId] ?? {
    enabled: false,
    interval: 1000,
    budget: 50,
  };
  state.autoBuyers[genId] = { ...current, ...patch };
}

export function getNextMilestone(state: GameState): { id: string; label: string; description: string } | null {
  for (const m of MILESTONES) {
    if (!m.check(state)) return m;
  }
  return null;
}

export function countResearch(state: GameState): number {
  return RESEARCH.filter((r) => state.research[r.id]).length;
}

export function countUpgrades(state: GameState): number {
  return Object.values(state.upgrades).reduce((a, b) => a + b, 0);
}

export { toDecimal };