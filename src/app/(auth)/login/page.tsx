'use client';

/**
 * Login page - Clean & Elegant Professional design
 */

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { loginSchema, type LoginFormData } from '@/lib/validations/auth';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Input } from '@/components/ui/input';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const returnTo = searchParams.get('returnTo') || '/dashboard';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setError(null);

    console.log('[Login] Submitting login form...');
    const result = await signIn(data.email, data.password);

    if (result.error) {
      console.error('[Login] Sign in failed:', result.error);
      setError(result.error.message || 'Invalid email or password');
      return;
    }

    console.log('[Login] Sign in successful, user:', result.user?.email);

    // Wait a moment for the auth state to be set in the store
    await new Promise(resolve => setTimeout(resolve, 100));

    // Determine redirect based on user role
    let redirectTo = returnTo;

    // If user is admin/groomer and no specific returnTo was set, go to admin dashboard
    if (result.user?.role === 'admin' || result.user?.role === 'groomer') {
      // If default returnTo (/dashboard), redirect to admin dashboard instead
      if (returnTo === '/dashboard') {
        redirectTo = '/admin/dashboard';
      }
      console.log('[Login] Admin/staff user, redirecting to:', redirectTo);
    } else {
      console.log('[Login] Customer user, redirecting to:', redirectTo);
    }

    // Use router.push for client-side navigation (middleware will handle session)
    router.push(redirectTo);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <div className="bg-white p-8 rounded-2xl shadow-lg">
        <div className="flex flex-col gap-6 items-center mb-8">
          <Image
            src="/images/logo.png"
            alt="Puppy Day Logo"
            width="200"
            height="200"
            priority
          />
          <p className="text-[#6B7280]">
            Sign in to manage your appointments
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

          <Input
            label="Password"
            type="password"
            placeholder="Enter your password"
            error={errors.password?.message}
            className="focus:ring-2 focus:ring-[#434E54]/20 focus:border-[#434E54] transition-all"
            {...register('password')}
          />

          <div className="flex justify-end">
            <Link
              href="/forgot-password"
              className="text-sm text-[#434E54] hover:text-[#363F44] font-medium transition-colors"
            >
              Forgot password?
            </Link>
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full bg-[#434E54] hover:bg-[#363F44] text-white font-semibold py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
            isLoading={isSubmitting}
          >
            Sign In
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
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-[#434E54] hover:text-[#363F44] font-semibold transition-colors">
            Sign up
          </Link>
        </p>
      </div>
    </motion.div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center">
        <div className="w-8 h-8 border-4 border-[#EAE0D5] border-t-[#434E54] rounded-full animate-spin"></div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
