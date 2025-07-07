"use client"

import React, { useMemo } from 'react'
import { Message, User, Attachment, MessageStatus } from '@/lib/types'
import { Check, CheckCheck, AlertCircle, File, FileText } from 'lucide-react'
import Image from 'next/image'

export interface MessageBubbleProps {
  message: Message
  isOwnMessage: boolean
  showAvatar?: boolean
  status?: MessageStatus
  onAttachmentClick?: (attachment: Attachment) => void
  renderAvatar?: (user: User, size?: "sm" | "md" | "lg") => JSX.Element
  onlineUsers?: Map<string, "online" | "idle" | "offline">
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwnMessage,
  showAvatar = true,
  status,
  onAttachmentClick,
  renderAvatar,
}) => {
  // Memoize the icon rendering functions
  const getStatusIcon = useMemo(() => {
    return (status: MessageStatus) => {
      switch (status) {
        case "sent":
          return <Check className="w-4 h-4 text-gray-400" />
        case "delivered":
          return <CheckCheck className="w-4 h-4 text-gray-400" />
        case "read":
          return <CheckCheck className="w-4 h-4 text-blue-500" />
        case "failed":
          return <AlertCircle className="w-4 h-4 text-red-500" />
        default:
          return null
      }
    }
  }, [])

  // Type guard for attachments
  const safeAttachments = useMemo(() => {
    return message.attachments?.filter(
      (attachment): attachment is Attachment =>
        attachment && typeof attachment.content_type === 'string' && typeof attachment.url === 'string'
    ) || []
  }, [message.attachments])

  const imageAttachments = safeAttachments.filter((a) => a.is_image === true)
  const otherAttachments = safeAttachments.filter((a) => a.is_image !== true)

  // Fallback avatar if renderAvatar is not provided
  const AvatarComponent = renderAvatar || ((user: User, size: string = "md") => (
    <Image
      src={user.avatar || '/default-avatar.png'}
      alt={user.username}
      className={`rounded-full object-cover ${size === "sm" ? "w-6 h-6" : size === "lg" ? "w-10 h-10" : "w-8 h-8"}`}
      width={32}
      height={32}
      loading="lazy"
    />
  ))

  // Function to get file type icons
  const getFileIcon = (attachment: Attachment) => {
    if (attachment.is_image) {
      return <File className="w-5 h-5 text-gray-500" />
    }
    if (attachment.content_type.includes('pdf')) {
      return <FileText className="w-5 h-5 text-red-500" />
    }
    return <File className="w-5 h-5 text-gray-500" />
  }

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4`}>
      {!isOwnMessage && showAvatar && (
        <div className="mr-2">
          {message.sender ? AvatarComponent(message.sender, "md") : (
            <Image
              src={'/default-avatar.png'}
              alt="Unknown User"
              className="w-8 h-8 rounded-full object-cover"
              width={32}
              height={32}
              loading="lazy"
            />
          )}
        </div>
      )}

      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${isOwnMessage ? 'bg-gradient-to-r from-[#8B75AA] to-[#CDAA7D] text-white' : 'bg-gray-200 text-gray-800'}`}>
        {message.content && message.message_type === 'text' && (
          <p className="break-words">{message.content}</p>
        )}

        {imageAttachments.length > 0 && (
          <div className={`mt-2 space-y-2 ${message.content ? 'pt-2 border-t border-solid border-white/[0.15]' : ''}`}>
            {imageAttachments.map((a) => (
              <Image
                key={a.id}
                src={a.url}
                alt={a.filename}
                className="max-w-full rounded cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => onAttachmentClick?.(a)}
                width={300}
                height={200}
                objectFit="contain"
                loading="lazy"
              />
            ))}
          </div>
        )}

        {otherAttachments.length > 0 && (
          <div className={`mt-2 space-y-1 ${message.content || imageAttachments.length > 0 ? 'pt-2 border-t border-solid border-white/[0.15]' : ''}`}>
            {otherAttachments.map((a) => (
              <div
                key={a.id}
                className={`flex items-center space-x-2 cursor-pointer p-2 rounded transition-colors ${isOwnMessage ? 'hover:bg-blue-600' : 'hover:bg-gray-300'}`}
                onClick={() => onAttachmentClick?.(a)}
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

        <div className={`flex items-center ${isOwnMessage ? 'justify-end' : 'justify-start'} mt-1`}>
          <span className="text-xs opacity-75">
            {new Date(message.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
          {isOwnMessage && status && (
            <div className="flex justify-end ml-2">
              {getStatusIcon(status)}
            </div>
          )}
        </div>
      </div>

      {isOwnMessage && showAvatar && (
        <div className="ml-2">
          {message.sender ? AvatarComponent(message.sender, "md") : (
            <Image
              src={'/default-avatar.png'}
              alt="Unknown User"
              className="w-8 h-8 rounded-full object-cover"
              width={32}
              height={32}
              loading="lazy"
            />
          )}
        </div>
      )}
    </div>
  )
}

export default MessageBubble
