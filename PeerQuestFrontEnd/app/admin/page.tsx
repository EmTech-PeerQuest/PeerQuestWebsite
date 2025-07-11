"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import AdminPanel from "@/components/admin/admin-panel";
import { Navbar } from '@/components/ui/navbar';
import type { User, Quest, Guild } from "@/lib/types";


export default function AdminPanelPage() {
  const { user: currentUser, logout } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeSection, setActiveSection] = useState<string>("admin");
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    if (!currentUser || !(currentUser.is_staff || currentUser.isSuperuser || currentUser.is_superuser)) {
      router.replace("/");
      return;
    }
    fetchData();
    // eslint-disable-next-line
  }, [currentUser]);

  async function fetchData() {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("access_token");
      
      // Fetch users
      const usersRes = await fetch("/api/users/admin/users/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData);
      }

      // Fetch quests (if API exists)
      try {
        const questsRes = await fetch("/api/quests/admin/", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (questsRes.ok) {
          const questsData = await questsRes.json();
          setQuests(questsData);
        }
      } catch (e) {
        // Quests API might not exist yet
        setQuests([]);
      }

      // Fetch guilds (if API exists)
      try {
        const guildsRes = await fetch("/api/guilds/admin/", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (guildsRes.ok) {
          const guildsData = await guildsRes.json();
          setGuilds(guildsData);
        }
      } catch (e) {
        // Guilds API might not exist yet
        setGuilds([]);
      }
    } catch (e: any) {
      setError(e.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  function showToast(message: string, type: string = "success") {
    // Simple toast implementation - you can integrate with a proper toast library
    console.log(`${type}: ${message}`);
    // For now, just show an alert
    alert(message);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading admin panel...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-red-600">Error: {error}</div>
      </div>
    );
  }

  // Custom section handler for admin page: route to main sections
  const handleSectionChange = (section: string) => {
    if (section === "admin") {
      setActiveSection("admin");
    } else if (section === "home") {
      router.push("/");
    } else if (section === "quest-board") {
      router.push("/?section=quest-board");
    } else if (section === "guild-hall") {
      router.push("/?section=guild-hall");
    } else if (section === "about") {
      router.push("/?section=about");
    } else {
      // fallback: go home
      router.push("/");
    }
  };

  return (
    <>
      <Navbar
        activeSection={activeSection}
        setActiveSection={handleSectionChange}
        handleLogout={logout}
        openAuthModal={() => setShowAuthModal(true)}
        openGoldPurchaseModal={() => {}}
        openPostQuestModal={() => {}}
        openCreateGuildModal={() => {}}

      />
      <AdminPanel
        currentUser={currentUser}
        users={users}
        quests={quests}
        guilds={guilds}
        setUsers={setUsers}
        setQuests={setQuests}
        setGuilds={setGuilds}
        showToast={showToast}
      />
    </>
  );
}

