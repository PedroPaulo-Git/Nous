// Todos types
export interface Todo {
  id: string;
  title: string;
  description?: string;
  is_done: boolean;
  due_date?: string;
  due_time?: string;
  start_date?: string;
  start_time?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  is_recurring: boolean;
  recurrence_type?: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
  recurrence_interval?: number;
  recurrence_days_of_week?: number[];
  recurrence_day_of_month?: number;
  recurrence_end_date?: string;
  category?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
  completed_at?: string;
}
