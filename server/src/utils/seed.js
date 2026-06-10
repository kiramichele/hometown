import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import Neighborhood from "../models/Neighborhood.js";
import User from "../models/User.js";
import Post from "../models/Post.js";

async function seed() {
  await connectDB(process.env.MONGODB_URI);

  // Wipe so the seed is repeatable during development.
  await Promise.all([
    Neighborhood.deleteMany({}),
    User.deleteMany({}),
    Post.deleteMany({}),
  ]);

  const hood = await Neighborhood.create({
    name: "Burgaw",
    description: "A neighborhood platform for Burgaw, NC.",
  });

  const passwordHash = await User.hashPassword("password123");

  const [admin, mod, jane] = await User.create([
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

  // A few starter posts across categories so the feed looks alive on first run.
  await Post.create([
    {
      neighborhood: hood._id,
      author: jane._id,
      category: "general",
      body: "Hi neighbors! So glad we finally have a spot to keep in touch. 👋",
      reactions: [
        { user: admin._id, type: "like" },
        { user: mod._id, type: "love" },
      ],
      comments: [
        { author: admin._id, body: "Welcome, Jane! This is great." },
      ],
    },
    {
      neighborhood: hood._id,
      author: mod._id,
      category: "recommendation",
      body: "Looking for a good plumber near Wright St — anyone have someone they trust?",
      comments: [
        { author: jane._id, body: "We used Coastal Plumbing last month, very fair." },
      ],
    },
    {
      neighborhood: hood._id,
      author: admin._id,
      category: "alert",
      body: "Heads up: water main work on Cowan St tomorrow 8am–noon. Expect low pressure.",
      reactions: [{ user: jane._id, type: "like" }],
    },
    {
      neighborhood: hood._id,
      author: jane._id,
      category: "forsale",
      body: "Free moving boxes — about 15 of them, various sizes. Porch pickup on Bridgers St.",
    },
  ]);

  console.log(
    "✓ Seeded neighborhood + 3 users (password: password123) + 4 sample posts"
  );
  await mongoose.disconnect();
}

seed();
