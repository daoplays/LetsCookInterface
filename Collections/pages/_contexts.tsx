"use client";

import { useWallet, WalletContextState } from "@solana/wallet-adapter-react";
import { LimitOrderProvider, OrderHistoryItem, TradeHistoryItem, ownerFilter } from "@jup-ag/limit-order-sdk";
import {
    UserData,
    bignum_to_num,
    RunGPA,
    serialise_basic_instruction,
    LaunchInstruction,
    get_current_blockhash,
    send_transaction,
    GPAccount,
    request_current_balance,
    requestMultipleAccounts,
    Token22MintAccount,
    uInt32ToLEBytes,
    MintData,
    ListingData,
} from "../components/Solana/state";
import { Config, PROGRAM,  CollectionKeys } from "../components/Solana/constants";
import { CollectionDataUserInput, defaultCollectionInput, CollectionData } from "../components/collection/collectionState";
import { PublicKey, Connection } from "@solana/web3.js";
import { useCallback, useEffect, useState, useRef, PropsWithChildren } from "react";
import { AppRootContextProvider } from "../context/useAppRoot";
import "bootstrap/dist/css/bootstrap.css";
import { useSOLPrice } from "../hooks/data/useSOLPrice";
import { getDatabase, ref, get, Database } from "firebase/database";
import { firebaseConfig } from "../components/Solana/constants";
import { initializeApp } from "firebase/app";
import { deserializeMintData, getTradeMintData } from "../utils/getTokenMintData";


const GetTradeMintData = async (trade_keys: String[], setMintMap) => {
    let mint_map = await getTradeMintData(trade_keys);
    setMintMap(mint_map);
};

const GetProgramData = async (check_program_data, setProgramData, setIsLaunchDataLoading, setIsHomePageDataLoading) => {
    if (!check_program_data.current) return;

    setIsLaunchDataLoading(true);
    setIsHomePageDataLoading(true);

    let list = await RunGPA();

    //console.log("check program data");
    //console.trace()
    setProgramData(list);

    //console.log(list);

    setIsLaunchDataLoading(false);
    setIsHomePageDataLoading(false);

    check_program_data.current = false;
};

