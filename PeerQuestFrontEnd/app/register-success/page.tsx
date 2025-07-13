'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { resendVerificationEmail } from '@/lib/api/auth';
import { Mail, CheckCircle, RefreshCw, Home, Shield } from 'lucide-react';

export default function RegisterSuccess() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [canResend, setCanResend] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const emailParam = searchParams?.get('email') ?? null;
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  const handleResendVerification = async () => {
    if (!email) return;

    try {
      setIsResending(true);
      setResendMessage('');
      await resendVerificationEmail(email);
      setResendMessage(t('registerSuccess.verificationSentSuccess'));
      setCanResend(false);
      // Re-enable resend after 5 minutes
      setTimeout(() => {
        setCanResend(true);
      }, 300000);
    } catch (error: any) {
      setResendMessage(error.message || t('registerSuccess.verificationSentError'));
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F0E6] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl border border-[#CDAA7D] max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-[#CDAA7D] px-8 py-6 text-center">
          <div className="mx-auto mb-4 w-20 h-20 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[#2C1A1D] mb-2">{t('registerSuccess.welcome')}</h1>
          <p className="text-[#2C1A1D] opacity-80">{t('registerSuccess.registrationSuccessful')}</p>
        </div>

        <div className="p-8">
          <div className="text-center mb-8">
            <div className="mx-auto mb-6 w-16 h-16 bg-[#8B75AA] rounded-full flex items-center justify-center">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-bold text-[#2C1A1D] mb-2">{t('registerSuccess.checkYourEmail')}</h2>
            <p className="text-[#8B75AA] mb-4">
              We've sent a verification email to <strong className="text-[#2C1A1D]">{email}</strong>
            </p>
            <div className="bg-[#F4F0E6] border border-[#CDAA7D] rounded-lg p-4">
              <p className="text-sm text-[#2C1A1D] mb-2">
                {t('registerSuccess.almostThere')}
              </p>
              <p className="text-xs text-[#8B75AA]">
                {t('registerSuccess.clickVerification')}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-[#8B75AA] mb-4">
                {t('registerSuccess.didntReceive')}
              </p>
              
              <button
                onClick={handleResendVerification}
                disabled={isResending || !canResend}
                className="w-full bg-[#8B75AA] text-white px-6 py-3 rounded-lg hover:bg-[#7A6699] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-medium"
              >
                {isResending ? (
                  <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <Mail className="w-5 h-5 mr-2" />
                )}
                {isResending ? t('registerSuccess.sending') : t('registerSuccess.resendVerification')}
              </button>
              
              {resendMessage && (
                <p className={`text-sm mt-3 ${resendMessage.includes('sent') ? 'text-green-600' : 'text-red-600'}`}>
                  {resendMessage}
                </p>
              )}
            </div>

            <div className="border-t border-[#CDAA7D] pt-4">
              <button
                onClick={() => router.push('/')}
                className="w-full bg-white border border-[#CDAA7D] text-[#2C1A1D] px-6 py-2 rounded-lg hover:bg-[#F4F0E6] transition-colors font-medium flex items-center justify-center"
              >
                <Home className="w-5 h-5 mr-2" />
                {t('registerSuccess.returnToTavern')}
              </button>
            </div>
          </div>
        </div>

        {/* Footer Tips */}
        <div className="bg-[#F4F0E6] border-t border-[#CDAA7D] p-6">
          <div className="text-center">
            <h3 className="text-sm font-bold text-[#2C1A1D] mb-3">{t('registerSuccess.emailTips')}</h3>
            <div className="grid grid-cols-2 gap-3 text-xs text-[#8B75AA]">
              <div className="flex items-center">
                <span className="mr-1">📥</span>
                {t('registerSuccess.checkSpam')}
              </div>
              <div className="flex items-center">
                <span className="mr-1">⏰</span>
                {t('registerSuccess.linkExpires')}
              </div>
              <div className="flex items-center">
                <span className="mr-1">✉️</span>
                {t('registerSuccess.addContacts')}
              </div>
              <div className="flex items-center">
                <span className="mr-1">🔄</span>
                {t('registerSuccess.resendNewLink')}
              </div>
            </div>
            
            <div className="mt-4 text-xs text-[#8B75AA] border-t border-[#CDAA7D] pt-3">
              <p>{t('registerSuccess.needHelp')} <br />
              <strong className="text-[#2C1A1D]">{t('registerSuccess.emailFrom')}</strong></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
