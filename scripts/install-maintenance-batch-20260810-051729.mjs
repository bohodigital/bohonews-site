import {createHash} from "node:crypto";
import {readFileSync, writeFileSync} from "node:fs";
import {join} from "node:path";
import {stableJson} from "./publishing/stable-json.mjs";

const root=process.cwd();
const promotionPath=join(root,"src/publishing/public-news-promotion-package.v2.1.1.json");
const releasePath=join(root,"public-news-release.v2.1.1.json");
const mediaRoot="/media/newsroom/2026/08/manual-20260810-051729";
const retrievedAt="2026-08-10T06:15:00Z";
const digest=(value)=>createHash("sha256").update(typeof value==="string"||Buffer.isBuffer(value)?value:stableJson(value)).digest("hex");
const fileHash=(publicPath)=>digest(readFileSync(join(root,"public",publicPath.slice(1))));
const dims={lead:[1600,900],card:[900,600],"square-social":[1200,1200],"four-three":[1200,900],"sixteen-nine":[1280,720],"open-graph":[1200,630],"compact-mobile":[720,480]};
const roles=Object.keys(dims);

function rights({id,dir,sourceUrl,creator,rightsBasis,license,attribution,caption,alt,usage="Editorial scene tied to the article subject.",original}) {
  return {aiGenerated:false,altText:alt,archivalStatus:"current",attribution,caption,contextNotes:{misleading:false,usage},creator,
    derivatives:roles.map((role)=>({hash:fileHash(`${mediaRoot}/${dir}/${role}.webp`),height:dims[role][1],publicPath:`${mediaRoot}/${dir}/${role}.webp`,role,width:dims[role][0]})),
    id,illustrationLabel:null,license,originalFileHash:original?digest(readFileSync(join(root,"public",`${mediaRoot}/assets/${original}`.slice(1)))):fileHash(`${mediaRoot}/${dir}/four-three.webp`),
    restrictions:["Use only in the documented editorial context.","Preserve visible credit and do not imply endorsement.","Responsive crops must not alter documentary meaning."],
    retrievedAt,rightsBasis,schemaVersion:"1.1.0",sourceUrl};
}
function graphic({id,dir,sourceUrl,caption,alt}) {return rights({id,dir,sourceUrl,caption,alt,creator:"Boho News",rightsBasis:"Original editorial graphic derived only from the cited primary record.",license:"Boho News original graphic",attribution:"Boho News graphic from cited primary data",usage:"Inline explanatory graphic; never headline media."});}

