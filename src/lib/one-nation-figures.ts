export type EvidenceFocus = "top" | "center" | "bottom";

export interface OneNationFigure {
  number: number;
  name: string;
  title: string;
  alt: string;
  caption: string;
  width: number;
  height: number;
  focus: EvidenceFocus;
  primaryPosition?: string;
  secondaryPosition?: string;
  secondaryLabel?: string;
  fullPage?: boolean;
  captured: string;
  sha256: string;
}

const base = "/media/investigations/one-nation-network/figures";

export const oneNationFigures: OneNationFigure[] = [
  {
    number: 1,
    name: "figure-08-alaska-navigator-pro-sullivan-homepage.png",
    title: "Alaska Navigator’s pro-Sullivan homepage and One Nation footer",
    alt: "Full-page capture of Alaska Navigator showing independent-news branding, favorable Dan Sullivan headlines and the One Nation payer footer.",
    caption: "Unaltered full-page capture of Alaska Navigator on August 13, 2026. The page branded itself as independent news, prominently featured favorable Sullivan articles, and ended with “Paid for by One Nation.”",
    width: 1440,
    height: 12000,
    focus: "top",
    secondaryPosition: "41%",
    secondaryLabel: "One Nation payer-footer excerpt",
    captured: "2026-08-13T23:03:18.434998Z",
    sha256: "5a441a599a8aa84e10291f8adbd732af1f824bd522eb4e251fdb4e42477eab7c"
  },
  {
    number: 2,
    name: "figure-09-one-nation-dan-sullivan-privacy-ad.png",
    title: "One Nation’s direct pro-Sullivan privacy campaign",
    alt: "One Nation page announcing an advertisement praising Dan Sullivan for protecting Alaskans’ privacy.",
    caption: "Unaltered full-page capture of One Nation’s July 1 page promoting its pro-Sullivan privacy advertisement. Boho News has not established that the Sullivan campaign knew of, approved or coordinated the state-branded site or this advocacy.",
    width: 1440,
    height: 12000,
    focus: "top",
    secondaryPosition: "17%",
    secondaryLabel: "One Nation site-footer excerpt",
    captured: "2026-08-13T22:35:13.325661Z",
    sha256: "97ff84a8a5c8db2c490bd036cdb415cedb77768debbb4e540b1f947513afeeb3"
  },
  {
    number: 3,
    name: "figure-10-maine-policy-updates-susan-collins-rural-hospitals.png",
    title: "Maine Policy Updates credits Susan Collins on rural hospitals",
    alt: "Maine Policy Updates fact check crediting Susan Collins with rural-hospital funding.",
    caption: "Unaltered full-page capture of Maine Policy Updates’ favorable rural-hospitals “fact check.” The page footer said “Paid for by One Nation.”",
    width: 1440,
    height: 12000,
    focus: "top",
    secondaryPosition: "36%",
    secondaryLabel: "One Nation payer-footer excerpt",
    captured: "2026-08-13T22:32:00.569017Z",
    sha256: "ec2649c4df7d20350c294ef5bece22b471e67f758c7d673f8c05cae9042672ae"
  },
  {
    number: 4,
    name: "figure-11-maine-policy-updates-susan-collins-drug-costs.png",
    title: "Maine Policy Updates credits Susan Collins on drug costs",
    alt: "Maine Policy Updates fact check crediting Susan Collins on prescription-drug and insulin costs.",
    caption: "Unaltered full-page capture of Maine Policy Updates’ favorable prescription-drug and insulin article, again carrying One Nation’s payer disclosure in the footer.",
    width: 1440,
    height: 12000,
    focus: "top",
    secondaryPosition: "36%",
    secondaryLabel: "One Nation payer-footer excerpt",
    captured: "2026-08-13T22:31:12.516857Z",
    sha256: "b3e7d2391ccc37bcae28bb198007fe722cfcacd36185d755298ad3745bc91649"
  },
  {
    number: 5,
    name: "figure-01-north-carolinian-homepage-and-slf-footer.png",
    title: "The North Carolinian homepage and SLF PAC footer",
    alt: "Full North Carolinian homepage ending in the SLF PAC payer footer.",
    caption: "Unaltered full-page capture of The North Carolinian. The visible footer reads: “PAID FOR BY SLF PAC. NOT AUTHORIZED BY ANY CANDIDATE OR CANDIDATE’S COMMITTEE. WWW.SENATELEADERSHIPFUND.ORG.” The same capture includes a favorable Michael Whatley item and several negative frames about Roy Cooper.",
    width: 765,
    height: 4063,
    focus: "bottom",
    captured: "2026-08-15T01:15:13.708612Z",
    sha256: "51fba483ea7e5da4ed8f0ddac513387db8191f124fd51ca4d417bf57e7ee57be"
  },
  {
    number: 6,
    name: "figure-02-north-carolinian-one-nation-privacy-residue.png",
    title: "North Carolinian privacy policy naming One Nation",
    alt: "North Carolinian privacy policy beginning with At ONE NATION and ending with the SLF PAC footer.",
    caption: "Unaltered full-page capture of The North Carolinian privacy policy, showing One Nation in the body and SLF PAC in the footer.",
    width: 765,
    height: 8023,
    focus: "top",
    captured: "2026-08-15T01:15:52.104824Z",
    sha256: "a14396e6a385805349bfc050212ed1019b7bb11a882a404444042b4ae1939bfb"
  },
  {
    number: 7,
    name: "figure-03-meta-ad-library-north-carolinian-results.png",
    title: "Meta Ad Library results for The North Carolinian",
    alt: "Meta Ad Library result screen for The North Carolinian showing approximately 29 results and 250,000 to 300,000 impressions.",
    caption: "Preserved Meta Ad Library screen for The North Carolinian. The screenshot establishes the page, result count and impression range; the separately hashed DOM record preserves the expanded card’s SLF PAC payer line, Library ID and destination URL.",
    width: 1280,
    height: 720,
    focus: "center",
    fullPage: false,
    captured: "2026-08-14T07:21:29Z",
    sha256: "3ce8ae4d1d7e97ab38061c98e12fc859649aa9a1697fc670489723ffff0536b9"
  },
  {
    number: 8,
    name: "figure-04-north-carolinian-slf-ad-destination.png",
    title: "SLF PAC advertisement destination on The North Carolinian",
    alt: "North Carolinian article about Roy Cooper prisoner releases reached from an SLF PAC Meta advertisement.",
    caption: "Unaltered full-page capture of the North Carolinian article reached from the preserved SLF PAC advertisement destination.",
    width: 765,
    height: 2602,
    focus: "top",
    captured: "2026-08-15T01:16:30.425035Z",
    sha256: "2edcef09c141c01e53919501025a4fc9f95fba5666455df5bc370b74126318ea"
  },
  {
    number: 9,
    name: "figure-05-michigander-password-protected-homepage.png",
    title: "Password-protected Michigander News homepage",
    alt: "Password form shown at the Michigander News homepage.",
    caption: "Exact viewport capture of the Michigander News root. It presented a password form rather than the site homepage.",
    width: 780,
    height: 900,
    focus: "center",
    fullPage: false,
    captured: "2026-08-15T01:17:07.449238Z",
    sha256: "e6b0701ca3156196f37f3933c27707d91731f809de80527ddc0624dd50cad583"
  },
  {
    number: 10,
    name: "figure-06-michigander-public-news-path.png",
    title: "Public Michigander News path and One Nation footer",
    alt: "Publicly reachable Michigander News path showing dated placeholder story cards and the One Nation footer.",
    caption: "Unaltered full-page capture of the public Michigander News /news/ path. It shows what could literally be viewed without a password: branding, dated placeholders, subscription forms, an independence claim and One Nation’s payer footer.",
    width: 765,
    height: 2945,
    focus: "bottom",
    captured: "2026-08-15T01:17:44.865443Z",
    sha256: "30bddbf032059e3e4f96f0580174fa2f74ce689e8541ead9a9728e91196d96a4"
  },
  {
    number: 11,
    name: "figure-07-michigander-one-nation-privacy-and-footer.png",
    title: "Michigander privacy policy naming One Nation and the SLF host",
    alt: "Michigander News privacy policy naming One Nation and michigandernews.slfsites.com.",
    caption: "Unaltered full-page capture of the public Michigander News privacy policy. The opening names One Nation; the body names the slfsites.com staging hostname; the footer says “Paid for by One Nation.”",
    width: 765,
    height: 7505,
    focus: "top",
    captured: "2026-08-15T01:18:22.265648Z",
    sha256: "8882607e6e83896813eddfc3eb033e73465ea4cca8df52f879988ec71847a2c4"
  }
];

export const oneNationFigurePath = (figure: OneNationFigure) => `${base}/${figure.name}`;
export const oneNationFigureViewerPath = (figure: OneNationFigure) => `/evidence/one-nation-network/figures/${figure.number}/`;
export const oneNationFigureByNumber = new Map(oneNationFigures.map((figure) => [figure.number, figure]));
