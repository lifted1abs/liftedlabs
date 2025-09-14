// /src/services/ledgerService.ts

import { XRD } from '$lib/constants/tokens';
import type { Pool } from '$lib/constants/pools';

// Extract resources from arbitrage preview
export function extractResourcesFromArbitragePreview(previewResult: any) {
    try {
        const resources = [];
        
        if (previewResult.resource_changes && Array.isArray(previewResult.resource_changes)) {
            for (const changeGroup of previewResult.resource_changes) {
                if (changeGroup.resource_changes && Array.isArray(changeGroup.resource_changes)) {
                    const firstChange = changeGroup.resource_changes[0];
                    if (firstChange?.component_entity?.entity_type?.includes('Account')) {
                        for (const change of changeGroup.resource_changes) {
                            if (change.resource_address && change.amount) {
                                const amount = parseFloat(change.amount);
                                if (amount > 0) {
                                    resources.push({
                                        resourceAddress: change.resource_address,
                                        amount: amount
                                    });
                                }
                            }
                        }
                    }
                }
            }
        }
        
        return resources;
    } catch (error) {
        console.error('Error extracting resources from preview:', error);
        return [];
    }
}

// Get XRD price from OciSwap
export async function getXrdPrice(): Promise<number> {
    try {
        const response = await fetch(`https://api.ociswap.com/tokens/${XRD}`);
        const data = await response.json();
        return data?.price?.usd?.now || 0;
    } catch (error) {
        console.error('Error fetching XRD price:', error);
        return 0;
    }
}

// Preview transaction
export async function previewTransaction(manifest: string) {
    const response = await fetch('https://mainnet.radixdlt.com/transaction/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            manifest,
            start_epoch_inclusive: 0,
            end_epoch_exclusive: 99,
            notary_is_signatory: false,
            tip_percentage: 0,
            nonce: 2,
            signer_public_keys: [],
            flags: {
                use_free_credit: true,
                assume_all_signature_proofs: true,
                skip_epoch_check: true
            }
        })
    });
    
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
}

// Load pool prices
export async function loadPoolPrices(
    pools: Pool[], 
    selectedAccount: string | null
): Promise<Record<string, number>> {
    console.log('Starting to load prices...');
    
    try {
        const xrdPrice = await getXrdPrice();
        console.log('XRD Price:', xrdPrice);
        
        const testAmount = 1000;
        const prices: Record<string, number> = {};
        
        for (const pool of pools) {
            try {
                const testAccount = selectedAccount || "account_rdx128dtethfy8ujrsfdztemyjk0kvhnah6dafr57frz85dcw2c8z0td87";
                
                const manifest = `
CALL_METHOD
    Address("${testAccount}")
    "lock_fee"
    Decimal("10")
;
CALL_METHOD
    Address("${testAccount}")
    "withdraw"
    Address("${XRD}")
    Decimal("${testAmount}")
;
TAKE_ALL_FROM_WORKTOP
    Address("${XRD}")
    Bucket("xrd_bucket")
;
CALL_METHOD
    Address("${pool.address}")
    "swap"
    Bucket("xrd_bucket")
;
CALL_METHOD
    Address("${testAccount}")
    "deposit_batch"
    Expression("ENTIRE_WORKTOP")
;`;
                
                const result = await previewTransaction(manifest);
                const resources = extractResourcesFromArbitragePreview(result);
                const tokenResource = resources.find(r => r.resourceAddress === pool.token1);
                
                if (tokenResource && tokenResource.amount > 0) {
                    const tokenPriceInXrd = testAmount / tokenResource.amount;
                    const tokenPriceInUsd = tokenPriceInXrd * xrdPrice;
                    prices[pool.address] = tokenPriceInUsd;
                    console.log(`${pool.name}: $${tokenPriceInUsd.toFixed(4)}`);
                }
                
            } catch (error) {
                console.error(`Error getting price for ${pool.name}:`, error);
            }
        }
        
        console.log('Setting prices:', prices);
        return prices;
        
    } catch (error) {
        console.error('Error loading prices:', error);
        return {};
    }
}

// Build arbitrage manifest
export function buildArbitrageManifest(
    accountAddress: string,
    buyPool: Pool,
    sellPool: Pool,
    amount: number
): string {
    const intermediateToken = buyPool.token1;
    
    return `
CALL_METHOD
    Address("${accountAddress}")
    "withdraw"
    Address("${XRD}")
    Decimal("${amount}")
;
TAKE_ALL_FROM_WORKTOP
    Address("${XRD}")
    Bucket("xrd_bucket")
;
CALL_METHOD
    Address("${buyPool.address}")
    "swap"
    Bucket("xrd_bucket")
;
TAKE_ALL_FROM_WORKTOP
    Address("${intermediateToken}")
    Bucket("token_bucket")
;
CALL_METHOD
    Address("${sellPool.address}")
    "swap"
    Bucket("token_bucket")
;
CALL_METHOD
    Address("${accountAddress}")
    "deposit_batch"
    Expression("ENTIRE_WORKTOP")
;`;
}

// Preview arbitrage transaction
export async function previewArbitrageTransaction(manifest: string) {
    const result = await previewTransaction(manifest);
    const resources = extractResourcesFromArbitragePreview(result);
    const xrdResource = resources.find(r => r.resourceAddress === XRD);
    const xrdReturned = xrdResource ? xrdResource.amount : 0;
    
    const txFees = result.fee_summary?.execution_cost_sum 
        ? parseFloat(result.fee_summary.execution_cost_sum) 
        : 0;
    
    return {
        xrdReturned,
        txFees,
        rawResult: result
    };
}