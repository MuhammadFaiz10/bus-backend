import React, { useEffect, useState } from "react";
import api from "../services/api";
import { showToast } from "../services/toast";

export default function Bookings() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    perPage: 20,
  });
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadBookings(page = 1, status = "") {
    setLoading(true);
    try {
      const params: any = { page, perPage: 20 };
      if (status) params.status = status;
      const r = await api.get("/admin/bookings", { params });
      setBookings(r.data.data || []);
      setPagination({
        page: r.data.page,
        total: r.data.total,
        perPage: r.data.perPage,
      });
    } catch (err: any) {
      showToast(err.userMessage || "Gagal memuat bookings", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBookings();
  }, []);

  function handleFilter(status: string) {
    setStatusFilter(status);
    loadBookings(1, status);
  }

  async function handleConfirm(id: string) {
    if (
      !window.confirm("Are you sure you want to manually confirm this booking?")
    )
      return;
    try {
      await api.put(`/admin/bookings/${id}/confirm`);
      showToast("Booking confirmed successfully", "success");
      loadBookings(pagination.page, statusFilter);
    } catch (err: any) {
      showToast(err.userMessage || "Failed to confirm booking", "error");
    }
  }

  const totalPages = Math.ceil(pagination.total / pagination.perPage);

  function getStatusBadge(status: string) {
    // ... existing ...
    const colors: any = {
      PENDING: "#ffc107",
      CONFIRMED: "#28a745",
      PAID: "#28a745",
      EXPIRED: "#dc3545",
      CANCELLED: "#6c757d",
      FAILED: "#dc3545",
    };
    return {
      background: colors[status] || "#6c757d",
      color: status === "PENDING" ? "#000" : "#fff",
      padding: "4px 8px",
      borderRadius: 4,
      fontSize: 12,
      display: "inline-block",
    };
  }

  return (
    <div>
      {/* ... existing header ... */}
      <h2>Bookings</h2>
      <div className="card">
        {/* ... filters ... */}
        <div
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 16,
            flexWrap: "wrap",
          }}
        >
          <span>Filter Status:</span>
          {["", "PENDING", "CONFIRMED", "EXPIRED", "CANCELLED"].map((s) => (
            <button
              key={s}
              className="button"
              onClick={() => handleFilter(s)}
              style={{
                background: statusFilter === s ? "#007bff" : "#e9ecef",
                color: statusFilter === s ? "#fff" : "#000",
              }}
            >
              {s || "All"}
            </button>
          ))}
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <span>Total: {pagination.total} bookings</span>
          <div>
            <button
              className="button"
              disabled={pagination.page <= 1 || loading}
              onClick={() => loadBookings(pagination.page - 1, statusFilter)}
              style={{ marginRight: 8 }}
            >
              Prev
            </button>
            <span>
              Page {pagination.page} of {totalPages || 1}
            </span>
            <button
              className="button"
              disabled={pagination.page >= totalPages || loading}
              onClick={() => loadBookings(pagination.page + 1, statusFilter)}
              style={{ marginLeft: 8 }}
            >
              Next
            </button>
          </div>
        </div>
      </div>
      <div className="card" style={{ overflowX: "auto" }}>
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>User</th>
              <th>Trip</th>
              <th>Booking Status</th>
              <th>Total Price</th>
              <th>Payment Status</th>
              <th>Payment Amount</th>
              <th>Transaction ID</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => (
              <tr key={b.id}>
                <td title={b.id}>{b.id.slice(0, 8)}...</td>
                <td>{b.user?.email || "-"}</td>
                <td>
                  {b.trip?.route?.origin} → {b.trip?.route?.destination}
                </td>
                <td>
                  <span style={getStatusBadge(b.status)}>{b.status}</span>
                </td>
                <td>Rp {b.totalPrice?.toLocaleString()}</td>
                <td>
                  {b.payment ? (
                    <span style={getStatusBadge(b.payment.status)}>
                      {b.payment.status}
                    </span>
                  ) : (
                    "-"
                  )}
                </td>
                <td>
                  {b.payment?.amount
                    ? `Rp ${b.payment.amount.toLocaleString()}`
                    : "-"}
                </td>
                <td title={b.payment?.transactionId || ""}>
                  {b.payment?.transactionId
                    ? `${b.payment.transactionId.slice(0, 12)}...`
                    : "-"}
                </td>
                <td>{new Date(b.createdAt).toLocaleString()}</td>
                <td>
                  {b.status === "PENDING" && (
                    <button
                      className="button"
                      style={{
                        padding: "4px 8px",
                        fontSize: 12,
                        background: "#28a745",
                        color: "white",
                        border: "none",
                        cursor: "pointer",
                      }}
                      onClick={() => handleConfirm(b.id)}
                    >
                      Confirm
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && (
          <div style={{ textAlign: "center", padding: 16 }}>Loading...</div>
        )}
      </div>
    </div>
  );
}
