import assert from "node:assert";
import Decimal from "break_infinity.js";
import { createInitialState } from "../src/game/state";
import {
  applyOfflineGain,
  applyProduction,
  buyGenerator,
  buyWorker,
  buyResearch,
  buySpec,
  buyBreakthrough,
  buyUpgrade,
  build,
  buildGain,
  computeProduction,
  getRefactorGain,
  processRefactor,
  offlineEfficiency,
  workerEfficiency,
  processAutoBuyers,
  setAutoBuyer,
  startChallenge,
  abandonChallenge,
  processSolveChallenge,
  canSolveChallenge,
  challengeRewardMultiplier,
  getActiveChallenge,
} from "../src/game/engine";
import { sanitizePersisted, serializePersisted } from "../src/game/save";
import { formatNumber, formatDuration } from "../src/game/numbers";

let passed = 0;
function ok(name: string) {
  passed += 1;
  console.log(`ok - ${name}`);
}

{
  assert.strictEqual(createInitialState().resources.cycles.toNumber(), 0, "fresh run starts at zero");
  const s = createInitialState();
  assert.strictEqual(computeProduction(s).toNumber(), 0);
  assert.strictEqual(buildGain(s).toNumber(), 1, "initial clicker grant");
  for (let i = 0; i < 40; i++) build(s);
  assert.strictEqual(s.resources.cycles.toNumber(), 40);
  assert.strictEqual(buyGenerator(s, "compileCore"), "ok");
  assert.strictEqual(s.resources.cycles.toNumber(), 0);
  assert.strictEqual(computeProduction(s).toNumber(), 4);
  ok("clicker fuels the first generator");
}

{
  const s = createInitialState();
  s.resources.cycles = new Decimal(40);
  buyGenerator(s, "compileCore");
  applyProduction(s, 100);
  assert.strictEqual(s.resources.cycles.toNumber(), 400);
  assert.strictEqual(s.totals.runCycles.toNumber(), 400);
  ok("production accumulates");
}

{
  const s = createInitialState();
  s.resources.cycles = new Decimal(40);
  buyGenerator(s, "compileCore");
  applyProduction(s, 5000);
  for (let i = 0; i < 14; i++) buyGenerator(s, "compileCore");
  assert.strictEqual(s.generators.compileCore, 15);
  applyProduction(s, 1000);
  assert.strictEqual(buyGenerator(s, "cpu"), "ok");
  assert.strictEqual(buyGenerator(s, "cpu"), "ok");
  ok("cpu unlock via count and sequential purchase");
}

{
  const s = createInitialState();
  assert.strictEqual(buyGenerator(s, "server"), "locked", "no research, no CPUs");
  s.resources.cycles = new Decimal("1e7");
  assert.strictEqual(buyResearch(s, "server"), "locked", "missing prereq chain");
  buyResearch(s, "runtime");
  buyResearch(s, "compiler");
  assert.strictEqual(buyResearch(s, "server"), "ok");
  assert.strictEqual(buyGenerator(s, "server"), "ok");
  ok("server unlock via research chain");
}

{
  const s = createInitialState();
  s.resources.cycles = new Decimal(2600);
  buyGenerator(s, "compileCore");
  buyWorker(s);
  assert.strictEqual(workerEfficiency(s), 0.08);
  assert.ok(Math.abs(computeProduction(s).toNumber() - 4 * 1.08) < 1e-9);
  ok("worker purchase modifies production");
}

{
  const s = createInitialState();
  s.resources.cycles = new Decimal(40);
  buyGenerator(s, "compileCore");
  applyProduction(s, 100);
  const gain = build(s);
  assert.strictEqual(gain.gt(0), true);
  assert.strictEqual(s.totals.builds, 1);
  assert.strictEqual(s.stats.clicks, 1);
  ok("manual build grants gain and increments stats");
}

