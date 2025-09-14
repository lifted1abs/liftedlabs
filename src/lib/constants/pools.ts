// /src/lib/constants/pools.ts

import { XRD, HUSDC, HUSDT, HETH, HWBTC } from './tokens';

export interface Pool {
    address: string;
    dex: string;
    token0: string;
    token1: string;
    name: string;
}

export const ALL_POOLS: Pool[] = [
    // OciSwap Pools
    { address: 'component_rdx1czy2naejcqx8gv46zdsex2syuxrs4jnqzug58e66zr8wglxzvu97qr', dex: 'ociswap', token0: XRD, token1: HUSDC, name: 'OciSwap XRD/hUSDC' },
    { address: 'component_rdx1cprwh9r3wx6vvt0gnv8wscwljegzcevp0hzuju2873eza7fgg493fw', dex: 'ociswap', token0: XRD, token1: HUSDT, name: 'OciSwap XRD/hUSDT' },
    { address: 'component_rdx1crumqsy0nu4pl3fwah3nkf8eg8qhltxenk83wh9tzlmr5jnsqs3x4c', dex: 'ociswap', token0: XRD, token1: HETH, name: 'OciSwap XRD/hETH' },
    { address: 'component_rdx1crd7xk0nu07kj60artzz6evws7r6w69lwarf0nqmkxuwwluy5xjud0', dex: 'ociswap', token0: XRD, token1: HWBTC, name: 'OciSwap XRD/hWBTC' },
    
    // DefiPlaza Pools
    { address: 'component_rdx1cqs6t5t70fcgrva6ws6gs84u29w3kecn6j0zkjg0u0x9szx0xnusxj', dex: 'defiplaza', token0: XRD, token1: HUSDC, name: 'DefiPlaza XRD/hUSDC' },
    { address: 'component_rdx1crz9nv7mvp3lamx3kl4xq8lgwyalvn7rgmlzse2rfs4r9u5sdq0vzh', dex: 'defiplaza', token0: XRD, token1: HUSDT, name: 'DefiPlaza XRD/hUSDT' },
    { address: 'component_rdx1cq8nefdv75yqkgwqe9rhj436yr3z09du7g797y90prmwf9ugv0m8u2', dex: 'defiplaza', token0: XRD, token1: HETH, name: 'DefiPlaza XRD/hETH' },
    { address: 'component_rdx1cqy8gd5wk8cq7c4g4gpa2lgulk7tcqj673fgz90cu7fa6x2f9gshaz', dex: 'defiplaza', token0: XRD, token1: HWBTC, name: 'DefiPlaza XRD/hWBTC' },
    
    // Caviar Simple Pools
    { address: 'component_rdx1cqth4gp6fedux4rrjzk6gu04c24sfnhzrh9t052ufsh7n5ljrslltw', dex: 'caviar', token0: XRD, token1: HUSDC, name: 'Caviar Simple XRD/hUSDC' },
    { address: 'component_rdx1crj9m0m45cy3a38968n8cs0sg2hvvnyl75x7y6wppg0x4dtf72092e', dex: 'caviar', token0: XRD, token1: HUSDT, name: 'Caviar Simple XRD/hUSDT' },
    { address: 'component_rdx1cpwu2rv3p4qqsayk5tc072kw94ygqyusemuqje7udxhgt3253m830q', dex: 'caviar', token0: XRD, token1: HETH, name: 'Caviar Simple XRD/hETH' },
    { address: 'component_rdx1cpftfjyyyrca5twzsr557at8uka20ynsn5wucy9pe7sgxnrse24m5h', dex: 'caviar', token0: XRD, token1: HWBTC, name: 'Caviar Simple XRD/hWBTC' },
    
    // Caviar Shape Pools
    { address: 'component_rdx1cqelumvmmgwths34k9pp0htd2ykwq7d70m0r389etwh39ul3j5tyj5', dex: 'caviar', token0: XRD, token1: HUSDC, name: 'Caviar Shape XRD/hUSDC' },
    { address: 'component_rdx1cph6ayqwqgnavd5yjxjx966nfcnxwt85k9p8fqv37r5pfnn3qcm6az', dex: 'caviar', token0: XRD, token1: HUSDT, name: 'Caviar Shape XRD/hUSDT' },
    { address: 'component_rdx1cpat0a7p2ufty0lrawwtxfr3xm2qf5ys2xe6mlux4s074utzkz0w0y', dex: 'caviar', token0: HUSDC, token1: HUSDT, name: 'Caviar Shape hUSDC/hUSDT' }
];

// Keep the original function for backwards compatibility
export function getPoolsByToken(token: string): Pool[] {
    return ALL_POOLS.filter(p => p.token1 === token);
}

// Get all pools
export function getAllPools(): Pool[] {
    return ALL_POOLS;
}

// Get pools that contain a specific token (either token0 or token1)
export function getPoolsContainingToken(token: string): Pool[] {
    return ALL_POOLS.filter(p => p.token0 === token || p.token1 === token);
}

// Group pools by token pair for display
export function groupPoolsByPair(): Map<string, Pool[]> {
    const grouped = new Map<string, Pool[]>();
    
    ALL_POOLS.forEach(pool => {
        // Create a consistent key regardless of token order
        const tokens = [pool.token0, pool.token1].sort();
        const key = `${tokens[0]}-${tokens[1]}`;
        
        if (!grouped.has(key)) {
            grouped.set(key, []);
        }
        grouped.get(key)!.push(pool);
    });
    
    return grouped;
}

export function sortPoolsByPrice(pools: Pool[], prices: Record<string, number>): Pool[] {
    return [...pools].sort((a, b) => {
        const priceA = prices[a.address] || Infinity;
        const priceB = prices[b.address] || Infinity;
        return priceA - priceB;
    });
}

export function truncateAddress(address: string): string {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
}