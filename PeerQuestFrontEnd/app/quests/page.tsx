"use client";
import { QuestManagement } from "@/components/quests/quest-management";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import type { Quest } from "@/lib/types";
import { useQueryParam } from "@/components/quests/useQueryParam";

export default function QuestsPage() {
  const { user: currentUser } = useAuth();
  const [quests, setQuests] = useState<Quest[]>([]);
  const focusedQuestId = useQueryParam("questId");

  // Dummy toast and status change handlers for now
  const showToast = (msg: string) => {};
  const onQuestStatusChange = () => {};

  if (!currentUser) {
    return <div className="p-8 text-center">Please log in to view your quests.</div>;
  }

  return (
    <div className="p-4">
      <QuestManagement
        currentUser={currentUser}
        onQuestStatusChange={onQuestStatusChange}
        setQuests={setQuests}
        showToast={showToast}
        focusedQuestId={focusedQuestId ? Number(focusedQuestId) : undefined}
      />
    </div>
  );
}
