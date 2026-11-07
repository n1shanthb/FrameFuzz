import {createDashboardServer} from '../src/server.mjs';
import {byocTestProvider} from './test-support/byoc.mjs';
if(process.argv.slice(2).join(' ')!=='--mock-transport')throw Error('Explicit --mock-transport required; this harness makes no real model request');
const server=createDashboardServer({resultDir:'runs/byoc-browser',swarmEnvironment:{FRAMEFUZZ_SWARM:'on'},playgroundProviderFactory:()=>byocTestProvider({forceRepair:true,readTool:true,followUp:true})});
server.listen(4196,'127.0.0.1',()=>console.log('MOCK LLM TRANSPORT ONLY; real compiler/ABI tools; no paid model/chain calls. http://127.0.0.1:4196/'));
