"use client"

import { useState, useEffect } from "react"
import { skillsApi } from "@/lib/api"

interface Skill {
  id: string
  name: string
  description: string
  category: string
}

interface UserSkill {
  id: string
  skill_id: string
  skill_name: string
  skill_category: string
  proficiency_level: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  years_experience: number
  is_verified: boolean
}

export default function SkillsManager() {
  const [skillsByCategory, setSkillsByCategory] = useState<Record<string, Skill[]>>({})
  const [userSkills, setUserSkills] = useState<UserSkill[]>([])
  const [selectedSkills, setSelectedSkills] = useState<Map<string, {
    proficiency_level: string
    years_experience: number
  }>>(new Map())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [debugPayload, setDebugPayload] = useState<string>('')
  const [debugBackend, setDebugBackend] = useState<string>('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Load available skills
      const skillsResponse = await skillsApi.getSkills()
      if (skillsResponse.success) {
        setSkillsByCategory(skillsResponse.skills_by_category)
        if (!activeCategory && Object.keys(skillsResponse.skills_by_category).length > 0) {
          setActiveCategory(Object.keys(skillsResponse.skills_by_category)[0])
        }
      }
      
      // Load user's current skills
      const userSkillsResponse = await skillsApi.getUserSkills()
      if (userSkillsResponse.success) {
        setUserSkills(userSkillsResponse.skills)
        // Only initialize selected skills if none are selected (first load)
        setSelectedSkills(prev => {
          if (prev.size === 0) {
            const skillsMap = new Map();
            userSkillsResponse.skills.forEach((skill: UserSkill) => {
              skillsMap.set(skill.skill_id, {
                proficiency_level: skill.proficiency_level,
                years_experience: skill.years_experience || 0
              })
            });
            return skillsMap;
          }
          return prev;
        });
      }
    } catch (error) {
      console.error("Error loading skills:", error)
      setError("Failed to load skills. Please make sure you're logged in.")
    } finally {
      setLoading(false)
    }
  }

  // Only allow up to 10 skills, never remove old skills unless user deselects
  const handleSkillToggle = (skill: Skill) => {
    if (!skill.id || skill.id === 'undefined') {
      console.warn('[DEBUG] Tried to toggle skill with invalid id:', skill);
      return;
    }
    setSelectedSkills(prev => {
      const newSelected = new Map(prev);
      if (newSelected.has(skill.id)) {
        newSelected.delete(skill.id);
      } else {
        if (newSelected.size < 10) {
          newSelected.set(skill.id, {
            proficiency_level: 'beginner',
            years_experience: 0
          });
        }
      }
      return newSelected;
    });
  }

  const updateSkillDetails = (skillId: string, field: string, value: any) => {
    if (!skillId || skillId === 'undefined') {
      // Don't update skills with invalid IDs
      return;
    }
    const newSelected = new Map(selectedSkills)
    const existing = newSelected.get(skillId) || { proficiency_level: 'beginner', years_experience: 0 }
    newSelected.set(skillId, { ...existing, [field]: value })
    setSelectedSkills(newSelected)
  }

  const saveSkills = async () => {
    if (selectedSkills.size === 0) {
      alert("Please select at least one skill before saving.");
      return;
    }
    // Only include valid UUIDs in the payload
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const skillsToSave = Array.from(selectedSkills.entries())
      .filter(([skillId]) => !!skillId && uuidRegex.test(skillId))
      .map(([skillId, details]) => ({
        skill_id: skillId,
        proficiency_level: details.proficiency_level,
        years_experience: details.years_experience
      }))
    const payload = { skills: skillsToSave }
    const payloadStr = JSON.stringify(payload, null, 2)
    setDebugPayload(payloadStr)
    console.log('[DEBUG] Saving skills payload:', payloadStr)
    try {
      setSaving(true)
      setError(null)
      let response;
      try {
        response = await skillsApi.updateUserSkills(payload)
        const backendStr = JSON.stringify(response, null, 2)
        setDebugBackend(`SUCCESS\n${backendStr}`)
        console.log('[DEBUG] Backend response:', backendStr)
      } catch (apiError: any) {
        let backendErrStr = '';
        let status = apiError?.response?.status;
        let url = apiError?.config?.url || apiError?.response?.config?.url || 'unknown';
        let method = apiError?.config?.method || apiError?.response?.config?.method || 'unknown';
        if (apiError.response && apiError.response.data) {
          backendErrStr = JSON.stringify(apiError.response.data, null, 2);
        } else if (apiError.message) {
          backendErrStr = apiError.message;
        } else {
          backendErrStr = String(apiError);
        }
        setDebugBackend(`ERROR\nStatus: ${status || 'unknown'}\nMethod: ${method}\nURL: ${url}\n${backendErrStr}`);
        console.error('[DEBUG] Backend error:', apiError, apiError?.response?.data);
        if (status === 404) {
          setError('Failed to save skills. Backend endpoint not found (404). Please contact support.');
        } else if (apiError.response && apiError.response.data) {
          setError(`Failed to save skills. Backend: ${backendErrStr}`);
        } else {
          setError(`Failed to save skills. Unknown backend error. Status: ${status || 'unknown'}`);
        }
        return;
      }
      if (response.success) {
        alert("Skills saved successfully!")
        await loadData() // Reload to get updated data
      } else {
        setDebugBackend(`FAILURE\n${JSON.stringify(response, null, 2)}`)
        setError("Failed to save skills. Please try again. " + (response.errors ? JSON.stringify(response.errors) : ''))
      }
    } catch (err) {
      console.error('[DEBUG] Top-level error in saveSkills:', err)
      setDebugBackend(`EXCEPTION\n${String(err)}`)
      setError('Failed to save skills. Unexpected error: ' + err)
    } finally {
      setSaving(false)
    }
  }

  const getAllSkills = () => {
    return Object.values(skillsByCategory).flat()
  }

  const categories = Object.keys(skillsByCategory)

  if (loading) {
    return (
      <>
        {/* Debug Panel */}
        <div style={{position:'fixed',bottom:0,right:0,zIndex:1000,background:'#fff',border:'1px solid #ccc',padding:'8px',maxWidth:'400px',maxHeight:'40vh',overflow:'auto',fontSize:'12px'}}>
          <b>DEBUG PAYLOAD:</b>
          <pre style={{whiteSpace:'pre-wrap',wordBreak:'break-all',margin:0}}>{debugPayload}</pre>
          <b>DEBUG BACKEND:</b>
          <pre style={{whiteSpace:'pre-wrap',wordBreak:'break-all',margin:0}}>{debugBackend}</pre>
        </div>
        <div className="min-h-screen bg-[#F4F0E6] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B75AA] mx-auto mb-4"></div>
            <p className="text-[#2C1A1D]">Loading skills...</p>
          </div>
        </div>
      </>
    )
  }

  if (error) {
    console.log('[DEBUG] Error UI:', error)
    return (
      <div className="min-h-screen bg-[#F4F0E6] flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-[#2C1A1D] mb-2">Error</h2>
          <p className="text-[#8B75AA] mb-4" style={{wordBreak: 'break-all', whiteSpace: 'pre-wrap'}}>{error}</p>
          <button 
            onClick={loadData}
            className="px-4 py-2 bg-[#8B75AA] text-white rounded hover:bg-[#7A6699]"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Debug Panel */}
      <div style={{position:'fixed',bottom:0,right:0,zIndex:1000,background:'#fff',border:'1px solid #ccc',padding:'8px',maxWidth:'400px',maxHeight:'40vh',overflow:'auto',fontSize:'12px'}}>
        <b>DEBUG PAYLOAD:</b>
        <pre style={{whiteSpace:'pre-wrap',wordBreak:'break-all',margin:0}}>{debugPayload}</pre>
        <b>DEBUG BACKEND:</b>
        <pre style={{whiteSpace:'pre-wrap',wordBreak:'break-all',margin:0}}>{debugBackend}</pre>
      </div>
      <div className="min-h-screen bg-[#F4F0E6] p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h1 className="text-3xl font-bold text-[#2C1A1D] mb-2">🎯 Skills & Expertise</h1>
            <p className="text-[#8B75AA]">
              Select your skills and set your proficiency levels to help others find you for collaborations.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="bg-[#8B75AA]/10 text-[#8B75AA] px-3 py-1 rounded-full text-sm">
                {selectedSkills.size} skills selected
              </span>
              {selectedSkills.size > 0 && (
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">
                  Ready to save
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Categories Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-4 sticky top-6">
                <h3 className="font-semibold text-[#2C1A1D] mb-4">Categories</h3>
                <div className="space-y-2">
                    {categories.map((category, idx) => (
                      <button
                        key={category + '-' + idx}
                        onClick={() => setActiveCategory(category)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                          activeCategory === category
                            ? "bg-[#8B75AA] text-white"
                            : "hover:bg-[#8B75AA]/10 text-[#2C1A1D]"
                        }`}
                      >
                        {category}
                        <span className="float-right text-xs opacity-70">
                          {skillsByCategory[category]?.length || 0}
                        </span>
                      </button>
                    ))}
                </div>
              </div>
            </div>

            {/* Skills Grid */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-lg shadow-sm p-6">
                {activeCategory && (
                  <>
                    <h2 className="text-xl font-semibold text-[#2C1A1D] mb-4">
                      {activeCategory}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Array.isArray(skillsByCategory[activeCategory]) && skillsByCategory[activeCategory].length > 0 ? (
                        skillsByCategory[activeCategory].map((skill, idx) => {
                          if (!skill || !skill.id) return null;
                          const isSelected = selectedSkills.has(skill.id)
                          const skillDetails = selectedSkills.get(skill.id)
                          return (
                            <div
                              key={String(skill.id) + '-' + idx}
                              className={`border rounded-lg p-4 transition-all relative ${
                                isSelected
                                  ? "border-[#8B75AA] bg-[#8B75AA]/10"
                                  : "border-gray-200 hover:border-[#8B75AA]/30"
                              }`}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h3 className="font-medium text-[#2C1A1D]">{skill.name}</h3>
                                  {skill.description && (
                                    <p className="text-sm text-gray-600 mt-1">{skill.description}</p>
                                  )}
                                </div>
                                <button
                                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors text-lg font-bold ml-2 ${
                                    isSelected
                                      ? "bg-[#8B75AA] border-[#8B75AA] text-white hover:bg-[#CDAA7D] hover:border-[#CDAA7D] hover:text-[#2C1A1D]"
                                      : "border-gray-300 bg-white text-[#8B75AA] hover:bg-[#8B75AA]/10"
                                  }`}
                                  aria-label={isSelected ? `Remove ${skill.name}` : `Select ${skill.name}`}
                                  onClick={e => {
                                    e.stopPropagation();
                                    handleSkillToggle(skill);
                                  }}
                                >
                                  {isSelected ? '−' : '+'}
                                </button>
                              </div>
                              {isSelected && (
                                <div className="mt-4 space-y-3" onClick={(e) => e.stopPropagation()}>
                                  <div>
                                    <label className="block text-sm font-medium text-[#2C1A1D] mb-1">
                                      Proficiency Level
                                    </label>
                                    <select
                                      value={skillDetails?.proficiency_level || 'beginner'}
                                      onChange={(e) => updateSkillDetails(skill.id, 'proficiency_level', e.target.value)}
                                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                                    >
                                      <option value="beginner">Beginner</option>
                                      <option value="intermediate">Intermediate</option>
                                      <option value="advanced">Advanced</option>
                                      <option value="expert">Expert</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-[#2C1A1D] mb-1">
                                      Years of Experience
                                    </label>
                                    <input
                                      type="number"
                                      min="0"
                                      max="50"
                                      value={skillDetails?.years_experience || 0}
                                      onChange={(e) => updateSkillDetails(skill.id, 'years_experience', parseInt(e.target.value) || 0)}
                                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        })
                      ) : (
                        <div className="text-gray-400 text-center col-span-2 py-8">No skills found in this category.</div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Save Button */}
          {selectedSkills.size > 0 && (
            <div className="fixed bottom-6 right-6">
              <button
                onClick={saveSkills}
                disabled={saving}
                className="bg-[#8B75AA] hover:bg-[#7A6699] disabled:opacity-50 text-white px-6 py-3 rounded-lg shadow-lg transition-colors flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    💾 Save Skills ({selectedSkills.size})
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
