import { create } from "zustand";
import type { EIP1193Provider, EIP6963ProviderDetail, EIP6963ProviderInfo } from "./types";
import { requestProviders } from "./eip6963";

export type WalletStatus = "disconnected" | "connecting" | "connected" | "error";

interface WalletState {
  status: WalletStatus;
  address: string | null;
  chainId: number | null;
  provider: EIP1193Provider | null;
  providerInfo: EIP6963ProviderInfo | null;
  error: string | null;
}

interface WalletActions {
  connect: (detail: EIP6963ProviderDetail) => Promise<void>;
  disconnect: () => void;
  initSilentReconnect: () => void;
}

type WalletStore = WalletState & WalletActions;

export const useWalletStore = create<WalletStore>((set, get) => {
  const handleAccountsChanged = (accounts: unknown) => {
    const accs = accounts as string[];
    if (accs.length === 0) {
      get().disconnect();
    } else {
      set({ address: accs[0] });
    }
  };

  const handleChainChanged = (chainId: unknown) => {
    set({ chainId: Number(chainId) });
  };

  return {
    status: "disconnected",
    address: null,
    chainId: null,
    provider: null,
    providerInfo: null,
    error: null,

    connect: async (detail: EIP6963ProviderDetail) => {
      set({ status: "connecting", error: null });
      try {
        const accounts = (await detail.provider.request({
          method: "eth_requestAccounts",
        })) as string[];
        
        if (accounts.length === 0) {
          throw new Error("No accounts returned from wallet.");
        }

        const chainIdHex = (await detail.provider.request({
          method: "eth_chainId",
        })) as string;

        detail.provider.on("accountsChanged", handleAccountsChanged);
        detail.provider.on("chainChanged", handleChainChanged);

        // Persist to local storage
        localStorage.setItem("wallet_rdns", detail.info.rdns);

        set({
          status: "connected",
          address: accounts[0],
          chainId: Number(chainIdHex),
          provider: detail.provider,
          providerInfo: detail.info,
        });
      } catch (err: any) {
        set({ status: "error", error: err.message || "Failed to connect" });
      }
    },

    disconnect: () => {
      const { provider } = get();
      if (provider) {
        provider.removeListener("accountsChanged", handleAccountsChanged);
        provider.removeListener("chainChanged", handleChainChanged);
      }
      localStorage.removeItem("wallet_rdns");
      set({
        status: "disconnected",
        address: null,
        chainId: null,
        provider: null,
        providerInfo: null,
        error: null,
      });
    },

    initSilentReconnect: () => {
      const rdns = localStorage.getItem("wallet_rdns");
      if (!rdns) return;

      const handler = async (event: CustomEvent) => {
        const detail = event.detail as EIP6963ProviderDetail;
        if (detail.info.rdns === rdns) {
          window.removeEventListener("eip6963:announceProvider", handler as EventListener);
          
          try {
            // Attempt silent reconnect
            const accounts = (await detail.provider.request({
              method: "eth_accounts",
            })) as string[];

            if (accounts && accounts.length > 0) {
              const chainIdHex = (await detail.provider.request({
                method: "eth_chainId",
              })) as string;

              detail.provider.on("accountsChanged", handleAccountsChanged);
              detail.provider.on("chainChanged", handleChainChanged);

              set({
                status: "connected",
                address: accounts[0],
                chainId: Number(chainIdHex),
                provider: detail.provider,
                providerInfo: detail.info,
              });
            } else {
              // Not authorized anymore
              localStorage.removeItem("wallet_rdns");
            }
          } catch (e) {
            console.error("Silent reconnect failed", e);
            localStorage.removeItem("wallet_rdns");
          }
        }
      };

      window.addEventListener("eip6963:announceProvider", handler as EventListener);
      requestProviders();
    },
  };
});
