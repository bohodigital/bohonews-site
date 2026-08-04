import assert from "node:assert/strict";
import test from "node:test";
import {
  CONNECTIONS_PUZZLES, connectionsTerms, evaluateConnection,
  shuffleConnections, validateConnectionsPuzzle
} from "../src/lib/games/connections/puzzles.ts";

test("the initial Connections pack contains 12 structurally valid original rounds", () => {
  assert.equal(CONNECTIONS_PUZZLES.length,12);
  assert.equal(new Set(CONNECTIONS_PUZZLES.map((puzzle)=>puzzle.id)).size,12);
  for (const puzzle of CONNECTIONS_PUZZLES) {
    assert.equal(validateConnectionsPuzzle(puzzle),true,puzzle.id);
    assert.equal(connectionsTerms(puzzle).length,16);
    assert.equal(new Set(connectionsTerms(puzzle).map((term)=>term.toLowerCase())).size,16);
  }
});

test("Connections matching finds exact groups and detects one-away selections", () => {
  const puzzle=CONNECTIONS_PUZZLES[0];
  const exact=evaluateConnection(puzzle,puzzle.groups[0].terms);
  assert.equal(exact.group?.id,puzzle.groups[0].id);
  assert.equal(exact.oneAway,false);
  const oneAway=evaluateConnection(puzzle,[...puzzle.groups[0].terms.slice(0,3),puzzle.groups[1].terms[0]]);
  assert.equal(oneAway.group,null);
  assert.equal(oneAway.oneAway,true);
  assert.equal(evaluateConnection(puzzle,puzzle.groups[0].terms,[puzzle.groups[0].id]).group,null);
});

test("Connections shuffle is deterministic, stable, and non-mutating", () => {
  const terms=connectionsTerms(CONNECTIONS_PUZZLES[1]);
  const first=shuffleConnections(terms,42);
  assert.deepEqual(first,shuffleConnections(terms,42));
  assert.notDeepEqual(first,terms);
  assert.deepEqual(new Set(first),new Set(terms));
  assert.deepEqual(terms,connectionsTerms(CONNECTIONS_PUZZLES[1]));
});

test("Connections validator rejects duplicate terms and malformed levels", () => {
  const duplicate=structuredClone(CONNECTIONS_PUZZLES[0]);
  duplicate.groups[1].terms[0]=duplicate.groups[0].terms[0];
  assert.equal(validateConnectionsPuzzle(duplicate),false);
  const levels=structuredClone(CONNECTIONS_PUZZLES[0]);
  levels.groups[1].level=levels.groups[0].level;
  assert.equal(validateConnectionsPuzzle(levels),false);
});
