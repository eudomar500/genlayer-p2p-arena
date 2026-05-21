import { formatUnits } from "viem";

export function truncateAddress(address: string, prefixLength = 6, suffixLength = 4): string {
  if (!address || address.length < prefixLength + suffixLength) return address;
  return `${address.slice(0, prefixLength)}...${address.slice(-suffixLength)}`;
}

export function formatGenBalance(wei: bigint | string, decimals = 3): string {
  const valueBigInt = typeof wei === "string" ? BigInt(wei) : wei;
  const formatted = formatUnits(valueBigInt, 18);
  
  const [whole, fraction] = formatted.split(".");
  if (!fraction) return `${whole} GEN`;
  
  return `${whole}.${fraction.slice(0, decimals).padEnd(decimals, "0")} GEN`;
}

export function isValidAddress(value: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(value);
}

export function explorerAddressUrl(address: string): string {
  // Use GenLayer Studionet explorer
  return `https://explorer-studio.genlayer.com/address/${address}`;
}
