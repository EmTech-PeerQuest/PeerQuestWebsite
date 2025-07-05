import React, { useEffect, useState } from "react";

interface Guild {
  id: number;
  name: string;
  description: string;
  specialization?: string;
  category?: string;
  emblem?: string;
  createdAt?: string;
  members?: number;
}

export default function GuildsBackendTest() {
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("http://localhost:8000/guilds/")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch guilds");
        return res.json();
      })
      .then((data) => {
        setGuilds(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading guilds...</div>;
  if (error) return <div style={{ color: "red" }}>Error: {error}</div>;

  return (
    <div style={{ maxWidth: 600, margin: "2rem auto", fontFamily: "sans-serif" }}>
      <h1>Guilds (Backend Data)</h1>
      {guilds.length === 0 ? (
        <p>No guilds found.</p>
      ) : (
        <ul style={{ padding: 0 }}>
          {guilds.map((guild) => (
            <li key={guild.id} style={{ border: "1px solid #ccc", borderRadius: 8, margin: "1rem 0", padding: 16 }}>
              <h2>{guild.name} {guild.emblem && <span>{guild.emblem}</span>}</h2>
              <p>{guild.description}</p>
              {guild.specialization && <p><b>Specialization:</b> {guild.specialization}</p>}
              {guild.category && <p><b>Category:</b> {guild.category}</p>}
              {guild.createdAt && <p><b>Created:</b> {new Date(guild.createdAt).toLocaleString()}</p>}
              {guild.members !== undefined && <p><b>Members:</b> {guild.members}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
