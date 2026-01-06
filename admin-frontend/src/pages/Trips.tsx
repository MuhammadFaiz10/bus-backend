import React, { useEffect, useState } from "react";
import api from "../services/api";
import { showToast } from "../services/toast";

export default function Trips() {
  const [trips, setTrips] = useState<any[]>([]);
  const [form, setForm] = useState({
    busId: "",
    routeId: "",
    departureTime: "",
    arrivalTime: "",
    price: 120000,
    generateSeats: true,
    rows: 10,
    cols: 4,
  });
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    api
      .get("/admin/trips")
      .then((r) => setTrips(r.data))
      .catch((err: any) =>
        showToast(err.userMessage || "Gagal memuat trips", "error")
      );
  }, []);

  async function create() {
    if (
      !form.busId ||
      !form.routeId ||
      !form.departureTime ||
      !form.arrivalTime
    ) {
      showToast("Semua field harus diisi", "error");
      return;
    }

    setLoading(true);
    try {
      await api.post("/admin/trips", form);
      showToast("Trip berhasil dibuat", "success");
      setForm({ ...form, departureTime: "", arrivalTime: "" });
      const r = await api.get("/admin/trips");
      setTrips(r.data);
    } catch (err: any) {
      showToast(err.userMessage || "Gagal membuat trip", "error");
    } finally {
      setLoading(false);
    }
  }

  async function updateTrip() {
    if (!form.departureTime || !form.arrivalTime) {
      showToast("Departure dan arrival time harus diisi", "error");
      return;
    }

    setLoading(true);
    try {
      await api.put("/admin/trips/" + editingId, {
        departureTime: form.departureTime,
        arrivalTime: form.arrivalTime,
        price: form.price,
      });
      showToast("Trip berhasil diupdate", "success");
      cancelEdit();
      const r = await api.get("/admin/trips");
      setTrips(r.data);
    } catch (err: any) {
      showToast(err.userMessage || "Gagal mengupdate trip", "error");
    } finally {
      setLoading(false);
    }
  }

  function startEdit(trip: any) {
    setEditingId(trip.id);
    setForm({
      busId: trip.busId || trip.bus?.id || "",
      routeId: trip.routeId || trip.route?.id || "",
      departureTime: trip.departureTime
        ? new Date(trip.departureTime).toISOString().slice(0, 16)
        : "",
      arrivalTime: trip.arrivalTime
        ? new Date(trip.arrivalTime).toISOString().slice(0, 16)
        : "",
      price: trip.price || 120000,
      generateSeats: false,
      rows: 10,
      cols: 4,
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm({
      busId: "",
      routeId: "",
      departureTime: "",
      arrivalTime: "",
      price: 120000,
      generateSeats: true,
      rows: 10,
      cols: 4,
    });
  }

  async function del(id: string) {
    if (!confirm("Apakah Anda yakin ingin menghapus trip ini?")) return;

    try {
      await api.delete("/admin/trips/" + id);
      setTrips(trips.filter((t) => t.id !== id));
      showToast("Trip berhasil dihapus", "success");
    } catch (err: any) {
      showToast(err.userMessage || "Gagal menghapus trip", "error");
    }
  }
  return (
    <div>
      <h2>Trips</h2>
      <div className="card">
        <h3>{editingId ? "Edit Trip" : "Tambah Trip"}</h3>
        {!editingId && (
          <div className="form-row">
            <input
              className="input"
              placeholder="busId"
              value={form.busId}
              onChange={(e) => setForm({ ...form, busId: e.target.value })}
            />
            <input
              className="input"
              placeholder="routeId"
              value={form.routeId}
              onChange={(e) => setForm({ ...form, routeId: e.target.value })}
            />
          </div>
        )}
        <div className="form-row">
          <input
            className="input"
            type="datetime-local"
            placeholder="departureTime"
            value={form.departureTime}
            onChange={(e) =>
              setForm({ ...form, departureTime: e.target.value })
            }
          />
          <input
            className="input"
            type="datetime-local"
            placeholder="arrivalTime"
            value={form.arrivalTime}
            onChange={(e) => setForm({ ...form, arrivalTime: e.target.value })}
          />
          <input
            className="input"
            placeholder="price"
            value={String(form.price)}
            onChange={(e) =>
              setForm({ ...form, price: Number(e.target.value) })
            }
          />
          {editingId ? (
            <>
              <button
                className="button"
                onClick={updateTrip}
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
            <button className="button" onClick={create} disabled={loading}>
              {loading ? "Memproses..." : "Create"}
            </button>
          )}
        </div>
      </div>
      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Trip</th>
              <th>Bus</th>
              <th>Route</th>
              <th>Departure</th>
              <th>Price</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {trips.map((t) => (
              <tr key={t.id}>
                <td>{t.id.slice(0, 8)}...</td>
                <td>{t.bus?.name}</td>
                <td>
                  {t.route?.origin} → {t.route?.destination}
                </td>
                <td>{new Date(t.departureTime).toLocaleString()}</td>
                <td>Rp {t.price?.toLocaleString()}</td>
                <td>
                  <button
                    onClick={() => startEdit(t)}
                    className="button"
                    style={{
                      marginRight: 8,
                      background: "#ffc107",
                      color: "#000",
                    }}
                  >
                    Edit
                  </button>
                  <button onClick={() => del(t.id)} className="button">
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