const articleDefs=[
  {
    slug:"gao-federal-open-access-publishing-costs-could-triple-2026",headline:"GAO Says Federal Open-Access Publishing Costs Could Triple",
    dek:"Seven of nine agencies updated public-access plans, but the watchdog found only NIH had planned for the added publishing expense.",
    section:"investigations",desk:"research-funding-accountability",topics:["Open-access publishing","Federal research funding","Public access policy","Research accountability","Scientific publishing"],entities:["Government Accountability Office","National Institutes of Health","Office of Science and Technology Policy"],locations:["United States"],
    sources:[{id:"source-gao-open-access-20260521",title:"Federal Research: Agencies Need to Plan for Costs of Public Access to Research Articles",publisher:"U.S. Government Accountability Office",publishedAt:"2026-05-21T12:00:00Z",url:"https://files.gao.gov/reports/GAO-26-107738/index.html"}],
    lead:{id:"media-federal-open-access-research-lab-2026",dir:"federal-open-access/research-lab",sourceUrl:"https://commons.wikimedia.org/wiki/File:Researcher_looking_through_microscope.jpg",creator:"Rhoda Baer / National Cancer Institute",rightsBasis:"Public domain: work of the U.S. federal government.",license:"Public domain",attribution:"Rhoda Baer / National Cancer Institute",caption:"A researcher works at a microscope. GAO says federal agencies need plans for the publishing costs created by expanded public access.",alt:"Laboratory researcher looks through a microscope beside scientific equipment.",original:"research-lab.jpg"},
    charts:[
      {id:"media-federal-open-access-agency-status-2026",dir:"federal-open-access/agency-status",caption:"GAO reviewed nine research agencies, seven of which had issued updated public-access plans.",alt:"Graphic lists nine agencies reviewed, seven updated plans and eleven GAO recommendations."},
      {id:"media-federal-open-access-cost-risk-2026",dir:"federal-open-access/cost-risk",caption:"GAO estimates annual federal publishing costs could roughly triple as immediate public access expands.",alt:"Graphic says publishing costs may triple annually and only NIH had a cost plan."}
    ],
    paragraphs:[
      "Federal agencies have made progress toward immediate public access for taxpayer-funded research, but most have not planned for the publishing costs that could follow, the Government Accountability Office reported.",
      "GAO reviewed nine agencies affected by a 2022 White House policy directing agencies to make federally funded research articles publicly available without an embargo. Seven had issued updated public-access plans when the audit was completed.",
      "The watchdog estimated that federal spending on article-processing charges and related publishing costs could roughly triple each year under the expanded policy. The estimate is not a bill already incurred; it models what broader immediate access may cost if current publishing practices continue.",
      "Only the National Institutes of Health had developed a plan for handling those costs, GAO said. Without comparable plans elsewhere, added publication fees could consume money that otherwise supports experiments, staff, equipment or new awards.",
      "The issue is not whether the public should receive access. The policy is designed to remove waiting periods and make federally supported findings available to researchers, clinicians, businesses and readers without subscription barriers.",
      "The accountability question is who pays and how agencies prevent the policy from shrinking the amount of research they can support. Researchers may face different fee structures across journals, while some publishers offer no-fee routes or institutional agreements.",
      "GAO made 11 recommendations across the nine agencies, principally calling for cost estimates, implementation plans and monitoring. Four agencies agreed with their recommendations; the other five did not provide comments, according to the report.",
      "Those response categories should not be read as evidence that an agency rejected public access. They describe whether agencies formally concurred with GAO's specific planning recommendations at the time of publication.",
      "The next measurable steps are agency cost plans and actual spending data. Those records will show whether publication expenses approach GAO's projection and whether agencies protect research awards while meeting the access deadline."
    ],
    facts:["GAO reviewed nine federal research agencies.","Seven had issued updated public-access plans.","GAO estimated annual publishing costs could roughly triple.","Only NIH had planned for the added costs.","GAO made 11 recommendations."],
    uncertainty:["The cost projection depends on future publishing choices and fee structures.","The audit does not establish that every agency will experience the same cost increase."],
    seoTitle:"GAO: federal open-access publishing costs may triple",seoDescription:"GAO says federal open-access publishing costs may roughly triple and found only NIH had planned for the added expense."
  },
  {
    slug:"state-local-law-enforcement-64200-officer-vacancies-2020",headline:"State and Local Agencies Reported 64,200 Sworn-Officer Vacancies",
    dek:"A new Bureau of Justice Statistics report finds separations exceeded hires in 2020 and voluntary resignations accounted for nearly half of departures.",
    section:"crime-justice",desk:"law-enforcement-workforce",topics:["Police staffing","Law enforcement hiring","Officer retention","Public safety workforce","LEMAS survey"],entities:["Bureau of Justice Statistics","State and local law enforcement agencies"],locations:["United States"],
    sources:[{id:"source-bjs-police-hiring-20260318",title:"Hiring and Retention of State and Local Law Enforcement Officers, 2020 – Statistical Tables",publisher:"Bureau of Justice Statistics",publishedAt:"2026-03-18T12:00:00Z",url:"https://bjs.ojp.gov/library/publications/hiring-and-retention-state-and-local-law-enforcement-officers-2020-statistical-tables"}],
    lead:{id:"media-police-hiring-patrol-car-2026",dir:"police-hiring/patrol-car",sourceUrl:"https://commons.wikimedia.org/wiki/File:Patrol_car.jpg",creator:"Scorpion381",rightsBasis:"Creative Commons Attribution-ShareAlike 4.0 International.",license:"CC BY-SA 4.0",attribution:"Scorpion381 / Wikimedia Commons, CC BY-SA 4.0",caption:"A marked police patrol car. State and local agencies reported 64,200 sworn-officer vacancies in the 2020 LEMAS survey.",alt:"Marked police patrol car parked outdoors in daylight.",original:"patrol-car.jpg"},
    charts:[
      {id:"media-police-hiring-workforce-flow-2026",dir:"police-hiring/workforce-flow",caption:"State and local agencies reported 55,000 hires, 57,400 separations and 64,200 vacancies in 2020.",alt:"Graphic lists 55,000 hires, 57,400 separations and 64,200 reported vacancies."},
      {id:"media-police-hiring-retention-2026",dir:"police-hiring/retention",caption:"Voluntary resignations made up 47% of reported sworn-officer separations in 2020.",alt:"Graphic lists 47 percent voluntary resignations, 81 percent entry-level hires and 16 percent lateral hires."}
    ],
    paragraphs:[
      "State and local law-enforcement agencies reported about 64,200 vacant sworn-officer positions in 2020, according to statistical tables released by the Bureau of Justice Statistics in March 2026.",
      "The agencies reported hiring roughly 55,000 officers during the year while about 57,400 officers separated. The figures describe a national survey period shaped by the pandemic and should not be treated as a current vacancy count for 2026.",
      "Entry-level recruits accounted for 81% of hires, while lateral hires from other law-enforcement agencies accounted for 16%. The remaining share included other hiring paths identified in the survey tables.",
      "Voluntary resignations made up 47% of reported separations. Retirements, dismissals and other departures accounted for the balance, making retention as important to staffing totals as recruiting new officers.",
      "Agency size affected the resources available to recruits. BJS found that 97% of agencies with 500 or more full-time-equivalent sworn officers paid for academy training, compared with 57% of agencies with 24 or fewer.",
      "That gap does not by itself explain vacancies. Compensation, local labor markets, retirement eligibility, hiring standards, academy capacity and community conditions can all affect whether an agency fills an authorized position.",
      "The tables also distinguish authorized vacancies from a universal statement about service levels. A vacancy is an approved position that was unfilled under the agency's reporting rules; it does not show how every agency deployed personnel or whether budgets supported immediate hiring.",
      "Because the data cover 2020, the report is best used as a baseline for comparing later staffing surveys rather than as a live roster. Changes after 2020 require newer agency or national records.",
      "The clearest national signal is the workforce flow: reported separations exceeded hires, and nearly half of departures were voluntary resignations. Future releases can show whether recruitment and retention efforts reversed that pattern."
    ],
    facts:["Agencies reported about 64,200 sworn-officer vacancies in 2020.","They reported about 55,000 hires and 57,400 separations.","Entry-level recruits were 81% of hires.","Lateral hires were 16% of hires.","Voluntary resignations were 47% of separations."],
    uncertainty:["The data cover 2020 and are not a current 2026 staffing count.","Reported vacancies do not alone measure local service levels or budget capacity."],
    seoTitle:"BJS: agencies reported 64,200 officer vacancies",seoDescription:"BJS says state and local agencies reported 64,200 sworn-officer vacancies, 55,000 hires and 57,400 separations in 2020."
  },
  {
    slug:"congressional-community-projects-39-billion-obligated-gao-2026",headline:"Congressional Community Projects Had 61% of $39 Billion Obligated",
    dek:"GAO says more than 20,000 congressionally directed projects were funded in fiscal years 2022–2024, while recipients and agencies reported implementation challenges.",
    section:"politics",desk:"congressional-spending",topics:["Community project funding","Congressionally directed spending","Federal grants","Appropriations oversight","Government accountability"],entities:["Government Accountability Office","U.S. Congress","Federal agencies"],locations:["United States"],
    sources:[{id:"source-gao-community-projects-20260716",title:"Congressionally Directed Spending: Implementation and Oversight of Community Project Funding",publisher:"U.S. Government Accountability Office",publishedAt:"2026-07-16T12:00:00Z",url:"https://www.gao.gov/products/gao-26-107944"}],
    lead:{id:"media-community-projects-road-worker-2026",dir:"community-projects/road-work",sourceUrl:"https://commons.wikimedia.org/wiki/File:Road_Construction_Worker_-_Controlling_Traffic.jpg",creator:"Tony Webster",rightsBasis:"Creative Commons Attribution 2.0 Generic.",license:"CC BY 2.0",attribution:"Tony Webster / Wikimedia Commons, CC BY 2.0",caption:"A road worker directs traffic at a construction site. Infrastructure was among the local projects funded through congressionally directed spending.",alt:"Road construction worker in reflective gear directs traffic beside work vehicles.",original:"road-work.jpg"},
    charts:[
      {id:"media-community-projects-funding-status-2026",dir:"community-projects/funding-status",caption:"Congress designated about $39 billion for community projects, with 61% obligated and 16% outlayed by the end of fiscal 2024.",alt:"Graphic lists about 39 billion dollars, 61 percent obligated and 16 percent outlayed."},
      {id:"media-community-projects-implementation-2026",dir:"community-projects/implementation",caption:"GAO reviewed implementation across more than 20,000 projects and found challenges were common among sampled recipients.",alt:"Graphic lists more than 20,000 projects, 60 percent reporting a challenge and about 1 percent not moving forward."}
    ],
    paragraphs:[
      "Congress designated about $39 billion for more than 20,000 community projects in fiscal years 2022 through 2024, according to a Government Accountability Office review of the revived appropriations practice.",
      "By the end of fiscal 2024, federal agencies had obligated 61% of the designated money and outlayed 16%, GAO reported. An obligation is a legal commitment; an outlay is money actually paid, so the two measures describe different stages of delivery.",
      "The projects span infrastructure, facilities, economic development, public services and other local priorities selected by members of Congress. The system is also known as congressionally directed spending or community project funding, depending on the chamber and account.",
      "GAO found that about 1% of the projects were not moving forward. That share is small, but it represents projects that may require rescission, reprogramming or other congressional and agency action before designated funds can be resolved.",
      "Implementation challenges were more common. Sixty percent of recipients in GAO's sample reported at least one problem, including rising costs, administrative requirements, delayed agreements, matching-fund demands or changes in project scope.",
      "The audit drew on a sample of 790 projects, interviews with 167 recipients and 36 site visits. Those methods provide detailed evidence, but the recipient findings are not a census of every project in the $39 billion portfolio.",
      "Sixteen of the 19 agencies administering these funds also identified oversight challenges. Agencies must apply the rules of varied grant, procurement and infrastructure programs to projects selected through appropriations rather than through a single competitive program.",
      "The 16% outlay rate should not automatically be read as evidence that the remaining money was lost or idle. Multi-year construction and grant projects often pay after milestones, though slow obligations or unresolved scopes can still delay public benefit.",
      "The next accountability checkpoints are project-level status, final costs, completed outputs and explanations for cancellations. Those records will show whether the designated money produced the local results Congress and recipients described."
    ],
    facts:["Congress designated about $39 billion for more than 20,000 projects.","Agencies had obligated 61% by the end of fiscal 2024.","Agencies had outlayed 16% by the end of fiscal 2024.","About 1% of projects were not moving forward.","Sixty percent of sampled recipients reported a challenge."],
    uncertainty:["GAO's detailed recipient findings come from a sample rather than every project.","Low outlays can reflect legitimate multi-year schedules as well as implementation delays."],
    seoTitle:"GAO tracks $39B in congressional community projects",seoDescription:"GAO says 61% of about $39 billion for congressional community projects was obligated and 16% outlayed by fiscal 2024."
  },
  {
    slug:"us-open-2026-schedule-fan-week-main-draw-finals",headline:"2026 U.S. Open Starts Fan Week Aug. 23 and Main Draw Aug. 30",
    dek:"Qualifying begins Aug. 24, mixed doubles returns Aug. 25–26, and the singles champions are scheduled to be decided Sept. 12–13.",
    section:"sports",desk:"tennis-scheduling",topics:["2026 U.S. Open","Tennis schedule","Fan Week","Grand Slam tennis","Arthur Ashe Stadium"],entities:["U.S. Open","United States Tennis Association","USTA Billie Jean King National Tennis Center"],locations:["New York City","Flushing Meadows","United States"],
    sources:[
      {id:"source-usopen-2026-schedule",title:"2026 U.S. Open Event Schedule",publisher:"U.S. Open",publishedAt:"2026-07-14T18:24:00Z",url:"https://www.usopen.org/en_US/about/eventschedule.html"},
      {id:"source-usopen-2026-dates",title:"2026 U.S. Open Tournament Dates",publisher:"U.S. Open",publishedAt:"2026-07-14T18:24:00Z",url:"https://www.usopen.org/amp/en_US/news/articles/2025-12-11/2026_us_open_tournament_dates.html"}
    ],
    lead:{id:"media-us-open-arthur-ashe-2026",dir:"us-open-schedule/arthur-ashe",sourceUrl:"https://commons.wikimedia.org/wiki/File:Arthur_Ashe_Stadium_(48613684807).jpg",creator:"ajay_suresh",rightsBasis:"Creative Commons Attribution 2.0 Generic.",license:"CC BY 2.0",attribution:"ajay_suresh / Wikimedia Commons, CC BY 2.0",caption:"Arthur Ashe Stadium at the USTA Billie Jean King National Tennis Center. The 2026 U.S. Open main draw begins Aug. 30.",alt:"Arthur Ashe Stadium rises above the grounds of the USTA tennis center beneath a blue sky.",original:"arthur-ashe.jpg"},
    charts:[
      {id:"media-us-open-key-dates-2026",dir:"us-open-schedule/key-dates",caption:"Fan Week begins Aug. 23, qualifying starts Aug. 24 and the main draw opens Aug. 30.",alt:"Graphic lists Fan Week August 23, qualifying August 24 and main draw August 30."},
      {id:"media-us-open-finals-2026",dir:"us-open-schedule/finals",caption:"The women's singles final is scheduled for Sept. 12 and the men's final for Sept. 13.",alt:"Graphic lists women's final September 12, men's final September 13 and schedule subject to change."}
    ],
    paragraphs:[
      "The 2026 U.S. Open begins its public program with Fan Week on Sunday, Aug. 23, followed by qualifying on Monday, Aug. 24, and the singles main draw on Sunday, Aug. 30.",
      "The tournament runs at the USTA Billie Jean King National Tennis Center in Flushing Meadows, New York. The women's singles final is scheduled for Saturday, Sept. 12, and the men's final for Sunday, Sept. 13.",
      "Qualifying is scheduled from Aug. 24 through Aug. 27. The mixed-doubles competition is listed for Aug. 25 and 26, giving it a distinct place during the week before the main singles draw.",
      "Fan Week continues through Aug. 29 and includes qualifying access and other on-site programming. Ticket and access conditions vary by event, so visitors should use the official U.S. Open listing for the day they plan to attend.",
      "Main-draw play starts Aug. 30 with first-round singles. The opening rounds extend across multiple show courts before the schedule narrows toward quarterfinals, semifinals and championship weekend.",
      "Arthur Ashe Stadium day sessions generally begin at 11:30 a.m., except where the official schedule notes a different start. Evening sessions and matches on other courts have separate times and admission rules.",
      "A daily start time is not a guaranteed match time for a particular player. Draws, order-of-play assignments, weather, match length and television scheduling can all change when an individual contest begins.",
      "The official event schedule is explicitly subject to change. Fans making travel plans should recheck both the order of play and ticket terms close to their visit rather than relying only on the tournament-wide calendar.",
      "The stable planning anchors are the date sequence: Fan Week on Aug. 23, qualifying from Aug. 24, main-draw singles from Aug. 30, and the two singles finals on Sept. 12 and 13."
    ],
    facts:["Fan Week begins Aug. 23, 2026.","Qualifying begins Aug. 24.","Mixed doubles is scheduled for Aug. 25–26.","The main draw begins Aug. 30.","Singles finals are scheduled for Sept. 12–13."],
    uncertainty:["The official schedule is subject to change.","Individual match times depend on draws, order of play, weather and earlier matches."],
    seoTitle:"2026 U.S. Open schedule: key dates and finals",seoDescription:"The 2026 U.S. Open starts Fan Week Aug. 23, qualifying Aug. 24 and the main draw Aug. 30; finals are Sept. 12–13."
  },
  {
    slug:"noaa-atlantic-hurricane-outlook-75-percent-below-normal-2026",headline:"NOAA Raises Odds of a Below-Normal Atlantic Hurricane Season to 75%",
    dek:"The Aug. 6 update projects 7–13 named storms for the full season and cites a strengthening El Niño, while stressing that it is not a landfall forecast.",
    section:"weather-climate",desk:"seasonal-forecasting",topics:["Atlantic hurricane season","NOAA seasonal outlook","El Niño","Tropical cyclones","Hurricane preparedness"],entities:["National Oceanic and Atmospheric Administration","Climate Prediction Center","National Hurricane Center"],locations:["Atlantic Ocean","Caribbean Sea","Gulf of Mexico"],
    sources:[{id:"source-noaa-atlantic-outlook-20260806",title:"NOAA 2026 Atlantic Hurricane Season Outlook Update",publisher:"NOAA Climate Prediction Center",publishedAt:"2026-08-06T12:00:00Z",url:"https://www.cpc.ncep.noaa.gov/products/outlooks/hurricane.shtml?vm=r"}],
    lead:{id:"media-noaa-atlantic-outlook-hurricane-2026",dir:"noaa-atlantic-outlook/hurricane-satellite",sourceUrl:"https://commons.wikimedia.org/wiki/File:Hurricane_Karl_2010-09-16_1720Z.jpg",creator:"NASA Terra / MODIS",rightsBasis:"Public domain: NASA satellite imagery produced by the U.S. federal government.",license:"Public domain",attribution:"NASA Terra / MODIS",caption:"Hurricane Karl over the Gulf of Mexico in 2010, seen by NASA's Terra satellite. NOAA's 2026 update favors a below-normal Atlantic season.",alt:"Large hurricane swirls over blue ocean in a NASA satellite view.",original:"hurricane-karl.jpg"},
    charts:[
      {id:"media-noaa-atlantic-outlook-storm-ranges-2026",dir:"noaa-atlantic-outlook/storm-ranges",caption:"NOAA's full-season outlook calls for 7–13 named storms, 2–6 hurricanes and 0–2 major hurricanes.",alt:"Graphic lists 7 to 13 named storms, 2 to 6 hurricanes and zero to two major hurricanes."},
      {id:"media-noaa-atlantic-outlook-probabilities-2026",dir:"noaa-atlantic-outlook/probabilities",caption:"NOAA assigns a 75% chance of a below-normal season, 20% near normal and 5% above normal.",alt:"Graphic lists 75 percent below normal, 20 percent near normal and 5 percent above normal."}
    ],
    paragraphs:[
      "NOAA now gives the 2026 Atlantic hurricane season a 75% chance of finishing below normal, up from its preseason assessment, according to the agency's Aug. 6 update.",
      "The outlook assigns a 20% chance to a near-normal season and 5% to an above-normal one. Those probabilities describe overall basin activity, not whether a storm will strike a particular coast.",
      "For the full June-through-November season, NOAA projects 7 to 13 named storms, including the two that had already formed when the update was issued. The range includes 2 to 6 hurricanes and 0 to 2 major hurricanes of Category 3 or stronger.",
      "NOAA expects accumulated cyclone energy, a combined measure of storm strength and duration, to finish between 30% and 90% of the long-term median. About 3% of the median had accumulated by the outlook date.",
      "The agency lowered its activity expectations largely because El Niño is strengthening. NOAA gives a 90% chance of strong or very strong El Niño conditions during the August-through-October peak of the Atlantic season.",
      "El Niño often increases upper-level winds that disrupt Atlantic tropical cyclones, but it does not eliminate them. Warm water, local atmospheric conditions and short-term weather patterns can still support a damaging storm.",
      "Seasonal totals also do not measure impact. One hurricane making landfall near a populated or vulnerable area can cause severe consequences during a season that is below normal by basin-wide statistics.",
      "NOAA's update is therefore not a reason to relax preparedness. Residents and businesses in hurricane-prone areas should use forecasts and instructions from official local and national authorities when a specific system develops.",
      "The outlook's value is probabilistic planning: the most likely season category is now below normal, while the ranges preserve uncertainty about how many storms will form and how strong or long-lived they will become."
    ],
    facts:["NOAA assigns a 75% chance of a below-normal Atlantic season.","The near-normal probability is 20% and above-normal probability 5%.","NOAA projects 7–13 named storms.","The range includes 2–6 hurricanes and 0–2 major hurricanes.","NOAA gives a 90% chance of strong or very strong El Niño during the peak."],
    uncertainty:["The seasonal outlook does not predict landfalls or impacts at a specific location.","Storm counts and accumulated cyclone energy can finish outside the forecast ranges."],
    seoTitle:"NOAA: 75% chance of below-normal 2026 Atlantic season",seoDescription:"NOAA's Aug. 6 update gives a 75% chance of a below-normal Atlantic hurricane season, with 7–13 named storms projected."
  },
  {
    slug:"who-hiv-hepatitis-sti-progress-gaps-2026",headline:"WHO Says 32 Million People With HIV Were Receiving Treatment in 2025",
    dek:"The agency reports large declines in new HIV infections and AIDS-related deaths since 2010 but warns treatment gaps and rising hepatitis B deaths remain.",
    section:"world",desk:"global-health-systems",topics:["Global HIV response","Viral hepatitis","Sexually transmitted infections","Public health systems","Disease prevention"],entities:["World Health Organization","United Nations member states"],locations:["Worldwide"],
    sources:[{id:"source-who-hiv-hepatitis-sti-20260727",title:"Integration, innovation and community leadership key to ending HIV, hepatitis and STIs",publisher:"World Health Organization",publishedAt:"2026-07-27T15:45:00Z",url:"https://www.who.int/news-room/releases/27-07-2026-who--integration--innovation-and-community-leadership-key-to-ending-hiv--hepatitis-and-stis"}],
    lead:{id:"media-who-health-strategies-clinic-2026",dir:"who-health-strategies/doctor-patient",sourceUrl:"https://commons.wikimedia.org/wiki/File:Doctor_consults_with_patient_(7).jpg",creator:"Bill Branson / National Cancer Institute",rightsBasis:"Public domain: work of the U.S. federal government.",license:"Public domain",attribution:"Bill Branson / National Cancer Institute",caption:"A doctor consults with a patient. WHO says integration of HIV, hepatitis and STI services is essential to closing treatment gaps.",alt:"Doctor sits beside a patient during a consultation in a clinic room.",original:"doctor-patient.jpg"},
    charts:[
      {id:"media-who-health-strategies-hiv-progress-2026",dir:"who-health-strategies/hiv-progress",caption:"WHO says 32 million people were receiving HIV treatment in 2025 as infections and AIDS-related deaths declined from 2010 levels.",alt:"Graphic lists new HIV infections down 42 percent, AIDS deaths down 57 percent and 32 million treated in 2025."},
      {id:"media-who-health-strategies-remaining-gaps-2026",dir:"who-health-strategies/remaining-gaps",caption:"WHO's assessment identifies major remaining treatment and hepatitis gaps despite progress.",alt:"Graphic lists 9 million lacking HIV treatment, hepatitis B infections down 32 percent and hepatitis B deaths up 17 percent."}
    ],
    paragraphs:[
      "About 32 million people living with HIV were receiving treatment by the end of 2025, the World Health Organization said in a new assessment of global strategies for HIV, viral hepatitis and sexually transmitted infections.",
      "WHO reported that new HIV infections fell 42% and AIDS-related deaths fell 57% between 2010 and 2025. Those global trends show substantial progress, but they do not mean access or outcomes are equal within every country or population.",
      "Roughly 9 million people living with HIV still lacked treatment at the end of 2025, according to the agency. Closing that gap requires diagnosis, affordable medicines, durable supply chains and services people can reach without stigma or discrimination.",
      "The hepatitis picture is mixed. Since 2015, WHO says new hepatitis B infections declined 32% and hepatitis C deaths declined 12%, while deaths associated with hepatitis B increased 17%.",
      "Those percentages use different conditions and outcome measures, so they should not be collapsed into one combined trend. WHO's point is that prevention gains coexist with persistent gaps in testing, treatment and mortality reduction.",
      "The assessment highlights service integration: offering HIV, hepatitis and STI prevention, testing and treatment through connected programs rather than requiring people to navigate separate systems for related needs.",
      "WHO also cited new prevention tools. Injectable lenacapavir had been introduced in 10 countries, with 14 more planning introduction, but rollout, affordability, eligibility and supply will determine how broadly the option changes prevention access.",
      "The figures are population-level public-health indicators, not guidance for an individual's treatment. Clinical decisions require a qualified health professional and the protocols available in the patient's country or health system.",
      "WHO's next global strategies will be judged not only by aggregate declines but by whether countries reach the people still outside care, sustain financing and document reductions across HIV, hepatitis and STIs without leaving high-burden communities behind."
    ],
    facts:["About 32 million people were receiving HIV treatment by the end of 2025.","New HIV infections declined 42% from 2010 to 2025.","AIDS-related deaths declined 57% over that period.","About 9 million people living with HIV still lacked treatment.","WHO says hepatitis B deaths increased 17% since 2015."],
    uncertainty:["Global aggregates mask differences among countries and populations.","The impact of newer prevention tools depends on access, affordability, eligibility and supply."],
    seoTitle:"WHO: 32M on HIV treatment, major gaps remain",seoDescription:"WHO says 32 million people received HIV treatment in 2025, while 9 million remained without it and hepatitis gaps persisted."
  }
];

