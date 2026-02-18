// components/PhoneVerification.tsx
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import apiService from '@/app/utils/APIPaths';

interface PhoneVerificationProps {
  phoneNumber: string;  // full number with country code, e.g., "+233123456789"
  onVerified: () => void;
}

export default function PhoneVerification({ phoneNumber, onVerified }: PhoneVerificationProps) {
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const sendOtp = async () => {
    setLoading(true);
    try {
      // Assume API expects phone_number (full number) and country_code separately?
      // Your backend SendPhoneOTPView expects phone_number and optional country_code.
      // Here we can pass the full phone number; the backend will handle.
      await apiService.sendPhoneOtp({ phone_number: phoneNumber });
      setOtpSent(true);
      toast.success('OTP sent to your phone');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (otp.length !== 6) {
      toast.error('OTP must be 6 digits');
      return;
    }
    setLoading(true);
    try {
      await apiService.verifyPhoneOtp({ phone_number: phoneNumber, otp });
      toast.success('Phone verified successfully');
      onVerified();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-8 space-y-6">
      {!otpSent ? (
        <button
          onClick={sendOtp}
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {loading ? 'Sending...' : 'Send Verification Code'}
        </button>
      ) : (
        <>
          <div>
            <label htmlFor="otp" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Enter 6-digit OTP
            </label>
            <input
              id="otp"
              type="text"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
              placeholder="123456"
            />
          </div>
          <button
            onClick={verifyOtp}
            disabled={loading || otp.length !== 6}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Verify OTP'}
          </button>
          <button
            onClick={sendOtp}
            disabled={loading}
            className="w-full text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400"
          >
            Resend OTP
          </button>
        </>
      )}
    </div>
  );
}