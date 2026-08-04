import { solveMini4Fills } from "../../src/lib/games/crossword-mini4.ts";
import { writeFileSync } from "node:fs";

const API = "https://api.datamuse.com/words";
const PREFIXES = "abcdefghijklmnopqrstuvwxyz".split("");
const PARTS_OF_SPEECH = new Set(["n","v","adj","adv"]);
const BLOCKED = new Set([
  "acta","anal","arse","cock","coll","comm","cunt","dans","dick","eine","etal","fuck","jizz","nazi","porn","rape","shit","slut"
]);
const UNSUITABLE_DEFINITION = /\b(?:alternative form|barangay|commune|derogatory|given name|initialism|obsolete|offensive|surname|testicles|village|vulgar)\b/i;

function option(name,fallback){const prefix=`--${name}=`;const value=process.argv.find((argument)=>argument.startsWith(prefix));return value?Number(value.slice(prefix.length)):fallback;}
function stringOption(name,fallback=""){const prefix=`--${name}=`;const value=process.argv.find((argument)=>argument.startsWith(prefix));return value?value.slice(prefix.length):fallback;}
const limit=Math.max(1,Math.min(option("limit",500),5000));
const minimumFrequency=Math.max(0,option("min-frequency",5));
const outputPath=stringOption("output");

async function fetchPrefix(prefix){
  const url=new URL(API);url.searchParams.set("sp",`${prefix}???`);url.searchParams.set("md","fdp");url.searchParams.set("max","1000");
  const response=await fetch(url,{headers:{accept:"application/json","user-agent":"Boho-News-crossword-authoring/1.0"}});
  if(!response.ok)throw new Error(`Datamuse ${prefix} request failed: ${response.status}`);
  return response.json();
}

const records=(await Promise.all(PREFIXES.map(fetchPrefix))).flat();
const vocabulary=new Map();
for(const record of records){
  const word=String(record.word||"").toLowerCase();const tags=Array.isArray(record.tags)?record.tags:[];
  const frequency=Number(tags.find((tag)=>tag.startsWith("f:"))?.slice(2)||0);
  const definitions=Array.isArray(record.defs)?record.defs.map((value)=>String(value).replace(/^[^\t]+\t/,"").trim()).filter(Boolean):[];
  if(!/^[a-z]{4}$/.test(word)||frequency<minimumFrequency||tags.includes("prop")||BLOCKED.has(word)||!definitions.length||!tags.some((tag)=>PARTS_OF_SPEECH.has(tag)))continue;
  const clue=definitions
    .map((value)=>value.replace(/^(?:\([^)]*\)\s*)+/,"").trim())
    .filter((value)=>value.length>=8&&value.length<=96&&!UNSUITABLE_DEFINITION.test(value)&&!new RegExp(`\\b${word}\\b`,"i").test(value))
    .sort((left,right)=>Math.abs(left.length-48)-Math.abs(right.length-48))[0];
  if(!clue)continue;
  const current=vocabulary.get(word);if(!current||frequency>current.frequency)vocabulary.set(word,{word,frequency,tags:tags.filter((tag)=>!tag.startsWith("f:")),clue:clue[0].toUpperCase()+clue.slice(1).replace(/[.;:]$/,"")});
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
if(outputPath){
  const usedWords=[...new Set(output.flatMap(({rows,columns})=>[...rows,...columns]))].sort();
  const clues=Object.fromEntries(usedWords.map((word)=>[word,vocabulary.get(word).clue]));
  const generated=`// Generated offline from Datamuse definition metadata. Do not hand-edit.\nexport const GENERATED_MINI4_CLUES: Record<string,string> = ${JSON.stringify(clues,null,2)};\n\nexport const GENERATED_MINI4_FILLS: string[][] = ${JSON.stringify(output.map(({rows})=>rows),null,2)};\n`;
  writeFileSync(outputPath,generated,"utf8");
  process.stdout.write(`${JSON.stringify({outputPath,vocabularySize:ranked.length,candidateCount:output.length,clueCount:usedWords.length})}\n`);
}else process.stdout.write(`${JSON.stringify({schemaVersion:1,source:"Datamuse API",sourceUrl:"https://www.datamuse.com/api/",requestCount:PREFIXES.length,minimumFrequency,vocabularySize:ranked.length,candidateCount:output.length,candidates:output},null,2)}\n`);
