"use client";

import { Config } from "../components/Solana/constants";
import {  useState, PropsWithChildren } from "react";
import { AppRootContextProvider } from "../context/useAppRoot";
import "bootstrap/dist/css/bootstrap.css";

const ContextProviders = ({ children }: PropsWithChildren) => {

    const [selectedNetwork, setSelectedNetwork] = useState(Config.NETWORK);

    return (
        <AppRootContextProvider
            setSelectedNetwork={setSelectedNetwork}
            selectedNetwork={selectedNetwork}
        >
            {children}
        </AppRootContextProvider>
    );
};

export default ContextProviders;
