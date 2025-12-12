'use client';

/**
 * Reset password page - Clean & Elegant Professional design
 * This page is accessed via the email link sent from forgot-password
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { resetPasswordSchema, type ResetPasswordFormData } from '@/lib/validations/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isValidToken, setIsValidToken] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  // Verify the reset token on mount
  useEffect(() => {
    const supabase = createClient();

    // Check if we have a valid session from the email link
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsValidToken(true);
      } else {
        setError('Invalid or expired reset link. Please request a new one.');
      }
    });
  }, []);

  const onSubmit = async (data: ResetPasswordFormData) => {
    setError(null);
    const supabase = createClient();

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: data.password,
      });

      if (updateError) {
        setError(updateError.message || 'Failed to reset password');
        return;
      }

      setSuccess(true);

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    }
  };

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <div className="bg-white p-8 rounded-2xl shadow-lg text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-[#434E54] mb-3">Password Reset Successful!</h1>
          <p className="text-[#6B7280] mb-8 leading-relaxed">
            Your password has been updated successfully. Redirecting to login...
          </p>
        </div>
      </motion.div>
    );
  }

  if (!isValidToken && error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <div className="bg-white p-8 rounded-2xl shadow-lg">
          <div className="flex items-start gap-3 p-4 mb-6 bg-red-50 border border-red-100 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-red-700 font-semibold mb-2">{error}</p>
              <Button
                variant="primary"
                className="mt-4 bg-[#434E54] hover:bg-[#363F44]"
                onClick={() => router.push('/forgot-password')}
              >
                Request New Reset Link
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <div className="bg-white p-8 rounded-2xl shadow-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#434E54] mb-2">Reset Your Password</h1>
          <p className="text-[#6B7280]">
            Enter your new password below
          </p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-3 p-4 mb-6 bg-red-50 border border-red-100 rounded-lg"
          >
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <span className="text-sm text-red-700">{error}</span>
          </motion.div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Input
            label="New Password"
            type="password"
            placeholder="Create a new password"
            error={errors.password?.message}
            helperText="At least 8 characters with uppercase, lowercase, and number"
            className="focus:ring-2 focus:ring-[#434E54]/20 focus:border-[#434E54] transition-all"
            {...register('password')}
          />

          <Input
            label="Confirm New Password"
            type="password"
            placeholder="Confirm your new password"
            error={errors.confirmPassword?.message}
            className="focus:ring-2 focus:ring-[#434E54]/20 focus:border-[#434E54] transition-all"
            {...register('confirmPassword')}
          />

          <Button
            type="submit"
            variant="primary"
            className="w-full bg-[#434E54] hover:bg-[#363F44] text-white font-semibold py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
            isLoading={isSubmitting}
          >
            Reset Password
          </Button>
        </form>
      </div>
    </motion.div>
  );
}
