"use client"

import { useState, useEffect } from "react"
import { skillsApi } from "@/lib/api"
import { ChevronDown, ChevronUp, Plus, X, Star } from "lucide-react"

interface Skill {
  id: string
  name: string
  category: string
  description?: string
}

interface UserSkill {
  id?: string
  skill_id: string
  skill_name: string
  skill_category: string
  proficiency_level: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  years_experience?: number
}

interface SkillRecommendation {
  category: string
  recommended_skills: string[]
  recommendation_reason: string
}

interface SkillsManagementProps {
  showToast: (message: string, type?: string) => void
}

export function SkillsManagement({ showToast }: SkillsManagementProps) {
  const [skillsByCategory, setSkillsByCategory] = useState<{[key: string]: Skill[]}>({})
  const [userSkills, setUserSkills] = useState<UserSkill[]>([])
  const [recommendations, setRecommendations] = useState<SkillRecommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [showRecommendations, setShowRecommendations] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [skillsResponse, userSkillsResponse, recommendationsResponse] = await Promise.all([
        skillsApi.getSkills(),
        skillsApi.getUserSkills(),
        skillsApi.getSkillRecommendations()
      ])

      if (skillsResponse.success) {
        setSkillsByCategory(skillsResponse.skills_by_category || {})
      }

      if (userSkillsResponse.success) {
        setUserSkills(userSkillsResponse.skills || [])
      }

      if (recommendationsResponse.success) {
        setRecommendations(recommendationsResponse.recommendations || [])
      }
    } catch (error) {
      console.error('Error loading skills data:', error)
      showToast('Failed to load skills data', 'error')
    } finally {
      setLoading(false)
    }
  }

  const addSkill = (skill: Skill) => {
    const newSkill: UserSkill = {
      skill_id: skill.id,
      skill_name: skill.name,
      skill_category: skill.category,
      proficiency_level: 'beginner',
      years_experience: 0
    }
    setUserSkills([...userSkills, newSkill])
  }

  const removeSkill = (skillId: string) => {
    setUserSkills(userSkills.filter(skill => skill.skill_id !== skillId))
  }

  const updateSkill = (skillId: string, updates: Partial<UserSkill>) => {
    setUserSkills(userSkills.map(skill => 
      skill.skill_id === skillId ? { ...skill, ...updates } : skill
    ))
  }

  const saveSkills = async () => {
    try {
      setLoading(true)
      const response = await skillsApi.updateUserSkills(userSkills)
      
      if (response.success) {
        showToast('Skills updated successfully!')
        loadData() // Reload to get updated recommendations
      } else {
        showToast('Failed to update skills', 'error')
      }
    } catch (error) {
      console.error('Error saving skills:', error)
      showToast('Failed to save skills', 'error')
    } finally {
      setLoading(false)
    }
  }

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(category)) {
      newExpanded.delete(category)
    } else {
      newExpanded.add(category)
    }
    setExpandedCategories(newExpanded)
  }

  const isSkillAdded = (skillId: string) => {
    return userSkills.some(skill => skill.skill_id === skillId)
  }

  const getProficiencyColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-gray-100 text-gray-800'
      case 'intermediate': return 'bg-blue-100 text-blue-800'
      case 'advanced': return 'bg-green-100 text-green-800'
      case 'expert': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8B75AA] mx-auto mb-4"></div>
        <p className="text-[#2C1A1D]">Loading skills...</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-[#2C1A1D]">Skills Management</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowRecommendations(!showRecommendations)}
            className="px-4 py-2 bg-[#CDAA7D] text-[#2C1A1D] rounded hover:bg-[#B8956A] transition-colors"
          >
            {showRecommendations ? 'Hide' : 'Show'} Recommendations
          </button>
          <button
            onClick={saveSkills}
            disabled={loading}
            className="px-4 py-2 bg-[#8B75AA] text-white rounded hover:bg-[#7A6699] disabled:opacity-50 transition-colors"
          >
            Save Skills
          </button>
        </div>
      </div>

      {/* Current Skills */}
      <div className="bg-white rounded-lg border border-[#CDAA7D] p-4">
        <h3 className="text-lg font-semibold text-[#2C1A1D] mb-4">Your Skills</h3>
        {userSkills.length === 0 ? (
          <p className="text-[#8B75AA] text-center py-8">No skills added yet. Add some skills below!</p>
        ) : (
          <div className="grid gap-3">
            {userSkills.map((skill) => (
              <div key={skill.skill_id} className="flex items-center justify-between p-3 bg-[#F4F0E6] rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium text-[#2C1A1D]">{skill.skill_name}</span>
                    <span className="text-xs text-[#8B75AA]">({skill.skill_category})</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-[#2C1A1D]">Level:</label>
                      <select
                        value={skill.proficiency_level}
                        onChange={(e) => updateSkill(skill.skill_id, { proficiency_level: e.target.value as any })}
                        className={`px-2 py-1 rounded text-xs font-medium ${getProficiencyColor(skill.proficiency_level)}`}
                      >
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                        <option value="expert">Expert</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-[#2C1A1D]">Experience:</label>
                      <input
                        type="number"
                        min="0"
                        max="20"
                        value={skill.years_experience || 0}
                        onChange={(e) => updateSkill(skill.skill_id, { years_experience: parseInt(e.target.value) })}
                        className="w-16 px-2 py-1 border border-[#CDAA7D] rounded text-sm"
                      />
                      <span className="text-xs text-[#8B75AA]">years</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => removeSkill(skill.skill_id)}
                  className="text-red-500 hover:text-red-700 p-1"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recommendations */}
      {showRecommendations && recommendations.length > 0 && (
        <div className="bg-white rounded-lg border border-[#CDAA7D] p-4">
          <h3 className="text-lg font-semibold text-[#2C1A1D] mb-4 flex items-center gap-2">
            <Star className="text-[#CDAA7D]" size={20} />
            Recommended Skills
          </h3>
          <div className="space-y-4">
            {recommendations.map((rec, index) => (
              <div key={index} className="border border-[#CDAA7D] rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-[#2C1A1D]">{rec.category}</h4>
                  <span className="text-xs text-[#8B75AA]">{rec.recommendation_reason}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {rec.recommended_skills.map((skillName) => {
                    const skill = Object.values(skillsByCategory).flat().find(s => s.name === skillName)
                    if (!skill) return null
                    
                    return (
                      <button
                        key={skillName}
                        onClick={() => addSkill(skill)}
                        disabled={isSkillAdded(skill.id)}
                        className={`px-3 py-1 rounded text-sm flex items-center gap-1 ${
                          isSkillAdded(skill.id)
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                            : 'bg-[#8B75AA] text-white hover:bg-[#7A6699]'
                        }`}
                      >
                        <Plus size={12} />
                        {skillName}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available Skills */}
      <div className="bg-white rounded-lg border border-[#CDAA7D] p-4">
        <h3 className="text-lg font-semibold text-[#2C1A1D] mb-4">Available Skills</h3>
        <div className="space-y-2">
          {Object.entries(skillsByCategory).map(([category, skills]) => (
            <div key={category} className="border border-[#CDAA7D] rounded-lg">
              <button
                onClick={() => toggleCategory(category)}
                className="w-full p-3 flex items-center justify-between hover:bg-[#F4F0E6] rounded-lg"
              >
                <span className="font-medium text-[#2C1A1D]">{category}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-[#8B75AA]">{skills.length} skills</span>
                  {expandedCategories.has(category) ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </button>
              {expandedCategories.has(category) && (
                <div className="p-3 pt-0">
                  <div className="flex flex-wrap gap-2">
                    {skills.map((skill) => (
                      <button
                        key={skill.id}
                        onClick={() => addSkill(skill)}
                        disabled={isSkillAdded(skill.id)}
                        className={`px-3 py-1 rounded text-sm flex items-center gap-1 ${
                          isSkillAdded(skill.id)
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                            : 'bg-[#CDAA7D] text-[#2C1A1D] hover:bg-[#B8956A]'
                        }`}
                      >
                        <Plus size={12} />
                        {skill.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