{
  const s = createInitialState();
  s.totals.runCycles = new Decimal(2500000);
  s.prestige.architecturePoints = 5;
  assert.strictEqual(getRefactorGain(s).toNumber(), 1);
  buySpec(s, "performance");
  assert.strictEqual(s.prestige.specs.performance, 1);
  assert.strictEqual(s.prestige.architecturePoints, 3);
  s.totals.runCycles = new Decimal(1e12);
  const gain = processRefactor(s);
  const expected = Math.floor(Math.pow(400000, 0.5));
  assert.strictEqual(gain.toNumber(), expected);
  assert.strictEqual(s.generators.compileCore ?? 0, 0);
  assert.strictEqual(s.resources.cycles.toNumber(), 0);
  assert.strictEqual(s.prestige.refactors, 1);
  assert.strictEqual(s.prestige.architecturePoints, 3 + expected);
  assert.strictEqual(s.prestige.specs.performance, 1, "spec survives refactor");
  ok("refactor resets and preserves prestige");
}

{
  const s = createInitialState();
  assert.strictEqual(offlineEfficiency(s), 1);
  s.prestige.specs.reliability = 2;
  assert.strictEqual(offlineEfficiency(s), 1.04);
  ok("offline efficiency from reliability spec");
}

{
  const s = createInitialState();
  s.prestige.refactors = 1;
  assert.strictEqual(startChallenge(s, "unknown"), "locked", "unknown challenge id");
  assert.strictEqual(startChallenge(s, "throttle"), "locked", "needs 7 refactors");
  assert.strictEqual(startChallenge(s, "blackout"), "ok");
  assert.strictEqual(getActiveChallenge(s)?.id, "blackout");
  assert.strictEqual(startChallenge(s, "baremetal"), "locked", "one challenge at a time");
  assert.strictEqual(offlineEfficiency(s), 0, "blackout disables offline");
  assert.strictEqual(getRefactorGain(s).toNumber(), 0, "no AP while challenge is active");
  const before = s.stats.challengesCompleted ?? 0;
  s.totals.runCycles = new Decimal(5e6);
  assert.strictEqual(canSolveChallenge(s), true);
  const reward = processSolveChallenge(s);
  assert.strictEqual(reward, 0.08);
  assert.strictEqual(s.challenges.blackout, 1);
  assert.strictEqual(s.activeChallenge, null);
  assert.strictEqual(s.stats.challengesCompleted, before + 1);
  assert.ok(challengeRewardMultiplier(s).eq(1.08), "reward multiplier banks permanently");
  ok("challenge lifecycle: enter, solve, reward");
}

{
  const s = createInitialState();
  s.prestige.refactors = 5;
  s.resources.cycles = new Decimal("1e12");
  startChallenge(s, "baremetal");
  assert.strictEqual(buyResearch(s, "runtime"), "locked", "research disabled in bare metal");
  assert.strictEqual(buyBreakthrough(s, "monorepo"), "locked");
  abandonChallenge(s);
  assert.strictEqual(startChallenge(s, "vanilla"), "ok");
  s.resources.cycles = new Decimal("1e12");
  assert.strictEqual(buyResearch(s, "runtime"), "ok", "research still allowed in vanilla");
  assert.strictEqual(buyUpgrade(s, "refine"), "locked", "upgrades disabled in vanilla");
  abandonChallenge(s);
  assert.strictEqual(startChallenge(s, "skeleton"), "ok");
  s.resources.cycles = new Decimal("1e12");
  assert.strictEqual(buyWorker(s), "locked", "workers disabled in skeleton");
  assert.strictEqual(buyGenerator(s, "compileCore"), "ok", "generators remain buyable");
  assert.strictEqual(startChallenge(s, "manual"), "locked", "cannot stack challenges");
  ok("challenge modifiers gate purchases");
}

