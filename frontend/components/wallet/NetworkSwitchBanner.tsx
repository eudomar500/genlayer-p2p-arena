"use client";
import React, { useState } from "react";
import { useWalletStore } from "../../lib/wallet/store";
import { Loader2 } from "lucide-react";
import { DEFAULT_NETWORK } from "@/lib/genlayer/contracts";
import { NETWORKS } from "@/config/networks";

const TARGET = NETWORKS[DEFAULT_NETWORK];
const TARGET_CHAIN_ID_HEX = "0x" + TARGET.chainId.toString(16);

export default function NetworkSwitchBanner() {
  const { chainId, provider, status } = useWalletStore();
  const [isSwitching, setIsSwitching] = useState(false);
  // Don't show if not connected, or if on the correct chain
  if (status !== "connected" || chainId === TARGET.chainId || !provider) {
    return null;
  }
  const handleSwitch = async () => {
    setIsSwitching(true);
    try {
      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: TARGET_CHAIN_ID_HEX }],
      });
    } catch (switchError: any) {
      if (switchError.code === 4902 || switchError.code === -32603) {
        // Chain not added to wallet -- try to add it
        try {
          await provider.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: TARGET_CHAIN_ID_HEX,
                chainName: TARGET.displayName,
                rpcUrls: [TARGET.rpcUrl],
                blockExplorerUrls: TARGET.explorerUrl ? [TARGET.explorerUrl] : [],
                nativeCurrency: {
                  name: "GEN Token",
                  symbol: "GEN",
                  decimals: 18,
                },
              },
            ],
          });
        } catch (addError: any) {
          // Silently ignore user rejection -- not an actual error
          if (addError?.code === 4001) {
            return;
          }
          console.error("Failed to add network:", addError?.message || addError);
        }
      } else if (switchError.code === 4001) {
        // User rejected the switch -- silent, no log needed
      } else {
        console.error("Failed to switch network:", switchError?.message || switchError?.code || switchError);
      }
    } finally {
      setIsSwitching(false);
    }
  };
  return (
    <div className="w-full bg-[var(--accent-primary)]/15 py-3 px-6 flex flex-col sm:flex-row items-center justify-between border-b border-[var(--accent-primary)]/20 text-sm z-50 relative mt-16">
      <div className="text-[var(--text-primary)] font-medium mb-3 sm:mb-0">
        You are connected to the wrong network. PointMarket runs on {TARGET.displayName}.
      </div>
      <button
        type="button"
        onClick={handleSwitch}
        disabled={isSwitching}
        className="bg-[var(--accent-primary)] text-[var(--bg-deep)] px-4 py-1.5 rounded-md font-medium flex items-center hover:bg-[var(--accent-dim)] transition-colors disabled:opacity-70"
      >
        {isSwitching ? (
          <>
            <Loader2 size={16} className="animate-spin mr-2" />
            Switching...
          </>
        ) : (
          "Switch network"
        )}
      </button>
    </div>
  );
}
