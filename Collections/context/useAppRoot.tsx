"use client";

import { PropsWithChildren, createContext, useContext, MutableRefObject, SetStateAction, Dispatch } from "react";
import { MintData } from "../components/Solana/state";
import { CollectionDataUserInput } from "../components/collection/collectionState";

interface AppRootTypes {
    selectedNetwork: string;
    setSelectedNetwork: Dispatch<SetStateAction<string>>;
}

export const AppRootContext = createContext<AppRootTypes | null>(null);

export const AppRootContextProvider = ({
    children,
    selectedNetwork,
    setSelectedNetwork,
}: PropsWithChildren<AppRootTypes>) => {
    return (
        <AppRootContext.Provider
            value={{
                setSelectedNetwork,
                selectedNetwork,
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
