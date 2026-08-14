import { dateLabel, DOCUMENT_TYPES } from "./evidence-document-model.mjs";

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function sourceChecks(record) {
  if (!record.sourceChecks?.length) return "";
  return record.sourceChecks.map((check) => {
    const label = check.comparison === "exact-match"
      ? "Exact match to first preserved copy"
      : check.comparison === "unchanged"
        ? "Source snapshot unchanged"
        : check.comparison === "changed"
          ? "Source changed since first check"
          : check.comparison === "baseline-created"
            ? "Source snapshot recorded"
            : "Source link unavailable at last check";
    return `<div class="source-check"><dt>Source link</dt><dd><a href="${escapeHtml(check.url)}" rel="noopener noreferrer">${escapeHtml(new URL(check.url).hostname)}</a></dd><dt>Last checked</dt><dd>${escapeHtml(dateLabel(check.lastCheckedAt) ?? check.lastCheckedAt)}</dd><dt>Comparison</dt><dd><span class="comparison comparison--${escapeHtml(check.comparison)}">${escapeHtml(label)}</span></dd>${check.finalUrl && check.finalUrl !== check.url ? `<dt>Resolved to</dt><dd>${escapeHtml(check.finalUrl)}</dd>` : ""}</div>`;
  }).join("");
}

