'use client';

/**
 * Forgot password page - Clean & Elegant Professional design
 */

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { forgotPasswordSchema, type ForgotPasswordFormData } from '@/lib/validations/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setError(null);

    const result = await resetPassword(data.email);

    if (result.error) {
      setError(result.error.message || 'Failed to send reset email');
      return;
    }

    setSuccess(true);
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

          <h1 className="text-3xl font-bold text-[#434E54] mb-3">Check Your Email</h1>
          <p className="text-[#6B7280] mb-8 leading-relaxed">
            We&apos;ve sent password reset instructions to your email address.
            Please check your inbox and follow the link to reset your password.
          </p>

          <Link href="/login">
            <Button
              variant="primary"
              className="w-full bg-[#434E54] hover:bg-[#363F44] text-white font-semibold py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
            >
              Back to Login
            </Button>
          </Link>
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
          <h1 className="text-3xl font-bold text-[#434E54] mb-2">Forgot Password?</h1>
          <p className="text-[#6B7280]">
            Enter your email and we&apos;ll send you a link to reset your password
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
            label="Email"
            type="email"
            placeholder="you@example.com"
            error={errors.email?.message}
            className="focus:ring-2 focus:ring-[#434E54]/20 focus:border-[#434E54] transition-all"
            {...register('email')}
          />

          <Button
            type="submit"
            variant="primary"
            className="w-full bg-[#434E54] hover:bg-[#363F44] text-white font-semibold py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
            isLoading={isSubmitting}
          >
            Send Reset Link
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm text-[#434E54] hover:text-[#363F44] font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
