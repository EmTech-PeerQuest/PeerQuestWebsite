"use client"

import React from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import {
  Message,
  User,
  Attachment,
  MessageStatus,
} from "@/lib/types"
import {
  Check,
  CheckCheck,
  AlertCircle,
  File,
  FileText,
  Image as ImageIcon,
} from "lucide-react"

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
    sending: <Check className="w-4 h-4 text-gray-300" />,
    sent: <Check className="w-4 h-4 text-gray-400" />,
    delivered: <CheckCheck className="w-4 h-4 text-gray-400" />,
    read: <CheckCheck className="w-4 h-4 text-blue-500" />,
    failed: <AlertCircle className="w-4 h-4 text-red-500" />,
  }
  return icons[status] ?? null
}

const getFileIcon = (a: Attachment) =>
  a.is_image ? (
    <ImageIcon className="w-5 h-5 text-gray-500" />
  ) : a.content_type.includes("pdf") ? (
    <FileText className="w-5 h-5 text-red-500" />
  ) : (
    <File className="w-5 h-5 text-gray-500" />
  )

const defaultAvatar = (user: User, size: string = "md") => (
  <Image
    src={user.avatar || "/placeholder-user.jpg"}
    alt={user.username || "User"}
    className={`rounded-full object-cover ${
      size === "sm" ? "w-6 h-6" : size === "lg" ? "w-10 h-10" : "w-8 h-8"
    }`}
    width={32}
    height={32}
    loading="lazy"
  />
)

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
      (a): a is Attachment =>
        a &&
        typeof a.content_type === "string" &&
        typeof a.file_url === "string"
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
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`flex ${isOwnMessage ? "justify-end" : "justify-start"} mb-4`}
    >
      {!isOwnMessage && showAvatar && (
        <div className="mr-2 flex-shrink-0">
          {message.sender
            ? Avatar(message.sender, "md")
            : defaultAvatar({ id: "unknown", username: "Unknown" })}
        </div>
      )}

      <div
        className={`relative max-w-xs lg:max-w-md px-4 py-2 rounded-2xl shadow-md transition-colors ${
          isOwnMessage
            ? "bg-gradient-to-r from-[#8B75AA] to-[#CDAA7D] text-white"
            : "bg-gray-100 text-gray-800"
        }`}
      >
        {/* Text content */}
        {message.content && message.message_type === "text" && (
          <p className="break-words whitespace-pre-wrap text-sm">{message.content}</p>
        )}

        {/* Image attachments */}
        {imageAttachments.length > 0 && (
          <div
            className={`mt-2 space-y-2 ${
              message.content ? "pt-2 border-t border-white/20" : ""
            }`}
          >
            {imageAttachments.map((a) => {
              const getAbsoluteUrl = (url?: string) => {
                if (!url) return ""
                return url.startsWith("http")
                  ? url
                  : `http://localhost:8000${url.startsWith("/") ? "" : "/"}${url}`
              }

              const src = getAbsoluteUrl(a.thumbnail_url || a.file_url)
              if (!src) return null

              return (
                <motion.div
                  key={a.id}
                  className="overflow-hidden rounded-lg"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Image
                    src={src}
                    alt={a.filename || "image"}
                    width={200}
                    height={200}
                    className="rounded-lg max-w-xs max-h-64 object-cover"
                  />
                </motion.div>
              )
            })}
          </div>
        )}

        {/* File attachments */}
        {otherAttachments.length > 0 && (
          <div
            className={`mt-2 space-y-1 ${
              shouldShowBorder ? "pt-2 border-t border-white/20" : ""
            }`}
          >
            {otherAttachments.map((a) => (
              <motion.div
                key={a.id}
                onClick={() => onAttachmentClick?.(a)}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.97 }}
                className={`
                  flex items-center space-x-2 cursor-pointer p-2 rounded-lg
                  ${isOwnMessage ? "hover:bg-[#9c85af]/90" : "hover:bg-gray-200"}
                  transition-all
                `}
              >
                {getFileIcon(a)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{a.filename}</p>
                  {a.file_size_human && (
                    <p className="text-xs opacity-75">{a.file_size_human}</p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Time + status */}
        {time && (
          <div
            className={`flex items-center gap-2 text-xs mt-2 opacity-75 ${
              isOwnMessage ? "justify-end" : "justify-start"
            }`}
          >
            <span>{time}</span>
            {isOwnMessage && status && <span>{getStatusIcon(status)}</span>}
          </div>
        )}
      </div>

      {isOwnMessage && showAvatar && (
        <div className="ml-2 flex-shrink-0">
          {message.sender
            ? Avatar(message.sender, "md")
            : defaultAvatar({ id: "unknown", username: "Unknown" })}
        </div>
      )}
    </motion.div>
  )
}

export default MessageBubble
