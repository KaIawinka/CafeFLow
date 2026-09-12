/**
 * Admin Dashboard Page
 * Protected route - requires admin authentication
 */

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { verifyAccessToken } from '@/lib/auth/jwt';

export default async function AdminDashboard() {
  // Check authentication
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken')?.value;

  if (!token) {
    redirect('/admin/login');
  }

  const payload = await verifyAccessToken(token);

  if (!payload || payload.role !== 'admin') {
    redirect('/admin/login');
  }

  return (
    <div className="min-h-screen bg-zinc-900">
      {/* Header */}
      <header className="bg-zinc-800 border-b border-zinc-700">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">CaféFlow Admin</h1>
              <p className="text-zinc-400 text-sm">Панель управления</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-white text-sm font-medium">{payload.email}</p>
                <p className="text-zinc-400 text-xs capitalize">{payload.role}</p>
              </div>
              <form action="/api/admin/auth/logout" method="POST">
                <button
                  type="submit"
                  className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg text-sm transition-colors"
                >
                  Выйти
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Stats Cards */}
          <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-zinc-400 text-sm font-medium">Заказы сегодня</h3>
              <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-white">0</p>
          </div>

          <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-zinc-400 text-sm font-medium">Выручка</h3>
              <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-white">0 ₽</p>
          </div>

          <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-zinc-400 text-sm font-medium">Клиенты</h3>
              <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-white">0</p>
          </div>

          <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-zinc-400 text-sm font-medium">Товары</h3>
              <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-white">0</p>
          </div>
        </div>

        {/* Welcome Message */}
        <div className="mt-8 bg-gradient-to-br from-orange-500/10 to-orange-600/10 border border-orange-500/20 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-2">
            Добро пожаловать в CaféFlow! 🎉
          </h2>
          <p className="text-zinc-300">
            Панель управления находится в разработке. Скоро здесь появятся все функции управления вашим заведением.
          </p>
        </div>
      </main>
    </div>
  );
}
