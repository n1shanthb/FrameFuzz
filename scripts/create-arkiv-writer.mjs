import {readFileSync,writeFileSync} from 'node:fs';
import {generatePrivateKey,privateKeyToAccount} from 'viem/accounts';
import {ARKIV_CHAIN_ID,ARKIV_RPC} from '../src/arkiv/client.mjs';

const envPath='.env';
let text=readFileSync(envPath,'utf8');
const lines=text.split(/\r?\n/);
const get=k=>{
  const line=lines.find(x=>x.startsWith(k+'='));
  if(!line)return '';
  let v=line.slice(k.length+1).trim();
  if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'")))v=v.slice(1,-1);
  return v;
};

let key=get('ARKIV_PRIVATE_KEY');
let created=false;
if(!/^0x[\da-fA-F]{64}$/.test(key)){
  key=generatePrivateKey();
  created=true;
  const re=/^ARKIV_PRIVATE_KEY=.*$/m;
  if(re.test(text))text=text.replace(re,'ARKIV_PRIVATE_KEY='+key);
  else text=(text.endsWith('\n')||text==='')?`${text}ARKIV_PRIVATE_KEY=${key}\n`:`${text}\nARKIV_PRIVATE_KEY=${key}\n`;
  writeFileSync(envPath,text,{encoding:'utf8'});
}

const account=privateKeyToAccount(key);
console.log(JSON.stringify({
  created,
  address:account.address,
  chainId:ARKIV_CHAIN_ID,
  rpc:ARKIV_RPC,
  envFile:'.env (gitignored)',
  note:'Private key stored only in local .env — never commit or paste it into chat.',
},null,2));
