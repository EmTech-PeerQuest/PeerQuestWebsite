import React from "react";
import type { User } from "@/lib/types";

interface AvatarProps {
  user: User;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: "w-6 h-6",
  md: "w-8 h-8",
  lg: "w-12 h-12",
};

export const Avatar: React.FC<AvatarProps> = ({ user, size = "md", className = "" }) => {
  let avatarUrl = user.avatar_url;
  if (avatarUrl && typeof avatarUrl === "string") {
    // ui-avatars.com and most URLs are already absolute, but keep this for legacy support
    if (!avatarUrl.startsWith("http")) {
      avatarUrl = process.env.NEXT_PUBLIC_MEDIA_URL
        ? process.env.NEXT_PUBLIC_MEDIA_URL.replace(/\/$/, "") + (avatarUrl.startsWith("/") ? avatarUrl : "/" + avatarUrl)
        : avatarUrl;
    }
  } else {
    avatarUrl = undefined;
  }
  // Debug log
  console.log("[Avatar] user:", user, "avatarUrl:", avatarUrl);
  return (
    <div className={`relative rounded-full bg-gray-400 text-white flex items-center justify-center font-bold overflow-hidden ${sizeMap[size]} ${className}`}>
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={user.username || "?"}
          className="w-full h-full rounded-full object-cover"
          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
      ) : (
        <span>{user.username ? user.username[0].toUpperCase() : "?"}</span>
      )}
    </div>
  );
};

export default Avatar;
