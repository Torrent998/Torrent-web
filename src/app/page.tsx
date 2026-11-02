import Link from "next/link";

export default function Home() {
  return (
    <div className="grid gap-6">
      <h1 className="text-3xl font-bold">Ownership of when money becomes available</h1>
      <p className="max-w-2xl text-lg">
        Torrent lets verified members of a savings circle exchange the timing of a payout, but only for payout rights that are <strong>fully backed</strong>:
        an equal amount is actually locked in a Soroban escrow contract on Stellar before any right exists.
      </p>
      <ul className="max-w-2xl list-disc pl-6">
        <li>Coverage, ownership and balances shown here come from the ledger, never from this app&rsquo;s own records.</li>
        <li>A transaction is shown as settled only after the ledger confirmation is observed.</li>
        <li>You sign with your own wallet. This app never asks for a secret key.</li>
      </ul>
      <p className="max-w-2xl rounded-lg border-2 border-line p-4">
        This is a prototype of a rights market, <strong>not</strong> a guarantee of future unpaid contributions. Testnet and synthetic funds only; transferability may need legal review before any real use.
      </p>
      <p><Link href="/circles" className="inline-block min-h-11 rounded bg-brand px-5 py-3 font-semibold text-black">Open the dashboard</Link></p>
    </div>
  );
}
