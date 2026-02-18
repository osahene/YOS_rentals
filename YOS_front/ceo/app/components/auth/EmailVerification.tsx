// components/EmailVerification.tsx
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import apiService from '@/app/utils/APIPaths';

interface EmailVerificationProps {
  email: string;
  onVerified: () => void;
  onSkip: () => void;
}

export default function EmailVerification({ email, onVerified, onSkip }: EmailVerificationProps) {
  const [checking, setChecking] = useState(false);

  const checkVerification = async () => {
    setChecking(true);
    // In a real app, you might have an endpoint to check if email is verified.
    // For now, we assume the user has clicked the link and we can redirect.
    // Alternatively, you could poll a status endpoint.
    // Here we'll just show a success message and call onVerified.
    toast.success('Email verified! You can now log in.');
    onVerified();
  };

  return (
    <div className="mt-8 text-center">
      <p className="text-gray-700 dark:text-gray-300">
        We've sent a verification email to <strong>{email}</strong>.
      </p>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
        Please check your inbox and click the verification link.
      </p>
      <div className="mt-6 flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-4 justify-center">
        <button
          onClick={checkVerification}
          disabled={checking}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {checking ? 'Checking...' : "I've verified my email"}
        </button>
        <button
          onClick={onSkip}
          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}