function metadataFields(record) {
  const metadata = record.metadata;
  const fields = [];
  if (metadata.publishedAt) fields.push(["Published", dateLabel(metadata.publishedAt)]);
  if (metadata.authors.length) fields.push([metadata.authors.length > 1 ? "Authors" : "Author", metadata.authors.join(", ")]);
  if (metadata.publicationName) fields.push(["Publication", metadata.publicationName]);
  if (metadata.institution) fields.push(["Institution", metadata.institution]);
  if (metadata.documentNumber) fields.push(["Document", metadata.documentNumber]);
  if (metadata.edition) fields.push(["Edition / period", metadata.edition]);
  if (metadata.recordKind) fields.push(["Record", metadata.recordKind]);
  fields.push(["Length", `${record.pages ?? "?"} ${record.pages === 1 ? "page" : "pages"}`]);
  return fields.map(([label, value]) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`).join("");
}

function documentSearch(record) {
  return [
    record.metadata.title,
    record.metadata.documentType.label,
    record.metadata.institution,
    record.metadata.publicationName,
    record.metadata.documentNumber,
    ...record.originalUrls,
    ...record.associations.flatMap((item) => [item.articleSlug, item.articleHeadline, item.publisher, item.sourceId])
  ].filter(Boolean).join(" ").toLowerCase();
}

function documentActions(record, compact = false) {
  const preservedPath = record.publicPath ?? (record.ok && record.sha256 ? `/evidence/files/${record.sha256}.pdf` : null);
  const local = preservedPath ? `<a class="button button--primary" href="${escapeHtml(preservedPath)}">${compact ? "Open PDF" : "Read preserved PDF"}</a>` : "";
  const original = record.originalUrls[0] ? `<a class="button" href="${escapeHtml(record.originalUrls[0])}" rel="noopener noreferrer">Original source</a>` : "";
  return `${local}${original}`;
}

function compactSource(record, { suggested = false } = {}) {
  return `<article class="source-row${suggested ? " source-row--suggested" : ""}" data-type="${escapeHtml(record.metadata.documentType.id)}" data-search="${escapeHtml(documentSearch(record))}">
    <div><p class="source-kicker">${escapeHtml(record.metadata.documentType.label)} · ${escapeHtml(record.metadata.contentForm)}</p><h4>${escapeHtml(record.metadata.title)}</h4><p class="source-byline">${escapeHtml(dateLabel(record.metadata.publishedAt) ?? "Date not stated")}${record.metadata.institution ? ` · ${escapeHtml(record.metadata.institution)}` : ""}</p></div>
    <div class="source-row__actions">${documentActions(record, true)}</div>
  </article>`;
}

function storyCluster(story, storyBySlug) {
  const storySearch = [story.headline, story.dek, ...story.authors].filter(Boolean).join(" ").toLowerCase();
  const typeSummary = Object.entries(story.typeCounts).map(([id, count]) => {
    const type = DOCUMENT_TYPES.find((item) => item.id === id);
    return `<span>${escapeHtml(type?.label ?? id)} <b>${count}</b></span>`;
  }).join("");
  const related = story.relatedArticleIds
    .map((slug) => storyBySlug.get(slug))
    .filter(Boolean)
    .map((item) => `<li><a href="/articles/${escapeHtml(item.slug)}/">${escapeHtml(item.headline)}</a></li>`)
    .join("");
  return `<article class="story-cluster" data-story-search="${escapeHtml(storySearch)}">
    <header class="story-header"><div><p class="eyebrow">${escapeHtml(story.section ?? "Reporting")} · ${escapeHtml(dateLabel(story.publishedAt) ?? "")}</p><h2><a href="/articles/${escapeHtml(story.slug)}/">${escapeHtml(story.headline)}</a></h2>${story.dek ? `<p>${escapeHtml(story.dek)}</p>` : ""}</div><a class="story-link" href="/articles/${escapeHtml(story.slug)}/">Read story</a></header>
    <div class="type-summary">${typeSummary}</div>
    <section class="suggested"><div class="section-label"><h3>Suggested starting points</h3><p>The first documents in the story's published source register.</p></div><div class="suggested-grid">${story.suggested.map((record) => compactSource(record, { suggested: true })).join("")}</div></section>
    <details class="all-story-sources"><summary>View all ${story.records.length} source ${story.records.length === 1 ? "document" : "documents"}</summary><div class="source-list">${story.records.map((record) => compactSource(record)).join("")}</div></details>
    ${related ? `<nav class="related-reading" aria-label="Related reporting"><h3>Continue reading</h3><ul>${related}</ul></nav>` : ""}
  </article>`;
}

function documentCard(record) {
  const usedBy = [...new Map(record.associations.map((item) => [item.articleSlug, item])).values()]
    .map((item) => `<li><a href="/articles/${escapeHtml(item.articleSlug)}/">${escapeHtml(item.articleHeadline ?? item.articleSlug)}</a></li>`)
    .join("");
  return `<article class="document-card" data-type="${escapeHtml(record.metadata.documentType.id)}" data-search="${escapeHtml(documentSearch(record))}">
    <div class="document-card__heading"><p class="document-type">${escapeHtml(record.metadata.documentType.label)}</p><span class="format-pill">${escapeHtml(record.metadata.contentForm)}</span></div>
    <h2>${escapeHtml(record.metadata.title)}</h2>
    <dl class="format-metadata">${metadataFields(record)}</dl>
    <div class="document-actions">${documentActions(record)}</div>
    <details class="provenance"><summary>Integrity and provenance</summary><dl>${sourceChecks(record)}${record.ok && record.sha256 ? `<div><dt>Preserved copy</dt><dd>${escapeHtml(dateLabel(record.firstPreservedAt ?? record.retrievedAt) ?? "")}</dd><dt>SHA-256</dt><dd><code>${escapeHtml(record.sha256)}</code></dd><dt>File size</dt><dd>${(record.bytes / 1024 / 1024).toFixed(2)} MB</dd></div>` : ""}</dl></details>
    <div class="used-by"><h3>Reporting that uses this source</h3><ul>${usedBy}</ul></div>
  </article>`;
}

export function renderEvidenceLibrary(records, stories, { interlochenOnly = false, noindex = true } = {}) {
  const filteredRecords = interlochenOnly
    ? records.filter((record) => record.associations.some((item) => item.articleSlug?.includes("interlochen")))
    : records;
  const recordIds = new Set(filteredRecords.map((record) => record.documentId ?? record.sha256));
  const filteredStories = stories.map((story) => ({
    ...story,
    records: story.records.filter((record) => recordIds.has(record.documentId ?? record.sha256)),
    suggested: story.suggested.filter((record) => recordIds.has(record.documentId ?? record.sha256))
  })).filter((story) => story.records.length && (!interlochenOnly || story.slug.includes("interlochen")));
  const storyBySlug = new Map(filteredStories.map((story) => [story.slug, story]));
  const totalPages = filteredRecords.reduce((sum, record) => sum + (record.pages ?? 0), 0);
  const totalChecks = filteredRecords.reduce((sum, record) => sum + (record.sourceChecks?.length ?? 0), 0);
  const usedTypeIds = new Set(filteredRecords.map((record) => record.metadata.documentType.id));
  const typeOptions = DOCUMENT_TYPES.filter((type) => usedTypeIds.has(type.id)).map((type) => {
    const count = filteredRecords.filter((record) => record.metadata.documentType.id === type.id).length;
    return `<option value="${escapeHtml(type.id)}">${escapeHtml(type.label)} (${count})</option>`;
  }).join("");
  const title = interlochenOnly ? "The Interlochen Investigation: Evidence Library" : "Evidence Library";
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${noindex ? `<meta name="robots" content="noindex,nofollow">` : ""}<meta name="description" content="Primary documents and source material used in Boho News reporting, organized by story and document type."><link rel="canonical" href="https://bohonews.com/${interlochenOnly ? "investigations/interlochen/evidence/" : "evidence/"}"><title>${escapeHtml(title)} | Boho News</title>
<style>
:root{--ink:#15130f;--paper:#f2eee4;--panel:#fffdf7;--rule:#c8bfad;--accent:#771d21;--accent-soft:#ead9d5;--muted:#645f55;--sage:#dce4db;--max:1480px;font-family:Georgia,"Times New Roman",serif;color:var(--ink);background:var(--paper)}*{box-sizing:border-box}body{margin:0;background:var(--paper)}a{color:inherit}.masthead{max-width:var(--max);margin:auto;padding:1.3rem 4vw;border-bottom:3px double var(--ink);display:flex;justify-content:space-between;align-items:center}.brand{font:900 1.55rem/1 system-ui,sans-serif;text-decoration:none;letter-spacing:-.04em}.masthead nav{display:flex;gap:1.1rem;font-size:.95rem}.hero{max-width:var(--max);margin:auto;padding:4rem 4vw 2rem}.eyebrow,.document-type,.source-kicker{font:800 .7rem/1.35 system-ui,sans-serif;letter-spacing:.1em;text-transform:uppercase;color:var(--accent)}h1{font-size:clamp(3rem,7vw,6.8rem);line-height:.88;letter-spacing:-.055em;margin:.35rem 0 1.5rem;max-width:1100px}.intro{font-size:1.28rem;line-height:1.5;max-width:800px}.summary{display:grid;grid-template-columns:repeat(4,1fr);border-block:1px solid var(--rule);margin-top:2.4rem}.summary div{padding:1.2rem;border-right:1px solid var(--rule)}.summary div:last-child{border-right:0}.summary strong{display:block;font:850 2rem/1 system-ui,sans-serif}.summary span{font:650 .74rem/1.35 system-ui,sans-serif;color:var(--muted)}.library{max-width:var(--max);margin:auto;padding:1.5rem 4vw 5rem}.toolbar{position:sticky;top:0;z-index:5;background:color-mix(in srgb,var(--paper) 95%,transparent);backdrop-filter:blur(12px);display:grid;grid-template-columns:minmax(260px,1fr) auto auto;gap:.75rem;padding:1rem 0;border-bottom:1px solid var(--rule)}.toolbar input,.toolbar select{width:100%;background:#fff;border:1px solid var(--ink);padding:.82rem;font:1rem system-ui,sans-serif}.view-switch{display:flex}.view-switch button{border:1px solid var(--ink);background:transparent;padding:.8rem 1rem;font:750 .78rem system-ui,sans-serif;cursor:pointer}.view-switch button+button{border-left:0}.view-switch button[aria-pressed="true"]{background:var(--ink);color:#fff}.count-line{font:650 .75rem/1.4 system-ui,sans-serif;color:var(--muted);align-self:center;min-width:9rem;text-align:right}.view{padding-top:1.5rem}.view[hidden]{display:none}.story-list{display:grid;gap:1.5rem}.story-cluster{background:var(--panel);border:1px solid var(--rule);padding:clamp(1.2rem,3vw,2.25rem)}.story-header{display:grid;grid-template-columns:1fr auto;gap:2rem;align-items:start}.story-header h2{font-size:clamp(1.8rem,3vw,3.15rem);line-height:1;letter-spacing:-.035em;margin:.35rem 0 .7rem}.story-header h2 a{text-decoration-thickness:1px;text-underline-offset:.15em}.story-header p:not(.eyebrow){font-size:1rem;line-height:1.55;max-width:900px;color:#3f3b34}.story-link,.button{display:inline-block;text-decoration:none;border:1px solid var(--ink);padding:.68rem .82rem;font:750 .75rem/1.1 system-ui,sans-serif}.story-link{white-space:nowrap}.button--primary{background:var(--accent);color:white;border-color:var(--accent)}.type-summary{display:flex;gap:.45rem;flex-wrap:wrap;padding:1rem 0;border-block:1px solid var(--rule);margin:1rem 0}.type-summary span,.format-pill{font:650 .68rem/1 system-ui,sans-serif;background:var(--sage);padding:.45rem .55rem}.type-summary b{margin-left:.25rem}.section-label{display:flex;align-items:baseline;justify-content:space-between;gap:1rem}.section-label h3{font-size:1.05rem;margin:0}.section-label p{font-size:.8rem;color:var(--muted)}.suggested-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:.75rem}.source-row{border:1px solid var(--rule);padding:1rem;display:flex;justify-content:space-between;gap:1rem;background:#fff}.source-row--suggested{display:block}.source-row h4{font-size:1rem;line-height:1.25;margin:.25rem 0}.source-byline{font:500 .72rem/1.35 system-ui,sans-serif;color:var(--muted);margin:.4rem 0}.source-row__actions{display:flex;align-items:center;gap:.4rem;flex-wrap:wrap}.source-row--suggested .source-row__actions{margin-top:.8rem}.all-story-sources{margin-top:1rem}.all-story-sources>summary,.provenance>summary{font:750 .78rem system-ui,sans-serif;cursor:pointer;padding:.75rem 0}.source-list{display:grid;gap:.5rem}.related-reading{border-top:1px solid var(--rule);margin-top:1rem;padding-top:.8rem}.related-reading h3{font:750 .68rem system-ui,sans-serif;text-transform:uppercase;letter-spacing:.07em}.related-reading ul{margin:.35rem 0;padding-left:1.1rem}.related-reading li{margin:.3rem 0}.document-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(355px,1fr));gap:1rem}.document-card{background:var(--panel);border:1px solid var(--rule);padding:1.25rem;display:flex;flex-direction:column;gap:.85rem}.document-card__heading{display:flex;justify-content:space-between;gap:.8rem;align-items:start}.document-card h2{font-size:1.35rem;line-height:1.14;margin:0}.format-metadata{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.65rem;margin:0}.format-metadata div{border-left:2px solid var(--accent-soft);padding-left:.55rem}.format-metadata dt{font:750 .65rem/1.2 system-ui,sans-serif;text-transform:uppercase;color:var(--muted)}.format-metadata dd{margin:.18rem 0 0;font-size:.84rem;line-height:1.25}.document-actions{display:flex;gap:.5rem;flex-wrap:wrap}.provenance{border-top:1px solid var(--rule)}.provenance>dl{margin:0}.source-check,.provenance>dl>div{display:grid;grid-template-columns:max-content 1fr;gap:.35rem .7rem;border-top:1px dotted var(--rule);padding:.65rem 0;font-size:.76rem}.provenance dt{font-weight:bold}.provenance dd{margin:0;overflow-wrap:anywhere}.comparison{font-weight:bold}.comparison--exact-match,.comparison--unchanged{color:#285b42}.comparison--changed,.comparison--unavailable{color:#8a3c20}code{font:.68rem ui-monospace,SFMono-Regular,monospace}.used-by{border-top:1px solid var(--rule);padding-top:.7rem}.used-by h3{font:750 .68rem system-ui,sans-serif;text-transform:uppercase;letter-spacing:.07em}.used-by ul{padding-left:1.1rem;margin:.4rem 0}.used-by li{margin:.35rem 0;font-size:.86rem}.empty-state{display:none;padding:3rem 0;font-size:1.2rem}.footer{border-top:3px double var(--ink);padding:1.5rem 4vw;margin-top:3rem;font:.75rem system-ui,sans-serif;color:var(--muted)}[hidden]{display:none!important}@media(max-width:900px){.summary{grid-template-columns:1fr 1fr}.summary div:nth-child(2){border-right:0}.toolbar{grid-template-columns:1fr 1fr}.toolbar input{grid-column:1/-1}.count-line{display:none}.story-header{grid-template-columns:1fr}.suggested-grid{grid-template-columns:1fr}.section-label{display:block}.document-grid{grid-template-columns:1fr}}@media(max-width:560px){.masthead{align-items:flex-start;flex-direction:column;gap:1rem}.masthead nav{flex-wrap:wrap}.hero{padding-top:2.8rem}.toolbar{grid-template-columns:1fr}.view-switch{width:100%}.view-switch button{flex:1}.format-metadata{grid-template-columns:1fr}.source-row{display:block}.source-row__actions{margin-top:.8rem}}
</style></head><body><header class="masthead"><a class="brand" href="/">BOHO NEWS</a><nav><a href="/evidence/">Evidence Library</a><a href="/investigations/interlochen/evidence/">Interlochen collection</a><a href="/investigations/">Investigations</a></nav></header>
<main><section class="hero"><p class="eyebrow">Sources behind the reporting</p><h1>${escapeHtml(title)}</h1><p class="intro">Primary documents and source material used in Boho News reporting. Browse by story or document type, open available preserved copies or lawful original sources, and inspect when each source link was last checked.</p><div class="summary"><div><strong>${filteredRecords.length}</strong><span>source documents</span></div><div><strong>${filteredStories.length}</strong><span>reporting collections</span></div><div><strong>${totalPages.toLocaleString()}</strong><span>pages</span></div><div><strong>${totalChecks}</strong><span>source links checked</span></div></div></section>
<section class="library"><div class="toolbar"><input id="search" type="search" aria-label="Search the evidence library" placeholder="Search titles, institutions, document numbers or stories"><select id="type-filter" aria-label="Filter by document type"><option value="all">All document types (${filteredRecords.length})</option>${typeOptions}</select><div class="view-switch" aria-label="Choose library view"><button type="button" data-view-target="stories" aria-pressed="true">By story</button><button type="button" data-view-target="documents" aria-pressed="false">By document</button></div><p class="count-line" id="result-count"></p></div>
<section class="view" id="stories-view"><div class="story-list">${filteredStories.map((story) => storyCluster(story, storyBySlug)).join("")}</div></section>
<section class="view" id="documents-view" hidden><div class="document-grid">${filteredRecords.map(documentCard).join("")}</div></section><p class="empty-state" id="empty-state">No sources match this search.</p></section></main><footer class="footer">Boho News · Evidence Library</footer>
<script>
const search=document.querySelector('#search');const typeFilter=document.querySelector('#type-filter');const views={stories:document.querySelector('#stories-view'),documents:document.querySelector('#documents-view')};const viewButtons=[...document.querySelectorAll('[data-view-target]')];const documentCards=[...document.querySelectorAll('.document-card')];const storyClusters=[...document.querySelectorAll('.story-cluster')];const emptyState=document.querySelector('#empty-state');const resultCount=document.querySelector('#result-count');let activeView='stories';function matches(item,q,type){return(type==='all'||item.dataset.type===type)&&(!q||item.dataset.search.includes(q))}function apply(){const q=search.value.trim().toLowerCase();const type=typeFilter.value;let docs=0;for(const card of documentCards){const visible=matches(card,q,type);card.hidden=!visible;if(visible)docs++}let stories=0;for(const cluster of storyClusters){const storyMatch=!q||cluster.dataset.storySearch.includes(q);let rows=0;for(const row of cluster.querySelectorAll('.source-row')){const visible=(type==='all'||row.dataset.type===type)&&(storyMatch||!q||row.dataset.search.includes(q));row.hidden=!visible;if(visible)rows++}cluster.hidden=rows===0;if(rows)stories++}const count=activeView==='stories'?stories:docs;resultCount.textContent=count+' '+(activeView==='stories'?(count===1?'story collection':'story collections'):(count===1?'document':'documents'));emptyState.style.display=count?'none':'block'}search.addEventListener('input',apply);typeFilter.addEventListener('change',apply);for(const button of viewButtons)button.addEventListener('click',()=>{activeView=button.dataset.viewTarget;for(const [name,view]of Object.entries(views))view.hidden=name!==activeView;for(const item of viewButtons)item.setAttribute('aria-pressed',String(item===button));apply()});apply();
</script></body></html>`;
}
