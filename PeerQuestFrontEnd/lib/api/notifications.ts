import { getAuthHeaders } from "./quests";
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export const clearAllNotifications = async () => {
  const response = await fetch(`${API_BASE_URL}/notifications/clear/`, {
    method: "POST",
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error("Failed to clear notifications");
  }
  return response.json();
};

export const fetchNotifications = async () => {
  const response = await fetch(`${API_BASE_URL}/notifications/`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error("Failed to fetch notifications");
  }
  return response.json();
};
