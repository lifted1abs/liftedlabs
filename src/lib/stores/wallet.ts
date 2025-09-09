// src/lib/stores/wallet.ts
import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';

// Store only dynamic wallet data
export const walletData = writable<any>(null);

// Add this new writable store for selected account
export const selectedAccountIndex = writable(0);

// Update accountAddress to use the selected index
export const accountAddress = derived(
    [walletData, selectedAccountIndex],
    ([$walletData, $selectedAccountIndex]) => {
        if (!$walletData?.accounts?.length) return '';
        return $walletData.accounts[$selectedAccountIndex]?.address || '';
    }
);

export const allAccounts = derived(
    walletData,
    $walletData => $walletData?.accounts || []
);

// Keep these utility stores
export const refreshComponent = writable(0);
export const allLiquidityReceiptIds = writable<string[]>([]);
export const needsRefetch = writable(false);

// Initialize wallet subscription - wait for RDT
if (browser) {
    // Import dynamically to ensure it's loaded
    import('$lib/radix').then(({ rdt }) => {
        if (rdt) {
            rdt.walletApi.walletData$.subscribe((data) => {
                walletData.set(data);
            });
        }
    });
}