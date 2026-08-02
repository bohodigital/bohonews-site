import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

const assets = JSON.parse(await readFile(new URL("../src/lib/evidence-assets.json",import.meta.url),"utf8"));

test("evidence inventory binds every preserved file by SHA-256", async () => {
  assert.ok(assets.length >= 20);
  const ids = new Set();
  const paths = new Set();
  for (const asset of assets) {
    assert.ok(!ids.has(asset.id),asset.id);
    assert.ok(!paths.has(asset.path),asset.path);
    ids.add(asset.id);
    paths.add(asset.path);
    assert.match(asset.sha256,/^[0-9a-f]{64}$/);
    assert.ok(asset.sourceIds.length > 0);
    assert.ok(asset.storySlugs.length > 0);
    const bytes = await readFile(new URL(`../public${asset.path}`,import.meta.url));
    assert.equal(createHash("sha256").update(bytes).digest("hex"),asset.sha256,asset.path);
    if (asset.mediaType === "application/pdf") {
      assert.equal(bytes.subarray(0,5).toString("ascii"),"%PDF-",asset.path);
      assert.ok(asset.pages > 0,asset.path);
    } else {
      assert.deepEqual([...bytes.subarray(0,2)],[0x50,0x4b],asset.path);
      assert.equal(asset.pages,null,asset.path);
    }
  }
});

test("Evidence Library indexes public citations without changing article packages", async () => {
  const page = await readFile(new URL("../src/pages/evidence/index.astro",import.meta.url),"utf8");
  const interlochen = await readFile(new URL("../src/pages/investigations/interlochen/evidence/index.astro",import.meta.url),"utf8");
  assert.match(page,/articles/);
  assert.match(page,/article\.citations/);
  assert.match(page,/Original source/);
  assert.match(page,/Preserved copy/);
  assert.match(page,/Public accessibility is not permission to republish/);
  assert.match(page,/manifest\.json/);
  assert.match(interlochen,/historical-investigation/);
  assert.match(interlochen,/statement-interlochen/);
  for (const marker of ["sanghavi-report.pdf","e0020-grand-jury-exhibit-bundle.pdf","e0023-maxwell-day-2-interlochen-excerpt.pdf","e0024-maxwell-day-3-interlochen-excerpt.pdf","e0026-maxwell-day-8-interlochen-excerpt.pdf"]) {
    assert.match(interlochen,new RegExp(marker.replaceAll(".","\\.")));
  }
});

test("machine-readable evidence manifest exports the bound asset inventory", async () => {
  const route = await readFile(new URL("../src/pages/evidence/manifest.json.ts",import.meta.url),"utf8");
  assert.match(route,/evidenceAssets/);
  assert.match(route,/schemaVersion/);
  assert.match(route,/application\/json/);
});
