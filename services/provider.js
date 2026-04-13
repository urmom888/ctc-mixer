import { ethers } from "ethers";
import { getConfig } from "./config";
let provider = null;
export function getProvider() {
    if (!provider) {
        const config = getConfig();
        provider = new ethers.JsonRpcProvider(config.rpcUrls[0], config.chainId);
    }
    return provider;
}
export async function getSigner() {
    if (!window.ethereum)
        throw new Error("No wallet found");
    const bp = new ethers.BrowserProvider(window.ethereum);
    return await bp.getSigner();
}
export async function connectWallet() {
    if (!window.ethereum)
        throw new Error("Install MetaMask or compatible wallet");
    const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
    });
    const config = getConfig();
    try {
        await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: "0x" + config.chainId.toString(16) }],
        });
    }
    catch (err) {
        if (err.code === 4902) {
            await window.ethereum.request({
                method: "wallet_addEthereumChain",
                params: [
                    {
                        chainId: "0x" + config.chainId.toString(16),
                        chainName: config.chainName,
                        rpcUrls: config.rpcUrls,
                    },
                ],
            });
        }
    }
    return accounts[0];
}
