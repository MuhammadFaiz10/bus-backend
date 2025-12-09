import { jsx as _jsx, jsxs as _jsxs } from "hono/jsx/jsx-runtime";
import { useEffect, useState } from 'react';
import api from '../services/api';
export default function Buses() {
    const [buses, setBuses] = useState([]);
    const [form, setForm] = useState({ name: '', plate: '', totalSeat: 40 });
    useEffect(() => { api.get('/admin/buses').then(r => setBuses(r.data)).catch(() => { }); }, []);
    async function createBus() {
        await api.post('/admin/buses', form);
        setForm({ name: '', plate: '', totalSeat: 40 });
        const r = await api.get('/admin/buses');
        setBuses(r.data);
    }
    async function del(id) { await api.delete('/admin/buses/' + id); setBuses(buses.filter(b => b.id !== id)); }
    return (_jsxs("div", { children: [_jsx("h2", { children: "Buses" }), _jsx("div", { className: "card", children: _jsxs("div", { className: "form-row", children: [_jsx("input", { className: "input", placeholder: "name", value: form.name, onChange: e => setForm({ ...form, name: e.target.value }) }), _jsx("input", { className: "input", placeholder: "plate", value: form.plate, onChange: e => setForm({ ...form, plate: e.target.value }) }), _jsx("input", { className: "input", placeholder: "totalSeat", value: String(form.totalSeat), onChange: e => setForm({ ...form, totalSeat: Number(e.target.value) }) }), _jsx("button", { className: "button", onClick: createBus, children: "Create" })] }) }), _jsx("div", { className: "card", children: _jsxs("table", { className: "table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Name" }), _jsx("th", { children: "Plate" }), _jsx("th", { children: "Seats" }), _jsx("th", { children: "Action" })] }) }), _jsx("tbody", { children: buses.map(b => (_jsxs("tr", { children: [_jsx("td", { children: b.name }), _jsx("td", { children: b.plate }), _jsx("td", { children: b.totalSeat }), _jsx("td", { children: _jsx("button", { onClick: () => del(b.id), className: "button", children: "Delete" }) })] }, b.id))) })] }) })] }));
}
