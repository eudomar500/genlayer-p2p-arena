"use client";

import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { parseEther } from "viem";

import { useWalletStore } from "@/lib/wallet/store";
import { useWriteWithTracking } from "@/lib/tx/useWriteWithTracking";
import { createListing } from "@/lib/genlayer/writes";
import { DEFAULT_NETWORK } from "@/lib/genlayer/contracts";
import { NETWORKS } from "@/config/networks";
import { truncateAddress } from "@/lib/wallet/format"; // Reusing for txHash truncation

interface CreateListingDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateListingDialog({ isOpen, onClose }: CreateListingDialogProps) {
  const [mounted, setMounted] = useState(false);
  const { status, chainId } = useWalletStore();
  const { execute, pending, error: writeError } = useWriteWithTracking();
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priceStr, setPriceStr] = useState("");
  
  const [titleError, setTitleError] = useState("");
  const [descError, setDescError] = useState("");
  const [priceError, setPriceError] = useState("");
  const [formError, setFormError] = useState("");

  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !pending) onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      // Focus first input on open
      setTimeout(() => titleInputRef.current?.focus(), 100);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, pending]);

  useEffect(() => {
    if (!isOpen) {
      // Reset form on close
      setTitle("");
      setDescription("");
      setPriceStr("");
      setTitleError("");
      setDescError("");
      setPriceError("");
      setFormError("");
    }
  }, [isOpen]);

  const validate = (): boolean => {
    let isValid = true;
    setTitleError("");
    setDescError("");
    setPriceError("");
    setFormError("");

    if (!title || title.length < 1 || title.length > 100) {
      setTitleError("Title must be between 1 and 100 characters");
      isValid = false;
    }

    if (!description || description.length < 1 || description.length > 500) {
      setDescError("Description must be between 1 and 500 characters");
      isValid = false;
    }

    const priceNum = parseFloat(priceStr);
    if (isNaN(priceNum) || priceNum <= 0 || priceNum >= 1000) {
      setPriceError("Price must be between 0.001 and 999.999 GEN");
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    if (status !== "connected") {
      setFormError("Wallet not connected");
      return;
    }
    
    if (chainId !== 4221) {
      setFormError("Must connect to testnet Bradbury");
      return;
    }

    try {
      const priceWei = parseEther(priceStr);
      const hash = await execute({
        method: "create_listing",
        context: title,
        write: (client, network) => createListing(client, network, { 
          title, 
          description, 
          price: priceWei 
        }),
      });

      onClose();
      toast.success("Listing submitted", {
        description: (
          <a
            href={`${NETWORKS[DEFAULT_NETWORK].explorerUrl}/tx/${hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline text-[var(--accent-primary)]"
          >
            {truncateAddress(hash, 8, 8)} {"-> View on Explorer"}
          </a>
        ),
      });
    } catch (err: any) {
      // execute catches error and exposes it via writeError state, 
      // but we can also handle it locally if needed.
    }
  };

  // derived state for submit button
  const canSubmit = status === "connected" && chainId === 4221 && !pending;

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] overflow-y-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { if (!pending) onClose() }}
            className="fixed inset-0 bg-[var(--bg-deep)]/80 backdrop-blur-xl"
          />

          <div className="relative flex min-h-full items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-[500px] flex flex-col bg-[var(--bg-elevated)] rounded-2xl border border-[var(--border-subtle)] shadow-2xl"
            >
              <div className="p-6 pb-4 flex-shrink-0 relative border-b border-[var(--border-subtle)]">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={pending}
                  className="absolute top-6 right-6 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-50"
                  aria-label="Close"
                >
                  <X size={20} />
                </button>

                <h2 className="text-[24px] font-medium text-[var(--text-primary)] mb-2">
                  Create Listing
                </h2>
                <p className="text-[14px] text-[var(--text-secondary)] m-0">
                  List an item for sale on PointMarket.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 flex flex-col gap-4">
                {(formError || writeError) && (
                  <div className="p-3 rounded-lg bg-[var(--danger)]/10 border border-[var(--danger)]/20 text-[var(--danger)] text-sm mb-2">
                    {formError || writeError?.message || "An error occurred"}
                  </div>
                )}

                <div className="flex flex-col gap-1">
                  <label htmlFor="title" className="text-sm font-medium text-[var(--text-primary)]">
                    Title
                  </label>
                  <input
                    ref={titleInputRef}
                    id="title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={pending}
                    placeholder="E.g., Sony WH-1000XM4 Headphones"
                    className={`w-full px-4 py-2 bg-[var(--bg-deep)] border ${titleError ? 'border-[var(--danger)]' : 'border-[var(--border-subtle)]'} rounded-lg text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-primary)] transition-colors`}
                  />
                  {titleError && <span className="text-xs text-[var(--danger)]">{titleError}</span>}
                </div>

                <div className="flex flex-col gap-1">
                  <label htmlFor="description" className="text-sm font-medium text-[var(--text-primary)]">
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={pending}
                    placeholder="Describe the item condition, history, etc..."
                    rows={4}
                    className={`w-full px-4 py-2 bg-[var(--bg-deep)] border ${descError ? 'border-[var(--danger)]' : 'border-[var(--border-subtle)]'} rounded-lg text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-primary)] transition-colors resize-none`}
                  />
                  {descError && <span className="text-xs text-[var(--danger)]">{descError}</span>}
                </div>

                <div className="flex flex-col gap-1">
                  <label htmlFor="price" className="text-sm font-medium text-[var(--text-primary)]">
                    Price (GEN)
                  </label>
                  <input
                    id="price"
                    type="number"
                    step="0.001"
                    min="0.001"
                    max="999.999"
                    value={priceStr}
                    onChange={(e) => setPriceStr(e.target.value)}
                    disabled={pending}
                    placeholder="0.00"
                    className={`w-full px-4 py-2 bg-[var(--bg-deep)] border ${priceError ? 'border-[var(--danger)]' : 'border-[var(--border-subtle)]'} rounded-lg text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-primary)] transition-colors`}
                  />
                  {priceError && <span className="text-xs text-[var(--danger)]">{priceError}</span>}
                </div>

                <div className="pt-4 border-t border-[var(--border-subtle)] mt-2">
                  <button
                    type="submit"
                    disabled={!canSubmit}
                    className="w-full flex items-center justify-center py-2.5 px-4 bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] disabled:bg-[var(--border-strong)] text-[var(--bg-deep)] disabled:text-[var(--text-tertiary)] rounded-lg font-medium transition-colors"
                  >
                    {pending ? <Loader2 size={18} className="animate-spin" /> : "Submit Listing"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
