import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import Neighborhood from "../models/Neighborhood.js";
import User from "../models/User.js";

async function seed() {
  await connectDB(process.env.MONGODB_URI);

  // Wipe so the seed is repeatable during development.
  await Promise.all([Neighborhood.deleteMany({}), User.deleteMany({})]);

  const hood = await Neighborhood.create({
    name: "Burgaw",
    description: "A neighborhood platform for Burgaw, NC.",
  });

  const passwordHash = await User.hashPassword("password123");

  await User.create([
    {
      email: "admin@burgaw.test",
      passwordHash,
      displayName: "Admin User",
      neighborhood: hood._id,
      role: "admin",
    },
    {
      email: "mod@burgaw.test",
      passwordHash,
      displayName: "Mod User",
      neighborhood: hood._id,
      role: "moderator",
    },
    {
      email: "resident@burgaw.test",
      passwordHash,
      displayName: "Jane Resident",
      neighborhood: hood._id,
      role: "resident",
    },
  ]);

  console.log("✓ Seeded neighborhood + 3 users (password for all: password123)");
  await mongoose.disconnect();
}

seed();
