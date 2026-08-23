import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import {
  link,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  realpath,
  rename,
  rm,
  symlink,
  writeFile
} from "node:fs/promises";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import test from "node:test";
import {
  applyFinalizationOverlay,
  FINALIZATION_FASTPATH_CONTRACT_VERSION,
  planFinalizationOverlay,
  prepareActivationLayout,
  readActivationLayout,
  readFinalizationCompletion,
  readFinalizationPlan,
  readPreparationBinding
} from "../scripts/publishing/finalization-fastpath.mjs";
import { finalizationCodeInventory } from "../scripts/publishing/finalization-code-inventory.mjs";
import { stableJson } from "../scripts/publishing/stable-json.mjs";
import {
  verifyActivationArtifactAgainstSource
} from "../scripts/publishing/validate-activation.mjs";

const contractVector = JSON.parse(await readFile(new URL(
  "./fixtures/finalization-fastpath-contract-vector.v1.json",import.meta.url
),"utf8"));
const TEST_CANDIDATE_DIGEST = "b".repeat(64);
const TEST_ACTIVATION_MARKER = `${JSON.stringify({
  articleIds:["BN-TEST-CANDIDATE"],
  candidateDigest:TEST_CANDIDATE_DIGEST,
  releaseState:"activation",
  schemaVersion:"1.0.0"
})}\n`;

function assertContractKeys(value,name) {
  assert.deepEqual(
    Object.keys(value).sort(),
    [...contractVector.recordKeySets[name]].sort(),
    `${name} key set differs from the shared contract vector`
  );
}

function preparationBinding(overrides = {}) {
  const unsigned = {
    schemaVersion:"1.0.0",
    contractVersion:FINALIZATION_FASTPATH_CONTRACT_VERSION,
    approvalDigest:"a".repeat(64),
    candidatePackageDigest:TEST_CANDIDATE_DIGEST,
    sourceActivationArtifactSha256:"c".repeat(64),
    sourceInventorySha256:"d".repeat(64),
    sourceMarkerSha256:createHash("sha256").update(TEST_ACTIVATION_MARKER).digest("hex"),
    ...overrides
  };
  return {
    ...unsigned,
    recordHash:createHash("sha256").update(stableJson(unsigned)).digest("hex")
  };
}

function rehashRecord(value) {
  const unsigned = structuredClone(value);
  delete unsigned.recordHash;
  return {
    ...unsigned,
    recordHash:createHash("sha256").update(stableJson(unsigned)).digest("hex")
  };
}

async function write(path,value) {
  await mkdir(dirname(path),{recursive:true});
  await writeFile(path,value,{flag:"wx"});
}

async function artifactTreeDigest(root) {
  const files = [];
  async function visit(directory) {
    for (const entry of await readdir(directory,{withFileTypes:true})) {
      const path = join(directory,entry.name);
      if (entry.isDirectory()) await visit(path);
      else {
        const bytes = await readFile(path);
        files.push({
          path:path.slice(root.length + 1).split("\\").join("/"),
          size:String(bytes.length),
          sha256:createHash("sha256").update(bytes).digest("hex")
        });
      }
    }
  }
  await visit(root);
  files.sort(({path:left},{path:right}) => left < right ? -1 : left > right ? 1 : 0);
  return createHash("sha256").update(stableJson({files})).digest("hex");
}

