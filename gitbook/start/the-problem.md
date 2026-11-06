# The problem

Rotating savings circles exist in many places under many names: ajo, esusu, susu, tanda, chit fund. The shape is the same. A fixed group pays a fixed amount every round. Each round one member takes the whole pot. After the last round everyone has paid in and received the same total.

## Where the trust sits

The member who is paid in round 1 receives money that, at that moment, the group has only partly contributed. Their remaining payments are promises. Members paid later hold a claim on money that has not been collected yet. If someone stops paying, the loss lands on the people who were paid last.

Two practical problems follow:

* **Late recipients carry the risk.** Their claim is only as good as the future behaviour of the others.
* **Timing is rigid.** A member who needs the pot earlier, or can wait longer, has no clean way to swap their place. Swaps happen by private agreement, with no record and no enforcement.

## What Torrent changes

Torrent changes one thing. A payout right is only created when the contract already holds the money for it. The rule the contract enforces after every state change is:

```
reserved <= funded - claimed - withdrawn
```

Every right that exists is therefore covered by tokens in escrow. A member holding a right does not depend on anyone else paying later. A right is also a plain object the contract tracks, so it can be handed to another member with a recorded, two-signature transfer.

The full rule, with numbers from a real Testnet pool, is in [The backing invariant](../concepts/backing-invariant.md).

## What this page does not claim

This page cites no market-size figure. We have not verified a current number we are willing to publish, and an unverified statistic is worse than none. For background on informal savings clubs, see the World Bank's [Global Findex 2017 report](https://documents1.worldbank.org/curated/en/332881525873182837/pdf/126033-PUB-PUBLIC-pubdate-4-19-2018.pdf), which discusses saving with savings clubs. Check the latest Findex edition before quoting any figure.

Torrent also does not remove every risk. A funded circle still depends on members funding it. If nobody deposits, nothing can be issued. The contract guarantees that *issued* rights are backed. It does not make people deposit.
