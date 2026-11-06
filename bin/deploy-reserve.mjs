import { readFile,writeFile,mkdir } from 'node:fs/promises';
import { deployReserve } from '../src/adapters/workshop-setup.mjs';

const configFile='examples/live/devnet.json';
try {
  if (!process.argv.includes('--submit') || !process.argv.includes('--allow-chain') || process.argv[process.argv.indexOf('--allow-chain')+1] !== '1337') throw new Error('Deployment requires explicit --submit --allow-chain 1337');
  const config=JSON.parse(await readFile(configFile,'utf8'));
  const artifact=JSON.parse(await readFile('vendor/paymaster/ReserveReadingPaymaster.json','utf8'));
  const result=await deployReserve({config,artifact,privateKey:process.env.FRAMEFUZZ_DEPLOYER_KEY,rpcUrl:process.env.FRAMEFUZZ_SETUP_RPC??config.authorizedEndpoints[0]});
  config.paymasters.unstaked=result.address;
  config.paymasterCodeHashes.unstaked=result.codeHash;
  await writeFile(configFile,JSON.stringify(config,null,2)+'\n');
  await mkdir('runs',{recursive:true});
  await writeFile('runs/live-reserve-deployment.json',JSON.stringify({schema:'framefuzz.setup.v1',source:'LIVE_RPC_SUBMISSION',chainId:1337,...result},null,2)+'\n');
  console.log(JSON.stringify(result,null,2));
} catch(error) {console.error(error.message);process.exitCode=1;}
