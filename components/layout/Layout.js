import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link, useLocation } from "react-router-dom";
import { ConnectWallet } from "../wallet/ConnectWallet";
export function Header() {
    const location = useLocation();
    const nav = [
        { path: "/", label: "Deposit" },
        { path: "/withdraw", label: "Withdraw" },
        { path: "/stats", label: "Stats" },
    ];
    return (_jsxs("header", { className: "mixer-header", children: [_jsxs("div", { className: "header-left", children: [_jsx("h1", { className: "logo", children: "ZK Mixer" }), _jsx("nav", { className: "nav", children: nav.map((n) => (_jsx(Link, { to: n.path, className: location.pathname === n.path ? "active" : "", children: n.label }, n.path))) })] }), _jsx(ConnectWallet, {})] }));
}
export function Layout({ children }) {
    return (_jsxs("div", { className: "mixer-app", children: [_jsx(Header, {}), _jsx("main", { className: "mixer-main", children: children }), _jsx("footer", { className: "mixer-footer", children: _jsx("p", { children: "ZK Mixer on CTC Chain \u2014 IPFS Hosted \u2014 All logic runs in your browser" }) })] }));
}
