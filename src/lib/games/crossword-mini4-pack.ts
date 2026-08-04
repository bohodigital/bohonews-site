import { createMini4Puzzle } from "./crossword-mini4.ts";
import { GENERATED_MINI4_CLUES, GENERATED_MINI4_FILLS } from "./crossword-mini4-generated.ts";

const CURATED_MINI4_CLUES: Record<string,string> = {
  able:"Ready to crush it", acid:"What gives a lemon its bite", acre:"A lot measuring 43,560 square feet", acts:"What a theater kid does", adds:"Does a little calculator work",
  ages:"What a painfully slow download takes", also:"Word meaning 'and another thing'", andy:"Warhol or Samberg", anti:"Prefix for the opposition", area:"What pi times radius squared finds", arya:"Stark who trained with the Faceless Men",
  arms:"Things raised on a roller coaster", avid:"Hard-core, as a fan", been:"Past participle of be", bent:"Not exactly straight", blew:"Sent out a gust",
  blue:"Word before moon or cheese", cape:"Superhero's dramatic laundry", care:"Concern or attention", cash:"What a 'card only' sign refuses", cast:"Actors in a production",
  clay:"Potter's favorite mess", club:"Sandwich with a membership problem", coat:"Outer garment", code:"What programmers write and spies crack", cozy:"Vibe of a blanket-and-tea night",
  cost:"Number that can ruin a good idea", crew:"Working team", date:"Romantic outing or calendar square", deal:"What a card player hands", dope:"Slang for excellent — or an idiot", dost:"Old-timey word in 'thou ___ protest too much'",
  deep:"Like thoughts at 2 a.m., supposedly", desk:"Home base for unfinished coffee", done:"What the timer says your fries are", drum:"Instrument beloved by upstairs neighbors",
  ease:"Lack of difficulty", ebay:"Site where a bidding war might erupt", echo:"A mountain's unoriginal reply", edge:"Advantage, or a cliff's bad side", else:"Word after 'anything'",
  ends:"Finishes", eton:"English school attended by many prime ministers", even:"Like 2, 4, and a settled score", eyre:"Jane of a Brontë novel", eyed:"Looked at closely", fast:"Moving quickly",
  fire:"Emoji for an absolute banger", flew:"Traveled through the air", flow:"Move in a steady stream", folk:"Genre where a banjo feels at home",
  ghee:"Clarified butter in a curry kitchen", glad:"Happy, in four letters", grow:"Increase in size", halo:"Xbox series starring Master Chief", hela:"Thor's big sister in the MCU", hide:"Keep out of sight", hire:"Employ for pay",
  hope:"The thing left in Pandora's box", iron:"Metal used to make steel", into:"Toward the inside", idea:"Cartoon lightbulb moment",
  idle:"Running but going nowhere, as an engine", knee:"Joint with a silent first letter", knew:"Had the tea already", land:"Ground, as opposed to water", lend:"Let a friend borrow",
  lane:"Narrow road or marked traffic strip", last:"Opposite of first — and what leftovers may not", late:"After the expected time", laws:"Rules enacted by authority", line:"An actor's bit to memorize", lmao:"Texter's stronger LOL", lyme:"Tick-borne disease",
  lean:"Tilt to one side", legs:"Lower limbs", less:"A smaller amount", limb:"Arm or leg",
  live:"On air, with no do-over", lock:"Fasten securely", lose:"Fail to keep", lots:"A great many", love:"Deep affection", made:"Created", male:"Not female", maya:"Angelou or Rudolph", mess:"Room after a toddler tornado", moab:"Utah adventure town",
  near:"Close by", neat:"Tidy", need:"Require", nero:"Emperor blamed for Rome's great fire", nest:"Bird's home",
  news:"What Boho serves fresh", none:"Amount of chill a toddler has", odds:"What a bettor checks", ogre:"Shrek, for one", okay:"Text-back that can feel ominous with a period", ones:"Bills for a vending-machine struggle",
  only:"First word in a Hulu mystery-comedy title", onto:"Aware of someone's scheme", open:"What a 24/7 sign promises", oral:"Spoken, not typed", oven:"Hot box for cookies", owns:"Has the deed to",
  page:"One side of a sheet", paul:"McCartney or Mescal", plan:"Thing that rarely survives the group chat", plot:"Story or garden patch", plus:"Tiny cross in arithmetic",
  race:"Contest of speed", rage:"Anger — or an all-night party", rare:"Steak order with a cool red center", rate:"Speed or charge",
  rent:"Monthly jump scare", rest:"What your alarm clock opposes", rise:"Move upward", rode:"Traveled on a bike or horse",
  roll:"Sushi order or camera command", safe:"Where a movie villain keeps diamonds", scan:"QR-code action", seat:"What you hope the subway has",
  seed:"Tiny plant starter pack", seen:"Spotted", send:"Cause to go", sent:"Caused to go",
  shoe:"Cinderella's crucial clue", show:"Put on display", snow:"Weather that cancels school, ideally", sold:"Exchanged for money",
  span:"Extend across", spot:"Dog name or tiny stain", star:"Celebrity or giant plasma sphere", stem:"Plant stalk",
  step:"Single movement of the foot", stop:"A red octagon's whole speech", tale:"Story", tape:"Sticky fixer of questionable permanence", tear:"Drop from the eye",
  test:"Student's least favorite four-letter word", that:"The farther of two things", then:"At that time", thin:"Not thick",
  this:"The nearer of two things", thus:"In this way", tide:"Moon-pulled ocean movement", till:"Up to the time that",
  time:"What flies during fun", tips:"Advice or money left after dinner", tone:"Vibe of a text, often misread", tons:"A whole lot, weightily",
  town:"Community smaller than a city", tune:"Melody", twin:"Built-in birthday buddy", urge:"Impulse you might resist",
  uses:"Employs", vast:"Extremely large", vein:"Blood vessel", weak:"Lacking strength",
  went:"Past tense of go", west:"Direction of sunset", what:"Abbott and Costello's second baseman", wire:"A spy's listening device, perhaps", wise:"Owl stereotype", york:"New ___, or a peppermint patty name", yale:"Ivy with a bulldog named Handsome Dan", zeus:"Olympian with a lightning problem"
};

