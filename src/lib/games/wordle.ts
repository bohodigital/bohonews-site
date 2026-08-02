export type WordleMark = "absent" | "present" | "correct";

export const WORDLE_ANSWERS = [
  "ABOVE","ACORN","ACTOR","ADORE","AGILE","ALBUM","ALERT","ALIEN","ALIVE","ALLOW",
  "AMBER","AMPLE","ANGEL","ANGER","APPLE","APRON","ARGUE","ARISE","ARROW","ASIDE",
  "ATLAS","AUDIO","AVOID","BADGE","BAKER","BEACH","BEARD","BEGIN","BELOW","BENCH",
  "BERRY","BIRCH","BLACK","BLEND","BLIND","BLOCK","BLOOM","BOARD","BRAIN","BRAVE",
  "BREAD","BRICK","BRIDE","BRING","BROWN","BRUSH","CABIN","CABLE","CANDY","CARRY",
  "CHAIR","CHARM","CHASE","CHEST","CHIME","CLAIM","CLEAN","CLEAR","CLERK","CLIMB",
  "CLOCK","CLOUD","COAST","CORAL","COUNT","COURT","COVER","CRAFT","CRANE","CREAM",
  "CRISP","CROWN","DANCE","DEBUT","DELAY","DEPOT","DIARY","DINER","DOUBT","DREAM",
  "DRINK","DRIVE","EARTH","EIGHT","ELBOW","ELDER","EMBER","ENJOY","ENTRY","EQUAL",
  "FAITH","FANCY","FIELD","FINAL","FIRST","FLAME","FLOOR","FOCUS","FRAME","FRESH",
  "FRONT","FRUIT","GIANT","GLASS","GLOBE","GRACE","GRAIN","GRAND","GRAPE","GRAPH",
  "GRASS","GREEN","GROUP","GUIDE","HAPPY","HEART","HONEY","HORSE","HOTEL","HOUSE",
  "HUMAN","IDEAL","IMAGE","INDEX","INNER","JELLY","JOINT","JUDGE","KNIFE","LARGE",
  "LASER","LATER","LAUGH","LAYER","LEARN","LEMON","LIGHT","LIMIT","LOCAL","MAGIC",
  "MAJOR","MAPLE","MARCH","MATCH","METAL","MIGHT","MODEL","MONEY","MONTH","MOUSE",
  "MOVIE","MUSIC","NERVE","NIGHT","NORTH","NOTES","NOVEL","NURSE","OCEAN","OLIVE",
  "OPERA","ORBIT","OTHER","PAINT","PANEL","PAPER","PARTY","PEACH","PEARL","PHONE",
  "PIANO","PIECE","PILOT","PIZZA","PLACE","PLAIN","PLANE","PLANT","PLATE","POINT",
  "POWER","PRESS","PRIDE","PRIME","PRINT","PRIZE","QUEEN","QUIET","RADIO","RAISE",
  "RANGE","RIVER","ROAST","ROBOT","ROUTE","ROYAL","SCALE","SCENE","SCORE","SHAPE",
  "SHARE","SHEEP","SHELF","SHELL","SHINE","SHIRT","SHORE","SHORT","SKILL","SLATE",
  "SMILE","SOLAR","SOLID","SOUND","SOUTH","SPACE","SPARK","SPEED","SPICE","SPORT",
  "STAGE","STAIR","STARE","STEAM","STEEL","STICK","STOCK","STONE","STORE","STORM",
  "STORY","STYLE","SUGAR","TABLE","TEACH","THEME","TIGER","TITLE","TOAST","TODAY",
  "TOPIC","TOTAL","TOUCH","TOWER","TRACE","TRACK","TRADE","TRAIN","TREAT","TREND",
  "TRIAL","TRUCK","TRUST","UNION","VALUE","VIDEO","VISIT","VOICE","WATER","WHEEL",
  "WHITE","WHOLE","WOMAN","WORLD","WORTH","WRITE","YOUNG","YOUTH"
] as const;

export function scoreWordleGuess(guess: string, answer: string): WordleMark[] {
  const normalizedGuess = guess.toUpperCase();
  const normalizedAnswer = answer.toUpperCase();
  const marks: WordleMark[] = Array(5).fill("absent");
  const remaining = [...normalizedAnswer];

  [...normalizedGuess].forEach((letter, index) => {
    if (letter === normalizedAnswer[index]) {
      marks[index] = "correct";
      remaining[index] = "";
    }
  });
  [...normalizedGuess].forEach((letter, index) => {
    if (marks[index] === "correct") return;
    const match = remaining.indexOf(letter);
    if (match >= 0) {
      marks[index] = "present";
      remaining[match] = "";
    }
  });
  return marks;
}

export function pickWordleAnswer(recent: string[] = [], random = Math.random): string {
  const blocked = new Set(recent.slice(-20));
  const candidates = WORDLE_ANSWERS.filter((word) => !blocked.has(word));
  return candidates[Math.floor(random() * candidates.length)] ?? WORDLE_ANSWERS[0];
}
