export interface EIP6963ProviderInfo {
  uuid: string;
  name: string;
  icon: string;
  rdns: string;
}

export interface EIP1193Provider {
  request: (request: { method: string; params?: Array<any> | Record<string, any> }) => Promise<any>;
  on: (eventName: string, listener: (...args: any[]) => void) => void;
  removeListener: (eventName: string, listener: (...args: any[]) => void) => void;
}

export interface EIP6963ProviderDetail {
  info: EIP6963ProviderInfo;
  provider: EIP1193Provider;
}

export type EIP6963AnnounceProviderEvent = {
  detail: EIP6963ProviderDetail;
};
