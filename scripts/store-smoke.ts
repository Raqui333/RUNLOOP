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
  const { serializePersisted } = await import("../src/game/save");
  const { createInitialState } = await import("../src/game/state");

// Fresh boot
{
  useGame.getState().boot();
  const s = useGame.getState();
  assert.strictEqual(s.booted, true);
  assert.strictEqual(s.resources.cycles.toNumber(), 15);
  assert.ok(s.logs.length >= 3);
  ok("fresh boot initializes state");
}

// Tick advances production (buy a generator first)
{
  useGame.getState().actBuyGenerator("compileCore");
  const st = useGame.getState();
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

// Hard reset
{
  useGame.getState().hardReset();
  const s = useGame.getState();
  assert.strictEqual(s.resources.cycles.toNumber(), 15);
  assert.strictEqual(s.generators.compileCore ?? 0, 0);
  assert.strictEqual(s.offlineInfo, null);
  ok("hard reset wipes to fresh state");
}

console.log(`\nAll ${passed} store checks passed.`);
  process.exit(0);
}

main().then(() => {
  process.exit(0);
});
void Decimal;