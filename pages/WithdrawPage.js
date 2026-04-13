import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { useWithdraw } from "../contracts/hooks";
import { validateNote } from "../core/note";
import { getConfig } from "../services/config";
import { isRelayerAvailable } from "../services/relayer";
export function WithdrawPage() {
    const [noteStr, setNoteStr] = useState("");
    const [recipient, setRecipient] = useState("");
    const [useRelayer, setUseRelayer] = useState(true);
    const [relayerOk, setRelayerOk] = useState(false);
    const [txHash, setTxHash] = useState(null);
    const [method, setMethod] = useState(null);
    const { withdraw, loading, error, proofStatus, proofProgress, cancelProof, } = useWithdraw();
    useEffect(() => {
        const config = getConfig();
        if (config.relayers.length > 0) {
            isRelayerAvailable(config.relayers[0]).then(setRelayerOk);
        }
    }, []);
    const handleWithdraw = async () => {
        if (!validateNote(noteStr)) {
            alert("Invalid note format");
            return;
        }
        if (!/^0x[0-9a-fA-F]{40}$/.test(recipient)) {
            alert("Invalid recipient address");
            return;
        }
        try {
            const config = getConfig();
            const relayerEndpoint = useRelayer && relayerOk
                ? config.relayers[0]
                : undefined;
            const result = await withdraw(noteStr, recipient, useRelayer && relayerOk, relayerEndpoint);
            setTxHash(result.txHash);
            setMethod(result.method);
        }
        catch { }
    };
    if (txHash) {
        return (_jsxs("div", { className: "page withdraw-page", children: [_jsx("h2", { children: "Withdrawal complete" }), _jsxs("p", { children: ["Method: ", method === "relayer" ? "Via Relayer (anonymous)" : "Direct"] }), _jsxs("p", { className: "tx-link", children: ["TX: ", txHash.slice(0, 16), "..."] }), _jsx("button", { onClick: () => { setTxHash(null); setNoteStr(""); }, children: "New Withdrawal" })] }));
    }
    return (_jsxs("div", { className: "page withdraw-page", children: [_jsx("h2", { children: "Withdraw" }), _jsxs("div", { className: "form-group", children: [_jsx("label", { children: "Secret note:" }), _jsx("textarea", { value: noteStr, onChange: (e) => setNoteStr(e.target.value), placeholder: "mixer-ctc-1-21363-0x...", rows: 3 })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { children: "Recipient address:" }), _jsx("input", { type: "text", value: recipient, onChange: (e) => setRecipient(e.target.value), placeholder: "0x..." })] }), _jsx("div", { className: "form-group", children: _jsxs("label", { children: [_jsx("input", { type: "checkbox", checked: useRelayer, onChange: (e) => setUseRelayer(e.target.checked) }), " ", "Use relayer (anonymous withdrawal)", useRelayer && !relayerOk && (_jsx("span", { className: "warning", children: " \u2014 Relayer offline" })), useRelayer && relayerOk && (_jsx("span", { className: "success", children: " \u2014 Connected" }))] }) }), loading && (_jsxs("div", { className: "proof-progress", children: [_jsx("div", { className: "progress-bar", children: _jsx("div", { className: "progress-fill", style: { width: `${proofProgress}%` } }) }), _jsx("p", { children: proofStatus }), _jsx("p", { className: "hint", children: "ZK proof generation takes 30s-2min. Do not close this tab." }), _jsx("button", { onClick: cancelProof, children: "Cancel" })] })), !loading && (_jsx("button", { className: "primary-btn", onClick: handleWithdraw, children: "Withdraw" })), error && _jsx("p", { className: "error", children: error })] }));
}
