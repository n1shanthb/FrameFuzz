import test from 'node:test';
import assert from 'node:assert/strict';
import {EF_CANONICAL_ENDPOINT,EF_ALTERNATIVE_ENDPOINT,classifyEfEndpoint,assertEfRouting} from '../src/adapters/ef-routing.mjs';

const ethrex={chainId:'0x539',clientVersion:'ethrex/v23.0.0-eip8141-tracer'};
const skandha={chainId:'0x539',clientVersion:'skandha/v4.1.1-',skandhaInfo:{chainId:1337},skandhaConfig:{chainId:1337}};

test('canonical and alternative routes are fixed by client identity and request shape',()=>{
 assert.equal(EF_CANONICAL_ENDPOINT,'https://altmempool.forshtat.com');
 assert.equal(EF_ALTERNATIVE_ENDPOINT,'https://altmempool.forshtat.com/rpc/');
 assert.deepEqual(assertEfRouting({canonical:ethrex,alternative:skandha}),{
  canonical:{role:'CANONICAL_EXECUTION',clientFamily:'ethrex',submissionMethod:'eth_sendRawTransaction',parameterShape:'SIGNED_TYPE_0X06_BYTES'},
  alternative:{role:'ALTERNATIVE_SIDECAR',clientFamily:'skandha',submissionMethod:'eth_sendFrameTransaction',parameterShape:'STRUCTURED_SIGNED_FRAME',healthy:true},
 });
});

test('reversed identities, wrong chains and unknown labels fail closed',()=>{
 assert.throws(()=>assertEfRouting({canonical:skandha,alternative:ethrex}),/identity mismatch/);
 assert.equal(classifyEfEndpoint({chainId:'0x1',clientVersion:'ethrex/test'}).role,'INVALID');
 assert.equal(classifyEfEndpoint({chainId:'0x539',clientVersion:'configured-public-label'}).role,'UNKNOWN');
});
