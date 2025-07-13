import { fetchWithAuth } from "./auth";
import { API_BASE_URL } from "./utils";

export interface QuestReportPayload {
  reportedQuest: string;
  reason: string;
  message?: string;
}

export async function reportQuest(payload: QuestReportPayload): Promise<{ success: boolean; message?: string; errors?: any }> {
  if (!API_BASE_URL) {
    throw new Error('NEXT_PUBLIC_API_BASE_URL is not set. Please add NEXT_PUBLIC_API_BASE_URL to your .env.local (e.g. NEXT_PUBLIC_API_BASE_URL=http://localhost:8000).');
  }
  const base = API_BASE_URL.replace(/\/$/, '');
  const endpoint = base.endsWith('/api')
    ? `${base}/users/quest-report/`
    : `${base}/api/users/quest-report/`;
  console.debug('[reportQuest] POST to', endpoint);
  // Use fetchWithAuth to ensure token is always included
  const response = await fetchWithAuth(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      reported_quest: payload.reportedQuest,
      reason: payload.reason,
      message: payload.message || "",
    }),
  });
  return await response.json();
}
