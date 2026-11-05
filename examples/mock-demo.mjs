import { createServer } from 'node:http';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { selectCases } from '../src/selection.mjs';
import { runSuite } from '../src/runner.mjs';
import { saveReport } from '../src/reports.mjs';

export async function runMockDemo(resultDir = 'runs') {
  const servers = [], rpcUrls = {};
  try {
    for (const pathId of ['public', 'alt']) {
      const hashes = new Set();
      const server = createServer(async (req, res) => {
        try {
          const chunks = []; for await (const chunk of req) chunks.push(chunk);
          const { id, method, params } = JSON.parse(Buffer.concat(chunks));
          const response = { jsonrpc: '2.0', id };
          if (method === 'eth_chainId') response.result = '0x539';
          else if (method === 'eth_getTransactionReceipt') response.result = hashes.has(params[0]) ? { transactionHash: params[0], status: '0x1', blockNumber: '0x1', gasUsed: '0x5208' } : null;
          else if (method === 'eth_sendFrameTransaction') {
            const { model } = JSON.parse(Buffer.from(params[0].slice(2), 'hex').toString());
            const rule = model.verificationGasLimit > 100000 ? 'MockVerificationGasLimit'
              : model.poolRead && (pathId === 'public' || model.kind === 'unstaked-pool-read') ? 'MockForeignStorage' : null;
            if (rule) response.error = { code: -32000, message: rule };
            else { response.result = `0x${createHash('sha256').update(params[0]).digest('hex')}`; hashes.add(response.result); }
          } else response.error = { code: -32601, message: 'method not found' };
          res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify(response));
        } catch { res.writeHead(400); res.end('invalid mock request'); }
      });
      await new Promise(resolve => server.listen(0, '127.0.0.1', resolve)); servers.push(server);
      rpcUrls[pathId] = `http://127.0.0.1:${server.address().port}`;
    }
    const cases = await selectCases({ scenario: 'uniswap-v4-paymaster', adapterFile: fileURLToPath(new URL('./mock-adapter.mjs', import.meta.url)), rulesFile: fileURLToPath(new URL('./mock-rules.json', import.meta.url)) });
    const output = await runSuite(cases, { rpcUrls, allowChainId: 1337, submit: true, receiptWaitMs: 20, evidenceSource: 'MOCK' });
    const evidence = await saveReport(output, resultDir);
    return { source: output.source, totals: output.totals, evidence };
  } finally { await Promise.all(servers.map(server => new Promise(resolve => server.close(resolve)))); }
}