{
  const s = createInitialState();
  s.prestige.refactors = 1;
  startChallenge(s, "blackout");
  const rewardNow = challengeRewardMultiplier(s).toNumber();
  assert.strictEqual(rewardNow, 1, "no reward before any solve");
  assert.strictEqual(abandonChallenge(s), true);
  assert.strictEqual(getActiveChallenge(s), null);
  assert.strictEqual(abandonChallenge(s), false, "nothing to abandon");
  ok("challenge abandon clears state");
}

{
  const s = createInitialState();
  s.resources.cycles = new Decimal(40);
  buyGenerator(s, "compileCore");
  applyProduction(s, 2000);
  assert.strictEqual(buyBreakthrough(s, "monorepo"), "locked", "needs compiler research");
  buyResearch(s, "runtime");
  applyProduction(s, 4000);
  buyResearch(s, "compiler");
  applyProduction(s, 2000);
  assert.strictEqual(buyBreakthrough(s, "monorepo"), "ok");
  assert.strictEqual(buyBreakthrough(s, "monorepo"), "dup");
  ok("breakthrough gating + single-purchase");
}

{
  const s = createInitialState();
  assert.strictEqual(buyUpgrade(s, "refine"), "locked", "needs runtime research");
  s.resources.cycles = new Decimal(40);
  buyGenerator(s, "compileCore");
  applyProduction(s, 3000);
  buyResearch(s, "runtime");
  applyProduction(s, 100);
  assert.strictEqual(buyUpgrade(s, "refine"), "ok");
  assert.strictEqual(s.upgrades.refine, 1);
  ok("repeatable upgrade purchase");
}

{
  const s = createInitialState();
  s.resources.cycles = new Decimal(40);
  buyGenerator(s, "compileCore");
  applyProduction(s, 60);
  const balanceBefore = s.resources.cycles.toNumber();
  assert.ok(balanceBefore > 100, `should have room to buy (${balanceBefore})`);
  setAutoBuyer(s, "compileCore", { interval: 1000, budget: 50 });
  setAutoBuyer(s, "compileCore", { enabled: true });
  const bought = processAutoBuyers(s, 2000);
  assert.ok(bought >= 1, "autobuyer should purchase within 2s at 1s interval");
  ok(`autobuyer purchases (${bought})`);
}

{
  const good = createInitialState();
  good.generators.compileCore = 3;
  good.workers = 2;
  good.resources.cycles = new Decimal("5e12");
  good.stats.purchases = 42;
  good.stats.autoPurchases = 9;
  good.stats.offlineCycles = new Decimal("123e6");
  good.stats.peakProduction = new Decimal("7e9");
  good.stats.challengesCompleted = 4;
  good.challenges = { blackout: 2, throttle: 1 };
  good.activeChallenge = "blackout";
  const roundtrip = sanitizePersisted(serializePersisted(good));
  assert.strictEqual(roundtrip.generators.compileCore, 3);
  assert.strictEqual(roundtrip.workers, 2);
  assert.strictEqual(roundtrip.resources.cycles.toNumber(), 5e12);
  assert.strictEqual(roundtrip.stats.purchases, 42);
  assert.strictEqual(roundtrip.stats.autoPurchases, 9);
  assert.strictEqual(roundtrip.stats.offlineCycles.toNumber(), 123e6);
  assert.strictEqual(roundtrip.stats.peakProduction.toNumber(), 7e9);
  assert.strictEqual(roundtrip.stats.challengesCompleted, 4);
  assert.deepStrictEqual(roundtrip.challenges, { blackout: 2, throttle: 1 });
  assert.strictEqual(roundtrip.activeChallenge, "blackout");
  ok("save roundtrip");
}

