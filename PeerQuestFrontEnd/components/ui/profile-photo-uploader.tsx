"use client";

import { useState, useRef } from 'react';
import { Camera, Upload, X, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ProfilePhotoUploaderProps {
  currentPhoto?: string;
  onPhotoChange: (photoUrl: string) => void;
  className?: string;
}

export function ProfilePhotoUploader({ 
  currentPhoto, 
  onPhotoChange, 
  className = "" 
}: ProfilePhotoUploaderProps) {
  const { t } = useTranslation();
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFileSelect = (file: File) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert(t('profilePhoto.invalidFileType'));
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert(t('profilePhoto.fileTooLarge'));
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPreviewUrl(result);
      setShowUploadModal(true);
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const uploadPhoto = async () => {
    if (!previewUrl) return;

    setIsUploading(true);
    try {
      // For now, we'll just use the preview URL as the photo URL
      // In a real implementation, you would upload to a server/cloud storage
      // and get back a permanent URL
      
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      onPhotoChange(previewUrl);
      setShowUploadModal(false);
      setPreviewUrl(null);
    } catch (error) {
      alert(t('profilePhoto.uploadError'));
    } finally {
      setIsUploading(false);
    }
  };

  const removePhoto = () => {
    onPhotoChange('');
    setPreviewUrl(null);
    setShowUploadModal(false);
  };

  const displayPhoto = currentPhoto || previewUrl;

  return (
    <>
      <div className={`relative ${className}`}>
        <div className="flex flex-col items-center space-y-4">
          {/* Photo Display */}
          <div className="relative group">
            <div className="w-32 h-32 rounded-full border-4 border-[#CDAA7D] overflow-hidden bg-[#3D2A2F] flex items-center justify-center">
              {displayPhoto ? (
                <img 
                  src={displayPhoto} 
                  alt={t('profilePhoto.profilePhoto')}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User size={48} className="text-[#CDAA7D]" />
              )}
            </div>
            
            {/* Overlay with camera icon */}
            <div className="absolute inset-0 rounded-full bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                 onClick={() => fileInputRef.current?.click()}>
              <Camera size={24} className="text-white" />
            </div>
          </div>

          {/* Upload Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-[#8B75AA] text-white rounded-lg hover:bg-[#7A6699] transition-colors flex items-center gap-2"
          >
            <Upload size={16} />
            {currentPhoto ? t('profilePhoto.changePhoto') : t('profilePhoto.uploadPhoto')}
          </button>

          {/* Remove Photo Button */}
          {currentPhoto && (
            <button
              onClick={removePhoto}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 text-sm"
            >
              <X size={14} />
              {t('profilePhoto.removePhoto')}
            </button>
          )}

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInputChange}
            className="hidden"
          />
        </div>

        {/* Drag and Drop Zone */}
        <div
          className={`mt-4 border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragOver 
              ? 'border-[#8B75AA] bg-[#8B75AA]/10' 
              : 'border-[#CDAA7D] bg-[#3D2A2F]/20'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <Upload size={32} className="mx-auto mb-2 text-[#CDAA7D]" />
          <p className="text-sm text-[#F4F0E6]/80">
            {t('profilePhoto.dragDropText')}
          </p>
          <p className="text-xs text-[#F4F0E6]/60 mt-1">
            {t('profilePhoto.supportedFormats')}
          </p>
        </div>
      </div>

      {/* Upload Preview Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#2C1A1D] rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-[#F4F0E6]">
                {t('profilePhoto.previewPhoto')}
              </h3>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setPreviewUrl(null);
                }}
                className="text-[#F4F0E6] hover:text-[#CDAA7D]"
                disabled={isUploading}
              >
                <X size={24} />
              </button>
            </div>

            {/* Preview Image */}
            <div className="flex justify-center mb-6">
              <div className="w-48 h-48 rounded-full border-4 border-[#CDAA7D] overflow-hidden">
                <img 
                  src={previewUrl || ''} 
                  alt={t('profilePhoto.preview')}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setPreviewUrl(null);
                }}
                className="flex-1 px-4 py-2 border border-[#CDAA7D] text-[#F4F0E6] rounded-lg hover:bg-[#3D2A2F] transition-colors"
                disabled={isUploading}
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={uploadPhoto}
                disabled={isUploading}
                className="flex-1 px-4 py-2 bg-[#8B75AA] text-white rounded-lg hover:bg-[#7A6699] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isUploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    {t('profilePhoto.uploading')}
                  </>
                ) : (
                  <>
                    <Upload size={16} />
                    {t('profilePhoto.confirmUpload')}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
