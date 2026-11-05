import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { HEX_TRANSACTION } from '../verdict.mjs';

const ADDRESS = /^0x[0-9a-f]{40}$/i;
const NONCE = /^(0|[1-9][0-9]*)$/;

/** Wrap an actual signer plugin. No encoder or key handling is fabricated here.
 * accountFor MUST supply an isolated sender per case/path. A rejected transaction
 * cannot consume a nonce, so blindly incrementing a shared sender is unsafe.
 */
export function createAdapter(plugin) {
  for (const hook of ['accountFor', 'getNonce', 'sign']) if (typeof plugin?.[hook] !== 'function') throw new Error(`Adapter requires ${hook} hook`);
  if (!plugin.id || !['LIVE', 'MOCK'].includes(plugin.mode)) throw new Error('Adapter requires id and explicit LIVE or MOCK mode');
  const senders = new Set(), payloads = new Set();
  let busy = false, poisoned = false;
  return {
    id: plugin.id, mode: plugin.mode,
    async build({ caseId, pathId, rpcUrl, chainId, model, setup }) {
      if (busy) throw new Error('Adapter builds must be serialized');
      if (poisoned) throw new Error('Adapter session failed; create a new session before retrying');
      busy = true;
      try {
        if (!Number.isSafeInteger(chainId) || chainId <= 1) throw new Error('Adapter requires an explicitly checked non-mainnet chain');
        const context = { caseId, pathId, rpcUrl, chainId };
        const account = await plugin.accountFor(context);
        if (!ADDRESS.test(account?.sender ?? '')) throw new Error('accountFor must return a sender address');
        const sender = account.sender.toLowerCase();
        if (senders.has(sender)) throw new Error('Unsafe sender reuse: use isolated accounts per case/path');
        senders.add(sender);
        if (setup) {
          if (typeof plugin.setup !== 'function') throw new Error('Scenario requires adapter setup hook');
          await plugin.setup({ ...context, account, setup: structuredClone(setup) });
        }
        // Query AFTER setup, which may itself consume account nonces.
        const nonce = String(await plugin.getNonce({ ...context, account, blockTag: 'pending' }));
        if (!NONCE.test(nonce)) throw new Error('getNonce must return a nonnegative decimal nonce');
        const signed = await plugin.sign({ ...context, account, sender, nonce, model: structuredClone(model) });
        if (!HEX_TRANSACTION.test(signed?.raw ?? '')) throw new Error('Signer did not return encoded signed transaction bytes');
        const rawKey = signed.raw.toLowerCase();
        if (payloads.has(rawKey)) throw new Error('Signer reused a signed payload');
        payloads.add(rawKey);
        // Never persist account objects, model secrets, or arbitrary signer output.
        return { raw: signed.raw, metadata: { adapter: plugin.id, sender, nonce, chainId, caseId, pathId, mode: plugin.mode } };
      } catch (error) { poisoned = true; throw error; }
      finally { busy = false; }
    },
  };
}

export async function loadAdapter(filename) {
  const module = await import(pathToFileURL(path.resolve(filename)).href);
  if (typeof module.default !== 'function') throw new Error('Adapter module must default-export an async plugin factory');
  return createAdapter(await module.default());
}
