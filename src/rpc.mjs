export class RpcResponseError extends Error {
  constructor(code, message, data) {
    super(String(message ?? 'JSON-RPC request rejected'));
    this.name = 'RpcResponseError';
    this.code = code;
    this.data = data;
  }
}

export async function rpc(url, method, params = [], { timeoutMs = 15000, fetchImpl = fetch } = {}) {
  let response;
  try {
    response = await fetchImpl(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (cause) {
    const error = new Error(`Transport error calling ${method}: ${cause.message}`);
    error.name = 'TransportError';
    error.cause = cause;
    throw error;
  }
  if (!response.ok) {
    const error = new Error(`HTTP ${response.status} calling ${method}`);
    error.name = 'TransportError';
    throw error;
  }
  let data;
  try { data = await response.json(); }
  catch { const error = new Error('RPC returned non-JSON response'); error.name = 'TransportError'; throw error; }
  if (data?.error && typeof data.error === 'object') {
    throw new RpcResponseError(data.error.code, data.error.message, data.error.data);
  }
  if (!Object.hasOwn(data ?? {}, 'result')) {
    const error = new Error(`Malformed JSON-RPC response for ${method}`);
    error.name = 'TransportError';
    throw error;
  }
  return data.result;
}

export async function getChainId(url, options = {}) {
  const result = await rpc(url, 'eth_chainId', [], options);
  if (typeof result !== 'string' || !/^0x[0-9a-f]+$/i.test(result)) throw new Error('Invalid chain ID from RPC');
  return Number.parseInt(result, 16);
}

export async function getReceipt(url, hash, { pollMs = 800, waitMs = 0, timeoutMs = 12000 } = {}) {
  const deadline = Date.now() + waitMs;
  do {
    try {
      const receipt = await rpc(url, 'eth_getTransactionReceipt', [hash], { timeoutMs });
      if (receipt) return {
        state: receipt.status === '0x1' ? 'included_success' : receipt.status === '0x0' ? 'included_reverted' : 'included_unknown',
        blockNumber: receipt.blockNumber ?? null,
        transactionHash: receipt.transactionHash ?? hash,
        status: receipt.status ?? null,
        gasUsed: receipt.gasUsed ?? null,
      };
    } catch (error) {
      return { state: 'receipt_rpc_error', message: error.message };
    }
    if (Date.now() >= deadline) break;
    await new Promise(resolve => setTimeout(resolve, Math.min(pollMs, Math.max(0, deadline - Date.now()))));
  } while (true);
  return { state: waitMs > 0 ? 'not_included_before_timeout' : 'not_checked' };
}

export function sanitizedRpcLabel(url) {
  try { const x = new URL(url); return `${x.protocol}//${x.hostname}${x.port ? `:${x.port}` : ''}`; }
  catch { return '[unrecognized endpoint]'; }
}
