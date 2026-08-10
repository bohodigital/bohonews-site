import {createHash} from "node:crypto";
import {readFileSync, writeFileSync} from "node:fs";
import {join} from "node:path";
import {stableJson} from "./publishing/stable-json.mjs";

const root = process.cwd();
const promotionPath = join(root,"src/publishing/public-news-promotion-package.v2.1.1.json");
const releasePath = join(root,"public-news-release.v2.1.1.json");
const mediaRoot = "/media/newsroom/2026/08/manual-20260810";
const retrievedAt = "2026-08-10T03:43:58Z";
const digest = (value) => createHash("sha256").update(typeof value === "string" || Buffer.isBuffer(value) ? value : stableJson(value)).digest("hex");
const fileHash = (publicPath) => digest(readFileSync(join(root,"public",publicPath.slice(1))));
const dims = {
  lead:[1600,900],card:[900,600],"square-social":[1200,1200],"four-three":[1200,900],
  "sixteen-nine":[1280,720],"open-graph":[1200,630],"compact-mobile":[720,480]
};
const roles = Object.keys(dims);

function rights({id,dir,sourceUrl,creator,rightsBasis,license,attribution,caption,alt,usage="Editorial scene tied to the article subject.",original}) {
  return {
    aiGenerated:false,
    altText:alt,
    archivalStatus:"current",
    attribution,
    caption,
    contextNotes:{misleading:false,usage},
    creator,
    derivatives:roles.map((role) => ({
      hash:fileHash(`${mediaRoot}/${dir}/${role}.webp`),
      height:dims[role][1],
      publicPath:`${mediaRoot}/${dir}/${role}.webp`,
      role,
      width:dims[role][0]
    })),
    id,
    illustrationLabel:null,
    license,
    originalFileHash:original ? digest(readFileSync(join(root,"public",`${mediaRoot}/assets/${original}`.slice(1)))) : fileHash(`${mediaRoot}/${dir}/four-three.webp`),
    restrictions:[
      "Use only in the documented editorial context.",
      "Preserve visible credit and do not imply endorsement.",
      "Responsive crops must not alter documentary meaning."
    ],
    retrievedAt,
    rightsBasis,
    schemaVersion:"1.1.0",
    sourceUrl
  };
}

function graphic({id,dir,sourceUrl,caption,alt}) {
  return rights({
    id,dir,sourceUrl,caption,alt,
    creator:"Boho News",
    rightsBasis:"Original editorial graphic derived only from the cited primary record.",
    license:"Boho News original graphic",
    attribution:"Boho News graphic from cited primary data",
    usage:"Inline explanatory graphic; never headline media."
  });
}

