export type CapabilityMode = 'LIVE_READ_ONLY' | 'LIVE_AUTHORIZED' | 'SAVED_DEMO' | string;

export interface AppConfig {
  offlineDemo?: boolean;
  submitEnabled?: boolean;
  allowChainId?: number | null;
  rpcConfigured?: boolean;
  running?: boolean;
  capabilities?: {
    mode?: CapabilityMode;
    credentials?: Record<string, boolean>;
  };
  endpoints?: Record<string, string>;
  mutations?: { suites?: string[]; maxLiveVariants?: number };
  scenarios?: Array<{ id: string; label: string }>;
}

export interface PlaygroundConfig {
  compiler?: string;
  canStart?: boolean;
  liveAuthorized?: boolean;
  liveOperatorKeyConfigured?: boolean;
  chainBroadcastEnabled?: boolean;
  capabilityMode?: CapabilityMode;
  offlineDemo?: boolean;
  model?: string;
  transport?: string;
  arkivOperatorConfigured?: boolean;
  sprintBudget?: { capUSD: number; spentUSD: number; remainingUSD: number; sprintId?: string };
  investigationBudget?: { byoc?: { allocatedUSD?: number; estimatedFinishUSD?: number; blockers?: string[] } };
  investigationReadiness?: { canStart?: boolean; blockers?: string[]; notice?: string; openRouterKeyPresent?: boolean; mode?: string };
  supportedScenario?: SupportedScenario;
}

export interface SupportedScenario {
  id: string;
  label: string;
  kind: string;
  sourceFile: string;
  contractName: string;
  companion?: string;
  compiler?: string;
  sourceDigest?: string;
  runtimeBytecodeTemplateHash?: string;
  fixtures?: { wallet: string; foreign: string; owner: string; stakingRegistry?: string };
  source?: string;
  notice?: string;
}

export interface Analysis {
  status: string;
  analysisId?: string;
  sourceDigest?: string;
  contractName?: string;
  compiler?: string;
  contracts?: string[];
  detectedRole?: { role: string; basis?: string };
  capabilities?: string[];
  missingPrerequisites?: string[];
  functions?: unknown[];
  diagnostics?: Array<{ severity?: string; message?: string }>;
  runtimeBytecodeHash?: string;
  arkivDiscovery?: ArkivDiscovery;
  limitations?: string[];
  source?: string;
}

export interface ArkivDiscovery {
  status?: string;
  cases?: ArkivCase[];
  notice?: string;
  broadcasts?: number;
  source?: string;
}

export interface ArkivCase {
  entityKey: string;
  suite?: string;
  ruleId?: string;
  publisher?: string;
  contentDigest?: string;
  expiresAtBlock?: string;
  replayAllowed?: boolean;
  relevance?: { score?: number; reasons?: string[] };
  verification?: Record<string, string>;
}

export interface LiveAdmission {
  classification?: string;
  blockers?: string[];
  deployment?: { status?: string; wallet?: string; foreign?: string; bound?: boolean; boundMode?: string; codeHash?: string };
  stake?: { status?: string; amountWei?: string; unstakeDelay?: number };
  nonce?: number | null;
  canonical?: { status?: string; clientVersion?: string; url?: string };
  alternative?: { status?: string; clientVersion?: string; url?: string; skandhaInfo?: unknown };
}

export interface AdmissionReadiness {
  classification?: string;
  blockers?: string[];
  liveAdmission?: LiveAdmission;
  publicEndpoint?: { url?: string; submissionMethod?: string; clientVersion?: string };
  alternativeEndpoint?: { url?: string; submissionMethod?: string; clientVersion?: string };
  supportedFrameRole?: string;
  primaryOutput?: string;
}

export interface LivePrepared {
  id: string;
  state: string;
  candidate: {
    hash: string;
    wallet: string;
    nonce: number;
    mutation: string;
    sourceDigest: string;
  };
  approvalPacket?: {
    maximumFeeExposureEth?: number;
    writes?: string[];
    note?: string;
  };
  readiness?: LiveAdmission;
  notice?: string;
}

export interface ComparisonRow {
  mutation: string;
  canonicalVerdict?: string;
  publicVerdict?: string;
  publicReason?: string;
  alternativeVerdict?: string;
  admissionId?: number | string | null;
  divergence?: string;
  policyDivergence?: boolean;
  inclusion?: string | null;
  inclusionStatus?: string;
  claims?: {
    ADMISSION_DIVERGENCE?: boolean;
    INCLUSION?: boolean;
    EXECUTION_SUCCESS?: string;
  };
  evidence?: {
    hash?: string;
    transactionHash?: string;
    sourceDigest?: string;
    wallet?: string;
    sidecarAdmissionId?: number | string | null;
    rule?: string;
    timestamp?: string;
    gasPaid?: string | null;
    provenance?: string;
    laterMempoolOutcome?: string | null;
    rpc?: unknown;
  };
}

export interface LiveComparison {
  provenance?: string;
  observedAt?: string;
  transactionIdentity?: string;
  divergence?: string;
  canonical?: { status?: string; message?: string; errorClass?: string };
  alternative?: { status?: string; hash?: string; message?: string };
  alternativeReport?: { admission?: { id?: number; outcome?: string; checks?: Array<{ rule?: string; verdict?: string }> } };
  inclusion?: { blockNumber?: string | null; gasUsed?: string | null; status?: string | null } | null;
  inclusionStatus?: string;
  claims?: ComparisonRow['claims'];
  laterMempoolOutcome?: string | null;
  table?: ComparisonRow[];
  endpoints?: { canonical?: string; alternative?: string };
}

export interface CapturedUniswapEvidence {
  id: string;
  provenance: 'CAPTURED_LIVE_EVIDENCE';
  capturedAt?: string;
  chainId: number;
  transactionIdentity: string;
  mutation?: string;
  canonical: { status: string; rule?: string; raw?: { message?: string } };
  alternative: { status: string; admissionId?: number; report?: { admission?: { checks?: Array<{ rule?: string; verdict?: string }> } } };
  inclusion: { status?: string; receipt?: { status?: string; blockNumber?: string; gasUsed?: string; frameReceipts?: Array<{ status?: string; gasUsed?: string }> } };
  claims?: ComparisonRow['claims'];
  frameSummary: { successful: number; total: number };
  source?: { sha256?: string; compiler?: string; settings?: unknown };
  bindings?: { paymaster?: string; stateView?: string; poolId?: string };
  evidencePath?: string;
  notice?: string;
}

export interface RunSummary {
  id: string;
  source?: string;
  capturedAt?: string;
  totals?: { cases?: number; matched?: number; unexpected?: number };
}
