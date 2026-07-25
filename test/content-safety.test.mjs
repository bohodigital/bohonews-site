import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("content validator rejects executable HTML patterns", async () => {
  const validator = await readFile(
    new URL("../scripts/publishing/validate-content.mjs", import.meta.url),
    "utf8"
  );
  for (const requiredPattern of ["<script", "javascript:", "<iframe", "<object", "<embed"]) {
    assert.match(validator, new RegExp(requiredPattern.replace(/[<>]/g, "\\$&"), "i"));
  }
});

test("article schema requires approval and source records", async () => {
  const schema = await readFile(
    new URL("../src/content.config.ts", import.meta.url),
    "utf8"
  );
  assert.match(schema, /status:\s*z\.literal\(\"approved\"\)/);
  assert.match(schema, /sourceRecords:.*\.min\(1\)/);
  assert.match(schema, /approvalRecord:\s*z\.string\(\)\.min\(1\)/);
});
