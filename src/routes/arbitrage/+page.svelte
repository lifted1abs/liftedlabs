<script lang="ts">
    import { onMount } from 'svelte';
    import { accountAddress } from '$lib/stores/wallet';
    import { 
        fetchAllPoolsForToken, 
        calculateArbitrage,
        TOKEN_ADDRESSES,
        type PoolInfo 
    } from '../../services/dexService';
    import { 
        buildArbitrageManifest, 
        previewTransaction 
    } from '../../services/transactionService';
    import { rdt } from '$lib/radix';
    import { fade } from 'svelte/transition';
    import { ProgressRadial } from '@skeletonlabs/skeleton';
    
    // State
    let selectedToken = TOKEN_ADDRESSES.XRD;
    let selectedTokenSymbol = 'XRD';
    let amount = 100;
    let pools: PoolInfo[] = [];
    let buyPool: PoolInfo | null = null;
    let sellPool: PoolInfo | null = null;
    let isLoading = false;
    let isPreviewLoading = false;
    let previewResult: any = null;
    let arbitrageProfit = 0;
    let arbitrageProfitPercent = 0;
    
    $: selectedAccount = $accountAddress;
    
    // Token options for dropdown
    const tokenOptions = [
        { label: 'XRD', value: TOKEN_ADDRESSES.XRD },
        { label: 'hUSDC', value: TOKEN_ADDRESSES.HUSDC },
        { label: 'hUSDT', value: TOKEN_ADDRESSES.HUSDT },
        { label: 'hWBTC', value: TOKEN_ADDRESSES.HWBTC },
        { label: 'hETH', value: TOKEN_ADDRESSES.HETH }
    ];
    
    // Fetch pools when token changes
    async function loadPools() {
        isLoading = true;
        pools = [];
        buyPool = null;
        sellPool = null;
        previewResult = null;
        
        try {
            pools = await fetchAllPoolsForToken(selectedToken);
            
            // Sort pools by price for easy identification
            pools.sort((a, b) => {
                const aPrice = a.token0Address === selectedToken ? a.price : a.priceInverse;
                const bPrice = b.token0Address === selectedToken ? b.price : b.priceInverse;
                return aPrice - bPrice;
            });
            
            // Auto-select best arbitrage opportunity if pools exist
            if (pools.length >= 2) {
                buyPool = pools[0]; // Cheapest
                sellPool = pools[pools.length - 1]; // Most expensive
                calculatePotentialProfit();
            }
        } catch (error) {
            console.error('Error loading pools:', error);
        } finally {
            isLoading = false;
        }
    }
    
    // Calculate potential profit
    function calculatePotentialProfit() {
        if (buyPool && sellPool && amount > 0) {
            const result = calculateArbitrage(buyPool, sellPool, amount, selectedToken);
            arbitrageProfit = result.profit;
            arbitrageProfitPercent = result.profitPercent;
        }
    }
    
    // Preview transaction
    async function handlePreview() {
        if (!buyPool || !sellPool || !selectedAccount || amount <= 0) return;
        
        isPreviewLoading = true;
        try {
            const manifest = buildArbitrageManifest(
                selectedAccount,
                buyPool,
                sellPool,
                selectedToken,
                amount
            );
            
            previewResult = await previewTransaction(manifest);
            console.log('Preview result:', previewResult);
        } catch (error) {
            console.error('Error previewing transaction:', error);
        } finally {
            isPreviewLoading = false;
        }
    }
    
    // Execute arbitrage
    async function handleExecute() {
        if (!buyPool || !sellPool || !selectedAccount || !rdt || amount <= 0) return;
        
        try {
            const manifest = buildArbitrageManifest(
                selectedAccount,
                buyPool,
                sellPool,
                selectedToken,
                amount
            );
            
            const result = await rdt.walletApi.sendTransaction({
                transactionManifest: manifest
            });
            
            if (result.isErr()) {
                throw new Error(result.error.message || 'Transaction failed');
            }
            
            console.log('Transaction submitted:', result.value.transactionIntentHash);
            // Reload pools after successful transaction
            await loadPools();
        } catch (error) {
            console.error('Error executing arbitrage:', error);
        }
    }
    
    // Format pool display name
    function formatPoolName(pool: PoolInfo): string {
        return `${pool.token0Symbol}/${pool.token1Symbol} - ${pool.dex.toUpperCase()}`;
    }
    
    // Get pool price for selected token
    function getPoolPrice(pool: PoolInfo): number {
        return pool.token0Address === selectedToken ? pool.price : pool.priceInverse;
    }
    
    // Handle token selection
    function handleTokenSelect(event: Event) {
        const target = event.target as HTMLSelectElement;
        selectedToken = target.value;
        selectedTokenSymbol = tokenOptions.find(t => t.value === selectedToken)?.label || 'Unknown';
        loadPools();
    }
    
    // Handle pool selection
    function selectBuyPool(pool: PoolInfo) {
        buyPool = pool;
        calculatePotentialProfit();
    }
    
    function selectSellPool(pool: PoolInfo) {
        sellPool = pool;
        calculatePotentialProfit();
    }
    
    // Update calculations when amount changes
    $: if (amount && buyPool && sellPool) {
        calculatePotentialProfit();
    }
    
    onMount(() => {
        if (selectedAccount) {
            loadPools();
        }
    });
