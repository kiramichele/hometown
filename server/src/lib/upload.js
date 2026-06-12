import { v2 as cloudinary } from "cloudinary";

// The Cloudinary SDK auto-configures from the CLOUDINARY_URL env var
// (cloudinary://<key>:<secret>@<cloud-name>). We do server-side *signed*
// uploads: the browser sends the file to our API, and we upload it to
// Cloudinary with the secret — so the secret never reaches the client.
//
// This is the shared upload seam for the whole app. Phase 4 uses it for
// marketplace photos; later phases (avatars, etc.) can reuse uploadImage().

export function isUploadConfigured() {
  return Boolean(process.env.CLOUDINARY_URL);
}

// Upload a single image buffer and resolve with its hosted URL.
export function uploadImage(buffer, { folder = "hometown" } = {}) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image" },
      (err, result) => {
        if (err) return reject(err);
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    stream.end(buffer);
  });
}
