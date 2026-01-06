import React, { useEffect, useState } from "react";
import api from "../services/api";
import { showToast } from "../services/toast";

export default function RoutesPage() {
  const [routes, setRoutes] = useState<any[]>([]);
  const [form, setForm] = useState({
    origin: "",
    destination: "",
    distanceKm: 150,
  });
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    api
      .get("/admin/routes")
      .then((r) => setRoutes(r.data))
      .catch((err: any) =>
        showToast(err.userMessage || "Gagal memuat routes", "error")
      );
  }, []);

  async function createRoute() {
    if (!form.origin || !form.destination) {
      showToast("Origin dan destination harus diisi", "error");
      return;
    }

    setLoading(true);
    try {
      await api.post("/admin/routes", form);
      showToast("Route berhasil dibuat", "success");
      setForm({ origin: "", destination: "", distanceKm: 150 });
      const r = await api.get("/admin/routes");
      setRoutes(r.data);
    } catch (err: any) {
      showToast(err.userMessage || "Gagal membuat route", "error");
    } finally {
      setLoading(false);
    }
  }

  async function updateRoute() {
    if (!form.origin || !form.destination) {
      showToast("Origin dan destination harus diisi", "error");
      return;
    }

    setLoading(true);
    try {
      await api.put("/admin/routes/" + editingId, form);
      showToast("Route berhasil diupdate", "success");
      cancelEdit();
      const r = await api.get("/admin/routes");
      setRoutes(r.data);
    } catch (err: any) {
      showToast(err.userMessage || "Gagal mengupdate route", "error");
    } finally {
      setLoading(false);
    }
  }

  function startEdit(route: any) {
    setEditingId(route.id);
    setForm({
      origin: route.origin,
      destination: route.destination,
      distanceKm: route.distanceKm,
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm({ origin: "", destination: "", distanceKm: 150 });
  }

  async function del(id: string) {
    if (!confirm("Apakah Anda yakin ingin menghapus route ini?")) return;

    try {
      await api.delete("/admin/routes/" + id);
      setRoutes(routes.filter((r) => r.id !== id));
      showToast("Route berhasil dihapus", "success");
    } catch (err: any) {
      showToast(err.userMessage || "Gagal menghapus route", "error");
    }
  }
  return (
    <div>
      <h2>Routes</h2>
      <div className="card">
        <h3>{editingId ? "Edit Route" : "Tambah Route"}</h3>
        <div className="form-row">
          <input
            className="input"
            placeholder="origin"
            value={form.origin}
            onChange={(e) => setForm({ ...form, origin: e.target.value })}
          />
          <input
            className="input"
            placeholder="destination"
            value={form.destination}
            onChange={(e) => setForm({ ...form, destination: e.target.value })}
          />
          <input
            className="input"
            placeholder="distanceKm"
            value={String(form.distanceKm)}
            onChange={(e) =>
              setForm({ ...form, distanceKm: Number(e.target.value) })
            }
          />
          {editingId ? (
            <>
              <button
                className="button"
                onClick={updateRoute}
                disabled={loading}
              >
                {loading ? "Memproses..." : "Update"}
              </button>
              <button
                className="button"
                onClick={cancelEdit}
                disabled={loading}
                style={{ marginLeft: 8, background: "#6c757d" }}
              >
                Cancel
              </button>
            </>
          ) : (
            <button className="button" onClick={createRoute} disabled={loading}>
              {loading ? "Memproses..." : "Create"}
            </button>
          )}
        </div>
      </div>
      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Origin</th>
              <th>Destination</th>
              <th>Distance</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {routes.map((r) => (
              <tr key={r.id}>
                <td>{r.origin}</td>
                <td>{r.destination}</td>
                <td>{r.distanceKm}</td>
                <td>
                  <button
                    onClick={() => startEdit(r)}
                    className="button"
                    style={{
                      marginRight: 8,
                      background: "#ffc107",
                      color: "#000",
                    }}
                  >
                    Edit
                  </button>
                  <button onClick={() => del(r.id)} className="button">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
