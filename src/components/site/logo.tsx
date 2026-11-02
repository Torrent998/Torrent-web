import Image from "next/image";
import Link from "next/link";

/** The approved Torrent icon (brand/icon.svg, unchanged) with the wordmark set in the UI font. */
export function Logo({ href = "/", size = 32 }: { href?: string; size?: number }) {
  return (
    <Link href={href} className="group inline-flex items-center gap-2.5 rounded-lg font-semibold tracking-tight" aria-label="Torrent home">
      <Image src="/brand/icon.svg" alt="" width={size} height={size} unoptimized className="rounded-[22%] transition-transform duration-300 group-hover:-rotate-6" />
      <span className="text-lg">Torrent</span>
    </Link>
  );
}
