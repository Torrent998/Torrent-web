# The backing invariant

The contract enforces one rule on every pool, after every change:

```
reserved <= funded - claimed - withdrawn      and      reserved >= 0
```

In words: the value reserved for unclaimed rights can never exceed the tokens the contract still holds for that pool.

## The four totals

All values are integers in token base units.

| Total | Changes when | Direction |
|---|---|---|
| `funded` | `deposit` | up by the deposited amount |
| `reserved` | `issue_right` (up), `claim` (down) | up by a right's amount, down when it is claimed |
| `claimed` | `claim` | up by the claimed amount |
| `withdrawn` | `withdraw_unreserved` | up by the withdrawn amount |

Two derived values matter:

* **held** = `funded - claimed - withdrawn`. Tokens still in escrow for the pool.
* **unreserved** = `held - reserved`. Held tokens that back no right. Returned by `get_unreserved`.

The pool is *fully backed* when `unreserved >= 0`. The contract never lets it go negative.

## Where it is enforced

All changes to totals go through one function, `save_totals`. It calls `assert_backed` before writing. There is no code path that changes the totals without this check, and tokens are only transferred after it passes (checks, then effects, then interaction).

| Call | What it does to the totals | Fails with `InsufficientBacking` when |
|---|---|---|
| `deposit` | `funded += amount` | never (raising `funded` can only help) |
| `issue_right` | `reserved += amount` | `reserved + amount > held` |
| `withdraw_unreserved` | `withdrawn += amount` | `withdrawn + amount` leaves `held < reserved` |
| `claim` | `reserved -= amount`, `claimed += amount` | never for a valid claim: both sides drop by the same amount |

Arithmetic uses checked operations. Overflow returns the `Overflow` error instead of wrapping.

## Why claims always work

A claim reduces `reserved` and increases `claimed` by the same amount, so `held` and `reserved` both fall by that amount and the rule stays true. This is why `claim` is allowed while the pool is paused or closed. Pausing can stop new risk entering. It can never trap money that backs a right.

## What the invariant does not do

* It does not make members deposit. It guarantees that *issued* rights are backed.
* It does not protect against a malicious token contract. A pool trusts the one token it was created with.
* It is not a proof of anything about real-world value. Tokens on Testnet have none.

The rule is checked by the contract's tests, including a property test, and by the indexer, which recomputes the totals from events and compares them with `get_totals` during [reconciliation](../indexer/reconciliation.md). A concrete run is in the [worked example](worked-example.md).
