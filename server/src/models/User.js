import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true },
    displayName: { type: String, required: true, trim: true },
    avatarUrl: { type: String, default: "" },
    neighborhood: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Neighborhood",
      required: true,
    },
    role: {
      type: String,
      enum: ["resident", "moderator", "admin"],
      default: "resident",
    },
  },
  { timestamps: true }
);

// Instance method: check a plaintext password against the stored hash.
userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

// Static helper: hash a plaintext password before creating a user.
userSchema.statics.hashPassword = function (plain) {
  return bcrypt.hash(plain, 10);
};

// Never leak the hash when serializing to JSON.
userSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret.passwordHash;
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model("User", userSchema);
