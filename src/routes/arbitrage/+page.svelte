<!-- src/routes/arbitrage/+page.svelte -->
<script lang="ts">
    import { accountAddress } from '$lib/stores/wallet';
    
    // For now, just set up the basic structure
    let token0Address = '';
    let token1Address = '';
    let poolAddress = '';
    let amount = 0;
    
    $: selectedAccount = $accountAddress;
</script>

<div class="max-w-6xl mx-auto p-4">
    <h1 class="text-2xl font-bold mb-6">Arbitrage Tool</h1>
    
    {#if !selectedAccount}
        <div class="text-center py-8">
            <p class="text-gray-400">Connect your wallet to use the arbitrage tool</p>
        </div>
    {:else}
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Left side - Buy from cheap pool -->
            <div class="card p-4">
                <h2 class="text-xl font-semibold mb-4">Buy From (Cheap Pool)</h2>
                <input 
                    type="text" 
                    placeholder="Pool address"
                    bind:value={poolAddress}
                    class="input mb-4"
                />
                <!-- We'll add pool list here -->
            </div>
            
            <!-- Right side - Sell to expensive pool -->
            <div class="card p-4">
                <h2 class="text-xl font-semibold mb-4">Sell To (Expensive Pool)</h2>
                <!-- We'll add pool list here -->
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