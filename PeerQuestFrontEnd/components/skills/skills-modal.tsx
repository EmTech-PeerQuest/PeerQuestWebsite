"use client";

import { useState, useEffect } from "react";
import { skillsApi } from "@/lib/api";
import { X } from "lucide-react";

interface SkillsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSkillsUpdated?: () => void;
}

export default function SkillsModal({ isOpen, onClose, onSkillsUpdated }: SkillsModalProps) {
  // Debug state for payload and backend
  const [debugPayload, setDebugPayload] = useState<string>('');
  const [debugBackend, setDebugBackend] = useState<string>('');
  const [skillsByCategory, setSkillsByCategory] = useState<any>({});
  const [userSkills, setUserSkills] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSkills, setSelectedSkills] = useState<Set<string>>(new Set());
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  // Only set selectedSkills to user's saved skills on modal open (first open)
  // On open, always start with user's saved skills as selected
  // On open, always start with user's saved skills as selected, but only if they exist in available skills
  // Always initialize selectedSkills to user's saved skills on every open, but only if the modal is opening (not on every userSkills change)
  // Always sync selectedSkills to user's saved skills when modal opens or when userSkills or skillsByCategory change while open
  // Always sync selectedSkills to user's saved skills when modal opens or after save/refresh
  useEffect(() => {
    if (isOpen) {
      if (userSkills && Array.isArray(userSkills) && skillsByCategory && Object.keys(skillsByCategory).length > 0) {
        const availableSkillIds = new Set(
          Object.values(skillsByCategory).flat().map((s: any) => String(s.id))
        );
        const userSkillIds: string[] = userSkills
          .map((s: any) => String(s.skill_id || s.id))
          .filter((id: string) => availableSkillIds.has(id));
        setSelectedSkills(new Set(userSkillIds));
      }
    } else {
      setSelectedSkills(new Set());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, userSkills, skillsByCategory]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load available skills
      const skillsResponse = await skillsApi.getSkills();
      if (skillsResponse.success) {
        // Patch: Convert string arrays to skill objects if needed
        const raw = skillsResponse.skills_by_category;
        const patched: Record<string, any[]> = {};
        Object.entries(raw).forEach(([cat, arr]) => {
          if (Array.isArray(arr) && arr.length > 0 && typeof arr[0] === 'string') {
            patched[cat] = arr.map((name: string) => ({ id: name, name }));
          } else if (Array.isArray(arr)) {
            patched[cat] = arr;
          } else {
            patched[cat] = [];
          }
        });
        setSkillsByCategory(patched);
        const categories = Object.keys(patched);
        setActiveCategory(categories.length > 0 ? categories[0] : null);
      } else {
        setSkillsByCategory({});
        setActiveCategory(null);
      }

      // Load user's current skills
      const userSkillsResponse = await skillsApi.getUserSkills();
      if (userSkillsResponse.success) {
        setUserSkills(userSkillsResponse.skills);
        // Do NOT update selectedSkills here; let user control their selection
      } else {
        setUserSkills([]);
      }
    } catch (error) {
      console.error("Error loading skills:", error);
      setError("Failed to load skills. Please make sure you're logged in.");
      setSkillsByCategory({});
      setActiveCategory(null);
      setUserSkills([]);
    } finally {
      setLoading(false);
    }
  };

  const isValidUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);

  // Toggle skill selection, but do not reset all selected skills on reload
  const handleSkillToggle = (skillId: string) => {
    // Only allow selection of skills with valid UUIDs
    if (!isValidUUID(skillId)) return;
    setSelectedSkills(prev => {
      const newSelected = new Set(prev);
      if (newSelected.has(skillId)) {
        newSelected.delete(skillId);
      } else {
        if (newSelected.size < 10) {
          newSelected.add(skillId);
        }
      }
      return newSelected;
    });
  };

  const handleSaveSkills = async () => {
    if (selectedSkills.size === 0) {
      alert("Please select at least one skill before saving.");
      return;
    }
    // Only include valid UUIDs in the payload
    const availableSkillIds = new Set(
      Object.values(skillsByCategory).flat().map((s: any) => String(s.id)).filter(isValidUUID)
    );
    const skillsToSave = Array.from(selectedSkills)
      .filter(skillId => !!skillId && availableSkillIds.has(skillId))
      .map(skillId => ({
        skill_id: skillId,
        proficiency_level: 'beginner',
        years_experience: 0
      }));
    if (skillsToSave.length === 0) {
      alert("No valid skills selected. Please select skills with a valid ID.");
      return;
    }
    const payload = { skills: skillsToSave };
    setDebugPayload(JSON.stringify(payload, null, 2));
    try {
      setSaving(true);
      setError(null);
      let response;
      try {
        response = await skillsApi.updateUserSkills(payload);
        setDebugBackend(`SUCCESS\n${JSON.stringify(response, null, 2)}`);
        // Success feedback
        const successDiv = document.createElement('div');
        successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
        successDiv.textContent = '✓ Skills updated successfully!';
        document.body.appendChild(successDiv);
        setTimeout(() => document.body.removeChild(successDiv), 3000);
        // Reload data and notify parent
        await loadData();
        onSkillsUpdated?.();
        // Close modal after a brief delay
        setTimeout(() => onClose(), 1000);
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
        setError(`Failed to save skills. Backend: ${backendErrStr}`);
        return;
      }
    } catch (err) {
      setDebugBackend(`EXCEPTION\n${String(err)}`);
      setError('Failed to save skills. Unexpected error: ' + err);
    } finally {
      setSaving(false);
    }
  // Debug panel removed for production stability
  };

  const categories = Object.keys(skillsByCategory);

  if (!isOpen) return null;
  return (
    <>
      {/* Debug panel removed */}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-2xl font-bold text-[#2C1A1D]">🎯 Manage Your Skills</h2>
              <p className="text-[#8B75AA] mt-1">
                Select skills to showcase your expertise
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>
          {/* Content */}
          <div className="flex h-[70vh]">
            {/* Categories Sidebar */}
            <div className="w-64 bg-gray-50 border-r border-gray-200 overflow-y-auto">
              <div className="p-4">
                <h3 className="font-semibold text-[#2C1A1D] mb-3">Categories</h3>
                <div className="space-y-1">
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
            {/* Skills Content */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B75AA] mx-auto mb-4"></div>
                    <p className="text-[#2C1A1D]">Loading skills...</p>
                  </div>
                </div>
              ) : error ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="text-4xl mb-4">⚠️</div>
                    <h3 className="text-lg font-bold text-[#2C1A1D] mb-2">Error</h3>
                    <p className="text-[#8B75AA] mb-4">{error}</p>
                    <button 
                      onClick={loadData}
                      className="px-4 py-2 bg-[#8B75AA] text-white rounded hover:bg-[#7A6699]"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-6">
                  {/* Current Skills Summary */}
                  <div className="mb-6 p-4 bg-[#8B75AA]/5 rounded-lg border border-[#8B75AA]/20">
                    <h4 className="font-semibold text-[#2C1A1D] mb-2">
                      Your Saved Skills ({userSkills.length})
                    </h4>
                    {userSkills.length > 0 ? (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {userSkills.slice(0, 10).map((skill: any, idx: number) => (
                          <span
                            key={String(skill.skill_id || skill.id) + '-' + idx}
                            className="px-2 py-1 bg-[#8B75AA] text-white rounded text-sm"
                            title={skill.proficiency_level ? `Proficiency: ${skill.proficiency_level}, Years: ${skill.years_experience}` : undefined}
                          >
                            {skill.name || skill.skill_name || skill.skill?.name || skill.skill_id}
                          </span>
                        ))}
                        {userSkills.length > 10 && (
                          <span key="user-more" className="px-2 py-1 bg-gray-200 text-gray-600 rounded text-sm">
                            +{userSkills.length - 10} more
                          </span>
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">No skills saved yet</p>
                    )}
                    <h4 className="font-semibold text-[#2C1A1D] mt-4 mb-2">
                      Selected (to save) ({selectedSkills.size})
                    </h4>
                    {selectedSkills.size > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {Array.from(selectedSkills).slice(0, 10).map((skillId, idx) => {
                          const skill = Object.values(skillsByCategory).flat().find((s: any) => String(s.id) === skillId) as any;
                          return skill ? (
                            <span
                              key={String(skill.id) + '-' + idx}
                              className="px-2 py-1 bg-[#CDAA7D] text-[#2C1A1D] rounded text-sm"
                            >
                              {skill.name}
                            </span>
                          ) : null;
                        })}
                        {selectedSkills.size > 10 && (
                          <span key="selected-more" className="px-2 py-1 bg-gray-200 text-gray-600 rounded text-sm">
                            +{selectedSkills.size - 10} more
                          </span>
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">No skills selected yet</p>
                    )}
                  </div>
                  {/* Skills Grid */}
                  {activeCategory && (
                    <>
                      <h3 className="text-xl font-semibold text-[#2C1A1D] mb-4">
                        {activeCategory}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {Array.isArray(skillsByCategory[activeCategory]) && skillsByCategory[activeCategory].length > 0 ? (
                          skillsByCategory[activeCategory].map((skill: any, idx: number) => {
                            if (!skill || !skill.id) return null;
                            const skillIdStr = String(skill.id);
                            const isSelected = selectedSkills.has(skillIdStr);
                            return (
                              <div
                                key={String(skill.id) + '-' + idx}
                                className={`p-3 rounded-lg border-2 transition-all flex flex-col gap-2 ${
                                  isSelected
                                    ? "border-[#8B75AA] bg-[#8B75AA] text-white"
                                    : "border-gray-200 hover:border-[#8B75AA] hover:bg-[#8B75AA]/10 hover:text-[#2C1A1D]"
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1">
                                    <h4 className="font-medium">{skill.name}</h4>
                                    {skill.description && (
                                      <p className="text-sm mt-1 opacity-80">{skill.description}</p>
                                    )}
                                  </div>
                                  {/* Select/Remove button */}
                                  <button
                                    aria-label={isSelected ? `Remove ${skill.name}` : `Add ${skill.name}`}
                                    onClick={e => {
                                      e.stopPropagation();
                                      handleSkillToggle(skillIdStr);
                                    }}
                                    className={`w-8 h-8 flex items-center justify-center rounded-full border-2 transition-colors focus:outline-none focus:ring-2 focus:ring-[#8B75AA] ml-2
                                      ${isSelected
                                        ? "bg-white border-white text-[#8B75AA] hover:bg-[#F3EFFF] hover:border-[#8B75AA]"
                                        : "bg-[#8B75AA]/10 border-[#8B75AA] text-[#8B75AA] hover:bg-[#8B75AA] hover:text-white"}
                                    `}
                                    tabIndex={0}
                                  >
                                    {isSelected ? (
                                      <span className="text-lg font-bold" title="Remove">−</span>
                                    ) : (
                                      <span className="text-lg font-bold" title="Add">＋</span>
                                    )}
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-gray-400 text-center col-span-3 py-8">No skills found in this category.</div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
            <div className="text-sm text-gray-600">
              {selectedSkills.size} skills selected
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSkills}
                disabled={saving || selectedSkills.size === 0}
                className="px-6 py-2 bg-[#8B75AA] hover:bg-[#7A6699] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    💾 Save Skills
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
