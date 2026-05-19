"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useWalletStore } from "../../lib/wallet/store";
import ConnectWalletModal from "../../components/wallet/ConnectWalletModal";

export default function ProfileRedirectPage() {
  const { status, address } = useWalletStore();
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (status === "connected" && address) {
      router.replace(`/u/${address}`);
    }
  }, [status, address, router]);

  if (status === "connected") {
    return null; // Redirecting
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-6">
      <div className="text-center max-w-md w-full">
        <h1 className="text-[28px] font-medium text-[var(--text-primary)] mb-4">
          Your Profile
        </h1>
        <p className="text-[var(--text-secondary)] mb-8">
          Connect your wallet to view your on-chain activity, reputation, and PointMarket stats.
        </p>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="bg-[var(--accent-primary)] text-[var(--bg-deep)] px-6 py-3 rounded-lg font-medium text-sm hover:bg-[var(--accent-dim)] transition-colors w-full"
        >
          Connect Wallet
        </button>
      </div>

      <ConnectWalletModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
