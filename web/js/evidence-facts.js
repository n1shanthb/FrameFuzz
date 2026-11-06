// Generated from immutable evidence and docs/TEST_CHECKPOINT.json.
export const EVIDENCE_FACTS = {
  "schema": "framefuzz.briefing-facts.v1",
  "classification": "HISTORICAL_EVIDENCE_DERIVED",
  "sources": {
    "evidence/arkiv/2026-11-06/publish.json": "5897d4c72d6aca28dd811dfc586ee1cc9003fad50a282d9dd82e819daa5efffa",
    "evidence/integrated/2026-11-06/arkiv-publish.json": "f008a07156280c4f83c3bed3b10ea9311887c150759b2a14f29288c53f6d4323",
    "evidence/investigator/2026-11-06/sonnet-retry-2.json": "5e01019328a86a93428d4b7714b138ba2140e2de43b3c89a2e83ba94bc34cd52",
    "evidence/live/2026-11-06/2026-11-05T22-04-27-896Z-LIVE_RPC_SUBMISSION-3a838bca.json": "c473950c4697551408e406a2f32cdd4738c22c3a26bc0044a4d5ee8d0c0468a6",
    "evidence/mutations/2026-11-06/2026-11-05T22-41-59-129Z-LIVE_RPC_SUBMISSION-947a7e01.json": "de690539fac4b65b5047141d592bd8cef44ef3991a030d6912c730ae08ee2972"
  },
  "gas": {
    "capturedAt": "2026-11-05T22:40:15.811Z",
    "variants": 7,
    "decisions": 14,
    "matches": 14,
    "included": 8,
    "components": {
      "payer": 67200,
      "sender": 30000,
      "signature": 2800,
      "total": 100000,
      "cap": 100000
    },
    "samples": [
      {
        "value": 67199,
        "region": "below",
        "outcome": "accepted"
      },
      {
        "value": 67200,
        "region": "at",
        "outcome": "accepted"
      },
      {
        "value": 67201,
        "region": "above",
        "outcome": "rejected"
      }
    ]
  },
  "uniswap": {
    "capturedAt": "2026-11-05T22:04:27.052Z",
    "stateViewRead": "VALIDATION_TIME_GET_SLOT0",
    "rows": [
      {
        "id": "basic-baseline-50000",
        "paths": [
          {
            "id": "public",
            "admission": "accepted",
            "receipt": "included_success",
            "hash": "0x3a61f84bef43dee398ce5e1ec17c9cc8b9e6d498a33fef9ff44011c4b334ec84"
          },
          {
            "id": "alt",
            "admission": "accepted",
            "receipt": "included_success",
            "hash": "0xb810446fcc43d674db0faae8c6e833976a4f3344c418cdb1a2fbb7fe5b35cc6a"
          }
        ]
      },
      {
        "id": "unstaked-baseline-50000",
        "paths": [
          {
            "id": "public",
            "admission": "rejected",
            "receipt": "not_checked",
            "hash": null
          },
          {
            "id": "alt",
            "admission": "rejected",
            "receipt": "not_checked",
            "hash": null
          }
        ]
      },
      {
        "id": "staked-baseline-50000",
        "paths": [
          {
            "id": "public",
            "admission": "rejected",
            "receipt": "not_checked",
            "hash": null
          },
          {
            "id": "alt",
            "admission": "accepted",
            "receipt": "included_success",
            "hash": "0xbb9143eb2964bdc4de9d59f15404baf14f59465f0ac0f5d5903dfa0173741b6c"
          }
        ]
      }
    ]
  },
  "arkiv": {
    "publications": [
      {
        "entityKey": "0x5393e97dda9fec992ad4e792127064fcd17efb30572368a7ea1abbe7326db2e1",
        "hash": "0x0158db1bec0a20a8671ba18d0d9776b437a6a5cdb18970948a6c51d8fe5e8388",
        "block": "267241",
        "publisher": "0xd4A81a21dBfb0f90b814404Fa64A2e4C8166C715"
      },
      {
        "entityKey": "0x6779cf38a4398eb90da94b11885e691b84a6bb09dda59974cf5b8f1a21db773e",
        "hash": "0x44f0084455b54724624fffd3e2c186986146d316c5d6bf27207409872acc9ec2",
        "block": "268363",
        "publisher": "0xd4A81a21dBfb0f90b814404Fa64A2e4C8166C715"
      }
    ],
    "currentAvailability": "NOT_CHECKED"
  },
  "sonnet": {
    "calls": 4,
    "experiments": 2,
    "replayed": 2,
    "executionClass": "OFFLINE_SIGNATURE_BINDING",
    "liveValidatorExecution": false
  },
  "testCheckpoint": {
    "schema": "framefuzz.test-checkpoint.v1",
    "command": "npm test",
    "passed": 158,
    "failed": 0,
    "skipped": 0,
    "observedAt": "2026-11-06",
    "scope": "Node suite; browser validation reported separately"
  }
};
