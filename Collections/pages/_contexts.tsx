"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { RunGPA, GPAccount, request_current_balance, MintData } from "../components/Solana/state";
import { Config, PROGRAM, CollectionKeys } from "../components/Solana/constants";
import { CollectionDataUserInput, defaultCollectionInput, CollectionData } from "../components/collection/collectionState";
import { Connection } from "@solana/web3.js";
import { useCallback, useEffect, useState, useRef, PropsWithChildren } from "react";
import { AppRootContextProvider } from "../context/useAppRoot";
import "bootstrap/dist/css/bootstrap.css";
import { getTradeMintData } from "../utils/getTokenMintData";

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

    const [isLaunchDataLoading, setIsLaunchDataLoading] = useState(false);
    const [isHomePageDataLoading, setIsHomePageDataLoading] = useState(false);

    const [program_data, setProgramData] = useState<GPAccount[] | null>(null);

    const [collection_data, setCollectionData] = useState<Map<string, CollectionData> | null>(null);

    const [mintData, setMintData] = useState<Map<String, MintData> | null>(null);

    const [userSOLBalance, setUserSOLBalance] = useState<number>(0);

    const check_program_data = useRef<boolean>(true);
    const last_program_data_update = useRef<number>(0);

    const user_balance_ws_id = useRef<number | null>(null);
    const program_ws_id = useRef<number | null>(null);

    const newCollectionData = useRef<CollectionDataUserInput>({ ...defaultCollectionInput });

    const check_program_update = useCallback(async (new_program_data: any) => {
        if (!new_program_data) return;

        let event_data = Buffer.from(new_program_data.accountInfo.data);

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
    }, []);

    const checkUserBalance = useCallback(async () => {
        if (wallet === null || wallet.publicKey === null) {
            return;
        }

        let balance = await request_current_balance("", wallet.publicKey);
        setUserSOLBalance(balance);
    }, [wallet]);

    const check_user_balance = useCallback(async (result: any) => {
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

    useEffect(() => {
        if (program_data === null) return;

        let collections: Map<string, CollectionData> = new Map<string, CollectionData>();

        for (let i = 0; i < program_data.length; i++) {
            let data = program_data[i].data;

            if (data[0] === 8) {
                const [collection] = CollectionData.struct.deserialize(data);
                collections.set(collection.page_name, collection);
                //console.log(collection);
                continue;
            }
        }

        setCollectionData(collections);

        // set up the map for the trade page
        let trade_mints: String[] = [];
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
    }, [program_data, wallet]);

    const ReGetProgramData = useCallback(async () => {
        check_program_data.current = true;
        GetProgramData(check_program_data, setProgramData, setIsLaunchDataLoading, setIsHomePageDataLoading);
    }, []);

    useEffect(() => {
        let current_time = new Date().getTime();
        if (current_time - last_program_data_update.current < 1000) return;

        last_program_data_update.current = current_time;

        GetProgramData(check_program_data, setProgramData, setIsLaunchDataLoading, setIsHomePageDataLoading);
    }, []);

    return (
        <AppRootContextProvider
            isLaunchDataLoading={isLaunchDataLoading}
            isHomePageDataLoading={isHomePageDataLoading}
            checkProgramData={ReGetProgramData}
            userSOLBalance={userSOLBalance}
            mintData={mintData}
            newCollectionData={newCollectionData}
            collectionList={collection_data}
            setSelectedNetwork={setSelectedNetwork}
            selectedNetwork={selectedNetwork}
            setMintData={setMintData}
        >
            {children}
        </AppRootContextProvider>
    );
};

export default ContextProviders;
