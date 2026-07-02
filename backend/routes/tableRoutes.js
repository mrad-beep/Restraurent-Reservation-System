const express = require("express");
const {
  getTables,
  createTable,
  updateTable,
  deleteTable,
} = require("../controllers/tableController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.get("/", protect, getTables);
router.post("/", protect, authorize("admin"), createTable);
router.put("/:id", protect, authorize("admin"), updateTable);
router.delete("/:id", protect, authorize("admin"), deleteTable);

module.exports = router;
