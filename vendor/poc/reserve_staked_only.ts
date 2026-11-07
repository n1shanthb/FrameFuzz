import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { loadConfig } from "../src/lib/config.js";
import { buildPaymasterTx, signFrameTx } from "../src/lib/frameTx/build.js";
import { sendFrameTx, sendRawFrameTx, explainRejection } from "../src/lib/frameTx/send.js";
import { getAdmission } from "../src/lib/explorer.js";
import { rpc } from "../src/lib/rpc.js";
import { StepError } from "../src/lib/output.js";

const PM = "0x552e75d45ee70f09ff69f465ddc4264e6ee31396" as const;

async function go(path: "alt" | "raw", tx: Awaited<ReturnType<typeof signFrameTx>>) {
  try {
    const h = path === "alt" ? await sendFrameTx(tx) : await sendRawFrameTx(tx);
    const adm = await getAdmission(h);
    const rc = await rpc(loadConfig().gatewayUrl, "eth_getTransactionReceipt", [h]);
    return { ok: true, h, admission: adm?.outcome, receipt: rc?.status ?? null };
  } catch (e) {
    const m = e instanceof Error ? e.message : String(e);
    return { ok: false, error: m, rule: e instanceof StepError ? explainRejection(m).rule : undefined };
  }
}

async function main() {
  const cfg = loadConfig();
  const sk = generatePrivateKey();
  const base = buildPaymasterTx({
    from: privateKeyToAccount(sk).address,
    paymaster: PM,
    to: cfg.recipient,
    nonce: 0n,
    chainId: cfg.chainId,
    maxFeePerGas: cfg.maxFeePerGasWei,
  });
  base.frames[1].data = "0x01";
  const tx = await signFrameTx(base, sk);
  console.log(JSON.stringify({ alt: await go("alt", tx), canonical: await go("raw", tx) }, null, 2));
}

main();
