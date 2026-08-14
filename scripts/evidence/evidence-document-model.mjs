export const DOCUMENT_TYPES = [
  { id: "press-release", label: "Press release" },
  { id: "official-statement", label: "Official statement" },
  { id: "investigation-report", label: "Investigation report" },
  { id: "government-report", label: "Government report or audit" },
  { id: "regulatory-notice", label: "Regulatory notice, rule or order" },
  { id: "court-filing", label: "Court filing" },
  { id: "court-transcript", label: "Court transcript" },
  { id: "legal-exhibit", label: "Legal exhibit" },
  { id: "statistical-release", label: "Statistical release" },
  { id: "research-report", label: "Research or technical report" },
  { id: "newspaper-article", label: "Newspaper article" },
  { id: "magazine-article", label: "Magazine article" },
  { id: "brochure-catalog", label: "Brochure or catalog" },
  { id: "bulletin-register", label: "Bulletin or register" },
  { id: "legislative-record", label: "Legislative record" },
  { id: "law-bill-resolution", label: "Law, bill or resolution" },
  { id: "guidance-reference", label: "Guidance or reference" },
  { id: "institutional-publication", label: "Institutional publication" }
];

const TYPE_BY_ID = new Map(DOCUMENT_TYPES.map((item) => [item.id, item]));

const CURATED_BY_SOURCE = new Map([
  ["interlochen-before-epstein-what-was-known:s1", { documentType: "investigation-report" }],
  ["interlochen-before-epstein-what-was-known:s3", { documentType: "bulletin-register", publicationName: "University of Michigan Official Publication", edition: "Vol. 61, no. 37" }],
  ["interlochen-before-epstein-what-was-known:s5", { documentType: "magazine-article", publicationName: "LIFE" }],
  ["interlochen-before-epstein-what-was-known:s6", { documentType: "legislative-record", publicationName: "Congressional Record" }],
  ["interlochen-before-epstein-what-was-known:s7", { documentType: "legislative-record", publicationName: "Congressional Record" }],
  ["interlochen-before-epstein-what-was-known:s9", { documentType: "research-report", edition: "1960 dissertation" }],
  ["interlochen-before-epstein-what-was-known:s10", { documentType: "brochure-catalog", edition: "1975 brochure" }],
  ["interlochen-before-epstein-what-was-known:s11", { documentType: "brochure-catalog", edition: "1975 program bulletin" }],
  ["interlochen-before-epstein-what-was-known:s16", { documentType: "research-report", documentNumber: "ERIC ED022418" }],
  ["interlochen-before-epstein-what-was-known:s17", { documentType: "bulletin-register", publicationName: "Michigan Register", edition: "1984-5" }],
  ["interlochen-before-epstein-what-was-known:s18", { documentType: "newspaper-article", publicationName: "Detroit Jewish News" }],
  ["interlochen-before-epstein-what-was-known:s19", { documentType: "newspaper-article", publicationName: "Charlevoix County Press" }],
  ["interlochen-abuse-investigation-report-findings:e0014", { documentType: "court-filing", recordKind: "Grand-jury subpoena" }],
  ["interlochen-abuse-investigation-report-findings:e0020", { documentType: "legal-exhibit", documentNumber: "EFTA00008716" }],
  ["interlochen-abuse-investigation-report-findings:e0023", { documentType: "court-transcript", edition: "Trial day 2" }],
  ["interlochen-abuse-investigation-report-findings:e0024", { documentType: "court-transcript", edition: "Trial day 3" }],
  ["interlochen-abuse-investigation-report-findings:e0026", { documentType: "court-transcript", edition: "Trial day 8" }]
]);

function recordText(record) {
  return [
    record.displayName,
    record.pdfMetadata?.title,
    record.pdfMetadata?.subject,
    record.pdfText,
    ...record.originalUrls,
    ...record.associations.flatMap((item) => [item.title, item.publisher, item.sourceId])
  ].filter(Boolean).join(" ");
}

function curatedMetadata(record) {
  const matches = record.associations
    .map((item) => CURATED_BY_SOURCE.get(`${item.articleSlug}:${String(item.sourceId ?? "").toLowerCase()}`))
    .filter(Boolean);
  return Object.assign({}, ...matches);
}

