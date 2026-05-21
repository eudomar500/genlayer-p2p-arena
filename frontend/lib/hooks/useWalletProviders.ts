"use client";

import { useEffect, useState } from "react";
import type { EIP6963ProviderDetail } from "../wallet/types";
import { requestProviders } from "../wallet/eip6963";

export function useWalletProviders(): EIP6963ProviderDetail[] {
  const [providers, setProviders] = useState<EIP6963ProviderDetail[]>([]);

  useEffect(() => {
    const handler = (event: CustomEvent) => {
      const detail = event.detail as EIP6963ProviderDetail;
      setProviders((prev) => {
        // dedupe by uuid
        if (prev.some((p) => p.info.uuid === detail.info.uuid)) return prev;
        return [...prev, detail];
      });
    };

    window.addEventListener("eip6963:announceProvider", handler as EventListener);
    requestProviders();

    return () => {
      window.removeEventListener("eip6963:announceProvider", handler as EventListener);
    };
  }, []);

  return providers;
}
