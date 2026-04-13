import { jsxs as _jsxs, jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { connectMetaMask, connectWalletConnect, disconnect, onAccountChange, tryReconnect, getWalletState, } from "../../services/wallet";
export function ConnectWallet() {
    const [address, setAddress] = useState(getWalletState().address);
    const [showModal, setShowModal] = useState(false);
    const [connecting, setConnecting] = useState(false);
    const [error, setError] = useState(null);
    useEffect(() => {
        tryReconnect().then((addr) => {
            if (addr)
                setAddress(addr);
        });
        return onAccountChange(setAddress);
    }, []);
    const handleConnect = async (method) => {
        setConnecting(true);
        setError(null);
        try {
            if (method === "metamask") {
                await connectMetaMask();
            }
            else {
                await connectWalletConnect();
            }
            setShowModal(false);
        }
        catch (err) {
            setError(err.message);
        }
        finally {
            setConnecting(false);
        }
    };
    const handleDisconnect = async () => {
        await disconnect();
        setShowModal(false);
    };
    if (address) {
        return (_jsxs("div", { className: "wallet-connected", children: [_jsxs("button", { className: "connect-btn connected", onClick: () => setShowModal(!showModal), children: [address.slice(0, 6), "...", address.slice(-4)] }), showModal && (_jsxs("div", { className: "wallet-dropdown", children: [_jsx("p", { className: "wallet-addr", children: address }), _jsx("button", { className: "disconnect-btn", onClick: handleDisconnect, children: "Disconnect" })] }))] }));
    }
    return (_jsxs(_Fragment, { children: [_jsx("button", { className: "connect-btn", onClick: () => setShowModal(true), children: "Connect Wallet" }), showModal && (_jsx("div", { className: "modal-overlay", onClick: () => setShowModal(false), children: _jsxs("div", { className: "modal-content", onClick: (e) => e.stopPropagation(), children: [_jsxs("div", { className: "modal-header", children: [_jsx("h3", { children: "Connect Wallet" }), _jsx("button", { className: "modal-close", onClick: () => setShowModal(false), children: "\u00D7" })] }), _jsxs("div", { className: "wallet-options", children: [_jsxs("button", { className: "wallet-option", onClick: () => handleConnect("metamask"), disabled: connecting, children: [_jsx("span", { className: "wallet-icon", children: "\uD83E\uDD8A" }), _jsx("span", { className: "wallet-name", children: "MetaMask" }), _jsx("span", { className: "wallet-desc", children: "Browser extension" })] }), _jsxs("button", { className: "wallet-option", onClick: () => handleConnect("walletconnect"), disabled: connecting, children: [_jsx("span", { className: "wallet-icon", children: "\uD83D\uDD17" }), _jsx("span", { className: "wallet-name", children: "WalletConnect" }), _jsx("span", { className: "wallet-desc", children: "Mobile wallet QR" })] })] }), connecting && _jsx("p", { className: "connecting-text", children: "Connecting..." }), error && _jsx("p", { className: "error", children: error })] }) }))] }));
}
