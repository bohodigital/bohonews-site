import type { PublicArticle } from "../lib/news";

const base = {
  schemaVersion:"1.0.0",publicationStatus:"approved",topics:["fixture-topic"],
  entities:["fixture-entity"],locations:[],authors:["Fixture Author"],editor:"Fixture Editor",
  publishedAt:"2026-07-25T10:30:00Z",eventId:"fixture-event",leadImage:null,media:[],
  confirmedFactsSummary:["Synthetic fact for interface testing only."],
  uncertainty:["No real-world claim is represented by this fixture."],
  citations:[{id:"fixture-source",title:"Synthetic source record",publisher:"Fixture authority",url:"https://example.gov/fixture",publishedAt:"2026-07-25T09:00:00Z"}],
  retractionState:"current",distribution:{rss:false,newsSitemap:false},
  social:{description:"Non-production interface fixture."},search:{index:false},
  relatedArticleIds:[],supersedesArticleId:null,supersededByArticleId:null,fixture:true
};

export const previewFixtures: PublicArticle[] = [
  {
    ...base,id:"fixture-developing",slug:"fixture-developing",headline:"Fixture developing report",
    dek:"A clearly marked non-production record used to validate developing-story presentation.",
    articleType:"developing-story",section:"politics",updatedAt:"2026-07-25T11:15:00Z",
    body:"Synthetic preview body. It contains no substantive reporting or real-world assertion.",
    revisionHistory:[{version:1,at:"2026-07-25T10:30:00Z",summary:"Initial fixture."}],
    corrections:[],social:{title:"Fixture developing report"},canonicalUrl:"https://bohonews.com/articles/fixture-developing/"
  },
  {
    ...base,id:"fixture-correction",slug:"fixture-correction",headline:"Fixture correction presentation",
    dek:"A clearly marked non-production record used to validate a material correction notice.",
    articleType:"news-report",section:"congress",updatedAt:"2026-07-25T11:30:00Z",
    body:"Synthetic preview body. It exists solely for layout and accessibility testing.",
    revisionHistory:[{version:1,at:"2026-07-25T10:30:00Z",summary:"Initial fixture."},{version:2,at:"2026-07-25T11:30:00Z",summary:"Correction fixture."}],
    corrections:[{id:"fixture-correction-record",type:"material-correction",notice:"Synthetic correction notice for interface testing.",effectiveAt:"2026-07-25T11:30:00Z"}],
    social:{title:"Fixture correction presentation"},canonicalUrl:"https://bohonews.com/articles/fixture-correction/"
  },
  {
    ...base,id:"fixture-explainer",slug:"fixture-explainer",headline:"Fixture explainer layout",
    dek:"A clearly marked non-production record used to validate article and section layouts.",
    articleType:"explainer",section:"explainers",updatedAt:"2026-07-25T10:30:00Z",
    body:"Synthetic preview body. Fixture content is excluded from the production promotion package.",
    revisionHistory:[{version:1,at:"2026-07-25T10:30:00Z",summary:"Initial fixture."}],
    corrections:[],social:{title:"Fixture explainer layout"},canonicalUrl:"https://bohonews.com/articles/fixture-explainer/"
  }
];
