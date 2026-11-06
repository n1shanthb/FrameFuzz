import {readFile} from 'node:fs/promises';
import {encodeAbiParameters,encodeDeployData,getContractAddress,keccak256} from 'viem';
import {privateKeyToAccount} from 'viem/accounts';
import {rpc} from '../rpc.mjs';
import {assertTestChain} from '../safety.mjs';
import {profile} from '../adapters/workshop-codec.mjs';
import {compileOwnedFixtures} from './compile.mjs';
import {assertSwarmEnabled,rejectNetworkWrites} from './gate.mjs';
const READ_METHODS=new Set(['eth_chainId','web3_clientVersion','skandha_explorer_info','eth_getBalance','eth_getCode','eth_getBlockByNumber','eth_getTransactionCount','eth_getStorageAt']);
export const AUTHORIZED_SWARM_ENDPOINTS=['https://altmempool.forshtat.com/rpc','https://altmempool.forshtat.com'];
const ADDRESS=/^0x[\da-f]{40}$/i;
export const keyedNonceSlot=(sender,key=0n)=>keccak256(encodeAbiParameters([{type:'address'},{type:'uint256'}],[sender,key]));
export function readOnlySwarmRpc(rpcFn=rpc,observations=[]){return async(url,method,params=[])=>{
  if(!AUTHORIZED_SWARM_ENDPOINTS.includes(url)||!READ_METHODS.has(method))throw new Error('Swarm read-only RPC allowlist rejected request');
  const result=await rpcFn(url,method,params);observations.push({endpoint:url,method});return result;
};}
function configuredDeployer(env){
  if(!env.FRAMEFUZZ_DEPLOYER_KEY)return null;
  if(!/^0x[\da-f]{64}$/i.test(env.FRAMEFUZZ_DEPLOYER_KEY))throw new Error('Malformed devnet deployer environment key');
  try{return privateKeyToAccount(env.FRAMEFUZZ_DEPLOYER_KEY).address;}catch{throw new Error('Invalid devnet deployer environment key');}
}
export async function swarmPreflight(options={}){
  assertSwarmEnabled();rejectNetworkWrites(options);
  const env=options.env??process.env,observations=[],read=readOnlySwarmRpc(options.rpcFn,observations);
  const config=JSON.parse(await readFile(new URL('../../examples/live/devnet.json',import.meta.url))),endpoint=AUTHORIZED_SWARM_ENDPOINTS[0];
  if(config.chainId!==1337)throw new Error('Pinned devnet configuration must target chain1337');
  for(const url of AUTHORIZED_SWARM_ENDPOINTS)assertTestChain(Number(BigInt(await read(url,'eth_chainId'))),1337);
  const compilation=await compileOwnedFixtures(),blockers=[];
  const executionClient=await read(AUTHORIZED_SWARM_ENDPOINTS[1],'web3_clientVersion'),sidecar=await read(endpoint,'skandha_explorer_info');
  if(!executionClient.includes(config.provenance.executionCommit))blockers.push('Execution client version drifted from the pinned working devnet');
  if(sidecar.chainId!==1337)throw new Error('Sidecar reports wrong chain');
  const latestBlock=await read(AUTHORIZED_SWARM_ENDPOINTS[1],'eth_getBlockByNumber',['latest',false]);
  const age=latestBlock?.timestamp?Math.max(0,Math.floor((options.now??Date.now())/1000)-Number(BigInt(latestBlock.timestamp))):null;
  if(age===null||age>120)blockers.push('Latest execution head missing/stale; mining is not established');
  const payer=config.paymasters.basic,payerCode=await read(endpoint,'eth_getCode',[payer,'latest']),payerBalance=BigInt(await read(endpoint,'eth_getBalance',[payer,'latest']));
  if(payerCode==='0x'||keccak256(payerCode)!==config.paymasterCodeHashes.basic)blockers.push('Pinned basic PAYMENT sponsor code mismatch');
  if(payerBalance<BigInt(config.minSponsorBalanceWei))blockers.push('Basic PAYMENT sponsor balance below pinned minimum');
  const nonceManager=profile.predeploys.NONCE_MANAGER,probeSlot=keyedNonceSlot(payer);
  const nonceProbe=await read(endpoint,'eth_getStorageAt',[nonceManager,probeSlot,'latest']);
  const keyDeployer=configuredDeployer(env),deployer=options.deployer??keyDeployer,owner=options.owner??env.FRAMEFUZZ_SWARM_OWNER_ADDRESS??null;
  for(const [name,address]of Object.entries({deployer,owner}))if(address!==null&&!ADDRESS.test(address))throw new Error(`Invalid ${name} address`);
  if(keyDeployer&&deployer?.toLowerCase()!==keyDeployer.toLowerCase())throw new Error('Configured deployer address does not match secure environment key');
  let funding=null,deploymentNonce=null;
  const gasPerDeployment=6000000n,maxGasPrice=2000000000n,totalDeploymentFeeBound=5n*gasPerDeployment*maxGasPrice;
  if(deployer){funding=BigInt(await read(endpoint,'eth_getBalance',[deployer,'latest']));deploymentNonce=BigInt(await read(endpoint,'eth_getTransactionCount',[deployer,'pending']));if(funding<totalDeploymentFeeBound)blockers.push('Deployer balance is below the conditional deployment fee cap');}
  if(!keyDeployer)blockers.push('No securely configured FRAMEFUZZ_DEPLOYER_KEY; no deployment can be signed');
  if(!deployer||!owner)blockers.push('Owned deployer/owner addresses unresolved; exact constructor data and CREATE addresses remain conditional');
  blockers.push('Live canonical TXPARAM(SIG_HASH) compatibility is unverified; workshop and current EIP signing profiles differ');
  blockers.push('Write health is unverified by read-only checks; prior sidecar disk-full failure requires operator confirmation');
  blockers.push('Separate explicit human deployment/submission approval has not been given');
  const roles=[['action','ActionRecorder'],['unsafe_authorized','SenderValidatorUnsafe'],['unsafe_tampered','SenderValidatorUnsafe'],['safe_authorized','SenderValidatorSafe'],['safe_tampered','SenderValidatorSafe']];
  const actionAddress=deployer?getContractAddress({from:deployer,nonce:deploymentNonce}):null;
  const deployments=[];
  for(let i=0;i<roles.length;i++){
    const [role,name]=roles[i],artifact=compilation.artifacts[name],address=deployer?getContractAddress({from:deployer,nonce:deploymentNonce+BigInt(i)}):null;
    const args=name==='ActionRecorder'?[]:owner&&actionAddress?[owner,actionAddress,payer]:null;
    let context=null;
    if(address){
      const code=await read(endpoint,'eth_getCode',[address,'latest']);if(code!=='0x')blockers.push('Predicted CREATE address already has code: '+role);
      if(i>0){const slot=keyedNonceSlot(address),value=await read(endpoint,'eth_getStorageAt',[nonceManager,slot,'latest']);if(BigInt(value)!==0n)blockers.push('Planned isolated sender has a nonzero keyed nonce: '+role);context={nonceManager,key:'0',slot,nextSequence:String(BigInt(value))};}
    }
    deployments.push({role,contract:name,predictedAddress:address,nonce:deploymentNonce===null?null:String(deploymentNonce+BigInt(i)),constructorArguments:args,
      constructorTemplate:name==='ActionRecorder'?[]:['OWNER','OWNED_ACTION_ADDRESS','PINNED_BASIC_PAYER'],creationBytecodeHash:keccak256(artifact.bytecode),
      initCode:args?encodeDeployData({abi:artifact.abi,bytecode:artifact.bytecode,args}):null,gasLimit:String(gasPerDeployment),maxFeePerGas:String(maxGasPrice),valueWei:'0',context});
  }
  const submissions=roles.slice(1).map(([role])=>({role,sender:deployments.find(d=>d.role===role).predictedAddress,
    authorizedIntent:{operation:1,parameter:10},submittedAction:role.endsWith('tampered')?{operation:2,parameter:999}:{operation:1,parameter:10},
    path:'alternative',method:'eth_sendFrameTransaction',nonceKeys:['0'],nonceSeq:'0',frameModes:[1,1,2],frameFlags:[2,1,0],arbitraryWitness:{scheme:0,signer:'0x',msg:'0x',bytes:65},
    limits:{senderVerification:40000,payerVerification:50000,actionExecution:150000,actionState:200000},expected:role==='safe_tampered'?'AUTHORIZATION_REJECTED':'ACTION_EXECUTED_UNVERIFIED'}));
  return {schema:'framefuzz.swarm-preflight.v1',milestone:2,generatedAt:new Date().toISOString(),source:'READ_ONLY_DEVNET_PREFLIGHT — NO DEPLOYMENT OR BROADCAST',
    chainId:1337,endpoint,executionClient,sidecar,latestBlock:{number:latestBlock?.number??null,timestamp:latestBlock?.timestamp??null,ageSeconds:age},
    sponsor:{address:payer,codeHash:keccak256(payerCode),balanceWei:String(payerBalance),scope:'PAYMENT_ONLY'},nonceManagerProbe:{address:nonceManager,referenceSender:payer,slot:probeSlot,nextSequence:String(BigInt(nonceProbe)),meaning:'Read-only protocol storage probe, not an owned validator deployment'},
    wallet:{deployer,owner,secureKeyConfigured:Boolean(keyDeployer),balanceWei:funding===null?null:String(funding)},
    deploymentPlan:{status:deployer&&owner?'CONDITIONAL_UNSIGNED':'UNRESOLVED_WALLET_CONTEXT',compilerInputDigest:compilation.inputDigest,deployments,totalDeploymentFeeBoundWei:String(totalDeploymentFeeBound),feeBoundMeaning:'Five deployments capped at6m gas each and2gwei, excluding later frame fees; not a gas estimate',submissions,
      independentReproduction:'Requires a separately approved fresh deployment set and four fresh isolated submissions; not included in the first batch',
      verification:'Require authorized baseline, correct retained witness and sender/nonce isolation, ActionRecorded event/state for B with actual caller and successful action-frame receipt, plus absence of B on safe rejection'},
    readMethods:[...new Set(observations.map(o=>o.method))],requestCount:observations.length,observations,
    realLLMCalls:0,liveExecutions:0,deployments:0,unauthorizedActionProven:false,independentLiveReproduction:false,writeHealth:'UNVERIFIED_READ_ONLY',verdict:'STOP_BEFORE_LIVE_APPROVAL',blockers};
}
