import { basename, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  FINALIZATION_GENERATED_RELATIVE_ROOT,
  planFinalizationOverlay
} from "./finalization-fastpath.mjs";

const root = fileURLToPath(new URL("../../",import.meta.url));
const [artifactRoot,activationManifestPath,publicRoot,planPath] =
  process.argv.slice(2);
const fixedPublicRoot = resolve(root,"public");

if (!artifactRoot || !activationManifestPath || !publicRoot || !planPath
  || resolve(publicRoot) !== fixedPublicRoot
  || basename(activationManifestPath)
    !== "bohonews-finalization-activation-layout.v1.json"
  || basename(planPath) !== "bohonews-finalization-plan.v1.json") {
  throw new Error(
    "Usage: node scripts/publishing/plan-finalization-fastpath.mjs "
    + "ACTIVATION_PREPARED_DIST bohonews-finalization-activation-layout.v1.json "
    + "PUBLIC_ROOT bohonews-finalization-plan.v1.json"
  );
}

const result = await planFinalizationOverlay({
  artifactRoot:resolve(artifactRoot),
  activationManifestPath:resolve(activationManifestPath),
  generatedRoot:resolve(root,FINALIZATION_GENERATED_RELATIVE_ROOT),
  publicRoot:fixedPublicRoot,
  planPath:resolve(planPath)
});

console.log(JSON.stringify({
  ok:true,
  contractVersion:result.contractVersion,
  activationTreeDigest:result.activationTreeDigest,
  generatedTreeDigest:result.generatedTreeDigest,
  finalTreeDigest:result.finalTreeDigest,
  changedPathCount:result.changedPathCount,
  deletedPathCount:result.deletedPathCount,
  recordHash:result.recordHash
}));
