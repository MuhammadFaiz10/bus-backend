import { jsx as _jsx, jsxs as _jsxs } from "hono/jsx/jsx-runtime";
import { useEffect, useState } from 'react';
import api from '../services/api';
export default function RoutesPage() {
    const [routes, setRoutes] = useState([]);
    const [form, setForm] = useState({ origin: '', destination: '', distanceKm: 150 });
    useEffect(() => { api.get('/admin/routes').then(r => setRoutes(r.data)).catch(() => { }); }, []);
    async function createRoute() {
        await api.post('/admin/routes', form);
        setForm({ origin: '', destination: '', distanceKm: 150 });
        const r = await api.get('/admin/routes');
        setRoutes(r.data);
    }
    async function del(id) { await api.delete('/admin/routes/' + id); setRoutes(routes.filter(b => b.id !== id)); }
    return (_jsxs("div", { children: [_jsx("h2", { children: "Routes" }), _jsx("div", { className: "card", children: _jsxs("div", { className: "form-row", children: [_jsx("input", { className: "input", placeholder: "origin", value: form.origin, onChange: e => setForm({ ...form, origin: e.target.value }) }), _jsx("input", { className: "input", placeholder: "destination", value: form.destination, onChange: e => setForm({ ...form, destination: e.target.value }) }), _jsx("input", { className: "input", placeholder: "distanceKm", value: String(form.distanceKm), onChange: e => setForm({ ...form, distanceKm: Number(e.target.value) }) }), _jsx("button", { className: "button", onClick: createRoute, children: "Create" })] }) }), _jsx("div", { className: "card", children: _jsxs("table", { className: "table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Origin" }), _jsx("th", { children: "Destination" }), _jsx("th", { children: "Distance" }), _jsx("th", { children: "Action" })] }) }), _jsx("tbody", { children: routes.map(r => (_jsxs("tr", { children: [_jsx("td", { children: r.origin }), _jsx("td", { children: r.destination }), _jsx("td", { children: r.distanceKm }), _jsx("td", { children: _jsx("button", { onClick: () => del(r.id), className: "button", children: "Delete" }) })] }, r.id))) })] }) })] }));
}
