import { jsx as _jsx, jsxs as _jsxs } from "hono/jsx/jsx-runtime";
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/Login';
import Dashboard from './pages/Dashboard';
import Buses from './pages/Buses';
import RoutesPage from './pages/Routes';
import Trips from './pages/Trips';
import Bookings from './pages/Bookings';
import Layout from './components/Layout';
import { getToken } from './services/auth';
function PrivateRoute({ children }) {
    const token = getToken();
    if (!token)
        return _jsx(Navigate, { to: "/login", replace: true });
    return children;
}
export default function App() {
    return (_jsxs(Routes, { children: [_jsx(Route, { path: "/login", element: _jsx(LoginPage, {}) }), _jsxs(Route, { path: "/", element: _jsx(PrivateRoute, { children: _jsx(Layout, {}) }), children: [_jsx(Route, { index: true, element: _jsx(Dashboard, {}) }), _jsx(Route, { path: "buses", element: _jsx(Buses, {}) }), _jsx(Route, { path: "routes", element: _jsx(RoutesPage, {}) }), _jsx(Route, { path: "trips", element: _jsx(Trips, {}) }), _jsx(Route, { path: "bookings", element: _jsx(Bookings, {}) })] })] }));
}
