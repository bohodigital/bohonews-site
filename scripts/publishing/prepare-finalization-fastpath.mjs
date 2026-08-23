import { basename, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  prepareActivationLayout,
  readPreparationBinding
} from "./finalization-fastpath.mjs";
import { verifyActivationArtifact } from "./validate-activation.mjs";

const root = fileURLToPath(new URL("../../",import.meta.url));
const [artifactRoot,publicRoot,preparationBindingPath,outputPath] = process.argv.slice(2);
const fixedPublicRoot = resolve(root,"public");
if (!artifactRoot || !publicRoot || !preparationBindingPath || !outputPath
  || resolve(publicRoot) !== fixedPublicRoot
  || basename(outputPath) !== "bohonews-finalization-activation-layout.v1.json") {
  throw new Error(
    "Usage: node scripts/publishing/prepare-finalization-fastpath.mjs "
    + "ACTIVATION_PREPARED_DIST PUBLIC_ROOT PREPARATION_BINDING "
    + "bohonews-finalization-activation-layout.v1.json"
  );
}

const resolvedArtifactRoot = resolve(artifactRoot);
await verifyActivationArtifact(resolvedArtifactRoot);
const result = await prepareActivationLayout({
  artifactRoot:resolvedArtifactRoot,
  publicRoot:fixedPublicRoot,
  preparationBinding:await readPreparationBinding(resolve(preparationBindingPath)),
  outputPath:resolve(outputPath)
});
console.log(JSON.stringify({
  ok:true,
  contractVersion:result.contractVersion,
  activationTreeDigest:result.activationTreeDigest,
  invariantFileCount:result.invariantFileCount,
  fileCount:result.fileCount,
  recordHash:result.recordHash
}));
