require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const { errorHandler, notFound } = require("./utils/errorHandler");

const authRoutes = require("./routes/authRoutes");
const tableRoutes = require("./routes/tableRoutes");
const reservationRoutes = require("./routes/reservationRoutes");

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "*",
  })
);
app.use(express.json());

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({ success: true, message: "API is running" });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/tables", tableRoutes);
app.use("/api/reservations", reservationRoutes);

// 404 + centralized error handling (must be last)
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

server.on("listening", () => {
  console.log("Listening event fired");
});

server.on("close", () => {
  console.log("Server closed");
});

server.on("error", (err) => {
  console.error("Listen error:", err);
});

process.on("exit", (code) => {
  console.log("Process exited:", code);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});

process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
});