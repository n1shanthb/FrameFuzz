# Reach and validation

This is a developer tool for execution-client, mempool/sidecar, paymaster and EIP-8141 compatibility testing. A developer can find a fixture by suite, rule or implementation version without knowing the original author's repository layout, then inspect publisher/owner and regenerate the semantic case locally.

Measured in this implementation: **one real published entity**, retrieved by a fresh CLI process and a separately started dashboard server, and imported into unsigned replay previews. The real demo involves one writer wallet; no independent external developer adoption has been measured. Automated cross-owner fixtures verify the protocol is not tied to that wallet. No user testimonials, active-user numbers or community adoption are claimed.

The user-facing distribution surface is FrameFuzz's existing dashboard Community Cases view and its `arkiv query`, `fetch` and `import` commands. Read access is public and unsigned. Current owner and immutable publisher are visible; readers are explicitly shown as anonymous public readers unless an optional read-only wallet label is configured. That label is not authentication.

Potential future validation is to invite a second developer to publish a different rule fixture and discover/import it from another checkout. That activity has not been performed and is not part of the recorded success claim.
