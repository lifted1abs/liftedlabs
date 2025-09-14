<script lang="ts">
    import { onMount } from 'svelte';
    import { accountAddress } from '$lib/stores/wallet';
    import { rdt } from '$lib/radix';
    import { fade } from 'svelte/transition';
    
    // Pool interface
    interface Pool {
        address: string;
        dex: string;
        token0: string;
        token1: string;
        name: string;
    }
    
    // Token addresses
    const XRD = 'resource_rdx1tknxxxxxxxxxradxrdxxxxxxxxx009923554798xxxxxxxxxradxrd';
    const HUSDC = 'resource_rdx1thxj9m87sn5cc9ehgp9qxp6vzeqxtce90xm5cp33373tclyp4et4gv';
    const HUSDT = 'resource_rdx1th4v03gezwgzkuma6p38lnum8ww8t4ds9nvcrkr2p9ft6kxx3kxvhe';
    const HETH = 'resource_rdx1th09yvv7tgsrv708ffsgqjjf2mhy84mscmj5jwu4g670fh3e5zgef0';
    const HWBTC = 'resource_rdx1t58kkcqdz0mavfz98m98qh9m4jexyl9tacsvlhns6yxs4r6hrm5re5';
    
    // Token icons
    const TOKEN_ICONS: Record<string, string> = {
        [XRD]: 'https://assets.radixdlt.com/icons/icon-xrd.png',
        [HUSDC]: 'https://assets.radixdlt.com/icons/hyperlane/hUSDC.svg',
        [HUSDT]: 'https://assets.radixdlt.com/icons/hyperlane/hUSDT.svg',
        [HETH]: 'https://assets.radixdlt.com/icons/hyperlane/hETH.svg',
        [HWBTC]: 'https://assets.radixdlt.com/icons/hyperlane/hBTC.svg'
    };
    
    // DEX icons
    const DEX_ICONS: Record<string, string> = {
        'ociswap': 'https://ociswap.com/icons/oci.png',
        'defiplaza': 'https://radix.defiplaza.net/assets/img/babylon/defiplaza-icon.png',
        'caviar': 'https://assets.caviarnine.com/tokens/caviar_babylon.png'
    };
    
    // All pools
    const ALL_POOLS: Pool[] = [
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
        
        // Caviar Pools
        { address: 'component_rdx1cqth4gp6fedux4rrjzk6gu04c24sfnhzrh9t052ufsh7n5ljrslltw', dex: 'caviar', token0: XRD, token1: HUSDC, name: 'Caviar XRD/hUSDC' },
        { address: 'component_rdx1crj9m0m45cy3a38968n8cs0sg2hvvnyl75x7y6wppg0x4dtf72092e', dex: 'caviar', token0: XRD, token1: HUSDT, name: 'Caviar XRD/hUSDT' },
        { address: 'component_rdx1cpwu2rv3p4qqsayk5tc072kw94ygqyusemuqje7udxhgt3253m830q', dex: 'caviar', token0: XRD, token1: HETH, name: 'Caviar XRD/hETH' },
        { address: 'component_rdx1cpftfjyyyrca5twzsr557at8uka20ynsn5wucy9pe7sgxnrse24m5h', dex: 'caviar', token0: XRD, token1: HWBTC, name: 'Caviar XRD/hWBTC' }
    ];
    
    // State variables
    let selectedBuyPool: Pool | null = null;
    let selectedSellPool: Pool | null = null;
    let xrdAmount: number = 10000;
    let isPreviewLoading = false;
    let previewResult: any = null;
    let xrdPrice: number = 0;
    let poolPrices: Record<string, number> = {};
    let isLoadingPrices = false;
    
    $: selectedAccount = $accountAddress;
    
    // Calculate USD values
    $: xrdAmountUsd = xrdAmount * xrdPrice;
    $: xrdReturnedUsd = previewResult ? previewResult.xrdReturned * xrdPrice : 0;
    
    // Sort pools by price (cheapest to most expensive)
    function sortPoolsByPrice(pools: Pool[]): Pool[] {
        return [...pools].sort((a, b) => {
            const priceA = poolPrices[a.address] || Infinity;
            const priceB = poolPrices[b.address] || Infinity;
            return priceA - priceB;
        });
    }
    
    // Group and sort pools by token pair
    $: husdcPools = sortPoolsByPrice(ALL_POOLS.filter(p => p.token1 === HUSDC));
    $: husdtPools = sortPoolsByPrice(ALL_POOLS.filter(p => p.token1 === HUSDT));
    $: hethPools = sortPoolsByPrice(ALL_POOLS.filter(p => p.token1 === HETH));
    $: hwbtcPools = sortPoolsByPrice(ALL_POOLS.filter(p => p.token1 === HWBTC));
    
    // Calculate profit
    $: profit = previewResult?.xrdReturned ? previewResult.xrdReturned - xrdAmount - (previewResult.txFees || 0) : 0;
    $: profitPercent = xrdAmount > 0 ? (profit / xrdAmount) * 100 : 0;
    
    // Auto-preview when pools selected or amount changes
    $: if (selectedBuyPool && selectedSellPool && xrdAmount > 0 && selectedAccount) {
        handlePreview();
    }
    
    // Truncate address helper
    function truncateAddress(address: string): string {
        return `${address.slice(0, 4)}...${address.slice(-4)}`;
    }
    
    // Extract resources from preview
    function extractResourcesFromPreview(previewResult: any) {
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
    
    // Load prices
    async function loadPrices() {
        console.log('Starting to load prices...');
        isLoadingPrices = true;
        
        try {
            // Fetch XRD price
            const xrdResponse = await fetch(`https://api.ociswap.com/tokens/${XRD}`);
            const xrdData = await xrdResponse.json();
            xrdPrice = xrdData?.price?.usd?.now || 0;
            console.log('XRD Price:', xrdPrice);
            
            const testAmount = 1000;
            const prices: Record<string, number> = {};
            
            // Get all prices
            for (const pool of ALL_POOLS) {
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
                    
                    const result = await response.json();
                    const resources = extractResourcesFromPreview(result);
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
            poolPrices = prices;
            
        } catch (error) {
            console.error('Error loading prices:', error);
        } finally {
            isLoadingPrices = false;
        }
    }
    
    // Build arbitrage manifest
    function buildArbitrageManifest(
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
    
    // Handle pool selection
    function selectPool(pool: Pool) {
        if (!selectedBuyPool) {
            selectedBuyPool = pool;
        } else if (!selectedSellPool && pool.token1 === selectedBuyPool.token1 && pool.address !== selectedBuyPool.address) {
            selectedSellPool = pool;
        }
    }
    
    // Clear selections
    function clearSelections() {
        selectedBuyPool = null;
        selectedSellPool = null;
        previewResult = null;
    }
    
    // Preview transaction
    async function handlePreview() {
        if (!selectedBuyPool || !selectedSellPool || !selectedAccount || xrdAmount <= 0) return;
        
        isPreviewLoading = true;
        try {
            const manifest = buildArbitrageManifest(
                selectedAccount,
                selectedBuyPool,
                selectedSellPool,
                xrdAmount
            );
            
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
            
            const result = await response.json();
            const resources = extractResourcesFromPreview(result);
            const xrdResource = resources.find(r => r.resourceAddress === XRD);
            const xrdReturned = xrdResource ? xrdResource.amount : 0;
            
            // Fix: Extract fee from fee_summary
            const txFees = result.fee_summary?.execution_cost_sum 
                ? parseFloat(result.fee_summary.execution_cost_sum) 
                : 0;
            
            previewResult = {
                xrdReturned,
                txFees,
                rawResult: result
            };
        } catch (error) {
            console.error('Error previewing transaction:', error);
        } finally {
            isPreviewLoading = false;
        }
    }
    
    // Execute arbitrage
    async function handleExecute() {
        if (!selectedBuyPool || !selectedSellPool || !selectedAccount || !rdt || xrdAmount <= 0) return;
        
        try {
            const manifest = buildArbitrageManifest(
                selectedAccount,
                selectedBuyPool,
                selectedSellPool,
                xrdAmount
            );
            
            const result = await rdt.walletApi.sendTransaction({
                transactionManifest: manifest
            });
            
            if (result.isErr()) {
                throw new Error(result.error.message || 'Transaction failed');
            }
            
            console.log('Transaction submitted:', result.value.transactionIntentHash);
            clearSelections();
            await loadPrices();
        } catch (error) {
            console.error('Error executing arbitrage:', error);
        }
    }
    
    // Helper functions
    function getPoolPrice(pool: Pool): string {
        const price = poolPrices[pool.address];
        return price ? `$${price.toFixed(4)}` : '--';
    }
    
    function isPoolSelected(pool: Pool): boolean {
        return (selectedBuyPool?.address === pool.address) || 
               (selectedSellPool?.address === pool.address);
    }
    
    function getPoolSelectionType(pool: Pool): string {
        if (selectedBuyPool?.address === pool.address) return 'buy';
        if (selectedSellPool?.address === pool.address) return 'sell';
        return '';
    }
    
    function getTokenSymbol(address: string): string {
        switch(address) {
            case HUSDC: return 'hUSDC';
            case HUSDT: return 'hUSDT';
            case HETH: return 'hETH';
            case HWBTC: return 'hWBTC';
            default: return '';
        }
    }
    
    // Load prices when wallet connects
    $: if (selectedAccount && Object.keys(poolPrices).length === 0) {
        loadPrices();
    }
    
    onMount(() => {
        if (selectedAccount) {
            loadPrices();
        }
    });
</script>

<svelte:head>
    <title>Arbitrage - Lifted Labs</title>
</svelte:head>

<div class="container max-w-7xl mx-auto p-2">
    {#if !selectedAccount}
        <div class="text-center py-12" in:fade>
            <div class="card p-8 variant-soft-surface max-w-md mx-auto">
                <h2 class="text-2xl font-bold mb-4">Wallet Not Connected</h2>
                <p class="text-gray-400">Please connect your wallet to start arbitrage trading</p>
            </div>
        </div>
    {:else}
        <div class="space-y-4" in:fade>
            <!-- Compact Header -->
            <div class="flex justify-between items-center">
                <h1 class="text-2xl font-bold">Manual Arbitrage</h1>
                <button 
                    class="btn btn-sm variant-ghost-surface"
                    on:click={loadPrices}
                    disabled={isLoadingPrices}
                >
                    {#if isLoadingPrices}
                        <span class="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                    {:else}
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    {/if}
                </button>
            </div>
            
            <!-- Selection Area with larger Icons -->
            <div class="card p-3 variant-soft-surface">
                <div class="grid grid-cols-1 lg:grid-cols-7 gap-3 items-center">
                    <!-- Buy From -->
                    <div class="lg:col-span-2">
                        <label class="text-xs text-gray-400 mb-1 block">Buy From</label>
                        <div class="min-h-[80px] p-2 rounded-lg border-2 border-dashed
                            {selectedBuyPool ? 'bg-primary-500/10 border-primary-500' : 'border-surface-500'}">
                            {#if selectedBuyPool}
                                <div class="flex items-center gap-2">
                                    <img src={DEX_ICONS[selectedBuyPool.dex]} alt={selectedBuyPool.dex} class="w-8 h-8" />
                                    <div class="flex gap-1">
                                        <img src={TOKEN_ICONS[selectedBuyPool.token0]} alt="XRD" class="w-7 h-7" />
                                        <img src={TOKEN_ICONS[selectedBuyPool.token1]} alt="Token" class="w-7 h-7" />
                                    </div>
                                </div>
                                <div class="text-lg font-bold mt-1">{getPoolPrice(selectedBuyPool)}</div>
                                <div class="text-xs text-gray-500">{truncateAddress(selectedBuyPool.address)}</div>
                            {:else}
                                <div class="text-center text-gray-500 mt-5">Select pool</div>
                            {/if}
                        </div>
                    </div>
                    
                    <!-- Arrow -->
                    <div class="hidden lg:flex justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                    </div>
                    
                    <!-- Sell To -->
                    <div class="lg:col-span-2">
                        <label class="text-xs text-gray-400 mb-1 block">Sell To</label>
                        <div class="min-h-[80px] p-2 rounded-lg border-2 border-dashed
                            {selectedSellPool ? 'bg-tertiary-500/10 border-tertiary-500' : 'border-surface-500'}">
                            {#if selectedSellPool}
                                <div class="flex items-center gap-2">
                                    <img src={DEX_ICONS[selectedSellPool.dex]} alt={selectedSellPool.dex} class="w-8 h-8" />
                                    <div class="flex gap-1">
                                        <img src={TOKEN_ICONS[selectedSellPool.token0]} alt="XRD" class="w-7 h-7" />
                                        <img src={TOKEN_ICONS[selectedSellPool.token1]} alt="Token" class="w-7 h-7" />
                                    </div>
                                </div>
                                <div class="text-lg font-bold mt-1">{getPoolPrice(selectedSellPool)}</div>
                                <div class="text-xs text-gray-500">{truncateAddress(selectedSellPool.address)}</div>
                            {:else}
                                <div class="text-center text-gray-500 mt-5">Select pool</div>
                            {/if}
                        </div>
                    </div>
                    
                    <!-- Amount & Clear -->
                    <div class="lg:col-span-2 flex gap-2">
                        <div class="flex-1">
                            <label class="text-xs text-gray-400 mb-1 block">XRD Amount</label>
                            <input 
                                type="number" 
                                class="input input-sm"
                                bind:value={xrdAmount}
                                min="0"
                                step="10"
                            />
                        </div>
                        <button 
                            class="btn btn-sm variant-ghost-surface mt-5"
                            on:click={clearSelections}
                            disabled={!selectedBuyPool && !selectedSellPool}
                        >
                            Clear
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- Transaction Preview with USD values -->
            {#if selectedBuyPool && selectedSellPool && previewResult}
                <div class="card p-3 variant-soft-{profit > 0 ? 'success' : 'error'}" in:fade>
                    <div class="flex justify-between items-center">
                        <div class="flex gap-6">
                            <div>
                                <p class="text-xs text-gray-400">XRD In</p>
                                <p class="font-bold">{xrdAmount.toLocaleString()}</p>
                                <p class="text-xs text-gray-500">${xrdAmountUsd.toFixed(2)}</p>
                            </div>
                            <div>
                                <p class="text-xs text-gray-400">XRD Out</p>
                                <p class="font-bold">{previewResult.xrdReturned.toFixed(2)}</p>
                                <p class="text-xs text-gray-500">${xrdReturnedUsd.toFixed(2)}</p>
                            </div>
                            <div>
                                <p class="text-xs text-gray-400">Fees</p>
                                <p class="font-bold">{previewResult.txFees.toFixed(4)}</p>
                                <p class="text-xs text-gray-500">${(previewResult.txFees * xrdPrice).toFixed(2)}</p>
                            </div>
                            <div>
                                <p class="text-xs text-gray-400">Net Profit</p>
                                <p class="font-bold {profit > 0 ? 'text-success-500' : 'text-error-500'}">
                                    {profit.toFixed(2)} ({profitPercent.toFixed(2)}%)
                                </p>
                                <p class="text-xs {profit > 0 ? 'text-success-400' : 'text-error-400'}">
                                    ${(profit * xrdPrice).toFixed(2)}
                                </p>
                            </div>
                        </div>
                        <button 
                            class="btn btn-sm variant-filled-primary"
                            on:click={handleExecute}
                            disabled={profit <= 0}
                        >
                            Submit Transaction
                        </button>
                    </div>
                </div>
            {/if}
            
            <!-- Pool Grid with larger icons and prices -->
            <div class="space-y-3">
                <!-- hUSDC Pools -->
                <div class="card p-3 variant-soft-surface">
                    <div class="flex items-center gap-2 mb-2">
                        <img src={TOKEN_ICONS[HUSDC]} alt="hUSDC" class="w-6 h-6" />
                        <span class="font-semibold text-base">{getTokenSymbol(HUSDC)} Pools</span>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                        {#each husdcPools as pool}
                            <button
                                class="p-3 rounded-lg border transition-all
                                    {isPoolSelected(pool) 
                                        ? getPoolSelectionType(pool) === 'buy' 
                                            ? 'bg-primary-500/20 border-primary-500' 
                                            : 'bg-tertiary-500/20 border-tertiary-500'
                                        : 'bg-surface-700 border-surface-600 hover:border-surface-500'}"
                                on:click={() => selectPool(pool)}
                                disabled={selectedBuyPool && selectedSellPool && !isPoolSelected(pool)}
                            >
                                <div class="flex items-center justify-between gap-2">
                                    <!-- DEX Icon - 2x bigger -->
                                    <img src={DEX_ICONS[pool.dex]} alt={pool.dex} class="w-12 h-12 flex-shrink-0" />
                                    
                                    <!-- Token Pair Icons - 2x bigger -->
                                    <div class="flex gap-1 flex-shrink-0">
                                        <img src={TOKEN_ICONS[XRD]} alt="XRD" class="w-8 h-8" />
                                        <img src={TOKEN_ICONS[pool.token1]} alt="Token" class="w-8 h-8" />
                                    </div>
                                    
                                    <!-- Price - 2x bigger -->
                                    <div class="text-right flex-1">
                                        <div class="text-2xl font-bold">
                                            {#if poolPrices[pool.address]}
                                                ${poolPrices[pool.address].toFixed(3)}
                                            {:else}
                                                <span class="text-gray-500">--</span>
                                            {/if}
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Component Address -->
                                <div class="text-xs text-gray-500 mt-2">{truncateAddress(pool.address)}</div>
                                
                                {#if isPoolSelected(pool)}
                                    <div class="text-sm mt-1 text-center font-semibold
                                        {getPoolSelectionType(pool) === 'buy' ? 'text-primary-400' : 'text-tertiary-400'}">
                                        {getPoolSelectionType(pool).toUpperCase()}
                                    </div>
                                {/if}
                            </button>
                        {/each}
                    </div>
                </div>
                
                <!-- hUSDT Pools -->
                <div class="card p-3 variant-soft-surface">
                    <div class="flex items-center gap-2 mb-2">
                        <img src={TOKEN_ICONS[HUSDT]} alt="hUSDT" class="w-6 h-6" />
                        <span class="font-semibold text-base">{getTokenSymbol(HUSDT)} Pools</span>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                        {#each husdtPools as pool}
                            <button
                                class="p-3 rounded-lg border transition-all
                                    {isPoolSelected(pool) 
                                        ? getPoolSelectionType(pool) === 'buy' 
                                            ? 'bg-primary-500/20 border-primary-500' 
                                            : 'bg-tertiary-500/20 border-tertiary-500'
                                        : 'bg-surface-700 border-surface-600 hover:border-surface-500'}"
                                on:click={() => selectPool(pool)}
                                disabled={selectedBuyPool && selectedSellPool && !isPoolSelected(pool)}
                            >
                                <div class="flex items-center justify-between gap-2">
                                    <!-- DEX Icon - 2x bigger -->
                                    <img src={DEX_ICONS[pool.dex]} alt={pool.dex} class="w-12 h-12 flex-shrink-0" />
                                    
                                    <!-- Token Pair Icons - 2x bigger -->
                                    <div class="flex gap-1 flex-shrink-0">
                                        <img src={TOKEN_ICONS[XRD]} alt="XRD" class="w-8 h-8" />
                                        <img src={TOKEN_ICONS[pool.token1]} alt="Token" class="w-8 h-8" />
                                    </div>
                                    
                                    <!-- Price - 2x bigger -->
                                    <div class="text-right flex-1">
                                        <div class="text-2xl font-bold">
                                            {#if poolPrices[pool.address]}
                                                ${poolPrices[pool.address].toFixed(3)}
                                            {:else}
                                                <span class="text-gray-500">--</span>
                                            {/if}
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Component Address -->
                                <div class="text-xs text-gray-500 mt-2">{truncateAddress(pool.address)}</div>
                                
                                {#if isPoolSelected(pool)}
                                    <div class="text-sm mt-1 text-center font-semibold
                                        {getPoolSelectionType(pool) === 'buy' ? 'text-primary-400' : 'text-tertiary-400'}">
                                        {getPoolSelectionType(pool).toUpperCase()}
                                    </div>
                                {/if}
                            </button>
                        {/each}
                    </div>
                </div>
                
                <!-- hETH Pools -->
                <div class="card p-3 variant-soft-surface">
                    <div class="flex items-center gap-2 mb-2">
                        <img src={TOKEN_ICONS[HETH]} alt="hETH" class="w-6 h-6" />
                        <span class="font-semibold text-base">{getTokenSymbol(HETH)} Pools</span>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                        {#each hethPools as pool}
                            <button
                                class="p-3 rounded-lg border transition-all
                                    {isPoolSelected(pool) 
                                        ? getPoolSelectionType(pool) === 'buy' 
                                            ? 'bg-primary-500/20 border-primary-500' 
                                            : 'bg-tertiary-500/20 border-tertiary-500'
                                        : 'bg-surface-700 border-surface-600 hover:border-surface-500'}"
                                on:click={() => selectPool(pool)}
                                disabled={selectedBuyPool && selectedSellPool && !isPoolSelected(pool)}
                            >
                                <div class="flex items-center justify-between gap-2">
                                    <!-- DEX Icon - 2x bigger -->
                                    <img src={DEX_ICONS[pool.dex]} alt={pool.dex} class="w-12 h-12 flex-shrink-0" />
                                    
                                    <!-- Token Pair Icons - 2x bigger -->
                                    <div class="flex gap-1 flex-shrink-0">
                                        <img src={TOKEN_ICONS[XRD]} alt="XRD" class="w-8 h-8" />
                                        <img src={TOKEN_ICONS[pool.token1]} alt="Token" class="w-8 h-8" />
                                    </div>
                                    
                                    <!-- Price - 2x bigger -->
                                    <div class="text-right flex-1">
                                        <div class="text-2xl font-bold">
                                            {#if poolPrices[pool.address]}
                                                ${poolPrices[pool.address].toFixed(3)}
                                            {:else}
                                                <span class="text-gray-500">--</span>
                                            {/if}
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Component Address -->
                                <div class="text-xs text-gray-500 mt-2">{truncateAddress(pool.address)}</div>
                                
                                {#if isPoolSelected(pool)}
                                    <div class="text-sm mt-1 text-center font-semibold
                                        {getPoolSelectionType(pool) === 'buy' ? 'text-primary-400' : 'text-tertiary-400'}">
                                        {getPoolSelectionType(pool).toUpperCase()}
                                    </div>
                                {/if}
                            </button>
                        {/each}
                    </div>
                </div>
                
                <!-- hWBTC Pools -->
                <div class="card p-3 variant-soft-surface">
                    <div class="flex items-center gap-2 mb-2">
                        <img src={TOKEN_ICONS[HWBTC]} alt="hWBTC" class="w-6 h-6" />
                        <span class="font-semibold text-base">{getTokenSymbol(HWBTC)} Pools</span>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                        {#each hwbtcPools as pool}
                            <button
                                class="p-3 rounded-lg border transition-all
                                    {isPoolSelected(pool) 
                                        ? getPoolSelectionType(pool) === 'buy' 
                                            ? 'bg-primary-500/20 border-primary-500' 
                                            : 'bg-tertiary-500/20 border-tertiary-500'
                                        : 'bg-surface-700 border-surface-600 hover:border-surface-500'}"
                                on:click={() => selectPool(pool)}
                                disabled={selectedBuyPool && selectedSellPool && !isPoolSelected(pool)}
                            >
                                <div class="flex items-center justify-between gap-2">
                                    <!-- DEX Icon - 2x bigger -->
                                    <img src={DEX_ICONS[pool.dex]} alt={pool.dex} class="w-12 h-12 flex-shrink-0" />
                                    
                                    <!-- Token Pair Icons - 2x bigger -->
                                    <div class="flex gap-1 flex-shrink-0">
                                        <img src={TOKEN_ICONS[XRD]} alt="XRD" class="w-8 h-8" />
                                        <img src={TOKEN_ICONS[pool.token1]} alt="Token" class="w-8 h-8" />
                                    </div>
                                    
                                    <!-- Price - 2x bigger -->
                                    <div class="text-right flex-1">
                                        <div class="text-2xl font-bold">
                                            {#if poolPrices[pool.address]}
                                                ${poolPrices[pool.address].toFixed(3)}
                                            {:else}
                                                <span class="text-gray-500">--</span>
                                            {/if}
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Component Address -->
                                <div class="text-xs text-gray-500 mt-2">{truncateAddress(pool.address)}</div>
                                
                                {#if isPoolSelected(pool)}
                                    <div class="text-sm mt-1 text-center font-semibold
                                        {getPoolSelectionType(pool) === 'buy' ? 'text-primary-400' : 'text-tertiary-400'}">
                                        {getPoolSelectionType(pool).toUpperCase()}
                                    </div>
                                {/if}
                            </button>
                        {/each}
                    </div>
                </div>
            </div>
        </div>
    {/if}
</div>