export const MINI4_CLUES: Record<string,string> = {...GENERATED_MINI4_CLUES,...CURATED_MINI4_CLUES};

const FILLS = [
  ["sold","area","fast","else"], ["snow","hope","ones","went"], ["roll","area","cast","else"],
  ["tale","oral","news","ease"], ["cash","onto","step","time"], ["spot","tape","ages","rent"],
  ["crew","live","uses","bent"], ["adds","coat","into","deep"], ["folk","iron","rate","else"],
  ["glad","rare","ones","weak"], ["flew","live","ones","went"], ["twin","hide","area","tear"],
  ["able","lean","send","ones"], ["twin","hide","uses","seat"], ["thus","hire","edge","need"],
  ["drum","ease","ages","less"], ["star","hide","odds","west"], ["vein","acre","show","tons"],
  ["tips","idle","lean","land"], ["arms","coat","idle","deep"], ["acts","blue","lane","eyed"],
  ["plus","lose","oven","test"], ["limb","oral","code","knew"], ["legs","acre","shoe","town"],
  ["scan","page","area","nest"],
  ["lmao","york","maya","ebay"], ["cozy","area","paul","else"],
  ["halo","even","line","adds"], ["ogre","what","nero","seen"],
  ["dope","only","star","tone"]
];

const wordsForFill=(rows:string[])=>[...rows,...Array.from({length:4},(_,column)=>rows.map((row)=>row[column]).join(""))];
const canonicalFill=(rows:string[])=>[rows.join(""),wordsForFill(rows).slice(4).join("")].sort()[0];

function selectDiverseFills(count:number): string[][] {
  const seen=new Set<string>();
  const selected=FILLS.filter((rows)=>{const key=canonicalFill(rows);if(seen.has(key))return false;seen.add(key);return true;});
  const candidates=GENERATED_MINI4_FILLS.filter((rows)=>{const key=canonicalFill(rows);if(seen.has(key))return false;seen.add(key);return true;});
  const frequencies=new Map<string,number>();
  selected.flatMap(wordsForFill).forEach((word)=>frequencies.set(word,(frequencies.get(word)||0)+1));
  while(selected.length<count&&candidates.length){
    let bestIndex=0,bestScore=Infinity;
    candidates.forEach((rows,index)=>{
      const counts=wordsForFill(rows).map((word)=>frequencies.get(word)||0);
      const score=Math.max(...counts)*10_000+counts.reduce((sum,value)=>sum+value*value*25+value,0);
      if(score<bestScore){bestScore=score;bestIndex=index;}
    });
    const [rows]=candidates.splice(bestIndex,1);selected.push(rows);
    wordsForFill(rows).forEach((word)=>frequencies.set(word,(frequencies.get(word)||0)+1));
  }
  if(selected.length!==count)throw new Error(`Could only select ${selected.length} distinct Mini Crossword fills`);
  return selected;
}

const fills = selectDiverseFills(365);

export const MINI4_PUZZLES = fills.map((rows,index)=>createMini4Puzzle(
  `mini4-${String(index+1).padStart(4,"0")}`,rows,MINI4_CLUES,
  index<25?(index%5===4?"medium":"easy"):index<250?"medium":"hard"
));
