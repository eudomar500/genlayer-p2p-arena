"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2 } from "lucide-react";
import { useWalletProviders } from "../../lib/hooks/useWalletProviders";
import { useWalletStore } from "../../lib/wallet/store";

interface ConnectWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ConnectWalletModal({ isOpen, onClose }: ConnectWalletModalProps) {
  const [mounted, setMounted] = useState(false);
  const providers = useWalletProviders();
  const { connect, status, error } = useWalletStore();

  // Mount flag for portal rendering (document.body is not available during SSR)
  useEffect(() => {
    setMounted(true);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Close automatically on connect success
  useEffect(() => {
    if (status === "connected") {
      onClose();
    }
  }, [status, onClose]);

  // Sort Rabby to top
  const sortedProviders = [...providers].sort((a, b) => {
    if (a.info.name.toLowerCase().includes("rabby")) return -1;
    if (b.info.name.toLowerCase().includes("rabby")) return 1;
    return 0;
  });

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[var(--bg-deep)]/80 backdrop-blur-xl"
          />

          {/* Centering wrapper */}
          <div className="relative flex min-h-full items-center justify-center p-4">
            {/* Modal Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-[480px] max-h-[calc(100vh-2rem)] flex flex-col bg-[var(--bg-elevated)] rounded-2xl border border-[var(--border-subtle)] shadow-2xl"
            >
              <div className="p-6 pb-4 flex-shrink-0 relative border-b border-[var(--border-subtle)]">
                <button
                  type="button"
                  onClick={onClose}
                  className="absolute top-6 right-6 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                  aria-label="Close"
                >
                  <X size={20} />
                </button>

                <h2 className="text-[24px] font-medium text-[var(--text-primary)] mb-2">
                  Connect a Wallet
                </h2>
                <p className="text-[14px] text-[var(--text-secondary)] m-0">
                  Choose a wallet provider to connect to PointMarket
                </p>
              </div>

              <div className="p-6 pt-4 overflow-y-auto flex-1 min-h-0 space-y-3">
                {sortedProviders.length > 0 ? (
                  sortedProviders.map((provider) => {
                    const isConnecting = status === "connecting";
                    return (
                      <button
                        key={provider.info.uuid}
                        type="button"
                        onClick={() => connect(provider)}
                        disabled={isConnecting}
                        className="w-full flex items-center p-4 rounded-xl hover:bg-[var(--bg-elevated-2)] border border-transparent hover:border-[var(--border-subtle)] transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                      >
                        <img
                          src={provider.info.icon}
                          alt={provider.info.name}
                          className="w-10 h-10 rounded-lg mr-4"
                        />
                        <div className="flex-1 text-left">
                          <div className="text-[16px] font-medium text-[var(--text-primary)] flex items-center gap-2">
                            {provider.info.name}
                            {provider.info.name.toLowerCase().includes("rabby") && (
                              <span className="text-[10px] uppercase tracking-wider bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] px-2 py-0.5 rounded font-mono">
                                Recommended
                              </span>
                            )}
                          </div>
                        </div>
                        {isConnecting && <Loader2 size={18} className="animate-spin text-[var(--text-secondary)]" />}
                      </button>
                    );
                  })
                ) : (
                  <div className="text-center py-8">
                    <p className="text-[var(--text-secondary)] mb-4">No wallet detected</p>
                    <div className="flex flex-col gap-2">
                      <a
                        href="https://rabby.io"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[var(--accent-primary)] hover:underline text-sm"
                      >
                        Install Rabby Wallet (Recommended)
                      </a>
                      <a
                        href="https://metamask.io"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors text-sm"
                      >
                        Install MetaMask
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <div className="mx-6 mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                  {error}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
