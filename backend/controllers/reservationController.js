const mongoose = require("mongoose");
const Reservation = require("../models/Reservation");
const Table = require("../models/Table");
const { asyncHandler } = require("../utils/errorHandler");

/**
 * Finds the first active table whose capacity fits numberOfGuests and that
 * has no confirmed reservation for the same date + timeSlot.
 * This is the core availability/conflict-prevention logic.
 */
const findAvailableTable = async (date, timeSlot, numberOfGuests, excludeReservationId = null) => {
  // Tables big enough for the party, smallest-fit first (avoids wasting a big table on 2 guests)
  const candidateTables = await Table.find({
    isActive: true,
    capacity: { $gte: numberOfGuests },
  }).sort({ capacity: 1 });

  if (candidateTables.length === 0) return null;

  // Reservations already occupying that date + timeSlot
  const conflictQuery = {
    date,
    timeSlot,
    status: "confirmed",
  };
  if (excludeReservationId) {
    conflictQuery._id = { $ne: excludeReservationId };
  }

  const conflictingReservations = await Reservation.find(conflictQuery).select("table");
  const bookedTableIds = new Set(conflictingReservations.map((r) => r.table.toString()));

  const availableTable = candidateTables.find(
    (t) => !bookedTableIds.has(t._id.toString())
  );

  return availableTable || null;
};

// @route POST /api/reservations
// @access Private/Customer
const createReservation = asyncHandler(async (req, res) => {
  const { date, timeSlot, numberOfGuests, tableId } = req.body;

  if (!date || !timeSlot || !numberOfGuests) {
    res.status(400);
    throw new Error("date, timeSlot, and numberOfGuests are required");
  }

  if (!Reservation.TIME_SLOTS.includes(timeSlot)) {
    res.status(400);
    throw new Error(`timeSlot must be one of: ${Reservation.TIME_SLOTS.join(", ")}`);
  }

  const today = new Date().toISOString().split("T")[0];
  if (date < today) {
    res.status(400);
    throw new Error("Cannot create a reservation for a past date");
  }

  let table;

  if (tableId) {
    // Customer requested a specific table - validate capacity + conflict explicitly
    table = await Table.findById(tableId);
    if (!table || !table.isActive) {
      res.status(404);
      throw new Error("Selected table not found");
    }
    if (table.capacity < numberOfGuests) {
      res.status(400);
      throw new Error(
        `Table ${table.tableNumber} only seats ${table.capacity} guests`
      );
    }
    const conflict = await Reservation.findOne({
      table: table._id,
      date,
      timeSlot,
      status: "confirmed",
    });
    if (conflict) {
      res.status(409);
      throw new Error("This table is already booked for the selected date and time slot");
    }
  } else {
    // Auto-assign the smallest available table that fits the party
    table = await findAvailableTable(date, timeSlot, numberOfGuests);
    if (!table) {
      res.status(409);
      throw new Error(
        "No tables are available for the selected date, time slot, and party size"
      );
    }
  }

  const reservation = await Reservation.create({
    user: req.user._id,
    table: table._id,
    date,
    timeSlot,
    numberOfGuests,
  });

  const populated = await reservation.populate("table", "tableNumber capacity");

  res.status(201).json({ success: true, reservation: populated });
});

// @route GET /api/reservations/my
// @access Private/Customer
const getMyReservations = asyncHandler(async (req, res) => {
  const reservations = await Reservation.find({ user: req.user._id })
    .populate("table", "tableNumber capacity")
    .sort({ date: 1, timeSlot: 1 });

  res.status(200).json({ success: true, count: reservations.length, reservations });
});

// @route DELETE /api/reservations/:id
// @access Private/Customer (own reservations only)
const cancelMyReservation = asyncHandler(async (req, res) => {
  const reservation = await Reservation.findById(req.params.id);

  if (!reservation) {
    res.status(404);
    throw new Error("Reservation not found");
  }

  if (reservation.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("You can only cancel your own reservations");
  }

  if (reservation.status === "cancelled") {
    res.status(400);
    throw new Error("Reservation is already cancelled");
  }

  reservation.status = "cancelled";
  await reservation.save();

  res.status(200).json({ success: true, message: "Reservation cancelled", reservation });
});