async function fixture() {
  const root = await mkdtemp(join(await realpath(tmpdir()),"bohonews-finalization-fastpath-"));
  const publicRoot = join(root,"public");
  const activationParent = join(root,"activation");
  const activationRoot = join(activationParent,"prepared-dist");
  const generatedRoot = join(root,"generated");
  const layoutPath = join(root,"bohonews-finalization-activation-layout.v1.json");
  const planPath = join(root,"bohonews-finalization-plan.v1.json");
  const completionPath = join(root,"bohonews-finalization-completion.v1.json");
  await Promise.all([
    mkdir(publicRoot,{recursive:true}),
    mkdir(activationRoot,{recursive:true}),
    mkdir(generatedRoot,{recursive:true})
  ]);
  await write(join(publicRoot,"media/story/lead.webp"),"invariant-media");
  await write(join(publicRoot,"logo.svg"),"<svg>fixed</svg>");
  await write(join(publicRoot,"_headers"),"/*\n  X-Robots-Tag: index\n");
  await write(
    join(publicRoot,".well-known/bohonews-release.json"),
    '{"schemaVersion":"1.1.0","markerHash":"final"}\n'
  );
  await write(join(activationRoot,"media/story/lead.webp"),"invariant-media");
  await write(join(activationRoot,"logo.svg"),"<svg>fixed</svg>");
  await write(join(activationRoot,"_headers"),"/*\n  X-Robots-Tag: noindex, nofollow\n");
  await write(join(activationRoot,"index.html"),"activation home");
  await write(join(activationRoot,"_astro/activation-only.js"),"preview bundle");
  await write(
    join(activationRoot,".well-known/bohonews-activation.json"),
    TEST_ACTIVATION_MARKER
  );
  await write(join(generatedRoot,"index.html"),"final home");
  await write(join(generatedRoot,"articles/story/index.html"),"final story");
  await write(join(generatedRoot,"_astro/final.js"),"final bundle");
  await write(join(generatedRoot,"robots.txt"),"User-agent: *\nAllow: /\n");
  const layout = await prepareActivationLayout({
    artifactRoot:activationRoot,
    publicRoot,
    preparationBinding:preparationBinding(),
    outputPath:layoutPath
  });
  const plan = await planFinalizationOverlay({
    artifactRoot:activationRoot,
    activationManifestPath:layoutPath,
    generatedRoot,
    publicRoot,
    planPath
  });
  const finalParent = join(root,"final");
  const finalRoot = join(finalParent,"prepared-dist");
  await mkdir(finalParent,{recursive:true});
  await rename(activationRoot,finalRoot);
  return {
    root,publicRoot,generatedRoot,layoutPath,planPath,completionPath,
    layout,plan,finalRoot
  };
}

test("fastpath atomically reuses invariants and applies only exact final output", async (t) => {
  const value = await fixture();
  t.after(() => rm(value.root,{recursive:true,force:true}));
  const before = await lstat(join(value.finalRoot,"media/story/lead.webp"),{bigint:true});
  const result = await applyFinalizationOverlay({
    artifactRoot:value.finalRoot,
    activationManifestPath:value.layoutPath,
    finalizationPlanPath:value.planPath,
    generatedRoot:value.generatedRoot,
    publicRoot:value.publicRoot,
    completionPath:value.completionPath
  });
  assert.equal(result.contractVersion,FINALIZATION_FASTPATH_CONTRACT_VERSION);
  assert.equal(await readFile(join(value.finalRoot,"index.html"),"utf8"),"final home");
  assert.equal(
    await readFile(join(value.finalRoot,".well-known/bohonews-release.json"),"utf8"),
    '{"schemaVersion":"1.1.0","markerHash":"final"}\n'
  );
  assert.equal(await readFile(join(value.finalRoot,"_headers"),"utf8"),"/*\n  X-Robots-Tag: index\n");
  await assert.rejects(readFile(join(value.finalRoot,"_astro/activation-only.js")),/ENOENT/);
  await assert.rejects(
    readFile(join(value.finalRoot,".well-known/bohonews-activation.json")),
    /ENOENT/
  );
  const after = await lstat(join(value.finalRoot,"media/story/lead.webp"),{bigint:true});
  assert.equal(after.dev,before.dev);
  assert.equal(after.ino,before.ino);
  assert.equal(after.mtimeNs,before.mtimeNs);
  assert.equal(after.ctimeNs,before.ctimeNs);
  assert.equal(after.nlink,1n);
  assert(result.changed.some(({path}) => path === "index.html"));
  assert(result.deleted.some(({path}) => path === "_astro/activation-only.js"));
  assertContractKeys(preparationBinding(),"preparationBinding");
  assertContractKeys(value.layout,"activationLayout");
  assertContractKeys(value.layout.files[0],"activationFile");
  assertContractKeys(value.plan,"plan");
  assertContractKeys(value.plan.desired[0],"planDesired");
  assertContractKeys(value.plan.changed[0],"planChanged");
  assertContractKeys(value.plan.deleted[0],"planDeleted");
  assertContractKeys(value.plan.deleted[0].old,"oldState");
  assertContractKeys(value.plan.changed[0].new,"plannedNewState");
  assertContractKeys(result,"completion");
  assertContractKeys(result.changed[0].new,"completedNewState");
  assert.equal(typeof value.plan.desired[0].size,"string");
  assert.equal(typeof result.changed[0].new.inode,"string");
  assert.equal(contractVector.finalTreeDigestAlgorithm.desiredExcludesActivationInvariants,true);
  const invariantPaths = new Set(
    value.layout.files.filter(({role}) => role === "invariant").map(({path}) => path)
  );
  assert.equal(value.plan.desired.some(({path}) => invariantPaths.has(path)),false);
  assert.equal(await artifactTreeDigest(value.finalRoot),value.plan.finalTreeDigest);
  assert.deepEqual(contractVector.siteCommands.postcheck,[
    "node","scripts/publishing/attest-finalization-fastpath.mjs","post",
    "bohonews-finalization-precheck.v1.json",
    "bohonews-finalization-activation-layout.v1.json",
    "bohonews-finalization-plan.v1.json",
    "bohonews-finalization-completion.v1.json","FINAL_PREPARED_DIST",
    "FINALIZATION_DIFF","bohonews-finalization-postcheck.v1.json"
  ]);

  const repeated = await applyFinalizationOverlay({
    artifactRoot:value.finalRoot,
    activationManifestPath:value.layoutPath,
    finalizationPlanPath:value.planPath,
    generatedRoot:value.generatedRoot,
    publicRoot:value.publicRoot,
    completionPath:value.completionPath
  });
  assert.deepEqual(repeated,result);
});

