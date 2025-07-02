"use client"

import { useState } from "react"
import { X, Upload, Shield, AlertCircle } from "lucide-react"

interface KYCVerificationModalProps {
  isOpen: boolean
  onClose: () => void
  onComplete: () => void
  cashoutAmount: number
  showToast?: (message: string, type?: string) => void
}

export function KYCVerificationModal({
  isOpen,
  onClose,
  onComplete,
  cashoutAmount,
  showToast,
}: KYCVerificationModalProps) {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    fullName: "",
    birthDate: "",
    address: "",
    phoneNumber: "",
    idType: "national-id",
    idFront: null as File | null,
    idBack: null as File | null,
    selfie: null as File | null,
  })

  if (!isOpen) return null

  const handleFileUpload = (field: string, file: File | null) => {
    setFormData((prev) => ({ ...prev, [field]: file }))
  }

  const handleSubmit = () => {
    // Validate all required fields
    const requiredFields = ["fullName", "birthDate", "address", "phoneNumber"]
    const missingFields = requiredFields.filter((field) => !formData[field as keyof typeof formData])

    if (missingFields.length > 0 || !formData.idFront || !formData.idBack || !formData.selfie) {
      if (showToast) {
        showToast("Please complete all required fields and upload all documents", "error")
      }
      return
    }

    // Simulate KYC submission
    if (showToast) {
      showToast(
        "KYC verification submitted successfully. Your cashout will be processed within 5-7 business days.",
        "success",
      )
    }

    onComplete()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#F4F0E6] rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden relative">
        {/* Header */}
        <div className="bg-[#CDAA7D] px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-[#2C1A1D]">KYC Verification Required</h2>
          <button onClick={onClose} className="text-[#2C1A1D] hover:text-[#8B75AA] transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Alert */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle size={20} className="text-yellow-600" />
              <span className="font-semibold text-yellow-800">Verification Required</span>
            </div>
            <p className="text-sm text-yellow-700">
              Cashouts of ₱1,000 or more require identity verification to comply with financial regulations and prevent
              fraud.
            </p>
            <p className="text-sm text-yellow-700 mt-1">
              <strong>Cashout Amount:</strong> {cashoutAmount.toLocaleString()} coins (₱
              {(cashoutAmount * 0.07).toFixed(2)})
            </p>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  step >= 1 ? "bg-[#8B75AA] text-white" : "bg-gray-300 text-gray-600"
                }`}
              >
                1
              </div>
              <div className={`w-16 h-1 ${step >= 2 ? "bg-[#8B75AA]" : "bg-gray-300"}`}></div>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  step >= 2 ? "bg-[#8B75AA] text-white" : "bg-gray-300 text-gray-600"
                }`}
              >
                2
              </div>
            </div>
          </div>

          {/* Step 1: Personal Information */}
          {step === 1 && (
            <div>
              <h3 className="text-lg font-bold text-[#2C1A1D] mb-4">Personal Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#2C1A1D] mb-2">Full Name (as shown on ID)</label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, fullName: e.target.value }))}
                    className="w-full px-3 py-2 border border-[#CDAA7D] rounded focus:outline-none focus:border-[#8B75AA]"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#2C1A1D] mb-2">Date of Birth</label>
                  <input
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => setFormData((prev) => ({ ...prev, birthDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-[#CDAA7D] rounded focus:outline-none focus:border-[#8B75AA]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#2C1A1D] mb-2">Complete Address</label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                    className="w-full px-3 py-2 border border-[#CDAA7D] rounded focus:outline-none focus:border-[#8B75AA]"
                    rows={3}
                    placeholder="Enter your complete address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#2C1A1D] mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData((prev) => ({ ...prev, phoneNumber: e.target.value }))}
                    className="w-full px-3 py-2 border border-[#CDAA7D] rounded focus:outline-none focus:border-[#8B75AA]"
                    placeholder="+63 9XX XXX XXXX"
                  />
                </div>

                <button
                  onClick={() => setStep(2)}
                  disabled={!formData.fullName || !formData.birthDate || !formData.address || !formData.phoneNumber}
                  className={`w-full py-3 rounded font-medium transition-colors ${
                    formData.fullName && formData.birthDate && formData.address && formData.phoneNumber
                      ? "bg-[#8B75AA] text-white hover:bg-[#7A6699]"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  Continue to Document Upload
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Document Upload */}
          {step === 2 && (
            <div>
              <h3 className="text-lg font-bold text-[#2C1A1D] mb-4">Document Upload</h3>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-[#2C1A1D] mb-2">ID Type</label>
                  <select
                    value={formData.idType}
                    onChange={(e) => setFormData((prev) => ({ ...prev, idType: e.target.value }))}
                    className="w-full px-3 py-2 border border-[#CDAA7D] rounded focus:outline-none focus:border-[#8B75AA]"
                  >
                    <option value="national-id">National ID</option>
                    <option value="drivers-license">Driver's License</option>
                    <option value="passport">Passport</option>
                    <option value="postal-id">Postal ID</option>
                    <option value="voters-id">Voter's ID</option>
                  </select>
                </div>

                {/* ID Front Upload */}
                <div>
                  <label className="block text-sm font-medium text-[#2C1A1D] mb-2">ID Front Side</label>
                  <div className="border-2 border-dashed border-[#CDAA7D] rounded-lg p-6 text-center">
                    <Upload size={32} className="mx-auto text-[#8B75AA] mb-2" />
                    <p className="text-sm text-[#8B75AA] mb-2">
                      {formData.idFront ? formData.idFront.name : "Click to upload or drag and drop"}
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload("idFront", e.target.files?.[0] || null)}
                      className="hidden"
                      id="id-front"
                    />
                    <label
                      htmlFor="id-front"
                      className="inline-block px-4 py-2 bg-[#8B75AA] text-white rounded cursor-pointer hover:bg-[#7A6699]"
                    >
                      Choose File
                    </label>
                  </div>
                </div>

                {/* ID Back Upload */}
                <div>
                  <label className="block text-sm font-medium text-[#2C1A1D] mb-2">ID Back Side</label>
                  <div className="border-2 border-dashed border-[#CDAA7D] rounded-lg p-6 text-center">
                    <Upload size={32} className="mx-auto text-[#8B75AA] mb-2" />
                    <p className="text-sm text-[#8B75AA] mb-2">
                      {formData.idBack ? formData.idBack.name : "Click to upload or drag and drop"}
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload("idBack", e.target.files?.[0] || null)}
                      className="hidden"
                      id="id-back"
                    />
                    <label
                      htmlFor="id-back"
                      className="inline-block px-4 py-2 bg-[#8B75AA] text-white rounded cursor-pointer hover:bg-[#7A6699]"
                    >
                      Choose File
                    </label>
                  </div>
                </div>

                {/* Selfie Upload */}
                <div>
                  <label className="block text-sm font-medium text-[#2C1A1D] mb-2">Selfie with ID</label>
                  <div className="border-2 border-dashed border-[#CDAA7D] rounded-lg p-6 text-center">
                    <Upload size={32} className="mx-auto text-[#8B75AA] mb-2" />
                    <p className="text-sm text-[#8B75AA] mb-2">
                      {formData.selfie ? formData.selfie.name : "Take a selfie holding your ID"}
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload("selfie", e.target.files?.[0] || null)}
                      className="hidden"
                      id="selfie"
                    />
                    <label
                      htmlFor="selfie"
                      className="inline-block px-4 py-2 bg-[#8B75AA] text-white rounded cursor-pointer hover:bg-[#7A6699]"
                    >
                      Choose File
                    </label>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep(1)}
                    className="flex-1 py-3 border border-[#CDAA7D] text-[#2C1A1D] rounded font-medium hover:bg-[#CDAA7D]/10"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={!formData.idFront || !formData.idBack || !formData.selfie}
                    className={`flex-1 py-3 rounded font-medium transition-colors ${
                      formData.idFront && formData.idBack && formData.selfie
                        ? "bg-[#8B75AA] text-white hover:bg-[#7A6699]"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    Submit Verification
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Security Notice */}
          <div className="mt-6 p-4 bg-[#8B75AA]/10 border border-[#8B75AA]/30 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Shield size={16} className="text-[#8B75AA]" />
              <span className="font-semibold text-[#2C1A1D]">Security & Privacy</span>
            </div>
            <ul className="text-xs text-[#8B75AA] space-y-1">
              <li>• All documents are encrypted and stored securely</li>
              <li>• Information is used solely for verification purposes</li>
              <li>• Documents are automatically deleted after 30 days</li>
              <li>• Verification typically takes 1-3 business days</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
