import {createPublicClient,createWalletClient} from '@arkiv-network/sdk';
import {rabdi} from '@arkiv-network/sdk/chains';
import {http} from 'viem';
import {privateKeyToAccount} from 'viem/accounts';

export const ARKIV_CHAIN_ID=7794095;
export const ARKIV_RPC='https://rpc.rabdi.db-chain.testnet.arkiv.network';
export function arkivClients({privateKey=process.env.ARKIV_PRIVATE_KEY,accessKey=process.env.ARKIV_ACCESS_KEY??'',readOnly=false}={}){
  if(!readOnly&&privateKey&&!/^0x[\da-f]{64}$/i.test(privateKey))throw new Error('ARKIV_PRIVATE_KEY must be a valid test-only signing key');
  const chain=rabdi({accessKey});
  const transport=()=>http(undefined,{retryCount:1,timeout:15000});
  const publicClient=createPublicClient({chain,transport:transport(),cacheTime:0});
  let account=null;
  try{if(!readOnly&&privateKey)account=privateKeyToAccount(privateKey);}catch{throw new Error('Invalid Arkiv test signing key');}
  const walletClient=account?createWalletClient({chain,account,transport:transport()}):null;
  return {publicClient,walletClient};
}
