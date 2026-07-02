/**
 * Seeds the database with:
 * - A fixed set of restaurant tables
 * - One admin user (email/password below - change after first login)
 *
 * Run with: npm run seed
 */
require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const Table = require("./models/Table");
const User = require("./models/User");

const tables = [
  { tableNumber: 1, capacity: 2 },
  { tableNumber: 2, capacity: 2 },
  { tableNumber: 3, capacity: 4 },
  { tableNumber: 4, capacity: 4 },
  { tableNumber: 5, capacity: 6 },
  { tableNumber: 6, capacity: 8 },
];

const seed = async () => {
  await connectDB();

  console.log("Clearing existing tables...");
  await Table.deleteMany({});
  await Table.insertMany(tables);
  console.log(`Seeded ${tables.length} tables.`);

  const adminEmail = "admin@restaurant.com";
  const existingAdmin = await User.findOne({ email: adminEmail });

  if (!existingAdmin) {
    await User.create({
      name: "Admin",
      email: adminEmail,
      password: "admin123", // CHANGE THIS after first login
      role: "admin",
    });
    console.log(`Admin user created -> email: ${adminEmail} / password: admin123`);
  } else {
    console.log("Admin user already exists, skipping.");
  }

  console.log("Seeding complete.");
  mongoose.connection.close();
};

seed().catch((err) => {
  console.error("Seeding failed:", err);
  mongoose.connection.close();
  process.exit(1);
});
