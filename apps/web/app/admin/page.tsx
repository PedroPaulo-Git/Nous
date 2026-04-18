'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { getToken, API_URL, getApiErrorMessage } from '@/lib/api';
import type { AdminUser } from '@/types';

export default function AdminPage() {
  const t = useTranslations();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });

      if (!res.ok) {
        throw new Error(await getApiErrorMessage(res, 'Failed to load users'));
      }

      setUsers(await res.json());
    } catch (error: any) {
      toast.error(t('common.error'), { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const toggleSubscription = async (id: string, current: boolean) => {
    try {
      const res = await fetch(`${API_URL}/admin/users/${id}/subscription`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await getToken()}`,
        },
        body: JSON.stringify({ is_subscribed: !current }),
      });

      if (!res.ok) {
        throw new Error(await getApiErrorMessage(res, 'Failed to update premium access'));
      }

      toast.success(t('common.success'));
      await fetchUsers();
    } catch (error: any) {
      toast.error(t('common.error'), { description: error.message });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-black px-6 py-20">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-5xl font-bold mb-8">{t('admin.title')}</h1>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-2xl font-semibold mb-4">{t('admin.users_title')}</h2>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading users...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-300 dark:border-gray-700">
                    <th className="py-2 pr-4">Email</th>
                    <th className="py-2 pr-4">{t('admin.user_id')}</th>
                    <th className="py-2 pr-4">{t('admin.subscribed')}</th>
                    <th className="py-2 pr-4">{t('admin.admin')}</th>
                    <th className="py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-gray-200 dark:border-gray-700">
                      <td className="py-3 pr-4">{user.email ?? 'No email'}</td>
                      <td className="py-3 pr-4 font-mono text-sm">{user.id}</td>
                      <td className="py-3 pr-4">{user.is_subscribed ? 'Yes' : 'No'}</td>
                      <td className="py-3 pr-4">{user.is_admin ? 'Yes' : 'No'}</td>
                      <td className="py-3">
                        <button
                          onClick={() => toggleSubscription(user.id, user.is_subscribed)}
                          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm"
                        >
                          {user.is_subscribed ? 'Remove Premium' : 'Give Premium'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
