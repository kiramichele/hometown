import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import Neighborhood from "../models/Neighborhood.js";
import User from "../models/User.js";
import Post from "../models/Post.js";
import Event from "../models/Event.js";

// Build a Date relative to now: N days out, at a given hour (local time).
function daysFromNow(days, hour = 18) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, 0, 0, 0);
  return d;
}

async function seed() {
  await connectDB(process.env.MONGODB_URI);

  // Wipe so the seed is repeatable during development.
  await Promise.all([
    Neighborhood.deleteMany({}),
    User.deleteMany({}),
    Post.deleteMany({}),
    Event.deleteMany({}),
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

  // A spread of events so the calendar has something to show this month.
  await Event.create([
    {
      neighborhood: hood._id,
      host: admin._id,
      title: "Neighborhood Cookout",
      description:
        "Bring a dish to share! Burgers and dogs provided. All ages welcome.",
      location: "Cowan St Park pavilion",
      startTime: daysFromNow(3, 17),
      endTime: daysFromNow(3, 20),
      rsvps: [
        { user: jane._id, status: "going" },
        { user: mod._id, status: "maybe" },
      ],
    },
    {
      neighborhood: hood._id,
      host: mod._id,
      title: "Community Garden Workday",
      description: "Help us prep the beds for spring. Tools provided, gloves too.",
      location: "Community garden, Wright St",
      startTime: daysFromNow(6, 9),
      endTime: daysFromNow(6, 12),
      rsvps: [{ user: admin._id, status: "going" }],
    },
    {
      neighborhood: hood._id,
      host: jane._id,
      title: "Book Club: 'The Overstory'",
      description: "Monthly book club. Newcomers always welcome — coffee on us.",
      location: "Jane's place (DM for address)",
      startTime: daysFromNow(12, 19),
    },
    {
      neighborhood: hood._id,
      host: admin._id,
      title: "HOA Monthly Meeting",
      description: "Agenda: budget review, the new playground, and open floor.",
      location: "Town hall, Room B",
      startTime: daysFromNow(-5, 18), // a past event, for history
    },
  ]);

  console.log(
    "✓ Seeded neighborhood + 3 users (password: password123) + 4 posts + 4 events"
  );
  await mongoose.disconnect();
}

seed();
