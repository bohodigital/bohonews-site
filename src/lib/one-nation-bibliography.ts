export interface OneNationSource {
  id: number;
  title: string;
  publisher: string;
  date: string;
  accessed?: string;
  url?: string;
  preservedUrl?: string;
  sourceType: string;
  supports: string;
  note?: string;
}

export const oneNationBibliography: OneNationSource[] = [
  {
    id: 1,
    title: "Senate Republicans launch network of partisan ‘news’ sites",
    publisher: "Popular Information",
    date: "Aug. 6, 2026",
    accessed: "Aug. 14, 2026",
    url: "https://popular.info/p/senate-republicans-launch-network",
    sourceType: "Independent reporting",
    supports: "The initiating six-site report, reported domain chronology, Meta-ad attribution and the reported FakerPress marker."
  },
  {
    id: 2,
    title: "SLF announces initial $342 million investment in 2026 Senate races",
    publisher: "Senate Leadership Fund",
    date: "April 6, 2026",
    accessed: "Aug. 14, 2026",
    url: "https://senateleadershipfund.org/press-releases/slf-announces-initial-342-million-investment-in-2026-senate-races/",
    sourceType: "First-party announcement",
    supports: "The aggregate investment announcement and its Alaska, Georgia, Iowa, Maine, Michigan, New Hampshire, North Carolina and Ohio state list.",
    note: "The announcement does not allocate any part of the $342 million to a website."
  },
  {
    id: 3,
    title: "One Nation/SLF state-news network evidence companion, version 1.0.0",
    publisher: "Boho News",
    date: "Aug. 15, 2026",
    url: "https://doi.org/10.5281/zenodo.22036285",
    preservedUrl: "/evidence/one-nation-network/",
    sourceType: "Signed evidence release",
    supports: "The public claim table, evidence index, methodology, limitations, chronology summaries and integrity records used throughout this article."
  },
  {
    id: 4,
    title: "Alaska Navigator homepage with favorable Dan Sullivan coverage and One Nation footer",
    publisher: "Alaska Navigator; preserved by Boho News",
    date: "Captured Aug. 13, 2026",
    url: "https://thealaskanavigator.com/",
    preservedUrl: "/evidence/one-nation-network/figures/1/",
    sourceType: "Preserved primary exhibit",
    supports: "The independent-news presentation, Sullivan-focused homepage selection and One Nation payer footer."
  },
  {
    id: 5,
    title: "New ad: Senator Dan S. Sullivan is protecting Alaskans’ privacy",
    publisher: "One Nation; preserved by Boho News",
    date: "July 1, 2026; captured Aug. 13, 2026",
    url: "https://onenationamerica.org/news/new-ad-senator-dan-s-sullivan-is-protecting-alaskans-privacy/",
    preservedUrl: "/evidence/one-nation-network/figures/2/",
    sourceType: "First-party advocacy page and preserved exhibit",
    supports: "One Nation’s direct issue-advocacy campaign praising Sullivan on privacy legislation."
  },
  {
    id: 6,
    title: "Fact check: Susan Collins funding for Maine rural hospitals",
    publisher: "Maine Policy Updates; preserved by Boho News",
    date: "Captured Aug. 13, 2026",
    url: "https://mainepolicyupdates.com/fact-check/fact-check-susan-collins-funding-for-maine-rural-hospitals/",
    preservedUrl: "/evidence/one-nation-network/figures/3/",
    sourceType: "Preserved primary exhibit",
    supports: "A favorable Collins ‘fact check’ and the One Nation payer footer."
  },
  {
    id: 7,
    title: "Susan Collins’s record on prescription drug costs and insulin affordability",
    publisher: "Maine Policy Updates; preserved by Boho News",
    date: "Captured Aug. 13, 2026",
    url: "https://mainepolicyupdates.com/fact-check/collins-prescription-drug-costs/",
    preservedUrl: "/evidence/one-nation-network/figures/4/",
    sourceType: "Preserved primary exhibit",
    supports: "A favorable Collins prescription-drug article and the One Nation payer footer."
  },
  {
    id: 8,
    title: "The North Carolinian homepage and SLF PAC payer footer",
    publisher: "The North Carolinian; preserved by Boho News",
    date: "Captured Aug. 15, 2026",
    url: "https://thenorthcarolinian.org/",
    preservedUrl: "/evidence/one-nation-network/figures/5/",
    sourceType: "Preserved primary exhibit",
    supports: "The live North Carolina property, candidate framing and the Senate Leadership Fund payer footer."
  },
  {
    id: 9,
    title: "The North Carolinian privacy policy",
    publisher: "The North Carolinian; preserved by Boho News",
    date: "Captured Aug. 15, 2026",
    url: "https://thenorthcarolinian.org/privacy-policy/",
    preservedUrl: "/evidence/one-nation-network/figures/6/",
    sourceType: "Preserved primary exhibit",
    supports: "The privacy page’s explicit One Nation language and SLF PAC footer.",
    note: "Template residue does not by itself collapse the two organizations into one legal entity."
  },
  {
    id: 10,
    title: "Meta Ad Library results for The North Carolinian",
    publisher: "Meta; preserved by Boho News",
    date: "Captured Aug. 14, 2026",
    url: "https://www.facebook.com/ads/library/",
    preservedUrl: "/evidence/one-nation-network/figures/7/",
    sourceType: "Platform transparency record and preserved exhibit",
    supports: "The visible result count and impression range; separately preserved DOM evidence records SLF PAC payer lines, Library IDs and destinations."
  },
  {
    id: 11,
    title: "North Carolinian prisoner-release article reached from an SLF PAC advertisement",
    publisher: "The North Carolinian; preserved by Boho News",
    date: "Captured Aug. 15, 2026",
    preservedUrl: "/evidence/one-nation-network/figures/8/",
    sourceType: "Preserved primary exhibit",
    supports: "The advertisement destination’s framing of Roy Cooper and its SLF PAC payer footer."
  },
  {
    id: 12,
    title: "Michigander News password-protected homepage",
    publisher: "Michigander News staging property; preserved by Boho News",
    date: "Captured Aug. 15, 2026",
    url: "https://michigandernews.slfsites.com/",
    preservedUrl: "/evidence/one-nation-network/figures/9/",
    sourceType: "Preserved primary exhibit",
    supports: "The password-protected root state at capture time."
  },
  {
    id: 13,
    title: "Public Michigander News /news/ path",
    publisher: "Michigander News staging property; preserved by Boho News",
    date: "Captured Aug. 15, 2026",
    url: "https://michigandernews.slfsites.com/news/",
    preservedUrl: "/evidence/one-nation-network/figures/10/",
    sourceType: "Preserved primary exhibit",
    supports: "The publicly reachable masthead, scaffold posts, independence description and One Nation payer footer."
  },
  {
    id: 14,
    title: "Michigander News privacy policy",
    publisher: "Michigander News staging property; preserved by Boho News",
    date: "Captured Aug. 15, 2026",
    url: "https://michigandernews.slfsites.com/privacy-policy/",
    preservedUrl: "/evidence/one-nation-network/figures/11/",
    sourceType: "Preserved primary exhibit",
    supports: "The page’s One Nation language, slfsites.com hostname and One Nation payer footer."
  },
  {
    id: 15,
    title: "Sullivan touts ‘Alaska comeback,’ historic opportunities in annual address to Legislature",
    publisher: "Office of U.S. Senator Dan Sullivan",
    date: "Official statement; accessed Aug. 14, 2026",
    url: "https://www.sullivan.senate.gov/newsroom/press-releases/sullivan-touts-alaska-comeback-historic-opportunities-in-annual-address-to-legislature",
    sourceType: "Official office statement",
    supports: "Context for Sullivan’s stated priorities on the military, resource development, taxes, fentanyl, fisheries and health care."
  },
  {
    id: 16,
    title: "Issues",
    publisher: "Office of U.S. Senator Susan Collins",
    date: "Accessed Aug. 14, 2026",
    url: "https://www.collins.senate.gov/issues",
    sourceType: "Official office issue index",
    supports: "Context for Collins’s public issue agenda."
  },
  {
    id: 17,
    title: "Did Susan Collins fund rural hospitals?",
    publisher: "Susan Collins for Senate",
    date: "Accessed Aug. 14, 2026",
    url: "https://susancollins.com/get-the-facts/did-susan-collins-fund-rural-hospitals/",
    sourceType: "Campaign material",
    supports: "Comparison between campaign messaging and Maine Policy Updates’ rural-hospital framing."
  },
  {
    id: 18,
    title: "Issues",
    publisher: "Ashley Hinson for Congress",
    date: "Accessed Aug. 14, 2026",
    url: "https://ashleyhinson.com/issues/",
    sourceType: "Campaign material",
    supports: "Context for the issues emphasized in favorable Iowa Voice coverage."
  },
  {
    id: 19,
    title: "Husted joins bill to improve access to care for veterans",
    publisher: "Office of U.S. Senator Jon Husted",
    date: "Official statement; accessed Aug. 14, 2026",
    url: "https://www.husted.senate.gov/media/press-releases/husted-joins-bill-to-improve-access-to-care-for-veterans/",
    sourceType: "Official office statement",
    supports: "Context for themes in favorable Ohio Pulse coverage."
  },
  {
    id: 20,
    title: "Husted leads bipartisan, bicameral bill to crack down on human trafficking",
    publisher: "Office of U.S. Senator Jon Husted",
    date: "Official statement; accessed Aug. 14, 2026",
    url: "https://www.husted.senate.gov/news/press-releases/husted-leads-bipartisan-bicameral-bill-to-crack-down-on-human-trafficking/",
    sourceType: "Official office statement",
    supports: "Context for the anti-trafficking framing in Ohio Pulse."
  },
  {
    id: 21,
    title: "Issues",
    publisher: "Michael Whatley for Senate",
    date: "Accessed Aug. 14, 2026",
    url: "https://michaelwhatley.com/issues/",
    sourceType: "Campaign material",
    supports: "Context for the law-and-order framing on The North Carolinian."
  },
  {
    id: 22,
    title: "Ad Library Report",
    publisher: "Meta",
    date: "Data captured Aug. 11–14, 2026",
    url: "https://www.facebook.com/ads/library/report/",
    preservedUrl: "/evidence/one-nation-network/",
    sourceType: "Platform transparency dataset",
    supports: "The North Carolinian page ID, SLF PAC disclaimer, 24-ad all-time report total and reported $17,283 spend."
  },
  {
    id: 23,
    title: "Political advertising on Google",
    publisher: "Google Ads Transparency Center",
    date: "Bulk data captured Aug. 14, 2026",
    url: "https://adstransparency.google.com/political?political=&region=US",
    sourceType: "Platform transparency dataset",
    supports: "One Nation’s May 4–10 Michigan video creative and the dataset’s absence of a landing destination for that record."
  },
  {
    id: 24,
    title: "Known-site backdating summary and case reconciliation",
    publisher: "Boho News",
    date: "Generated Aug. 14–15, 2026",
    url: "https://doi.org/10.5281/zenodo.22036285",
    preservedUrl: "/evidence/one-nation-network/",
    sourceType: "Reproducible analysis and public claim table",
    supports: "The 14-of-59 count, site-level chronology table, source-date comparisons, New Hampshire splice and limitations on intent."
  },
  {
    id: 25,
    title: "New Hampshire ban on sanctuary cities now on the books",
    publisher: "New Hampshire Daily",
    date: "Displayed May 22, 2025; captured Aug. 13, 2026",
    url: "https://newhampshiredaily.org/news/new-hampshire-ban-on-sanctuary-cities-now-on-the-books/",
    sourceType: "Target article and preserved WordPress record",
    supports: "The target title, Medsger byline, displayed date, outgoing link and January 2026 body."
  },
  {
    id: 26,
    title: "New Hampshire ban on sanctuary cities now on the books",
    publisher: "The Spokesman-Review / Boston Herald syndication",
    date: "Jan. 3, 2026",
    accessed: "Aug. 14, 2026",
    url: "https://www.spokesman.com/stories/2026/jan/03/new-hampshire-ban-on-sanctuary-cities-now-on-the-b/",
    sourceType: "Syndicated source article",
    supports: "The Tim Dunn byline, January 2026 date, headline and body reproduced on the New Hampshire Daily target."
  },
  {
    id: 27,
    title: "New Hampshire bans sanctuary cities and policies preventing ICE cooperation",
    publisher: "ArcaMax / Boston Herald syndication",
    date: "May 22, 2025",
    accessed: "Aug. 14, 2026",
    url: "https://www.arcamax.com/currentnews/newsheadlines/s-3716585",
    sourceType: "Syndicated source article",
    supports: "The Matthew Medsger byline and May 22, 2025 metadata donor in the New Hampshire splice."
  },
  {
    id: 28,
    title: "New Hampshire bans sanctuary cities and policies preventing ICE cooperation",
    publisher: "Boston Herald",
    date: "May 22, 2025",
    accessed: "Aug. 14, 2026",
    url: "https://www.bostonherald.com/2025/05/22/new-hampshire-bans-sanctuary-cities-and-policies-preventing-ice-cooperation/",
    sourceType: "Original publisher page",
    supports: "The destination of New Hampshire Daily’s outgoing link and its mismatch with the body on the target page."
  },
  {
    id: 29,
    title: "Committee profile: SLF PAC, C00571703",
    publisher: "Federal Election Commission",
    date: "2026 election cycle; accessed Aug. 14, 2026",
    url: "https://www.fec.gov/data/committee/C00571703/?cycle=2026",
    sourceType: "Federal campaign-finance record",
    supports: "SLF’s committee identity, treasurer and filing access."
  },
  {
    id: 30,
    title: "SLF PAC disbursements to Acquire Digital",
    publisher: "Federal Election Commission",
    date: "2025–2026 records; captured Aug. 14, 2026",
    url: "https://www.fec.gov/data/disbursements/?committee_id=C00571703&data_type=processed&recipient_name=Acquire+Digital&two_year_transaction_period=2026",
    preservedUrl: "/evidence/one-nation-network/",
    sourceType: "Federal campaign-finance records and Boho News vendor-graph extract",
    supports: "Itemized SLF payments described as website design, website development or web advertising.",
    note: "The rows do not identify domains or allocate invoices to particular properties."
  },
  {
    id: 31,
    title: "SLF PAC receipts from One Nation",
    publisher: "Federal Election Commission",
    date: "2026 cycle records through June 30; captured Aug. 14, 2026",
    url: "https://www.fec.gov/data/receipts/?committee_id=C00571703&contributor_name=One+Nation&data_type=processed&two_year_transaction_period=2026",
    preservedUrl: "/evidence/one-nation-network/",
    sourceType: "Federal campaign-finance records and preserved extract",
    supports: "Three non-memo receipts from One Nation totaling $70.74 million and the organizations’ financial relationship."
  },
  {
    id: 32,
    title: "Who we are",
    publisher: "Acquire Digital",
    date: "Accessed Aug. 14, 2026",
    url: "https://acquiredigital.co/who/",
    sourceType: "Vendor first-party page",
    supports: "Kyle Burns’s chief creative officer role used in evaluating the Acquire-specific production identity."
  },
  {
    id: 33,
    title: "Acquire Digital",
    publisher: "Acquire Digital",
    date: "Accessed Aug. 14, 2026",
    url: "https://acquiredigital.co/",
    sourceType: "Vendor first-party page",
    supports: "Acquire’s description of its political, advocacy, campaign and digital-services work."
  },
  {
    id: 34,
    title: "What we do",
    publisher: "One Nation",
    date: "Accessed Aug. 20, 2026",
    url: "https://onenationamerica.org/about/",
    sourceType: "Organization first-party page",
    supports: "One Nation’s description of itself as an issue-advocacy organization promoting conservative policies."
  },
  {
    id: 35,
    title: "About",
    publisher: "Senate Leadership Fund",
    date: "Accessed Aug. 20, 2026",
    url: "https://senateleadershipfund.org/about/",
    sourceType: "Organization first-party page",
    supports: "SLF’s current public identification of Alex Latcham as executive director."
  },
  {
    id: 36,
    title: "One Nation launches eight-figure issue advocacy campaign highlighting Senator Susan Collins’ exemplary service for Maine",
    publisher: "One Nation",
    date: "Jan. 22, 2026",
    accessed: "Aug. 20, 2026",
    url: "https://www.onenationamerica.org/one-nation-launches-eight-figure-issue-advocacy-campaign-highlighting-senator-susan-collins-exemplary-service-for-maine/",
    sourceType: "Organization first-party announcement",
    supports: "One Nation’s direct Collins advocacy and public identification of Alex Latcham as executive director."
  },
  {
    id: 37,
    title: "One Nation, EIN 27-1937961",
    publisher: "ProPublica Nonprofit Explorer / IRS Form 990 data",
    date: "Fiscal year 2024 filing; accessed Aug. 20, 2026",
    url: "https://projects.propublica.org/nonprofits/organizations/271937961",
    sourceType: "Tax filing index and reproduced IRS records",
    supports: "One Nation’s 501(c)(4) status and the filing’s identification of Caleb Crosby as secretary and treasurer."
  },
  {
    id: 38,
    title: "Right-of-reply correspondence with Marc Grasso",
    publisher: "Boston Herald and Boho News",
    date: "Aug. 17, 2026",
    sourceType: "Newsroom correspondence; not publicly reproduced",
    supports: "Medsger’s employment at the Herald, the no-permission-record statement and the inability to provide the original publication time.",
    note: "The correspondence is retained privately; the statement does not rule out every possible license or syndication route."
  },
  {
    id: 39,
    title: "Right-of-reply correspondence with the Dan Sullivan campaign",
    publisher: "Dan Sullivan campaign and Boho News",
    date: "Aug. 15–20, 2026; response status checked Aug. 21, 2026",
    sourceType: "Newsroom correspondence; not publicly reproduced",
    supports: "The campaign representative’s statement that the campaign intended to respond, Boho News’s follow-up and the absence of substantive answers as of Aug. 21 at 15:36 UTC.",
    note: "The campaign’s silence is not used as evidence for any underlying factual claim."
  },
  {
    id: 40,
    title: "Frozen public-source corpus, public-safe custody manifest and methodology",
    publisher: "Boho News",
    date: "Frozen and independently validated Aug. 20, 2026",
    url: "/evidence/one-nation-network/",
    preservedUrl: "/evidence/one-nation-network/frozen-corpus-20260820/README-FROZEN-SOURCE-CORPUS-20260820.md",
    sourceType: "Research corpus, method record and integrity receipts",
    supports: "Search coverage, negative-result calibration, change monitoring, object counts, hashes and the limits of bounded completeness."
  },
  {
    id: 41,
    title: "Boho News right-of-reply record",
    publisher: "Boho News",
    date: "Current through Aug. 21, 2026, at 15:36 UTC",
    sourceType: "Newsroom record; correspondence not publicly reproduced",
    supports: "Which central organizations, campaigns and source publishers supplied human replies, automated acknowledgments or no substantive response by the stated cutoff.",
    note: "Silence is not used as evidence for any underlying factual claim."
  }
];

export const oneNationSourceById = new Map(oneNationBibliography.map((source) => [source.id, source]));
