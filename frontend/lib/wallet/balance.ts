import { createReadClient } from "../genlayer/client";

export async function fetchGenBalance(address: string): Promise<bigint> {
  // Currently using studionet, you may change network depending on the environment
  const client = createReadClient("studionet");
  const balance = await client.getBalance({
    address: address as `0x${string}`,
  });
  return balance;
}
