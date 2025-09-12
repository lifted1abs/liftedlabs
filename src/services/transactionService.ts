// src/services/transactionService.ts
import { RadixDappToolkit } from '@radixdlt/radix-dapp-toolkit';

export function buildOciSwapManifest(
    accountAddress: string,
    poolAddress: string,
    tokenInAddress: string,
    tokenOutAddress: string,
    amountIn: number
): string {
    return `
        CALL_METHOD
            Address("${accountAddress}")
            "withdraw"
            Address("${tokenInAddress}")
            Decimal("${amountIn}")
        ;
        TAKE_FROM_WORKTOP
            Address("${tokenInAddress}")
            Decimal("${amountIn}")
            Bucket("tokens_in")
        ;
        CALL_METHOD
            Address("${poolAddress}")
            "swap"
            Bucket("tokens_in")
        ;
        CALL_METHOD
            Address("${accountAddress}")
            "deposit_batch"
            Expression("ENTIRE_WORKTOP")
        ;
    `;
}

export function buildDefiPlazaManifest(
    accountAddress: string,
    poolAddress: string,
    tokenInAddress: string,
    tokenOutAddress: string,
    amountIn: number
): string {
    return `
        CALL_METHOD
            Address("${accountAddress}")
            "withdraw"
            Address("${tokenInAddress}")
            Decimal("${amountIn}")
        ;
        TAKE_FROM_WORKTOP
            Address("${tokenInAddress}")
            Decimal("${amountIn}")
            Bucket("input_bucket")
        ;
        CALL_METHOD
            Address("${poolAddress}")
            "swap"
            Bucket("input_bucket")
            Address("${tokenOutAddress}")
        ;
        CALL_METHOD
            Address("${accountAddress}")
            "deposit_batch"
            Expression("ENTIRE_WORKTOP")
        ;
    `;
}

export function buildArbitrageManifest(
    accountAddress: string,
    buyPool: any,
    sellPool: any,
    tokenAddress: string,
    amount: number
): string {
    // Determine the other token in each pool
    const buyOtherToken = buyPool.token0Address === tokenAddress 
        ? buyPool.token1Address 
        : buyPool.token0Address;
    const sellOtherToken = sellPool.token0Address === tokenAddress 
        ? sellPool.token1Address 
        : sellPool.token0Address;
    
    let manifest = `
        CALL_METHOD
            Address("${accountAddress}")
            "withdraw"
            Address("${buyOtherToken}")
            Decimal("${amount}")
        ;
    `;
    
    // Buy from first pool
    if (buyPool.dex === 'ociswap') {
        manifest += `
        TAKE_FROM_WORKTOP
            Address("${buyOtherToken}")
            Decimal("${amount}")
            Bucket("buy_tokens")
        ;
        CALL_METHOD
            Address("${buyPool.poolAddress}")
            "swap"
            Bucket("buy_tokens")
        ;`;
    } else if (buyPool.dex === 'defiplaza') {
        manifest += `
        TAKE_FROM_WORKTOP
            Address("${buyOtherToken}")
            Decimal("${amount}")
            Bucket("buy_tokens")
        ;
        CALL_METHOD
            Address("${buyPool.poolAddress}")
            "swap"
            Bucket("buy_tokens")
            Address("${tokenAddress}")
        ;`;
    }
    
    // Sell to second pool
    manifest += `
        TAKE_ALL_FROM_WORKTOP
            Address("${tokenAddress}")
            Bucket("sell_tokens")
        ;
    `;
    
    if (sellPool.dex === 'ociswap') {
        manifest += `
        CALL_METHOD
            Address("${sellPool.poolAddress}")
            "swap"
            Bucket("sell_tokens")
        ;`;
    } else if (sellPool.dex === 'defiplaza') {
        manifest += `
        CALL_METHOD
            Address("${sellPool.poolAddress}")
            "swap"
            Bucket("sell_tokens")
            Address("${sellOtherToken}")
        ;`;
    }
    
    manifest += `
        CALL_METHOD
            Address("${accountAddress}")
            "deposit_batch"
            Expression("ENTIRE_WORKTOP")
        ;
    `;
    
    return manifest;
}

export async function previewTransaction(manifest: string) {
    const response = await fetch('https://mainnet.radixdlt.com/transaction/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            manifest,
            start_epoch_inclusive: 0,
            end_epoch_exclusive: 100,
            notary_is_signatory: false,
            tip_percentage: 0,
            nonce: 0,
            signer_public_keys: [],
            flags: {
                use_free_credit: true,
                assume_all_signature_proofs: true,
                skip_epoch_check: true
            }
        })
    });
    
    const result = await response.json();
    return result;
}