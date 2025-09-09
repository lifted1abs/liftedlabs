<!-- src/routes/+page.svelte -->
<script lang="ts">
    import { accountAddress } from '$lib/stores/wallet';
    
    $: selectedAccount = $accountAddress;
</script>

<div class="p-8">
    <h1 class="text-3xl font-bold mb-4">Welcome to Lifted Labs</h1>
    
    {#if selectedAccount}
        <p class="text-green-500">Connected: {selectedAccount}</p>
    {:else}
        <p class="text-gray-500">Connect your wallet to get started</p>
    {/if}
</div>