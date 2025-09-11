// src/lib/radix.ts
import { browser } from '$app/environment';
import { GatewayApiClient } from "@radixdlt/babylon-gateway-api-sdk";
import { RadixDappToolkit, RadixNetwork, DataRequestBuilder } from "@radixdlt/radix-dapp-toolkit";
import { GatewayEzMode } from "@rippy/gateway-ez-mode";
import { PUBLIC_DAPP_DEFINITION_ADDRESS } from '$env/static/public';

// Type declarations for exports
let rdt: RadixDappToolkit | null = null;
let gatewayApi: GatewayApiClient | null = null;
let ezGateway: GatewayEzMode | null = null;

// Only initialize in browser
if (browser) {

    rdt = RadixDappToolkit({
        dAppDefinitionAddress: PUBLIC_DAPP_DEFINITION_ADDRESS,
        networkId: RadixNetwork.Mainnet, // CHANGED TO MAINNET
        applicationName: 'Lifted Labs',
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