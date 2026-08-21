# One Nation network frozen public-source corpus

Status: **built and independently validated for publication.**

The corpus is a non-executable evidence dataset. It packages relevant captures of public web material as SHA-256-addressed objects. It does not reconstruct the captured political sites as working or navigable mirrors.

## Frozen archive

- Filename: `FROZEN-PUBLIC-SOURCE-OBJECTS-20260820.tar.gz`
- Bytes: `1,954,150,049`
- SHA-256: `fd8a8b8308ebf2f0e802651ddf5b7b60859e927284420d4f20bc45fbacb27012`
- Selected custody rows: `23,250`
- Unique objects: `16,670`
- Unique object bytes before archive compression: `2,254,790,412`
- Tar members: `16,673` (`16,670` objects plus three control files)

The tarball and the adjacent manifests, checksum ledger, build receipt, and independent-validation receipt are parts of the same release and should be verified together.

## Included control files

- `FROZEN-PUBLIC-SOURCE-CORPUS-MANIFEST-20260820.csv` maps each selected custody row to a SHA-256-addressed object.
- `FROZEN-PUBLIC-SOURCE-OBJECT-SHA256SUMS-20260820.txt` lists every unique object and its expected SHA-256.
- `PUBLIC-SAFE-FULL-CUSTODY-MANIFEST-20260820.csv` and `.jsonl` account for every pre-contact and post-outreach custody entry without publishing private source paths, filenames, message subjects, URLs, or email addresses.
- `PUBLIC-ARCHIVE-BUILD-SUMMARY-20260820.json` is the builder receipt.
- `PUBLIC-ARCHIVE-INDEPENDENT-VALIDATION-20260820.json` is the separate streaming-validation receipt.

## Validation result

The independent verifier re-hashed the outer archive and every embedded object, checked exact tar membership and deterministic metadata, compared the embedded control files to their external copies, reconciled all manifests, checked custody-ID uniqueness, and scanned all public-manifest values for local server paths, local user paths, the internal host name, and email-address patterns.

Result: `PASS`.

- Missing corpus mappings: `0`
- Mismatched corpus mappings: `0`
- Tar metadata mismatches: `0`
- Public-manifest forbidden-value hits: `0`
- Unique full-manifest custody IDs: `30,333` of `30,333`

## Not included in the frozen public-source archive

The public-safe full custody manifest still hash-accounts for these materials, but the object archive excludes them:

- raw correspondence, complete headers, provider receipts, and unrelated mailbox material;
- passwords, tokens, cookies, authenticated browser state, and credentials;
- security-bearing HAR, console, request, or session material pending separate review;
- internal legal analysis, work orders, editorial discussion, handoffs, and operational notes;
- rejected candidates, unresolved leads, and speculative relationship maps that did not survive publication review;
- mixed source/social captures that were not automatically allowlisted; and
- private identifying paths, URLs, filenames, or subjects associated with restricted rows.

## Publication procedure

Upload the tarball and the adjacent control files as one release. After each independent host accepts the files, download the hosted copies into a clean location, confirm the tarball byte count and SHA-256 above, run the independent validator, and record the resulting permanent identifiers and download URLs in the release index.
