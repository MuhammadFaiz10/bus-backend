import { jsx as _jsx, jsxs as _jsxs } from "hono/jsx/jsx-runtime";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { setToken, setUser } from '../services/auth';
export default function LoginPage() {
    const [email, setEmail] = useState('admin@test.com');
    const [password, setPassword] = useState('password123');
    const [err, setErr] = useState(null);
    const nav = useNavigate();
    async function submit(e) {
        e.preventDefault();
        try {
            const res = await api.post('/auth/login', { email, password });
            const token = res.data.token;
            setToken(token);
            setUser(res.data.user);
            nav('/');
        }
        catch (err) {
            setErr(err?.response?.data?.error || 'Login failed');
        }
    }
    return (_jsx("div", { style: { display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }, children: _jsxs("div", { style: { width: 360, background: '#fff', padding: 20, borderRadius: 8 }, children: [_jsx("h3", { children: "Admin Login" }), _jsxs("form", { onSubmit: submit, children: [_jsx("div", { className: "form-row", children: _jsx("input", { className: "input", value: email, onChange: e => setEmail(e.target.value), placeholder: "email" }) }), _jsx("div", { className: "form-row", children: _jsx("input", { className: "input", type: "password", value: password, onChange: e => setPassword(e.target.value), placeholder: "password" }) }), err && _jsx("div", { style: { color: 'red', marginBottom: 8 }, children: err }), _jsx("button", { className: "button", type: "submit", children: "Login" })] })] }) }));
}
