import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

const assets = JSON.parse(await readFile(new URL("../src/lib/evidence-assets.json",import.meta.url),"utf8"));
const oneNationRelease = JSON.parse(await readFile(new URL("../src/lib/one-nation-evidence-release.json",import.meta.url),"utf8"));
const oneNationCorpus = JSON.parse(await readFile(new URL("../src/lib/one-nation-frozen-corpus-release.json",import.meta.url),"utf8"));

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

test("One Nation evidence convenience mirror binds the definitive nine-file release", async () => {
  assert.equal(oneNationRelease.version,"1.0.0");
  assert.equal(oneNationRelease.files.length,9);
  assert.equal(oneNationRelease.independentMirrors.zenodo,"https://doi.org/10.5281/zenodo.22036285");
  assert.equal(oneNationRelease.independentMirrors.internetArchive,"https://archive.org/details/boho-news-one-nation-network-evidence-v1-0-0-20260815");
  const names = new Set();
  for (const file of oneNationRelease.files) {
    assert.ok(!names.has(file.name),file.name);
    names.add(file.name);
    assert.match(file.name,/^[A-Za-z0-9._-]+$/);
    assert.match(file.sha256,/^[0-9a-f]{64}$/);
    const bytes = await readFile(new URL(`../public${oneNationRelease.basePath}/${file.name}`,import.meta.url));
    assert.equal(bytes.length,file.bytes,file.name);
    assert.equal(createHash("sha256").update(bytes).digest("hex"),file.sha256,file.name);
  }
  assert.equal(oneNationRelease.archiveSha256,
    oneNationRelease.files.find((file) => file.name === oneNationRelease.archiveFile).sha256);
});

test("One Nation release page exposes direct files and verified third-party mirrors", async () => {
  const page = await readFile(new URL("../src/pages/evidence/one-nation-network/index.astro",import.meta.url),"utf8");
  const route = await readFile(new URL("../src/pages/evidence/one-nation-network/v1.0.0/manifest.json.ts",import.meta.url),"utf8");
  const library = await readFile(new URL("../src/pages/evidence/index.astro",import.meta.url),"utf8");
  assert.match(page,/Complete public package/);
  assert.match(page,/mirrorEntries/);
  assert.match(page,/Zenodo/);
  assert.match(page,/Internet Archive/);
  assert.match(page,/independently and matched against/);
  assert.match(page,/manifest\.json/);
  assert.match(route,/max-age=31536000, immutable/);
  assert.match(library,/\/evidence\/one-nation-network\//);
});

test("One Nation frozen-corpus convenience files match the public release data", async () => {
  assert.equal(oneNationCorpus.status,"built-and-independently-validated");
  assert.equal(oneNationCorpus.custodyEntries,30333);
  assert.equal(oneNationCorpus.uniquePublicSourceObjects,16670);
  assert.equal(oneNationCorpus.archive.localConvenienceCopy,false);
  assert.match(oneNationCorpus.archive.sha256,/^[0-9a-f]{64}$/);
  for (const file of oneNationCorpus.files) {
    const bytes = await readFile(new URL(`../public${oneNationCorpus.basePath}/${file.name}`,import.meta.url));
    assert.equal(bytes.length,file.bytes,file.name);
    assert.equal(createHash("sha256").update(bytes).digest("hex"),file.sha256,file.name);
  }
});

test("One Nation editorial preview is local-only and uses the exact frozen figures", async () => {
  const preview = await readFile(new URL("../src/pages/preview/[slug].astro",import.meta.url),"utf8");
  const figureComponent = await readFile(new URL("../src/components/EvidenceFigure.astro",import.meta.url),"utf8");
  const figureViewer = await readFile(new URL("../src/pages/evidence/one-nation-network/figures/[number].astro",import.meta.url),"utf8");
  const evidenceRoom = await readFile(new URL("../src/pages/evidence/one-nation-network/index.astro",import.meta.url),"utf8");
  const bibliography = await readFile(new URL("../src/lib/one-nation-bibliography.ts",import.meta.url),"utf8");
  const provenance = await readFile(new URL("../public/evidence/one-nation-network/frozen-corpus-20260820/FIGURE-PROVENANCE-SHA256-20260820.csv",import.meta.url),"utf8");
  assert.match(preview,/BOHONEWS_LOCAL_PREVIEW/);
  assert.match(preview,/Private editorial preview — not published/);
  assert.match(preview,/We froze the record—and we will keep watching/);
  assert.doesNotMatch(preview,/29,780 file entries|Full custody disclaimer/);
  assert.match(preview,/SourceCitation/);
  assert.match(preview,/InvestigationBibliography/);
  assert.match(figureComponent,/Open complete original PNG/);
  assert.match(figureComponent,/Page-opening excerpt/);
  assert.doesNotMatch(figureComponent,/Inspect the entire full-page capture/);
  assert.match(figureViewer,/Very tall pages are shown as labeled excerpts/);
  assert.match(evidenceRoom,/bibliography\.json/);
  const sourceIds = new Set([...bibliography.matchAll(/\n\s+id: (\d+),/g)].map((match) => Number(match[1])));
  assert.equal(sourceIds.size,41);
  const citedIds = [...preview.matchAll(/<SourceCitation ids=\{\[([^\]]+)\]\}/g)]
    .flatMap((match) => match[1].split(",").map((value) => Number(value.trim())));
  assert.ok(citedIds.length >= 40);
  for (const id of citedIds) assert.ok(sourceIds.has(id),`missing bibliography source ${id}`);
  const rows = provenance.trim().split("\n").slice(1);
  assert.equal(rows.length,11);
  for (const row of rows) {
    const match = row.match(/^([^,]+),[^,]+,[^,]+,(\d+),([a-f0-9]{64}),/);
    assert.ok(match,row);
    const [,name,expectedBytes,expectedHash] = match;
    const bytes = await readFile(new URL(`../public/media/investigations/one-nation-network/figures/${name}`,import.meta.url));
    assert.equal(bytes.length,Number(expectedBytes),name);
    assert.equal(createHash("sha256").update(bytes).digest("hex"),expectedHash,name);
  }
});
