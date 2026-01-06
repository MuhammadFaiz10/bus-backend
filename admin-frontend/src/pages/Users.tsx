import React, { useEffect, useState } from "react";
import api from "../services/api";
import { showToast } from "../services/toast";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "USER",
  });
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    perPage: 50,
  });

  async function loadUsers(page = 1) {
    try {
      const r = await api.get("/admin/users", {
        params: { page, perPage: 50 },
      });
      setUsers(r.data.users);
      setPagination({
        page: r.data.page,
        total: r.data.total,
        perPage: r.data.perPage,
      });
    } catch (err: any) {
      showToast(err.userMessage || "Gagal memuat users", "error");
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function createUser() {
    if (!form.email || !form.password) {
      showToast("Email dan password harus diisi", "error");
      return;
    }

    setLoading(true);
    try {
      await api.post("/admin/users", form);
      showToast("User berhasil dibuat", "success");
      setForm({ name: "", email: "", password: "", role: "USER" });
      loadUsers();
    } catch (err: any) {
      showToast(err.userMessage || "Gagal membuat user", "error");
    } finally {
      setLoading(false);
    }
  }

  async function promoteUser(id: string, newRole: string) {
    try {
      await api.post("/admin/users/" + id + "/promote", { role: newRole });
      showToast("Role berhasil diubah", "success");
      loadUsers(pagination.page);
    } catch (err: any) {
      showToast(err.userMessage || "Gagal mengubah role", "error");
    }
  }

  const totalPages = Math.ceil(pagination.total / pagination.perPage);

  return (
    <div>
      <h2>User Management</h2>
      <div className="card">
        <h3>Tambah User</h3>
        <div className="form-row">
          <input
            className="input"
            placeholder="name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <input
            className="input"
            placeholder="email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <input
            className="input"
            placeholder="password"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <select
            className="input"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
          >
            <option value="USER">USER</option>
            <option value="ADMIN">ADMIN</option>
          </select>
          <button className="button" onClick={createUser} disabled={loading}>
            {loading ? "Memproses..." : "Create"}
          </button>
        </div>
      </div>
      <div className="card">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <span>Total: {pagination.total} users</span>
          <div>
            <button
              className="button"
              disabled={pagination.page <= 1}
              onClick={() => loadUsers(pagination.page - 1)}
              style={{ marginRight: 8 }}
            >
              Prev
            </button>
            <span>
              Page {pagination.page} of {totalPages || 1}
            </span>
            <button
              className="button"
              disabled={pagination.page >= totalPages}
              onClick={() => loadUsers(pagination.page + 1)}
              style={{ marginLeft: 8 }}
            >
              Next
            </button>
          </div>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Created</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.name || "-"}</td>
                <td>{u.email}</td>
                <td>
                  <span
                    style={{
                      padding: "4px 8px",
                      borderRadius: 4,
                      background: u.role === "ADMIN" ? "#dc3545" : "#6c757d",
                      color: "#fff",
                      fontSize: 12,
                    }}
                  >
                    {u.role}
                  </span>
                </td>
                <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                <td>
                  {u.role === "USER" ? (
                    <button
                      onClick={() => promoteUser(u.id, "ADMIN")}
                      className="button"
                      style={{ background: "#28a745" }}
                    >
                      Promote to Admin
                    </button>
                  ) : (
                    <button
                      onClick={() => promoteUser(u.id, "USER")}
                      className="button"
                      style={{ background: "#ffc107", color: "#000" }}
                    >
                      Demote to User
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
