import { readFile, readdir } from "node:fs/promises";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const articleRoot = fileURLToPath(new URL("../../content/articles/", import.meta.url));
const forbidden = [
  /<script\b/i,
  /javascript:/i,
  /on(?:click|load|error)\s*=/i,
  /<iframe\b/i,
  /<object\b/i,
  /<embed\b/i
];

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path));
    else files.push(path);
  }
  return files;
}

for (const path of await walk(articleRoot)) {
  if (![".md", ".mdx"].includes(extname(path))) continue;
  const content = await readFile(path, "utf8");
  if (forbidden.some((pattern) => pattern.test(content))) {
    throw new Error(`Unsafe executable HTML rejected in ${path}`);
  }
}

console.log("Governed article content validation passed.");
