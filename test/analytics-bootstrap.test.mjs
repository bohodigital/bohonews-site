import assert from "node:assert/strict";
import test from "node:test";
import vm from "node:vm";
import { readFile } from "node:fs/promises";

const source = await readFile(
  new URL("../public/analytics-bootstrap.js", import.meta.url),
  "utf8"
);

function execute({
  hostname = "bohonews.com",
  pathname = "/politics/",
  search = "?q=private",
  doNotTrack = "0",
  gaId = "G-TEST123"
} = {}) {
  const appended = [];
  const storage = new Map();
  const documentElement = { dataset: {} };
  const currentScript = {
    dataset: {
      umamiScriptUrl: "https://analytics.bohodigitalservices.com/script.js",
      umamiWebsiteId: "test-website-id",
      umamiDomains: "bohonews.com,www.bohonews.com",
      gaId,
      gaPublicHosts: "bohonews.com,www.bohonews.com"
    }
  };
  const document = {
    currentScript,
    documentElement,
    referrer: "https://example.com/source/?secret=1",
    createElement: () => ({
      setAttribute(name, value) { this[name] = value; }
    }),
    head: { appendChild(node) { appended.push(node); } }
  };
  const window = {
    location: {
      hostname,
      origin: `https://${hostname}`,
      pathname,
      search
    },
    doNotTrack
  };
  const context = vm.createContext({
    URL,
    URLSearchParams,
    Date,
    document,
    navigator: { webdriver: false, doNotTrack },
    sessionStorage: {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
      removeItem: (key) => storage.delete(key)
    },
    window
  });
  vm.runInContext(source, context);
  return { appended, documentElement, window };
}

test("public hosts load one Umami tracker and one privacy-restrained GA4 tracker", () => {
  const result = execute();
  assert.equal(result.appended.length, 2);
  assert.equal(result.appended[0].src, "https://analytics.bohodigitalservices.com/script.js");
  assert.equal(result.appended[0]["data-exclude-search"], "true");
  assert.equal(result.appended[1].src, "https://www.googletagmanager.com/gtag/js?id=G-TEST123");
  const entries = JSON.parse(JSON.stringify(
    result.window.dataLayer.map((entry) => [...entry])
  ));
  assert.deepEqual(entries[2], ["config", "G-TEST123", {
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
    anonymize_ip: true,
    send_page_view: false
  }]);
  assert.deepEqual(entries[3], ["event", "page_view", {
    page_location: "https://bohonews.com/politics/",
    page_path: "/politics/",
    page_referrer: "https://example.com/source/"
  }]);
});

test("analytics fails closed on preview hosts, Do Not Track, QA sessions, and invalid IDs", () => {
  assert.equal(execute({ hostname: "preview.bohonews.pages.dev" }).appended.length, 0);
  const dnt = execute({ doNotTrack: "1" });
  assert.equal(dnt.appended.length, 0);
  assert.equal(dnt.documentElement.dataset.analyticsSuppressed, "privacy-or-qa");
  assert.equal(execute({ search: "?boho_qa=1" }).appended.length, 0);
  assert.equal(execute({ gaId: "pending" }).appended.length, 0);
});