function article(def){
  const blocks=def.paragraphs.map((text)=>({type:"paragraph",text}));
  for(const [chart,index] of [[def.charts[1],6],[def.charts[0],2]]) blocks.splice(index,0,{type:"media",rightsId:chart.id,src:`${mediaRoot}/${chart.dir}/four-three.webp`,alt:chart.alt,caption:chart.caption,credit:"Boho News graphic from cited primary data",width:1200,height:900,sourceUrl:def.sources[0].url});
  return {articleType:"news-report",authors:["Boho News Staff"],body:def.paragraphs.join("\n\n"),bodyBlocks:blocks,canonicalUrl:`https://bohonews.com/articles/${def.slug}/`,citations:def.sources,confirmedFactsSummary:def.facts,corrections:[],dek:def.dek,desk:def.desk,distribution:{newsSitemap:true,rss:true},editor:"Boho News Editorial Desk",entities:def.entities,eventId:`event-${def.slug}`,headline:def.headline,id:`article-${def.slug}`,leadImage:{alt:def.lead.alt,caption:def.lead.caption,credit:def.lead.attribution,height:900,rightsId:def.lead.id,role:"lead",src:`${mediaRoot}/${def.lead.dir}/lead.webp`,width:1600},locations:def.locations,media:[],publicChangeLog:[],publicationStatus:"approved",publishedAt:null,relatedArticleIds:[],releaseId:null,retractionState:"current",schemaVersion:"2.0.0",search:{description:def.seoDescription,index:true,title:def.seoTitle},section:def.section,slug:def.slug,social:{description:def.dek,image:`${mediaRoot}/${def.lead.dir}/open-graph.webp`,title:def.headline},supersededByArticleId:null,supersedesArticleId:null,topics:def.topics,uncertainty:def.uncertainty,updatedAt:null};
}

