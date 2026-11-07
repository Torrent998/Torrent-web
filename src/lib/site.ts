/**
 * Public, verifiable facts about the project used by the landing page and footer.
 * Keep this honest: no users, partners, metrics, audits or Mainnet claims that do not exist.
 */
export const ORG_URL = "https://github.com/Torrent998";

export interface Repo {
  name: string;
  url: string;
  stack: string;
  role: string;
  boundary: string;
}

export const REPOS: Repo[] = [
  {
    name: "Torrent-contracts",
    url: `${ORG_URL}/Torrent-contracts`,
    stack: "Rust · Soroban",
    role: "Escrow pools, fully backed payout rights, member-only transfers and one-time claims.",
    boundary: "ABI v1 · events v1",
  },
  {
    name: "Torrent-indexer",
    url: `${ORG_URL}/Torrent-indexer`,
    stack: "TypeScript · Stellar RPC",
    role: "Ingests contract events with a durable cursor and rebuilds ledger-derived state; replay and reconciliation.",
    boundary: "Ledger events schema v1",
  },
  {
    name: "Torrent-api",
    url: `${ORG_URL}/Torrent-api`,
    stack: "TypeScript · NestJS · SQLite",
    role: "Circles, invitations, wallet sign-in and the signing-request state machine. Holds no keys and no balances.",
    boundary: "OpenAPI 3.1 v1",
  },
  {
    name: "Torrent-web",
    url: `${ORG_URL}/Torrent-web`,
    stack: "TypeScript · Next.js",
    role: "This app: circle dashboard, coverage, rights, transfers, claims and signing requests.",
    boundary: "Consumes OpenAPI v1",
  },
];

export const WEB_REPO = REPOS[3]!.url;
export const repoFile = (path: string) => `${WEB_REPO}/blob/main/${path}`;
/** Open, scoped Stellar Wave tasks for this repository. */
export const WAVE_ISSUES_URL = `${WEB_REPO}/issues?q=is%3Aissue+is%3Aopen+label%3A%22Stellar+Wave%22`;

export interface Step { n: string; title: string; body: string; onChain: string }
export const STEPS: Step[] = [
  {
    n: "01",
    title: "Create a circle",
    body: "An organizer sets the rules: members, rounds, round length and contribution. The rules are hashed, and that hash is what binds the circle to its on-chain pool.",
    onChain: "create_pool · allow_member · join_pool",
  },
  {
    n: "02",
    title: "Fund the pool",
    body: "Members deposit a supported Stellar asset into the Soroban escrow contract. The pool's funded total only grows when the ledger confirms a deposit.",
    onChain: "deposit",
  },
  {
    n: "03",
    title: "Issue payout rights",
    body: "Each right has a unique id, owner, amount and maturity. The contract refuses to issue a right that is not covered by unreserved escrow.",
    onChain: "issue_right",
  },
  {
    n: "04",
    title: "Transfer or claim",
    body: "Members can swap when they get paid: the owner proposes, the recipient accepts, both sign. At maturity the current owner claims exactly once.",
    onChain: "propose_transfer · accept_transfer · claim",
  },
];

export interface Feature { title: string; body: string; icon: "shield" | "ledger" | "status" | "key" | "swap" | "replay" }
export const FEATURES: Feature[] = [
  { icon: "shield", title: "Funded before issued", body: "Rights can only be minted against tokens already locked in escrow. No right represents a future contribution that has not been paid." },
  { icon: "ledger", title: "Ledger-derived state", body: "Coverage, ownership and balances come from Soroban events reconstructed by the indexer, never from an app database or a client cache." },
  { icon: "status", title: "Honest settlement states", body: "Submitted is not confirmed. A request is shown as settled only after the indexer observes it on the ledger; timeouts reconcile by transaction hash." },
  { icon: "key", title: "Your keys stay yours", body: "Sign in by signing a one-time message. Every request shows the exact contract call before you sign it. The app never asks for a secret key." },
  { icon: "swap", title: "Member-only transfers", body: "Both parties sign, offers expire, and a right has exactly one owner at a time. The previous owner cannot claim after a transfer." },
  { icon: "replay", title: "Replayable and auditable", body: "The indexer can rebuild from the deployment ledger. Organizers get an append-only audit trail with actor, action and request id." },
];

export interface StatusRow { item: string; state: string; tone: "good" | "warn" | "bad" | "neutral"; note: string }
export const STATUS: StatusRow[] = [
  { item: "Network", state: "Stellar Testnet only", tone: "warn", note: "Synthetic funds and members. Escrow contract CBWF73FUJDGXSXOYUVYHP3XAFSPZWX65YGFSXDSSF5VRFLEWFFTQUIJG is deployed on Testnet; the product remains an unaudited prototype." },
  { item: "Security audit", state: "Not audited", tone: "bad", note: "No third-party review has been performed. Do not use with anything of value." },
  { item: "Mainnet / real funds", state: "Not available", tone: "bad", note: "Mainnet requires an external security review and legal and compliance work first." },
  { item: "Wallets", state: "Freighter or manual signing", tone: "neutral", note: "The Freighter browser extension (Testnet) or sign elsewhere and paste. The Freighter flow has not yet been run against a live Testnet deployment." },
  { item: "Source code", state: "Open source, MIT", tone: "good", note: "Four repositories with independent tests and CI. Cross-repository boundaries are tested against real recorded fixtures." },
];

export interface Faq { q: string; a: string }
export const FAQS: Faq[] = [
  { q: "What problem does Torrent solve?", a: "In a savings circle, everyone contributes and members take turns receiving the pot. Sometimes a member needs their payout earlier, or later. Torrent lets members exchange the timing of a payout, but only for payouts that are already fully funded in escrow." },
  { q: "Is this a traditional rotating savings scheme (ROSCA)?", a: "No. A traditional scheme relies on future contributions that have not been paid yet. Torrent never turns unpaid future contributions into a payout right: a right only exists once an equal amount is locked in the escrow contract." },
  { q: "Is Torrent live? Can I use real money?", a: "No. Torrent is an open-source prototype for Stellar Testnet with synthetic funds. It is not audited, not on Mainnet, and transferability of payout rights would need legal review before any real use." },
  { q: "Does Torrent hold my funds or keys?", a: "No. Funds sit in the Soroban escrow contract, which only releases them according to its rules. The API holds no keys and no balances, and the web app never asks for a secret key or seed phrase." },
  { q: "What happens if a transaction times out?", a: "The request moves to a reconciling state and is resolved by its transaction hash. It is never silently retried with different parameters, and it is never shown as settled until the ledger confirms it." },
  { q: "Which wallets are supported?", a: "The Freighter browser extension, offered when it is installed and set to Testnet, or any tool you sign with yourself and paste the result. A development-only test wallet exists behind a flag and is clearly labeled." },
  { q: "How can I contribute?", a: "Each repository has a CONTRIBUTING guide and a list of scoped contributor issues. Pick the repository that owns the behavior you want to change; cross-repository changes are coordinated through versioned fixtures." },
];
