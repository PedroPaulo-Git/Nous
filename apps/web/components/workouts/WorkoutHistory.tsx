'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Calendar, Dumbbell } from 'lucide-react';
import { getToken, API_URL } from '@/lib/api';

interface WorkoutLog {
  id: string;
  workout_date: string;
  total_duration_minutes?: number;
  exercises_completed: number;
  exercises_total: number;
  notes?: string;
}

interface WorkoutHistoryProps {
  refreshTrigger?: number;
}

export function WorkoutHistory({ refreshTrigger }: WorkoutHistoryProps = {}) {
  const t = useTranslations();
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, [refreshTrigger]);

  async function fetchLogs() {
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/workouts/logs?limit=30`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch logs');
      const data = await res.json();
      setLogs(data);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="bg-card rounded-lg border border-border p-6">
        <p className="text-center text-muted-foreground">{t('common.loading')}</p>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="text-center py-12 text-muted-foreground">
          <Calendar className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>{t('workouts.no_history')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <h2 className="text-xl font-bold mb-4 text-foreground">{t('workouts.history')}</h2>
      <div className="space-y-3">
        {logs.map((log) => (
          <div key={log.id} className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Dumbbell className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-foreground">
                    {new Date(log.workout_date).toLocaleDateString('pt-BR', {
                      weekday: 'long',
                      day: '2-digit',
                      month: 'short'
                    })}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {log.exercises_completed}/{log.exercises_total} {t('workouts.exercises')}
                    {log.total_duration_minutes && log.total_duration_minutes > 0 && ` · ${log.total_duration_minutes}min`}
                  </p>
                </div>
              </div>
              <div className="text-right">
                {log.exercises_completed === log.exercises_total ? (
                  <span className="text-green-600 dark:text-green-400 font-medium">✅ {t('workouts.completed')}</span>
                ) : (
                  <span className="text-yellow-600 dark:text-yellow-400 font-medium">⚠️ {t('workouts.partial')}</span>
                )}
              </div>
            </div>
            {log.notes && (
              <p className="mt-2 text-sm text-muted-foreground italic">{log.notes}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
