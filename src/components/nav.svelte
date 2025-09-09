<!-- src/components/nav.svelte -->
<script lang="ts">
    import { onMount } from 'svelte';
    import { accountAddress, allAccounts, selectedAccountIndex } from '$lib/stores/wallet';
    import { rdt } from '$lib/radix';

    let isRdtReady = false;
    let buttonKey = 0;

    $: selectedAccount = $accountAddress;
    
    // Truncate address for display
    function truncateAddress(address: string) {
        return `${address.slice(0, 7)}...${address.slice(-6)}`;
    }

    onMount(() => {
        if (rdt) {
            rdt.buttonApi.setTheme('black');
            rdt.buttonApi.setMode('light');
            buttonKey = 1;
            isRdtReady = true;
        }
    });
</script>

<nav class="sticky top-0 z-50 bg-surface-900/95 border-b border-surface-700">
    <div class="container max-w-7xl mx-auto px-4">
        <div class="flex justify-between items-center py-3">
            <!-- Logo/Title -->
            <div class="text-xl font-bold">
                Lifted Labs
            </div>
            
            <!-- Right side - Account info and Connect Button -->
            <div class="flex items-center gap-4">
                {#if selectedAccount}
                    <span class="text-sm text-gray-400">
                        {truncateAddress(selectedAccount)}
                    </span>
                {/if}
                
                <!-- Connect Button -->
                {#if isRdtReady}
                    {#key buttonKey}
                        <radix-connect-button />
                    {/key}
                {/if}
            </div>
        </div>
    </div>
</nav>