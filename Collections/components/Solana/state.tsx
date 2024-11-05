import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import {
    FixableBeetStruct,
    BeetStruct,
    u8,
    u32,
    u64,
    bignum,
    utf8String,
    array,
    coption,
    COption,

} from "@metaplex-foundation/beet";
import { publicKey } from "@metaplex-foundation/beet-solana";

import { DEBUG, Config, PROGRAM, LaunchKeys, Socials, Extensions } from "./constants";
import { Box } from "@chakra-ui/react";

import { WalletDisconnectButton } from "@solana/wallet-adapter-react-ui";
import {Mint } from "@solana/spl-token";
import BN from "bn.js";


export function bignum_to_num(bn: bignum): number {
    let value = new BN(bn).toNumber();

    return value;
}

export async function get_JWT_token(): Promise<any | null> {
    const token_url = `/.netlify/functions/jwt`;

    var token_result;
    try {
        token_result = await fetch(token_url).then((res) => res.json());
    } catch (error) {
        console.log(error);
        return null;
    }

    if (DEBUG) console.log(token_result);

    return token_result;
}

export function WalletConnected() {
    return (
        <Box>
            <WalletDisconnectButton className="wallet-disconnect-button" />
        </Box>
    );
}

// Example POST method implementation:
export async function postData(url = "", bearer = "", data = {}) {
    //console.log("in post data", data)
    // Default options are marked with *
    const response = await fetch(url, {
        method: "POST", // *GET, POST, PUT, DELETE, etc.
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data), // body data type must match "Content-Type" header
    });
    return response.json(); // parses JSON response into native JavaScript objects
}

export function uInt8ToLEBytes(num: number): Buffer {
    const bytes = Buffer.alloc(1);
    bytes.writeUInt8(num);

    return bytes;
}

export function uInt16ToLEBytes(num: number): Buffer {
    const bytes = Buffer.alloc(2);
    bytes.writeUInt16LE(num);

    return bytes;
}

export function uInt32ToLEBytes(num: number): Buffer {
    const bytes = Buffer.alloc(4);
    bytes.writeUInt32LE(num);

    return bytes;
}

interface BasicReply {
    id: number;
    jsonrpc: string;
    result: string;
    error: string;
}

export function check_json(json_response: BasicReply): boolean {
    if (json_response.result === undefined) {
        if (json_response.error !== undefined) {
            console.log(json_response.error);
        }
        return false;
    }

    if (json_response.result === null) return false;

    return true;
}

////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////// Transactions ///////////////////////// /////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////

interface BlockHash {
    blockhash: string;
    lastValidBlockHeight: number;
}

export async function get_current_blockhash(bearer: string): Promise<BlockHash> {
    var body = { id: 1, jsonrpc: "2.0", method: "getLatestBlockhash" };
    const blockhash_data_result = await postData(Config.RPC_NODE, bearer, body);

    console.log(Config.RPC_NODE);
    let blockhash = blockhash_data_result["result"]["value"]["blockhash"];
    let last_valid = blockhash_data_result["result"]["value"]["lastValidBlockHeight"];

    let hash_data: BlockHash = { blockhash: blockhash, lastValidBlockHeight: last_valid };

    return hash_data;
}

interface TransactionResponseData {
    id: number;
    jsonrpc: string;
    result: string;
}

export async function send_transaction(bearer: string, encoded_transaction: string): Promise<TransactionResponseData> {
    var body = { id: 1, jsonrpc: "2.0", method: "sendTransaction", params: [encoded_transaction, { skipPreflight: true }] };

    var response_json = await postData(Config.RPC_NODE, bearer, body);
    let transaction_response: TransactionResponseData = response_json;

    let valid_json = check_json(response_json);

    if (valid_json) return transaction_response;

    transaction_response.result = "INVALID";
    return transaction_response;
}

interface SignatureResponseData {
    id: number;
    jsonrpc: string;
    result: {
        context: {
            apiVersion: string;
            slot: number;
        };
        value: [
            {
                confirmationStatus: string;
                confirmations: number;
                err: string | null;
                slot: number;
            },
        ];
    } | null;
}

