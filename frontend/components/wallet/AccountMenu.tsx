"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, User, Copy, ExternalLink, LogOut, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useWalletStore } from "../../lib/wallet/store";
import { truncateAddress, explorerAddressUrl } from "../../lib/wallet/format";
import Identicon from "./Identicon";
import { toast } from "sonner";

export default function AccountMenu() {
  const { address, disconnect } = useWalletStore();
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  if (!address) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      toast.success("Address copied to clipboard", {
        duration: 2000,
        style: {
          background: "var(--bg-elevated-2)",
          color: "var(--text-primary)",
          border: "1px solid var(--border-subtle)",
        },
      });
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        setIsOpen(false);
      }, 1500);
    } catch (error) {
      toast.error("Failed to copy address");
    }
  };

  const handleViewProfile = () => {
    router.push(`/u/${address}`);
    setIsOpen(false);
  };

  const handleDisconnect = () => {
    disconnect();
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-[var(--bg-elevated)] hover:bg-[var(--bg-elevated-2)] border border-[var(--border-subtle)] rounded-full pl-2 pr-3 py-1.5 transition-colors"
      >
        <Identicon address={address} size={24} />
        <span className="font-mono text-sm text-[var(--text-primary)]">
          {truncateAddress(address)}
        </span>
        <ChevronDown size={16} className="text-[var(--text-secondary)] ml-1" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl p-2 shadow-xl z-50">
          <button
            type="button"
            onClick={handleViewProfile}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-elevated-2)] rounded-lg transition-colors"
          >
            <User size={16} className="text-[var(--text-secondary)]" />
            View profile
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-elevated-2)] rounded-lg transition-colors text-left"
          >
            {copied ? (
              <Check size={16} className="text-green-500" />
            ) : (
              <Copy size={16} className="text-[var(--text-secondary)]" />
            )}
            Copy address
          </button>
          <a
            href={explorerAddressUrl(address)}
            target="_blank"
            rel="noreferrer"
            onClick={() => setIsOpen(false)}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-elevated-2)] rounded-lg transition-colors"
          >
            <ExternalLink size={16} className="text-[var(--text-secondary)]" />
            View on Explorer
          </a>
          
          <div className="my-1 h-px bg-[var(--border-subtle)]" />
          
          <button
            type="button"
            onClick={handleDisconnect}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[#E85D04] hover:bg-[#E85D04]/10 rounded-lg transition-colors text-left"
          >
            <LogOut size={16} />
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}
