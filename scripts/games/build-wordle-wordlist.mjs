import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const inputPath = resolve(process.argv[2] ?? "/usr/share/dict/words");
const outputPath = resolve(process.argv[3] ?? "src/lib/games/wordle-allowed.json");
const source = await readFile(inputPath, "utf8");
const words = [...new Set(source.split(/\r?\n/).filter((word) => /^[a-z]{5}$/.test(word)))].sort();

if (words.length < 5_000) throw new Error(`Expected a substantial five-letter dictionary, received ${words.length} words.`);

const payload = {
  source: "FreeBSD web2 word list, derived from the public-domain 1934 Webster's Second International dictionary",
  generatedFrom: inputPath,
  wordLength: 5,
  count: words.length,
  words
};

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(payload)}\n`);
console.log(`Wrote ${words.length} five-letter words to ${outputPath}`);
