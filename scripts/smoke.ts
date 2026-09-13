import assert from "node:assert";
import Decimal from "break_infinity.js";
import { createInitialState } from "../src/game/state";
import {
  applyProduction,
  buyGenerator,
  buyWorker,
  buyResearch,
  buySpec,
  buyBreakthrough,
  buyUpgrade,
  build,
  computeProduction,
  getRefactorGain,
  processRefactor,
  offlineEfficiency,
  workerEfficiency,
  processAutoBuyers,
  setAutoBuyer,
} from "../src/game/engine";
import { sanitizePersisted, serializePersisted } from "../src/game/save";
import { formatNumber, formatDuration } from "../src/game/numbers";

let passed = 0;
function ok(name: string) {
  passed += 1;
  console.log(`ok - ${name}`);
}

{
  assert.strictEqual(createInitialState().resources.cycles.toNumber(), 15, "starter grant");
  const s = createInitialState();
  assert.strictEqual(computeProduction(s).toNumber(), 0);
  assert.strictEqual(buyGenerator(s, "compileCore"), "ok");
  assert.strictEqual(s.resources.cycles.toNumber(), 3);
  assert.strictEqual(computeProduction(s).toNumber(), 12);
  ok("starter grant + first generator");
}

{
  const s = createInitialState();
  buyGenerator(s, "compileCore");
  applyProduction(s, 100);
  assert.strictEqual(s.resources.cycles.toNumber(), 1203);
  assert.strictEqual(s.totals.runCycles.toNumber(), 1200);
  ok("production accumulates");
}

{
  const s = createInitialState();
  buyGenerator(s, "compileCore");
  applyProduction(s, 5000);
  for (let i = 0; i < 9; i++) buyGenerator(s, "compileCore");
  assert.strictEqual(s.generators.compileCore, 10);
  applyProduction(s, 1000);
  assert.strictEqual(buyGenerator(s, "cpu"), "ok");
  assert.strictEqual(buyGenerator(s, "cpu"), "ok");
  ok("cpu unlock via count and sequential purchase");
}

{
  const s = createInitialState();
  buyGenerator(s, "compileCore");
  applyProduction(s, 30);
  assert.strictEqual(buyGenerator(s, "server"), "locked");
  for (let i = 0; i < 4; i++) buyGenerator(s, "compileCore");
  applyProduction(s, 4000);
  assert.strictEqual(buyResearch(s, "server"), "locked", "missing prereq chain");
  buyResearch(s, "runtime");
  applyProduction(s, 4000);
  buyResearch(s, "compiler");
  applyProduction(s, 8000);
  assert.strictEqual(buyResearch(s, "server"), "ok");
  assert.strictEqual(buyGenerator(s, "server"), "ok");
  ok("server unlock via research chain");
}

{
  const s = createInitialState();
  buyGenerator(s, "compileCore");
  applyProduction(s, 60);
  buyWorker(s);
  assert.strictEqual(workerEfficiency(s), 0.1);
  assert.strictEqual(computeProduction(s).toNumber(), 12 * 1.1);
  ok("worker purchase modifies production");
}

{
  const s = createInitialState();
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
  s.totals.runCycles = new Decimal(1e6);
  s.prestige.architecturePoints = 5;
  assert.strictEqual(getRefactorGain(s).toNumber(), 1);
  buySpec(s, "performance");
  assert.strictEqual(s.prestige.specs.performance, 1);
  assert.strictEqual(s.prestige.architecturePoints, 4);
  s.totals.runCycles = new Decimal(1e9);
  const gain = processRefactor(s);
  const expected = Math.floor(Math.pow(1000, 0.6));
  assert.strictEqual(gain.toNumber(), expected);
  assert.strictEqual(s.generators.compileCore ?? 0, 0);
  assert.strictEqual(s.resources.cycles.toNumber(), 0);
  assert.strictEqual(s.prestige.refactors, 1);
  assert.strictEqual(s.prestige.architecturePoints, 4 + expected);
  assert.strictEqual(s.prestige.specs.performance, 1, "spec survives refactor");
  ok("refactor resets and preserves prestige");
}

{
  const s = createInitialState();
  assert.strictEqual(offlineEfficiency(s), 1);
  s.prestige.specs.reliability = 2;
  assert.strictEqual(offlineEfficiency(s), 1.06);
  ok("offline efficiency from reliability spec");
}

{
  const s = createInitialState();
  buyGenerator(s, "compileCore");
  applyProduction(s, 2000);
  assert.strictEqual(buyBreakthrough(s, "monorepo"), "locked", "needs compiler research");
  buyResearch(s, "runtime");
  applyProduction(s, 4000);
  buyResearch(s, "compiler");
  applyProduction(s, 400);
  assert.strictEqual(buyBreakthrough(s, "monorepo"), "ok");
  assert.strictEqual(buyBreakthrough(s, "monorepo"), "dup");
  ok("breakthrough gating + single-purchase");
}

{
  const s = createInitialState();
  assert.strictEqual(buyUpgrade(s, "refine"), "locked", "needs runtime research");
  buyGenerator(s, "compileCore");
  applyProduction(s, 1000);
  buyResearch(s, "runtime");
  applyProduction(s, 100);
  assert.strictEqual(buyUpgrade(s, "refine"), "ok");
  assert.strictEqual(s.upgrades.refine, 1);
  ok("repeatable upgrade purchase");
}

{
  const s = createInitialState();
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
  const roundtrip = sanitizePersisted(serializePersisted(good));
  assert.strictEqual(roundtrip.generators.compileCore, 3);
  assert.strictEqual(roundtrip.workers, 2);
  assert.strictEqual(roundtrip.resources.cycles.toNumber(), 5e12);
  ok("save roundtrip");
}

{
  const corrupted = sanitizePersisted({
    resources: { cycles: "not-a-number" },
    generators: { compileCore: -5, cpu: "x" },
    workers: Infinity,
    prestige: { architecturePoints: -3, refactors: "a", specs: {} },
  });
  assert.strictEqual(corrupted.resources.cycles.sign(), 0);
  assert.strictEqual(corrupted.generators.compileCore ?? 0, 0);
  assert.strictEqual(corrupted.workers, 0);
  assert.strictEqual(corrupted.prestige.refactors, 0);
  assert.strictEqual(corrupted.prestige.architecturePoints, 0);
  assert.strictEqual(corrupted.prestige.specs.performance, 0);
  assert.deepStrictEqual(corrupted.autoBuyers, {});
  ok("sanitization handles corrupt data");
}

{
  const s = createInitialState();
  buyGenerator(s, "compileCore");
  applyProduction(s, 3600);
  assert.strictEqual(s.totals.lifetimeCycles.toNumber(), 12 * 3600);
  const balance = s.resources.cycles;
  void balance;
  assert.strictEqual(formatNumber(new Decimal(1203)), "1.20K");
  assert.strictEqual(formatNumber(new Decimal(8.42e6)), "8.42M");
  assert.strictEqual(formatNumber(new Decimal(43200)), "43.20K");
  assert.strictEqual(formatDuration(3 * 86400 + 7200), "3d 2h");
  assert.strictEqual(formatDuration(61), "1m 1s");
  ok("formatting helpers");
}

console.log(`\nAll ${passed} engine checks passed.`);
void Decimal; // keep import referenced for tooling (used in new Decimal above only in blocks)