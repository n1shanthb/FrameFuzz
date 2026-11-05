// Evidence is allowlisted at adapter boundaries and scrubbed again on export.
export function redact(value) {
  if (typeof value === 'string') return value
    .replace(/https?:\/\/[^\s"<>]+/gi, match => { try { const u = new URL(match); return `${u.protocol}//${u.host}/[redacted-path]`; } catch { return '[redacted-url]'; } })
    .replace(/\b(?:private[_ -]?key|secret|token|password|mnemonic)\s*[:=]\s*\S+/gi, '[redacted-credential]');
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value)
    .filter(([key]) => !/private.?key|secret|token|password|mnemonic|authorization/i.test(key))
    .map(([key, item]) => [key, redact(item)]));
  return value;
}

export function assertTestChain(chainId, allowed) {
  if (chainId === 1) throw new Error('SAFETY STOP: mainnet submissions are disabled');
  if (!Number.isSafeInteger(allowed) || allowed <= 0 || chainId !== allowed) throw new Error(`SAFETY STOP: RPC is chain ${chainId}, but --allow-chain is ${allowed}`);
}
