'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { verifyEmail, resendVerificationEmail } from '@/lib/api/auth';
import { AlertCircle, CheckCircle, Mail, RefreshCw, Home, Shield } from 'lucide-react';

export default function VerifyEmail() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'expired'>('loading');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [canResend, setCanResend] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      handleVerification(token);
    } else {
      setStatus('error');
      setMessage('No verification token provided.');
    }
  }, [searchParams]);

  const handleVerification = async (token: string) => {
    try {
      setStatus('loading');
      const response = await verifyEmail(token);
      setStatus('success');
      setMessage(response.data.message || 'Email verified successfully!');
      // Redirect to home page after 3 seconds
      setTimeout(() => {
        router.push('/?verified=true');
      }, 3000);
    } catch (error: any) {
      setStatus('error');
      const errorMessage = error.message || 'An error occurred during verification.';
      setMessage(errorMessage);
      
      // Check if it's an expired token
      if (errorMessage.toLowerCase().includes('expired')) {
        setStatus('expired');
        setCanResend(true);
      }
    }
  };

  const handleResendVerification = async () => {
    if (!email) {
      setResendMessage('Please enter your email address.');
      return;
    }

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
          <div className="mx-auto mb-4 w-20 h-20 bg-[#8B75AA] rounded-full flex items-center justify-center shadow-lg">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[#2C1A1D] mb-2">PeerQuest Tavern</h1>
          <p className="text-[#2C1A1D] opacity-80">Email Verification</p>
        </div>

        <div className="p-8">
          {status === 'loading' && (
            <div className="text-center">
              <div className="relative mb-6">
                <div className="w-16 h-16 rounded-full border-4 border-[#8B75AA] border-t-transparent animate-spin mx-auto"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl">🛡️</span>
                </div>
              </div>
              <h2 className="text-xl font-bold text-[#2C1A1D] mb-2">Verifying Your Quest Account</h2>
              <p className="text-[#8B75AA]">Please wait while we verify your email...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center">
              <div className="mx-auto mb-6 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-green-600 mb-2">Welcome to the Tavern!</h2>
              <p className="text-[#2C1A1D] mb-4">{message}</p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-green-700">
                  🎉 Your quest account is now verified! You can now log in and start your adventure.
                </p>
              </div>
              <p className="text-sm text-[#8B75AA]">Redirecting to home page...</p>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center">
              <div className="mx-auto mb-6 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-10 h-10 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-red-600 mb-2">Verification Failed</h2>
              <p className="text-[#2C1A1D] mb-6">{message}</p>
              <button
                onClick={() => router.push('/')}
                className="w-full bg-[#8B75AA] text-white px-6 py-3 rounded-lg hover:bg-[#7A6699] transition-colors font-medium flex items-center justify-center"
              >
                <Home className="w-5 h-5 mr-2" />
                Return to Tavern
              </button>
            </div>
          )}

          {status === 'expired' && (
            <div className="text-center">
              <div className="mx-auto mb-6 w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-10 h-10 text-orange-600" />
              </div>
              <h2 className="text-xl font-bold text-orange-600 mb-2">Verification Link Expired</h2>
              <p className="text-[#2C1A1D] mb-6">{message}</p>
              
              <div className="bg-[#F4F0E6] border border-[#CDAA7D] rounded-lg p-4 mb-6">
                <h3 className="text-sm font-bold text-[#2C1A1D] mb-2">📧 Get a New Verification Link</h3>
                <p className="text-xs text-[#8B75AA] mb-4">
                  Enter your email address and we'll send you a fresh verification link.
                </p>
                
                <div className="space-y-3">
                  <input
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-[#CDAA7D] rounded-lg focus:outline-none focus:border-[#8B75AA] bg-white text-[#2C1A1D] placeholder-[#8B75AA]"
                  />
                  
                  <button
                    onClick={handleResendVerification}
                    disabled={isResending || !canResend}
                    className="w-full bg-[#8B75AA] text-white px-6 py-2 rounded-lg hover:bg-[#7A6699] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-medium"
                  >
                    {isResending ? (
                      <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                    ) : (
                      <Mail className="w-5 h-5 mr-2" />
                    )}
                    {isResending ? 'Sending...' : 'Send New Verification Email'}
                  </button>
                  
                  {resendMessage && (
                    <p className={`text-sm text-center ${resendMessage.includes('sent') ? 'text-green-600' : 'text-red-600'}`}>
                      {resendMessage}
                    </p>
                  )}
                </div>
              </div>

              <button
                onClick={() => router.push('/')}
                className="w-full bg-white border border-[#CDAA7D] text-[#2C1A1D] px-6 py-2 rounded-lg hover:bg-[#F4F0E6] transition-colors font-medium flex items-center justify-center"
              >
                <Home className="w-5 h-5 mr-2" />
                Return to Tavern
              </button>
            </div>
          )}
        </div>

        {/* Footer Tips */}
        <div className="bg-[#F4F0E6] border-t border-[#CDAA7D] p-6">
          <div className="text-center">
            <h3 className="text-sm font-bold text-[#2C1A1D] mb-3">📧 Email Verification Tips</h3>
            <div className="grid grid-cols-2 gap-2 text-xs text-[#8B75AA]">
              <div>• Check spam folder</div>
              <div>• Link expires in 24hrs</div>
              <div>• Add us to contacts</div>
              <div>• One-time use only</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