test("fastpath resumes an approved partially applied overlay", async (t) => {
  const value = await fixture();
  t.after(() => rm(value.root,{recursive:true,force:true}));
  await writeFile(join(value.finalRoot,"index.html"),"final home");
  const result = await applyFinalizationOverlay({
    artifactRoot:value.finalRoot,
    activationManifestPath:value.layoutPath,
    finalizationPlanPath:value.planPath,
    generatedRoot:value.generatedRoot,
    publicRoot:value.publicRoot,
    completionPath:value.completionPath
  });
  assert(result.changed.some(({path}) => path === "index.html"));
  assert.equal(
    await readFile(join(value.finalRoot,"articles/story/index.html"),"utf8"),
    "final story"
  );
});

test("fastpath replays crashes after rename, replacement, deletion, and before completion", async (t) => {
  const scenarios = [
    {name:"after-root-rename",checkpoint:null},
    {name:"after-one-replacement",checkpoint:"after-replacement"},
    {name:"after-one-deletion",checkpoint:"after-deletion"},
    {name:"before-completion",checkpoint:"before-completion"}
  ];
  for (const scenario of scenarios) {
    await t.test(scenario.name,async (subtest) => {
      const value = await fixture();
      subtest.after(() => rm(value.root,{recursive:true,force:true}));
      if (scenario.checkpoint) {
        let injected = false;
        await assert.rejects(applyFinalizationOverlay({
          artifactRoot:value.finalRoot,
          activationManifestPath:value.layoutPath,
          finalizationPlanPath:value.planPath,
          generatedRoot:value.generatedRoot,
          publicRoot:value.publicRoot,
          completionPath:value.completionPath,
          onCheckpoint({phase}) {
            if (!injected && phase === scenario.checkpoint) {
              injected = true;
              throw new Error(`injected crash ${phase}`);
            }
          }
        }),/injected crash/);
        assert.equal(injected,true);
        await assert.rejects(readFile(value.completionPath),/ENOENT/);
      }
      const completed = await applyFinalizationOverlay({
        artifactRoot:value.finalRoot,
        activationManifestPath:value.layoutPath,
        finalizationPlanPath:value.planPath,
        generatedRoot:value.generatedRoot,
        publicRoot:value.publicRoot,
        completionPath:value.completionPath
      });
      assert.equal(await artifactTreeDigest(value.finalRoot),value.plan.finalTreeDigest);
      const replayed = await applyFinalizationOverlay({
        artifactRoot:value.finalRoot,
        activationManifestPath:value.layoutPath,
        finalizationPlanPath:value.planPath,
        generatedRoot:value.generatedRoot,
        publicRoot:value.publicRoot,
        completionPath:value.completionPath
      });
      assert.deepEqual(replayed,completed);
    });
  }
});