const ContextProviders = ({ children }: PropsWithChildren) => {
    const wallet = useWallet();

    const [selectedNetwork, setSelectedNetwork] = useState(Config.NETWORK);
    const [sidePanelCollapsed, setSidePanelCollapsed] = useState(false);

    const [isLaunchDataLoading, setIsLaunchDataLoading] = useState(false);
    const [isHomePageDataLoading, setIsHomePageDataLoading] = useState(false);

    const [program_data, setProgramData] = useState<GPAccount[] | null>(null);

    const [collection_data, setCollectionData] = useState<Map<string, CollectionData> | null>(null);
    const [listing_data, setListingData] = useState<Map<string, ListingData> | null>(null);

    const [mintData, setMintData] = useState<Map<String, MintData> | null>(null);

    const [user_data, setUserData] = useState<Map<string, UserData> | null>(new Map());

    const [current_user_data, setCurrentUserData] = useState<UserData | null>(null);

    const [userSOLBalance, setUserSOLBalance] = useState<number>(0);

    const check_program_data = useRef<boolean>(true);
    const last_program_data_update = useRef<number>(0);
    const [databaseLoaded, setDatabaseLoaded] = useState<boolean>(false);

    const user_balance_ws_id = useRef<number | null>(null);
    const program_ws_id = useRef<number | null>(null);

    const newCollectionData = useRef<CollectionDataUserInput>({ ...defaultCollectionInput });
    const lastDBUpdate = useRef<number>(0);


    const check_program_update = useCallback(
        async (new_program_data: any) => {
            console.log("in program update", new_program_data);
            if (!new_program_data) return;

            let wallet_bytes = PublicKey.default.toBytes();
            let have_wallet = false;
            // console.log("wallet", wallet !== null ? wallet.toString() : "null");
            if (wallet !== null && wallet.publicKey !== null) {
                wallet_bytes = wallet.publicKey.toBytes();
                have_wallet = true;
            }

            let event_data = Buffer.from(new_program_data.accountInfo.data);
            let account_key = new_program_data.accountId;


            if (event_data[0] === 2) {
                const [user] = UserData.struct.deserialize(event_data);
                setUserData((currentData) => {
                    const newData = new Map(currentData);
                    newData.set(user.user_key.toString(), user);
                    return newData;
                });

                if (wallet.publicKey !== null && user.user_key.equals(wallet.publicKey)) {
                    setCurrentUserData(user);
                }

                return;
            }

            if (event_data[0] === 8) {
                setCollectionData((currentData) => {
                    const [collection] = CollectionData.struct.deserialize(event_data);
                    console.log("collection update", collection);
                    const newData = new Map(currentData);
                    newData.set(collection.page_name, collection);
                    return newData;
                });

                return;
            }

            if (event_data[0] === 11) {
                setListingData((currentData) => {
                    const [listing] = ListingData.struct.deserialize(event_data);
                    const newData = new Map(currentData);
                    newData.set(account_key.toString(), listing);
                    return newData;
                });

                return;
            }
        },
        [wallet],
    );

    const checkUserBalance = useCallback(async () => {
        if (wallet === null || wallet.publicKey === null) {
            return;
        }

        let balance = await request_current_balance("", wallet.publicKey);
        setUserSOLBalance(balance);
    }, [wallet]);

    const check_user_balance = useCallback(async (result: any) => {
        //console.log(result);
        // if we have a subscription field check against ws_id

        try {
            let balance = result["lamports"] / 1e9;
            //console.log("have user balance event data", balance);
            setUserSOLBalance(balance);
        } catch (error) {}
    }, []);

    // launch account subscription handler
    useEffect(() => {
        const connection = new Connection(Config.RPC_NODE, { wsEndpoint: Config.WSS_NODE });

        if (user_balance_ws_id.current === null && wallet !== null && wallet.publicKey !== null) {
            checkUserBalance();
            user_balance_ws_id.current = connection.onAccountChange(wallet.publicKey, check_user_balance, "confirmed");
        }

        if (program_ws_id.current === null) {
            program_ws_id.current = connection.onProgramAccountChange(PROGRAM, check_program_update, "confirmed");
        }
    }, [wallet, check_user_balance, checkUserBalance, check_program_update]);

   
    // Helper function to deserialize account data
    function deserializeGPAccount(serializedAccount: any): GPAccount {
        return {
            pubkey: new PublicKey(serializedAccount.pubkey),
            data: Buffer.from(serializedAccount.data, "base64"),
        };
    }

    const fetchInitialData = useCallback(async () => {
        if (lastDBUpdate.current > 0) return;

        const app = initializeApp(firebaseConfig);

        // Initialize Realtime Database and get a reference to the service
        const database = getDatabase(app);

        const accountsDB = await get(ref(database, Config.NETWORK + "/accounts/"));
        let accounts = accountsDB.val();
        if (!accounts) {
            return;
        }

        const tokensDB = await get(ref(database, Config.NETWORK + "/tokens/"));
        let tokens = tokensDB.val();
        if (!tokens) {
            return;
        }

        lastDBUpdate.current = accounts.timestamp;

        // Deserialize each account in the accounts array
        const listingAccounts: GPAccount[] = accounts.listingData.map((account: any) => deserializeGPAccount(account));
        const tokenAccounts: MintData[] = tokens.mintData.map((mint: any) => deserializeMintData(mint));

        let listingData: Map<string, ListingData> = new Map<string, ListingData>();
        let tokenData: Map<string, MintData> = new Map<string, MintData>();

        for (let i = 0; i < listingAccounts.length; i++) {
            let data = listingAccounts[i].data;
            try {
                const [listing] = ListingData.struct.deserialize(data);
                listingData.set(listingAccounts[i].pubkey.toString(), listing);
            } catch (error) {
                console.log(error);
            }
        }

        for (let i = 0; i < tokenAccounts.length; i++) {
            let token = tokenAccounts[i];
            tokenData.set(token.mint.address.toString(), token);
        }

        console.log("Setting initial data from DB");
        setListingData(listingData);
        setMintData(tokenData);
        setDatabaseLoaded(true);
    }, []);

    const UpdateDatabase = useCallback(async () => {
        await fetch("/.netlify/functions/updateProgramData", {
            method: "POST",
            body: JSON.stringify({}),
            headers: {
                "Content-Type": "application/json",
            },
        });
    }, []);

    useEffect(() => {
        if (program_data === null) return;

        //console.log("update data");
        let wallet_bytes = PublicKey.default.toBytes();
        let have_wallet = false;
        // console.log("wallet", wallet !== null ? wallet.toString() : "null");
        if (wallet !== null && wallet.publicKey !== null) {
            wallet_bytes = wallet.publicKey.toBytes();
            have_wallet = true;
        }

        let user_data: Map<string, UserData> = new Map<string, UserData>();
        let collections: Map<string, CollectionData> = new Map<string, CollectionData>();
        let listings: Map<string, ListingData> = new Map<string, ListingData>();

        //console.log("program_data", program_data.length);
        let closeAccounts = [];
        for (let i = 0; i < program_data.length; i++) {
            let data = program_data[i].data;

            if (data[0] === 2) {
                const [user] = UserData.struct.deserialize(data);
                //console.log("user", user);
                user_data.set(user.user_key.toString(), user);
                continue;
            }

            if (data[0] === 8) {
                const [collection] = CollectionData.struct.deserialize(data);
                collections.set(collection.page_name, collection);
                //console.log(collection);
                continue;
            }

            if (data[0] === 11) {
                const [listing] = ListingData.struct.deserialize(data);

                listings.set(program_data[i].pubkey.toString(), listing);
                continue;
            }

        }

        //console.log("set user data", user_data);
        setUserData(user_data);
        setCollectionData(collections);
        setListingData(listings);

        if (have_wallet) {
            if (user_data.has(wallet.publicKey.toString())) {
                setCurrentUserData(user_data.get(wallet.publicKey.toString()));
            }
        }

        // set up the map for the trade page
        let trade_mints: String[] = [];
        listings.forEach((listing, key) => {
            trade_mints.push(listing.mint.toString());
        });

        collections.forEach((collection, key) => {
            //console.log("add ", collections[i].keys[CollectionKeys.MintAddress].toString());

            if (!trade_mints.includes(collection.keys[CollectionKeys.MintAddress].toString()))
                trade_mints.push(collection.keys[CollectionKeys.MintAddress].toString());
            // check if we have a whitelist token
            for (let p = 0; p < collection.plugins.length; p++) {
                if (collection.plugins[p]["__kind"] === "Whitelist") {
                    trade_mints.push(collection.plugins[p]["key"]);
                }
            }
        });

        GetTradeMintData(trade_mints, setMintData);

    }, [program_data, wallet, UpdateDatabase]);

    const ReGetProgramData = useCallback(async () => {
        check_program_data.current = true;
        GetProgramData(check_program_data, setProgramData, setIsLaunchDataLoading, setIsHomePageDataLoading);
    }, []);

    useEffect(() => {
        fetchInitialData();
    }, [fetchInitialData]);

    useEffect(() => {
        if (!databaseLoaded) return;

        let current_time = new Date().getTime();
        if (current_time - last_program_data_update.current < 1000) return;

        last_program_data_update.current = current_time;

        GetProgramData(check_program_data, setProgramData, setIsLaunchDataLoading, setIsHomePageDataLoading);
    }, [databaseLoaded]);

    return (
        <AppRootContextProvider
            sidePanelCollapsed={sidePanelCollapsed}
            setSidePanelCollapsed={setSidePanelCollapsed}
            userList={user_data}
            currentUserData={current_user_data}
            isLaunchDataLoading={isLaunchDataLoading}
            isHomePageDataLoading={isHomePageDataLoading}
            checkProgramData={ReGetProgramData}
            userSOLBalance={userSOLBalance}
            mintData={mintData}
            newCollectionData={newCollectionData}
            collectionList={collection_data}
            setSelectedNetwork={setSelectedNetwork}
            selectedNetwork={selectedNetwork}
            listingData={listing_data}
            setListingData={setListingData}
            setMintData={setMintData}
        >
            {children}
        </AppRootContextProvider>
    );
};

export default ContextProviders;
