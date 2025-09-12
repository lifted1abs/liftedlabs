// src/lib/radix.ts
import { browser } from '$app/environment';
import { GatewayApiClient } from "@radixdlt/babylon-gateway-api-sdk";
import { RadixDappToolkit, RadixNetwork, DataRequestBuilder } from "@radixdlt/radix-dapp-toolkit";
import { GatewayEzMode } from "@rippy/gateway-ez-mode";

// Type declarations for exports
let rdt: RadixDappToolkit | null = null;
let gatewayApi: GatewayApiClient | null = null;
let ezGateway: GatewayEzMode | null = null;

// Only initialize in browser
if (browser) {
    // Using a placeholder dApp definition for now - you'll need to create one
    const DAPP_DEFINITION_ADDRESS = 'account_rdx129a9wuey40lducsf6yu232zmzk5kscpvnl6fv472r0ja39f3hced69';

    rdt = RadixDappToolkit({
        dAppDefinitionAddress: DAPP_DEFINITION_ADDRESS,
        networkId: RadixNetwork.Mainnet,
        applicationName: 'Lifted Labs Arbitrage',
        applicationVersion: '1.0.0',
        featureFlags: ['ExperimentalMobileSupport']
    });

    // Configure wallet data request
    rdt.walletApi.setRequestData(DataRequestBuilder.accounts().atLeast(1));
    
    // Set theme and mode
    rdt.buttonApi.setTheme('black');
    rdt.buttonApi.setMode('light');

    // Initialize Gateway API Client
    gatewayApi = GatewayApiClient.initialize(rdt.gatewayApi.clientConfig);
    
    // Initialize Gateway EZ Mode
    ezGateway = new GatewayEzMode(gatewayApi);
}

export { rdt, gatewayApi, ezGateway };