test("fastpath rejects mixed bytes outside the old-or-new state machine", async (t) => {
  const value = await fixture();
  t.after(() => rm(value.root,{recursive:true,force:true}));
  await writeFile(join(value.finalRoot,"index.html"),"unapproved intermediate bytes");
  await assert.rejects(
    applyFinalizationOverlay({
      artifactRoot:value.finalRoot,
      activationManifestPath:value.layoutPath,
      finalizationPlanPath:value.planPath,
      generatedRoot:value.generatedRoot,
      publicRoot:value.publicRoot,
      completionPath:value.completionPath
    }),
    /unapproved intermediate bytes/
  );
});

test("lightweight finalization never treats media paths as generated output", async (t) => {
  const value = await fixture();
  t.after(() => rm(value.root,{recursive:true,force:true}));
  await write(join(value.generatedRoot,"media/new.webp"),"generated-media");
  await assert.rejects(
    planFinalizationOverlay({
      artifactRoot:value.finalRoot,
      activationManifestPath:value.layoutPath,
      generatedRoot:value.generatedRoot,
      publicRoot:value.publicRoot,
      planPath:join(value.root,"rejected-media-plan.json")
    }),
    /must not generate media/
  );
});

test("fastpath rejects invariant drift and copied-root substitution", async (t) => {
  const drift = await fixture();
  t.after(() => rm(drift.root,{recursive:true,force:true}));
  await writeFile(join(drift.finalRoot,"media/story/lead.webp"),"tampered-media!");
  await assert.rejects(
    applyFinalizationOverlay({
      artifactRoot:drift.finalRoot,
      activationManifestPath:drift.layoutPath,
      finalizationPlanPath:drift.planPath,
      generatedRoot:drift.generatedRoot,
      publicRoot:drift.publicRoot,
      completionPath:drift.completionPath
    }),
    /Invariant activation file changed/
  );

  const substituted = await fixture();
  t.after(() => rm(substituted.root,{recursive:true,force:true}));
  const copiedRoot = join(substituted.root,"copy","prepared-dist");
  await mkdir(copiedRoot,{recursive:true});
  for (const [path,content] of [
    ["media/story/lead.webp","invariant-media"],
    ["logo.svg","<svg>fixed</svg>"],
    ["_headers","/*\n  X-Robots-Tag: noindex, nofollow\n"],
    ["index.html","activation home"]
  ]) await write(join(copiedRoot,path),content);
  await assert.rejects(
    applyFinalizationOverlay({
      artifactRoot:copiedRoot,
      activationManifestPath:substituted.layoutPath,
      finalizationPlanPath:substituted.planPath,
      generatedRoot:substituted.generatedRoot,
      publicRoot:substituted.publicRoot,
      completionPath:join(substituted.root,"copy-completion.json")
    }),
    /not the atomically renamed activation root/
  );
});

