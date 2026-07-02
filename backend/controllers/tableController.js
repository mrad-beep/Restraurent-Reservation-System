const Table = require("../models/Table");
const { asyncHandler } = require("../utils/errorHandler");

// @route GET /api/tables
// @access Private (customer + admin) - customers need this to pick a table/see capacity
const getTables = asyncHandler(async (req, res) => {
  const tables = await Table.find({ isActive: true }).sort({ tableNumber: 1 });
  res.status(200).json({ success: true, count: tables.length, tables });
});

// @route POST /api/tables
// @access Private/Admin
const createTable = asyncHandler(async (req, res) => {
  const { tableNumber, capacity } = req.body;

  if (!tableNumber || !capacity) {
    res.status(400);
    throw new Error("tableNumber and capacity are required");
  }

  const table = await Table.create({ tableNumber, capacity });
  res.status(201).json({ success: true, table });
});

// @route PUT /api/tables/:id
// @access Private/Admin
const updateTable = asyncHandler(async (req, res) => {
  const table = await Table.findById(req.params.id);
  if (!table) {
    res.status(404);
    throw new Error("Table not found");
  }

  const { capacity, isActive } = req.body;
  if (capacity !== undefined) table.capacity = capacity;
  if (isActive !== undefined) table.isActive = isActive;

  await table.save();
  res.status(200).json({ success: true, table });
});

// @route DELETE /api/tables/:id
// @access Private/Admin
const deleteTable = asyncHandler(async (req, res) => {
  const table = await Table.findById(req.params.id);
  if (!table) {
    res.status(404);
    throw new Error("Table not found");
  }

  // Soft delete to preserve reservation history/integrity
  table.isActive = false;
  await table.save();

  res.status(200).json({ success: true, message: "Table deactivated" });
});

module.exports = { getTables, createTable, updateTable, deleteTable };
