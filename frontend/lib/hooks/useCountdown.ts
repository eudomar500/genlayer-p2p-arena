"use client";

import { useEffect, useState } from "react";

/**
 * Tracks the remaining seconds until a Unix timestamp is reached. Updates
 * every second while the target is in the future. Adds a safety buffer
 * to absorb clock drift between the user's machine and the chain, and the
 * latency between submitting a transaction and it being processed by
 * validators. The buffer defaults to 30 seconds: small enough not to feel
 * intrusive on long timeouts (days), large enough to avoid the common
 * failure mode where a user clicks an action a second too early and the
 * contract rejects the transaction.
 */
export function useCountdown(
  unlockTimestamp: number,
  bufferSeconds: number = 30,
): { remainingSeconds: number; isReady: boolean } {
  const compute = () => {
    const nowSeconds = Math.floor(Date.now() / 1000);
    const effectiveUnlock = unlockTimestamp + bufferSeconds;
    return Math.max(0, effectiveUnlock - nowSeconds);
  };

  const [remainingSeconds, setRemainingSeconds] = useState(compute);

  useEffect(() => {
    setRemainingSeconds(compute());
    if (compute() === 0) {
      return;
    }
    const id = setInterval(() => {
      setRemainingSeconds(compute());
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unlockTimestamp, bufferSeconds]);

  return {
    remainingSeconds,
    isReady: remainingSeconds === 0,
  };
}

/**
 * Formats a duration in seconds as a compact human-readable string.
 * Used for countdown displays: "2d 14h 37m" for long durations,
 * "4m 12s" for short ones.
 */
export function formatRemaining(seconds: number): string {
  if (seconds <= 0) return "now";
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }
  return `${secs}s`;
}
