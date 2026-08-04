export interface ConnectionGroup {
  id: string;
  label: string;
  level: 0 | 1 | 2 | 3;
  terms: [string, string, string, string];
}

export interface ConnectionsPuzzle {
  id: string;
  groups: [ConnectionGroup, ConnectionGroup, ConnectionGroup, ConnectionGroup];
}

const group = (id: string, label: string, level: 0 | 1 | 2 | 3, terms: [string,string,string,string]): ConnectionGroup => ({id,label,level,terms});

export const CONNECTIONS_PUZZLES: ConnectionsPuzzle[] = [
  {id:"boho-001",groups:[
    group("keys","Keyboard keys",0,["Escape","Option","Return","Shift"]),
    group("cartoon-dogs","Cartoon dogs",1,["Odie","Pluto","Scooby","Snoopy"]),
    group("hesitation","Sounds of hesitation",2,["Erm","Hmm","Uh","Um"]),
    group("house","___ HOUSE",3,["Club","Coffee","Green","Light"])
  ]},
  {id:"boho-002",groups:[
    group("pasta","Pasta shapes",0,["Fusilli","Orzo","Penne","Rigatoni"]),
    group("bird-names","Names that are birds",1,["Jay","Raven","Robin","Wren"]),
    group("nba","NBA teams without their cities",2,["Heat","Jazz","Magic","Thunder"]),
    group("roll","___ roll",3,["Bank","Egg","Honor","Rick"])
  ]},
  {id:"boho-003",groups:[
    group("poker","Poker actions",0,["Call","Check","Fold","Raise"]),
    group("apples","Apple varieties",1,["Fuji","Gala","Jazz","Pink Lady"]),
    group("laughs","Online laughter",2,["Hehe","LMAO","LOL","ROFL"]),
    group("space","Space ___",3,["Bar","Cadet","Heater","Jam"])
  ]},
  {id:"boho-004",groups:[
    group("green","Shades of green",0,["Emerald","Lime","Mint","Olive"]),
    group("classes","Fantasy role-playing classes",1,["Bard","Cleric","Druid","Rogue"]),
    group("code","___ code",2,["Area","Dress","Honor","Source"]),
    group("mouse","Paired with “mouse”",3,["Computer","Field","House","Mickey"])
  ]},
  {id:"boho-005",groups:[
    group("browser","Browser actions",0,["Bookmark","Refresh","Scroll","Zoom"]),
    group("avenues","Famous Manhattan avenues",1,["Fifth","Lexington","Madison","Park"]),
    group("robots","Fictional robots",2,["Bender","Data","R2-D2","WALL-E"]),
    group("cat","___ CAT",3,["Copy","Hell","Tom","Wild"])
  ]},
  {id:"boho-006",groups:[
    group("awards","Entertainment awards",0,["Emmy","Grammy","Oscar","Tony"]),
    group("arcade","Classic arcade games",1,["Frogger","Galaga","Pong","Q*bert"]),
    group("letter-names","Names pronounced like letters",2,["Bea","Elle","Jay","Kay"]),
    group("deep","Deep ___",3,["Dish","Fake","Freeze","Space"])
  ]},
  {id:"boho-007",groups:[
    group("sandwiches","Sandwiches",0,["Club","Cubano","Hero","Reuben"]),
    group("formatting","Text formatting",1,["Bold","Italic","Strikethrough","Underline"]),
    group("moon","Types of full moon names",2,["Blood","Blue","Harvest","Honey"]),
    group("one-name","One-word music acts",3,["Beck","Lorde","Seal","Sting"])
  ]},
  {id:"boho-008",groups:[
    group("sections","Newspaper sections",0,["Business","Culture","Opinion","Sports"]),
    group("rings","Things with rings",1,["Onion","Phone","Saturn","Tree"]),
    group("weather","Weather-map features",2,["Front","Isobar","Pressure","Radar"]),
    group("breaking","Breaking ___",3,["Bad","News","Point","Wave"])
  ]},
  {id:"boho-009",groups:[
    group("chess","Chess pieces",0,["Bishop","Knight","Queen","Rook"]),
    group("type","Typography terms",1,["Kerning","Leading","Ligature","Serif"]),
    group("vampires","Vampire deterrents",2,["Cross","Garlic","Stake","Sunlight"]),
    group("night","Night ___",3,["Court","Light","Owl","Shift"])
  ]},
  {id:"boho-010",groups:[
    group("sushi","At a sushi counter",0,["Maki","Nigiri","Nori","Wasabi"]),
    group("mario","Mario power-ups",1,["Flower","Leaf","Mushroom","Star"]),
    group("paper","Paper ___",2,["Clip","Plane","Tiger","Trail"]),
    group("color-bands","First word of a color-named band",3,["Black","Green","Pink","White"])
  ]},
  {id:"boho-011",groups:[
    group("files","File extensions",0,["CSV","JPG","PDF","ZIP"]),
    group("verb-names","Names that are also verbs",1,["Chase","Grant","Hope","Mark"]),
    group("crowns","Things with crowns",2,["King","Pineapple","Statue of Liberty","Tooth"]),
    group("jam","___ jam",3,["Pearl","Space","Toe","Traffic"])
  ]},
  {id:"boho-012",groups:[
    group("greek","Greek letters",0,["Alpha","Delta","Omega","Sigma"]),
    group("approval","Slang approval",1,["Based","Bet","Fire","Valid"]),
    group("locked","Things that can be locked",2,["Door","File","Jaw","Target"]),
    group("mode","___ mode",3,["Airplane","Beast","Dark","Incognito"])
  ]}
];

