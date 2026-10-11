// Initials grow with the avatar (full class names so Tailwind keeps them).
const TEXT_SIZE = { "w-16": "text-xl", "w-28": "text-4xl" };

/** Profile photo, or the user's initials when there's no photo. */
export default function Avatar({ name, image, size = "w-10" }) {
  const initials =
    (name || "?")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "?";

  return (
    <div className={`avatar ${image ? "" : "avatar-placeholder"}`}>
      <div className={`${size} rounded-full bg-neutral text-neutral-content ring-2 ring-white/70`}>
        {image ? (
          // Served from MongoDB by /api/avatar/[id]; plain <img> since it's a tiny same-origin image.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt={`${name}'s profile photo`} />
        ) : (
          <span className={`font-bold ${TEXT_SIZE[size] ?? ""}`}>{initials}</span>
        )}
      </div>
    </div>
  );
}
