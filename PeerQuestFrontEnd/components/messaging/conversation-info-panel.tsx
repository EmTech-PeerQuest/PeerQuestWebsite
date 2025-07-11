/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useMemo } from "react";
import type { User, Conversation, UserStatus, Message } from "@/lib/types";
import {
  X,
  Users,
  Shield,
  Paperclip,
  LinkIcon,
  Settings,
  ChevronDown,
  ChevronRight,
  Search,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { JSX } from "react/jsx-runtime";

interface Attachment {
  id: string;
  filename: string;
  file_url: string;
  content_type: string;
  file_size: number;
}

interface ConversationInfoPanelProps {
  conversation: Conversation;
  participants: User[];
  onlineUsers: Map<string, UserStatus>;
  renderAvatar: (user: User, size: "sm" | "md" | "lg") => JSX.Element;
  onClose: () => void;
  currentUser: User | null;
  attachments?: Attachment[];
  sharedLinks?: string[];
  setInfoSearchQuery: (q: string) => void;
  infoSearchQuery: string;
  messages: Message[];
}

const Section: React.FC<{
  title: string;
  icon: JSX.Element;
  children: React.ReactNode;
}> = ({ title, icon, children }) => {
  const [open, setOpen] = useState(true);
  return (
    <div className="border-t pt-4">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center w-full text-left gap-2 group"
      >
        {icon}
        <h4 className="font-semibold text-base" style={{ color: "var(--tavern-dark)" }}>
          {title}
        </h4>
        {open ? (
          <ChevronDown className="ml-auto w-4 h-4" />
        ) : (
          <ChevronRight className="ml-auto w-4 h-4" />
        )}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            className="mt-2"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ConversationInfoPanel: React.FC<ConversationInfoPanelProps> = ({
  conversation,
  participants,
  onlineUsers,
  renderAvatar,
  onClose,
  currentUser,
  attachments = [],
  sharedLinks = [],
  setInfoSearchQuery,
  infoSearchQuery,
  messages,
}) => {
  const lowerQuery = infoSearchQuery.toLowerCase();

  const filteredMessages = useMemo(() => {
    if (!infoSearchQuery.trim()) return [];
    return messages.filter(
      (m) =>
        m.content?.toLowerCase().includes(lowerQuery) ||
        m.attachments?.some((a) => a.filename?.toLowerCase().includes(lowerQuery))
    );
  }, [infoSearchQuery, messages]);

  if (!currentUser) {
    return (
      <div className="p-6 text-center">
        <div className="loading-spinner mx-auto mb-2"></div>
        <p className="text-sm" style={{ color: "var(--tavern-purple)" }}>Loading...</p>
      </div>
    );
  }

  const otherParticipant = participants.find((p) => p.id !== currentUser.id) || null;

  return (
    <aside className="relative w-full h-full overflow-hidden">
      <div
        className="flex justify-between items-center px-6 py-4 border-b"
        style={{ backgroundColor: "var(--tavern-dark)", color: "var(--tavern-cream)" }}
      >
        <h3 className="text-lg font-medieval">Conversation Info</h3>
        <button
          onClick={onClose}
          className="p-2 rounded-lg border-2 border-[#cdaa7d] text-[#f4f0e6] hover:bg-[#cdaa7d] hover:text-[#2c1a1d]"
          aria-label="Close panel"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div
        className="p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-4rem)]"
        style={{ backgroundColor: "var(--tavern-cream)" }}
      >
        <motion.div className="text-center" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mx-auto mb-3 flex justify-center">
            {otherParticipant && renderAvatar(otherParticipant, "lg")}
          </div>
          <h2 className="text-xl font-medieval" style={{ color: "var(--tavern-dark)" }}>
            {conversation.is_group ? conversation.name || "Group Chat" : otherParticipant?.username || "Unknown"}
          </h2>
          {conversation.description && (
            <p className="text-sm mt-1" style={{ color: "var(--tavern-purple)" }}>{conversation.description}</p>
          )}
        </motion.div>

        <div className="px-1">
          <input
            type="text"
            value={infoSearchQuery}
            onChange={(e) => setInfoSearchQuery(e.target.value)}
            placeholder="Search messages..."
            className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          />
        </div>

        {infoSearchQuery && (
          <div className="mt-4 px-1 space-y-2 max-h-[300px] overflow-y-auto pr-1">
            {filteredMessages.map((m) => (
              <div key={m.id} className="p-2 border rounded-md bg-white shadow-sm">
                <p className="text-sm text-gray-800 whitespace-pre-wrap">{m.content}</p>
                {(m.attachments?.length ?? 0) > 0 && (
                  <ul className="text-xs text-blue-500 mt-1 space-y-1">
                    {(m.attachments ?? []).map((a, i) => (
                      <li key={i}>
                        <a
                          href={a.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline"
                        >
                          {a.filename}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
            {filteredMessages.length === 0 && (
              <p className="text-sm text-center text-gray-500">No results found.</p>
            )}
          </div>
        )}

        <Section title={`Participants (${participants.length})`} icon={<Users className="w-5 h-5 text-purple-700" />}>
          <div className="space-y-3 max-h-64 overflow-y-auto mt-2">
            {participants.map((participant) => {
              const status = onlineUsers.get(participant.id) ?? "offline";
              const isOnline = status === "online";
              const isIdle = status === "idle";

              return (
                <div
                  key={participant.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#eee] transition"
                >
                  <div className="relative">
                    {renderAvatar(participant, "sm")}
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                        isOnline ? "bg-green-500" : isIdle ? "bg-amber-500" : "bg-slate-400"
                      }`}
                    />
                  </div>
                  <div>
                    <p className="font-medium text-sm" style={{ color: "var(--tavern-dark)" }}>
                      {participant.username}
                      {participant.id === currentUser.id && (
                        <span className="text-xs ml-2" style={{ color: "var(--tavern-purple)" }}>
                          (You)
                        </span>
                      )}
                    </p>
                    <p className="text-xs" style={{ color: isOnline ? "#4caf50" : isIdle ? "#ff9800" : "gray" }}>
                      {isOnline ? "Online" : isIdle ? "Idle" : "Offline"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </Section>

        {attachments.length > 0 && (
          <Section title="Attachments" icon={<Paperclip className="w-5 h-5 text-purple-700" />}>
            <ul className="text-sm mt-2 space-y-1">
              {attachments.map((file) => (
                <li key={file.id} className="truncate">
                  <a
                    href={file.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {file.filename}
                  </a>{" "}
                  <span className="text-gray-500 text-xs">({(file.file_size / 1024).toFixed(1)} KB)</span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {sharedLinks.length > 0 && (
          <Section title="Shared Links" icon={<LinkIcon className="w-5 h-5 text-purple-700" />}>
            <ul className="text-sm mt-2 space-y-1">
              {sharedLinks.map((link, i) => (
                <li key={i} className="break-words">
                  <a href={link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </Section>
        )}

        <Section title="Actions" icon={<Settings className="w-5 h-5 text-purple-700" />}>
          <div className="space-y-2 mt-2">
            {!conversation.is_group ? (
              <>
                <button className="w-full btn-secondary">Block User</button>
                <button className="w-full btn-secondary">Report User</button>
              </>
            ) : (
              <button className="w-full btn-secondary">Leave Group</button>
            )}
            <button className="w-full btn-secondary">Delete Conversation</button>
          </div>
        </Section>
      </div>
    </aside>
  );
};

export default React.memo(ConversationInfoPanel);
