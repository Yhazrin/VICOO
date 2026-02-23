export interface SdkConfig {
  baseUrl: string;
  token?: string;
}

export const createSdk = (config: SdkConfig) => ({
  config
});
