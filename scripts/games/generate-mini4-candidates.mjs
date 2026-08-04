import { solveMini4Fills } from "../../src/lib/games/crossword-mini4.ts";

const API = "https://api.datamuse.com/words";
const PREFIXES = "abcdefghijklmnopqrstuvwxyz".split("");
const PARTS_OF_SPEECH = new Set(["n","v","adj","adv"]);
const BLOCKED = new Set([
  "anal","arse","cock","cunt","dick","fuck","jizz","nazi","porn","rape","shit","slut"
]);

function option(name,fallback){const prefix=`--${name}=`;const value=process.argv.find((argument)=>argument.startsWith(prefix));return value?Number(value.slice(prefix.length)):fallback;}
const limit=Math.max(1,Math.min(option("limit",500),5000));
const minimumFrequency=Math.max(0,option("min-frequency",5));

async function fetchPrefix(prefix){
  const url=new URL(API);url.searchParams.set("sp",`${prefix}???`);url.searchParams.set("md","fp");url.searchParams.set("max","1000");
  const response=await fetch(url,{headers:{accept:"application/json","user-agent":"Boho-News-crossword-authoring/1.0"}});
  if(!response.ok)throw new Error(`Datamuse ${prefix} request failed: ${response.status}`);
  return response.json();
}

const records=(await Promise.all(PREFIXES.map(fetchPrefix))).flat();
const vocabulary=new Map();
for(const record of records){
  const word=String(record.word||"").toLowerCase();const tags=Array.isArray(record.tags)?record.tags:[];
  const frequency=Number(tags.find((tag)=>tag.startsWith("f:"))?.slice(2)||0);
  if(!/^[a-z]{4}$/.test(word)||frequency<minimumFrequency||tags.includes("prop")||BLOCKED.has(word)||!tags.some((tag)=>PARTS_OF_SPEECH.has(tag)))continue;
  const current=vocabulary.get(word);if(!current||frequency>current.frequency)vocabulary.set(word,{word,frequency,tags:tags.filter((tag)=>!tag.startsWith("f:"))});
}

const ranked=[...vocabulary.values()].sort((left,right)=>right.frequency-left.frequency||left.word.localeCompare(right.word));
const rawFills=solveMini4Fills(ranked.map(({word})=>word),Math.min(limit*20,100000));
const candidates=new Map();
for(const rows of rawFills){
  const columns=Array.from({length:4},(_,column)=>rows.map((row)=>row[column]).join(""));
  const canonical=[rows.join(""),columns.join("")].sort()[0];if(candidates.has(canonical))continue;
  const words=[...rows,...columns];const frequencies=words.map((word)=>vocabulary.get(word)?.frequency||0);
  candidates.set(canonical,{fingerprint:rows.join(""),rows,columns,minimumFrequency:Math.min(...frequencies),totalFrequency:frequencies.reduce((sum,value)=>sum+value,0)});
}

const output=[...candidates.values()].sort((left,right)=>right.minimumFrequency-left.minimumFrequency||right.totalFrequency-left.totalFrequency||left.fingerprint.localeCompare(right.fingerprint)).slice(0,limit);
process.stdout.write(`${JSON.stringify({schemaVersion:1,source:"Datamuse API",sourceUrl:"https://www.datamuse.com/api/",requestCount:PREFIXES.length,minimumFrequency,vocabularySize:ranked.length,candidateCount:output.length,candidates:output},null,2)}\n`);
