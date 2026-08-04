import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

const pin = "3c3632259d298ab62aafa8a5858823569ab1af46";
const asset = (name) => new URL(`../public/vendor/tatham/${pin}/${name}`,import.meta.url);

test("Tatham local-preview assets match the generated SHA-256 manifest", async () => {
  const sums = (await readFile(asset("SHA256SUMS"),"utf8")).trim().split("\n").map((line)=>line.trim().split(/\s+/));
  assert.deepEqual(sums.map(([,name])=>name),["LICENCE","source-lock.json","mines.js","mines.wasm","pattern.js","pattern.wasm"]);
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
  for (const id of ["puzzle","gamemenu","gametype","puzzlecanvas","statusbar","resizable","resizehandle","apology"]) assert.match(host,new RegExp(`id=["']${id}["']`));
  assert.match(host,/data-tatham-mode="mark"/);
  assert.match(page,/asset="pattern"/);
  assert.doesNotMatch(host,/https?:\/\//);
  assert.equal(JSON.parse(lock).commit,pin);
  assert.match(build,/--target mines pattern/);
  assert.match(build,/-DMIN_CHROME_VERSION=120/);
});
