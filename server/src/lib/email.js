import { Resend } from "resend";

// Transactional email via Resend, gated on RESEND_API_KEY. If the key isn't
// set, every send is a quiet no-op so the rest of the app works unchanged.

let client = null;

export function isEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY);
}

function resend() {
  if (!client) client = new Resend(process.env.RESEND_API_KEY);
  return client;
}

export async function sendEmail({ to, subject, html }) {
  if (!isEmailConfigured()) return; // no-op when unconfigured
  const from = process.env.MAIL_FROM || "Hometown <onboarding@resend.dev>";
  // Resend returns { data, error } rather than throwing on API errors, so we
  // surface the error ourselves for the caller's catch/logging.
  const { error } = await resend().emails.send({ from, to, subject, html });
  if (error) throw new Error(error.message || "Resend send failed");
}
