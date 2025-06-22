"use client"

import { useState } from "react"
import { Plus, Shield, Users, Settings, DollarSign, BarChart3 } from "lucide-react"
import type { Guild, User } from "@/lib/types"

interface GuildRolesConfigProps {
  guild: Guild
  currentUser: User | null
  showToast: (message: string, type?: string) => void
}

interface Role {
  id: number
  name: string
  color: string
  permissions: string[]
  memberCount: number
}

interface Permission {
  id: string
  name: string
  description: string
  category: "group" | "experience" | "revenue"
}

export function GuildRolesConfig({ guild, currentUser, showToast }: GuildRolesConfigProps) {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [activeTab, setActiveTab] = useState<"permissions" | "members" | "settings">("permissions")

  // Mock roles data
  const roles: Role[] = [
    { id: 1, name: "Owner", color: "#FFD700", permissions: ["all"], memberCount: 1 },
    { id: 2, name: "Admin", color: "#FF6B6B", permissions: ["manage_members", "manage_roles"], memberCount: 2 },
    { id: 3, name: "Quest Leader", color: "#4ECDC4", permissions: ["create_quests", "manage_quests"], memberCount: 5 },
    { id: 4, name: "Member", color: "#95E1D3", permissions: ["view_guild"], memberCount: 15 },
  ]

  // Mock permissions
  const permissions: Permission[] = [
    {
      id: "add_remove_members",
      name: "Add or remove guild members",
      description: "Allow adding and removing members from the guild",
      category: "group",
    },
    {
      id: "manage_roles",
      name: "Configure limited roles",
      description:
        "Members with this role can manage the roles they are assigned and assign permissions to those roles that they themselves have",
      category: "group",
    },
    {
      id: "admin_all_roles",
      name: "Administrate all roles",
      description:
        "Members with this role can create, delete, and configure any role in the guild. This is a super-admin permission as it provides nearly full access",
      category: "group",
    },
    {
      id: "configure_guild",
      name: "Configure guild profile",
      description: "Allow editing guild information and settings",
      category: "group",
    },
    {
      id: "view_activity",
      name: "View guild activity history",
      description: "Access to guild activity logs and history",
      category: "group",
    },
    {
      id: "play_experiences",
      name: "Play all guild experiences",
      description: "Access to all guild-related activities and quests",
      category: "experience",
    },
    {
      id: "edit_experiences",
      name: "Edit all guild experiences",
      description: "Modify and manage guild quests and activities",
      category: "experience",
    },
    {
      id: "publish_experiences",
      name: "Edit and publish all guild experiences",
      description: "Full control over guild quest publishing",
      category: "experience",
    },
    {
      id: "view_revenue",
      name: "View guild revenue",
      description: "Access to guild financial information",
      category: "revenue",
    },
  ]

  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role)
    setActiveTab("permissions")
  }

  const handlePermissionToggle = (permissionId: string) => {
    if (!selectedRole) return

    showToast(`Permission ${permissionId} toggled for ${selectedRole.name}`, "success")
  }

  const getPermissionsByCategory = (category: string) => {
    return permissions.filter((p) => p.category === category)
  }

  return (
    <div className="bg-[#2C1A1D] text-[#F4F0E6] rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-bold">Roles</h3>
          <p className="text-gray-400 text-sm">
            Roles allow you to group creators together and manage them as a single unit.
          </p>
        </div>
        <button className="flex items-center gap-2 bg-[#8B75AA] text-white px-4 py-2 rounded hover:bg-[#7A6699] transition-colors">
          <Plus size={16} />
          Add a Role
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Roles List */}
        <div className="lg:col-span-1">
          <div className="space-y-2 mb-4">
            {roles.map((role) => (
              <button
                key={role.id}
                onClick={() => handleRoleSelect(role)}
                className={`w-full flex items-center justify-between p-3 rounded transition-colors ${
                  selectedRole?.id === role.id
                    ? "bg-[#8B75AA] text-white"
                    : "bg-[#3D2A2F] text-[#F4F0E6] hover:bg-[#4A3540]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: role.color }} />
                  <span className="font-medium">{role.name}</span>
                </div>
                <span className="text-sm opacity-70">{role.memberCount}</span>
              </button>
            ))}
          </div>

          <div className="border-t border-[#3D2A2F] pt-4">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <Shield size={16} />
              Legacy Roles
            </h4>
            <div className="space-y-1 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <Users size={14} />
                <span>Guest</span>
              </div>
              <div className="flex items-center gap-2">
                <Users size={14} />
                <span>Member</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield size={14} />
                <span>Admin</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield size={14} />
                <span>Owner</span>
              </div>
            </div>
          </div>
        </div>

        {/* Role Configuration */}
        <div className="lg:col-span-2">
          {selectedRole ? (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: selectedRole.color }}
                >
                  {selectedRole.name.charAt(0)}
                </div>
                <div>
                  <h4 className="text-lg font-bold">Configure {selectedRole.name}</h4>
                  <p className="text-sm text-gray-400">{selectedRole.memberCount} members</p>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-[#3D2A2F] mb-6">
                <button
                  onClick={() => setActiveTab("permissions")}
                  className={`px-4 py-2 font-medium ${
                    activeTab === "permissions"
                      ? "text-[#8B75AA] border-b-2 border-[#8B75AA]"
                      : "text-gray-400 hover:text-[#F4F0E6]"
                  }`}
                >
                  Permissions
                </button>
                <button
                  onClick={() => setActiveTab("members")}
                  className={`px-4 py-2 font-medium ${
                    activeTab === "members"
                      ? "text-[#8B75AA] border-b-2 border-[#8B75AA]"
                      : "text-gray-400 hover:text-[#F4F0E6]"
                  }`}
                >
                  Members
                </button>
                <button
                  onClick={() => setActiveTab("settings")}
                  className={`px-4 py-2 font-medium ${
                    activeTab === "settings"
                      ? "text-[#8B75AA] border-b-2 border-[#8B75AA]"
                      : "text-gray-400 hover:text-[#F4F0E6]"
                  }`}
                >
                  Settings
                </button>
              </div>

              {/* Tab Content */}
              {activeTab === "permissions" && (
                <div className="space-y-6">
                  {/* Group Permissions */}
                  <div>
                    <h5 className="font-medium mb-3 flex items-center gap-2">
                      <Users size={16} />
                      Guild permissions
                    </h5>
                    <div className="space-y-3">
                      {getPermissionsByCategory("group").map((permission) => (
                        <label key={permission.id} className="flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            className="mt-1 w-4 h-4 text-[#8B75AA] bg-[#3D2A2F] border-[#CDAA7D] rounded focus:ring-[#8B75AA]"
                            onChange={() => handlePermissionToggle(permission.id)}
                          />
                          <div>
                            <p className="font-medium text-[#F4F0E6]">{permission.name}</p>
                            <p className="text-sm text-gray-400">{permission.description}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Experience Permissions */}
                  <div>
                    <h5 className="font-medium mb-3 flex items-center gap-2">
                      <BarChart3 size={16} />
                      Experience permissions
                    </h5>
                    <div className="space-y-3">
                      {getPermissionsByCategory("experience").map((permission) => (
                        <label key={permission.id} className="flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            className="mt-1 w-4 h-4 text-[#8B75AA] bg-[#3D2A2F] border-[#CDAA7D] rounded focus:ring-[#8B75AA]"
                            onChange={() => handlePermissionToggle(permission.id)}
                          />
                          <div>
                            <p className="font-medium text-[#F4F0E6]">{permission.name}</p>
                            <p className="text-sm text-gray-400">{permission.description}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Revenue Permissions */}
                  <div>
                    <h5 className="font-medium mb-3 flex items-center gap-2">
                      <DollarSign size={16} />
                      Guild revenue
                    </h5>
                    <div className="space-y-3">
                      {getPermissionsByCategory("revenue").map((permission) => (
                        <label key={permission.id} className="flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            className="mt-1 w-4 h-4 text-[#8B75AA] bg-[#3D2A2F] border-[#CDAA7D] rounded focus:ring-[#8B75AA]"
                            onChange={() => handlePermissionToggle(permission.id)}
                          />
                          <div>
                            <p className="font-medium text-[#F4F0E6]">{permission.name}</p>
                            <p className="text-sm text-gray-400">{permission.description}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <button className="bg-[#8B75AA] text-white px-6 py-2 rounded hover:bg-[#7A6699] transition-colors">
                      Save Changes
                    </button>
                  </div>
                </div>
              )}

              {activeTab === "members" && (
                <div className="text-center py-8">
                  <Users size={48} className="mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-400">Member management coming soon</p>
                </div>
              )}

              {activeTab === "settings" && (
                <div className="text-center py-8">
                  <Settings size={48} className="mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-400">Role settings coming soon</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <Shield size={48} className="mx-auto mb-4 text-gray-400" />
              <p className="text-gray-400">Select a role to configure its permissions</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
