"use client";

import { PropsWithChildren, createContext, useContext, MutableRefObject, SetStateAction, Dispatch } from "react";
import { UserData, MintData, ListingData } from "../components/Solana/state";
import { CollectionDataUserInput, CollectionData } from "../components/collection/collectionState";

interface AppRootTypes {
    sidePanelCollapsed: boolean;
    setSidePanelCollapsed: Dispatch<SetStateAction<boolean>>;
    userList: Map<string, UserData>;
    currentUserData: UserData;
    isLaunchDataLoading: boolean;
    isHomePageDataLoading: boolean;
    checkProgramData: () => Promise<void>;
    userSOLBalance: number;
    mintData: Map<String, MintData>;
    newCollectionData: MutableRefObject<CollectionDataUserInput>;
    collectionList: Map<string, CollectionData>;
    selectedNetwork: string;
    setSelectedNetwork: Dispatch<SetStateAction<string>>;
    listingData: Map<string, ListingData>;
    setListingData: Dispatch<SetStateAction<Map<string, ListingData>>>;
    setMintData: Dispatch<SetStateAction<Map<string, MintData>>>;
}

export const AppRootContext = createContext<AppRootTypes | null>(null);

export const AppRootContextProvider = ({
    sidePanelCollapsed,
    setSidePanelCollapsed,
    children,
    userList,
    currentUserData,
    isLaunchDataLoading,
    isHomePageDataLoading,
    checkProgramData,
    userSOLBalance,
    mintData,
    newCollectionData,
    collectionList,
    selectedNetwork,
    setSelectedNetwork,
    listingData,
    setListingData,
    setMintData,
}: PropsWithChildren<AppRootTypes>) => {
    return (
        <AppRootContext.Provider
            value={{
                sidePanelCollapsed,
                setSidePanelCollapsed,
                userList,
                currentUserData,
                isLaunchDataLoading,
                isHomePageDataLoading,
                checkProgramData,
                userSOLBalance,
                mintData,
                newCollectionData,
                collectionList,
                setSelectedNetwork,
                selectedNetwork,
                listingData,
                setListingData,
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
