"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useWalletStore } from "@/lib/wallet/store";
import CreateListingDialog from "./CreateListingDialog";

export default function CreateListingButton() {
  const { status, chainId } = useWalletStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const isConnected = status === "connected";
  const isWrongNetwork = isConnected && chainId !== 4221;
  const disabled = !isConnected || isWrongNetwork;
  
  let tooltip = "";
  if (!isConnected) tooltip = "Connect wallet to create a listing";
  else if (isWrongNetwork) tooltip = "Switch to Testnet Bradbury";

  return (
    <>
      <div className="relative group inline-block">
        <button
          type="button"
          onClick={() => setIsDialogOpen(true)}
          disabled={disabled}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-[var(--bg-deep)] rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus size={18} />
          Create listing
        </button>
        {tooltip && (
          <div className="absolute top-full right-0 mt-2 whitespace-nowrap bg-[var(--bg-elevated-2)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-lg">
            {tooltip}
          </div>
        )}
      </div>
      
      <CreateListingDialog 
        isOpen={isDialogOpen} 
        onClose={() => setIsDialogOpen(false)} 
      />
    </>
  );
}
