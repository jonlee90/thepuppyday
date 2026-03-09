/**
 * Login page — server component
 * Wraps LoginForm (client) in Suspense so useSearchParams() works without hydration mismatch
 */

import { Suspense } from 'react';
import { LoginForm } from './LoginForm';

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center">
        <div className="w-8 h-8 border-4 border-[#EAE0D5] border-t-[#434E54] rounded-full animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
