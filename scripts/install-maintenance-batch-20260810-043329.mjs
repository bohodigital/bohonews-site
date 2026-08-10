import {createHash} from "node:crypto";
import {readFileSync, writeFileSync} from "node:fs";
import {join} from "node:path";
import {stableJson} from "./publishing/stable-json.mjs";

const root=process.cwd();
const promotionPath=join(root,"src/publishing/public-news-promotion-package.v2.1.1.json");
const releasePath=join(root,"public-news-release.v2.1.1.json");
const mediaRoot="/media/newsroom/2026/08/manual-20260810-043329";
const retrievedAt="2026-08-10T04:58:00Z";
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
    slug:"ftc-trend-deploy-refund-checks-672000-2026",headline:"FTC Sends 9,419 Trend Deploy Refund Checks Totaling More Than $672,000",
    dek:"Recipients who bought masks and other protective equipment should cash the checks within 90 days and never pay a fee to receive an FTC refund.",
    section:"business",desk:"consumer-redress",topics:["FTC consumer refunds","Trend Deploy","Online shopping","Mail Order Rule","Personal protective equipment"],entities:["Federal Trade Commission","Trend Deploy","JND Legal Administration"],locations:["United States"],
    sources:[
      {id:"source-ftc-trend-refunds-20260722",title:"FTC Returns Money to Consumers Harmed by Trend Deploy's Deceptive Marketing",publisher:"Federal Trade Commission",publishedAt:"2026-07-22T12:00:00Z",url:"https://www.ftc.gov/news-events/news/press-releases/2026/07/ftc-returns-money-consumers-harmed-trend-deploys-deceptive-marketing"},
      {id:"source-ftc-trend-refund-page-202607",title:"Trend Deploy Refunds",publisher:"Federal Trade Commission",publishedAt:"2026-07-22T12:00:00Z",url:"https://www.ftc.gov/enforcement/refunds/trend-deploy-refunds"}
    ],
    lead:{id:"media-ftc-building-trend-refunds",dir:"ftc-trend-deploy/ftc-building",sourceUrl:"https://commons.wikimedia.org/wiki/File:Federal_Trade_Commission_Building_2.jpg",creator:"Kurt Kaiser",rightsBasis:"Public-domain dedication recorded by Wikimedia Commons.",license:"Public domain",attribution:"Kurt Kaiser / Wikimedia Commons",caption:"The Federal Trade Commission headquarters in Washington. The agency is mailing 9,419 Trend Deploy refund checks.",alt:"Stone exterior of the Federal Trade Commission headquarters in Washington.",original:"ftc-building.jpg"},
    charts:[
      {id:"media-trend-refund-scale-2026",dir:"ftc-trend-deploy/refund-scale",caption:"The FTC's Trend Deploy distribution contains 9,419 checks totaling more than $672,000.",alt:"Graphic lists 9,419 checks, more than 672,000 dollars total and a 90-day cashing deadline."},
      {id:"media-trend-refund-safety-2026",dir:"ftc-trend-deploy/refund-safety",caption:"The FTC says recipients do not pay a fee or provide account information to receive these checks.",alt:"Graphic says no fee, no account information and use the official refund administrator for questions."}
    ],
    paragraphs:[
      "The Federal Trade Commission is mailing 9,419 refund checks totaling more than $672,000 to people who bought face masks and other personal protective equipment from Trend Deploy during the COVID-19 pandemic.",
      "The agency says recipients should cash their checks within 90 days, using the deadline printed on the check. People with questions can contact the redress administrator, JND Legal Administration, at the number or website listed on the FTC's official refund page.",
      "The distribution follows an earlier federal court order resolving the FTC's case against Trend Deploy operator Frank Romero. According to the agency, the business promised fast shipment of masks, including N95 products, and other protective equipment but did not consistently ship on time, offer required cancellation options or deliver the quality advertised.",
      "Those statements describe the FTC's allegations and the basis for its redress program. The refund announcement itself does not calculate an equal payment for every buyer, and the agency advises recipients to use the amount on their individual check rather than dividing the headline total by the number of payments.",
      "The most important fraud safeguard is simple: the FTC does not require a fee or bank-account information before a consumer can receive a refund. A message demanding payment, a wire transfer, gift cards or account credentials in exchange for an FTC check is not part of this distribution.",
      "Consumers who receive a check should verify the administrator through FTC.gov rather than through a link in an unsolicited message. The official contact number for this distribution is 833-609-9714, according to the agency's refund page.",
      "The case also illustrates the federal Mail, Internet, or Telephone Order Merchandise Rule. When a seller cannot ship within the promised time, the rule generally requires the seller to obtain consent to a delay or provide a prompt refund; the exact obligations depend on the transaction and the representations made.",
      "The FTC says recipients do not need to submit a new claim for this mailing. Eligibility and payment amounts were determined from the redress records used by the agency and its administrator.",
      "For affected buyers, the actionable details are the check, the 90-day cashing window and the official administrator. Anyone who did not receive a payment should not assume eligibility from the total alone and should use the FTC's published contact channel for case-specific questions."
    ],
    facts:["The FTC is mailing 9,419 checks.","The checks total more than $672,000.","Recipients should cash checks within 90 days.","The FTC says no fee or account information is required to receive payment.","The official administrator is JND Legal Administration."],
    uncertainty:["Individual check amounts vary and are not specified in the agency's headline total.","The public announcement does not establish that every Trend Deploy customer is eligible for a payment."],
    seoTitle:"Trend Deploy FTC refunds: 9,419 checks mailed",seoDescription:"The FTC is mailing 9,419 Trend Deploy refund checks totaling more than $672,000; recipients have 90 days to cash them."
  },
  {
    slug:"osha-safe-sound-week-august-10-16-2026",headline:"OSHA Safe + Sound Week Runs Aug. 10–16 With Three-Part Safety Framework",
    dek:"The national workplace-safety week centers on management leadership, worker participation and a systematic process for finding and fixing hazards.",
    section:"health-science",desk:"occupational-health",topics:["Safe + Sound Week","Workplace safety programs","Occupational health","Hazard prevention","Worker participation"],entities:["Occupational Safety and Health Administration","U.S. Department of Labor"],locations:["United States"],
    sources:[
      {id:"source-osha-safe-sound-2026",title:"Safe + Sound Week",publisher:"Occupational Safety and Health Administration",publishedAt:"2026-07-09T12:00:00Z",url:"https://www.osha.gov/safeandsoundweek/"},
      {id:"source-osha-calendar-202608",title:"OSHA Calendar of Events",publisher:"Occupational Safety and Health Administration",publishedAt:"2026-07-30T12:00:00Z",url:"https://www.osha.gov/calendar/"}
    ],
    lead:{id:"media-osha-construction-worker-2026",dir:"osha-safe-sound/construction-worker",sourceUrl:"https://commons.wikimedia.org/wiki/File:Baliwagenyo_welder_with_green_hard_hat_working_atop_a_petrol_station_metal_structure_01.jpg",creator:"FBenjr123",rightsBasis:"Creative Commons Attribution-ShareAlike 4.0 International.",license:"CC BY-SA 4.0",attribution:"FBenjr123 / Wikimedia Commons, CC BY-SA 4.0",caption:"A welder wearing a hard hat works on a metal structure. OSHA's Safe + Sound Week runs Aug. 10–16.",alt:"Welder in a green hard hat works high on a metal framework against a blue sky.",original:"construction-worker.jpg"},
    charts:[
      {id:"media-osha-program-pillars-2026",dir:"osha-safe-sound/program-pillars",caption:"OSHA organizes safety and health programs around leadership, participation and hazard prevention.",alt:"Graphic lists management leadership, worker participation and finding and fixing hazards."},
      {id:"media-osha-safe-sound-dates-2026",dir:"osha-safe-sound/week-dates",caption:"Safe + Sound Week runs nationwide from Aug. 10 through Aug. 16, 2026.",alt:"Graphic shows August 10 to 16, open to every industry, with activities that can continue year-round."}
    ],
    paragraphs:[
      "OSHA's 2026 Safe + Sound Week begins Monday, Aug. 10, and runs through Sunday, Aug. 16, giving employers and workers a national prompt to examine how their safety and health programs operate in practice.",
      "The Occupational Safety and Health Administration describes the week as open to organizations of every size and industry. Participation is voluntary, and the agency provides activity ideas rather than imposing a new rule or one-size-fits-all compliance checklist.",
      "OSHA's recommended framework has three core elements: management leadership, worker participation, and a systematic process for finding and fixing hazards. The point is to make prevention part of routine operations instead of waiting for an incident to expose a problem.",
      "Management leadership includes setting expectations, providing time and resources, and making supervisors accountable for the program. Worker participation means employees can report hazards, help design controls and raise concerns without retaliation.",
      "The third element turns those commitments into a cycle: identify hazards, assess risk, select controls, verify that the controls work and revisit the process as equipment, staffing or tasks change.",
      "A workplace can mark the week with a focused walkthrough, a short hazard-reporting exercise, a review of emergency contacts or a discussion led by workers who perform the task being examined. OSHA's materials encourage activities that fit the workplace rather than decorative events detached from actual hazards.",
      "The calendar placement matters because a safety program is not proved by seven days of attention. A useful Safe + Sound Week activity should produce a documented action, such as assigning an owner to a hazard, setting a completion date or measuring whether a control reduced exposure.",
      "Workers retain the right to raise safety concerns throughout the year. The awareness campaign does not replace employer obligations under the Occupational Safety and Health Act, applicable standards or state-plan requirements.",
      "For organizations joining the event, the practical test is what remains after Aug. 16: a clearer reporting path, a hazard corrected, a worker included in a decision or a recurring review that did not exist before the week began."
    ],
    facts:["Safe + Sound Week is scheduled for Aug. 10–16, 2026.","The event is open to organizations of any size or industry.","OSHA's framework includes management leadership, worker participation, and finding and fixing hazards.","Participation in the awareness week is voluntary.","The campaign does not replace existing legal obligations."],
    uncertainty:["OSHA does not publish one universal activity plan because workplace hazards differ.","Participation counts and outcomes will not be known until organizations report their 2026 activities."],
    seoTitle:"OSHA Safe + Sound Week 2026 dates and framework",seoDescription:"OSHA Safe + Sound Week runs Aug. 10–16, 2026, focusing on leadership, worker participation, and finding and fixing hazards."
  },
  {
    slug:"smithsonian-voices-votes-democracy-exhibit-september-7-2026",headline:"Smithsonian’s ‘Voices and Votes’ Democracy Exhibit Runs Through Sept. 7",
    dek:"The Arts and Industries Building show brings a traveling civic-history exhibition back to Washington after stops in small communities across 25 states.",
    section:"culture",desk:"civic-exhibitions",topics:["Voices and Votes","American democracy","Voting rights history","Smithsonian exhibitions","Museum on Main Street"],entities:["Smithsonian Institution","Museum on Main Street","Arts and Industries Building","National Museum of American History"],locations:["Washington, D.C.","United States"],
    sources:[{id:"source-smithsonian-voices-votes-20260609",title:"Exhibition Exploring Democracy Across America Opens June 16 in Smithsonian's Arts and Industries Building",publisher:"Smithsonian Institution",publishedAt:"2026-06-09T12:00:00Z",url:"https://www.si.edu/newsdesk/releases/exhibition-exploring-democracy-across-america-opens-june-16-smithsonians-arts-and"}],
    lead:{id:"media-smithsonian-arts-industries-garden",dir:"smithsonian-voices-votes/arts-industries",sourceUrl:"https://commons.wikimedia.org/wiki/File:Arts_and_Industries_Building_Garden.jpg",creator:"Northern-Virginia-Photographer",rightsBasis:"Creative Commons CC0 public-domain dedication.",license:"CC0 1.0",attribution:"Northern-Virginia-Photographer / Wikimedia Commons, CC0",caption:"The Smithsonian Arts and Industries Building in Washington hosts ‘Voices and Votes’ through Sept. 7.",alt:"Red-brick Smithsonian Arts and Industries Building seen beyond a formal garden.",original:"arts-industries.jpg"},
    charts:[
      {id:"media-voices-votes-run-2026",dir:"smithsonian-voices-votes/exhibit-run",caption:"The Washington presentation runs from June 16 through Sept. 7 in the Arts and Industries Building.",alt:"Graphic lists June 16 to September 7, Arts and Industries Building and free Smithsonian exhibition."},
      {id:"media-voices-votes-travel-reach-2026",dir:"smithsonian-voices-votes/traveling-reach",caption:"The traveling exhibition is expected to reach 154 communities in 25 states by the end of 2026.",alt:"Graphic lists 154 communities, 25 states and a tour running since March 2020."}
    ],
    paragraphs:[
      "The Smithsonian's ‘Voices and Votes: Exploring Democracy Across America’ remains on view through Monday, Sept. 7, in the Arts and Industries Building on the National Mall.",
      "The exhibition examines the development of American democracy through sections on the system's origins, voting-rights struggles, campaigns and elections, civic participation and the responsibilities attached to citizenship.",
      "Visitors encounter historical and contemporary photographs, video, multimedia interactives and objects such as campaign materials, voting memorabilia and protest items. The presentation treats democracy as an evolving practice rather than a finished institutional design.",
      "This Washington installation is a special edition of a Smithsonian Museum on Main Street traveling exhibition that began circulating in March 2020. By the end of 2026, the Smithsonian expects the project to have reached 154 communities in 25 states.",
      "That route is part of the exhibition's story. Small-town museums, libraries and cultural organizations developed companion programs about local history and civic engagement, and the Washington show incorporates some of those community voices through films and an interactive map.",
      "The project is based on ‘American Democracy: A Great Leap of Faith,’ an exhibition developed by the National Museum of American History. Its subjects span the American Revolution, suffrage, civil rights and modern voting.",
      "The Smithsonian opened the current presentation June 16 as part of programming around the nation's 250th anniversary. Private philanthropy supported the broader ‘Our Shared Future: 25’ initiative connected to the installation.",
      "The exhibit's Sept. 7 closing date is the useful planning deadline. Individual programs and access conditions can change, so visitors should check the Smithsonian's official listing before traveling.",
      "For readers outside Washington, the traveling network is equally significant: it shows how one national exhibition was adapted into local conversations rather than presented only at a central institution on the National Mall."
    ],
    facts:["The exhibition runs through Sept. 7, 2026.","It is installed in the Smithsonian Arts and Industries Building.","It includes photographs, video, interactives and civic artifacts.","The traveling version began circulating in March 2020.","The Smithsonian expects 154 community stops in 25 states by the end of 2026."],
    uncertainty:["Public-program schedules and building access may change before the closing date.","The Smithsonian announcement does not provide a complete object-by-object checklist."],
    seoTitle:"Smithsonian Voices and Votes exhibit closes Sept. 7",seoDescription:"The Smithsonian's Voices and Votes democracy exhibition runs through Sept. 7 at the Arts and Industries Building in Washington."
  },
  {
    slug:"nasa-genesis-mission-150-petabytes-ai-2026",headline:"NASA Adds 150-Petabyte Mission Archive to Federal Genesis AI Effort",
    dek:"The agency says the initiative will pair decades of space and Earth data with Department of Energy computing to accelerate engineering and scientific discovery.",
    section:"technology",desk:"scientific-ai",topics:["Genesis Mission","NASA data archives","Artificial intelligence","Scientific computing","Space systems engineering"],entities:["NASA","Department of Energy","White House Office of Science and Technology Policy"],locations:["United States"],
    sources:[{id:"source-nasa-genesis-20260722",title:"NASA Joins Genesis Mission to Accelerate AI-Driven Discovery",publisher:"NASA",publishedAt:"2026-07-22T12:00:00Z",url:"https://www.nasa.gov/news-release/nasa-joins-genesis-mission-to-accelerate-ai-driven-discovery/"}],
    lead:{id:"media-nasa-columbia-supercomputer",dir:"nasa-genesis-ai/nasa-supercomputer",sourceUrl:"https://commons.wikimedia.org/wiki/File:Columbia_Supercomputer_-_NASA_Advanced_Supercomputing_Facility.jpg",creator:"Trower / NASA",rightsBasis:"Public domain: work of the U.S. federal government.",license:"Public domain",attribution:"Trower / NASA",caption:"NASA's Columbia supercomputer at the Advanced Supercomputing facility. The agency is joining the federal Genesis Mission AI effort.",alt:"Rows of illuminated computing cabinets inside NASA's Advanced Supercomputing facility.",original:"nasa-columbia.jpg"},
    charts:[
      {id:"media-nasa-genesis-data-scale-2026",dir:"nasa-genesis-ai/data-scale",caption:"NASA says its research and mission archives contain more than 150 petabytes of data.",alt:"Graphic lists more than 150 petabytes, decades of mission archives and links among missions and simulations."},
      {id:"media-nasa-genesis-structure-2026",dir:"nasa-genesis-ai/mission-structure",caption:"Genesis now spans more than 15 agencies, with NASA and DOE combining mission expertise and computing capability.",alt:"Graphic lists more than 15 agencies, NASA and DOE computing, and two priorities: space systems and discovery."}
    ],
    paragraphs:[
      "NASA has joined the federal Genesis Mission, committing its engineering expertise and more than 150 petabytes of scientific and mission data to an effort aimed at accelerating discovery with artificial intelligence.",
      "The White House Office of Science and Technology Policy leads the initiative, which NASA says now involves more than 15 federal agencies. The mission was established by executive order in November 2025.",
      "NASA identified two broad priorities: developing advanced systems for increasingly complex space operations, and finding new scientific value in data collected across decades of telescopes, satellites, orbiters, landers and aeronautics research.",
      "On the engineering side, the agency says AI tools could shorten development cycles for systems that must coordinate spacecraft, communications, logistics and surface operations. NASA plans to combine its mission knowledge with Department of Energy computing and AI capabilities.",
      "On the science side, the central problem is scale. More than 150 petabytes cannot be examined observation by observation with traditional manual methods. Models may help researchers connect missions, instruments, simulations and fields, identify patterns and improve predictions.",
      "The announcement describes a research and coordination program, not a claim that an AI system has already made a specific discovery or taken operational control of a mission. NASA did not publish a project-by-project budget, procurement schedule or benchmark in the release.",
      "That distinction matters for accountability. The value of the effort will depend on documented datasets, reproducible evaluation, model limitations and expert review—not merely on the size of the archive or the use of the AI label.",
      "NASA's archive also contains heterogeneous records created for different missions and instruments. Before systems can connect them reliably, teams must address metadata, calibration, access controls, uncertainty and the risk that a model mistakes an artifact for a scientific signal.",
      "The immediate development is institutional: NASA has formally placed its data and technical capacity inside the Genesis Mission. Measurable outcomes will come later through named tools, published evaluations and discoveries that independent researchers can inspect."
    ],
    facts:["NASA joined the Genesis Mission in July 2026.","NASA says the initiative includes more than 15 federal agencies.","The agency reports more than 150 petabytes of mission and research data.","The White House Office of Science and Technology Policy leads the mission.","NASA plans to work with Department of Energy computing and AI capabilities."],
    uncertainty:["NASA has not published a project-by-project budget or delivery schedule in this announcement.","Potential faster discoveries and engineering gains remain goals that require later validation."],
    seoTitle:"NASA Genesis Mission targets 150 petabytes with AI",seoDescription:"NASA joined the federal Genesis Mission, offering more than 150 petabytes of mission data and engineering expertise for AI research."
  },
  {
    slug:"ifc-first-euro-benchmark-green-bond-1-billion-2026",headline:"IFC’s First Euro Benchmark Green Bond Draws €2.7 Billion Orderbook",
    dek:"The €1 billion seven-year issue carries a 3.125% coupon and broadens the World Bank Group member’s access to European sustainable-finance investors.",
    section:"world",desk:"sustainable-finance",topics:["IFC green bonds","Euro bond market","Sustainable finance","Development finance","Climate investment"],entities:["International Finance Corporation","World Bank Group","Luxembourg Stock Exchange","S&P Global Ratings"],locations:["Europe","London","Luxembourg"],
    sources:[{id:"source-ifc-euro-green-bond-20260708",title:"IFC Launches First-Ever EUR Benchmark with EUR 1 Billion 7-Year Green Bond",publisher:"International Finance Corporation",publishedAt:"2026-07-08T12:00:00Z",url:"https://www.worldbank.org/en/news/press-release/2026/07/08/ifc-launches-first-ever-eur-benchmark-with-eur-1-billion-7-year-green-bond"}],
    lead:{id:"media-ifc-green-bond-wind-mountains",dir:"ifc-green-bond/wind-power",sourceUrl:"https://commons.wikimedia.org/wiki/File:Wind_Power_Mountains_(176164307).jpeg",creator:"Tiago Geraldo",rightsBasis:"Creative Commons Attribution 3.0 Unported.",license:"CC BY 3.0",attribution:"Tiago Geraldo / Wikimedia Commons, CC BY 3.0",caption:"Wind turbines line a mountain ridge. IFC says proceeds from its green bonds support eligible environmental projects in developing markets.",alt:"Wind turbines stretch across a green mountain ridge beneath cloudy sky.",original:"wind-power.jpeg"},
    charts:[
      {id:"media-ifc-green-bond-terms-2026",dir:"ifc-green-bond/bond-terms",caption:"IFC's first euro benchmark is a €1 billion seven-year green bond with a 3.125% coupon.",alt:"Graphic lists one billion euros, seven-year maturity and 3.125 percent coupon."},
      {id:"media-ifc-green-bond-orderbook-2026",dir:"ifc-green-bond/investor-book",caption:"The transaction drew a €2.7 billion orderbook from 56 investors, according to IFC.",alt:"Graphic lists 2.7 billion euro orderbook, 56 investors and 70 percent official institutions."}
    ],
    paragraphs:[
      "The International Finance Corporation has priced its first euro-denominated benchmark bond, a €1 billion seven-year green bond that drew orders totaling €2.7 billion from 56 investors.",
      "IFC, the private-sector development arm of the World Bank Group, set a 3.125% semiannual coupon. The bond was priced at 99.952% for a 3.132% issue yield and is scheduled to mature Aug. 15, 2033.",
      "A benchmark issue is designed to be large and liquid enough to serve as a reference in its market. Entering the euro benchmark market gives IFC another funding channel and a wider European investor base alongside its dollar, Australian-dollar and private-placement programs.",
      "The orderbook was 2.7 times the issued amount. IFC reported that central banks and official institutions received 70% of the allocation, banks and corporate treasuries 17%, and asset managers, insurers and pension funds 13%.",
      "By geography, 69% went to investors in Europe, the Middle East and Africa, 23% to Asia and 8% to the United Kingdom. Barclays, BNP Paribas, Crédit Agricole CIB and TD Securities served as joint lead managers.",
      "The green label does not mean bondholders select individual projects. IFC raises funds under a framework that defines eligible uses and reporting, then allocates proceeds to financing associated with objectives such as climate mitigation, adaptation, biodiversity, water protection and circular-economy activity.",
      "IFC said the issue is its second transaction under an updated green-bond framework published in July 2026. S&P Global Ratings provided a second-party opinion that the framework aligns with the International Capital Market Association's Green Bond Principles.",
      "A second-party opinion reviews the framework, not the future performance of every financed project. Investors still face issuer, interest-rate and market risks, while the environmental outcomes depend on allocation, implementation and later reporting.",
      "The transaction's immediate significance is financial infrastructure: IFC established a euro benchmark curve point and attracted demand well above the final issue size. The development impact must be assessed through the projects and allocation reports that follow."
    ],
    facts:["IFC priced a €1 billion seven-year green bond.","The orderbook reached €2.7 billion from 56 investors.","The coupon is 3.125% paid semiannually.","The maturity date is Aug. 15, 2033.","Central banks and official institutions received 70% of the allocation."],
    uncertainty:["The release does not identify every project that will receive proceeds.","Environmental outcomes depend on future allocation, implementation and reporting."],
    seoTitle:"IFC €1B euro green bond draws €2.7B demand",seoDescription:"IFC priced its first euro benchmark, a €1 billion seven-year green bond with a 3.125% coupon and €2.7 billion orderbook."
  },
  {
    slug:"doe-65-5-million-oil-gas-technology-funding-2026",headline:"DOE Opens $65.5 Million Oil and Gas Technology Funding Through Sept. 22",
    dek:"The cost-shared program targets stranded resources, infrastructure reliability and digital systems for upstream and midstream operations.",
    section:"business",desk:"energy-innovation",topics:["Oil and gas technology","Energy infrastructure","DOE funding","Industrial digitalization","Stranded gas"],entities:["U.S. Department of Energy","Hydrocarbons and Geothermal Energy Office","National Energy Technology Laboratory"],locations:["United States"],
    sources:[
      {id:"source-doe-oil-gas-65m-20260723",title:"Energy Department Announces Up to $65.5 Million to Advance Domestic Oil and Natural Gas Production and Delivery",publisher:"U.S. Department of Energy",publishedAt:"2026-07-23T12:00:00Z",url:"https://www.energy.gov/articles/energy-department-announces-655-million-advance-domestic-oil-and-natural-gas-production"},
      {id:"source-doe-hgeo-open-opportunities-20260723",title:"HGEO Solicitations and Business Opportunities",publisher:"U.S. Department of Energy",publishedAt:"2026-07-23T12:00:00Z",url:"https://www.energy.gov/hgeo/hgeo-solicitations-and-business-opportunities"}
    ],
    lead:{id:"media-doe-sunniland-pumpjack",dir:"doe-oil-gas-funding/pumpjack",sourceUrl:"https://commons.wikimedia.org/wiki/File:Sunniland_Oil_Field_preserved_pumpjack.jpg",creator:"Declan M. Martin",rightsBasis:"Public-domain dedication recorded by Wikimedia Commons.",license:"Public domain",attribution:"Declan M. Martin / Wikimedia Commons",caption:"A preserved pumpjack at Florida's Sunniland Oil Field. DOE's open funding notice targets oil and gas production and delivery technologies.",alt:"Preserved black pumpjack stands beside a roadway under a bright sky.",original:"pumpjack.jpg"},
    charts:[
      {id:"media-doe-65m-funding-window-2026",dir:"doe-oil-gas-funding/funding-window",caption:"DOE lists up to $65.5 million and a Sept. 22 application deadline for the open funding notice.",alt:"Graphic lists up to 65.5 million dollars, applications due September 22 and cost sharing required."},
      {id:"media-doe-65m-topic-areas-2026",dir:"doe-oil-gas-funding/topic-areas",caption:"The notice groups work into resource use, infrastructure reliability and digital operations.",alt:"Graphic lists using stranded resources, strengthening infrastructure and digitalizing operations."}
    ],
    paragraphs:[
      "The U.S. Department of Energy has opened a cost-shared funding opportunity of up to $65.5 million for technologies intended to improve domestic oil and natural gas production, delivery infrastructure and operational efficiency.",
      "Applications for notice DE-FOA-0003634 are due Sept. 22, 2026, at 5 p.m. Eastern, according to DOE's announcement and open-opportunities page. Applicants must follow the full notice for eligibility, cost-share and submission requirements.",
      "DOE divided the opportunity into three broad tracks. The first covers ways to convert stranded, flared or contaminant-limited oil and gas streams into products that can be transported and sold.",
      "The second focuses on infrastructure durability and reliability, including compressors, valves, piping, tanks, coatings, alloys and other components intended to reduce product losses and strengthen delivery systems.",
      "The third covers digital operations and full-scale test sites. DOE lists continuous monitoring, AI-supported digital twins and infrastructure-optimization systems among the possible technologies for upstream and midstream facilities.",
      "A funding notice is an invitation to compete, not an award. The $65.5 million figure is a maximum program amount, and the announcement does not establish which applicants, sites or technologies will ultimately receive money.",
      "Cost sharing means federal funds will not necessarily cover the entire project. Applicants need to use the official notice to determine the required share for their topic and whether proposed expenses are eligible.",
      "DOE framed the program around production, reliability and reduced waste. Those goals can pull in different directions, so later selections should be evaluated against measurable outcomes such as product loss, equipment performance, monitoring accuracy and operating cost—not promotional claims alone.",
      "The near-term accountability point is the Sept. 22 deadline. The later points will be the selected projects, federal and nonfederal contributions, test conditions and public evidence that a technology performed as proposed."
    ],
    facts:["DOE announced up to $65.5 million in cost-shared funding.","Applications are due Sept. 22, 2026, at 5 p.m. ET.","The notice identifier is DE-FOA-0003634.","The program has tracks for underused resources, infrastructure reliability and digital operations.","DOE lists AI-supported digital twins among potential technologies."],
    uncertainty:["No awardees or project sites were named in the opening announcement.","The final number and size of awards depend on applications, review and negotiations."],
    seoTitle:"DOE $65.5M oil and gas funding deadline Sept. 22",seoDescription:"DOE opened up to $65.5 million for oil and gas technology projects; applications under DE-FOA-0003634 are due Sept. 22."
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
for(const def of articleDefs){if(existingSlugs.has(def.slug))throw new Error(`Duplicate slug: ${def.slug}`);if(existingRights.has(def.lead.id))throw new Error(`Duplicate rights ID: ${def.lead.id}`);}
const newArticles=articleDefs.map(article);
const newRights=articleDefs.flatMap((def)=>[rights(def.lead),...def.charts.map((chart)=>graphic({...chart,sourceUrl:def.sources[0].url}))]);
promotion.articles.push(...newArticles);promotion.mediaRights.push(...newRights);
promotion.compilerVersion="bohonews-manual-maintenance-installer.v1.0.0";promotion.generatedAt="2026-08-10T05:05:00Z";promotion.releaseState="candidate";
promotion.inventory={articleCount:promotion.articles.length,routeCount:promotion.articles.length,mediaCount:promotion.mediaRights.length};
promotion.inputHashes={sourceItems:digest(articleDefs.map(({sources})=>sources)),events:digest(articleDefs.map(({slug})=>`event-${slug}`)),claims:digest(articleDefs.map(({facts})=>facts)),articles:digest(newArticles),approvals:digest({mode:"owner-authorized-maintenance",date:"2026-08-09"}),corrections:digest([]),mediaRights:digest(newRights),releaseRecords:digest(promotion.releaseRecords),publicationIntents:digest(articleDefs.map(({slug})=>({slug,intent:"manual-maintenance-release"})))};
delete promotion.packageDigest;promotion.packageDigest=digest(promotion);
const release={schemaVersion:promotion.schemaVersion,compilerVersion:promotion.compilerVersion,generatedAt:promotion.generatedAt,packageDigest:promotion.packageDigest,articleCount:promotion.inventory.articleCount,mediaCount:promotion.inventory.mediaCount,routes:promotion.articles.map(({canonicalUrl})=>new URL(canonicalUrl).pathname),releaseRecords:promotion.releaseRecords,releaseState:promotion.releaseState};
writeFileSync(promotionPath,`${JSON.stringify(promotion,null,2)}\n`);writeFileSync(releasePath,`${JSON.stringify(release,null,2)}\n`);
console.log(JSON.stringify({newArticles:newArticles.map(({headline,slug,section,desk})=>({headline,slug,section,desk})),packageDigest:promotion.packageDigest,articleCount:promotion.inventory.articleCount,mediaCount:promotion.inventory.mediaCount},null,2));