// @route GET /api/reservations
// @route GET /api/reservations?date=YYYY-MM-DD
// @access Private/Admin
const getAllReservations = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.date) {
    filter.date = req.query.date;
  }
  if (req.query.status) {
    filter.status = req.query.status;
  }

  const reservations = await Reservation.find(filter)
    .populate("user", "name email")
    .populate("table", "tableNumber capacity")
    .sort({ date: 1, timeSlot: 1 });

  res.status(200).json({ success: true, count: reservations.length, reservations });
});

// @route PUT /api/reservations/:id
// @access Private/Admin
// Allows admin to change date/timeSlot/table/numberOfGuests/status,
// re-validating conflicts and capacity for any changed fields.
const updateReservation = asyncHandler(async (req, res) => {
  const reservation = await Reservation.findById(req.params.id);
  if (!reservation) {
    res.status(404);
    throw new Error("Reservation not found");
  }

  const { date, timeSlot, numberOfGuests, tableId, status } = req.body;

  const nextDate = date || reservation.date;
  const nextTimeSlot = timeSlot || reservation.timeSlot;
  const nextGuests = numberOfGuests || reservation.numberOfGuests;
  const nextTableId = tableId || reservation.table.toString();

  if (timeSlot && !Reservation.TIME_SLOTS.includes(timeSlot)) {
    res.status(400);
    throw new Error(`timeSlot must be one of: ${Reservation.TIME_SLOTS.join(", ")}`);
  }

  // Re-validate capacity + conflicts if any booking-relevant field changed
  const bookingFieldsChanged =
    date || timeSlot || numberOfGuests || tableId;

  if (bookingFieldsChanged) {
    const table = await Table.findById(nextTableId);
    if (!table || !table.isActive) {
      res.status(404);
      throw new Error("Table not found");
    }
    if (table.capacity < nextGuests) {
      res.status(400);
      throw new Error(`Table ${table.tableNumber} only seats ${table.capacity} guests`);
    }

    const conflict = await Reservation.findOne({
      _id: { $ne: reservation._id },
      table: nextTableId,
      date: nextDate,
      timeSlot: nextTimeSlot,
      status: "confirmed",
    });
    if (conflict) {
      res.status(409);
      throw new Error("Another reservation already occupies that table/date/time slot");
    }

    reservation.table = nextTableId;
    reservation.date = nextDate;
    reservation.timeSlot = nextTimeSlot;
    reservation.numberOfGuests = nextGuests;
  }

  if (status) {
    if (!["confirmed", "cancelled"].includes(status)) {
      res.status(400);
      throw new Error("status must be 'confirmed' or 'cancelled'");
    }
    reservation.status = status;
  }

  await reservation.save();
  const populated = await reservation.populate([
    { path: "user", select: "name email" },
    { path: "table", select: "tableNumber capacity" },
  ]);

  res.status(200).json({ success: true, reservation: populated });
});

// @route DELETE /api/reservations/admin/:id
// @access Private/Admin
const adminCancelReservation = asyncHandler(async (req, res) => {
  const reservation = await Reservation.findById(req.params.id);
  if (!reservation) {
    res.status(404);
    throw new Error("Reservation not found");
  }

  reservation.status = "cancelled";
  await reservation.save();

  res.status(200).json({ success: true, message: "Reservation cancelled by admin", reservation });
});

// @route GET /api/reservations/available-slots?date=&numberOfGuests=
// @access Private
// Helper endpoint so the frontend can show which tables are free
const getAvailableTables = asyncHandler(async (req, res) => {
  const { date, timeSlot, numberOfGuests } = req.query;

  if (!date || !timeSlot || !numberOfGuests) {
    res.status(400);
    throw new Error("date, timeSlot, and numberOfGuests query params are required");
  }

  const tables = await Table.find({
    isActive: true,
    capacity: { $gte: Number(numberOfGuests) },
  }).sort({ capacity: 1 });

  const conflicting = await Reservation.find({
    date,
    timeSlot,
    status: "confirmed",
  }).select("table");

  const bookedIds = new Set(conflicting.map((r) => r.table.toString()));
  const availableTables = tables.filter((t) => !bookedIds.has(t._id.toString()));

  res.status(200).json({ success: true, availableTables });
});

module.exports = {
  createReservation,
  getMyReservations,
  cancelMyReservation,
  getAllReservations,
  updateReservation,
  adminCancelReservation,
  getAvailableTables,
};
