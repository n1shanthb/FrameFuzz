import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { encodeFunctionData, parseEther } from "viem";
import * as lib from "@forshtat/hegota-support/tx";
import { loadConfig } from "../src/lib/config.js";
import { deployContract, getStake } from "../src/lib/contracts.js";
import { getBalance } from "../src/lib/chain.js";
import { ensureParticipantKey } from "../src/lib/state.js";
import { buildPaymasterTx, signFrameTx, txHash } from "../src/lib/frameTx/build.js";
import { profile } from "../src/lib/frameTx/profile.js";
import { sendFrameTx, sendRawFrameTx, explainRejection } from "../src/lib/frameTx/send.js";
import { getAdmission } from "../src/lib/explorer.js";
import { rpc } from "../src/lib/rpc.js";
import { StepError } from "../src/lib/output.js";

const STATE_VIEW = "0xd89a052862AaA34f0B6cc7f3B6a9D080584a43FB";
const POOL_ID = "0x784bd7879f8155eda79b7834d53c2f19ace60aed221fe33ef03ce660eff60648";
const ADD_STAKE_ABI = [{ type: "function", name: "addStake", stateMutability: "payable", inputs: [{ type: "uint32" }], outputs: [] }] as const;

async function submit(label: string, tx: Awaited<ReturnType<typeof signFrameTx>>, path: "alt" | "raw") {
  const h = txHash(tx);
  try {
    const r = path === "alt" ? await sendFrameTx(tx) : await sendRawFrameTx(tx);
    const adm = await getAdmission(r);
    const receipt = await rpc(loadConfig().gatewayUrl, "eth_getTransactionReceipt", [r]);
    return { label, path, ok: true, hash: r, computed: h, admission: adm?.outcome, receipt: receipt?.status ?? null };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { label, path, ok: false, computed: h, error: msg, rule: e instanceof StepError ? explainRejection(msg).rule : undefined };
  }
}

async function pair(name: string, pm: `0x${string}`, data: `0x${string}`) {
  const cfg = loadConfig();
  const sk = generatePrivateKey();
  const base = buildPaymasterTx({
    from: privateKeyToAccount(sk).address,
    paymaster: pm,
    to: cfg.recipient,
    nonce: 0n,
    chainId: cfg.chainId,
    maxFeePerGas: cfg.maxFeePerGasWei,
  });
  if (data !== "0x") base.frames[1].data = data;
  const tx = await signFrameTx(base, sk);
  return { name, alt: await submit(name, tx, "alt"), canonical: await submit(name, tx, "raw") };
}

async function stakePaymaster(pm: `0x${string}`, signerKey: `0x${string}`) {
  const cfg = loadConfig();
  const nonce = BigInt(await rpc(cfg.gatewayUrl, "eth_getTransactionCount", [pm, "latest"]));
  const tx = await signFrameTx(
    lib.newTx({
      chainId: cfg.chainId,
      sender: pm,
      nonceSeq: nonce,
      frames: [
        lib.frame(profile, "VERIFY", { scope: "EXECUTION_AND_PAYMENT", target: null, execution: 80_000n, data: "0x02" }),
        lib.frame(profile, "SENDER", {
          target: cfg.stakingRegistry,
          execution: 150_000n,
          state: 300_000n,
          value: cfg.stakeWei,
          data: encodeFunctionData({ abi: ADD_STAKE_ABI, functionName: "addStake", args: [cfg.unstakeDelaySec] }),
        }),
      ],
      signatures: [lib.secp256k1Placeholder(profile, privateKeyToAccount(signerKey).address)],
      fees: { maxFeePerGas: cfg.maxFeePerGasWei },
    }),
    signerKey
  );
  return submit("stake", tx, "alt");
}

async function main() {
  const cfg = loadConfig();
  const participantKey = ensureParticipantKey();
  const fund = parseEther("0.15");
  const plain = await deployContract("SponsorPaymaster", [], fund);
  const reserve = await deployContract("ReserveReadingPaymaster", [STATE_VIEW, POOL_ID], fund);

  const plainResult = await pair("plain", plain, "0x");
  const reserveUnstaked = await pair("reserve-unstaked", reserve, "0x01");
  const stakeResult = await stakePaymaster(reserve, participantKey);
  const reserveStaked = await pair("reserve-staked", reserve, "0x01");

  let plainReceipt: unknown = null;
  if (plainResult.alt.ok && plainResult.alt.hash) {
    const deadline = Date.now() + 120_000;
    while (Date.now() < deadline) {
      plainReceipt = await rpc(cfg.gatewayUrl, "eth_getTransactionReceipt", [plainResult.alt.hash]);
      if (plainReceipt) break;
      await new Promise((r) => setTimeout(r, 3000));
    }
  }

  const replacer = (_k: string, v: unknown) => (typeof v === "bigint" ? v.toString() : v);
  console.log(
    JSON.stringify(
      {
        gateway: cfg.gatewayUrl,
        plainPaymaster: plain,
        reservePaymaster: reserve,
        balances: { plain: (await getBalance(plain)).toString(), reserve: (await getBalance(reserve)).toString() },
        plainResult,
        reserveUnstaked,
        stakeResult,
        registryStake: await getStake(reserve),
        reserveStaked,
        plainReceipt,
      },
      replacer,
      2
    )
  );
}

main();