test("activation preparation rejects hardlinks and symlinks", async (t) => {
  const hardlinkRoot = await mkdtemp(join(await realpath(tmpdir()),"bohonews-fastpath-links-"));
  t.after(() => rm(hardlinkRoot,{recursive:true,force:true}));
  const publicRoot = join(hardlinkRoot,"public");
  const artifactRoot = join(hardlinkRoot,"prepared-dist");
  await mkdir(publicRoot,{recursive:true});
  await mkdir(artifactRoot,{recursive:true});
  await write(join(publicRoot,"media.webp"),"media");
  await write(join(artifactRoot,"media.webp"),"media");
  await write(
    join(artifactRoot,".well-known/bohonews-activation.json"),
    TEST_ACTIVATION_MARKER
  );
  await link(join(artifactRoot,"media.webp"),join(artifactRoot,"second.webp"));
  await assert.rejects(
    prepareActivationLayout({
      artifactRoot,
      publicRoot,
      preparationBinding:preparationBinding(),
      outputPath:join(hardlinkRoot,"bohonews-finalization-activation-layout.v1.json")
    }),
    /exactly one link/
  );
  await rm(artifactRoot,{recursive:true,force:true});
  await mkdir(artifactRoot,{recursive:true});
  await write(
    join(artifactRoot,".well-known/bohonews-activation.json"),
    TEST_ACTIVATION_MARKER
  );
  await symlink(join(publicRoot,"media.webp"),join(artifactRoot,"media.webp"));
  await assert.rejects(
    prepareActivationLayout({
      artifactRoot,
      publicRoot,
      preparationBinding:preparationBinding(),
      outputPath:join(hardlinkRoot,"symlink-layout.json")
    }),
    /contains a symlink/
  );
});

test("fixed lightweight build cleanup rejects symlinked parents, targets, and contents", async (t) => {
  const scriptBytes = await readFile(new URL(
    "../scripts/publishing/prepare-finalization-build.mjs",import.meta.url
  ));
  for (const scenario of ["parent","target","nested-symlink","hardlink"]) {
    await t.test(scenario,async (subtest) => {
      const fixtureRoot = await mkdtemp(
        join(await realpath(tmpdir()),`bohonews-finalization-build-${scenario}-`)
      );
      subtest.after(() => rm(fixtureRoot,{recursive:true,force:true}));
      const scriptPath = join(fixtureRoot,"scripts/publishing/prepare-finalization-build.mjs");
      const outside = join(fixtureRoot,"outside");
      await mkdir(dirname(scriptPath),{recursive:true,mode:0o700});
      await mkdir(outside,{mode:0o700});
      await writeFile(join(outside,"sentinel"),"must survive");
      await writeFile(scriptPath,scriptBytes);
      if (scenario === "parent") {
        await symlink(outside,join(fixtureRoot,"tmp"),"dir");
      } else {
        await mkdir(join(fixtureRoot,"tmp"),{mode:0o700});
        const generated = join(fixtureRoot,"tmp/mcp-finalization-generated");
        if (scenario === "target") {
          await symlink(outside,generated,"dir");
        } else {
          await mkdir(generated,{mode:0o700});
          if (scenario === "nested-symlink") {
            await symlink(join(outside,"sentinel"),join(generated,"unsafe"));
          } else {
            await link(join(outside,"sentinel"),join(generated,"unsafe"));
          }
        }
      }
      const result = spawnSync(process.execPath,[scriptPath],{encoding:"utf8"});
      assert.notEqual(result.status,0);
      assert.match(
        result.stderr,
        /unsafe ownership, permissions, or device|not a real directory|contains a symlink|contains an unsafe or oversized file/
      );
      assert.equal(await readFile(join(outside,"sentinel"),"utf8"),"must survive");
    });
  }
});

