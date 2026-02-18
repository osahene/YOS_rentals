// app/auth/register/page.tsx (updated)
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import { AppDispatch } from '@/app/lib/store/store';
import { registerUser } from '@/app/lib/store/slices/authSlice';
import apiService from '@/app/utils/APIPaths';
import { toast } from 'react-hot-toast';
import PhoneVerification from '@/app/components/auth/PhoneVerification';
import SecurityQuestions from '@/app/components/auth/SecurityQuestions';
import EmailVerification from '@/app/components/auth/EmailVerification';

interface SecurityQuestion {
  id: number;
  question: string;
}

interface FormData {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  confirmPassword: string;
  country_code: string;
  phone_number: string;
}

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [questions, setQuestions] = useState<SecurityQuestion[]>([]);
  const [securityAnswers, setSecurityAnswers] = useState<{ question_id: number; answer: string }[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData | null>(null);

  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  const { register, handleSubmit, formState: { errors }, watch } = useForm<FormData>({
    defaultValues: {
      country_code: '+233',
    }
  });
  const password = watch('password');

  // Fetch security questions on mount
  useEffect(() => {
    apiService.getSecurityQuestions()
      .then(res => setQuestions(res.data))
      .catch(err => console.error('Failed to load security questions', err));
  }, []);

  // Step 1 submit: store form data and move to step 2
  const onSubmitStep1 = (data: FormData) => {
    if (data.password !== data.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setFormData(data);
    setStep(2);
  };

  // Step 2 submit: register user with security answers
  const handleSecurityNext = async (answers: { question_id: number; answer: string }[]) => {
    if (!formData) return;

    const registrationData = {
      ...formData,
      role: 'ceo',
      security_answers: answers,
    };

    try {
      const result = await dispatch(registerUser(registrationData)).unwrap();
      // Assume response contains user object with id
      setUserId(result.user.id);
      toast.success('Account created! Now verify your phone.');
      setStep(3);
    } catch (error: any) {
      toast.error(error.message || 'Registration failed');
    }
  };

  // Step 3: phone verified
  const handlePhoneVerified = () => {
    setStep(4);
  };

  // Step 4: email verified or skipped
  const handleEmailVerified = () => {
    router.push('/auth/login');
  };

  const handleEmailSkip = () => {
    router.push('/auth/login');
  };

  // Get full phone number for verification
  const fullPhoneNumber = formData ? `${formData.country_code}${formData.phone_number}` : '';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Create your account
          </h2>
        </div>

        {/* Step indicator */}
        <div className="flex justify-center space-x-4">
          {[1, 2, 3, 4].map(i => (
            <div
              key={i}
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step >= i ? 'bg-blue-600 text-white' : 'bg-gray-300 dark:bg-gray-700 text-gray-600'
              }`}
            >
              {i}
            </div>
          ))}
        </div>

        {step === 1 && (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmitStep1)}>
            {/* same form fields as before */}
            <div className="space-y-4">
              <div>
                <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  First Name
                </label>
                <input
                  id="first_name"
                  type="text"
                  {...register('first_name', { required: 'First name is required' })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                />
                {errors.first_name && <p className="mt-1 text-sm text-red-600">{errors.first_name.message}</p>}
              </div>

              <div>
                <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Last Name
                </label>
                <input
                  id="last_name"
                  type="text"
                  {...register('last_name', { required: 'Last name is required' })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                />
                {errors.last_name && <p className="mt-1 text-sm text-red-600">{errors.last_name.message}</p>}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  {...register('email', { required: 'Email is required' })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                />
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  {...register('password', { required: 'Password is required', minLength: 8 })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                />
                {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  {...register('confirmPassword', {
                    required: 'Please confirm your password',
                    validate: value => value === password || 'Passwords do not match'
                  })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                />
                {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>}
              </div>

              <div className="grid grid-cols-4 gap-2">
                <div className="col-span-1">
                  <label htmlFor="country_code" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Code
                  </label>
                  <input
                    id="country_code"
                    type="text"
                    {...register('country_code', { required: 'Country code required' })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                  />
                </div>
                <div className="col-span-3">
                  <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Phone Number
                  </label>
                  <input
                    id="phone_number"
                    type="tel"
                    {...register('phone_number', { required: 'Phone number is required' })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </div>
              {errors.phone_number && <p className="text-sm text-red-600">{errors.phone_number.message}</p>}
            </div>

            <div>
              <button
                type="submit"
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Continue
              </button>
            </div>
          </form>
        )}

        {step === 2 && (
          <SecurityQuestions
            questions={questions}
            initialAnswers={securityAnswers}
            onNext={handleSecurityNext}
          />
        )}

        {step === 3 && userId && (
          <PhoneVerification
            phoneNumber={fullPhoneNumber}
            onVerified={handlePhoneVerified}
          />
        )}

        {step === 4 && formData && (
          <EmailVerification
            email={formData.email}
            onVerified={handleEmailVerified}
            onSkip={handleEmailSkip}
          />
        )}
      </div>
    </div>
  );
}