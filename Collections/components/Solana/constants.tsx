import { isMobile } from "react-device-detect";
import { PublicKey } from "@solana/web3.js";

export interface NetworkConfig {
    PROD: boolean;
    NETWORK: string;
    FEES_KEY: PublicKey;
    RAYDIUM_FEES: PublicKey;
    RPC_NODE: string;
    WSS_NODE: string;
    COOK_FEES: PublicKey;
    // its useful to define a few strings and images here given we have eth on eclipse and sol on solana
    token: string;
    token_image: string;
    platform_fee: string;
    skipPreflight: boolean;
}

const EclipseDevNetConfig: NetworkConfig = {
    PROD: false,
    NETWORK: "eclipse",
    FEES_KEY: new PublicKey("FxVpjJ5AGY6cfCwZQP5v8QBfS4J2NPa62HbGh1Fu2LpD"),
    RAYDIUM_FEES: new PublicKey("3XMrhbv989VxAMi3DErLV9eJht1pHppW5LbKxe9fkEFR"),
    RPC_NODE: "https://devnet.dev2.eclipsenetwork.xyz",
    WSS_NODE: "wss://devnet.dev2.eclipsenetwork.xyz",
    COOK_FEES: new PublicKey("FxVpjJ5AGY6cfCwZQP5v8QBfS4J2NPa62HbGh1Fu2LpD"),
    token: "ETH",
    token_image: "/images/eth.png",
    platform_fee: "0.0001",
    skipPreflight: true,
};

const EclipseMainNetConfig: NetworkConfig = {
    PROD: true,
    NETWORK: "eclipse",
    FEES_KEY: new PublicKey("FxVpjJ5AGY6cfCwZQP5v8QBfS4J2NPa62HbGh1Fu2LpD"),
    RAYDIUM_FEES: new PublicKey("3XMrhbv989VxAMi3DErLV9eJht1pHppW5LbKxe9fkEFR"),
    RPC_NODE: "https://mainnetbeta-rpc.eclipse.xyz",
    WSS_NODE: "wss://mainnetbeta-rpc.eclipse.xyz",
    COOK_FEES: new PublicKey("FxVpjJ5AGY6cfCwZQP5v8QBfS4J2NPa62HbGh1Fu2LpD"),
    token: "ETH",
    token_image: "/images/eth.png",
    platform_fee: "0.0001",
    skipPreflight: true,
};

const DevNetConfig: NetworkConfig = {
    PROD: false,
    NETWORK: "devnet",
    FEES_KEY: new PublicKey("FxVpjJ5AGY6cfCwZQP5v8QBfS4J2NPa62HbGh1Fu2LpD"),
    RAYDIUM_FEES: new PublicKey("3XMrhbv989VxAMi3DErLV9eJht1pHppW5LbKxe9fkEFR"),
    RPC_NODE: "https://api.devnet.solana.com",
    WSS_NODE: "wss://api.devnet.solana.com",
    COOK_FEES: new PublicKey("FxVpjJ5AGY6cfCwZQP5v8QBfS4J2NPa62HbGh1Fu2LpD"),
    token: "SOL",
    token_image: "/images/sol.png",
    platform_fee: "0.002",
    skipPreflight: true,
};

const MainNetConfig: NetworkConfig = {
    PROD: true,
    NETWORK: "mainnet",
    FEES_KEY: new PublicKey("HtszJ5ntXnwUFc2anMzp5RgaPxtvTFojL2qb5kcFEytA"),
    RAYDIUM_FEES: new PublicKey("7YttLkHDoNj9wyDur5pM1ejNaAvT9X4eqaYcHQqtj2G5"),
    RPC_NODE: "https://api.mainnet-beta.solana.com",
    WSS_NODE: "wss://api.mainnet-beta.solana.com",
    COOK_FEES: new PublicKey("HtszJ5ntXnwUFc2anMzp5RgaPxtvTFojL2qb5kcFEytA"),
    token: "SOL",
    token_image: "/images/sol.png",
    platform_fee: "0.002",
    skipPreflight: true,
};

export const METAPLEX_META = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");
export const PROGRAM = new PublicKey("Cook7kyoaKaiG57VBDUjE2KuPXrWdLEu7d3FdDgsijHU");
export const SYSTEM_KEY = new PublicKey("11111111111111111111111111111111");
export const CORE = new PublicKey("CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d");
export const WRAPPED_SOL = new PublicKey("So11111111111111111111111111111111111111112");

// account seeds
export const SOL_ACCOUNT_SEED = 59957379;
export const DATA_ACCOUNT_SEED = 7571427;

//timeout for transactions to be considered failed
export const TIMEOUT = 30000;

export let Config = DevNetConfig;

export enum Socials {
    Website = 0,
    Twitter = 1,
    Telegram = 2,
    Discord = 3,
}

export const enum CollectionKeys {
    Seller = 0,
    TeamWallet = 1,
    MintAddress = 2,
    CollectionMint = 3,
}

export const enum LaunchKeys {
    Seller = 0,
    TeamWallet = 1,
    WSOLAddress = 2,
}

export enum LaunchFlags {
    MintedToUser = 0,
    LaunchFailed = 1,
    LPState = 2,
    TokenProgramVersion = 3,
    BookProvider = 4,
    AMMProvider = 5,
    Extensions = 6,
}

export const Extensions = {
    None: 0,
    TransferFee: 1,
    PermanentDelegate: 2,
    TransferHook: 4,
};
