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

const CURATED_CONNECTIONS_PUZZLES: ConnectionsPuzzle[] = [
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

const EXTRA_GROUPS: ConnectionGroup[] = [
  group("breakfast","Breakfast foods",0,["Cereal","Omelet","Pancakes","Waffles"]),
  group("planets","Planets",0,["Earth","Mars","Saturn","Venus"]),
  group("dog-breeds","Dog breeds",0,["Beagle","Husky","Poodle","Pug"]),
  group("board-games","Classic board games",0,["Clue","Risk","Scrabble","Sorry"]),
  group("garden-tools","Garden tools",0,["Hoe","Rake","Shovel","Trowel"]),
  group("coffee-drinks","Coffee drinks",0,["Americano","Cappuccino","Espresso","Latte"]),
  group("denim","Denim garments",0,["Jacket","Jeans","Overalls","Shorts"]),
  group("websites","Top-level domains, without the dot",0,["Com","Edu","Gov","Org"]),
  group("counting","First four counting numbers",0,["One","Two","Three","Four"]),
  group("winter","Winter weather",0,["Blizzard","Frost","Sleet","Snow"]),
  group("tools","Workshop tools",0,["Drill","Hammer","Level","Saw"]),
  group("cocktails","Classic cocktails",0,["Daiquiri","Manhattan","Martini","Negroni"]),

  group("detectives","Fictional detectives",1,["Columbo","Holmes","Marlowe","Poirot"]),
  group("hot-sauces","Hot sauces",1,["Cholula","Frank's","Sriracha","Tabasco"]),
  group("dances","Partner dances",1,["Foxtrot","Salsa","Tango","Waltz"]),
  group("muppets","Muppets",1,["Animal","Fozzie","Gonzo","Kermit"]),
  group("capitals","European capitals",1,["Berlin","Lisbon","Oslo","Rome"]),
  group("fonts","Common typefaces",1,["Arial","Futura","Georgia","Helvetica"]),
  group("myth-creatures","Mythical creatures",1,["Dragon","Griffin","Kraken","Phoenix"]),
  group("sneakers","Sneaker brands",1,["Adidas","Converse","Nike","Vans"]),
  group("fictional-rich","Fictional fabulously rich people",1,["Bruce Wayne","Gatsby","Scrooge McDuck","Tony Stark"]),
  group("cheeses","Italian cheeses",1,["Asiago","Burrata","Parmesan","Ricotta"]),
  group("sitcom-bars","TV hangouts",1,["Central Perk","Cheers","MacLaren's","Moe's"]),
  group("albums","Albums with one-word titles",1,["Lemonade","Purple","Rumours","Thriller"]),

  group("silent-first","Words with a silent first letter",2,["Gnome","Knee","Pseudonym","Wrinkle"]),
  group("palindromes","Palindromes",2,["Civic","Kayak","Level","Radar"]),
  group("keyboard-rows","Typed with the top keyboard row",2,["Pepper","Poetry","Quiet","Typewriter"]),
  group("double-letters","Words with double letters",2,["Coffee","Jazz","Knee","Puzzle"]),
  group("chemical-symbols","Start with chemical symbols",2,["Carbon","Neon","Silver","Tin"]),
  group("monopoly","Monopoly board spaces",2,["Chance","Jail","Railroad","Utility"]),
  group("tiny-things","Proverbially tiny things",2,["Atom","Grain","Iota","Speck"]),
  group("sound-words","Sound-effect words",2,["Bang","Hiss","Pop","Thud"]),
  group("hidden-numbers","Contain ONE or FOUR in order",2,["Alone","Before","Stone","Wonder"]),
  group("anagrams-listen","Anagrams of LISTEN",2,["Enlist","Inlets","Silent","Tinsel"]),
  group("punctuation-names","Punctuation nicknames",2,["Bang","Hash","Period","Slash"]),
  group("screen-actions","Things done to a screen",2,["Capture","Lock","Share","Split"]),

  group("party","Party ___",3,["Animal","Favor","Line","Pooper"]),
  group("black","Black ___",3,["Berry","Bird","Jack","Mail"]),
  group("head","Head ___",3,["Band","Honcho","Lights","Start"]),
  group("hot","Hot ___",3,["Dog","Mess","Rod","Take"]),
  group("blue-blank","Blue ___",3,["Blood","Chip","Jeans","Whale"]),
  group("ghost","Ghost ___",3,["Buster","Story","Town","Writer"]),
  group("game","Game ___",3,["Boy","Changer","Plan","Show"]),
  group("high","High ___",3,["Five","Noon","Rise","Score"]),
  group("golden","Golden ___",3,["Gate","Girls","Rule","State"]),
  group("street","Street ___",3,["Art","Cred","Food","Smart"]),
  group("power","Power ___",3,["Ballad","Move","Plant","Trip"]),
  group("star-blank","Star ___",3,["Dust","Fish","Gazer","Power"])
];

export const CONNECTION_GROUPS = [...CURATED_CONNECTIONS_PUZZLES.flatMap(({groups})=>groups),...EXTRA_GROUPS];

function generatedConnectionsPuzzles(count: number): ConnectionsPuzzle[] {
  const byLevel=([0,1,2,3] as const).map((level)=>CONNECTION_GROUPS.filter((candidate)=>candidate.level===level));
  const puzzles=[...CURATED_CONNECTIONS_PUZZLES];
  const fingerprints=new Set(puzzles.map((puzzle)=>puzzle.groups.map(({id})=>id).join("|")));
  let seed=0x626f686f;
  const random=()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return seed>>>0;};
  for(let attempts=0;puzzles.length<count&&attempts<100000;attempts++){
    const groups=byLevel.map((choices)=>choices[random()%choices.length]) as ConnectionsPuzzle["groups"];
    const fingerprint=groups.map(({id})=>id).join("|");
    const candidate={id:`boho-${String(puzzles.length+1).padStart(3,"0")}`,groups};
    if(fingerprints.has(fingerprint)||!validateConnectionsPuzzle(candidate))continue;
    fingerprints.add(fingerprint);puzzles.push(candidate);
  }
  if(puzzles.length!==count)throw new Error(`Could only assemble ${puzzles.length} Connections puzzles`);
  return puzzles;
}

export const CONNECTIONS_PUZZLES: ConnectionsPuzzle[] = generatedConnectionsPuzzles(730);

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