{
  const corrupted = sanitizePersisted({
    resources: { cycles: "not-a-number" },
    generators: { compileCore: -5, cpu: "x" },
    workers: Infinity,
    prestige: { architecturePoints: -3, refactors: "a", specs: {} },
    challenges: { blackout: -1, bogus: 9 },
    activeChallenge: "nonexistent-challenge",
  });
  assert.strictEqual(corrupted.resources.cycles.sign(), 0);
  assert.strictEqual(corrupted.generators.compileCore ?? 0, 0);
  assert.strictEqual(corrupted.workers, 0);
  assert.strictEqual(corrupted.prestige.refactors, 0);
  assert.strictEqual(corrupted.prestige.architecturePoints, 0);
  assert.strictEqual(corrupted.prestige.specs.performance, 0);
  assert.deepStrictEqual(corrupted.autoBuyers, {});
  assert.deepStrictEqual(corrupted.challenges, {});
  assert.strictEqual(corrupted.activeChallenge, null);
  assert.strictEqual(corrupted.stats.challengesCompleted, 0);
  ok("sanitization handles corrupt data");
}

{
  const s = createInitialState();
  s.resources.cycles = new Decimal(40);
  buyGenerator(s, "compileCore");
  applyProduction(s, 3600);
  assert.strictEqual(s.totals.lifetimeCycles.toNumber(), 4 * 3600);
  const balance = s.resources.cycles;
  void balance;
  assert.strictEqual(formatNumber(new Decimal(1203)), "1.20K");
  assert.strictEqual(formatNumber(new Decimal(8.42e6)), "8.42M");
  assert.strictEqual(formatNumber(new Decimal(43200)), "43.20K");
  assert.strictEqual(formatDuration(3 * 86400 + 7200), "3d 2h");
  assert.strictEqual(formatDuration(61), "1m 1s");
  ok("formatting helpers");
}

{
  const s = createInitialState();
  s.resources.cycles = new Decimal("1e9");
  buyGenerator(s, "compileCore");
  buyGenerator(s, "compileCore");
  assert.strictEqual(s.stats.purchases, 2);
  applyOfflineGain(s, new Decimal(500));
  assert.strictEqual(s.stats.offlineCycles.toNumber(), 500);
  setAutoBuyer(s, "compileCore", { interval: 100, budget: 50 });
  setAutoBuyer(s, "compileCore", { enabled: true });
  const bought = processAutoBuyers(s, 1000);
  assert.ok(bought >= 1, `autobuy should purchase (${bought})`);
  assert.strictEqual(s.stats.autoPurchases, bought);
  ok("stat tracking (purchases/auto/offline)");
}

{
  const s = createInitialState();
  s.resources.cycles = new Decimal("1e30");
  const chain = ["runtime", "compiler", "server", "gpu", "db", "mesh", "canary"];
  for (const id of chain) {
    assert.strictEqual(buyResearch(s, id), "ok", `research ${id}`);
  }
  assert.strictEqual(buyResearch(s, "canary"), "locked", "no double purchase");
  assert.strictEqual(buyBreakthrough(s, "rollout"), "ok");
  assert.strictEqual(buyBreakthrough(s, "predict"), "locked", "predict needs telemetry");
  buyResearch(s, "telemetry");
  assert.strictEqual(buyBreakthrough(s, "predict"), "ok");
  ok("late research tier + breakthrough unlocks");
}

{
  const s = createInitialState();
  s.resources.cycles = new Decimal(40);
  assert.strictEqual(computeProduction(s).toNumber(), 0);
  buyGenerator(s, "compileCore");
  applyOfflineGain(s, new Decimal(0)); // zero offline gains are inert
  assert.strictEqual(s.stats.offlineCycles.toNumber(), 0);
  ok("offline stat ignores zero gains");
}

{
  assert.strictEqual(formatNumber(new Decimal(999960)), "1.00M", "thousand boundary rolls over");
  assert.strictEqual(formatNumber(new Decimal(999900)), "999.9K", "below boundary stays in group");
  assert.strictEqual(formatNumber(new Decimal(9999500)), "10.00M", "large boundary rolls over");
  ok("formatNumber suffix rollover at boundaries");
}

console.log(`\nAll ${passed} engine checks passed.`);
void Decimal; // keep import referenced for tooling (used in new Decimal above only in blocks)