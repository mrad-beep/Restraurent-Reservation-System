import { useEffect, useState } from "react";
import api from "../api/axios";

const AdminDashboard = () => {
  const [reservations, setReservations] = useState([]);
  const [tables, setTables] = useState([]);
  const [dateFilter, setDateFilter] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [newTable, setNewTable] = useState({ tableNumber: "", capacity: "" });

  const loadReservations = async (date) => {
    try {
      const res = await api.get("/reservations", {
        params: date ? { date } : {},
      });
      setReservations(res.data.reservations);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load reservations");
    }
  };

  const loadTables = async () => {
    try {
      const res = await api.get("/tables");
      setTables(res.data.tables);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load tables");
    }
  };

  useEffect(() => {
    loadReservations();
    loadTables();
  }, []);

  const handleFilter = (e) => {
    e.preventDefault();
    loadReservations(dateFilter);
  };

  const handleCancel = async (id) => {
    if (!window.confirm("Cancel this reservation?")) return;
    setError("");
    setSuccess("");
    try {
      await api.delete(`/reservations/admin/${id}`);
      setSuccess("Reservation cancelled");
      loadReservations(dateFilter);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to cancel reservation");
    }
  };

  const handleAddTable = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      await api.post("/tables", {
        tableNumber: Number(newTable.tableNumber),
        capacity: Number(newTable.capacity),
      });
      setSuccess("Table added");
      setNewTable({ tableNumber: "", capacity: "" });
      loadTables();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add table");
    }
  };

  const handleDeactivateTable = async (id) => {
    if (!window.confirm("Deactivate this table?")) return;
    try {
      await api.delete(`/tables/${id}`);
      loadTables();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to deactivate table");
    }
  };

  return (
    <div className="container">
      <h1>Admin Panel</h1>
      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      <h2>All Reservations</h2>
      <div className="card">
        <form onSubmit={handleFilter} className="filters">
          <div className="form-group">
            <label>Filter by date</label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
          </div>
          <button className="primary" type="submit">
            Filter
          </button>
          <button
            type="button"
            className="primary"
            style={{ background: "#6b7280" }}
            onClick={() => {
              setDateFilter("");
              loadReservations();
            }}
          >
            Clear
          </button>
        </form>

        {reservations.length === 0 ? (
          <p>No reservations found.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Date</th>
                <th>Time Slot</th>
                <th>Table</th>
                <th>Guests</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {reservations.map((r) => (
                <tr key={r._id}>
                  <td>{r.user?.name} <br /><small>{r.user?.email}</small></td>
                  <td>{r.date}</td>
                  <td>{r.timeSlot}</td>
                  <td>#{r.table?.tableNumber} (seats {r.table?.capacity})</td>
                  <td>{r.numberOfGuests}</td>
                  <td>
                    <span className={`badge ${r.status}`}>{r.status}</span>
                  </td>
                  <td>
                    {r.status === "confirmed" && (
                      <button className="danger" onClick={() => handleCancel(r._id)}>
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <h2>Manage Tables</h2>
      <div className="card">
        <form onSubmit={handleAddTable} className="filters">
          <div className="form-group">
            <label>Table Number</label>
            <input
              type="number"
              value={newTable.tableNumber}
              onChange={(e) => setNewTable({ ...newTable, tableNumber: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Capacity</label>
            <input
              type="number"
              value={newTable.capacity}
              onChange={(e) => setNewTable({ ...newTable, capacity: e.target.value })}
              required
            />
          </div>
          <button className="primary" type="submit">
            Add Table
          </button>
        </form>

        <table style={{ marginTop: 16 }}>
          <thead>
            <tr>
              <th>Table #</th>
              <th>Capacity</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {tables.map((t) => (
              <tr key={t._id}>
                <td>{t.tableNumber}</td>
                <td>{t.capacity}</td>
                <td>
                  <button className="danger" onClick={() => handleDeactivateTable(t._id)}>
                    Deactivate
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminDashboard;
