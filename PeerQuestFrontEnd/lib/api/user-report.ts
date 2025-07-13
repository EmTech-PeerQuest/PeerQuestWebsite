import { API_BASE_URL } from "./utils";

export interface UserReportPayload {
  reportedUser: string;
  reporter: string;
  reason: string;
  message?: string;
}

export async function reportUser(payload: UserReportPayload, token: string): Promise<{ success: boolean; message?: string; errors?: any }> {
  if (!API_BASE_URL) {
    throw new Error('NEXT_PUBLIC_API_URL is not set. Please add NEXT_PUBLIC_API_URL to your .env.local (e.g. NEXT_PUBLIC_API_URL=http://localhost:8000).');
  }
  // Build the report endpoint, supporting base with or without `/api`
  const base = API_BASE_URL.replace(/\/$/, '');
  const endpoint = base.endsWith('/api')
    ? `${base}/users/user-report/`
    : `${base}/api/users/user-report/`;
  console.debug('[reportUser] POST to', endpoint);
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({
      reported_user: payload.reportedUser,
      reporter: payload.reporter,
      reason: payload.reason,
      message: payload.message || "",
    }),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Report failed ${response.status}: ${errorText}`);
  }
  return response.json();
}