const articleDefs = [
  {
    slug:"nih-cancer-models-25-tumor-types-665-models-2026",
    headline:"NIH Cancer Model Library Spans 25 Tumor Types and 2,780 Donors",
    dek:"The international HCMI resource links 665 patient-derived laboratory models with molecular and clinical data for precision-oncology research.",
    section:"health-science",desk:"precision-oncology",
    topics:["Human Cancer Models Initiative","Patient-derived tumor models","Precision oncology","Cancer organoids","Cancer research data"],
    entities:["National Institutes of Health","National Cancer Institute","Human Cancer Models Initiative","Nature"],
    locations:["United States","Cambridge, United Kingdom"],
    source:{id:"source-nih-hcmi-20260805",title:"Human cancer models to accelerate research and precision therapies",publisher:"National Institutes of Health",publishedAt:"2026-08-05T12:00:00Z",url:"https://www.nih.gov/news-events/news-releases/human-cancer-models-accelerate-research-precision-therapies"},
    lead:{id:"media-nih-hcmi-laboratory",dir:"nih-cancer-models/nih-nci-lab",sourceUrl:"https://commons.wikimedia.org/wiki/File:Scientist_working_in_laboratory.jpg",creator:"Diane A. Reid / National Cancer Institute",rightsBasis:"Public domain: U.S. federal government work and author dedication.",license:"Public domain",attribution:"Diane A. Reid / National Cancer Institute",caption:"A scientist works in a National Cancer Institute laboratory in Frederick, Maryland.",alt:"Scientist in a white laboratory coat works at a bench with research equipment.",original:"nih-lab.jpg"},
    charts:[
      {id:"media-hcmi-compendium-2026",dir:"nih-cancer-models/hcmi-compendium",caption:"The HCMI compendium covers hundreds of models and 25 cancer types.",alt:"Graphic lists 665 laboratory models, 25 cancer types and 2,780 patient donors."},
      {id:"media-hcmi-molecular-agreement-2026",dir:"nih-cancer-models/hcmi-agreement",caption:"Paired tumors and models retained high molecular agreement in NIH’s analysis.",alt:"Graphic shows 97.8 percent genetic, 95 percent epigenetic and 92 percent RNA-expression agreement."}
    ],
    paragraphs:[
      "A decade-long international effort funded by the National Institutes of Health has assembled 665 patient-derived cancer models spanning 25 tumor types and tissue from 2,780 donors, creating a shared laboratory resource intended to speed precision-oncology research.",
      "The Human Cancer Models Initiative, or HCMI, pairs laboratory-grown models with genomic, transcriptomic, epigenomic and clinical information. NIH said the collection includes common cancer subtypes and many of the predominant genetic alterations within them.",
      "Patient-derived models let researchers test questions that cannot be explored directly in a person’s tumor. The collection includes organoids that reproduce aspects of an organ’s cellular makeup and neurosphere clusters derived from brain cancers.",
      "The central quality question is whether a model still resembles the tumor after it has been grown in a laboratory. HCMI researchers compared 421 tumors with their paired models and reported 97.8 percent agreement in genetic alterations, 95 percent concordance in epigenetic features and 92 percent similarity in RNA-expression patterns.",
      "Those figures describe molecular agreement across the analyzed pairs; they do not mean every model predicts a patient’s treatment response with the same accuracy. A laboratory model is a research tool, not an individualized treatment recommendation.",
      "The resource includes 522 models with detailed clinical data, 153 models of rare cancers and 71 models from people of non-European ancestry. NIH said models and associated data are being distributed through the American Type Culture Collection and an HCMI searchable catalog.",
      "Researchers can use the models to study tumor evolution, drug sensitivity and treatment resistance. In glioblastoma models, the project identified several genetic features associated with resistance to temozolomide, a chemotherapy drug.",
      "The work was published Aug. 5 in Nature with companion studies led by the Wellcome Sanger Institute, the Broad Institute of MIT and Harvard and Cold Spring Harbor Laboratory. The compendium’s value will depend on how broadly researchers use it and how well later experiments reproduce clinically meaningful findings.",
      "For now, the deliverable is concrete: a standardized, searchable collection that gives cancer laboratories access to hundreds of molecularly characterized models without each team having to build the same resource from scratch."
    ],
    facts:["HCMI includes 665 models representing 25 cancer types from 2,780 donors.","Researchers analyzed 421 paired tumors and models.","The paired analysis reported 97.8% genetic, 95% epigenetic and 92% RNA-expression agreement.","The collection includes 522 models with detailed clinical data, 153 rare-cancer models and 71 models from donors of non-European ancestry.","The study appeared in Nature on Aug. 5, 2026."],
    uncertainty:["Molecular similarity does not establish that every model predicts an individual patient’s response.","The collection’s clinical value will depend on independent use, replication and future validation."],
    seoTitle:"NIH cancer model library covers 25 tumor types",
    seoDescription:"NIH’s HCMI resource includes 665 patient-derived cancer models across 25 tumor types and tissue from 2,780 donors."
  },
  {
    slug:"nist-august-19-2026-lab-tour-registration",
    headline:"NIST Aug. 19 Lab Tour Opens NanoFab and Million-Pound Force Machine",
    dek:"Registration closes Aug. 12 for the Gaithersburg anniversary tour, which is limited to U.S. citizens and permanent residents age 12 and older.",
    section:"technology",desk:"measurement-science",
    topics:["NIST 125th anniversary","NanoFab","Measurement science","Laboratory tours","STEM education"],
    entities:["National Institute of Standards and Technology","Center for Nanoscale Science and Technology"],
    locations:["Gaithersburg, Maryland"],
    source:{id:"source-nist-tour-20260819",title:"August Tour for NIST's 125th Anniversary",publisher:"National Institute of Standards and Technology",publishedAt:"2026-07-06T12:00:00Z",url:"https://www.nist.gov/news-events/events/2026/08/august-tour-nists-125th-anniversary"},
    lead:{id:"media-nist-gaithersburg-campus",dir:"nist-august-tour/nist-gaithersburg-campus",sourceUrl:"https://commons.wikimedia.org/wiki/File:Nist_2.jpg",creator:"Owenusa",rightsBasis:"Public-domain dedication by the photographer.",license:"Public domain",attribution:"Owenusa / Wikimedia Commons",caption:"The National Institute of Standards and Technology campus in Gaithersburg, Maryland.",alt:"Wide panoramic view of the NIST campus and laboratory buildings in Gaithersburg.",original:"nist-campus.jpg"},
    charts:[
      {id:"media-nist-tour-timeline-2026",dir:"nist-august-tour/nist-tour-timeline",caption:"The registration deadline falls one week before the Aug. 19 evening tour.",alt:"Graphic shows registration closes Aug. 12 and the NIST tour runs Aug. 19 from 5:30 to 7 p.m."},
      {id:"media-nist-tour-lab-options-2026",dir:"nist-august-tour/nist-lab-options",caption:"Registrants must choose between two laboratory visits.",alt:"Graphic lists the Million Pounds-Force machine and NanoFab as the two tour choices."}
    ],
    paragraphs:[
      "The National Institute of Standards and Technology will open two of its Gaithersburg research facilities for an evening public tour on Aug. 19, part of the agency’s 125th-anniversary program.",
      "The event runs from 5:30 to 7 p.m. EDT at NIST’s Administration Building, 100 Bureau Drive. Registration closes Aug. 12, and NIST says the limited spaces will be allocated on a first-come, first-served basis.",
      "Visitors must select one of two destinations when registering. The Million Pounds-Force Deadweight Machine calibrates sensors used to measure very large forces, including the thrust of aircraft engines and loads on structures.",
      "The second option is the NanoFab at NIST’s Center for Nanoscale Science and Technology, where researchers use semiconductor-processing and characterization equipment to build and study technologies at very small scales.",
      "The tour is limited to U.S. citizens and permanent residents because of site-entry requirements. NIST says the program is most appropriate for high-school age and older and that children under 12 will not be admitted.",
      "Permanent residents must bring an unexpired green card. U.S. citizens using a state-issued identification card must present a REAL ID-compliant credential or another accepted federal photo ID, such as a passport or passport card. Digital copies and screenshots are not accepted.",
      "The two facilities show opposite ends of the measurement scale: one creates precisely known forces approaching one million pounds, while the other supports fabrication and measurement at the nanoscale. Both are used to establish traceable measurements that other laboratories and industries can rely on.",
      "NIST was founded in 1901 as the National Bureau of Standards. The anniversary program includes lectures, tours and partnerships throughout 2026; the Aug. 19 event is one stop in that broader schedule.",
      "Registration is not a guarantee of entry if required identification is missing. Prospective visitors should use NIST’s official event page for the current capacity and access instructions before traveling."
    ],
    facts:["The tour is scheduled for Aug. 19, 2026, from 5:30 to 7 p.m. EDT.","Registration closes Aug. 12.","Visitors choose the Million Pounds-Force machine or NanoFab.","Attendance is limited to U.S. citizens and permanent residents.","Children under 12 are not allowed."],
    uncertainty:["Capacity is limited and registration availability may change.","NIST may update access instructions; visitors should check the official page before travel."],
    seoTitle:"NIST Aug. 19 lab tour: deadline and entry rules",
    seoDescription:"NIST’s Aug. 19 Gaithersburg tour includes NanoFab or its million-pound force machine; registration closes Aug. 12."
  },
  {
    slug:"farah-okeefe-standard-portland-classic-lpga-exemption-2026",
    headline:"NCAA Champion Farah O’Keefe Earns LPGA Portland Classic Exemption",
    dek:"The Texas golfer’s NCAA title carries an amateur place in the Aug. 13–16 LPGA event after a 12-under championship performance.",
    section:"sports",desk:"womens-golf",
    topics:["Farah O’Keefe","NCAA women’s golf","LPGA Tour","Standard Portland Classic","College golf"],
    entities:["Farah O’Keefe","University of Texas","NCAA","LPGA Tour"],
    locations:["Portland, Oregon","Carlsbad, California","Austin, Texas"],
    source:{id:"source-ncaa-lpga-exemption-20260305",title:"NCAA DI women’s golf champion to be extended amateur exemption to LPGA event",publisher:"NCAA",publishedAt:"2026-03-05T12:00:00Z",url:"https://www.ncaa.org/media-center-ncaa-di-womens-golf-champion-to-be-extended-amateur-exemption-to-lpga-event/"},
    extraSource:{id:"source-texas-okeefe-ncaa-20260525",title:"Women’s Golf’s O’Keefe wins individual NCAA Championship",publisher:"University of Texas Athletics",publishedAt:"2026-05-25T12:00:00Z",url:"https://texaslonghorns.com/news/2026/5/25/womens-golf-no-5-womens-golfs-farah-o-keefe-wins-individual-ncaa-championship"},
    lead:{id:"media-womens-golf-green-cc0",dir:"farah-okeefe-lpga/female-golfer-green",sourceUrl:"https://commons.wikimedia.org/wiki/File:Female_golfer_on_green.jpg",creator:"jmw",rightsBasis:"Creative Commons CC0 public-domain dedication.",license:"CC0 1.0",attribution:"jmw / Wikimedia Commons, CC0",caption:"A golfer plays from a green. NCAA champion Farah O’Keefe received an amateur exemption into Portland’s LPGA event.",alt:"Woman golfer swings a club on a green with trees in the background.",original:"womens-golf.jpg"},
    charts:[
      {id:"media-okeefe-ncaa-rounds-2026",dir:"farah-okeefe-lpga/okeefe-ncaa-rounds",caption:"O’Keefe closed the NCAA tournament at 12 under after four subpar rounds.",alt:"Graphic lists rounds of 69, 69, 68 and 70, a 12-under total and two-stroke win."},
      {id:"media-okeefe-season-summary-2026",dir:"farah-okeefe-lpga/okeefe-season",caption:"O’Keefe paired the NCAA title with a top-10 finish in every college event of the season.",alt:"Graphic lists four victories, top 10 in all 12 events and NCAA individual champion."}
    ],
    paragraphs:[
      "Farah O’Keefe’s NCAA Division I individual championship has earned the University of Texas golfer an amateur exemption into the Standard Portland Classic, an LPGA Tour event scheduled for Aug. 13–16.",
      "The NCAA and LPGA announced before the college championship that the 2026 individual winner would receive the place in Portland. O’Keefe secured it May 25 by finishing 12 under at Omni La Costa Resort & Spa in Carlsbad, California.",
      "O’Keefe posted rounds of 69, 69, 68 and 70. She made six birdies in the final round, including birdies on the final two holes, and won by two strokes.",
      "The title made O’Keefe the third NCAA individual champion in Texas women’s golf history, following Charlotta Sörenstam in 1993 and Heather Bowie in 1997. It was her fourth victory of the 2025–26 college season and fifth collegiate win overall.",
      "The Portland exemption is part of a broader invitation that also covers the winners of the U.S. Women’s Amateur, Women’s Amateur Championship and Augusta National Women’s Amateur. The NCAA said 2026 would be the first year all four amateur champions were offered places in the same LPGA event.",
      "An exemption gives a golfer entry into the field; it does not change amateur status by itself or guarantee a made cut. The event places O’Keefe alongside full-time professionals in a standard LPGA competition setting.",
      "O’Keefe has already tested that level this year. Texas Athletics said she finished as low amateur at the Amundi Evian Championship in July, shooting 5 under and tying for 35th after four rounds.",
      "Her college season included top-10 finishes in all 12 events, according to Texas, along with the ANNIKA Award and Honda Sport Award. Those honors describe past performance, while Portland will offer a separate test against an LPGA field.",
      "For readers tracking the field, the useful distinction is simple: O’Keefe qualified through the NCAA champion pathway announced in March, not through a weekly sponsor invitation created after the fact."
    ],
    facts:["Farah O’Keefe won the 2026 NCAA individual title at 12 under.","Her four rounds were 69, 69, 68 and 70.","The NCAA champion receives an amateur exemption into the Aug. 13–16 Standard Portland Classic.","O’Keefe won by two strokes.","She recorded four college victories and top-10 finishes in all 12 college events in 2025–26."],
    uncertainty:["An exemption provides entry but does not predict performance or a made cut.","Tournament field details can change before the opening round."],
    seoTitle:"Farah O’Keefe gets LPGA Portland Classic exemption",
    seoDescription:"NCAA champion Farah O’Keefe earned an amateur exemption into the Aug. 13–16 LPGA Standard Portland Classic."
  },
  {
    slug:"great-atlantic-sargassum-belt-june-2026-records",
    headline:"Atlantic Sargassum Belt Hits No. 2 Satellite-Era Peak as Gulf Sets Record",
    dek:"NASA and University of South Florida measurements put June 2026 biomass at regional records in the Caribbean and Gulf, with July observations showing a decline.",
    section:"weather-climate",desk:"ocean-observation",
    topics:["Great Atlantic Sargassum Belt","PACE satellite","Ocean Color Instrument","Caribbean Sea","Gulf of Mexico"],
    entities:["NASA Earth Observatory","University of South Florida","NOAA","PACE mission"],
    locations:["Tropical Atlantic Ocean","Caribbean Sea","Gulf of Mexico","Florida"],
    source:{id:"source-nasa-sargassum-20260729",title:"Sizing Up the Sargassum Belt",publisher:"NASA Earth Observatory",publishedAt:"2026-07-29T12:00:00Z",url:"https://science.nasa.gov/earth/earth-observatory/sizing-up-the-sargassum-belt/"},
    lead:{id:"media-sargassum-pace-june-2026",dir:"nasa-sargassum-2026/sargassum-pace-map",sourceUrl:"https://science.nasa.gov/earth/earth-observatory/sizing-up-the-sargassum-belt/",creator:"NASA Earth Observatory / Lauren Dauphin",rightsBasis:"Public domain U.S. federal government work using cited PACE/NOAA/USF data.",license:"Public domain",attribution:"NASA Earth Observatory / Lauren Dauphin",caption:"PACE satellite data map Sargassum concentration across the tropical Atlantic in June 2026.",alt:"Satellite-derived map shows orange and red Sargassum concentrations across the tropical Atlantic, Caribbean and Gulf.",original:"sargassum.jpg"},
    charts:[
      {id:"media-sargassum-regional-mass-2026",dir:"nasa-sargassum-2026/sargassum-regions",caption:"The eastern Caribbean held the largest of the three regional June totals reported by NASA.",alt:"Graphic shows 9 million metric tons in the eastern Caribbean, 5 million in the Gulf and 3.6 million in the western Caribbean."},
      {id:"media-sargassum-record-context-2026",dir:"nasa-sargassum-2026/sargassum-record",caption:"The basin ranked second in the satellite record while two regions set highs.",alt:"Graphic says 2026 was the second-highest year, the Caribbean and Gulf set records, and the Gulf nearly doubled its prior high."}
    ],
    paragraphs:[
      "The Great Atlantic Sargassum Belt reached its second-highest annual level in the satellite record in June 2026, while the Caribbean Sea and Gulf of Mexico each set regional records, according to NASA Earth Observatory and University of South Florida researchers.",
      "NASA’s PACE satellite mapped dense concentrations across the tropical Atlantic. The western Caribbean held an estimated 3.6 million metric tons, the eastern Caribbean 9 million and the Gulf 5 million.",
      "The Gulf total was nearly twice its previous record, which was set in 2025. Across the basin, 2026 trailed only the 2025 peak in the satellite record.",
      "Sargassum is floating brown algae. In moderate amounts offshore, it provides habitat for fish, turtles, birds and invertebrates. Large nearshore mats can reduce oxygen, smother corals and seagrass and release hydrogen sulfide as they decompose on beaches.",
      "The word belt can be misleading at local scale. NASA’s map shows a nearly continuous basin-wide feature, but it is made of discrete, moving mats whose paths depend on currents and winds.",
      "Those patterns spared much of Florida’s west coast from heavy inundation earlier in the summer while steering more material toward the Florida Keys, the east coast and parts of the Caribbean, NASA reported.",
      "PACE’s Ocean Color Instrument detects the algae because chlorophyll and plant structure reflect near-infrared light differently from seawater. Scientists use that reflectance signal to estimate the fraction of ocean surface covered in each pixel and then convert coverage to biomass.",
      "The newer hyperspectral instrument builds on the longer MODIS and VIIRS record. Researchers said PACE observes more ocean and has greater sensitivity, which may improve winter mapping and help distinguish Sargassum from other floating algae.",
      "June was the annual peak, not a statement that biomass continued rising afterward. NASA said newer observations showed a decline through July, and researchers are still investigating the mix of ocean warming, nutrient sources and biological feedbacks behind the belt’s longer-term growth."
    ],
    facts:["June 2026 was the second-highest Sargassum year in the satellite record.","The eastern Caribbean held about 9 million metric tons, the western Caribbean 3.6 million and the Gulf 5 million.","The Caribbean Sea and Gulf each set regional records.","The Gulf total was nearly double its prior record.","PACE’s Ocean Color Instrument maps Sargassum through reflected-light signals."],
    uncertainty:["The belt is patchy; basin-wide maps do not predict every beach impact.","The exact causes of long-term growth remain under investigation, and July observations showed biomass declining after the June peak."],
    seoTitle:"Atlantic Sargassum belt hits second-highest level",
    seoDescription:"June 2026 Sargassum reached the second-highest satellite-era level, with record totals in the Caribbean and Gulf."
  },
  {
    slug:"world-bank-salta-route-51-water-project-100-million",
    headline:"World Bank’s $100 Million Salta Plan Targets Route 51, Water and Logistics",
    dek:"The Argentina project includes 24 kilometers of climate-resilient road work, logistics-hub upgrades and water systems in two high-altitude towns.",
    section:"world",desk:"argentina-infrastructure",
    topics:["Salta infrastructure","Argentina development","National Route 51","Water and sanitation","Critical minerals"],
    entities:["World Bank","Province of Salta","General Güemes Logistics Hub","Belgrano Cargas"],
    locations:["Salta Province, Argentina","Campo Quijano","Los Chorrillos","Olacapato","San Antonio de los Cobres"],
    source:{id:"source-world-bank-salta-20260706",title:"World Bank Approves Financing for Resilient Infrastructure and Basic Services to Boost Employment in Salta",publisher:"World Bank",publishedAt:"2026-07-06T12:00:00Z",url:"https://www.worldbank.org/en/news/press-release/2026/07/07/banco-mundial-aprueba-financiamiento-para-infraestructura-resiliente-y-servicios-b-sicos-que-impulsar-n-el-empleo-en-sal"},
    lead:{id:"media-salta-road-scene-ccby",dir:"world-bank-salta/salta-road-scene",sourceUrl:"https://commons.wikimedia.org/wiki/File:Ruta_de_Salta.jpg",creator:"Agustinl19",rightsBasis:"Creative Commons Attribution 4.0 International.",license:"CC BY 4.0",attribution:"Agustinl19 / Wikimedia Commons, CC BY 4.0",caption:"A highway crosses the mountain landscape of Salta Province, Argentina.",alt:"Two-lane road curves through dry mountains under a blue sky in Salta Province.",original:"salta-road.jpg"},
    charts:[
      {id:"media-salta-project-scale-2026",dir:"world-bank-salta/salta-project-scale",caption:"The approved project combines a $100 million loan with a defined Route 51 segment.",alt:"Graphic lists $100 million, 24 kilometers of Route 51, a 32-year maturity and seven-year grace period."},
      {id:"media-salta-project-components-2026",dir:"world-bank-salta/salta-project-parts",caption:"Roads are one of several connected investment tracks in the Salta operation.",alt:"Graphic lists Route 51 and logistics, water and wastewater, and mining data and governance."}
    ],
    paragraphs:[
      "The World Bank has approved a $100 million project for Argentina’s Salta Province that combines road rehabilitation, logistics upgrades, water and sanitation systems and new tools for managing growth in the mining sector.",
      "The project will rehabilitate 24 kilometers of National Route 51 between Campo Quijano and Los Chorrillos. The bank said drainage and climate resilience are core parts of the road work.",
      "Route 51 links high-altitude communities and production areas toward the Chilean border. The program also funds improvements at the General Güemes Logistics Hub and Industrial Park, which connects with the Belgrano Cargas freight rail network and the wider Bioceanic Corridor.",
      "In Olacapato and San Antonio de los Cobres, financing is directed toward safe-water access and wastewater treatment. Those components make the operation broader than a transport loan.",
      "The mining-governance track includes modernized information systems, digital platforms, environmental monitoring, technical training and transparency measures. The World Bank framed those systems as part of responsible critical-minerals development.",
      "Approval establishes financing and project scope; it does not mean every road, pipe or digital system is already built. Procurement, construction schedules and performance measures will determine when residents see the intended services.",
      "The operation is a variable-spread loan with a 32-year maturity and seven-year grace period. Those terms spread repayment over decades while leaving interest costs sensitive to the loan’s rate structure.",
      "The combined design reflects a regional-development theory: road reliability, freight connections, basic services and public-sector capacity can reinforce one another. Whether they do so will depend on project execution and whether benefits reach the targeted towns and workers.",
      "The most concrete near-term benchmarks are therefore physical and auditable: 24 kilometers of Route 51, named logistics facilities, specified water and wastewater investments and working public information and environmental-monitoring systems."
    ],
    facts:["The World Bank approved a $100 million operation for Salta Province.","The project covers 24 kilometers of National Route 51.","It includes the General Güemes Logistics Hub and Industrial Park.","Olacapato and San Antonio de los Cobres are named for water and wastewater investments.","The loan has a 32-year maturity and seven-year grace period."],
    uncertainty:["Approval does not establish completion dates for each component.","Construction, procurement and outcome data will be needed to measure delivery and benefits."],
    seoTitle:"World Bank approves $100M Salta infrastructure plan",
    seoDescription:"A $100 million World Bank project for Salta covers Route 51, logistics, water systems and mining governance."
  },
  {
    slug:"amanda-pascali-library-congress-concert-august-13-2026",
    headline:"Amanda Pascali Plays Free Library of Congress Concert Aug. 13",
    dek:"The Artist in Resonance performance marks the American Folklife Center’s 50th anniversary with Mediterranean, Balkan, Latin, folk and Americana influences.",
    section:"culture",desk:"american-folklife",
    topics:["Amanda Pascali","American Folklife Center","Live! at the Library","Folk music","Library of Congress concerts"],
    entities:["Amanda Pascali","Library of Congress","American Folklife Center"],
    locations:["Washington, D.C.","Coolidge Auditorium"],
    source:{id:"source-loc-live-august-20260723",title:"Library Spotlights K-Pop, Live Music and a Summer Movie During Live! At the Library in August",publisher:"Library of Congress",publishedAt:"2026-07-23T12:00:00Z",url:"https://newsroom.loc.gov/news/library-spotlights-k-pop--live-music-and-a-summer-movie-during-live--at-the-library-in-august/s/95f40d33-085a-46f1-afc3-6cffe021ef6c"},
    lead:{id:"media-loc-great-hall-highsmith",dir:"loc-pascali-concert/loc-great-hall",sourceUrl:"https://commons.wikimedia.org/wiki/File:Library_of_Congress,_Thomas_Jefferson_Building,_Great_Hall,_ceiling_and_cove,_by_Carol_Highsmith_(LOC_highsm.02000).jpg",creator:"Carol M. Highsmith",rightsBasis:"Public domain dedication; Library of Congress Highsmith Archive has no known restrictions.",license:"Public domain",attribution:"Carol M. Highsmith / Library of Congress",caption:"The Great Hall of the Library of Congress Thomas Jefferson Building in Washington.",alt:"Ornate Great Hall interior at the Library of Congress with arches, stained glass and murals.",original:"loc-great-hall.jpg"},
    charts:[
      {id:"media-pascali-concert-details-2026",dir:"loc-pascali-concert/pascali-event",caption:"The free Aug. 13 concert begins at 7 p.m. in the Coolidge Auditorium.",alt:"Graphic lists Amanda Pascali, Aug. 13 at 7 p.m., Coolidge Auditorium and free registration."},
      {id:"media-loc-august-live-schedule-2026",dir:"loc-pascali-concert/loc-august-music",caption:"The Pascali performance sits between two other August Live! at the Library music dates.",alt:"Graphic lists K-pop and Apollo 13 on Aug. 6, Amanda Pascali on Aug. 13 and Tray Wellington on Aug. 27."}
    ],
    paragraphs:[
      "Singer-songwriter Amanda Pascali will perform a free concert at the Library of Congress on Thursday, Aug. 13, in a program celebrating the American Folklife Center’s 50th anniversary.",
      "The concert begins at 7 p.m. in the Coolidge Auditorium. The Library lists Pascali as its 2026 Artist in Resonance and describes the program as a blend of folk and Americana with Mediterranean, Balkan and Latin influences.",
      "Admission is free, but the Library directs visitors to register through its Live! at the Library ticketing system. The ticket also provides access to exhibitions and extended Thursday evening hours in the Thomas Jefferson Building.",
      "Pascali’s concert is the middle of three highlighted August music nights. The month opened Aug. 6 with K-pop programs and an outdoor screening of Apollo 13, and it closes Aug. 27 with a Great Hall café concert by banjo player Tray Wellington and his band.",
      "The American Folklife Center was established in 1976 to preserve and present traditional culture. Its archive contains songs, oral histories, photographs and field recordings gathered from communities in the United States and abroad.",
      "The Artist in Resonance designation connects a working artist with those collections and with public programming. In this case, the anniversary concert foregrounds music shaped by migration and multiple regional traditions rather than treating folk music as a single fixed style.",
      "Visitors during the Library’s Thursday evening program can also enter the Main Reading Room experience and current exhibitions, subject to the building’s access rules and capacity.",
      "The event notice supplies the date, time, venue and registration path, but it does not publish a song-by-song set list. Attendees should not assume a specific repertoire beyond the musical traditions the Library identifies.",
      "For planning purposes, the key details are straightforward: Thursday, Aug. 13; 7 p.m.; Coolidge Auditorium; free advance registration through the Library’s official event system."
    ],
    facts:["Amanda Pascali is the American Folklife Center’s 2026 Artist in Resonance.","The concert is Aug. 13, 2026, at 7 p.m.","The venue is the Library of Congress Coolidge Auditorium.","The event is free with registration.","The program celebrates the American Folklife Center’s 50th anniversary."],
    uncertainty:["The Library has not published a complete set list.","Registration and building capacity may change; visitors should use the official event page."],
    seoTitle:"Amanda Pascali Library of Congress concert Aug. 13",
    seoDescription:"Amanda Pascali performs a free Aug. 13 Library of Congress concert for the American Folklife Center’s 50th anniversary."
  }
];

