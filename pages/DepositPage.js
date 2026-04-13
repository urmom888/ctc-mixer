import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useDeposit } from "../contracts/hooks";
import { AMOUNTS } from "../services/config";
import { isTelegramWebApp, sendToTelegram } from "../services/telegram-bridge";
export function DepositPage() {
    const [amount, setAmount] = useState("1");
    const [note, setNote] = useState(null);
    const [txHash, setTxHash] = useState(null);
    const [copied, setCopied] = useState(false);
    const { deposit, loading, error } = useDeposit();
    const handleDeposit = async () => {
        try {
            const result = await deposit(amount);
            setNote(result.note);
            setTxHash(result.txHash);
            if (isTelegramWebApp()) {
                sendToTelegram({ type: "deposit_complete", note: result.note, amount });
            }
        }
        catch { }
    };
    const copyNote = () => {
        if (note) {
            navigator.clipboard.writeText(note);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };
    const downloadNote = () => {
        if (!note)
            return;
        const blob = new Blob([note], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `mixer-note-${amount}-${Date.now()}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };
    if (note) {
        return (_jsxs("div", { className: "page deposit-page", children: [_jsx("h2", { children: "Deposit successful" }), _jsxs("div", { className: "note-display", children: [_jsx("label", { children: "Your secret note (save this!):" }), _jsx("textarea", { readOnly: true, value: note, rows: 4 }), _jsxs("div", { className: "note-actions", children: [_jsx("button", { onClick: copyNote, children: copied ? "Copied!" : "Copy" }), _jsx("button", { onClick: downloadNote, children: "Download" })] })] }), _jsx("p", { className: "warning", children: "This note is the ONLY way to withdraw your funds. If you lose it, your funds are lost forever." }), txHash && (_jsxs("p", { className: "tx-link", children: ["TX: ", txHash.slice(0, 16), "..."] })), _jsx("button", { onClick: () => { setNote(null); setTxHash(null); }, children: "New Deposit" })] }));
    }
    return (_jsxs("div", { className: "page deposit-page", children: [_jsx("h2", { children: "Deposit" }), _jsx("p", { children: "Select amount and deposit to receive a secret note." }), _jsx("div", { className: "amount-selector", children: AMOUNTS.map((a) => (_jsxs("button", { className: amount === a ? "selected" : "", onClick: () => setAmount(a), children: [a, " CTC"] }, a))) }), _jsx("button", { className: "primary-btn", onClick: handleDeposit, disabled: loading, children: loading ? "Processing..." : `Deposit ${amount} CTC` }), error && _jsx("p", { className: "error", children: error })] }));
}
