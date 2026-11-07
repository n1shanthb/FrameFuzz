import test from 'node:test';import assert from 'node:assert/strict';
import {analyzeContract} from '../src/playground/compile.mjs';
const source='pragma solidity ^0.8.28; contract FreshLedger { uint public count; event Updated(uint n); function bump(uint8 n) external { require(n > 0); count += n; emit Updated(n); } }';
test('unseen Solidity produces real compiler ABI, AST guards, state and source-bound identity',async()=>{
 const a=await analyzeContract({source});assert.equal(a.status,'READY');assert.ok(a.functions.some(f=>f.signature==='bump(uint8)'));assert.equal(a.structure.variables[0].name,'count');assert.equal(a.structure.guards[0].name,'require');assert.equal(a.detectedRole.role,'UNKNOWN');
 const b=await analyzeContract({source:source.replace('bump','raise')});assert.notEqual(a.sourceDigest,b.sourceDigest);assert.notEqual(a.analysisId,b.analysisId);assert.ok(b.functions.some(f=>f.signature==='raise(uint8)'));
});
test('compiler failures, unsupported imports and multiple contracts are honest actionable states',async()=>{
 assert.equal((await analyzeContract({source:'pragma solidity ^0.8.29; contract Nope {}'})).status,'COMPILE_ERROR');
 const imported=await analyzeContract({source:'import "../../.env"; contract NoImport {}'});assert.equal(imported.status,'COMPILE_ERROR');assert.ok(imported.diagnostics.some(d=>d.message.includes('Imports are disabled')));
 const s='pragma solidity ^0.8.28; contract One {} contract Two { function ping() external {} }';assert.equal((await analyzeContract({source:s})).status,'SELECT_CONTRACT');assert.equal((await analyzeContract({source:s,contractName:'Two'})).contractName,'Two');
});
test('intake rejects oversized, credential-bearing and path selections; compilation is cancellable/time bounded',async()=>{
 for(const input of [{source:'x'.repeat(65537)},{source,contractName:'../../.env'},{source:'// sk-or-'+ 'a'.repeat(30)}])await assert.rejects(analyzeContract(input));
 await assert.rejects(analyzeContract({source},{timeoutMs:1}),/TIMEOUT/);
 const c=new AbortController();c.abort();await assert.rejects(analyzeContract({source},{signal:c.signal}),/CANCELLED/);
});
