import assert from "node:assert";
import Decimal from "break_infinity.js";

const storage = new Map<string, string>();
(globalThis as Record<string, unknown>).localStorage = {
  getItem: (k: string) => storage.get(k) ?? null,
  setItem: (k: string, v: string) => {
    storage.set(k, v);
  },
  removeItem: (k: string) => {
    storage.delete(k);
  },
  clear: () => storage.clear(),
};
(globalThis as Record<string, unknown>).window = {
  addEventListener: () => {},
};
(globalThis as Record<string, unknown>).document = {
  addEventListener: () => {},
  visibilityState: "visible",
  documentElement: { style: { setProperty: () => {} } },
};

let passed = 0;
function ok(name: string) {
  passed += 1;
  console.log(`ok - ${name}`);
}

async function main() {
  const { useGame } = await import("../src/game/store");
  const { serializePersisted, importSave } = await import("../src/game/save");
  const { createInitialState } = await import("../src/game/state");

// Fresh boot
{
  useGame.getState().boot();
  const s = useGame.getState();
  assert.strictEqual(s.booted, true);
  assert.strictEqual(s.resources.cycles.toNumber(), 0);
  assert.ok(s.logs.length >= 3);
  ok("fresh boot initializes state");
}

// Tick advances production (clicker funds the first generator)
{
  for (let i = 0; i < 12; i++) useGame.getState().actExecuteBuild();
  useGame.getState().actBuyGenerator("compileCore");
  const st = useGame.getState();
  assert.strictEqual(st.resources.cycles.toNumber(), 0, "first core consumes the 12 clicked cycles");
  const before = st.resources.cycles.toNumber();
  const now = Date.now();
  useGame.getState().tick(now + 100);
  useGame.getState().tick(now + 200);
  const s2 = useGame.getState();
  const after = s2.resources.cycles.toNumber();
  assert.ok(after > before, `cycles should grow after ticks (${before} -> ${after})`);
  ok("tick accumulates cycles (10Hz)");
}

// Offline flow: pre-seed a save 10h old with one generator
{
  const seeded = createInitialState();
  seeded.generators.compileCore = 1;
  seeded.lastSave = Date.now() - 10 * 3600 * 1000;
  storage.set("infra-exponent-save-v1", JSON.stringify(serializePersisted(seeded)));
  // force a fresh boot path by re-running boot (already booted => returns early, so reset booted guard)
  useGame.setState({ booted: false });
  useGame.getState().boot();
  const s = useGame.getState();
  assert.ok(s.offlineInfo, "offline session detected");
  assert.ok(s.offlineInfo.seconds > 30000, "elapsed captured");
  assert.ok(Math.abs(s.offlineInfo.gained.toNumber() - 12 * 36000) < 20, "gained ~ production*elapsed");
  ok("offline production computed deterministically");
}

// Challenge flow: enter, reach target, solve
{
  useGame.setState({
    prestige: { ...useGame.getState().prestige, refactors: 1 },
  });
  useGame.getState().actStartChallenge("blackout");
  let s = useGame.getState();
  assert.strictEqual(s.activeChallenge, "blackout", "challenge starts");
  assert.ok(
    s.logs.some((l) => l.text.includes("CHALLENGE")),
    "challenge logged",
  );
  useGame.setState({ totals: { ...s.totals, runCycles: new Decimal(2e6) } });
  useGame.getState().actSolveChallenge();
  s = useGame.getState();
  assert.strictEqual(s.activeChallenge, null, "challenge resolved");
  assert.strictEqual(s.challenges.blackout, 1, "tier banked");
  assert.strictEqual(s.stats.challengesCompleted, 1, "completion stat");
  assert.ok(s.logs.some((l) => l.text.includes("Solved")), "solve logged");
  ok("challenges via store");
}

// Hard reset
{
  useGame.getState().hardReset();
  const s = useGame.getState();
  assert.strictEqual(s.resources.cycles.toNumber(), 0);
  assert.strictEqual(s.generators.compileCore ?? 0, 0);
  assert.strictEqual(s.offlineInfo, null);
  ok("hard reset wipes to fresh state");
}

// Save import restores a persisted archive
{
  const snapshot = createInitialState();
  snapshot.generators.compileCore = 5;
  snapshot.workers = 3;
  snapshot.prestige.architecturePoints = 7;
  snapshot.totals.runCycles = new Decimal("4.2e7");
  const archive = JSON.stringify(serializePersisted(snapshot));
  const imported = importSave(archive);
  assert.ok(imported, "archive parses");
  assert.strictEqual(imported!.generators.compileCore, 5, "archive generators");
  assert.strictEqual(imported!.workers, 3, "archive workers");
  assert.strictEqual(importSave("not json"), null, "garbage rejected");
  useGame.getState().actImportSave(imported!);
  const s = useGame.getState();
  assert.strictEqual(s.generators.compileCore, 5, "generators restored in store");
  assert.strictEqual(s.prestige.architecturePoints, 7, "AP restored");
  assert.strictEqual(s.totals.runCycles.toNumber(), 4.2e7, "run cycles restored");
  assert.ok(s.booted, "booted after import");
  assert.strictEqual(s.offlineInfo, null, "no offline modal after import");
  ok("save import restores state");
}

console.log(`\nAll ${passed} store checks passed.`);
  process.exit(0);
}

main().then(() => {
  process.exit(0);
});
void Decimal;