"use client";
import React, { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import { useTxStore } from "../../lib/tx/store";
import type { PendingTx } from "../../lib/tx/types";
import TxItem from "./TxItem";

/**
 * Floating drawer that lists transactions tracked by the store.
 *
 * Visibility rules:
 *
 * - Hidden entirely when there are no tracked TXs. Decision A.
 * - Auto-expands for 5s when a new TX is added (so the user gets visual
 *   confirmation that their write registered), then auto-collapses to
 *   keep the chrome small. The user can re-open by clicking the header.
 * - The expanded state is local component state; the drawer always
 *   opens collapsed if the user reloads.
 *
 * The list ordering is "newest first" (the store already prepends new
 * TXs in addTx). We cap the visible list at MAX_VISIBLE rows and rely
 * on the inner scroll if the user has many concurrent TXs; very old
 * tracked ones still exist in the store but the drawer scrolls.
 */

const AUTO_EXPAND_MS = 5000;
const MAX_VISIBLE = 6;

export default function TxDrawer() {
  const txs = useTxStore((s) => s.txs);
  const [expanded, setExpanded] = useState(false);
  const previousCountRef = useRef(txs.length);
  const autoCollapseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-expand when a new TX is added. We detect the transition by
  // comparing the current count to the previous render. If it grew, a
  // submit just happened and we want the drawer open briefly.
  useEffect(() => {
    if (txs.length > previousCountRef.current) {
      setExpanded(true);
      if (autoCollapseTimerRef.current) {
        clearTimeout(autoCollapseTimerRef.current);
      }
      autoCollapseTimerRef.current = setTimeout(() => {
        setExpanded(false);
        autoCollapseTimerRef.current = null;
      }, AUTO_EXPAND_MS);
    }
    previousCountRef.current = txs.length;
    return () => {
      if (autoCollapseTimerRef.current) {
        clearTimeout(autoCollapseTimerRef.current);
        autoCollapseTimerRef.current = null;
      }
    };
  }, [txs.length]);

  // Decision A: hide drawer when no tracked TXs exist.
  if (txs.length === 0) return null;

  const activeCount = txs.filter(
    (t) => t.uiState !== "finalized" && t.uiState !== "failed",
  ).length;

  const headerLabel =
    activeCount > 0
      ? `Pending transactions (${activeCount})`
      : `Recent transactions (${txs.length})`;

  const visible = txs.slice(0, MAX_VISIBLE);
  const overflow = txs.length - visible.length;

  return (
    <div
      className="fixed bottom-4 right-4 z-50 w-[360px] max-w-[calc(100vw-2rem)] rounded-lg border text-sm shadow-lg"
      style={{
        backgroundColor: "var(--bg-elevated)",
        borderColor: "var(--border-strong)",
        color: "var(--text-primary)",
      }}
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 font-medium"
        style={{ color: "var(--text-primary)" }}
      >
        <span className="flex items-center gap-2">
          {activeCount > 0 && (
            <span
              className="inline-block h-2 w-2 animate-pulse rounded-full"
              style={{ backgroundColor: "var(--accent-primary)" }}
              aria-hidden
            />
          )}
          {headerLabel}
        </span>
        {expanded ? (
          <ChevronDown size={16} aria-hidden />
        ) : (
          <ChevronUp size={16} aria-hidden />
        )}
      </button>

      {expanded && (
        <div
          className="border-t"
          style={{ borderColor: "var(--border-subtle)" }}
        >
          <ul className="max-h-[420px] overflow-y-auto">
            {visible.map((tx: PendingTx) => (
              <li
                key={tx.txHash}
                className="border-b last:border-b-0"
                style={{ borderColor: "var(--border-subtle)" }}
              >
                <TxItem tx={tx} />
              </li>
            ))}
          </ul>
          {overflow > 0 && (
            <div
              className="px-4 py-2 text-xs"
              style={{ color: "var(--text-tertiary)" }}
            >
              + {overflow} older
            </div>
          )}
          <div
            className="flex items-center justify-end gap-3 border-t px-4 py-2 text-xs"
            style={{
              borderColor: "var(--border-subtle)",
              color: "var(--text-tertiary)",
            }}
          >
            <button
              type="button"
              onClick={() => {
                if (activeCount === 0) {
                  useTxStore.getState().clearAll();
                }
              }}
              disabled={activeCount > 0}
              className="inline-flex items-center gap-1 disabled:opacity-40"
              style={{ color: "var(--text-secondary)" }}
              title={
                activeCount > 0
                  ? "Cannot clear while transactions are still pending"
                  : "Remove all tracked transactions from the drawer"
              }
            >
              <X size={12} aria-hidden />
              Clear all
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
