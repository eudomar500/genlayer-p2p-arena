"use client";

import Link from "next/link";
import Identicon from "@/components/wallet/Identicon";
import { truncateAddress } from "@/lib/wallet/format";

interface TradePartiesCardProps {
  seller: string;
  buyer: string;
}

export default function TradePartiesCard({ seller, buyer }: TradePartiesCardProps) {
  const hasBuyer = buyer && buyer !== seller;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <PartySection role="Seller" address={seller} />
      {hasBuyer ? (
        <PartySection role="Buyer" address={buyer} />
      ) : (
        <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-center">
          <span className="text-sm text-[var(--text-secondary)]">No buyer yet</span>
        </div>
      )}
    </div>
  );
}

function PartySection({ role, address }: { role: string; address: string }) {
  return (
    <Link 
      href={`/u/${address}`}
      className="block p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-[var(--accent-primary)]/30 transition-colors"
    >
      <div className="text-xs uppercase tracking-wider text-[var(--text-secondary)] mb-2">
        {role}
      </div>
      <div className="flex items-center gap-3">
        <Identicon address={address} size={32} />
        <span className="font-mono text-sm text-[var(--text-primary)]">
          {truncateAddress(address)}
        </span>
      </div>
    </Link>
  );
}