export async function getRecentPrioritizationFees(PROD: boolean): Promise<number> {
    let feeMicroLamports = 100000;

    if (Config.NETWORK === "eclipse") {
        return 10000;
    }

    if (PROD) {
        try {
            const response = await fetch(Config.RPC_NODE, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    jsonrpc: "2.0",
                    id: 1,
                    method: "getPriorityFeeEstimate",
                    params: [
                        {
                            accountKeys: ["JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4"],
                            options: {
                                //"recommended": true,
                                includeAllPriorityFeeLevels: true,
                            },
                        },
                    ],
                }),
            });
            const data = await response.json();
            console.log("Fee: ", data);
        } catch (error) {
            console.log("Error: ", error);
        }
    }

    return feeMicroLamports;
}

export async function check_signature(bearer: string, signature: string): Promise<SignatureResponseData | null> {
    var body = { id: 1, jsonrpc: "2.0", method: "getSignatureStatuses", params: [[signature], { searchTransactionHistory: true }] };

    var response_json = await postData(Config.RPC_NODE, bearer, body);
    let transaction_response: SignatureResponseData = response_json;

    let valid_json = check_json(response_json);

    if (valid_json) return transaction_response;

    return null;
}

export interface MintData {
    mint: Mint;
    uri: string;
    name: string;
    symbol: string;
    icon: string;
    extensions: number;
    token_program: PublicKey;
}

export interface MetaData {
    key: PublicKey;
    signer: boolean;
    writable: boolean;
}

interface AccountData {
    id: number;
    jsonrpc: string;
    result: {
        context: {
            apiVersion: string;
            slot: number;
        };
        value: {
            data: [string, string];
            executable: boolean;
            lamports: number;
            owner: string;
        };
    };
    error: string;
}

export class Token22MintAccount {
    constructor(
        readonly mintOption: number,
        readonly mintAuthority: PublicKey,
        readonly supply: bignum,
        readonly decimals: number,
        readonly isInitialized: number,
        readonly freezeOption: number,
        readonly freezeAuthority: PublicKey,
    ) {}

    static readonly struct = new FixableBeetStruct<Token22MintAccount>(
        [
            ["mintOption", u32],
            ["mintAuthority", publicKey],
            ["supply", u64],
            ["decimals", u8],
            ["isInitialized", u8],
            ["freezeOption", u32],
            ["freezeAuthority", publicKey],
        ],
        (args) =>
            new Token22MintAccount(
                args.mintOption!,
                args.mintAuthority!,
                args.supply!,
                args.decimals!,
                args.isInitialized!,
                args.freezeOption!,
                args.freezeAuthority!,
            ),
        "Token22MintAccount",
    );
}

export class TokenAccount {
    constructor(
        readonly mint: PublicKey,
        readonly owner: PublicKey,
        readonly amount: bignum,
        readonly delegate: COption<PublicKey>,
        readonly state: number,
        readonly is_native: COption<bignum>,
        readonly delegated_amount: bignum,
        readonly close_authority: COption<PublicKey>,
    ) {}

    static readonly struct = new FixableBeetStruct<TokenAccount>(
        [
            ["mint", publicKey],
            ["owner", publicKey],
            ["amount", u64],
            ["delegate", coption(publicKey)],
            ["state", u8],
            ["is_native", coption(u64)],
            ["delegated_amount", u64],
            ["close_authority", coption(publicKey)],
        ],
        (args) =>
            new TokenAccount(
                args.mint!,
                args.owner!,
                args.amount!,
                args.delegate!,
                args.state!,
                args.is_native!,
                args.delegated_amount!,
                args.close_authority!,
            ),
        "TokenAccount",
    );
}

interface TokenBalanceData {
    id: number;
    jsonrpc: string;
    result: {
        context: {
            apiVersion: string;
            slot: number;
        };
        value: {
            amount: string;
            decimals: number;
            uiAmount: number;
            uiAmountString: string;
        };
    };
    error: string;
}

class InstructionNoArgs {
    constructor(readonly instruction: number) {}

    static readonly struct = new BeetStruct<InstructionNoArgs>(
        [["instruction", u8]],
        (args) => new InstructionNoArgs(args.instruction!),
        "InstructionNoArgs",
    );
}

export async function request_current_balance(bearer: string, pubkey: PublicKey): Promise<number> {
    var body = {
        id: 1,
        jsonrpc: "2.0",
        method: "getAccountInfo",
        params: [pubkey.toString(), { encoding: "base64", commitment: "confirmed" }],
    };

    var account_info_result;
    try {
        account_info_result = await postData(Config.RPC_NODE, bearer, body);
    } catch (error) {
        console.log(error);
        return 0;
    }
    let valid_response = check_json(account_info_result);
    if (!valid_response) {
        console.log(account_info_result);
        return 0;
    }

    if (account_info_result["result"]["value"] == null || account_info_result["result"]["value"]["lamports"] == null) {
        console.log("Error getting lamports for ", pubkey.toString());
        return 0;
    }

    let current_balance: number = account_info_result["result"]["value"]["lamports"] / LAMPORTS_PER_SOL;

    return current_balance;
}

