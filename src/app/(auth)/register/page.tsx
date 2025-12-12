'use client';

/**
 * Register page - Clean & Elegant Professional design
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { registerSchema, type RegisterFormData } from '@/lib/validations/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function RegisterPage() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setError(null);

    const result = await signUp({
      email: data.email,
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
    });

    if (result.error) {
      setError(result.error.message || 'Registration failed. Please try again.');
      return;
    }

    router.push('/dashboard');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <div className="bg-white p-8 rounded-2xl shadow-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#434E54] mb-2">Create Account</h1>
          <p className="text-[#6B7280]">
            Join us to book grooming appointments for your furry friends
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
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name"
              placeholder="John"
              error={errors.firstName?.message}
              className="focus:ring-2 focus:ring-[#434E54]/20 focus:border-[#434E54] transition-all"
              {...register('firstName')}
            />
            <Input
              label="Last Name"
              placeholder="Doe"
              error={errors.lastName?.message}
              className="focus:ring-2 focus:ring-[#434E54]/20 focus:border-[#434E54] transition-all"
              {...register('lastName')}
            />
          </div>

          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            error={errors.email?.message}
            className="focus:ring-2 focus:ring-[#434E54]/20 focus:border-[#434E54] transition-all"
            {...register('email')}
          />

          <Input
            label="Phone (optional)"
            type="tel"
            placeholder="+1 (555) 123-4567"
            error={errors.phone?.message}
            className="focus:ring-2 focus:ring-[#434E54]/20 focus:border-[#434E54] transition-all"
            {...register('phone')}
          />

          <Input
            label="Password"
            type="password"
            placeholder="Create a password"
            error={errors.password?.message}
            helperText="At least 8 characters with uppercase, lowercase, and number"
            className="focus:ring-2 focus:ring-[#434E54]/20 focus:border-[#434E54] transition-all"
            {...register('password')}
          />

          <Input
            label="Confirm Password"
            type="password"
            placeholder="Confirm your password"
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
            Create Account
          </Button>
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-[#9CA3AF]">OR</span>
          </div>
        </div>

        <p className="text-center text-[#6B7280]">
          Already have an account?{' '}
          <Link href="/login" className="text-[#434E54] hover:text-[#363F44] font-semibold transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </motion.div>
  );
}
