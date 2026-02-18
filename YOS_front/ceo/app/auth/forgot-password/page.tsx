'use client';

import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { AppDispatch, RootState } from '@/app/lib/store/store';
import {
  setStep,
  setEmail,
  setQuestions,
  setResetToken,
  setLoading,
  setError,
  resetState,
} from '@/app/lib/store/slices/passwrodResetSlice';
import apiService from '@/app/utils/APIPaths';
import { toast } from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { step, email, questions, resetToken, loading, error } = useSelector(
    (state: RootState) => state.passwordReset
  );

  const [answers, setAnswers] = useState<{ question_id: number; answer: string }[]>([]);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Step 1: Request questions by email
  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email');
      return;
    }
    dispatch(setLoading(true));
    try {
      const res = await apiService.requestPasswordReset({ email });
      dispatch(setQuestions(res.data.questions));
      dispatch(setStep(2));
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to request reset');
    } finally {
      dispatch(setLoading(false));
    }
  };

  // Step 2: Submit answers
  const handleVerifyAnswers = async (e: React.FormEvent) => {
    e.preventDefault();
    if (answers.length === 0 || answers.some(a => !a.answer.trim())) {
      toast.error('Please answer all questions');
      return;
    }
    dispatch(setLoading(true));
    try {
      const res = await apiService.verifySecurityAnswers({ email, answers });
      dispatch(setResetToken(res.data.reset_token));
      dispatch(setStep(3));
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Incorrect answers');
    } finally {
      dispatch(setLoading(false));
    }
  };

  // Step 3: Reset password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    dispatch(setLoading(true));
    try {
      await apiService.resetPassword({ reset_token: resetToken!, new_password: newPassword });
      toast.success('Password reset successfully! Please login.');
      dispatch(resetState());
      router.push('/auth/login');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to reset password');
    } finally {
      dispatch(setLoading(false));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Reset your password
          </h2>
        </div>

        {/* Step indicator */}
        <div className="flex justify-center space-x-4">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>1</div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>2</div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>3</div>
        </div>

        {step === 1 && (
          <form className="mt-8 space-y-6" onSubmit={handleRequest}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => dispatch(setEmail(e.target.value))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Checking...' : 'Continue'}
            </button>
          </form>
        )}

        {step === 2 && (
          <form className="mt-8 space-y-6" onSubmit={handleVerifyAnswers}>
            {questions.map((q, idx) => (
              <div key={q.id}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {q.question}
                </label>
                <input
                  type="text"
                  required
                  value={answers[idx]?.answer || ''}
                  onChange={(e) => {
                    const newAnswers = [...answers];
                    if (!newAnswers[idx]) {
                      newAnswers[idx] = { question_id: q.id, answer: e.target.value };
                    } else {
                      newAnswers[idx].answer = e.target.value;
                    }
                    setAnswers(newAnswers);
                  }}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                />
              </div>
            ))}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify Answers'}
            </button>
          </form>
        )}

        {step === 3 && (
          <form className="mt-8 space-y-6" onSubmit={handleResetPassword}>
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                New Password
              </label>
              <input
                id="newPassword"
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}