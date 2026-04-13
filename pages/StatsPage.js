import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { getConfig, AMOUNTS } from "../services/config";
import { getDeposits } from "../services/events";
import { getAllNotes, exportNotes, importNotes } from "../store/noteStore";
export function StatsPage() {
    const [pools, setPools] = useState([]);
    const [notes, setNotes] = useState([]);
    const [loadingStats, setLoadingStats] = useState(true);
    useEffect(() => {
        loadStats();
        getAllNotes().then(setNotes);
    }, []);
    const loadStats = async () => {
        setLoadingStats(true);
        const config = getConfig();
        const results = [];
        for (const amount of AMOUNTS) {
            const addr = config.contracts[amount];
            if (!addr)
                continue;
            try {
                const events = await getDeposits(addr);
                results.push({ amount, deposits: events.length, contract: addr });
            }
            catch {
                results.push({ amount, deposits: 0, contract: addr });
            }
        }
        setPools(results);
        setLoadingStats(false);
    };
    const handleExport = async () => {
        const json = await exportNotes();
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `mixer-notes-backup-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };
    const handleImport = () => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".json";
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file)
                return;
            const text = await file.text();
            const count = await importNotes(text);
            alert(`Imported ${count} notes`);
            setNotes(await getAllNotes());
        };
        input.click();
    };
    return (_jsxs("div", { className: "page stats-page", children: [_jsx("h2", { children: "Statistics" }), _jsx("h3", { children: "Mixer pools (anonymity set)" }), loadingStats ? (_jsx("p", { children: "Loading..." })) : (_jsxs("table", { className: "stats-table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Amount" }), _jsx("th", { children: "Deposits" }), _jsx("th", { children: "Contract" })] }) }), _jsx("tbody", { children: pools.map((p) => (_jsxs("tr", { children: [_jsxs("td", { children: [p.amount, " CTC"] }), _jsx("td", { children: p.deposits }), _jsxs("td", { children: [p.contract.slice(0, 10), "..."] })] }, p.amount))) })] })), _jsxs("h3", { children: ["My notes (", notes.length, ")"] }), notes.length > 0 && (_jsxs("table", { className: "stats-table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Amount" }), _jsx("th", { children: "Status" }), _jsx("th", { children: "Date" })] }) }), _jsx("tbody", { children: notes.map((n) => (_jsxs("tr", { children: [_jsxs("td", { children: [n.amount, " CTC"] }), _jsx("td", { children: n.status }), _jsx("td", { children: new Date(n.timestamp).toLocaleDateString() })] }, n.id))) })] })), _jsxs("div", { className: "note-backup", children: [_jsx("button", { onClick: handleExport, children: "Export notes" }), _jsx("button", { onClick: handleImport, children: "Import notes" })] })] }));
}
