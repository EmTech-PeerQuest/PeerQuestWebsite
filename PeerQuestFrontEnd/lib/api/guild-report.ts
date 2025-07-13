import { fetchWithAuth } from "./auth";
import { API_BASE_URL } from "./utils";

export interface GuildReportPayload {
  reportedGuild: string;
  reason: string;
  message?: string;
}

export async function reportGuild(payload: GuildReportPayload): Promise<{ success: boolean; message?: string; errors?: any }> {
  if (!API_BASE_URL) {
    throw new Error('NEXT_PUBLIC_API_URL is not set. Please add NEXT_PUBLIC_API_URL to your .env.local (e.g. NEXT_PUBLIC_API_URL=http://localhost:8000).');
  }
  const base = API_BASE_URL.replace(/\/$/, '');
  const endpoint = base.endsWith('/api')
    ? `${base}/users/guild-report/`
    : `${base}/api/users/guild-report/`;
  console.debug('[reportGuild] POST to', endpoint);
  // Use fetchWithAuth to ensure token is always included
  const response = await fetchWithAuth(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      reported_guild: payload.reportedGuild,
      reason: payload.reason,
      message: payload.message || "",
    }),
  });

  if (response.ok) {
    const data = await response.json();
    return { success: true, message: data.message || "Guild reported successfully" };
  } else {
    const errorData = await response.json().catch(() => ({}));
    return { 
      success: false, 
      message: errorData.message || "Failed to report guild", 
      errors: errorData 
    };
  }
}
