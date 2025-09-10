<!-- src/routes/arbitrage/+page.svelte -->
<script lang="ts">
    import { accountAddress } from '$lib/stores/wallet';
    import { explorePoolComponent, getPoolResources } from '../../services/poolService';
    
    let poolAddress = '';
    let amount = 0;
    let explorationResult: any = null;
    let poolResources: any[] = [];
    let isExploring = false;
    
    $: selectedAccount = $accountAddress;
    
    async function explorePool() {
        if (!poolAddress) return;
        
        isExploring = true;
        explorationResult = await explorePoolComponent(poolAddress);
        poolResources = await getPoolResources(poolAddress);
        isExploring = false;
    }
</script>

<div class="max-w-6xl mx-auto p-4">
    <h1 class="text-2xl font-bold mb-6">Arbitrage Tool</h1>
    
    {#if !selectedAccount}
        <div class="text-center py-8">
            <p class="text-gray-400">Connect your wallet to use the arbitrage tool</p>
        </div>
    {:else}
        <!-- Pool Explorer Section -->
        <div class="card p-4 mb-6">
            <h2 class="text-xl font-semibold mb-4">Pool Explorer</h2>
            <div class="flex gap-2">
                <input 
                    type="text" 
                    placeholder="Enter pool component address"
                    bind:value={poolAddress}
                    class="input flex-1"
                />
                <button 
                    class="btn variant-filled-primary"
                    on:click={explorePool}
                    disabled={isExploring}
                >
                    {isExploring ? 'Exploring...' : 'Explore'}
                </button>
            </div>
            
            {#if poolResources.length > 0}
                <div class="mt-4">
                    <h3 class="text-lg font-semibold mb-2">Pool Resources:</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {#each poolResources as resource}
                            <div class="p-3 bg-surface-700 rounded">
                                <div class="flex items-center gap-2">
                                    {#if resource.iconUrl}
                                        <img src={resource.iconUrl} alt={resource.symbol} class="w-8 h-8 rounded-full" />
                                    {/if}
                                    <div>
                                        <div class="font-semibold">{resource.symbol || 'Unknown'}</div>
                                        <div class="text-sm text-gray-400">{resource.amount}</div>
                                    </div>
                                </div>
                                <div class="text-xs text-gray-500 mt-1 font-mono">
                                    {resource.address}
                                </div>
                            </div>
                        {/each}
                    </div>
                </div>
            {/if}
            
            {#if explorationResult}
                <details class="mt-4">
                    <summary class="cursor-pointer text-sm text-gray-400">View Raw Data</summary>
                    <div class="mt-2 p-4 bg-surface-700 rounded">
                        <pre class="text-xs overflow-auto">{JSON.stringify(explorationResult, null, 2)}</pre>
                    </div>
                </details>
            {/if}
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Left side - Buy from cheap pool -->
            <div class="card p-4">
                <h2 class="text-xl font-semibold mb-4">Buy From (Cheap Pool)</h2>
                <!-- We'll add pool list here once we understand structure -->
            </div>
            
            <!-- Right side - Sell to expensive pool -->
            <div class="card p-4">
                <h2 class="text-xl font-semibold mb-4">Sell To (Expensive Pool)</h2>
                <!-- We'll add pool list here once we understand structure -->
            </div>
        </div>
        
        <!-- Amount and preview section -->
        <div class="card p-4 mt-6">
            <label class="label">
                <span>Amount</span>
                <input type="number" bind:value={amount} class="input" />
            </label>
        </div>
    {/if}
</div>