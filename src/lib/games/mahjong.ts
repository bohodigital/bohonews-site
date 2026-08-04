export interface MahjongPosition { id:string; x:number; y:number; z:number; }
export interface MahjongTile extends MahjongPosition { face:string; group:string; label:string; removed:boolean; }
export interface MahjongGame { schemaVersion:2; seed:number; tiles:MahjongTile[]; history:[string,string][]; solution:[string,string][]; complete:boolean; }

interface Face { face:string; group:string; label:string; }

const REGULAR_LABELS = [
  "East wind","South wind","West wind","North wind","Red dragon","Green dragon","White dragon",
  ...Array.from({length:9},(_,index)=>`${index+1} character`),
  ...Array.from({length:9},(_,index)=>`${index+1} bamboo`),
  ...Array.from({length:9},(_,index)=>`${index+1} circle`)
];
const REGULAR_CODEPOINTS = Array.from({length:34},(_,index)=>0x1f000+index);
const FLOWER_CODEPOINTS = Array.from({length:4},(_,index)=>0x1f022+index);
const SEASON_CODEPOINTS = Array.from({length:4},(_,index)=>0x1f026+index);

function rng(seed:number):()=>number {
  let value=seed>>>0||0x6d2b79f5;
  return ()=>{value+=0x6d2b79f5;let result=value;result=Math.imul(result^result>>>15,result|1);result^=result+Math.imul(result^result>>>7,result|61);return((result^result>>>14)>>>0)/4294967296;};
}

function shuffle<T>(values:T[],random:()=>number):T[] {
  const result=[...values];
  for(let index=result.length-1;index>0;index--){const target=Math.floor(random()*(index+1));[result[index],result[target]]=[result[target],result[index]];}
  return result;
}

export function mahjongSeed(value:string|number):number {
  if(typeof value==="number"&&Number.isInteger(value))return value>>>0;
  let hash=2166136261;
  for(const character of String(value)){hash^=character.codePointAt(0)||0;hash=Math.imul(hash,16777619);}
  return hash>>>0;
}

function buildTurtleLayout():MahjongPosition[] {
  const positions:MahjongPosition[]=[];const add=(z:number,x:number,y:number)=>positions.push({id:`${z}-${x}-${y}`,z,x,y});const row=(z:number,y:number,start:number,count:number)=>{for(let index=0;index<count;index++)add(z,start+index*2,y);};
  row(0,0,2,12);row(0,2,6,8);row(0,4,4,10);row(0,6,2,12);add(0,0,7);row(0,7,26,2);row(0,8,2,12);row(0,10,4,10);row(0,12,6,8);row(0,14,2,12);
  for(const y of [2,4,6,8,10,12])row(1,y,8,6);
  for(const y of [4,6,8,10])row(2,y,10,4);
  for(const y of [6,8])row(3,y,12,2);
  add(4,13,7);
  return positions;
}

const TURTLE_LAYOUT=buildTurtleLayout();
const TURTLE_RULES=new Map(TURTLE_LAYOUT.map((position)=>{
  const overlaps=(firstStart:number,secondStart:number)=>firstStart<secondStart+2&&secondStart<firstStart+2;
  return [position.id,{
    above:TURTLE_LAYOUT.filter((candidate)=>candidate.z>position.z&&overlaps(position.x,candidate.x)&&overlaps(position.y,candidate.y)).map(({id})=>id),
    left:TURTLE_LAYOUT.filter((candidate)=>candidate.z===position.z&&candidate.x+2===position.x&&overlaps(position.y,candidate.y)).map(({id})=>id),
    right:TURTLE_LAYOUT.filter((candidate)=>candidate.z===position.z&&candidate.x===position.x+2&&overlaps(position.y,candidate.y)).map(({id})=>id)
  }] as const;
}));

export function turtleLayout():MahjongPosition[] {
  return TURTLE_LAYOUT.map((position)=>({...position}));
}

function freePosition(position:MahjongPosition,active:Set<string>):boolean {
  if(!active.has(position.id))return false;
  const rules=TURTLE_RULES.get(position.id)!;
  const covered=rules.above.some((id)=>active.has(id));
  const leftBlocked=rules.left.some((id)=>active.has(id));
  const rightBlocked=rules.right.some((id)=>active.has(id));
  return !covered&&(!leftBlocked||!rightBlocked);
}

function tilePairs():[Face,Face][] {
  const pairs:[Face,Face][]=[];
  REGULAR_CODEPOINTS.forEach((codepoint,index)=>{
    const face={face:String.fromCodePoint(codepoint),group:`regular-${index}`,label:REGULAR_LABELS[index]};
    pairs.push([face,face],[face,face]);
  });
  const flowers=FLOWER_CODEPOINTS.map((codepoint,index)=>({face:String.fromCodePoint(codepoint),group:"flowers",label:["Plum flower","Orchid flower","Bamboo flower","Chrysanthemum flower"][index]}));
  const seasons=SEASON_CODEPOINTS.map((codepoint,index)=>({face:String.fromCodePoint(codepoint),group:"seasons",label:["Spring season","Summer season","Autumn season","Winter season"][index]}));
  pairs.push([flowers[0],flowers[1]],[flowers[2],flowers[3]],[seasons[0],seasons[1]],[seasons[2],seasons[3]]);
  return pairs;
}

