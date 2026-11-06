import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';import {tmpdir} from 'node:os';import path from 'node:path';
import {savedCommunity} from '../src/arkiv/saved.mjs';
import {createDashboardServer} from '../src/server.mjs';
test('saved discovery labels historical integrity and never enables a new expired/unverified replay',async()=>{
  const result=await savedCommunity();assert.equal(result.cases.length,2);assert.equal(result.mode,'saved');
  for(const c of result.cases){assert.equal(c.verification.digest,'VALID');assert.equal(c.verification.replayAllowed,false);assert.equal(c.verification.expiry,'NOT_CURRENTLY_CHECKED');}
  assert.equal((await savedCommunity({suite:'not-a-suite'})).cases.length,0);
});
test('offline dashboard serves saved registry snapshots without contacting live SDK',async()=>{
  const dir=await mkdtemp(path.join(tmpdir(),'framefuzz-pass2-'));let reads=0;
  const server=createDashboardServer({resultDir:dir,offlineDemo:true,communityRegistry:{query(){reads++;throw new Error('must not query');}}});
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  try{const base=`http://127.0.0.1:${server.address().port}`;const saved=await(await fetch(base+'/api/community/saved')).json();assert.equal(saved.cases.length,2);assert.equal(reads,0);assert.equal((await fetch(base+'/api/community')).status,503);}
  finally{await new Promise(r=>server.close(r));await rm(dir,{recursive:true,force:true});}
});