export function validateConnectionsPuzzle(puzzle: ConnectionsPuzzle): boolean {
  if (!puzzle || typeof puzzle.id !== "string" || puzzle.groups?.length !== 4) return false;
  const levels = new Set<number>();
  const terms = new Set<string>();
  for (const candidate of puzzle.groups) {
    if (!candidate.id || !candidate.label || candidate.terms?.length !== 4 || !Number.isInteger(candidate.level) || candidate.level < 0 || candidate.level > 3) return false;
    levels.add(candidate.level);
    for (const term of candidate.terms) {
      const normalized = term.trim().toLocaleLowerCase("en-US");
      if (!normalized || terms.has(normalized)) return false;
      terms.add(normalized);
    }
  }
  return levels.size === 4 && terms.size === 16;
}

export function connectionsTerms(puzzle: ConnectionsPuzzle): string[] {
  return puzzle.groups.flatMap((candidate) => candidate.terms);
}

export function shuffleConnections<T>(items: readonly T[], seed: number): T[] {
  const shuffled = [...items];
  let value = (seed >>> 0) || 0x9e3779b9;
  const random = () => { value ^= value << 13; value ^= value >>> 17; value ^= value << 5; return (value >>> 0) / 4294967296; };
  for (let index = shuffled.length - 1; index > 0; index--) {
    const swap = Math.floor(random() * (index + 1));
    [shuffled[index],shuffled[swap]] = [shuffled[swap],shuffled[index]];
  }
  return shuffled;
}

export function evaluateConnection(puzzle: ConnectionsPuzzle, selected: readonly string[], solvedIds: readonly string[] = []): { group: ConnectionGroup | null; oneAway: boolean } {
  const normalized = new Set(selected.map((term) => term.toLocaleLowerCase("en-US")));
  if (normalized.size !== 4) return {group:null,oneAway:false};
  let oneAway = false;
  for (const candidate of puzzle.groups) {
    if (solvedIds.includes(candidate.id)) continue;
    const matches = candidate.terms.filter((term) => normalized.has(term.toLocaleLowerCase("en-US"))).length;
    if (matches === 4) return {group:candidate,oneAway:false};
    if (matches === 3) oneAway = true;
  }
  return {group:null,oneAway};
}

if (!CONNECTIONS_PUZZLES.every(validateConnectionsPuzzle)) throw new Error("Invalid Connections puzzle pack");
