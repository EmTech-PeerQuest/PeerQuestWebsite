// filepath: PeerQuestFrontEnd/app/guilds/create/page.tsx
"use client"
import { useState } from "react"

export default function CreateGuild() {
  const [form, setForm] = useState({
    name: "",
    description: "",
    specialization: "",
    welcome_message: "",
    tags: [],
    social_links: [],
    privacy: "public",
    join_requirements: { required_approval: false, min_level: 1 },
    visibility: { allow_discovery: true, show_on_home: true },
    permissions: { post_quests: "admin", invite_members: "admin" },
  })
  const [emblem, setEmblem] = useState<File | null>(null)

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleFileChange = (e: any) => {
    setEmblem(e.target.files[0])
  }

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    const data = new FormData()
    Object.entries(form).forEach(([key, value]) => {
      data.append(key, typeof value === "object" ? JSON.stringify(value) : value)
    })
    if (emblem) data.append("emblem", emblem)
    await fetch("http://localhost:8000/guilds/create/", {
      method: "POST",
      body: data,
    })
    // handle response...
  }

  return (
    <form onSubmit={handleSubmit}>
      <input name="name" onChange={handleChange} placeholder="Guild Name" required />
      <textarea name="description" onChange={handleChange} placeholder="Description" />
      <input name="specialization" onChange={handleChange} placeholder="Specialization" />
      <textarea name="welcome_message" onChange={handleChange} placeholder="Welcome Message" />
      <input type="file" name="emblem" onChange={handleFileChange} />
      {/* Add UI for tags, social_links, privacy, join_requirements, visibility, permissions */}
      <button type="submit">Create Guild</button>
    </form>
  )
}