import { Address, nativeToScVal, type xdr } from "@stellar/stellar-sdk";
import type { Intent } from "@/lib/api/schemas";

type Arg = Intent["descriptor"]["args"][number];

/** Typed descriptor argument -> Soroban value, exactly as the API's signed-transaction check expects. */
export const toScVal = (a: Arg): xdr.ScVal => {
  switch (a.type) {
    case "u64": return nativeToScVal(BigInt(a.value), { type: "u64" });
    case "i128": return nativeToScVal(BigInt(a.value), { type: "i128" });
    case "address": return new Address(a.value).toScVal();
    case "bytes32": return nativeToScVal(Buffer.from(a.value, "hex"), { type: "bytes" });
  }
};
