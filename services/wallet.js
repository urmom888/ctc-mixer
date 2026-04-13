import { ethers } from "ethers";
import EthereumProvider from "@walletconnect/ethereum-provider";
import { getConfig } from "./config";
const WALLETCONNECT_PROJECT_ID = "972cf4824f2fef80a01732910f0083e5";
const state = {
    address: null,
    type: null,
    provider: null,
    wcProvider: null,
};
const listeners = [];
export function onAccountChange(cb) {
    listeners.push(cb);
    return () => {
        const idx = listeners.indexOf(cb);
        if (idx >= 0)
            listeners.splice(idx, 1);
    };
}
function notify(address) {
    state.address = address;
    listeners.forEach((cb) => cb(address));
}
export function getWalletState() {
    return { address: state.address, type: state.type };
}
// ---- MetaMask ----
async function switchChain() {
    const config = getConfig();
    const hexChainId = "0x" + config.chainId.toString(16);
    try {
        await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: hexChainId }],
        });
    }
    catch (err) {
        if (err.code === 4902) {
            await window.ethereum.request({
                method: "wallet_addEthereumChain",
                params: [
                    {
                        chainId: hexChainId,
                        chainName: config.chainName,
                        rpcUrls: config.rpcUrls,
                    },
                ],
            });
        }
    }
}
export async function connectMetaMask() {
    if (!window.ethereum)
        throw new Error("MetaMask not installed");
    const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
    });
    await switchChain();
    state.type = "metamask";
    state.provider = new ethers.BrowserProvider(window.ethereum);
    state.wcProvider = null;
    notify(accounts[0]);
    window.ethereum.on("accountsChanged", (accs) => {
        notify(accs.length > 0 ? accs[0] : null);
    });
    return accounts[0];
}
// ---- WalletConnect ----
export async function connectWalletConnect() {
    const config = getConfig();
    const wc = await EthereumProvider.init({
        projectId: WALLETCONNECT_PROJECT_ID,
        chains: [config.chainId],
        showQrModal: true,
        rpcMap: { [config.chainId]: config.rpcUrls[0] },
    });
    await wc.connect();
    state.type = "walletconnect";
    state.wcProvider = wc;
    state.provider = new ethers.BrowserProvider(wc);
    const signer = await state.provider.getSigner();
    const addr = await signer.getAddress();
    notify(addr);
    wc.on("accountsChanged", (accs) => {
        notify(accs.length > 0 ? accs[0] : null);
    });
    wc.on("disconnect", () => {
        disconnect();
    });
    return addr;
}
// ---- Disconnect ----
export async function disconnect() {
    if (state.wcProvider) {
        try {
            await state.wcProvider.disconnect();
        }
        catch { }
    }
    state.type = null;
    state.provider = null;
    state.wcProvider = null;
    notify(null);
}
// ---- getSigner (used by hooks.ts) ----
export async function getSigner() {
    if (!state.provider) {
        throw new Error("Wallet not connected");
    }
    return await state.provider.getSigner();
}
// ---- Auto-reconnect on page load ----
export async function tryReconnect() {
    if (!window.ethereum)
        return null;
    try {
        const accs = await window.ethereum.request({
            method: "eth_accounts",
        });
        if (accs.length > 0) {
            state.type = "metamask";
            state.provider = new ethers.BrowserProvider(window.ethereum);
            state.address = accs[0];
            return accs[0];
        }
    }
    catch { }
    return null;
}