const promotion=JSON.parse(readFileSync(promotionPath,"utf8"));
const existingSlugs=new Set(promotion.articles.map(({slug})=>slug));
const existingRights=new Set(promotion.mediaRights.map(({id})=>id));
for(const def of articleDefs){if(existingSlugs.has(def.slug))throw new Error(`Duplicate slug: ${def.slug}`);for(const id of [def.lead.id,...def.charts.map(({id})=>id)])if(existingRights.has(id))throw new Error(`Duplicate rights ID: ${id}`);}
const newArticles=articleDefs.map(article);
const newRights=articleDefs.flatMap((def)=>[rights(def.lead),...def.charts.map((chart)=>graphic({...chart,sourceUrl:def.sources[0].url}))]);
promotion.articles.push(...newArticles);promotion.mediaRights.push(...newRights);
promotion.compilerVersion="bohonews-manual-maintenance-installer.v1.0.0";promotion.generatedAt="2026-08-10T06:20:00Z";promotion.releaseState="candidate";
promotion.inventory={articleCount:promotion.articles.length,routeCount:promotion.articles.length,mediaCount:promotion.mediaRights.length};
promotion.inputHashes={sourceItems:digest(articleDefs.map(({sources})=>sources)),events:digest(articleDefs.map(({slug})=>`event-${slug}`)),claims:digest(articleDefs.map(({facts})=>facts)),articles:digest(newArticles),approvals:digest({mode:"owner-authorized-maintenance",date:"2026-08-09"}),corrections:digest([]),mediaRights:digest(newRights),releaseRecords:digest(promotion.releaseRecords),publicationIntents:digest(articleDefs.map(({slug})=>({slug,intent:"manual-maintenance-release"})))};
delete promotion.packageDigest;promotion.packageDigest=digest(promotion);
const release={schemaVersion:promotion.schemaVersion,compilerVersion:promotion.compilerVersion,generatedAt:promotion.generatedAt,packageDigest:promotion.packageDigest,articleCount:promotion.inventory.articleCount,mediaCount:promotion.inventory.mediaCount,routes:promotion.articles.map(({canonicalUrl})=>new URL(canonicalUrl).pathname),releaseRecords:promotion.releaseRecords,releaseState:promotion.releaseState};
writeFileSync(promotionPath,`${JSON.stringify(promotion,null,2)}\n`);writeFileSync(releasePath,`${JSON.stringify(release,null,2)}\n`);
console.log(JSON.stringify({newArticles:newArticles.map(({headline,slug,section,desk})=>({headline,slug,section,desk})),packageDigest:promotion.packageDigest,articleCount:promotion.inventory.articleCount,mediaCount:promotion.inventory.mediaCount},null,2));
