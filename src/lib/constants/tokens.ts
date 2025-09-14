// Token addresses
export const XRD = 'resource_rdx1tknxxxxxxxxxradxrdxxxxxxxxx009923554798xxxxxxxxxradxrd';
export const HUSDC = 'resource_rdx1thxj9m87sn5cc9ehgp9qxp6vzeqxtce90xm5cp33373tclyp4et4gv';
export const HUSDT = 'resource_rdx1th4v03gezwgzkuma6p38lnum8ww8t4ds9nvcrkr2p9ft6kxx3kxvhe';
export const HETH = 'resource_rdx1th09yvv7tgsrv708ffsgqjjf2mhy84mscmj5jwu4g670fh3e5zgef0';
export const HWBTC = 'resource_rdx1t58kkcqdz0mavfz98m98qh9m4jexyl9tacsvlhns6yxs4r6hrm5re5';

// Token icons
export const TOKEN_ICONS: Record<string, string> = {
    [XRD]: 'https://assets.radixdlt.com/icons/icon-xrd.png',
    [HUSDC]: 'https://assets.radixdlt.com/icons/hyperlane/hUSDC.svg',
    [HUSDT]: 'https://assets.radixdlt.com/icons/hyperlane/hUSDT.svg',
    [HETH]: 'https://assets.radixdlt.com/icons/hyperlane/hETH.svg',
    [HWBTC]: 'https://assets.radixdlt.com/icons/hyperlane/hBTC.svg'
};

// DEX icons
export const DEX_ICONS: Record<string, string> = {
    'ociswap': 'https://ociswap.com/icons/oci.png',
    'defiplaza': 'https://radix.defiplaza.net/assets/img/babylon/defiplaza-icon.png',
    'caviar': 'https://assets.caviarnine.com/tokens/caviar_babylon.png'
};

export function getTokenSymbol(address: string): string {
    switch(address) {
        case HUSDC: return 'hUSDC';
        case HUSDT: return 'hUSDT';
        case HETH: return 'hETH';
        case HWBTC: return 'hWBTC';
        case XRD: return 'XRD';
        default: return '';
    }
}