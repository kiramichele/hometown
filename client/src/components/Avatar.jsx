// Circular avatar. Uses the image if a user has one, otherwise falls back to
// their initials on a soft sage background.
export default function Avatar({ user, size = 40 }) {
  const initials = (user?.displayName || "?")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const style = { width: size, height: size, fontSize: size * 0.4 };

  if (user?.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt={user.displayName}
        style={style}
        className="rounded-full object-cover"
      />
    );
  }

  return (
    <div
      style={style}
      className="flex shrink-0 items-center justify-center rounded-full bg-sage-100 font-bold text-sage-700"
    >
      {initials}
    </div>
  );
}
