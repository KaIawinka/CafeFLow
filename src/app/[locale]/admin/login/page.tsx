/**
 * Admin Login Page
 * Step 1: Email/Password authentication
 */

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import AdminLoginForm from '@/components/admin/AdminLoginForm';

export default async function AdminLoginPage() {
  // Check if already logged in
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken');
  
  if (token) {
    redirect('/admin/dashboard');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900">
      <div className="w-full max-w-md">
        <AdminLoginForm />
      </div>
    </div>
  );
}
