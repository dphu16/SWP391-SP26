import React from "react";

const AVATAR_COLORS = [
  "bg-primary/15 text-primary",
  "bg-blue-100 text-blue-600",
  "bg-purple-100 text-purple-600",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-600",
];

interface AvatarProps {
  name: string;
  url?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

const SIZE_MAP: Record<string, string> = {
  sm: "w-8 h-8 text-xs",
  md: "w-9 h-9 text-xs",
  lg: "w-12 h-12 text-sm",
  xl: "w-20 h-20 text-2xl",
};

const RING_MAP: Record<string, string> = {
  sm: "ring-2 ring-white",
  md: "ring-2 ring-white",
  lg: "ring-2 ring-white",
  xl: "ring-4 ring-white",
};

const Avatar: React.FC<AvatarProps> = ({ name, url, size = "md" }) => {
  const initials =
    name
      ?.split(" ")
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() ?? "??";

  const colorIdx = (name?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length;
  const sizeClass = SIZE_MAP[size];
  const ringClass = RING_MAP[size];

  if (url) {
    return (
      <img
        src={url}
        alt={name}
        className={`${sizeClass} rounded-full object-cover ${ringClass} flex-shrink-0`}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} rounded-full flex items-center justify-center font-bold flex-shrink-0 ${AVATAR_COLORS[colorIdx]}`}
    >
      {initials}
    </div>
  );
};

export default Avatar;