function article(def) {
  const citationList = [def.source,...(def.extraSource ? [def.extraSource] : [])];
  const blocks = def.paragraphs.map((text) => ({type:"paragraph",text}));
  const insertChart = (chart,index) => blocks.splice(index,0,{
    type:"media",rightsId:chart.id,src:`${mediaRoot}/${chart.dir}/four-three.webp`,alt:chart.alt,
    caption:chart.caption,credit:"Boho News graphic from cited primary data",width:1200,height:900,sourceUrl:def.source.url
  });
  insertChart(def.charts[0],2);
  insertChart(def.charts[1],6);
  const body = def.paragraphs.join("\n\n");
  return {
    articleType:"news-report",authors:["Boho News Staff"],body,bodyBlocks:blocks,
    canonicalUrl:`https://bohonews.com/articles/${def.slug}/`,citations:citationList,
    confirmedFactsSummary:def.facts,corrections:[],dek:def.dek,desk:def.desk,
    distribution:{newsSitemap:true,rss:true},editor:"Boho News Editorial Desk",entities:def.entities,
    eventId:`event-${def.slug}`,headline:def.headline,id:`article-${def.slug}`,
    leadImage:{alt:def.lead.alt,caption:def.lead.caption,credit:def.lead.attribution,height:900,rightsId:def.lead.id,role:"lead",src:`${mediaRoot}/${def.lead.dir}/lead.webp`,width:1600},
    locations:def.locations,media:[],publicChangeLog:[],publicationStatus:"approved",publishedAt:null,
    relatedArticleIds:[],releaseId:null,retractionState:"current",schemaVersion:"2.0.0",
    search:{description:def.seoDescription,index:true,title:def.seoTitle},section:def.section,slug:def.slug,
    social:{description:def.dek,image:`${mediaRoot}/${def.lead.dir}/open-graph.webp`,title:def.headline},
    supersededByArticleId:null,supersedesArticleId:null,topics:def.topics,uncertainty:def.uncertainty,updatedAt:null
  };
}

