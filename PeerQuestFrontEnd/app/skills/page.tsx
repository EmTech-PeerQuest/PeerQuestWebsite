"use client";

import { useState, useEffect } from "react";
import { skillsApi } from "@/lib/api";

export default function SkillsPage() {
  const [skillsByCategory, setSkillsByCategory] = useState<any>({});
  const [userSkills, setUserSkills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSkills, setSelectedSkills] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load available skills
      const skillsResponse = await skillsApi.getSkills();
      if (skillsResponse.success) {
        setSkillsByCategory(skillsResponse.skills_by_category);
      }
      
      // Load user's current skills
      const userSkillsResponse = await skillsApi.getUserSkills();
      if (userSkillsResponse.success) {
        setUserSkills(userSkillsResponse.skills);
        
        // Mark user's skills as selected
        const userSkillIds = new Set<string>(userSkillsResponse.skills.map((s: any) => s.skill_id as string));
        setSelectedSkills(userSkillIds);
      }
    } catch (error) {
      console.error("Error loading skills:", error);
      setError("Failed to load skills. Please make sure you're logged in.");
    } finally {
      setLoading(false);
    }
  };

  const handleSkillToggle = (skillId: string) => {
    const newSelected = new Set(selectedSkills);
    if (newSelected.has(skillId)) {
      newSelected.delete(skillId);
    } else {
      newSelected.add(skillId);
    }
    setSelectedSkills(newSelected);
  };

  const handleSaveSkills = async () => {
    try {
      const skillsToSave = Array.from(selectedSkills).map(skillId => ({
        skill_id: skillId,
        proficiency_level: 'beginner',
        years_experience: 0
      }));

      const response = await skillsApi.updateUserSkills({ skills: skillsToSave });
      if (response.success) {
        alert("Skills updated successfully!");
        loadData(); // Reload to get updated data
      } else {
        alert("Failed to update skills");
      }
    } catch (error) {
      console.error("Error saving skills:", error);
      alert("Failed to save skills");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F0E6] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B75AA] mx-auto mb-4"></div>
          <p className="text-[#2C1A1D]">Loading skills...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F4F0E6] flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-[#2C1A1D] mb-2">Error</h2>
          <p className="text-[#8B75AA] mb-4">{error}</p>
          <button 
            onClick={() => window.location.href = '/'}
            className="px-4 py-2 bg-[#8B75AA] text-white rounded hover:bg-[#7A6699]"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F0E6] p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-3xl font-bold text-[#2C1A1D] mb-2">🎯 Skills & Expertise</h1>
          <p className="text-[#8B75AA]">
            Select your skills to help others find you for collaborations.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="bg-[#8B75AA]/10 text-[#8B75AA] px-3 py-1 rounded-full text-sm">
              {selectedSkills.size} skills selected
            </span>
          </div>
        </div>

        {/* Current Skills */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-[#2C1A1D] mb-4">
            Your Current Skills ({userSkills.length})
          </h2>
          
          {userSkills.length > 0 ? (
            <div className="flex flex-wrap gap-2 mb-4">
              {userSkills.map((skill) => (
                <span
                  key={skill.id}
                  className="px-3 py-1 bg-[#8B75AA] text-white rounded-full text-sm"
                >
                  {skill.skill_name} ({skill.proficiency_level})
                </span>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 mb-4">No skills selected yet.</p>
          )}
          
          <button
            onClick={handleSaveSkills}
            className="px-6 py-2 bg-[#8B75AA] text-white rounded-lg hover:bg-[#7A6699] transition-colors"
          >
            💾 Save Skills ({selectedSkills.size})
          </button>
        </div>

        {/* Skills by Category */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-[#2C1A1D] mb-6">Select Your Skills</h2>
          
          {Object.entries(skillsByCategory).map(([category, categorySkills]) => (
            <div key={category} className="mb-8">
              <h3 className="text-lg font-medium text-[#2C1A1D] mb-4 border-b-2 border-[#8B75AA] pb-2">
                {category}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {(categorySkills as any[]).map((skill) => (
                  <div
                    key={skill.id}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedSkills.has(skill.id)
                        ? 'border-[#8B75AA] bg-[#8B75AA] text-white'
                        : 'border-gray-200 hover:border-[#8B75AA] hover:bg-[#8B75AA] hover:text-white'
                    }`}
                    onClick={() => handleSkillToggle(skill.id)}
                  >
                    <div className="font-medium">{skill.name}</div>
                    {skill.description && (
                      <div className="text-sm mt-1 opacity-80">{skill.description}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
