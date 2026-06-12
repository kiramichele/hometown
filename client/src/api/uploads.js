import { tokenStore } from "./client.js";

// Upload image File objects to our API (which forwards them to Cloudinary) and
// resolve with the hosted URLs. We can't reuse the JSON api client here because
// this is multipart/form-data — the browser must set the boundary itself, so we
// deliberately omit Content-Type.
export async function uploadImages(files) {
  const form = new FormData();
  for (const file of files) form.append("images", file);

  const res = await fetch("/api/uploads", {
    method: "POST",
    headers: { Authorization: `Bearer ${tokenStore.get()}` },
    body: form,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Upload failed (${res.status})`);
  return data.urls;
}
