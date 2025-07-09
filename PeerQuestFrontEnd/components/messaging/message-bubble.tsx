"use client"

import type React from "react"
import { motion } from "framer-motion"
import type { Message, User, Attachment, MessageStatus } from "@/lib/types"
import { Check, CheckCheck, AlertCircle, File, FileText, ImageIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import type { JSX } from "react/jsx-runtime" // Import JSX to fix the undeclared variable error

export interface MessageBubbleProps {
  message: Message
  isOwnMessage: boolean
  showAvatar?: boolean
  status?: MessageStatus
  onAttachmentClick?: (attachment: Attachment) => void
  renderAvatar?: (user: User, size?: "sm" | "md" | "lg") => JSX.Element
  onlineUsers?: Map<string, "online" | "idle" | "offline">
}

const getStatusIcon = (status: MessageStatus) => {
  const icons: Record<MessageStatus, JSX.Element> = {
    sending: <Check className="w-3 h-3" style={{ color: "var(--tavern-purple)" }} />,
    sent: <Check className="w-3 h-3" style={{ color: "var(--tavern-gold)" }} />,
    delivered: <CheckCheck className="w-3 h-3" style={{ color: "var(--tavern-gold)" }} />,
    read: <CheckCheck className="w-3 h-3" style={{ color: "var(--tavern-purple)" }} />,
    failed: <AlertCircle className="w-3 h-3 text-red-500" />,
  }
  return icons[status] ?? null
}

const getFileIcon = (a: Attachment) =>
  a.is_image ? (
    <ImageIcon className="w-4 h-4" style={{ color: "var(--tavern-purple)" }} />
  ) : a.content_type.includes("pdf") ? (
    <FileText className="w-4 h-4 text-red-500" />
  ) : (
    <File className="w-4 h-4" style={{ color: "var(--tavern-gold)" }} />
  )

const defaultAvatar = (user: User, size = "md") => {
  const avatarClass = size === "sm" ? "avatar avatar-sm" : size === "lg" ? "avatar avatar-lg" : "avatar"

  return <div className={avatarClass}>{user.username.charAt(0).toUpperCase()}</div>
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwnMessage,
  showAvatar = true,
  status,
  onAttachmentClick,
  renderAvatar,
}) => {
  const safeAttachments =
    message.attachments?.filter(
      (a): a is Attachment => a && typeof a.content_type === "string" && typeof a.file_url === "string",
    ) || []

  const imageAttachments = safeAttachments.filter((a) => a.is_image)
  const otherAttachments = safeAttachments.filter((a) => !a.is_image)
  const Avatar = renderAvatar ?? defaultAvatar

  const time = message.timestamp
    ? new Date(message.timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : ""

  const shouldShowBorder = !!message.content || imageAttachments.length > 0

  return (
    <div
      className={cn("flex mb-4 group", isOwnMessage ? "justify-end" : "justify-start")}
    >
      {!isOwnMessage && showAvatar && (
        <div className="mr-3 flex-shrink-0 self-end">
          {message.sender ? Avatar(message.sender, "md") : defaultAvatar({ id: "unknown", username: "Unknown" })}
        </div>
      )}

      <div
        className={cn(
          "relative max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-lg transition-all group-hover:shadow-xl card",
          isOwnMessage ? "rounded-br-md" : "rounded-bl-md",
        )}
        style={{
          backgroundColor: isOwnMessage ? "var(--tavern-gold)" : "white",
          color: isOwnMessage ? "var(--tavern-dark)" : "var(--tavern-dark)",
          borderColor: isOwnMessage ? "var(--tavern-purple)" : "var(--tavern-gold)",
        }}
      >
        {/* Sender name for group chats */}
        {!isOwnMessage && message.sender && (
          <p className="text-xs font-medium mb-1" style={{ color: "var(--tavern-purple)" }}>
            {message.sender.username}
          </p>
        )}

        {/* Text content */}
        {message.content && message.message_type === "text" && (
          <p className="break-words whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
        )}

        {/* Image attachments */}
        {imageAttachments.length > 0 && (
          <div
            className={cn("mt-2 space-y-2", message.content && "pt-2 border-t border-opacity-20")}
            style={{ borderColor: "var(--tavern-purple)" }}
          >
            {imageAttachments.map((a) => {
              const getAbsoluteUrl = (url?: string) => {
                if (!url) return ""
                return url.startsWith("http") ? url : `http://localhost:8000${url.startsWith("/") ? "" : "/"}${url}`
              }

              const src = getAbsoluteUrl(a.thumbnail_url || a.file_url)
              if (!src) return null

              return (
                <div
                  key={a.id}
                  className="overflow-hidden rounded-lg"
                >
                  <img
                    src={src || "/placeholder.svg"}
                    alt={a.filename || "image"}
                    className="rounded-lg max-w-xs max-h-64 object-cover cursor-pointer"
                    onClick={() => onAttachmentClick?.(a)}
                  />
                </div>
              )
            })}
          </div>
        )}

        {/* File attachments */}
        {otherAttachments.length > 0 && (
          <div
            className={cn("mt-2 space-y-1", shouldShowBorder && "pt-2 border-t border-opacity-20")}
            style={{ borderColor: "var(--tavern-purple)" }}
          >
            {otherAttachments.map((a) => (
              <div
                key={a.id}
                onClick={() => onAttachmentClick?.(a)}
                className="flex items-center space-x-2 cursor-pointer p-2 rounded-lg transition-all hover:bg-opacity-20"
                style={{ backgroundColor: "var(--tavern-cream)" }}
              >
                {getFileIcon(a)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{a.filename}</p>
                  {a.file_size_human && <p className="text-xs opacity-75">{a.file_size_human}</p>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Time + status */}
        {time && (
          <div
            className={cn(
              "flex items-center gap-2 text-xs mt-2 opacity-70",
              isOwnMessage ? "justify-end" : "justify-start",
            )}
          >
            <span>{time}</span>
            {isOwnMessage && status && getStatusIcon(status)}
          </div>
        )}
      </div>

      {isOwnMessage && showAvatar && (
        <div className="ml-3 flex-shrink-0 self-end">
          {message.sender ? Avatar(message.sender, "md") : defaultAvatar({ id: "unknown", username: "Unknown" })}
        </div>
      )}
    </div>
  )
}

export default MessageBubble
