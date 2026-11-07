import {encodeFunctionData,decodeFunctionResult,keccak256} from 'viem';
import {rpc} from '../rpc.mjs';
import {assertTestChain} from '../safety.mjs';
const managerABI=[{type:'function',name:'poolManager',inputs:[],outputs:[{type:'address'}],stateMutability:'view'}];
const slotABI=[{type:'function',name:'getSlot0',inputs:[{type:'bytes32'}],outputs:[{type:'uint160'},{type:'int24'},{type:'uint24'},{type:'uint24'}],stateMutability:'view'}];
export async function inspectUniswap(config,rpcUrl,{rpcFn=rpc}={}){
  if(config.chainId!==1337||!config.authorizedEndpoints?.includes(rpcUrl))throw new Error('Uniswap inspection requires authorized chain1337 endpoint');
  assertTestChain(Number(BigInt(await rpcFn(rpcUrl,'eth_chainId'))),1337);
  const contracts={};
  for(const id of ['stateView','poolManager']){
    const address=config[id],expected=config.uniswapCodeHashes?.[id];
    if(!/^0x[\da-f]{40}$/i.test(address??'')||!/^0x[\da-f]{64}$/i.test(expected??''))throw new Error(`Pinned Uniswap ${id} address/code hash required`);
    const code=await rpcFn(rpcUrl,'eth_getCode',[address,'latest']);
    if(!/^0x[\da-f]+$/i.test(code)||code==='0x'||keccak256(code)!==expected)throw new Error(`Uniswap ${id} bytecode missing or changed`);
    contracts[id]={address,codeHash:expected,bytes:(code.length-2)/2};
  }
  const call=async(abi,functionName,args=[])=>decodeFunctionResult({abi,functionName,data:await rpcFn(rpcUrl,'eth_call',[{to:config.stateView,data:encodeFunctionData({abi,functionName,args})},'latest'])});
  if((await call(managerABI,'poolManager')).toLowerCase()!==config.poolManager.toLowerCase())throw new Error('StateView is bound to a different PoolManager');
  const [sqrtPriceX96,tick,protocolFee,lpFee]=await call(slotABI,'getSlot0',[config.poolId]);
  return {chainId:1337,poolId:config.poolId,contracts,slot0:{sqrtPriceX96:String(sqrtPriceX96),tick:Number(tick),protocolFee:Number(protocolFee),lpFee:Number(lpFee),initialized:sqrtPriceX96!==0n},
    interaction:'StateView.getSlot0(bytes32)',source:{file:'vendor/paymaster/ReserveReadingPaymaster.sol',line:33},trust:'Devnet deployments verified by pinned runtime hashes and StateView.poolManager binding; not a mainnet deployment attestation'};
}
