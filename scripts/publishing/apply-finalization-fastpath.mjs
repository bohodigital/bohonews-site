import { basename, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  applyFinalizationOverlay,
  FINALIZATION_GENERATED_RELATIVE_ROOT
} from "./finalization-fastpath.mjs";

const root = fileURLToPath(new URL("../../",import.meta.url));
const [artifactRoot,activationManifestPath,finalizationPlanPath,publicRoot,completionPath] =
  process.argv.slice(2);
const fixedPublicRoot = resolve(root,"public");
if (!artifactRoot || !activationManifestPath || !finalizationPlanPath
  || !publicRoot || !completionPath
  || resolve(publicRoot) !== fixedPublicRoot
  || basename(activationManifestPath)
    !== "bohonews-finalization-activation-layout.v1.json"
  || basename(finalizationPlanPath) !== "bohonews-finalization-plan.v1.json"
  || basename(completionPath) !== "bohonews-finalization-completion.v1.json") {
  throw new Error(
    "Usage: node scripts/publishing/apply-finalization-fastpath.mjs "
    + "FINAL_PREPARED_DIST bohonews-finalization-activation-layout.v1.json "
    + "bohonews-finalization-plan.v1.json PUBLIC_ROOT "
    + "bohonews-finalization-completion.v1.json"
  );
}

const result = await applyFinalizationOverlay({
  artifactRoot:resolve(artifactRoot),
  activationManifestPath:resolve(activationManifestPath),
  finalizationPlanPath:resolve(finalizationPlanPath),
  generatedRoot:resolve(root,FINALIZATION_GENERATED_RELATIVE_ROOT),
  publicRoot:fixedPublicRoot,
  completionPath:resolve(completionPath)
});
console.log(JSON.stringify({
  ok:true,
  contractVersion:result.contractVersion,
  activationTreeDigest:result.activationTreeDigest,
  changedPathCount:result.changed.length,
  deletedPathCount:result.deleted.length,
  recordHash:result.recordHash
}));
