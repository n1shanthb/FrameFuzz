import {execFileSync} from 'node:child_process';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const sources=[
  ['Generated gas campaign','evidence/mutations/2026-11-06/2026-11-05T22-41-59-129Z-LIVE_RPC_SUBMISSION-947a7e01.json',()=>true],
  ['Historical Uniswap scenarios','evidence/live/2026-11-06/2026-11-05T22-04-27-896Z-LIVE_RPC_SUBMISSION-3a838bca.json',c=>c.id.includes('baseline')],
];
const escape=x=>String(x??'not recorded').replaceAll('|','\\|').replaceAll('\n',' ');
const status=p=>`${p.expected?.toUpperCase()??'INCONCLUSIVE'} → ${p.observed.status==='accepted'?'ADMITTED':p.observed.status.toUpperCase()} / ${p.receipt.state.toUpperCase()}`;
const lines=['# LIVE evidence — generated from committed captures','','Rebuild: `node scripts/live-evidence.mjs`; verify: `node scripts/live-evidence.mjs --check`. This document reads the committed Git blobs and rejects changed working copies. No network requests or submissions occur.','','LIVE means an actual historical RPC capture, not a new execution. PREVIEW is unsigned semantic generation; MOCK is simulated transport. ADMITTED is a returned hash; REJECTED is an admission response; INCLUDED_SUCCESS requires a successful receipt. TRANSPORT_FAILURE and INCONCLUSIVE prove neither admission nor execution. Intentional public/alternative policy differences are expected compatibility behavior, not vulnerabilities.','','The latest generated Uniswap campaign encountered remote sidecar disk exhaustion; it is separate from the successful historical scenarios below. See [current build status](../BUILD_STATUS.md) and [integrated capture](../evidence/integrated/2026-11-06/). No new successful inclusion is inferred from that failed campaign.'];
for(const [title,file,include]of sources){
  const committed=execFileSync('git',['show',`HEAD:${file}`]),working=await readFile(file);if(!committed.equals(working))throw new Error(`Historical evidence changed: ${file}`);
  const r=JSON.parse(committed);if(r.source!=='LIVE_RPC_SUBMISSION')throw new Error('Expected actual LIVE evidence');
  const cases=r.results.filter(include);lines.push('',`## ${title}`,'',`Source: [${file}](../${file}), captured ${r.generatedAt}; SHA-256 \`${createHash('sha256').update(committed).digest('hex')}\`. Chain ${r.chainId}.`,'','| Scenario | Rule | Semantic parameters / staking | Public expected → actual / receipt | Alternative expected → actual / receipt |','|---|---|---|---|---|');
  for(const c of cases){const pub=c.paths.find(p=>p.id==='public'),alt=c.paths.find(p=>p.id==='alt');const parameters=c.mutation?.parameter??c.mutation??{payerVerificationGas:pub.metadata?.transaction?.verificationGas,poolRead:Boolean(pub.metadata?.transaction?.stateView)};
    const stake=c.mutation?.setup?.staked??(c.id.startsWith('unstaked')?'unstaked':c.id.startsWith('staked')?'staked':'not staked');
    lines.push(`| ${c.id} | ${escape(pub.oracle?.ruleId??pub.expectedRule??alt.expectedRule??'baseline valid sponsorship')} | ${escape(JSON.stringify(parameters))}; staking: ${stake} | ${status(pub)} | ${status(alt)} |`);
  }
  for(const c of cases){lines.push('',`### ${c.id}`,'',`Artifact: [${file}](../${file}) → results[id=${c.id}].`);
    for(const p of c.paths){const report=p.admissionReport?.admission,checks=report?.checks??[],failures=checks.filter(x=>x.verdict==='fail');
      lines.push('',`**${p.id}:** ${status(p)}; verdict ${p.comparison.verdict}.`, `- Target rule: ${escape(p.oracle?.ruleId??p.expectedRule??'baseline sponsorship')} / expected rejection diagnostic: ${escape(p.expectedRule??'none (expected admission)')}.`,
        `- Paymaster: \`${p.metadata?.transaction?.payer??'not recorded'}\`; verification gas: ${p.metadata?.transaction?.verificationGas??'not recorded'}.`,
        p.observed.hash?`- Returned admission hash: \`${p.observed.hash}\`.`:`- Computed-only hash (not admitted): \`${p.metadata?.transaction?.hash??'not recorded'}\`.`,
        `- Receipt: ${p.receipt.state.toUpperCase()}; block ${p.receipt.blockNumber??'not recorded'}; status ${p.receipt.status??'not recorded'}.`,
        `- RPC response: ${escape(p.observed.message)}.`,
        report?`- Sidecar admission report: ${report.outcome??'not recorded'}; ${checks.length} checks; failing checks: ${escape(JSON.stringify(failures))}. Full report is preserved in paths[id=${p.id}].admissionReport.`:'- Sidecar admission report: not present for this path; public rejection diagnostics are the RPC response above.');
    }
  }
}
lines.push('','## Runtime provenance and explorer policy','','The reports preserve actual client/version metadata and rule-model limitations. The sidecar does not attest its deployed commit; reviewed source is not proof of binary identity. Full rule checks, signatures and receipt objects remain in the local evidence artifacts. No explorer URL is generated: this repository does not pin a verified public transaction-explorer URL for these devnet captures. Returned and computed-only hashes are deliberately separate. No swap, USDC reimbursement or mainnet behavior is claimed.','');
const output=lines.join('\n');if(process.argv.includes('--check')){if((await readFile('docs/LIVE_EVIDENCE.md','utf8')).replaceAll('\r\n','\n')!==output)throw new Error('Evidence guide is stale');console.log('Committed evidence guide matches');}else{await writeFile('docs/LIVE_EVIDENCE.md',output);console.log('Generated docs/LIVE_EVIDENCE.md from committed evidence');}
