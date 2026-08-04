import assert from "node:assert/strict";
import test from "node:test";
import { confirmProgressLoss } from "../src/lib/games/confirm-reset.ts";

test("discard confirmation only interrupts unfinished games with progress",()=>{
  let prompts=0;
  const ask=()=>{prompts++;return false;};
  assert.equal(confirmProgressLoss({complete:false,hasProgress:false},ask),true);
  assert.equal(confirmProgressLoss({complete:true,hasProgress:true},ask),true);
  assert.equal(prompts,0);
  assert.equal(confirmProgressLoss({complete:false,hasProgress:true,label:"start over"},ask),false);
  assert.equal(prompts,1);
});

test("discard confirmation names the destructive action",()=>{
  let message="";
  assert.equal(confirmProgressLoss({complete:false,hasProgress:true,label:"reset this board"},(value)=>{message=value;return true;}),true);
  assert.match(message,/Are you sure/i);
  assert.match(message,/reset this board/i);
  assert.match(message,/progress will be lost/i);
});