const promotion = JSON.parse(readFileSync(promotionPath,"utf8"));
const slugs = new Set(promotion.articles.map(({slug}) => slug));
for (const def of articleDefs) if (slugs.has(def.slug)) throw new Error(`Refusing duplicate slug: ${def.slug}`);

const newArticles = articleDefs.map(article);
const newRights = articleDefs.flatMap((def) => [
  rights(def.lead),
  ...def.charts.map((chart) => graphic({...chart,sourceUrl:def.source.url}))
]);
promotion.articles.push(...newArticles);
promotion.mediaRights.push(...newRights);
promotion.compilerVersion = "bohonews-manual-maintenance-installer.v1.0.0";
promotion.generatedAt = "2026-08-10T03:55:00Z";
promotion.releaseState = "candidate";
promotion.inventory = {articleCount:promotion.articles.length,routeCount:promotion.articles.length,mediaCount:promotion.mediaRights.length};
promotion.inputHashes = {
  sourceItems:digest(articleDefs.map(({source,extraSource}) => [source,extraSource].filter(Boolean))),
  events:digest(articleDefs.map(({slug}) => `event-${slug}`)),claims:digest(articleDefs.map(({facts}) => facts)),
  articles:digest(newArticles),approvals:digest({mode:"owner-authorized-maintenance",date:"2026-08-09"}),
  corrections:digest([]),mediaRights:digest(newRights),releaseRecords:digest(promotion.releaseRecords),
  publicationIntents:digest(articleDefs.map(({slug}) => ({slug,intent:"manual-maintenance-release"})))
};
delete promotion.packageDigest;
promotion.packageDigest = digest(promotion);
const release = {
  schemaVersion:promotion.schemaVersion,compilerVersion:promotion.compilerVersion,generatedAt:promotion.generatedAt,
  packageDigest:promotion.packageDigest,articleCount:promotion.inventory.articleCount,mediaCount:promotion.inventory.mediaCount,
  routes:promotion.articles.map(({canonicalUrl}) => new URL(canonicalUrl).pathname),releaseRecords:promotion.releaseRecords,
  releaseState:promotion.releaseState
};
writeFileSync(promotionPath,`${JSON.stringify(promotion,null,2)}\n`);
writeFileSync(releasePath,`${JSON.stringify(release,null,2)}\n`);
console.log(JSON.stringify({newArticles:newArticles.map(({headline,slug,section}) => ({headline,slug,section})),packageDigest:promotion.packageDigest,articleCount:promotion.inventory.articleCount,mediaCount:promotion.inventory.mediaCount},null,2));
