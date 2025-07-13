"use client";
import React, { useEffect, useRef, useState } from "react";
import { Info, Wifi, WifiOff } from "lucide-react";
import type {
  Message,
  User,
  Conversation,
  UserStatus,
  TypingUser,
} from "@/lib/types";
import MessageInput from "./message-input";
import TypingIndicator from "./typing-indicator";

interface ChatWindowProps {
  messages: Message[];
  currentUser: User;
  onSendMessage: (content: string, files?: File[]) => Promise<void>;
  onTyping: () => void;
  typingUsers: Pick<TypingUser, "user_id" | "username">[];
  wsConnected: boolean;
  wsError?: string;
  newMessage: string;
  setNewMessage: React.Dispatch<React.SetStateAction<string>>;
  renderAvatar: (user: User) => React.ReactNode;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeFile: (index: number) => void;
  selectedFiles: File[];
  onToggleInfo: () => void;
  onlineUsers: Map<string, UserStatus>;
  isSending: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
  activeConversation: Conversation;
  conversations: Conversation[];
  getOtherParticipant: (conv: Conversation) => User | null;
  isLoading: boolean;
  isOtherUserTyping: boolean;
}

function ChatWindow({
  messages,
  currentUser,
  onSendMessage,
  onTyping,
  typingUsers,
  wsConnected,
  wsError,
  newMessage,
  setNewMessage,
  renderAvatar,
  onToggleInfo,
  onlineUsers,
  isSending,
  activeConversation,
  getOtherParticipant,
  isLoading,
}: ChatWindowProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...filesArray]);
      e.target.value = "";
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSendMessage = async (content: string) => {
    await onSendMessage(content, selectedFiles);
    setSelectedFiles([]);
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages]);

  const otherParticipant = getOtherParticipant(activeConversation);
  const presence = otherParticipant
    ? onlineUsers.get(otherParticipant.id)
    : undefined;

  const onlineLabel =
    presence === "online" ? "Online" : presence === "idle" ? "Idle" : "Offline";

  return (
    <div
      className="flex flex-col h-[calc(100vh-96px)] relative overflow-hidden"
      style={{ backgroundColor: "var(--tavern-cream)" }}
    >
      {/* Header */}
      <div
        className="sticky top-0 z-10 px-4 py-3 border-b"
        style={{
          backgroundColor: "var(--tavern-dark)",
          borderColor: "var(--tavern-gold)",
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {otherParticipant && renderAvatar(otherParticipant)}
            <div>
              <h2
                className="font-semibold"
                style={{ color: "var(--tavern-gold)" }}
              >
                {otherParticipant?.username || "Unknown User"}
              </h2>
              <div
                className="flex items-center gap-2 text-sm"
                style={{ color: "var(--tavern-cream)" }}
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    presence === "online"
                      ? "bg-green-500"
                      : presence === "idle"
                      ? "bg-amber-400"
                      : "bg-slate-400"
                  }`}
                  title={onlineLabel}
                />
                <span
                  className={`font-medium ${
                    presence === "online"
                      ? "text-green-400"
                      : presence === "idle"
                      ? "text-amber-400"
                      : "text-slate-300"
                  }`}
                >
                  {onlineLabel}
                </span>
                {wsConnected ? (
                  <Wifi className="w-4 h-4 text-green-400 ml-2" />
                ) : (
                  <WifiOff className="w-4 h-4 text-red-400 ml-2" />
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onToggleInfo}
            className="p-2 rounded-lg transition-colors hover:bg-opacity-20"
            style={{ backgroundColor: "var(--tavern-gold)" }}
          >
            <Info className="w-5 h-5" style={{ color: "var(--tavern-dark)" }} />
          </button>
        </div>
      </div>

      {/* WebSocket Error */}
      {wsError && (
        <div className="flex-shrink-0 bg-red-900 border-b border-red-700 p-3 text-center">
          <p className="text-red-200 text-sm font-medium">
            Connection lost. Trying to reconnect...
          </p>
        </div>
      )}

      {/* Messages + Typing */}
      <div
        className="flex-1 overflow-y-auto p-4 space-y-4"
        ref={scrollContainerRef}
        style={{
          backgroundColor: "var(--tavern-cream)",
          paddingBottom: "140px",
        }}
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div
              className="animate-spin rounded-full h-8 w-8 border-b-2"
              style={{ borderColor: "var(--tavern-gold)" }}
            />
          </div>
        ) : messages.length === 0 ? (
          <div
            className="flex items-center justify-center h-full"
            style={{ color: "var(--tavern-dark)" }}
          >
            <p className="font-medium">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <>
            {messages.map((message) => {
              const isCurrentUser = message.sender.id === currentUser.id;
              const sender = message.sender;
              return (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    isCurrentUser ? "flex-row-reverse" : ""
                  }`}
                >
                  <div className="flex-shrink-0">{renderAvatar(sender)}</div>
                  <div className="flex-1 max-w-xs lg:max-w-md xl:max-w-lg">
                    <div
                      className={`px-4 py-2 rounded-2xl shadow-sm ${
                        isCurrentUser ? "ml-auto" : ""
                      }`}
                      style={{
                        backgroundColor: isCurrentUser
                          ? "var(--tavern-gold)"
                          : "white",
                        color: "var(--tavern-dark)",
                        border: `1px solid ${
                          isCurrentUser
                            ? "var(--tavern-purple)"
                            : "var(--tavern-gold)"
                        }`,
                      }}
                    >
                      {message.content && (
                        <p className="whitespace-pre-wrap break-words">
                          {message.content}
                        </p>
                      )}
                      {Array.isArray(message.attachments) &&
                        message.attachments.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {message.attachments.map((att, i) => {
                              const fileUrl = att.url || att.file_url;
                              if (!fileUrl) return null;

                              const fullUrl = fileUrl.startsWith("http")
                                ? fileUrl
                                : `${process.env.NEXT_PUBLIC_MEDIA_URL}${fileUrl}`;

                              const isImage =
                                att.is_image ||
                                att.content_type?.startsWith("image/") ||
                                /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(
                                  att.filename
                                );

                              return isImage ? (
                                <a
                                  key={att.id || i}
                                  href={fullUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block max-w-[200px] max-h-[200px] rounded overflow-hidden border border-[var(--tavern-gold)]"
                                >
                                  <img
                                    src={fullUrl}
                                    alt={att.filename}
                                    className="w-full h-auto object-contain"
                                  />
                                </a>
                              ) : (
                                <a
                                  key={att.id || i}
                                  href={fullUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[var(--tavern-gold)] underline text-sm font-medium break-words"
                                >
                                  📎 {att.filename}
                                </a>
                              );
                            })}
                          </div>
                        )}
                    </div>
                    <div
                      className={`mt-1 text-xs font-medium flex items-center gap-2 ${
                        isCurrentUser ? "justify-end" : ""
                      }`}
                      style={{ color: "var(--tavern-dark)" }}
                    >
                      <span>
                        {new Date(message.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {isCurrentUser && message.status && (
                        <>
                          {message.status === "sending" && (
                            <svg
                              className="w-4 h-4 animate-spin text-[var(--tavern-purple)]"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8v8H4z"
                              />
                            </svg>
                          )}
                          {["sent", "delivered", "read"].includes(
                            message.status
                          ) && (
                            <span style={{ color: "var(--tavern-purple)" }}>
                              {message.status === "read" ? "Read" : "Sent"}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Typing Indicator */}
            {typingUsers.length > 0 && (
              <>
                <TypingIndicator
                  typingUsers={typingUsers}
                  currentUserId={currentUser.id}
                  renderAvatar={renderAvatar}
                  onlineUsers={onlineUsers}
                />
                {typingUsers.some(t => t.user_id !== currentUser.id) && (
                  <div className="text-sm text-gray-500 italic px-4">
                    The other user is typing...
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Fixed Input */}
      <div
        className="fixed bottom-0 left-[300px] z-10 border-t p-4 bg-[var(--tavern-dark)]"
        style={{
          borderColor: "var(--tavern-gold)",
          minHeight: "90px",
          width: "calc(100% - 300px)",
        }}
      >
        <MessageInput
          newMessage={newMessage}
          setNewMessage={setNewMessage}
          onSend={handleSendMessage}
          onTyping={onTyping}
          disabled={!wsConnected || isSending}
          handleFileSelect={handleFileSelect}
          removeFile={removeFile}
          selectedFiles={selectedFiles}
          isSending={isSending}
          fileInputRef={fileInputRef}
          wsConnected={wsConnected}
        />
      </div>
    </div>
  );
}

export default ChatWindow;
