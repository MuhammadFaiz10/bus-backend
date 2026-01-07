import React, { useEffect, useState } from "react";
import api from "../services/api";
import { showToast } from "../services/toast";

export default function Terminals() {
  const [terminals, setTerminals] = useState<any[]>([]);
  const [form, setForm] = useState({
    code: "",
    name: "",
    city: "",
    type: "TERMINAL",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTerminals();
  }, []);

  async function fetchTerminals() {
    try {
      const r = await api.get("/terminals");
      setTerminals(r.data);
    } catch (err: any) {
      showToast(err.userMessage || "Gagal memuat terminal", "error");
    }
  }

  async function create() {
    if (!form.code || !form.name || !form.city) {
      showToast("Semua field harus diisi", "error");
      return;
    }

    setLoading(true);
    try {
      // POST /terminals is currently Admin only in docs, verify backend permissions
      // Backend: created route post "/", createTerminalHandler
      // In docs: tags: [Admin - Buses], security BearerAuth
      // In implementation: terminal.route.ts -> terminalRouter.post("/", createTerminalHandler);
      // It is mounted under /terminals
      await api.post("/terminals", form);
      showToast("Terminal berhasil dibuat", "success");
      setForm({ code: "", name: "", city: "", type: "TERMINAL" });
      fetchTerminals();
    } catch (err: any) {
      showToast(err.response?.data?.error || "Gagal membuat terminal", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2>Terminals & Stations</h2>
      <div className="card">
        <h3>Tambah Terminal</h3>
        <div className="form-row">
          <input
            className="input"
            placeholder="Kode (e.g. JKT-PG)"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
          />
          <input
            className="input"
            placeholder="Nama Terminal"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <input
            className="input"
            placeholder="Kota"
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
          />
          <select
            className="input"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
          >
            <option value="TERMINAL">TERMINAL</option>
            <option value="STATION">STATION</option>
            <option value="POOL">POOL</option>
          </select>
          <button className="button" onClick={create} disabled={loading}>
            {loading ? "Memproses..." : "Simpan"}
          </button>
        </div>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Kode</th>
              <th>Nama</th>
              <th>Kota</th>
              <th>Tipe</th>
            </tr>
          </thead>
          <tbody>
            {terminals.map((t) => (
              <tr key={t.id}>
                <td>{t.code}</td>
                <td>{t.name}</td>
                <td>{t.city}</td>
                <td>
                  <span
                    style={{
                      background: "#e9ecef",
                      padding: "2px 6px",
                      borderRadius: 4,
                      fontSize: 12,
                    }}
                  >
                    {t.type}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
