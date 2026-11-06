# What Torrent is

Torrent lets a group of people run a savings circle on Stellar with one hard rule: **no payout right exists unless the money behind it is locked in the contract.**

## The idea in three sentences

1. A group (a *circle*) agrees on rules. The hash of those rules is written on-chain when the pool is created, so nobody can change them later without everyone noticing.
2. Members deposit tokens into the contract. The contract keeps a running total of what was funded, what is reserved for payout rights, what was claimed and what was withdrawn.
3. The organizer issues *payout rights*. Each right reserves a slice of funded value and unlocks on a date. A right can be handed to another member before that date, with both people signing, and claimed by whoever owns it afterwards.

## What it is not

* It is not a lending product. Nobody borrows against future contributions.
* It does not create money or yield. Trading a right moves the *timing* of a payout between members. The amount stays the same.
* It does not guarantee anything about the real world. A transaction on Stellar does not by itself make a legal claim. The legal and consumer-protection questions around transferable payout rights are open and have not been reviewed.
* It is not production software. It runs on Testnet with synthetic tokens and has no audit.

## Who uses it

| Role | What they do |
|---|---|
| **Organizer** (the pool *controller*) | Creates the circle and the on-chain pool, invites members, issues payout rights, can pause or close the pool. Cannot take reserved money. |
| **Member** | Joins the pool by signing the policy hash, deposits, receives rights, trades rights, claims at maturity, can leave when owning no open right. |
| **Auditor** | Reads the audit trail and the ledger-derived numbers for a circle. Cannot change anything. |
| **Contract admin** | Can only rotate itself and manage timelocked upgrades. Has no power over any pool. |

## Why Stellar and Soroban

* **Native token interface.** The contract moves any Stellar token through the standard token client. On Testnet the pool used the native XLM asset contract.
* **Authorization built into the platform.** Each sensitive call requires the right account to sign (`require_auth`). A transfer needs two signatures from two accounts in two separate transactions. There is no custom signature scheme to get wrong.
* **Events and cheap reads.** Every state change emits an event, so an indexer can rebuild the whole state from the ledger and compare it with the contract.

The backing rule is the reason a smart contract is needed at all. A spreadsheet can track a circle. Only a contract can refuse to issue an unbacked right.
