<script lang="ts">
    import { onMount } from 'svelte';
    import { accountAddress } from '$lib/stores/wallet';
    import { rdt } from '$lib/radix';
    import { fade } from 'svelte/transition';
    
    // Import from constants
    import { 
        XRD, HUSDC, HUSDT, HETH, HWBTC,
        TOKEN_ICONS, DEX_ICONS, getTokenSymbol
    } from '$lib/constants/tokens';
    
    import {
        ALL_POOLS, getPoolsByToken, sortPoolsByPrice, truncateAddress,
        type Pool
    } from '$lib/constants/pools';
    
    // Import from ledgerService
    import {
        loadPoolPrices, getXrdPrice,
        buildArbitrageManifest, previewArbitrageTransaction
    } from '../../services/ledgerService';
    
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
    
    // Group and sort pools by token pair - using the ORIGINAL getPoolsByToken function
    $: husdcPools = sortPoolsByPrice(getPoolsByToken(HUSDC), poolPrices);
    $: husdtPools = sortPoolsByPrice(getPoolsByToken(HUSDT), poolPrices);
    $: hethPools = sortPoolsByPrice(getPoolsByToken(HETH), poolPrices);
    $: hwbtcPools = sortPoolsByPrice(getPoolsByToken(HWBTC), poolPrices);
    
    // Calculate profit
    $: profit = previewResult?.xrdReturned ? previewResult.xrdReturned - xrdAmount - (previewResult.txFees || 0) : 0;
    $: profitPercent = xrdAmount > 0 ? (profit / xrdAmount) * 100 : 0;
    
    // Auto-preview when pools selected or amount changes
    $: if (selectedBuyPool && selectedSellPool && xrdAmount > 0 && selectedAccount) {
        handlePreview();
    }
    
    // Load prices
    async function loadPrices() {
        isLoadingPrices = true;
        try {
            xrdPrice = await getXrdPrice();
            poolPrices = await loadPoolPrices(ALL_POOLS, selectedAccount);
        } finally {
            isLoadingPrices = false;
        }
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
            
            previewResult = await previewArbitrageTransaction(manifest);
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
    
    // Helper function for pool price display
    function getPoolPrice(pool: Pool): string {
        const price = poolPrices[pool.address];
        return price ? `$${price.toFixed(4)}` : '--';
    }
    
    // Helper function to check if pool is selected
    function isPoolSelected(pool: Pool): boolean {
        return (selectedBuyPool?.address === pool.address) || 
               (selectedSellPool?.address === pool.address);
    }
    
    // Helper function to get pool selection type
    function getPoolSelectionType(pool: Pool): 'buy' | 'sell' | '' {
        if (selectedBuyPool?.address === pool.address) return 'buy';
        if (selectedSellPool?.address === pool.address) return 'sell';
        return '';
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
            <!-- Header -->
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
            
            <!-- Selection Area -->
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
            
            <!-- Transaction Preview -->
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
            
            <!-- Pool Grids -->
            <div class="space-y-3">
                <!-- hUSDC Pools -->
                <div class="card p-3 variant-soft-surface">
                    <div class="flex items-center gap-2 mb-2">
                        <img src={TOKEN_ICONS[HUSDC]} alt="hUSDC" class="w-6 h-6" />
                        <span class="font-semibold text-base">hUSDC Pools</span>
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
                                disabled={!!(selectedBuyPool && selectedSellPool && !isPoolSelected(pool))}
                            >
                                <div class="flex items-center justify-between gap-2">
                                    <img src={DEX_ICONS[pool.dex]} alt={pool.dex} class="w-12 h-12 flex-shrink-0" />
                                    
                                    <div class="flex gap-1 flex-shrink-0">
                                        <img src={TOKEN_ICONS[XRD]} alt="XRD" class="w-8 h-8" />
                                        <img src={TOKEN_ICONS[pool.token1]} alt="Token" class="w-8 h-8" />
                                    </div>
                                    
                                    <div class="text-right flex-1">
                                        <div class="text-2xl font-bold">
                                            {poolPrices[pool.address] ? `$${poolPrices[pool.address].toFixed(3)}` : '--'}
                                        </div>
                                        <div class="text-xs text-gray-500">
                                            {pool.name.includes('Simple') ? 'Simple' : pool.name.includes('Shape') ? 'Shape' : ''}
                                        </div>
                                    </div>
                                </div>
                                
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
                
                <!-- Similar blocks for hUSDT, hETH, hWBTC -->
                <!-- I'll keep these the same as before since they were working -->
                
                <!-- hUSDT Pools -->
                <div class="card p-3 variant-soft-surface">
                    <div class="flex items-center gap-2 mb-2">
                        <img src={TOKEN_ICONS[HUSDT]} alt="hUSDT" class="w-6 h-6" />
                        <span class="font-semibold text-base">hUSDT Pools</span>
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
                                disabled={!!(selectedBuyPool && selectedSellPool && !isPoolSelected(pool))}
                            >
                                <div class="flex items-center justify-between gap-2">
                                    <img src={DEX_ICONS[pool.dex]} alt={pool.dex} class="w-12 h-12 flex-shrink-0" />
                                    
                                    <div class="flex gap-1 flex-shrink-0">
                                        <img src={TOKEN_ICONS[XRD]} alt="XRD" class="w-8 h-8" />
                                        <img src={TOKEN_ICONS[pool.token1]} alt="Token" class="w-8 h-8" />
                                    </div>
                                    
                                    <div class="text-right flex-1">
                                        <div class="text-2xl font-bold">
                                            {poolPrices[pool.address] ? `$${poolPrices[pool.address].toFixed(3)}` : '--'}
                                        </div>
                                        <div class="text-xs text-gray-500">
                                            {pool.name.includes('Simple') ? 'Simple' : pool.name.includes('Shape') ? 'Shape' : ''}
                                        </div>
                                    </div>
                                </div>
                                
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
                        <span class="font-semibold text-base">hETH Pools</span>
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
                                disabled={!!(selectedBuyPool && selectedSellPool && !isPoolSelected(pool))}
                            >
                                <div class="flex items-center justify-between gap-2">
                                    <img src={DEX_ICONS[pool.dex]} alt={pool.dex} class="w-12 h-12 flex-shrink-0" />
                                    
                                    <div class="flex gap-1 flex-shrink-0">
                                        <img src={TOKEN_ICONS[XRD]} alt="XRD" class="w-8 h-8" />
                                        <img src={TOKEN_ICONS[pool.token1]} alt="Token" class="w-8 h-8" />
                                    </div>
                                    
                                    <div class="text-right flex-1">
                                        <div class="text-2xl font-bold">
                                            {poolPrices[pool.address] ? `$${poolPrices[pool.address].toFixed(3)}` : '--'}
                                        </div>
                                        <div class="text-xs text-gray-500">
                                            {pool.name.includes('Simple') ? 'Simple' : pool.name.includes('Shape') ? 'Shape' : ''}
                                        </div>
                                    </div>
                                </div>
                                
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
                        <span class="font-semibold text-base">hWBTC Pools</span>
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
                                disabled={!!(selectedBuyPool && selectedSellPool && !isPoolSelected(pool))}
                            >
                                <div class="flex items-center justify-between gap-2">
                                    <img src={DEX_ICONS[pool.dex]} alt={pool.dex} class="w-12 h-12 flex-shrink-0" />
                                    
                                    <div class="flex gap-1 flex-shrink-0">
                                        <img src={TOKEN_ICONS[XRD]} alt="XRD" class="w-8 h-8" />
                                        <img src={TOKEN_ICONS[pool.token1]} alt="Token" class="w-8 h-8" />
                                    </div>
                                    
                                    <div class="text-right flex-1">
                                        <div class="text-2xl font-bold">
                                            {poolPrices[pool.address] ? `$${poolPrices[pool.address].toFixed(3)}` : '--'}
                                        </div>
                                        <div class="text-xs text-gray-500">
                                            {pool.name.includes('Simple') ? 'Simple' : pool.name.includes('Shape') ? 'Shape' : ''}
                                        </div>
                                    </div>
                                </div>
                                
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
                
                <!-- hUSDC/hUSDT Stable Pool -->
                <div class="card p-3 variant-soft-surface">
                    <div class="flex items-center gap-2 mb-2">
                        <img src={TOKEN_ICONS[HUSDC]} alt="hUSDC" class="w-6 h-6" />
                        <img src={TOKEN_ICONS[HUSDT]} alt="hUSDT" class="w-6 h-6" />
                        <span class="font-semibold text-base">hUSDC/hUSDT Pools</span>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                        {#each ALL_POOLS.filter(p => (p.token0 === HUSDC && p.token1 === HUSDT) || (p.token0 === HUSDT && p.token1 === HUSDC)) as pool}
                            <button
                                class="p-3 rounded-lg border transition-all bg-surface-700 border-surface-600"
                                disabled={true}
                            >
                                <div class="flex items-center justify-between gap-2">
                                    <img src={DEX_ICONS[pool.dex]} alt={pool.dex} class="w-12 h-12 flex-shrink-0" />
                                    
                                    <div class="flex gap-1 flex-shrink-0">
                                        <img src={TOKEN_ICONS[pool.token0]} alt="" class="w-8 h-8" />
                                        <img src={TOKEN_ICONS[pool.token1]} alt="" class="w-8 h-8" />
                                    </div>
                                    
                                    <div class="text-right flex-1">
                                        <div class="text-2xl font-bold">--</div>
                                        <div class="text-xs text-gray-500">Shape</div>
                                    </div>
                                </div>
                                
                                <div class="text-xs text-gray-500 mt-2">{truncateAddress(pool.address)}</div>
                            </button>
                        {/each}
                    </div>
                </div>
            </div>
        </div>
    {/if}
</div>