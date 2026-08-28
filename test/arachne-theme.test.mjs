import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

function luminance(hex) {
  const channels = hex.match(/[a-f\d]{2}/gi).map((value) => {
    const channel = Number.parseInt(value, 16) / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrast(a, b) {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

test("Arachne copy appears only in the intended section and footer surfaces", async () => {
  const [layout, section, css] = await Promise.all([
    read("../src/layouts/BaseLayout.astro"),
    read("../src/pages/[section]/index.astro"),
    read("../src/styles/global.css"),
  ]);
  assert.match(section, /CAELESTIA CRIMINA/);
  assert.match(section, /isInvestigations \? "CAELESTIA CRIMINA" : "Section"/);
  assert.match(layout, /lang="cs">Hledej pravdy, slyš pravdu, uč se pravdě, miluj pravdu, prav pravdu, drž pravdu, braň pravdy až do smrti\.<\/p>/);
  assert.match(css, /--arachne-purple: #641b3a/);
  assert.match(css, /--arachne-gold: #a87824/);
  assert.match(css, /\.lead-composition > \* \{ min-width: 0; \}/);
  assert.match(css, /\.story-card \{ contain: inline-size; min-width: 0; overflow-wrap: anywhere;/);
  assert.doesNotMatch(css, /49\.75%/);
});

test("concept marks remain review artifacts and are not installed as public assets", async () => {
  const publicFiles = await readdir(new URL("../public", import.meta.url));
  for (const concept of ["surviving-thread", "loom-and-column", "broken-seal", "counter-record-monogram"]) {
    assert.equal(publicFiles.some((file) => file.includes(concept)), false);
  }
  const layout = await read("../src/layouts/BaseLayout.astro");
  assert.match(layout, /href="\/favicon\.svg"/);
  assert.match(layout, /src="\/bohonews-mark-light\.svg"/);
  assert.match(layout, /src="\/bohonews-mark-dark\.svg"/);
});

test("core palette text pairs meet WCAG AA normal-text contrast", () => {
  const pairs = [
    ["#211f1d", "#f5efe3", "light body"],
    ["#59152f", "#f5efe3", "light links"],
    ["#685f56", "#fffaf0", "light muted"],
    ["#f5efe3", "#121110", "dark body"],
    ["#e2a45d", "#121110", "dark links"],
    ["#bdb1a2", "#191817", "dark muted"],
    ["#ffffff", "#641b3a", "strong wine banner"],
  ];
  for (const [foreground, background, label] of pairs) {
    assert.ok(contrast(foreground, background) >= 4.5, `${label} contrast is ${contrast(foreground, background).toFixed(2)}:1`);
  }
});