export async function requestMultipleAccounts(bearer: string, pubkeys: PublicKey[]): Promise<Buffer[]> {
    let key_strings = [];
    for (let i = 0; i < pubkeys.length; i++) {
        key_strings.push(pubkeys[i].toString());
    }

    var body = {
        id: 1,
        jsonrpc: "2.0",
        method: "getMultipleAccounts",
        params: [key_strings, { encoding: "base64", commitment: "confirmed" }],
    };

    var result;
    try {
        result = await postData(Config.RPC_NODE, bearer, body);
    } catch (error) {
        console.log(error);
        return [];
    }
    let valid_response = check_json(result);
    if (!valid_response) {
        console.log(result);
        return [];
    }

    var data: Buffer[] = [];
    for (let i = 0; i < result["result"]["value"].length; i++) {
        data.push(Buffer.from(result["result"]["value"][i]["data"][0], "base64"));
    }

    return data;
}

export async function request_token_amount(bearer: string, pubkey: PublicKey): Promise<number> {
    var body = {
        id: 1,
        jsonrpc: "2.0",
        method: "getTokenAccountBalance",
        params: [pubkey.toString(), { encoding: "base64", commitment: "confirmed" }],
    };

    var response;
    try {
        response = await postData(Config.RPC_NODE, bearer, body);
    } catch (error) {
        console.log(error);
        return 0;
    }
    //console.log("TS result: ", response)

    let valid_response = check_json(response);

    //console.log("valid ", valid_response);
    if (!valid_response) {
        return 0;
    }

    let token_amount;
    try {
        let parsed_response: TokenBalanceData = response;

        //console.log("parsed", parsed_account_data);

        token_amount = parseInt(parsed_response.result.value.amount);
    } catch (error) {
        console.log(error);
        return 0;
    }

    return token_amount;
}

export async function request_raw_account_data(bearer: string, pubkey: PublicKey): Promise<Buffer | null> {
    var body = {
        id: 1,
        jsonrpc: "2.0",
        method: "getAccountInfo",
        params: [pubkey.toString(), { encoding: "base64", commitment: "confirmed" }],
    };

    var response;
    try {
        response = await postData(Config.RPC_NODE, bearer, body);
    } catch (error) {
        console.log(error);
        return null;
    }
    //console.log("TS result: ", response)

    let valid_response = check_json(response);

    //console.log("valid ", valid_response);
    if (!valid_response) {
        return null;
    }

    let account_data;
    try {
        let parsed_account_data: AccountData = response;

        if (parsed_account_data.result.value === null) {
            return null;
        }

        let account_encoded_data = parsed_account_data.result.value.data;
        account_data = Buffer.from(account_encoded_data[0], "base64");
    } catch (error) {
        console.log(error);
        return null;
    }

    return account_data;
}

export function serialise_basic_instruction(instruction: number): Buffer {
    const data = new InstructionNoArgs(instruction);
    const [buf] = InstructionNoArgs.struct.serialize(data);

    return buf;
}

////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////// LetsCook Instructions and MetaData /////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////


export const enum LaunchInstruction {
    init = 0,
    create_game = 1,
    buy_tickets = 2,
    chcek_tickets = 3,
    init_market = 4,
    hype_vote = 5,
    claim_refund = 6,
    edit_launch = 7,
    claim_tokens = 8,
    edit_user = 9,
    place_market_order = 10,
    get_mm_rewards = 11,
    close_account = 12,
    launch_collection = 13,
    claim_nft = 14,
    mint_nft = 15,
    wrap_nft = 16,
    edit_collection = 17,
    mint_random = 18,
    create_openbook = 19,
    create_raydium = 20,
    raydium_swap = 21,
    update_cook_liquidity = 22,
    remove_cook_liquidity = 23,
    create_unverified_listing = 24,
    create_listing = 25,
    swap_raydium_classic = 26,
    init_cook_external = 27,
    create_instant_launch = 28,
    add_trade_rewards = 29,
}

export class myU64 {
    constructor(readonly value: bignum) {}

