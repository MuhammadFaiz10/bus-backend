import { jsx as _jsx, jsxs as _jsxs } from "hono/jsx/jsx-runtime";
import { useEffect, useState } from 'react';
import api from '../services/api';
export default function Bookings() {
    const [bookings, setBookings] = useState([]);
    useEffect(() => { api.get('/admin/bookings').then(r => setBookings(r.data.data).catch(() => { })); }, []);
    return (_jsxs("div", { children: [_jsx("h2", { children: "Bookings" }), _jsx("div", { className: "card", children: _jsxs("table", { className: "table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "ID" }), _jsx("th", { children: "User" }), _jsx("th", { children: "Trip" }), _jsx("th", { children: "Status" }), _jsx("th", { children: "Price" })] }) }), _jsx("tbody", { children: bookings.map(b => (_jsxs("tr", { children: [_jsx("td", { children: b.id }), _jsx("td", { children: b.user?.email }), _jsxs("td", { children: [b.trip?.route?.origin, "\u2192", b.trip?.route?.destination] }), _jsx("td", { children: b.status }), _jsx("td", { children: b.totalPrice })] }, b.id))) })] }) })] }));
}
