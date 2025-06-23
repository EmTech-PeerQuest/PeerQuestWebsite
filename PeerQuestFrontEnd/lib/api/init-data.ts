import axios from "axios"

const BASE_URL = "http://localhost:8000" // 🔁 replace with your backend URL if hosted elsewhere

export async function fetchInitialData() {
  try {
    const token = localStorage.getItem("access_token")

    // Integration-ready condition: if token missing or backend not ready, return empty/default
    if (!token) {
      console.warn("🔒 No access token found — skipping API calls until auth is ready.")
      return {
        user: null,
        conversations: []
      }
    }

    const config = {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }

    const [userRes, conversationsRes] = await Promise.all([
      axios.get(`${BASE_URL}/api/users/me/`, config),
      axios.get(`${BASE_URL}/api/messages/conversations/`, config)
    ])

    return {
      user: userRes.data,
      conversations: conversationsRes.data
    }
  } catch (error: any) {
    if (error.response?.status === 401) {
      console.warn("🔐 Unauthorized (401) — likely no backend auth system yet.")
    } else {
      console.error("❌ API fetch error:", error)
    }

    return {
      user: null,
      conversations: []
    }
  }
}
