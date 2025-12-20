import { permanentRedirect } from 'next/navigation';

/**
 * Redirect /admin to /admin/dashboard
 * Using permanentRedirect to avoid performance measurement issues
 */
export default function Page() {
  permanentRedirect('/admin/dashboard');
}
