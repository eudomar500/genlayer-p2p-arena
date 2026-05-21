import type { EIP6963ProviderDetail } from "./types";

export const requestProviders = () => {
  window.dispatchEvent(new Event("eip6963:requestProvider"));
};
