import mongoose from "mongoose";
import dns from "dns";

// Atlas uses mongodb+srv://, which needs a DNS SRV lookup. On some Windows
// setups Node's resolver gets ECONNREFUSED for SRV queries even though the
// system DNS works, so we prepend public resolvers as a fallback.
dns.setServers([...new Set(["8.8.8.8", "1.1.1.1", ...dns.getServers()])]);

export async function connectDB(uri) {
  try {
    await mongoose.connect(uri);
    console.log("✓ MongoDB connected");
  } catch (err) {
    console.error("✗ MongoDB connection failed:", err.message);
    process.exit(1);
  }
}
