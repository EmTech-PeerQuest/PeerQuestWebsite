"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"

type Guild = {
  id: number
  name: string
  description: string
  createdAt: string
  members: number
  // Add other fields as needed
}

export default function GuildPage() {
  const { id } = useParams()
  const [guild, setGuild] = useState<Guild | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    fetch(`/api/guilds/${id}/`)
      .then(res => res.json())
      .then(data => {
        setGuild(data)
        setLoading(false)
      })
  }, [id])

  if (loading) return <div>Loading...</div>
  if (!guild) return <div>Guild not found.</div>

  return (
    <div>
      <h1>{guild.name}</h1>
      <p>{guild.description}</p>
      <p>Created at: {new Date(guild.createdAt).toLocaleString()}</p>
      <p>Members: {guild.members}</p>
      {/* Render other guild details here */}
    </div>
  )
}