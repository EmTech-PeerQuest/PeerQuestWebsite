"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/AuthContext";
import axios from "axios";

interface ProfileCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const ProfileCompletionModal: React.FC<ProfileCompletionModalProps> = ({
  isOpen,
  onClose,
  onComplete,
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    birthday: "",
    gender: "",
    location: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem("access_token");
      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users/settings/`,
        {
          birthday: formData.birthday || null,
          gender: formData.gender || null,
          location: formData.location || null,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      onComplete();
      onClose();
    } catch (error) {
      console.error("Failed to update profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#2A1E23] p-6 rounded-lg max-w-md w-full mx-4">
        <h2 className="text-xl font-bold text-[#F4F0E6] mb-4">
          Complete Your Profile
        </h2>
        <p className="text-[#F4F0E6]/80 mb-6">
          Help us personalize your experience by completing your profile information.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#F4F0E6] mb-2">
              Birthday (Optional)
            </label>
            <input
              type="date"
              value={formData.birthday}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, birthday: e.target.value }))
              }
              className="w-full px-3 py-2 bg-[#3D2A2F] border border-[#CDAA7D] rounded text-[#F4F0E6] focus:outline-none focus:border-[#8B75AA]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#F4F0E6] mb-2">
              Gender (Optional)
            </label>
            <select
              value={formData.gender}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, gender: e.target.value }))
              }
              className="w-full px-3 py-2 bg-[#3D2A2F] border border-[#CDAA7D] rounded text-[#F4F0E6] focus:outline-none focus:border-[#8B75AA]"
            >
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="prefer-not-to-say">Prefer not to say</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#F4F0E6] mb-2">
              Location (Optional)
            </label>
            <select
              value={formData.location}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, location: e.target.value }))
              }
              className="w-full px-3 py-2 bg-[#3D2A2F] border border-[#CDAA7D] rounded text-[#F4F0E6] focus:outline-none focus:border-[#8B75AA]"
            >
              <option value="">Select location</option>
              <option value="United States">United States</option>
              <option value="Canada">Canada</option>
              <option value="United Kingdom">United Kingdom</option>
              <option value="Australia">Australia</option>
              <option value="Germany">Germany</option>
              <option value="France">France</option>
              <option value="Japan">Japan</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={handleSkip}
              className="flex-1 px-4 py-2 border border-[#CDAA7D] text-[#F4F0E6] rounded hover:bg-[#3D2A2F] transition-colors"
            >
              Skip for now
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-[#8B75AA] text-white rounded hover:bg-[#7A6699] transition-colors disabled:opacity-50"
            >
              {loading ? "Saving..." : "Complete Profile"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileCompletionModal;
