'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { resendVerificationEmail } from '@/lib/api/auth';
import { Mail, CheckCircle, RefreshCw, Home, Shield } from 'lucide-react';

export default function RegisterSuccess() {
  const [email, setEmail] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [canResend, setCanResend] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const emailParam = searchParams.get('email');
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
      setResendMessage('Verification email sent! Please check your inbox.');
      setCanResend(false);
      // Re-enable resend after 5 minutes
      setTimeout(() => {
        setCanResend(true);
      }, 300000);
    } catch (error: any) {
      setResendMessage(error.message || 'Failed to send verification email.');
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
          <h1 className="text-2xl font-bold text-[#2C1A1D] mb-2">Welcome to PeerQuest!</h1>
          <p className="text-[#2C1A1D] opacity-80">Registration Successful</p>
        </div>

        <div className="p-8">
          <div className="text-center mb-8">
            <div className="mx-auto mb-6 w-16 h-16 bg-[#8B75AA] rounded-full flex items-center justify-center">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-bold text-[#2C1A1D] mb-2">Check Your Email</h2>
            <p className="text-[#8B75AA] mb-4">
              We've sent a verification email to <strong className="text-[#2C1A1D]">{email}</strong>
            </p>
            <div className="bg-[#F4F0E6] border border-[#CDAA7D] rounded-lg p-4">
              <p className="text-sm text-[#2C1A1D] mb-2">
                🎮 <strong>Almost there, adventurer!</strong>
              </p>
              <p className="text-xs text-[#8B75AA]">
                Click the verification link in your email to activate your quest account and enter the tavern!
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-[#8B75AA] mb-4">
                Didn't receive the email? Check your spam folder or request a new one.
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
                {isResending ? 'Sending...' : 'Resend Verification Email'}
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
                Return to Tavern
              </button>
            </div>
          </div>
        </div>

        {/* Footer Tips */}
        <div className="bg-[#F4F0E6] border-t border-[#CDAA7D] p-6">
          <div className="text-center">
            <h3 className="text-sm font-bold text-[#2C1A1D] mb-3">📧 Email Tips</h3>
            <div className="grid grid-cols-2 gap-3 text-xs text-[#8B75AA]">
              <div className="flex items-center">
                <span className="mr-1">📥</span>
                Check spam/junk folder
              </div>
              <div className="flex items-center">
                <span className="mr-1">⏰</span>
                Link expires in 24 hours
              </div>
              <div className="flex items-center">
                <span className="mr-1">✉️</span>
                Add us to your contacts
              </div>
              <div className="flex items-center">
                <span className="mr-1">🔄</span>
                Each resend has new link
              </div>
            </div>
            
            <div className="mt-4 text-xs text-[#8B75AA] border-t border-[#CDAA7D] pt-3">
              <p>Need help? The verification email comes from: <br />
              <strong className="text-[#2C1A1D]">noreply@peerquest.com</strong></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
