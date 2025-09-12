<script lang="ts">
    import { accountAddress } from '$lib/stores/wallet';
    import { fade } from 'svelte/transition';
    
    $: selectedAccount = $accountAddress;
</script>

<svelte:head>
    <title>Lifted Labs - Radix Arbitrage</title>
</svelte:head>

<div class="container max-w-4xl mx-auto p-8" in:fade>
    <div class="text-center space-y-6">
        <h1 class="text-5xl font-bold bg-gradient-to-r from-primary-500 to-tertiary-500 bg-clip-text text-transparent">
            Lifted Labs
        </h1>
        
        <p class="text-xl text-gray-400">
            Advanced arbitrage trading on Radix DLT
        </p>
        
        <div class="card p-8 variant-soft-surface">
            {#if selectedAccount}
                <p class="text-green-500 mb-6">Wallet Connected</p>
                <a href="/arbitrage" class="btn variant-filled-primary">
                    Start Arbitrage Trading
                </a>
            {:else}
                <p class="text-gray-400">Connect your wallet to get started</p>
            {/if}
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div class="card p-6 variant-soft">
                <h3 class="text-lg font-bold mb-2">Multi-DEX Support</h3>
                <p class="text-sm text-gray-400">
                    Find opportunities across OciSwap, DefiPlaza, and more
                </p>
            </div>
            
            <div class="card p-6 variant-soft">
                <h3 class="text-lg font-bold mb-2">Atomic Execution</h3>
                <p class="text-sm text-gray-400">
                    Execute buy and sell in a single transaction
                </p>
            </div>
            
            <div class="card p-6 variant-soft">
                <h3 class="text-lg font-bold mb-2">Live Pricing</h3>
                <p class="text-sm text-gray-400">
                    Real-time pool data and profit calculations
                </p>
            </div>
        </div>
    </div>
</div>