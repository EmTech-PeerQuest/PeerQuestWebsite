"use client";

import type React from "react";
import type { Message, User, Attachment, MessageStatus } from "@/lib/types";
import {
  File,
  FileText,
  ImageIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { JSX } from "react/jsx-runtime";

export interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  showAvatar?: boolean;
  status?: MessageStatus;
  onAttachmentClick?: (attachment: Attachment) => void;
  renderAvatar?: (user: User, size?: "sm" | "md" | "lg") => JSX.Element;
  onlineUsers?: Map<string, "online" | "idle" | "offline">;
}

// Removed getStatusIcon and all check icon logic. Only text will be shown for status.

const getFileIcon = (a: Attachment) =>
  a.is_image ? (
    <ImageIcon className="w-4 h-4" style={{ color: "var(--tavern-purple)" }} />
  ) : a.content_type.includes("pdf") ? (
    <FileText className="w-4 h-4 text-red-500" />
  ) : (
    <File className="w-4 h-4" style={{ color: "var(--tavern-gold)" }} />
  );

const defaultAvatar = (
  user: User,
  size = "md",
  onlineUsers?: Map<string, "online" | "idle" | "offline">
) => {
  const presence = onlineUsers?.get(user.id) || "offline";
  const dotLabel = presence.charAt(0).toUpperCase() + presence.slice(1);

  return (
    <div
      className={`relative flex items-center justify-center rounded-full text-white bg-gray-500 ${
        size === "sm" ? "w-6 h-6" : size === "lg" ? "w-12 h-12" : "w-8 h-8"
      }`}
    >
      <span className="font-bold">{user.username?.charAt(0).toUpperCase() || "?"}</span>
      <span
        className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white z-10 ${
          presence === "online"
            ? "bg-green-500"
            : presence === "idle"
            ? "bg-amber-400"
            : "bg-gray-300"
        }`}
        title={dotLabel}
      />
    </div>
  );
};



// Fallback user for null sender cases
const fallbackUser: User = {
  id: "unknown",
  username: "Unknown",
  avatar: undefined,
  email: "unknown@example.com",
};

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwnMessage,
  showAvatar = true,
  status,
  onAttachmentClick,
  renderAvatar,
  onlineUsers,
}) => {
  const safeAttachments =
    message.attachments?.filter(
      (a): a is Attachment =>
        a && typeof a.content_type === "string" && typeof a.file_url === "string"
    ) || [];

  const imageAttachments = safeAttachments.filter((a) => a.is_image);
  const otherAttachments = safeAttachments.filter((a) => !a.is_image);

  const Avatar = renderAvatar
  ? (user: User, size?: "sm" | "md" | "lg") => renderAvatar(user, size)
  : (user: User, size?: "sm" | "md" | "lg") => defaultAvatar(user, size, onlineUsers);


  const time = message.timestamp
    ? new Date(message.timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  const shouldShowBorder = !!message.content || imageAttachments.length > 0;

  const sender = message.sender || fallbackUser;

  return (
    <div className={cn("flex mb-4 group", isOwnMessage ? "justify-end" : "justify-start")}>
      {!isOwnMessage && showAvatar && (
        <div className="mr-3 flex-shrink-0 self-end">{Avatar(sender, "md")}</div>
      )}

      <div
        className={cn(
          "relative max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-lg transition-all group-hover:shadow-xl",
          isOwnMessage ? "rounded-br-md" : "rounded-bl-md"
        )}
        style={{
          backgroundColor: isOwnMessage ? "var(--tavern-gold)" : "white",
          color: "var(--tavern-dark)",
          border: `2px solid ${isOwnMessage ? "var(--tavern-purple)" : "var(--tavern-gold)"}`,
        }}
      >
        {!isOwnMessage && sender && (
          <p className="text-xs font-medium mb-1" style={{ color: "var(--tavern-purple)" }}>
            {sender.username}
          </p>
        )}

        {message.content && message.message_type === "text" && (
          <p className="break-words whitespace-pre-wrap text-sm leading-relaxed">
            {message.content}
          </p>
        )}

        {imageAttachments.length > 0 && (
          <div
            className={cn("mt-2 space-y-2", message.content && "pt-2 border-t border-opacity-30")}
            style={{ borderColor: "var(--tavern-purple)" }}
          >
            {imageAttachments.map((a) => {
              const getAbsoluteUrl = (url?: string) => {
                if (!url) return "";
                return url.startsWith("http")
                  ? url
                  : `http://localhost:8000${url.startsWith("/") ? "" : "/"}${url}`;
              };

              const src = getAbsoluteUrl(a.thumbnail_url || a.file_url);
              if (!src) return null;

              return (
                <div key={a.id} className="overflow-hidden rounded-lg">
                  <img
                    src={src}
                    alt={a.filename || "image"}
                    className="rounded-lg max-w-xs max-h-64 object-cover cursor-pointer"
                    onClick={() => onAttachmentClick?.(a)}
                  />
                </div>
              );
            })}
          </div>
        )}

        {otherAttachments.length > 0 && (
          <div
            className={cn("mt-2 space-y-1", shouldShowBorder && "pt-2 border-t border-opacity-30")}
            style={{ borderColor: "var(--tavern-purple)" }}
          >
            {otherAttachments.map((a) => (
              <div
                key={a.id}
                onClick={() => onAttachmentClick?.(a)}
                className="flex items-center space-x-2 cursor-pointer p-2 rounded-lg transition-all hover:bg-opacity-10"
                style={{ backgroundColor: "var(--tavern-cream)" }}
              >
                {getFileIcon(a)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{a.filename}</p>
                  {a.file_size_human && (
                    <p className="text-xs opacity-75">{a.file_size_human}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {time && (
          <div
            className={cn(
              "flex items-center gap-2 text-xs mt-2 opacity-75",
              isOwnMessage ? "justify-end" : "justify-start"
            )}
          >
            <span>{time}</span>
            {isOwnMessage && message.status && (
              <span style={{ marginLeft: 8, fontWeight: 600, color: message.status === "read" ? "var(--tavern-purple)" : "var(--tavern-gold)" }}>
                {message.status === "read" ? "Read" : "Sent"}
              </span>
            )}
          </div>
        )}
      </div>

      {isOwnMessage && showAvatar && (
        <div className="ml-3 flex-shrink-0 self-end">{Avatar(sender, "md")}</div>
      )}
    </div>
  );
};

export default MessageBubble;
