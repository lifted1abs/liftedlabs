// src/services/poolService.ts
import { ezGateway, gatewayApi } from '$lib/radix';
import { PUBLIC_API_URL } from '$env/static/public';

// Function to explore a component/pool and see what data it has
export async function explorePoolComponent(componentAddress: string) {
    try {
        console.log('Exploring component:', componentAddress);
        
        // Use ezGateway to get component info
        const componentInfo = await ezGateway.state.getComponentInfo(componentAddress);
        
        console.log('Component metadata:', componentInfo.metadata);
        console.log('Component state (raw):', componentInfo.state);
        
        // Try to parse the state with sbor-ez-mode
        // First, we need to import it dynamically (browser only)
        const s = (await import('@calamari-radix/sbor-ez-mode')).default;
        
        // Since we don't know the schema yet, let's see what we can parse
        // Try as a generic tuple or map
        try {
            // Try parsing as various common structures
            const genericParse = s.Tuple(
                s.String,
                s.Decimal,
                s.Decimal
            ).safeParse(componentInfo.state.value);
            
            if (genericParse.isOk()) {
                console.log('Parsed as tuple:', genericParse.value);
            }
        } catch (e) {
            console.log('Could not parse as simple tuple');
        }
        
        // Also get vault balances using ezGateway
        const fungibleBalances = await ezGateway.state.getComponentFungibleBalances(componentAddress);
        console.log('Fungible balances:', fungibleBalances);
        
        // Get the raw data too for comparison
        const response = await fetch(`${PUBLIC_API_URL}/state/entity/details`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                addresses: [componentAddress],
                aggregation_level: 'Vault',
                opt_ins: {
                    ancestor_identities: false,
                    component_royalty_config: false,
                    component_royalty_vault_balance: false,
                    package_royalty_vault_balance: false,
                    non_fungible_include_nfids: false,
                    explicit_metadata: []
                }
            })
        });
        
        const rawData = await response.json();
        
        return {
            metadata: componentInfo.metadata,
            state: componentInfo.state,
            fungibleBalances,
            rawData,
            parsedState: null // We'll fill this once we know the schema
        };
    } catch (error) {
        console.error('Error exploring component:', error);
        return null;
    }
}

// Function to get pool resources using ezGateway
export async function getPoolResources(poolAddress: string) {
    try {
        // Get all fungible resources in the pool
        const balances = await ezGateway.state.getComponentFungibleBalances(poolAddress);
        
        // Get resource info for each
        const resources = await Promise.all(
            balances.map(async (balance) => {
                const resourceInfo = await ezGateway.state.getResourceInfo(balance.resourceInfo.resourceAddress);
                return {
                    address: balance.resourceInfo.resourceAddress,
                    symbol: resourceInfo.metadata.symbol,
                    name: resourceInfo.metadata.name,
                    iconUrl: resourceInfo.metadata.iconUrl,
                    amount: balance.balance
                };
            })
        );
        
        return resources;
    } catch (error) {
        console.error('Error getting pool resources:', error);
        return [];
    }
}

// Function to preview a swap transaction
export async function previewSwap(
    poolAddress: string,
    methodName: string,
    tokenInAddress: string,
    amountIn: number
) {
    try {
        // Try a generic swap manifest
        const manifest = `
            CALL_METHOD
                Address("component_tdx_2_1cptxxxxxxxxxfaucetxxxxxxxxx000527798379xxxxxxxxxyulkzl")
                "free"
            ;
            TAKE_FROM_WORKTOP
                Address("${tokenInAddress}")
                Decimal("${amountIn}")
                Bucket("tokens_in")
            ;
            CALL_METHOD
                Address("${poolAddress}")
                "${methodName}"
                Bucket("tokens_in")
            ;
        `;
        
        const response = await fetch(`${PUBLIC_API_URL}/transaction/preview`, {
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
        console.log('Preview result:', result);
        
        return result;
    } catch (error) {
        console.error('Error previewing swap:', error);
        return null;
    }
}