function inferDocumentType(record) {
  const text = recordText(record).toLowerCase();
  const urls = record.originalUrls.join(" ").toLowerCase();
  if (/trial day|trial transcript|hearing transcript/.test(text)) return "court-transcript";
  if (/grand-jury exhibit|exhibit bundle|legal exhibit/.test(text)) return "legal-exhibit";
  if (/federal register|\/fr-\d{4}-\d{2}-\d{2}\/|proposed rule|direct final rule|proclamation \d|request for information|final-action notice|public-interest notice|termination notice|proposed notice|final order/.test(`${text} ${urls}`)) return "regulatory-notice";
  if (/subpoena|complaint for permanent injunction|court filing|petition for|motion for/.test(text)) return "court-filing";
  if (/employment cost index|personal income and outlays|construction spending|petroleum status report|quarterly sentencing update|metropolitan area employment|labor market experience|gdp \(advance estimate\)|statistical release/.test(text)) return "statistical-release";
  if (/h\.\s*con\.\s*res\.|war powers resolution|legislative draft|\bbill\b|\bstatute\b/.test(text)) return "law-bill-resolution";
  if (/congressional record/.test(text)) return "legislative-record";
  if (/press release|news release/.test(text)) return "press-release";
  if (/official statement|public information statement|statement of/.test(text)) return "official-statement";
  if (/external investigation|investigation of historical abuse/.test(text)) return "investigation-report";
  if (/gao-|government accountability office|department of justice report|official report|circular 1570/.test(text)) return "government-report";
  if (/scientific data|toxicological|final report|technical report|curriculum|research report|dissertation|study\b|risk evaluation/.test(text)) return "research-report";
  if (/michigan daily|detroit jewish news|charlevoix.*press|newspaper/.test(text)) return "newspaper-article";
  if (/\blife\b|the instrumentalist|magazine/.test(text)) return "magazine-article";
  if (/brochure|catalog|programme|program bulletin|university division of the national music camp/.test(text)) return "brochure-catalog";
  if (/michigan register|official publication|bulletin/.test(text)) return "bulletin-register";
  if (/code of ethics|requirements bulletin|opinion letter|graphic with.*watches|timeline|guidance|manual|compilation|election dates|primary calendar/.test(text)) return "guidance-reference";
  if (/basis of safety defect determination|recall chronology|soliciting comments/.test(text)) return "official-statement";
  return "institutional-publication";
}

function bestAssociation(record) {
  return [...record.associations].sort((a, b) => {
    const aScore = (a.citationIndex != null ? 4 : 0) + (a.publisher ? 2 : 0) + (a.publishedAt ? 1 : 0);
    const bScore = (b.citationIndex != null ? 4 : 0) + (b.publisher ? 2 : 0) + (b.publishedAt ? 1 : 0);
    return bScore - aScore;
  })[0];
}

function cleanAuthor(value) {
  const author = String(value ?? "").trim();
  if (!author || /microsoft|adobe|acrobat|epson|scanner|unknown/i.test(author)) return null;
  return author;
}

function firstMatch(text, patterns) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1] ?? match[0];
  }
  return null;
}

function inferredDocumentNumber(record) {
  const urls = record.originalUrls.join(" ");
  const fromUrl = firstMatch(urls, [
    /\b(EFTA\d{8})\b/i,
    /\b(ED\d{6})\b/i,
    /\b(FLSA\d{4}-\d+)\b/i,
    /\b(GAO-\d{2}-\d{5,6})\b/i,
    /\b(\d{2}V\d{3})\b/i,
    /\b(DA-\d{2}-\d+)\b/i,
    /\b(\d{3}-TA-\d{4})\b/i,
    /\b(20\d{2}-\d{5})\b/
  ]);
  if (fromUrl) return fromUrl;
  const text = [record.displayName, record.pdfMetadata?.title, ...record.associations.flatMap((item) => [item.title, item.sourceId])].filter(Boolean).join(" ");
  return firstMatch(text, [
    /\b(EFTA\d{8})\b/i,
    /\b(ERIC\s+ED\d{6})\b/i,
    /\b(ED\d{6})\b/i,
    /\b(FLSA\d{4}-\d+)\b/i,
    /\b(GAO-\d{2}-\d{5,6})\b/i,
    /\b(\d{2}V\d{3})\b/i,
    /\b(DA-\d{2}-\d+)\b/i,
    /\b(\d{3}-TA-\d{4})\b/i,
    /\b(Proclamation\s+\d+)\b/i,
    /\b(H\.\s*Con\.\s*Res\.\s*\d+)\b/i,
    /\b(20\d{2}-\d{5})\b/,
    /\b(Circular\s+\d+)\b/i
  ]);
}

