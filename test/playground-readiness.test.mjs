import test from 'node:test';
import assert from 'node:assert/strict';
import {playgroundInvestigationReadiness} from '../src/playground/http.mjs';

test('LIVE_READ_ONLY with OpenRouter key enables investigations without FRAMEFUZZ_SWARM',()=>{
  const r=playgroundInvestigationReadiness({
    offlineDemo:false,
    capabilityMode:'LIVE_READ_ONLY',
    env:{},
    provider:{configured:true},
  });
  assert.equal(r.canStart,true);
  assert.equal(r.liveModeEnablesAgents,true);
  assert.equal(r.swarmEnvEnabled,false);
});

test('missing OpenRouter key blocks with an explicit reason',()=>{
  const r=playgroundInvestigationReadiness({
    offlineDemo:false,
    capabilityMode:'LIVE_READ_ONLY',
    env:{},
    provider:{configured:false},
  });
  assert.equal(r.canStart,false);
  assert.match(r.notice,/OPENROUTER_API_KEY/);
});

test('SAVED_DEMO always blocks paid investigations',()=>{
  const r=playgroundInvestigationReadiness({
    offlineDemo:true,
    capabilityMode:'SAVED_DEMO',
    env:{FRAMEFUZZ_SWARM:'on',OPENROUTER_API_KEY:'x'},
    provider:{configured:true},
  });
  assert.equal(r.canStart,false);
  assert.match(r.notice,/SAVED_DEMO|OFFLINE/);
});

test('legacy FRAMEFUZZ_SWARM=on still enables agents when OpenRouter is configured',()=>{
  const r=playgroundInvestigationReadiness({
    offlineDemo:false,
    capabilityMode:undefined,
    env:{FRAMEFUZZ_SWARM:'on'},
    provider:{configured:true},
  });
  assert.equal(r.canStart,true);
  assert.equal(r.swarmEnvEnabled,true);
});
