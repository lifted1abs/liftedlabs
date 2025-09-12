// src/services/dexService.ts
import { ezGateway, gatewayApi } from '$lib/radix';

// Token addresses
export const TOKEN_ADDRESSES = {
    XRD: 'resource_rdx1tknxxxxxxxxxradxrdxxxxxxxxx009923554798xxxxxxxxxradxrd',
    HUSDC: 'resource_rdx1thxj9m87sn5cc9ehgp9qxp6vzeqxtce90xm5cp33373tclyp4et4gv',
    HUSDT: 'resource_rdx1th4v03gezwgzkuma6p38lnum8ww8t4ds9nvcrkr2p9ft6kxx3kxvhe',
    HWBTC: 'resource_rdx1t58kkcqdz0mavfz98m98qh9m4jexyl9tacsvlhns6yxs4r6hrm5re5',
    HETH: 'resource_rdx1th09yvv7tgsrv708ffsgqjjf2mhy84mscmj5jwu4g670fh3e5zgef0'
};

export interface PoolInfo {
    poolAddress: string;
    dex: 'ociswap' | 'defiplaza' | 'caviar';
    token0Address: string;
    token1Address: string;
    token0Symbol: string;
    token1Symbol: string;
    token0Amount: string;
    token1Amount: string;
    price: number; // Price of token0 in terms of token1
    priceInverse: number; // Price of token1 in terms of token0
}

// Fetch OciSwap pools
export async function fetchOciSwapPools(tokenAddress?: string): Promise<PoolInfo[]> {
    try {
        const url = tokenAddress 
            ? `https://api.ociswap.com/pools?resource_address=${tokenAddress}`
            : 'https://api.ociswap.com/pools';
            
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'accept': 'application/json',
            }
        });

        if (!response.ok) {
            throw new Error(`OciSwap API error: ${response.status}`);
        }

        const data = await response.json();
        
        // Map OciSwap response to our PoolInfo structure
        return data.map((pool: any) => ({
            poolAddress: pool.address,
            dex: 'ociswap',
            token0Address: pool.resource_x.address,
            token1Address: pool.resource_y.address,
            token0Symbol: pool.resource_x.symbol,
            token1Symbol: pool.resource_y.symbol,
            token0Amount: pool.resource_x.amount,
            token1Amount: pool.resource_y.amount,
            price: parseFloat(pool.price || '0'),
            priceInverse: pool.price ? 1 / parseFloat(pool.price) : 0
        }));
    } catch (error) {
        console.error('Error fetching OciSwap pools:', error);
        return [];
    }
}

// Fetch DefiPlaza pools
export async function fetchDefiPlazaPools(tokenAddress?: string): Promise<PoolInfo[]> {
    try {
        // DefiPlaza V2 API endpoint
        const response = await fetch('https://api.defiplaza.net/radix/pairs', {
            method: 'GET',
            headers: {
                'accept': 'application/json',
            }
        });

        if (!response.ok) {
            throw new Error(`DefiPlaza API error: ${response.status}`);
        }

        const data = await response.json();
        
        // Filter by token if specified
        let pools = data;
        if (tokenAddress) {
            pools = data.filter((pool: any) => 
                pool.base_token.address === tokenAddress || 
                pool.quote_token.address === tokenAddress
            );
        }
        
        return pools.map((pool: any) => ({
            poolAddress: pool.pair_address,
            dex: 'defiplaza',
            token0Address: pool.base_token.address,
            token1Address: pool.quote_token.address,
            token0Symbol: pool.base_token.symbol,
            token1Symbol: pool.quote_token.symbol,
            token0Amount: pool.base_token.liquidity,
            token1Amount: pool.quote_token.liquidity,
            price: parseFloat(pool.price || '0'),
            priceInverse: pool.price ? 1 / parseFloat(pool.price) : 0
        }));
    } catch (error) {
        console.error('Error fetching DefiPlaza pools:', error);
        return [];
    }
}

// Fetch all pools for a given token
export async function fetchAllPoolsForToken(tokenAddress: string): Promise<PoolInfo[]> {
    const [ociPools, defiPools] = await Promise.all([
        fetchOciSwapPools(tokenAddress),
        fetchDefiPlazaPools(tokenAddress)
    ]);
    
    return [...ociPools, ...defiPools];
}

// Calculate arbitrage opportunity
export function calculateArbitrage(
    buyPool: PoolInfo,
    sellPool: PoolInfo,
    amount: number,
    tokenAddress: string
): { profit: number; profitPercent: number } {
    // Determine which token we're arbitraging
    const isBuyToken0 = buyPool.token0Address === tokenAddress;
    const isSellToken0 = sellPool.token0Address === tokenAddress;
    
    // Get prices (how much of the other token we get per unit of our token)
    const buyPrice = isBuyToken0 ? buyPool.priceInverse : buyPool.price;
    const sellPrice = isSellToken0 ? sellPool.price : sellPool.priceInverse;
    
    // Calculate profit
    const costInOtherToken = amount * buyPrice;
    const receiveInOtherToken = amount * sellPrice;
    const profit = receiveInOtherToken - costInOtherToken;
    const profitPercent = (profit / costInOtherToken) * 100;
    
    return { profit, profitPercent };
}