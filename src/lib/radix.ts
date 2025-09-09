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
        networkId: RadixNetwork.Stokenet,
        applicationName: 'Lifted Labs',  // CHANGED FROM LIQUIFY
        applicationVersion: '1.0.0',
        featureFlags: ['ExperimentalMobileSupport']  // KEEP THIS
    });

    // Configure wallet data request
    rdt.walletApi.setRequestData(DataRequestBuilder.accounts().atLeast(1));
    
    // Set theme and mode - CHANGE THESE TO WHATEVER YOU WANT
    rdt.buttonApi.setTheme('black');  // options: 'radix-blue', 'black', 'white-with-outline', 'white'
    rdt.buttonApi.setMode('light');   // options: 'light', 'dark'

    // Initialize Gateway API Client
    gatewayApi = GatewayApiClient.initialize(rdt.gatewayApi.clientConfig);
    
    // Initialize Gateway EZ Mode
    ezGateway = new GatewayEzMode(gatewayApi);
}

export { rdt, gatewayApi, ezGateway };