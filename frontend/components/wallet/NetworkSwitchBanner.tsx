"use client";

import React, { useState } from "react";
import { useWalletStore } from "../../lib/wallet/store";
import { Loader2 } from "lucide-react";

export default function NetworkSwitchBanner() {
  const { chainId, provider, status } = useWalletStore();
  const [isSwitching, setIsSwitching] = useState(false);

  // Don't show if not connected, or if on the correct chain (61999)
  if (status !== "connected" || chainId === 61999 || !provider) {
    return null;
  }

  const handleSwitch = async () => {
    setIsSwitching(true);
    try {
      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0xf23f" }], // 61999 in hex
      });
    } catch (switchError: any) {
      if (switchError.code === 4902 || switchError.code === -32603) {
        // Chain not added to wallet -- try to add it
        try {
          await provider.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: "0xf23f",
                chainName: "GenLayer Studionet",
                rpcUrls: ["https://studio.genlayer.com/api"],
                blockExplorerUrls: ["https://explorer-studio.genlayer.com"],
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
        You are connected to the wrong network. PointMarket runs on GenLayer Studionet.
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
