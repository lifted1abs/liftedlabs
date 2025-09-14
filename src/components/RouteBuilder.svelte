<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import type { Pool } from '$lib/constants/pools';
    import { TOKEN_ICONS, DEX_ICONS, getTokenSymbol } from '$lib/constants/tokens';
    import { truncateAddress } from '$lib/constants/pools';
    
    export let selectedPools: (Pool | null)[] = [null, null, null];
    export let maxHops: number = 3;
    
    const dispatch = createEventDispatcher();
    
    function clearPool(index: number) {
        selectedPools[index] = null;
        // Clear any pools after this one too
        for (let i = index + 1; i < selectedPools.length; i++) {
            selectedPools[i] = null;
        }
        dispatch('update', selectedPools);
    }
    
    // Check if tokens connect properly
    function canConnect(pool1: Pool | null, pool2: Pool | null): boolean {
        if (!pool1 || !pool2) return true;
        
        // One of pool1's tokens must match one of pool2's tokens
        return pool1.token0 === pool2.token0 || 
               pool1.token0 === pool2.token1 || 
               pool1.token1 === pool2.token0 || 
               pool1.token1 === pool2.token1;
    }
    
    function getConnectionToken(pool1: Pool, pool2: Pool): string | null {
        if (pool1.token0 === pool2.token0 || pool1.token0 === pool2.token1) return pool1.token0;
        if (pool1.token1 === pool2.token0 || pool1.token1 === pool2.token1) return pool1.token1;
        return null;
    }
</script>

<div class="card p-3 variant-soft-surface">
    <h3 class="text-sm font-bold mb-3">Route Builder</h3>
    <div class="flex items-center gap-2 overflow-x-auto">
        {#each selectedPools as pool, index}
            {#if index < maxHops}
                <!-- Pool Selection Box -->
                <div class="min-w-[140px]">
                    <div class="min-h-[100px] p-2 rounded-lg border-2 border-dashed
                        {pool ? 'bg-primary-500/10 border-primary-500' : 'border-surface-500'}">
                        {#if pool}
                            <button 
                                class="w-full text-left"
                                on:click={() => clearPool(index)}
                            >
                                <div class="flex flex-col gap-1">
                                    <img src={DEX_ICONS[pool.dex]} alt={pool.dex} class="w-8 h-8" />
                                    <div class="flex gap-1">
                                        <img src={TOKEN_ICONS[pool.token0]} alt="" class="w-6 h-6" />
                                        <img src={TOKEN_ICONS[pool.token1]} alt="" class="w-6 h-6" />
                                    </div>
                                    <div class="text-xs text-gray-400">
                                        {getTokenSymbol(pool.token0)}/{getTokenSymbol(pool.token1)}
                                    </div>
                                    <div class="text-xs text-gray-500">
                                        {truncateAddress(pool.address)}
                                    </div>
                                </div>
                            </button>
                        {:else if index === 0 || selectedPools[index - 1]}
                            <div class="text-center text-gray-500 mt-8 text-xs">
                                Hop {index + 1}
                            </div>
                        {:else}
                            <div class="text-center text-gray-600 mt-8 text-xs">
                                -
                            </div>
                        {/if}
                    </div>
                </div>
                
                <!-- Arrow -->
                {#if index < maxHops - 1}
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-primary-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                {/if}
            {/if}
        {/each}
    </div>
    
    <!-- Show connection warnings -->
    {#if selectedPools[0] && selectedPools[1] && !canConnect(selectedPools[0], selectedPools[1])}
        <div class="text-xs text-error-400 mt-2">
            ⚠️ Pools don't share a common token
        </div>
    {/if}
</div>