    static readonly struct = new BeetStruct<myU64>([["value", u64]], (args) => new myU64(args.value!), "myU64");
}

export class ListingData {
    constructor(
        readonly account_type: number,
        readonly id: bignum,
        readonly mint: PublicKey,
        readonly name: string,
        readonly symbol: string,
        readonly decimals: number,
        readonly icon: string,
        readonly meta_url: string,
        readonly banner: string,
        readonly description: string,
        readonly positive_votes: number,
        readonly negative_votes: number,
        readonly socials: string[],
    ) {}

    static readonly struct = new FixableBeetStruct<ListingData>(
        [
            ["account_type", u8],
            ["id", u64],
            ["mint", publicKey],
            ["name", utf8String],
            ["symbol", utf8String],
            ["decimals", u8],
            ["icon", utf8String],
            ["meta_url", utf8String],
            ["banner", utf8String],
            ["description", utf8String],
            ["positive_votes", u32],
            ["negative_votes", u32],
            ["socials", array(utf8String)],
        ],
        (args) =>
            new ListingData(
                args.account_type!,
                args.id!,
                args.mint!,
                args.name!,
                args.symbol!,
                args.decimals!,
                args.icon!,
                args.meta_url!,
                args.banner!,
                args.description!,
                args.positive_votes!,
                args.negative_votes!,
                args.socials!,
            ),
        "ListingData",
    );
}


export class UserStats {
    constructor(
        readonly flags: number[],
        readonly values: number[],
        readonly amounts: bignum[],
        readonly achievements: number[],
    ) {}

    static readonly struct = new FixableBeetStruct<UserStats>(
        [
            ["flags", array(u8)],
            ["values", array(u32)],
            ["amounts", array(u64)],
            ["achievements", array(u8)],
        ],
        (args) => new UserStats(args.flags!, args.values!, args.amounts!, args.achievements!),
        "UserStats",
    );
}

export class UserData {
    constructor(
        readonly account_type: number,
        readonly user_key: PublicKey,
        readonly user_name: string,
        readonly total_points: number,
        readonly votes: number[],
        readonly stats: UserStats,
    ) {}

    static readonly struct = new FixableBeetStruct<UserData>(
        [
            ["account_type", u8],
            ["user_key", publicKey],
            ["user_name", utf8String],
            ["total_points", u32],
            ["votes", array(u64)],
            ["stats", UserStats.struct],
        ],
        (args) => new UserData(args.account_type!, args.user_key!, args.user_name!, args.total_points!, args.votes!, args.stats!),
        "UserData",
    );
}
export interface GPAccount {
    pubkey: PublicKey;
    data: Buffer;
}

export async function RunGPA(): Promise<GPAccount[]> {
    var body = {
        id: 1,
        jsonrpc: "2.0",
        method: "getProgramAccounts",
        params: [PROGRAM.toString(), { encoding: "base64", commitment: "confirmed" }],
    };

    var program_accounts_result;
    try {
        program_accounts_result = await postData(Config.RPC_NODE, "", body);
    } catch (error) {
        console.log(error);
        return [];
    }

    //console.log(program_accounts_result["result"]);

    let result = [];
    for (let i = 0; i < program_accounts_result["result"]?.length; i++) {
        //console.log(i, program_accounts_result["result"][i]);
        let encoded_data = program_accounts_result["result"][i]["account"]["data"][0];
        let decoded_data = Buffer.from(encoded_data, "base64");

        // we dont want the program account
        if (decoded_data[0] === 1) continue;

        result.push({ pubkey: new PublicKey(program_accounts_result["result"][i]["pubkey"]), data: decoded_data });
    }

    return result;
}


class HypeVote_Instruction {
    constructor(
        readonly instruction: number,
        readonly launch_type: number,
        readonly vote: number,
    ) {}

    static readonly struct = new BeetStruct<HypeVote_Instruction>(
        [
            ["instruction", u8],
            ["launch_type", u8],
            ["vote", u8],
        ],
        (args) => new HypeVote_Instruction(args.instruction!, args.launch_type!, args.vote!),
        "HypeVote_Instruction",
    );
}

export function serialise_HypeVote_instruction(launch_type: number, vote: number): Buffer {
    const data = new HypeVote_Instruction(LaunchInstruction.hype_vote, launch_type, vote);
    const [buf] = HypeVote_Instruction.struct.serialize(data);

    return buf;
}