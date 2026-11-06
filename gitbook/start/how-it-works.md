# How it works, step by step

This is the full path of one circle. Each step names the contract function behind it. Details are in the [function reference](../contract/functions.md).

## 1. The organizer writes the rules and creates the circle

The organizer signs in with a wallet and creates a *circle* in the API. A circle is an off-chain agreement:

```json
{
  "tokenContractId": "CAEQSCIJBEEQSCIJBEEQSCIJBEEQSCIJBEEQSCIJBEEQSCIJBEEQTD2L",
  "maxMembers": 4,
  "rounds": 3,
  "roundLengthDays": 30,
  "contributionAmount": "100",
  "transferPolicy": "MEMBERS_ONLY"
}
```

The API computes the SHA-256 of this rule set in canonical form (sorted keys, no whitespace). That 32-byte value is the **policy hash**. The example above hashes to `7272969df90dacd6781c3cfd5c7af0f912ee712bfc686e971f75722540c18f6a`. You can reproduce it with the [code sample](../developers/code-samples.md).

## 2. The organizer creates the on-chain pool

`create_pool(controller, token, membership_policy_hash)` creates a pool with status `Active` and emits `pool_created`. The API binds the circle to the pool by matching the policy hash in that event. The pool's rules are now fixed by the hash.

## 3. Members are allowed in, then consent

* `allow_member(pool_id, member)`: the controller adds an address to the allow-list. Only possible **before the first deposit**.
* `join_pool(pool_id, member, signed_policy_hash)`: the member signs a call that carries the policy hash. If it differs from the pool's hash the call fails with `PolicyMismatch`. This is the member's consent to the rules.

After the first deposit the allow-list is frozen. Nobody can be added or removed by the controller any more.

## 4. Members deposit

`deposit(pool_id, from, amount)` moves tokens into the contract. The contract compares its token balance before and after and fails with `DepositMismatch` if the amount that arrived differs from the amount requested. It then increases `funded` and emits `funded`.

## 5. The organizer issues payout rights

`issue_right(pool_id, owner, amount, maturity, policy_hash)` creates a right worth `amount` that unlocks at `maturity` (Unix seconds). It adds `amount` to `reserved`. If that would break the backing rule, the call fails with `InsufficientBacking` and nothing changes.

## 6. A member can hand over a right before it matures

Trading a right needs two signatures in two transactions:

1. The current owner calls `propose_transfer(right_id, new_owner, expiry)`. The expiry must be in the future and not later than the right's maturity.
2. The new owner calls `accept_transfer(transfer_id)`. The transfer id works once. The contract re-checks that the owner has not changed, that the offer has not expired and that the right has not matured.

The owner can withdraw an open offer with `cancel_transfer(transfer_id)`. A right that has matured can no longer be traded.

## 7. At maturity the owner claims

`claim(right_id, recipient)` pays the right's amount to `recipient`. It moves the amount from `reserved` to `claimed`, marks the right `Claimed` and voids any open offer. A right can be claimed once. Claims work even while the pool is paused.

## 8. Leftovers and closing

* `withdraw_unreserved(pool_id, to, amount)`: the controller recovers only money that backs no right.
* `leave_pool(pool_id, member)`: a member can leave when they own no unclaimed right.
* `close_pool(pool_id)`: permanent. After closing nothing new can enter, but every issued right stays claimable and unreserved money stays withdrawable. Closing never confiscates.

## What the app adds

You do not call these functions by hand. The API turns each action into an *intent*: a description of exactly one contract call. It checks the action against the indexed ledger state first, so nobody signs a call that is certain to fail. The wallet signs, the API verifies the signed transaction matches the intent and submits it, and the intent only counts as done when the indexer shows the matching event. See [Intents and signing](../api/intents.md).
