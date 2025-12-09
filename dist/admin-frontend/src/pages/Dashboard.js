import { jsx as _jsx, jsxs as _jsxs } from "hono/jsx/jsx-runtime";
import { useEffect, useState } from 'react';
import api from '../services/api';
export default function Dashboard() {
    const [stats, setStats] = useState({});
    useEffect(() => {
        api.get('/admin/bookings/stats').then(r => setStats(r.data)).catch(() => { });
    }, []);
    return (_jsxs("div", { children: [_jsx("h2", { children: "Overview" }), _jsxs("div", { className: "card", children: [_jsx("strong", { children: "Total bookings:" }), " ", stats.total ?? '-'] }), _jsxs("div", { className: "card", children: [_jsx("strong", { children: "Booking counts by status:" }), _jsx("pre", { children: JSON.stringify(stats.counts, null, 2) })] })] }));
}
