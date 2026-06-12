import User from "../models/User.js";
import Notification from "../models/Notification.js";
import { emitToUser } from "../realtime.js";
import { sendEmail } from "./email.js";

// The single entry point for creating a notification. It:
//   1. persists the Notification (skipping self-notifications),
//   2. pushes a live "notification:new" event to the recipient's socket room
//      (the in-app unread badge), and
//   3. fires a best-effort email via Resend.
//
// Side-effect by design: callers should NOT await this in a way that lets a
// failure break the original action — treat it as fire-and-forget.
export async function notify({
  recipient,
  actor,
  neighborhood,
  type,
  text,
  link = "/",
}) {
  if (String(recipient) === String(actor)) return null; // never notify yourself

  const notif = await Notification.create({
    recipient,
    actor,
    neighborhood,
    type,
    text,
    link,
  });
  const populated = await notif.populate("actor", "displayName avatarUrl role");

  // Live in-app badge (no-op if the recipient has no open tab).
  emitToUser(recipient, "notification:new", populated.toJSON());

  // Email is best-effort and must never block or break the caller.
  sendNotificationEmail(recipient, text, link).catch((err) =>
    console.error("Notification email failed:", err.message)
  );

  return populated;
}

async function sendNotificationEmail(recipientId, text, link) {
  const user = await User.findById(recipientId).select("email");
  if (!user?.email) return;
  const base = process.env.CLIENT_ORIGIN || "http://localhost:5173";
  const url = `${base}${link}`;

  await sendEmail({
    to: user.email,
    subject: text,
    html: `
      <div style="font-family: 'Segoe UI', system-ui, sans-serif; background:#faf8f5; padding:24px;">
        <div style="max-width:480px; margin:0 auto; background:#ffffff; border-radius:16px; padding:28px;">
          <div style="font-size:22px; font-weight:800; color:#276a4d; margin-bottom:12px;">Hometown</div>
          <p style="font-size:16px; color:#2a2a28; line-height:1.5; margin:0 0 20px;">${text}</p>
          <a href="${url}" style="display:inline-block; background:#2f7d5b; color:#ffffff; text-decoration:none; font-weight:700; padding:10px 20px; border-radius:999px;">View in Hometown</a>
          <p style="color:#9a968f; font-size:12px; margin-top:24px;">Your Burgaw neighborhood</p>
        </div>
      </div>`,
  });
}
