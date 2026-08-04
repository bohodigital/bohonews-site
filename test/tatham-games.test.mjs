import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

const pin = "3c3632259d298ab62aafa8a5858823569ab1af46";
const asset = (name) => new URL(`../public/vendor/tatham/${pin}/${name}`,import.meta.url);

test("Tatham local-preview assets match the generated SHA-256 manifest", async () => {
  const sums = (await readFile(asset("SHA256SUMS"),"utf8")).trim().split("\n").map((line)=>line.trim().split(/\s+/));
  assert.deepEqual(sums.map(([,name])=>name),["LICENCE","source-lock.json","loopy.js","loopy.wasm","mines.js","mines.wasm","pattern.js","pattern.wasm"]);
  for (const [expected,name] of sums) {
    const bytes = await readFile(asset(name));
    assert.equal(createHash("sha256").update(bytes).digest("hex"),expected,name);
  }
});

test("Nonogram uses the shared pinned host without a third-party network dependency", async () => {
  const [host,page,lock,build] = await Promise.all([
    readFile(new URL("../src/components/games/TathamPuzzleHost.astro",import.meta.url),"utf8"),
    readFile(new URL("../src/pages/games/nonogram.astro",import.meta.url),"utf8"),
    readFile(new URL("../docs/games/vendor/tatham-puzzles.lock.json",import.meta.url),"utf8"),
    readFile(new URL("../scripts/games/build-tatham.sh",import.meta.url),"utf8")
  ]);
  assert.match(host,new RegExp(`/vendor/tatham/\\$\\{pin\\}/\\$\\{asset\\}\\.js`));
  for (const id of ["puzzle","gamemenu","gametype","puzzlecanvascontain","puzzlecanvas","statusbar","resizable","resizehandle","apology"]) assert.match(host,new RegExp(`id=["']${id}["']`));
  assert.match(host,/data-tatham-mode="mark"/);
  assert.match(page,/asset="pattern"/);
  assert.doesNotMatch(host,/https?:\/\//);
  assert.equal(JSON.parse(lock).commit,pin);
  assert.match(build,/--target mines pattern loopy/);
  assert.match(build,/-DMIN_CHROME_VERSION=120/);
});

test("Loopy uses the pinned host with local serialization and touch-safe edge modes", async () => {
  const [host,page,lock] = await Promise.all([
    readFile(new URL("../src/components/games/TathamPuzzleHost.astro",import.meta.url),"utf8"),
    readFile(new URL("../src/pages/games/loopy.astro",import.meta.url),"utf8"),
    readFile(new URL("../docs/games/vendor/tatham-puzzles.lock.json",import.meta.url),"utf8")
  ]);
  assert.match(host,/"loopy"/);
  assert.match(host,/Exclude edge/);
  assert.match(page,/asset="loopy"/);
  assert.match(page,/localStorage\.getItem\(STORAGE_KEY\)/);
  assert.match(page,/_get_save_file/);
  assert.match(page,/_load_game/);
  assert.match(page,/canvas\.blur\(\);window\.scrollTo\(0,0\)/);
  assert.match(page,/game:"loopy"[\s\S]*scoreBucket:pointsBucket/);
  assert.ok(JSON.parse(lock).targets.includes("loopy"));
});

test("Minesweeper uses the pinned no-guess engine with canonical presets and resumable pro controls", async () => {
  const [host,page,lock,notices] = await Promise.all([
    readFile(new URL("../src/components/games/TathamPuzzleHost.astro",import.meta.url),"utf8"),
    readFile(new URL("../src/pages/games/minesweeper.astro",import.meta.url),"utf8"),
    readFile(new URL("../docs/games/vendor/tatham-puzzles.lock.json",import.meta.url),"utf8"),
    readFile(new URL("../docs/games/THIRD-PARTY-NOTICES.md",import.meta.url),"utf8")
  ]);
  assert.match(host,/asset === "mines" \? "Reveal"/);
  assert.match(host,/asset === "mines" \? "Flag"/);
  assert.match(page,/asset="mines"/);
  for (const preset of [/Beginner · 9×9 · 10 mines/,/Intermediate · 16×16 · 40 mines/,/Expert · 30×16 · 99 mines/]) assert.match(page,preset);
  assert.match(page,/Enter reveals or chords/);
  assert.match(page,/Space flags/);
  assert.match(page,/_get_save_file/);
  assert.match(page,/_load_game/);
  assert.match(page,/let pendingRestore=state\.serialized/);
  assert.match(page,/if\(pendingRestore\)\{const saved=pendingRestore;pendingRestore=null;if\(!restoreEngine\(saved\)\)/);
  assert.match(page,/DEAD!/);
  assert.match(page,/COMPLETED!/);
  assert.match(page,/if\(!state\.failed&&!state\.practice\)\{record\("won"\);void report\("won"\);\}/);
  assert.match(page,/game:"minesweeper"[\s\S]*scoreBucket:pointsBucket/);
  assert.ok(JSON.parse(lock).targets.includes("mines"));
  assert.match(notices,/`mines`[\s\S]*for Minesweeper/);
});
