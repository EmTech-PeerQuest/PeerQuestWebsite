"use client"

import type React from "react"

import { useState, useRef } from "react"
import { X, Upload, Plus, Trash2, Users, Settings, Palette, Globe, Lock } from "lucide-react"
import type { User, Guild } from "@/lib/types"
import { ConfirmationModal } from '@/components/modals/confirmation-modal'

interface EnhancedCreateGuildModalProps {
  isOpen: boolean
  onClose: () => void
  currentUser?: User | null
  onSubmit?: (guildData: Partial<Guild>) => void
  showToast?: (message: string, type?: string) => void
}

export function EnhancedCreateGuildModal({
  isOpen,
  onClose,
  currentUser,
  onSubmit,
  showToast,
}: EnhancedCreateGuildModalProps) {
  // Make all state dynamic and extensible
  const [currentStep, setCurrentStep] = useState<number>(1)
  const [guildForm, setGuildForm] = useState(() => ({
    name: "",
    description: "",
    emblem: "🧪",
    specialization: "",
    privacy: "public",
    welcomeMessage: "",
    tags: [] as string[],
    socialLinks: [] as { platform: string; url: string }[],
    customEmblemFile: null as File | null,
    customEmblemPreview: "",
    useCustomEmblem: false,
    requireApproval: true,
    minimumLevel: 1,
    allowDiscovery: true,
    showOnHomePage: true,
    whoCanPost: "members",
    whoCanInvite: "members",
    // Add more dynamic fields here as needed
  }))

  // Dynamic state for tags, social, file input, confirmation
  const [currentTag, setCurrentTag] = useState<string>("")
  const [currentSocialPlatform, setCurrentSocialPlatform] = useState<string>("")
  const [currentSocialUrl, setCurrentSocialUrl] = useState<string>("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false)

  // Dynamic emblem and specialization options (can be extended)
  const emblems = ["🧪", "🌙", "🔥", "🌿", "🥕", "🍂", "🔮", "💎", "⚔️", "🏰", "🛡️", "🎯", "🎨", "💻", "📚", "🎵"]
  const specializations = [
    { value: "alchemy", label: "Alchemy", icon: "🧪" },
    { value: "protection", label: "Protection", icon: "🛡️" },
    { value: "design", label: "Art & Design", icon: "🎨" },
    { value: "development", label: "Development", icon: "💻" },
    { value: "writing", label: "Writing", icon: "📚" },
    { value: "music", label: "Music", icon: "🎵" },
    { value: "research", label: "Research", icon: "🔍" },
    { value: "marketing", label: "Marketing", icon: "📢" },
    // Add more dynamically if needed
  ]

  // Dynamic open/close
  if (!isOpen) return null

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        showToast?.("File size must be less than 5MB", "error")
        return
      }

      // Validate file type
      if (!file.type.startsWith("image/")) {
        showToast?.("Please upload an image file", "error")
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        setGuildForm((prev) => ({
          ...prev,
          customEmblemFile: file,
          customEmblemPreview: e.target?.result as string,
          useCustomEmblem: true,
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  const addTag = () => {
    if (currentTag.trim() && !guildForm.tags.includes(currentTag.trim()) && guildForm.tags.length < 5) {
      setGuildForm((prev) => ({
        ...prev,
        tags: [...prev.tags, currentTag.trim()],
      }))
      setCurrentTag("")
    }
  }

  const removeTag = (index: number) => {
    setGuildForm((prev) => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index),
    }))
  }

  const addSocialLink = () => {
    if (currentSocialPlatform.trim() && currentSocialUrl.trim()) {
      setGuildForm((prev) => ({
        ...prev,
        socialLinks: [...prev.socialLinks, { platform: currentSocialPlatform.trim(), url: currentSocialUrl.trim() }],
      }))
      setCurrentSocialPlatform("")
      setCurrentSocialUrl("")
    }
  }

  const removeSocialLink = (index: number) => {
    setGuildForm((prev) => ({
      ...prev,
      socialLinks: prev.socialLinks.filter((_, i) => i !== index),
    }))
  }

  const handleSubmit = () => {
    if (!currentUser) {
      showToast?.("Please log in to create a guild", "error")
      return
    }

    const GUILD_CREATION_COST = 0

    // Guild creation is now free - no gold check needed

    if (!guildForm.name || !guildForm.description || !guildForm.specialization) {
      showToast?.("Please fill in all required fields", "error")
      return
    }

    // Show confirmation modal instead of submitting directly
    setShowConfirmation(true)
  }

  const handleConfirmSubmit = () => {
    const GUILD_CREATION_COST = 0

    const newGuild: Partial<Guild> = {
      name: guildForm.name,
      description: guildForm.description,
      emblem: guildForm.useCustomEmblem ? guildForm.customEmblemPreview : guildForm.emblem,
      specialization: guildForm.specialization,
      privacy: guildForm.privacy as "public" | "private",
      poster: currentUser ? {
        username: currentUser.username,
        avatar: currentUser.avatar,
        name: currentUser.display_name || currentUser.displayName
      } : undefined,
      members: 1,
      membersList: currentUser ? [Number(currentUser.id)] : [],
      welcome_message: guildForm.welcomeMessage,
      tags: guildForm.tags.map((tag, index) => ({ 
        id: index + 1,
        tag: tag,
        name: tag 
      })),
      social_links: guildForm.socialLinks.map((link, index) => ({
        id: index + 1,
        platform_name: link.platform,
        url: link.url
      })),
    }

    if (onSubmit) {
      onSubmit(newGuild)
    }

    // Reset form
    setGuildForm({
      name: "",
      description: "",
      emblem: "🧪",
      specialization: "",
      privacy: "public",
      welcomeMessage: "",
      tags: [],
      socialLinks: [],
      customEmblemFile: null,
      customEmblemPreview: "",
      useCustomEmblem: false,
      requireApproval: true,
      minimumLevel: 1,
      allowDiscovery: true,
      showOnHomePage: true,
      whoCanPost: "members",
      whoCanInvite: "members",
    })
    setCurrentStep(1)
    setShowConfirmation(false)
  }

  const nextStep = () => {
    if (currentStep === 1) {
      if (!guildForm.name || !guildForm.description) {
        showToast?.("Please fill in the guild name and description", "error")
        return
      }
    }
    setCurrentStep((prev) => Math.min(prev + 1, 3))
  }

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#F4F0E6] rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#2C1A1D] to-[#8B75AA] text-white p-6 rounded-t-lg">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Create a New Guild</h2>
              <p className="text-[#CDAA7D]">Step {currentStep} of 3</p>
            </div>
            <button onClick={onClose} className="text-white hover:text-[#CDAA7D] transition-colors">
              <X size={24} />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-2">
              <span className={currentStep >= 1 ? "text-[#CDAA7D]" : "text-white/60"}>Basic Info</span>
              <span className={currentStep >= 2 ? "text-[#CDAA7D]" : "text-white/60"}>Customization</span>
              <span className={currentStep >= 3 ? "text-[#CDAA7D]" : "text-white/60"}>Settings</span>
            </div>
            <div className="w-full bg-[#2C1A1D] rounded-full h-2">
              <div
                className="bg-[#CDAA7D] h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / 3) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="p-6">
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-[#8B75AA] mb-4">
                <Users size={20} />
                <h3 className="text-lg font-semibold">Basic Information</h3>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#2C1A1D] mb-2">
                  GUILD NAME <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-[#CDAA7D] rounded-lg bg-white text-[#2C1A1D] focus:outline-none focus:border-[#8B75AA]"
                  placeholder="Enter a unique name for your guild"
                  value={guildForm.name}
                  onChange={(e) => setGuildForm((prev) => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#2C1A1D] mb-2">
                  DESCRIPTION <span className="text-red-500">*</span>
                </label>
                <textarea
                  className="w-full px-4 py-3 border border-[#CDAA7D] rounded-lg bg-white text-[#2C1A1D] focus:outline-none focus:border-[#8B75AA] h-32 resize-none"
                  placeholder="Describe your guild's purpose, goals, and what makes it special..."
                  value={guildForm.description}
                  onChange={(e) => setGuildForm((prev) => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#2C1A1D] mb-2">SPECIALIZATION</label>
                <div className="grid grid-cols-2 gap-3">
                  {specializations.map((spec) => (
                    <button
                      key={spec.value}
                      type="button"
                      onClick={() => setGuildForm((prev) => ({ ...prev, specialization: spec.value }))}
                      className={`p-3 border rounded-lg flex items-center gap-3 transition-colors ${
                        guildForm.specialization === spec.value
                          ? "border-[#8B75AA] bg-[#8B75AA]/10 text-[#8B75AA]"
                          : "border-[#CDAA7D] hover:bg-[#CDAA7D]/10 text-[#2C1A1D]"
                      }`}
                    >
                      <span className="text-xl">{spec.icon}</span>
                      <span className="font-medium">{spec.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#2C1A1D] mb-2">WELCOME MESSAGE</label>
                <textarea
                  className="w-full px-4 py-3 border border-[#CDAA7D] rounded-lg bg-white text-[#2C1A1D] focus:outline-none focus:border-[#8B75AA] h-24 resize-none"
                  placeholder="Welcome new members with a friendly message..."
                  value={guildForm.welcomeMessage}
                  onChange={(e) => setGuildForm((prev) => ({ ...prev, welcomeMessage: e.target.value }))}
                />
              </div>
            </div>
          )}

          {/* Step 2: Customization */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-[#8B75AA] mb-4">
                <Palette size={20} />
                <h3 className="text-lg font-semibold">Customization</h3>
              </div>

              {/* Guild Emblem */}
              <div>
                <label className="block text-sm font-medium text-[#2C1A1D] mb-2">GUILD EMBLEM</label>

                {/* Custom Upload Option */}
                <div className="mb-4 p-4 border border-[#CDAA7D] rounded-lg bg-white">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium text-[#2C1A1D]">Custom Emblem</span>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 px-3 py-2 bg-[#8B75AA] text-white rounded hover:bg-[#7A6699] transition-colors"
                    >
                      <Upload size={16} />
                      Upload Image
                    </button>
                  </div>

                  {guildForm.customEmblemPreview && (
                    <div className="flex items-center gap-3">
                      <img
                        src={guildForm.customEmblemPreview || "/placeholder.svg"}
                        alt="Custom emblem preview"
                        className="w-16 h-16 rounded-lg object-cover border border-[#CDAA7D]"
                      />
                      <div className="flex-1">
                        <p className="text-sm text-[#2C1A1D] font-medium">Custom emblem uploaded</p>
                        <p className="text-xs text-[#8B75AA]">This will be used as your guild emblem</p>
                      </div>
                      <button
                        onClick={() =>
                          setGuildForm((prev) => ({
                            ...prev,
                            customEmblemFile: null,
                            customEmblemPreview: "",
                            useCustomEmblem: false,
                          }))
                        }
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <p className="text-xs text-[#8B75AA] mt-2">
                    Upload a custom image (max 5MB). Recommended size: 256x256px
                  </p>
                </div>

                {/* Preset Emblems */}
                <div>
                  <p className="text-sm text-[#2C1A1D] mb-3">Or choose from preset emblems:</p>
                  <div className="grid grid-cols-8 gap-2">
                    {emblems.map((emblem) => (
                      <button
                        key={emblem}
                        type="button"
                        onClick={() =>
                          setGuildForm((prev) => ({
                            ...prev,
                            emblem,
                            useCustomEmblem: false,
                            customEmblemFile: null,
                            customEmblemPreview: "",
                          }))
                        }
                        className={`h-12 flex items-center justify-center text-xl border rounded-lg transition-colors ${
                          guildForm.emblem === emblem && !guildForm.useCustomEmblem
                            ? "border-[#8B75AA] bg-[#8B75AA]/10"
                            : "border-[#CDAA7D] hover:bg-[#CDAA7D]/10"
                        }`}
                      >
                        {emblem}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-[#2C1A1D] mb-2">TAGS (Max 5)</label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    placeholder="Add a tag..."
                    value={currentTag}
                    onChange={(e) => setCurrentTag(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && addTag()}
                    className="flex-1 px-4 py-2 border border-[#CDAA7D] rounded bg-white text-[#2C1A1D] focus:outline-none focus:border-[#8B75AA]"
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    disabled={guildForm.tags.length >= 5}
                    className="px-4 py-2 bg-[#8B75AA] text-white rounded hover:bg-[#7A6699] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Plus size={16} />
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {guildForm.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="bg-[#8B75AA]/10 text-[#8B75AA] px-3 py-1 rounded-full text-sm flex items-center gap-2"
                    >
                      {tag}
                      <button onClick={() => removeTag(index)} className="text-[#8B75AA] hover:text-red-500">
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Social Links */}
              <div>
                <label className="block text-sm font-medium text-[#2C1A1D] mb-2">SOCIAL LINKS</label>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <input
                    type="text"
                    placeholder="Platform (e.g., Discord)"
                    value={currentSocialPlatform}
                    onChange={(e) => setCurrentSocialPlatform(e.target.value)}
                    className="px-4 py-2 border border-[#CDAA7D] rounded bg-white text-[#2C1A1D] focus:outline-none focus:border-[#8B75AA]"
                  />
                  <input
                    type="url"
                    placeholder="URL"
                    value={currentSocialUrl}
                    onChange={(e) => setCurrentSocialUrl(e.target.value)}
                    className="px-4 py-2 border border-[#CDAA7D] rounded bg-white text-[#2C1A1D] focus:outline-none focus:border-[#8B75AA]"
                  />
                </div>
                <button
                  type="button"
                  onClick={addSocialLink}
                  className="w-full px-4 py-2 border border-[#8B75AA] text-[#8B75AA] rounded hover:bg-[#8B75AA] hover:text-white transition-colors flex items-center justify-center gap-2"
                >
                  <Plus size={16} />
                  Add Social Link
                </button>
                <div className="space-y-2 mt-3">
                  {guildForm.socialLinks.map((link, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-white p-3 rounded border border-[#CDAA7D]"
                    >
                      <div>
                        <span className="font-medium text-[#2C1A1D]">{link.platform}</span>
                        <p className="text-sm text-[#8B75AA] truncate">{link.url}</p>
                      </div>
                      <button onClick={() => removeSocialLink(index)} className="text-red-500 hover:text-red-700">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Settings */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-[#8B75AA] mb-4">
                <Settings size={20} />
                <h3 className="text-lg font-semibold">Guild Settings</h3>
              </div>

              {/* Privacy */}
              <div>
                <label className="block text-sm font-medium text-[#2C1A1D] mb-2">PRIVACY</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setGuildForm((prev) => ({ ...prev, privacy: "public" }))}
                    className={`p-4 border rounded-lg flex items-center gap-3 transition-colors ${
                      guildForm.privacy === "public"
                        ? "border-[#8B75AA] bg-[#8B75AA]/10 text-[#8B75AA]"
                        : "border-[#CDAA7D] hover:bg-[#CDAA7D]/10 text-[#2C1A1D]"
                    }`}
                  >
                    <Globe size={20} />
                    <div className="text-left">
                      <div className="font-medium">Public</div>
                      <div className="text-sm opacity-70">Anyone can find and join</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setGuildForm((prev) => ({ ...prev, privacy: "private" }))}
                    className={`p-4 border rounded-lg flex items-center gap-3 transition-colors ${
                      guildForm.privacy === "private"
                        ? "border-[#8B75AA] bg-[#8B75AA]/10 text-[#8B75AA]"
                        : "border-[#CDAA7D] hover:bg-[#CDAA7D]/10 text-[#2C1A1D]"
                    }`}
                  >
                    <Lock size={20} />
                    <div className="text-left">
                      <div className="font-medium">Private</div>
                      <div className="text-sm opacity-70">Invitation only</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Join Requirements */}
              <div className="space-y-4">
                <h4 className="font-medium text-[#2C1A1D]">Join Requirements</h4>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium text-[#2C1A1D]">Require Approval</span>
                    <p className="text-sm text-[#8B75AA]">New members need approval to join</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setGuildForm((prev) => ({ ...prev, requireApproval: !prev.requireApproval }))}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      guildForm.requireApproval ? "bg-[#8B75AA]" : "bg-gray-300"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full transition-transform ${
                        guildForm.requireApproval ? "translate-x-6" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#2C1A1D] mb-2">Minimum Level</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={guildForm.minimumLevel}
                    onChange={(e) =>
                      setGuildForm((prev) => ({ ...prev, minimumLevel: Number.parseInt(e.target.value) || 1 }))
                    }
                    className="w-full px-4 py-2 border border-[#CDAA7D] rounded bg-white text-[#2C1A1D] focus:outline-none focus:border-[#8B75AA]"
                  />
                </div>
              </div>

              {/* Visibility Settings */}
              <div className="space-y-4">
                <h4 className="font-medium text-[#2C1A1D]">Visibility</h4>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium text-[#2C1A1D]">Allow Discovery</span>
                    <p className="text-sm text-[#8B75AA]">Show in guild search results</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setGuildForm((prev) => ({ ...prev, allowDiscovery: !prev.allowDiscovery }))}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      guildForm.allowDiscovery ? "bg-[#8B75AA]" : "bg-gray-300"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full transition-transform ${
                        guildForm.allowDiscovery ? "translate-x-6" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium text-[#2C1A1D]">Show on Home Page</span>
                    <p className="text-sm text-[#8B75AA]">Feature in recommended guilds</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setGuildForm((prev) => ({ ...prev, showOnHomePage: !prev.showOnHomePage }))}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      guildForm.showOnHomePage ? "bg-[#8B75AA]" : "bg-gray-300"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full transition-transform ${
                        guildForm.showOnHomePage ? "translate-x-6" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Permissions */}
              <div className="space-y-4">
                <h4 className="font-medium text-[#2C1A1D]">Permissions</h4>

                <div>
                  <label className="block text-sm font-medium text-[#2C1A1D] mb-2">Who can post quests?</label>
                  <select
                    value={guildForm.whoCanPost}
                    onChange={(e) => setGuildForm((prev) => ({ ...prev, whoCanPost: e.target.value }))}
                    className="w-full px-4 py-2 border border-[#CDAA7D] rounded bg-white text-[#2C1A1D] focus:outline-none focus:border-[#8B75AA]"
                  >
                    <option value="members">All Members</option>
                    <option value="admins">Admins Only</option>
                    <option value="owner">Owner Only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#2C1A1D] mb-2">Who can invite members?</label>
                  <select
                    value={guildForm.whoCanInvite}
                    onChange={(e) => setGuildForm((prev) => ({ ...prev, whoCanInvite: e.target.value }))}
                    className="w-full px-4 py-2 border border-[#CDAA7D] rounded bg-white text-[#2C1A1D] focus:outline-none focus:border-[#8B75AA]"
                  >
                    <option value="members">All Members</option>
                    <option value="admins">Admins Only</option>
                    <option value="owner">Owner Only</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6 border-t border-[#CDAA7D] mt-8">
            <button
              onClick={currentStep === 1 ? onClose : prevStep}
              className="px-6 py-3 border border-[#CDAA7D] rounded font-medium text-[#2C1A1D] hover:bg-[#CDAA7D] hover:text-white transition-colors"
            >
              {currentStep === 1 ? "Cancel" : "Previous"}
            </button>

            <button
              onClick={currentStep === 3 ? handleSubmit : nextStep}
              className="px-6 py-3 bg-[#8B75AA] text-white rounded font-medium hover:bg-[#7A6699] transition-colors"
            >
              {currentStep === 3 ? "Create Guild" : "Next"}
            </button>
          </div>
        </div>
        {/* Confirmation Modal */}
        <ConfirmationModal
          isOpen={showConfirmation}
          onClose={() => setShowConfirmation(false)}
          onConfirm={handleConfirmSubmit}
          title="Confirm Guild Creation"
          message={`Are you sure you want to create "${guildForm.name}" guild?`}
          goldAmount={0}
          confirmText="Create Guild"
        />
      </div>
    </div>
  )
}
