"use client";

import { useLanguage } from '@/context/LanguageContext';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { useState } from 'react';

export function LanguageSwitcher() {
  const { currentLanguage, changeLanguage, availableLanguages, isReady } = useLanguage();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  if (!isReady) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center text-[#F4F0E6] hover:text-[#CDAA7D] transition-colors"
        title={t('navbar.language')}
      >
        <Globe size={20} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
          {availableLanguages.map(lang => (
            <button
              key={lang.code}
              onClick={() => {
                changeLanguage(lang.code);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-[#F4F0E6] transition-colors ${
                currentLanguage === lang.code 
                  ? 'bg-[#CDAA7D] text-white' 
                  : 'text-[#2C1A1D]'
              }`}
            >
              {lang.nativeName} ({lang.name})
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