test("full preactivation attestation uses the live-domain activation validators", async () => {
  const attestation = await readFile(new URL(
    "../scripts/publishing/attest-finalization-fastpath.mjs",import.meta.url
  ),"utf8");
  assert.match(attestation,/validate-activation\.mjs","source"/);
  assert.match(attestation,/validate-activation\.mjs","artifact"/);
  assert.doesNotMatch(attestation,/validate-preview\.mjs/);
});

test("exact runtime activation verification is read-only and rejects unsafe trees", async (t) => {
  const root = await mkdtemp(join(
    await realpath(tmpdir()),"bohonews-finalization-activation-verifier-"
  ));
  t.after(() => rm(root,{recursive:true,force:true}));
  const canonicalUrl = "https://bohonews.com/articles/test-candidate/";
  const noindex = '<meta name="robots" content="noindex,nofollow">';
  for (const [path,bytes] of [
    ["index.html",`<!doctype html>${noindex}<main>Activation</main>`],
    ["articles/test-candidate/index.html",`<!doctype html>${noindex}<article>Candidate</article>`],
    ["robots.txt","User-agent: *\nDisallow: /\n"],
    ["rss.xml","<rss></rss>\n"],
    ["sitemap.xml","<urlset></urlset>\n"],
    ["news-sitemap.xml","<urlset></urlset>\n"],
    ["_headers","/*\n  X-Robots-Tag: noindex, nofollow\n  Cache-Control: no-store\n"],
    [".well-known/bohonews-activation.json",TEST_ACTIVATION_MARKER]
  ]) await write(join(root,path),bytes);
  const source = {
    promotion:{
      packageDigest:TEST_CANDIDATE_DIGEST,
      articles:[{
        id:"BN-TEST-CANDIDATE",
        slug:"test-candidate",
        canonicalUrl,
        publishedAt:null
      }]
    },
    result:{articleCount:1}
  };
  const before = await artifactTreeDigest(root);
  assert.equal(
    await verifyActivationArtifactAgainstSource(root,source),
    source.result
  );
  assert.equal(await artifactTreeDigest(root),before);
  await rm(join(root,".well-known/bohonews-activation.json"));
  await assert.rejects(
    verifyActivationArtifactAgainstSource(root,source),
    /omitted the activation marker/
  );
  assert.equal(
    await verifyActivationArtifactAgainstSource(
      root,source,{requireActivationMarker:false}
    ),
    source.result
  );
  await write(
    join(root,".well-known/bohonews-activation.json"),
    TEST_ACTIVATION_MARKER
  );

  await write(
    join(root,".well-known/bohonews-release.json"),
    '{"schemaVersion":"1.1.0"}\n'
  );
  await assert.rejects(
    verifyActivationArtifactAgainstSource(root,source),
    /final public release marker/
  );
  await rm(join(root,".well-known/bohonews-release.json"));
  await write(
    join(root,".well-known/bohonews-candidate.json"),
    '{"releaseState":"preview"}\n'
  );
  await assert.rejects(
    verifyActivationArtifactAgainstSource(root,source),
    /preview candidate marker/
  );
  await rm(join(root,".well-known/bohonews-candidate.json"));
  await symlink(join(root,"robots.txt"),join(root,"unsafe-link"));
  await assert.rejects(
    verifyActivationArtifactAgainstSource(root,source),
    /contains a symlink/
  );
  await rm(join(root,"unsafe-link"));
  await link(join(root,"robots.txt"),join(root,"unsafe-hardlink"));
  await assert.rejects(
    verifyActivationArtifactAgainstSource(root,source),
    /exactly one link/
  );
});

test("pre/post code inventory hashes installed dependencies and ignores only fixed caches", async (t) => {
  const root = await mkdtemp(join(
    await realpath(tmpdir()),"bohonews-finalization-code-inventory-"
  ));
  t.after(() => rm(root,{recursive:true,force:true}));
  for (const [path,bytes] of [
    ["astro.config.mjs","export default {}\n"],
    ["package.json","{}\n"],
    ["package-lock.json","{}\n"],
    ["tsconfig.json","{}\n"],
    ["content/.keep",""],
    ["schemas/.keep",""],
    ["scripts/.keep",""],
    ["src/.keep",""],
    ["test/.keep",""],
    ["src/publishing/public-news-promotion-package.v2.1.1.json","mutable\n"],
    ["node_modules/.package-lock.json","{}\n"],
    ["node_modules/pkg/index.js","export const value = 1;\n"],
    ["node_modules/.vite/cache.bin","cache-one\n"]
  ]) await write(join(root,path),bytes);
  await mkdir(join(root,"node_modules/.bin"),{recursive:true});
  await symlink("../pkg/index.js",join(root,"node_modules/.bin/tool"));

  const first = await finalizationCodeInventory(root);
  const paths = first.files.map(({path}) => path);
  assert(paths.includes("content/.keep"));
  assert(paths.includes("node_modules/pkg/index.js"));
  assert(paths.includes("node_modules/.bin/tool"));
  assert(!paths.includes("node_modules/.vite/cache.bin"));
  assert(!paths.includes("src/publishing/public-news-promotion-package.v2.1.1.json"));

  await writeFile(join(root,"node_modules/.vite/cache.bin"),"cache-two\n");
  assert.equal((await finalizationCodeInventory(root)).inventoryDigest,first.inventoryDigest);
  await writeFile(join(root,"node_modules/pkg/index.js"),"export const value = 2;\n");
  assert.notEqual((await finalizationCodeInventory(root)).inventoryDigest,first.inventoryDigest);

  await symlink(join(root,"package.json"),join(root,"node_modules/pkg/escape"));
  await assert.rejects(
    finalizationCodeInventory(root),
    /escaping symlink/
  );
  await rm(join(root,"node_modules/pkg/escape"));
  await write(join(root,"node_modules/.cache/executable.js"),"mutable code\n");
  await symlink("../.cache/executable.js",join(root,"node_modules/pkg/cache-bypass"));
  await assert.rejects(
    finalizationCodeInventory(root),
    /escaping symlink/
  );
});

test("activation manifest binds every file digest and stat seal", async (t) => {
  const value = await fixture();
  t.after(() => rm(value.root,{recursive:true,force:true}));
  const entry = value.layout.files.find(({path}) => path === "index.html");
  assert.equal(entry.sha256,createHash("sha256").update("activation home").digest("hex"));
  assert.equal(entry.links,"1");
  assert.equal(value.layout.phase,"activation");
  assert.match(value.layout.recordHash,/^[a-f0-9]{64}$/);
  await assert.rejects(
    prepareActivationLayout({
      artifactRoot:value.finalRoot,
      publicRoot:value.publicRoot,
      preparationBinding:preparationBinding({sourceMarkerSha256:"f".repeat(64)}),
      outputPath:join(value.root,"wrong-marker-layout.json")
    }),
    /marker bytes differ from the preparation binding/
  );
});

test("fastpath readers reject rehashed extra and malformed fields", async (t) => {
  const value = await fixture();
  t.after(() => rm(value.root,{recursive:true,force:true}));
  const bindingPath = join(value.root,"binding-extra.json");
  await write(bindingPath,stableJson(rehashRecord({
    ...preparationBinding(),unexpected:true
  })));
  await assert.rejects(readPreparationBinding(bindingPath),/contract is invalid/);
  const realBindingPath = join(value.root,"binding-real.json");
  const symlinkBindingPath = join(value.root,"binding-symlink.json");
  await write(realBindingPath,stableJson(preparationBinding()));
  await symlink(realBindingPath,symlinkBindingPath);
  await assert.rejects(readPreparationBinding(symlinkBindingPath),/bounded regular file/);

  const layoutPath = join(value.root,"layout-extra.json");
  await write(layoutPath,stableJson(rehashRecord({
    ...value.layout,unexpected:true
  })));
  await assert.rejects(readActivationLayout(layoutPath),/contract is invalid/);
  const noncanonicalLayoutPath = join(value.root,"layout-noncanonical-decimal.json");
  await write(noncanonicalLayoutPath,stableJson(rehashRecord({
    ...value.layout,rootDevice:`0${value.layout.rootDevice}`
  })));
  await assert.rejects(readActivationLayout(noncanonicalLayoutPath),/contract is invalid/);

  const malformedPlan = structuredClone(value.plan);
  malformedPlan.desired[0].unexpected = true;
  const planPath = join(value.root,"plan-extra.json");
  await write(planPath,stableJson(rehashRecord(malformedPlan)));
  await assert.rejects(readFinalizationPlan(planPath),/desired entry is invalid/);

  const completion = await applyFinalizationOverlay({
    artifactRoot:value.finalRoot,
    activationManifestPath:value.layoutPath,
    finalizationPlanPath:value.planPath,
    generatedRoot:value.generatedRoot,
    publicRoot:value.publicRoot,
    completionPath:value.completionPath
  });
  const malformedCompletion = structuredClone(completion);
  malformedCompletion.changed[0].new.unexpected = true;
  const completionPath = join(value.root,"completion-extra.json");
  await write(completionPath,stableJson(rehashRecord(malformedCompletion)));
  await assert.rejects(
    readFinalizationCompletion(completionPath),
    /new state is invalid/
  );
});
