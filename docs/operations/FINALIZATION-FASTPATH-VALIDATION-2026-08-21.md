# Finalization fastpath validation — 2026-08-21

## Scope and non-production boundary

This is a local, no-story benchmark and validation record for
`bohonews-finalization-fastpath.v1.0.0`. It did not call Cloudflare, change a
canonical route, deploy, publish, retry a publication, or reconcile a live
batch. The production-sized input was an ordinary build of the existing
398-article public package. Its final release marker was removed locally to
model an activation tree. A synthetic preparation binding was used only for
the local layout/overlay benchmark, so these hashes are performance and
integrity evidence, not release evidence.

The worktree was created directly from canonical Pi site object
`284ec10223c9e8f9a96c333dc4f091330458dfc4`. Runtime was Node `v24.10.0`, npm
`11.6.0`, on Darwin `24.6.0` arm64.

The machine-readable command/result capture is
`docs/operations/finalization-fastpath-production-benchmark-20260821.json`.

## Full and lightweight build comparison

Commands, run from the repository root:

```text
/usr/bin/time -p npm run build
/usr/bin/time -p npm run build:finalization-fastpath
du -sk dist public tmp/mcp-finalization-generated
find dist -type f | wc -l
find tmp/mcp-finalization-generated -type f | wc -l
rsync -rcni --out-format='%i %n' tmp/mcp-finalization-generated/ dist/
```

Observed results:

| Measurement | Ordinary build | Lightweight final build |
| --- | ---: | ---: |
| Wall time | 9.61 s | 3.81 s |
| Output size | 1,227,388 KiB | 47,560 KiB |
| Output files | 11,888 | 3,646 |
| Static public source | 1,179,796 KiB / 8,242 files | deliberately not copied |
| Pages built | 3,158 | 3,158 |

Checksum comparison found 3,643 generated files with identical content. The
only content/name differences were Pagefind's self-referential entry, metadata,
and filter hash names; the lightweight index was internally consistent and the
durable overlay plan deleted the corresponding stale Pagefind files.

## Production-sized layout and overlay timing

The exact command sequence was:

```text
/usr/bin/time -p node scripts/publishing/prepare-finalization-fastpath.mjs \
  ACTIVATION_PREPARED_DIST public PREPARATION_BINDING \
  bohonews-finalization-activation-layout.v1.json

/usr/bin/time -p node scripts/publishing/plan-finalization-fastpath.mjs \
  ACTIVATION_PREPARED_DIST \
  bohonews-finalization-activation-layout.v1.json public \
  bohonews-finalization-plan.v1.json

/usr/bin/time -p mv activation/prepared-dist final/prepared-dist

/usr/bin/time -p node scripts/publishing/apply-finalization-fastpath.mjs \
  FINAL_PREPARED_DIST bohonews-finalization-activation-layout.v1.json \
  bohonews-finalization-plan.v1.json public \
  bohonews-finalization-completion.v1.json
```

Observed results:

| Phase | Wall time | Reads invariant bytes? |
| --- | ---: | --- |
| Preactivation prototype full-tree seal | 7.23 s | yes, intentionally |
| Post-first durable plan | 1.65 s | no; invariant files are stat-sealed |
| Same-filesystem whole-root rename | 0.00 s | no |
| Post-first overlay apply and completion | 2.71 s | no; only generated/mutable bytes |
| Idempotent apply replay | 2.93 s | no; only generated/mutable bytes |
| Full code/installed-dependency inventory | 3.18 s | hashes 14,658 non-cache entries |

The measured post-first plan, rename, and apply total was 4.36 seconds. Including
the lightweight build and a complete post-build code/dependency rehash, the
measured local work totaled 11.35 seconds, leaving
substantial room inside the 300-second governed activation window for the
project finalizer, remaining targeted package/route checks, Hub manifest reuse,
provider upload, and network verification.

The captured layout was produced before the final exact activation-marker
binding and read-only exact-runtime activation verifier were added. Its
synthetic `sourceMarkerSha256` does not describe a valid current preparation
packet, and the hardened CLI intentionally rejects it. That verifier and the
full-tree byte seal run before canonical exposure, outside the measured
post-first-public interval. The post-first build, plan, rename, overlay, and
invariant-stat algorithms measured here are unchanged. The record hashes below
are retained to make the benchmark capture auditable; they are not current
release evidence or a claim that the hardened preparation packet is replayable.
The hardened assembler subsequently replayed the production-sized final tree
idempotently in 3.39 seconds and returned the identical completion record hash;
the hardened 14,658-entry code/dependency inventory completed in 3.41 seconds.

The input layout contained 11,887 files, including 8,240 sealed invariants. The
final plan contained 3,648 desired generated/dynamic files, four replacements
or additions, and two deletions. The final tree contained 11,888 files and
remained 1,227,388 KiB without recopying static media.

Exact local record results:

```text
activationTreeDigest 61eb7857577a0eb0c0fba76935d09f4344dc28f184b1e6ecf76cf0ee8525e6a0
generatedTreeDigest  13ec19fa68df25b3c08a87cbdaebc1422d56ae6abf5c1d1f09d75d10ed753c01
finalTreeDigest      b89f07ec8c099af7db325fb0bb33a47b58bcc35ac019833eea75d42a62935d8e
layoutRecordHash     2560aa4407b203c9a09abc3060b14c65805cf1426c6153c2641a1c81bd52fbd0
planRecordHash       b74dad8f3cf221457baf79d8e440fa76ea4abf2e6fda6cae258b1dc2d311248b
completionRecordHash 36ddada87438a153b0041a0c612845d815e0a9fcec21ab97ed9b7afc82f4077d
```

The final root retained the activation root device and inode. A sampled media
file (`media/7oh/dea-federal-register/card.webp`) retained its exact device,
inode, size, mode, mtime, ctime, and link-count seal. The complete final tree
contained zero symlinks and zero files with a link count greater than one.
The completion record bound the exact plan record and final-tree digest.

## Crash and adversarial validation

`node --test test/finalization-fastpath.test.mjs` passed 21 tests, including
crash injection immediately after the root rename, after one replacement,
after one deletion, and immediately before the completion record. Every replay
converged to the same final-tree digest and completion record. The tests also
proved rejection of copied-root substitution, invariant drift, mixed
unapproved bytes, activation hardlinks and symlinks, symlinked fixed cleanup
parents and targets, rehashed manifests with extra fields, malformed stat
bindings, generated `media/**` paths, changed installed dependencies, and
dependency symlinks that escape `node_modules`. Only fixed generated dependency
caches (`node_modules/.astro`, `.vite`, and `.cache`) are excluded from the
dependency digest; final rendered output is separately bound by the overlay
plan and postcheck.

The full site test suite passed 143 tests. Final commit hashes and the frozen
cross-repository contract-vector digest are recorded in the release handoff,
because they are assigned only after the MCP/Hub fixture has been frozen.
