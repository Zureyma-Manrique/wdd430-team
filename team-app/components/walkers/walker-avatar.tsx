import { initials } from "@/lib/format";

interface WalkerAvatarProps {
  name: string;
  size?: "md" | "lg";
}

/**
 * Initials avatar. Walker photos will use `next/image` once uploads and `images.remotePatterns`
 * are configured (P2, item 16). Until then, no user-supplied URL is rendered.
 */
export function WalkerAvatar({ name, size = "md" }: WalkerAvatarProps) {
  const sizeClasses = size === "lg" ? "size-20 text-2xl" : "size-12 text-base";
  return (
    <span
      aria-hidden="true"
      className={`grid shrink-0 place-items-center rounded-full bg-primary-soft font-bold text-primary ${sizeClasses}`}
    >
      {initials(name)}
    </span>
  );
}
