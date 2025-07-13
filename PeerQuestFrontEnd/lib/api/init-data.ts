import axios from "axios"
import { TokenInvalidError } from "./auth"

const BASE_URL = "http://localhost:8000" // 🔁 replace with your backend URL if hosted elsewhere

export async function fetchInitialData() {
  try {
    const token = localStorage.getItem("access_token")

    if (!token) {
      console.warn("🔒 No access token found — skipping API calls until auth is ready.")
      return {
        user: null,
        quests: [],
        guilds: [],
        guildApplications: []
      }
    }

    const config = {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }

    // Update endpoints to match backend
    const [userRes, questsRes, guildsRes, usersRes] = await Promise.all([
      axios.get(`${BASE_URL}/api/users/profile/`, config),
      axios.get(`${BASE_URL}/api/quests/my_quests/`, config),
      axios.get(`${BASE_URL}/api/guilds/`, config),
      axios.get(`${BASE_URL}/api/users/search/`, config)
    ])

    return {
      user: userRes.data,
      quests: questsRes.data, // Now only user-relevant quests
      guilds: guildsRes.data,
      users: usersRes.data?.results || [],
      guildApplications: [] // update if you have this endpoint
    }
  } catch (error: any) {
    const detail = error?.response?.data?.detail || "";
    if (
      error?.response?.status === 401 &&
      (detail.includes("token not valid") || detail.includes("token has expired") || detail.includes("credentials were not provided"))
    ) {
      throw new TokenInvalidError(detail || "Token not valid");
    }
    return {
      user: null,
      quests: [],
      guilds: [],
      users: [],
      guildApplications: []
    }
  }
}
