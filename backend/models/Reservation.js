const mongoose = require("mongoose");

// Fixed set of time slots the restaurant operates.
// Kept as an enum to make overlap-checking simple and predictable.
const TIME_SLOTS = [
  "12:00-13:30",
  "13:30-15:00",
  "18:00-19:30",
  "19:30-21:00",
  "21:00-22:30",
];

const reservationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    table: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Table",
      required: true,
    },
    date: {
      type: String, // stored as "YYYY-MM-DD" for simple, unambiguous comparisons
      required: [true, "Reservation date is required"],
      match: [/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"],
    },
    timeSlot: {
      type: String,
      enum: TIME_SLOTS,
      required: [true, "Time slot is required"],
    },
    numberOfGuests: {
      type: Number,
      required: [true, "Number of guests is required"],
      min: [1, "There must be at least 1 guest"],
    },
    status: {
      type: String,
      enum: ["confirmed", "cancelled"],
      default: "confirmed",
    },
  },
  { timestamps: true }
);

// Speeds up availability lookups and helps enforce "no double booking"
// at the query level (final safety check is still done in the controller
// inside the create-reservation logic).
reservationSchema.index({ table: 1, date: 1, timeSlot: 1, status: 1 });

reservationSchema.statics.TIME_SLOTS = TIME_SLOTS;

module.exports = mongoose.model("Reservation", reservationSchema);
