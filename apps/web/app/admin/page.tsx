'use client';
import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { getToken, API_URL } from '@/lib/api';
import type { Profile } from '@/types';

export default function AdminPage() {
  const t = useTranslations();
  const [users, setUsers] = useState<(Profile & { email?: string })[]>([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const res = await fetch(`${API_URL}/admin/users`, {
      headers: { Authorization: `Bearer ${await getToken()}` },
    });
    if (res.ok) setUsers(await res.json());
  };

  const toggleSubscription = async (id: string, current: boolean) => {
    const res = await fetch(`${API_URL}/admin/users/${id}/subscription`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await getToken()}` },
      body: JSON.stringify({ is_subscribed: !current }),
    });
    if (res.ok) fetchUsers();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-black px-6 py-20">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-5xl font-bold mb-8">{t('admin.title')}</h1>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-2xl font-semibold mb-4">{t('admin.users_title')}</h2>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-300 dark:border-gray-700">
                <th className="py-2">{t('admin.user_id')}</th>
                <th className="py-2">{t('admin.subscribed')}</th>
                <th className="py-2">{t('admin.admin')}</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-gray-200 dark:border-gray-700">
                  <td className="py-3 font-mono text-sm">{user.id}</td>
                  <td className="py-3">{user.is_subscribed ? '✅' : '❌'}</td>
                  <td className="py-3">{user.is_admin ? '✅' : '❌'}</td>
                  <td className="py-3">
                    <button
                      onClick={() => toggleSubscription(user.id, user.is_subscribed)}
                      className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm"
                    >
                      {t('admin.toggle_subscription')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
