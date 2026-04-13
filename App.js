import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { HashRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/layout/Layout";
import { DepositPage } from "./pages/DepositPage";
import { WithdrawPage } from "./pages/WithdrawPage";
import { StatsPage } from "./pages/StatsPage";
import { loadConfig } from "./services/config";
import { initTelegramWebApp } from "./services/telegram-bridge";
export function App() {
    const [ready, setReady] = useState(false);
    const [err, setErr] = useState(null);
    useEffect(() => {
        initTelegramWebApp();
        loadConfig()
            .then(() => setReady(true))
            .catch((e) => setErr(e.message));
    }, []);
    if (err)
        return _jsxs("div", { style: { color: "#f85149", padding: 40 }, children: ["Config error: ", err] });
    if (!ready)
        return null;
    return (_jsx(HashRouter, { children: _jsx(Layout, { children: _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(DepositPage, {}) }), _jsx(Route, { path: "/withdraw", element: _jsx(WithdrawPage, {}) }), _jsx(Route, { path: "/stats", element: _jsx(StatsPage, {}) })] }) }) }));
}
