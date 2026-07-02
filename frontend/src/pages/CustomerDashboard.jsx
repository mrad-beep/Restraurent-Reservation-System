import { useEffect, useState } from "react";
import api from "../api/axios";

const TIME_SLOTS = [
  "12:00-13:30",
  "13:30-15:00",
  "18:00-19:30",
  "19:30-21:00",
  "21:00-22:30",
];

const CustomerDashboard = () => {
  const [reservations, setReservations] = useState([]);
  const [form, setForm] = useState({
    date: "",
    timeSlot: TIME_SLOTS[0],
    numberOfGuests: 2,
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadReservations = async () => {
    try {
      const res = await api.get("/reservations/my");
      setReservations(res.data.reservations);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load reservations");
    }
  };

  useEffect(() => {
    loadReservations();
  }, []);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);
    try {
      await api.post("/reservations", {
        date: form.date,
        timeSlot: form.timeSlot,
        numberOfGuests: Number(form.numberOfGuests),
      });
      setSuccess("Reservation created successfully!");
      setForm({ date: "", timeSlot: TIME_SLOTS[0], numberOfGuests: 2 });
      loadReservations();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create reservation");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm("Cancel this reservation?")) return;
    setError("");
    setSuccess("");
    try {
      await api.delete(`/reservations/${id}`);
      setSuccess("Reservation cancelled");
      loadReservations();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to cancel reservation");
    }
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="container">
      <h1>Book a Table</h1>
      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="filters">
            <div className="form-group">
              <label>Date</label>
              <input
                type="date"
                name="date"
                min={today}
                value={form.date}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Time Slot</label>
              <select name="timeSlot" value={form.timeSlot} onChange={handleChange}>
                {TIME_SLOTS.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Guests</label>
              <input
                type="number"
                name="numberOfGuests"
                min={1}
                max={12}
                value={form.numberOfGuests}
                onChange={handleChange}
                required
              />
            </div>
            <button className="primary" type="submit" disabled={submitting}>
              {submitting ? "Booking..." : "Reserve"}
            </button>
          </div>
        </form>
        <p style={{ fontSize: "0.85rem", color: "#666", marginTop: 8 }}>
          A table that fits your party size will be assigned automatically if one is free.
        </p>
      </div>

      <h2>My Reservations</h2>
      <div className="card">
        {reservations.length === 0 ? (
          <p>You have no reservations yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
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
    </div>
  );
};

export default CustomerDashboard;