export function createMahjongGame(seedValue:string|number):MahjongGame {
  const seed=mahjongSeed(seedValue);const positions=turtleLayout();let assignments:Map<string,Face>|null=null;let solution:[string,string][]=[];
  for(let attempt=0;attempt<2000&&!assignments;attempt++){
    const random=rng((seed+Math.imul(attempt,0x9e3779b1))>>>0);const active=new Set(positions.map(({id})=>id));const candidateAssignments=new Map<string,Face>();const candidateSolution:[string,string][]=[];let failed=false;
    for(const pair of shuffle(tilePairs(),random)){
      const free=positions.filter((position)=>freePosition(position,active));
      if(free.length<2){failed=true;break;}
      const first=free.splice(Math.floor(random()*free.length),1)[0];const second=free[Math.floor(random()*free.length)];
      candidateAssignments.set(first.id,pair[0]);candidateAssignments.set(second.id,pair[1]);candidateSolution.push([first.id,second.id]);active.delete(first.id);active.delete(second.id);
    }
    if(!failed){assignments=candidateAssignments;solution=candidateSolution;}
  }
  if(!assignments)throw new Error("Turtle layout could not produce a solvable deal");
  const tiles=positions.map((position)=>({...position,...assignments.get(position.id)!,removed:false}));
  return {schemaVersion:2,seed,tiles,history:[],solution,complete:false};
}

export function freeMahjongTileIds(game:MahjongGame):string[] {
  const active=new Set(game.tiles.filter((tile)=>!tile.removed).map(({id})=>id));
  return TURTLE_LAYOUT.filter((position)=>freePosition(position,active)).map(({id})=>id);
}

export function availableMahjongPairs(game:MahjongGame):[string,string][] {
  const free=new Set(freeMahjongTileIds(game));const groups=new Map<string,string[]>();const pairs:[string,string][]=[];
  game.tiles.filter((tile)=>free.has(tile.id)).forEach((tile)=>groups.set(tile.group,[...(groups.get(tile.group)||[]),tile.id]));
  groups.forEach((ids)=>{for(let first=0;first<ids.length-1;first++)for(let second=first+1;second<ids.length;second++)pairs.push([ids[first],ids[second]]);});
  return pairs;
}

export function isMahjongDeadlocked(game:MahjongGame):boolean {
  return !game.complete&&availableMahjongPairs(game).length===0;
}

export function mahjongHint(game:MahjongGame):[string,string]|null {
  const free=new Set(freeMahjongTileIds(game));
  const planned=game.solution.find(([first,second])=>free.has(first)&&free.has(second));if(planned)return planned;
  return availableMahjongPairs(game)[0]||null;
}

export function removeMahjongPair(game:MahjongGame,firstId:string,secondId:string):boolean {
  if(firstId===secondId||game.complete)return false;
  const free=new Set(freeMahjongTileIds(game));const first=game.tiles.find(({id})=>id===firstId);const second=game.tiles.find(({id})=>id===secondId);
  if(!first||!second||!free.has(firstId)||!free.has(secondId)||first.group!==second.group)return false;
  first.removed=true;second.removed=true;game.history.push([firstId,secondId]);game.complete=game.tiles.every(({removed})=>removed);return true;
}

export function undoMahjongPair(game:MahjongGame):boolean {
  const pair=game.history.pop();if(!pair)return false;
  pair.forEach((id)=>{const tile=game.tiles.find((candidate)=>candidate.id===id);if(tile)tile.removed=false;});game.complete=false;return true;
}

export function restoreMahjongGame(seed:number,history:unknown):MahjongGame|null {
  if(!Number.isInteger(seed)||seed<0||seed>0xffffffff||!Array.isArray(history)||history.length>72)return null;
  const game=createMahjongGame(seed);
  for(const pair of history){
    if(!Array.isArray(pair)||pair.length!==2||typeof pair[0]!=="string"||typeof pair[1]!=="string"||!removeMahjongPair(game,pair[0],pair[1]))return null;
  }
  return game;
}

export function isValidMahjongGame(value:unknown):value is MahjongGame {
  if(!value||typeof value!=="object"||Array.isArray(value))return false;const game=value as MahjongGame;const layout=turtleLayout();const expected=new Set(layout.map(({id})=>id));
  if(game.schemaVersion!==2||!Number.isInteger(game.seed)||game.seed<0||game.seed>0xffffffff||!Array.isArray(game.tiles)||game.tiles.length!==144||!Array.isArray(game.history)||game.history.length>72||!Array.isArray(game.solution)||game.solution.length!==72||typeof game.complete!=="boolean")return false;
  const ids=new Set(game.tiles.map(({id})=>id));if(ids.size!==144||[...ids].some((id)=>!expected.has(id)))return false;
  if(game.tiles.some((tile)=>typeof tile.face!=="string"||typeof tile.group!=="string"||typeof tile.label!=="string"||typeof tile.removed!=="boolean"||!Number.isInteger(tile.x)||!Number.isInteger(tile.y)||!Number.isInteger(tile.z)))return false;
  if(game.history.some((pair)=>!Array.isArray(pair)||pair.length!==2||pair.some((id)=>!ids.has(id)))||new Set(game.history.flat()).size!==game.history.flat().length)return false;
  if(game.solution.some((pair)=>!Array.isArray(pair)||pair.length!==2||pair.some((id)=>!ids.has(id)))||new Set(game.solution.flat()).size!==144)return false;
  const canonical=createMahjongGame(game.seed);const canonicalById=new Map(canonical.tiles.map((tile)=>[tile.id,tile]));
  if(game.tiles.some((tile)=>{const original=canonicalById.get(tile.id);return !original||tile.x!==original.x||tile.y!==original.y||tile.z!==original.z||tile.face!==original.face||tile.group!==original.group||tile.label!==original.label;}))return false;
  if(game.solution.some((pair,index)=>pair[0]!==canonical.solution[index][0]||pair[1]!==canonical.solution[index][1]))return false;
  for(const pair of game.history)if(!removeMahjongPair(canonical,pair[0],pair[1]))return false;
  if(game.tiles.some((tile)=>tile.removed!==canonicalById.get(tile.id)!.removed))return false;
  return game.complete===canonical.complete;
}
