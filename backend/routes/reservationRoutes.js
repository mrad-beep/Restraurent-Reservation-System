const express = require("express");
const {
  createReservation,
  getMyReservations,
  cancelMyReservation,
  getAllReservations,
  updateReservation,
  adminCancelReservation,
  getAvailableTables,
} = require("../controllers/reservationController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

// Customer routes
router.post("/", protect, authorize("customer"), createReservation);
router.get("/my", protect, authorize("customer"), getMyReservations);
router.delete("/:id", protect, authorize("customer"), cancelMyReservation);
router.get("/available-slots", protect, getAvailableTables);

// Admin routes
router.get("/", protect, authorize("admin"), getAllReservations);
router.put("/:id", protect, authorize("admin"), updateReservation);
router.delete("/admin/:id", protect, authorize("admin"), adminCancelReservation);

module.exports = router;
