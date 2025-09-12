export interface Pool {
  dex: 'ociswap' | 'defiplaza';
  address: string;
  token: string;
  type: 'v2_basic' | 'v2_precision' | 'basic'; // For routing
  reserveToken: number;
  reserveXrd: number;
  price: number;
}