</script>

<svelte:head>
    <title>Arbitrage - Lifted Labs</title>
</svelte:head>

<div class="container max-w-7xl mx-auto p-4">
    {#if !selectedAccount}
        <div class="text-center py-12" in:fade>
            <div class="card p-8 variant-soft-surface max-w-md mx-auto">
                <h2 class="text-2xl font-bold mb-4">Wallet Not Connected</h2>
                <p class="text-gray-400">Please connect your wallet to start arbitrage trading</p>
            </div>
        </div>
    {:else}
        <div class="space-y-6" in:fade>
            <!-- Header -->
            <div class="text-center">
                <h1 class="text-3xl font-bold mb-2">Arbitrage Trading</h1>
                <p class="text-gray-400">Find and execute profitable arbitrage opportunities</p>
            </div>
            
            <!-- Token Selection and Amount -->
            <div class="card p-6 variant-soft-surface">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="label">
                            <span>Select Token</span>
                            <select 
                                class="select"
                                on:change={handleTokenSelect}
                                disabled={isLoading}
                            >
                                {#each tokenOptions as token}
                                    <option value={token.value}>{token.label}</option>
                                {/each}
                            </select>
                        </label>
                    </div>
                    
                    <div>
                        <label class="label">
                            <span>Amount</span>
                            <input 
                                type="number" 
                                class="input"
                                bind:value={amount}
                                min="0"
                                step="0.1"
                                disabled={isLoading}
                            />
                        </label>
                    </div>
                </div>
            </div>
            
            <!-- Pool Selection Grid -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- Buy From (Cheapest) -->
                <div class="card p-6 variant-soft-primary">
                    <h2 class="text-xl font-bold mb-4 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        Buy From (Lower Price)
                    </h2>
                    
                    {#if isLoading}
                        <div class="flex justify-center py-8">
                            <ProgressRadial width="w-12" />
                        </div>
                    {:else if pools.length === 0}
                        <p class="text-gray-400 text-center py-8">No pools found for this token</p>
                    {:else}
                        <div class="space-y-2 max-h-96 overflow-y-auto">
                            {#each pools as pool}
                                <button
                                    class="w-full p-4 rounded-lg border-2 transition-all text-left
                                        {buyPool === pool 
                                            ? 'bg-primary-500/20 border-primary-500' 
                                            : 'bg-surface-700 border-surface-600 hover:border-primary-500/50'}"
                                    on:click={() => selectBuyPool(pool)}
                                >
                                    <div class="flex justify-between items-start">
                                        <div>
                                            <p class="font-semibold">{formatPoolName(pool)}</p>
                                            <p class="text-sm text-gray-400">
                                                Price: {getPoolPrice(pool).toFixed(6)}
                                            </p>
                                        </div>
                                        <span class="badge variant-soft-secondary">
                                            {pool.dex.toUpperCase()}
                                        </span>
                                    </div>
                                    <div class="mt-2 text-xs text-gray-500">
                                        Liquidity: {parseFloat(pool.token0Amount).toLocaleString()} / {parseFloat(pool.token1Amount).toLocaleString()}
                                    </div>
                                </button>
                            {/each}
                        </div>
                    {/if}
                </div>
                
                <!-- Sell To (Most Expensive) -->
                <div class="card p-6 variant-soft-tertiary">
                    <h2 class="text-xl font-bold mb-4 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Sell To (Higher Price)
                    </h2>
                    
                    {#if isLoading}
                        <div class="flex justify-center py-8">
                            <ProgressRadial width="w-12" />
                        </div>
                    {:else if pools.length === 0}
                        <p class="text-gray-400 text-center py-8">No pools found for this token</p>
                    {:else}
                        <div class="space-y-2 max-h-96 overflow-y-auto">
                            {#each [...pools].reverse() as pool}
                                <button
                                    class="w-full p-4 rounded-lg border-2 transition-all text-left
                                        {sellPool === pool 
                                            ? 'bg-tertiary-500/20 border-tertiary-500' 
                                            : 'bg-surface-700 border-surface-600 hover:border-tertiary-500/50'}"
                                    on:click={() => selectSellPool(pool)}
                                >
                                    <div class="flex justify-between items-start">
                                        <div>
                                            <p class="font-semibold">{formatPoolName(pool)}</p>
                                            <p class="text-sm text-gray-400">
                                                Price: {getPoolPrice(pool).toFixed(6)}
                                            </p>
                                        </div>
                                        <span class="badge variant-soft-secondary">
                                            {pool.dex.toUpperCase()}
                                        </span>
                                    </div>
                                    <div class="mt-2 text-xs text-gray-500">
                                        Liquidity: {parseFloat(pool.token0Amount).toLocaleString()} / {parseFloat(pool.token1Amount).toLocaleString()}
                                    </div>
                                </button>
                            {/each}
                        </div>
                    {/if}
                </div>
            </div>
            
            <!-- Profit Calculation -->
            {#if buyPool && sellPool}
                <div class="card p-6 variant-soft-success" in:fade>
                    <h3 class="text-lg font-bold mb-4">Arbitrage Opportunity</h3>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <p class="text-sm text-gray-400">Buy Price</p>
                            <p class="text-xl font-bold">{getPoolPrice(buyPool).toFixed(6)}</p>
                        </div>
                        <div>
                            <p class="text-sm text-gray-400">Sell Price</p>
                            <p class="text-xl font-bold">{getPoolPrice(sellPool).toFixed(6)}</p>
                        </div>
                        <div>
                            <p class="text-sm text-gray-400">Potential Profit</p>
                            <p class="text-xl font-bold {arbitrageProfit > 0 ? 'text-success-500' : 'text-error-500'}">
                                {arbitrageProfit.toFixed(4)} ({arbitrageProfitPercent.toFixed(2)}%)
                            </p>
                        </div>
                    </div>
                    
                    <!-- Action Buttons -->
                    <div class="flex gap-4 mt-6">
                        <button 
                            class="btn variant-filled-secondary flex-1"
                            on:click={handlePreview}
                            disabled={isPreviewLoading || arbitrageProfit <= 0}
                        >
                            {#if isPreviewLoading}
                                <ProgressRadial width="w-5" />
                            {:else}
                                Preview Transaction
                            {/if}
                        </button>
                        
                        <button 
                            class="btn variant-filled-primary flex-1"
                            on:click={handleExecute}
                            disabled={arbitrageProfit <= 0 || !previewResult}
                        >
                            Execute Arbitrage
                        </button>
                    </div>
                </div>
            {/if}
            
            <!-- Preview Result -->
            {#if previewResult}
                <div class="card p-6 variant-soft-surface" in:fade>
                    <h3 class="text-lg font-bold mb-4">Transaction Preview</h3>
                    <details class="space-y-2">
                        <summary class="cursor-pointer">View Details</summary>
                        <pre class="text-xs overflow-auto p-4 bg-surface-800 rounded">{JSON.stringify(previewResult, null, 2)}</pre>
                    </details>
                </div>
            {/if}
        </div>
    {/if}
</div>