function inferredEdition(record) {
  return firstMatch(recordText(record), [
    /\b(20\d{2} edition)\b/i,
    /\b(vol\.\s*\d+[^.;]{0,30}no\.\s*\d+)\b/i,
    /\b(trial day\s*\d+)\b/i,
    /\b(second quarter of fiscal year 20\d{2})\b/i,
    /\b(week ending [A-Z][a-z]+ \d{1,2}, 20\d{2})\b/i
  ]);
}

export function metadataForRecord(record) {
  const curated = curatedMetadata(record);
  const association = bestAssociation(record) ?? {};
  const documentTypeId = curated.documentType ?? inferDocumentType(record);
  const title = record.displayName || record.pdfMetadata?.title || association.title || "Source document";
  const formatText = [record.sourceFileName, record.displayName, ...record.associations.map((item) => item.title)].filter(Boolean).join(" ");
  const excerpt = /excerpt|relevant pages?|relevant-page|pages?[- )]+\d|source-pages|-intro\.pdf/i.test(formatText);
  const publishedAt = record.associations
    .map((item) => item.publishedAt)
    .filter(Boolean)
    .sort()[0] ?? null;
  const author = cleanAuthor(record.pdfMetadata?.author);
  const institution = curated.institution ?? association.publisher ?? null;
  return {
    title,
    documentType: TYPE_BY_ID.get(documentTypeId) ?? TYPE_BY_ID.get("institutional-publication"),
    contentForm: excerpt ? "Excerpt" : "Full document",
    publishedAt,
    authors: curated.authors ?? (author ? [author] : []),
    institution,
    publicationName: curated.publicationName ?? null,
    documentNumber: curated.documentNumber ?? inferredDocumentNumber(record),
    edition: curated.edition ?? inferredEdition(record),
    recordKind: curated.recordKind ?? null,
    language: record.pdfMetadata?.language ?? "English"
  };
}

export function dateLabel(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return value;
  const source = String(value);
  const yearOnly = /-01-01T00:00:00(?:\.000)?Z$/.test(source);
  return new Intl.DateTimeFormat("en-US", yearOnly
    ? { year: "numeric", timeZone: "UTC" }
    : { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" }
  ).format(date);
}

export function buildStoryCollections(records, articles) {
  const articleBySlug = new Map(articles.map((article) => [article.slug, article]));
  const bySlug = new Map();
  for (const record of records) {
    for (const association of record.associations) {
      if (!association.articleSlug) continue;
      const existing = bySlug.get(association.articleSlug) ?? new Map();
      if (!existing.has(record.sha256 ?? record.displayName)) existing.set(record.sha256 ?? record.displayName, record);
      bySlug.set(association.articleSlug, existing);
    }
  }
  return [...bySlug].map(([slug, recordMap]) => {
    const article = articleBySlug.get(slug);
    const storyRecords = [...recordMap.values()].sort((a, b) => {
      const indexFor = (record) => Math.min(...record.associations
        .filter((item) => item.articleSlug === slug && item.citationIndex != null)
        .map((item) => item.citationIndex), Number.MAX_SAFE_INTEGER);
      return indexFor(a) - indexFor(b) || a.metadata.title.localeCompare(b.metadata.title);
    });
    const typeCounts = Object.fromEntries([...new Set(storyRecords.map((record) => record.metadata.documentType.id))]
      .map((id) => [id, storyRecords.filter((record) => record.metadata.documentType.id === id).length]));
    return {
      slug,
      headline: article?.headline ?? slug,
      dek: article?.dek ?? null,
      authors: article?.authors ?? [],
      publishedAt: article?.publishedAt ?? null,
      section: article?.section ?? article?.desk ?? null,
      relatedArticleIds: article?.relatedArticleIds ?? [],
      records: storyRecords,
      suggested: storyRecords.slice(0, 3),
      typeCounts
    };
  }).sort((a, b) => String(b.publishedAt ?? "").localeCompare(String(a.publishedAt ?? "")) || a.headline.localeCompare(b.headline));
}
