import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "hono/jsx/jsx-runtime";
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { logout, getUser } from '../services/auth';
export default function Layout() {
    const navigate = useNavigate();
    const user = getUser();
    function onLogout() {
        logout();
        navigate('/login');
    }
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "header", children: [_jsx("div", { style: { flex: 1 }, children: "Admin Dashboard" }), _jsx("div", { style: { marginRight: 16 }, children: user?.email }), _jsx("button", { className: "button", onClick: onLogout, children: "Logout" })] }), _jsxs("div", { className: "container", children: [_jsxs("div", { className: "sidebar card", children: [_jsx(Link, { to: "/", className: "link", children: "Overview" }), _jsx(Link, { to: "/buses", className: "link", children: "Buses" }), _jsx(Link, { to: "/routes", className: "link", children: "Routes" }), _jsx(Link, { to: "/trips", className: "link", children: "Trips" }), _jsx(Link, { to: "/bookings", className: "link", children: "Bookings" })] }), _jsx("div", { className: "content", children: _jsx(Outlet, {}) })] })] }));
}
