"use client";

import { PropsWithChildren, createContext, useContext, MutableRefObject, SetStateAction, Dispatch } from "react";
import { MintData } from "../components/Solana/state";
import { CollectionDataUserInput, CollectionData } from "../components/collection/collectionState";

interface AppRootTypes {
    isLaunchDataLoading: boolean;
    isHomePageDataLoading: boolean;
    checkProgramData: () => Promise<void>;
    userSOLBalance: number;
    mintData: Map<String, MintData>;
    newCollectionData: MutableRefObject<CollectionDataUserInput>;
    collectionList: Map<string, CollectionData>;
    selectedNetwork: string;
    setSelectedNetwork: Dispatch<SetStateAction<string>>;
    setMintData: Dispatch<SetStateAction<Map<string, MintData>>>;
}

export const AppRootContext = createContext<AppRootTypes | null>(null);

export const AppRootContextProvider = ({
    children,
    isLaunchDataLoading,
    isHomePageDataLoading,
    checkProgramData,
    userSOLBalance,
    mintData,
    newCollectionData,
    collectionList,
    selectedNetwork,
    setSelectedNetwork,
    setMintData,
}: PropsWithChildren<AppRootTypes>) => {
    return (
        <AppRootContext.Provider
            value={{
                isLaunchDataLoading,
                isHomePageDataLoading,
                checkProgramData,
                userSOLBalance,
                mintData,
                newCollectionData,
                collectionList,
                setSelectedNetwork,
                selectedNetwork,
                setMintData,
            }}
        >
            {children}
        </AppRootContext.Provider>
    );
};

const useAppRoot = () => {
    const context = useContext(AppRootContext);

    if (!context) {
        throw new Error("No AppRootContext");
    }

    return context;
};

export default useAppRoot;
