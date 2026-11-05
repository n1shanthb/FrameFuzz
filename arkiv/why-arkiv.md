# Why Arkiv

FrameFuzz developers need to share rule-relevant inputs across clients and sidecars. A useful regression case carries the seed, semantic mutation, target implementation, expected path behavior and provenance. A transaction hash or pass/fail log alone cannot regenerate that scenario with fresh nonce/state/signatures.

Local JSON is useful for private iteration but stays on one developer's machine and has no shared discovery index or chain-recorded ownership. GitHub remains valuable for review, source and permanent historical evidence; finding a fixture across repositories still requires knowing where to look, downloading the right files and understanding their layout. Arkiv provides a common public schema searchable by suite/rule/implementation, wallet-owned records with immutable creator identity, and explicit expiry for cases tied to changing devnet rules and deployments.

Expiration gives a fixture a bounded discovery lifetime so stale assumptions stop being offered as community replays. The original Git history remains the long-lived audit trail. Wallet ownership supports attribution and optional owner filters; it does not prove correctness or replace review. An expiring registry complements GitHub rather than claiming to replace it.

The Arkiv entity stores the runnable semantic descriptor itself and indexed discovery metadata. FrameFuzz retrieves it independently of local caches, checks integrity and schema, then feeds it to the existing pure mutation generator. This makes Arkiv part of fixture exchange and reproduction, beyond storing results. Full raw historical evidence remains offchain, honestly identified by digest.
