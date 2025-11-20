"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getToken, API_URL } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckSquare, Plus, Edit, Trash2, Loader2, ListTodo, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, Filter } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase-client";
import { useTranslations } from "next-intl";
import type { Todo } from "@/types/todos";

export default function TodosPage() {
  const t = useTranslations();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [category, setCategory] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState<'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom'>('daily');
  const [recurrenceInterval, setRecurrenceInterval] = useState(1);
  const [recurrenceDaysOfWeek, setRecurrenceDaysOfWeek] = useState<number[]>([]);
  const [recurrenceDayOfMonth, setRecurrenceDayOfMonth] = useState(1);
  const [recurrenceEndDate, setRecurrenceEndDate] = useState("");
  const [tags, setTags] = useState("");
  
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const [user, setUser] = useState<any>(null);
  const [filterDate, setFilterDate] = useState<Date | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const router = useRouter();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }
    setUser(user);
    fetchTodos();
  };

  const fetchTodos = async () => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/todos`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!response.ok) throw new Error("Failed to fetch todos");
      
      const data = await response.json();
      setTodos(data);
    } catch (error: any) {
  toast.error(t("common.error"), { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const saveTodo = async () => {
    if (!title.trim()) {
      toast.error(t("common.error"));
      return;
    }

    setSaving(true);
    try {
      const token = await getToken();
      const url = editingTodo
        ? `${API_URL}/todos/${editingTodo.id}`
        : `${API_URL}/todos`;
      
      const todoData: any = { 
        title,
        description: description || undefined,
        is_done: editingTodo?.is_done || false,
        due_date: dueDate || null,
        due_time: dueTime || null,
        start_date: startDate || null,
        start_time: startTime || null,
        priority,
        category: category || null,
        tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : null,
        is_recurring: isRecurring,
      };

      if (isRecurring) {
        todoData.recurrence_type = recurrenceType;
        todoData.recurrence_interval = recurrenceInterval;
        todoData.recurrence_end_date = recurrenceEndDate || null;
        
        if (recurrenceType === 'weekly') {
          todoData.recurrence_days_of_week = recurrenceDaysOfWeek.length > 0 ? recurrenceDaysOfWeek : null;
        } else if (recurrenceType === 'monthly') {
          todoData.recurrence_day_of_month = recurrenceDayOfMonth;
        }
      } else {
        todoData.recurrence_type = null;
        todoData.recurrence_interval = null;
        todoData.recurrence_days_of_week = null;
        todoData.recurrence_day_of_month = null;
        todoData.recurrence_end_date = null;
      }
      
      const response = await fetch(url, {
        method: editingTodo ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(todoData),
      });

      if (!response.ok) throw new Error("Failed to save todo");

      toast.success(t("common.success"));
      setDialogOpen(false);
      resetForm();
      fetchTodos();
    } catch (error: any) {
      toast.error(t("common.error"), { description: error.message });
    } finally {
      setSaving(false);
    }
  };

  const toggleTodo = async (id: string, is_done: boolean) => {
    try {
      const token = await getToken();
      const todo = todos.find(t => t.id === id);
      if (!todo) return;

      // Send only the fields that exist in the todo
      // Convert null to undefined for optional fields (Zod validation)
      const updateData: any = {
        title: todo.title,
        description: todo.description || undefined,
        is_done: !is_done,
        due_date: todo.due_date || undefined,
        due_time: todo.due_time || undefined,
        start_date: todo.start_date || undefined,
        start_time: todo.start_time || undefined,
        priority: todo.priority,
        category: todo.category || undefined,
        tags: todo.tags || undefined,
        is_recurring: todo.is_recurring,
        recurrence_type: todo.recurrence_type || undefined,
        recurrence_interval: todo.recurrence_interval || undefined,
        recurrence_days_of_week: todo.recurrence_days_of_week || undefined,
        recurrence_day_of_month: todo.recurrence_day_of_month || undefined,
        recurrence_end_date: todo.recurrence_end_date || undefined,
      };

      const response = await fetch(`${API_URL}/todos/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error("Toggle error:", error);
        throw new Error("Failed to update");
      }

      toast.success(t("common.success"));
      fetchTodos();
    } catch (error: any) {
      toast.error(t("common.error"), { description: error.message });
    }
  };

  const deleteTodo = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"?`)) return;

    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/todos/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to delete");

      toast.success(t("common.success"));
      fetchTodos();
    } catch (error: any) {
      toast.error(t("common.error"), { description: error.message });
    }
  };

  const openEditDialog = (todo: Todo) => {
    setEditingTodo(todo);
    setTitle(todo.title);
    setDescription(todo.description || "");
    setDueDate(todo.due_date || "");
    setDueTime(todo.due_time || "");
    setStartDate(todo.start_date || "");
    setStartTime(todo.start_time || "");
    setPriority(todo.priority);
    setCategory(todo.category || "");
    setIsRecurring(todo.is_recurring);
    setRecurrenceType(todo.recurrence_type || 'daily');
    setRecurrenceInterval(todo.recurrence_interval || 1);
    setRecurrenceDaysOfWeek(todo.recurrence_days_of_week || []);
    setRecurrenceDayOfMonth(todo.recurrence_day_of_month || 1);
    setRecurrenceEndDate(todo.recurrence_end_date || "");
    setTags(todo.tags?.join(', ') || "");
    setDialogOpen(true);
  };

  const openNewDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingTodo(null);
    setTitle("");
    setDescription("");
    setDueDate("");
    setDueTime("");
    setStartDate("");
    setStartTime("");
    setPriority('medium');
    setCategory("");
    setIsRecurring(false);
    setRecurrenceType('daily');
    setRecurrenceInterval(1);
    setRecurrenceDaysOfWeek([]);
    setRecurrenceDayOfMonth(1);
    setRecurrenceEndDate("");
    setTags("");
  };

  const toggleDayOfWeek = (day: number) => {
    setRecurrenceDaysOfWeek(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day].sort()
    );
  };

  // Calendar helper functions
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const isSameDay = (date1: Date, date2: Date) => {
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
  };

  const getTodosForDate = (date: Date) => {
    return todos.filter(todo => {
      // Check due date
      if (todo.due_date) {
        const dueDate = new Date(todo.due_date);
        if (isSameDay(dueDate, date)) return true;
      }
      
      // Check start date
      if (todo.start_date) {
        const startDate = new Date(todo.start_date);
        if (isSameDay(startDate, date)) return true;
      }
      
      return false;
    });
  };

  const renderFilterCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    
    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="aspect-square" />);
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const isToday = isSameDay(date, new Date());
      const isSelected = filterDate && isSameDay(date, filterDate);
      const todosForDay = getTodosForDate(date);
      const hasTodos = todosForDay.length > 0;
      
      days.push(
        <button
          key={day}
          onClick={() => {
            setFilterDate(date);
            setCalendarOpen(false);
          }}
          className={`
            aspect-square p-2 rounded-lg transition-all duration-200 hover:scale-105 text-sm
            ${isSelected ? 'bg-accent text-accent-foreground shadow-lg scale-105' : 'hover:bg-muted'}
            ${isToday && !isSelected ? 'border-2 border-accent' : ''}
            relative group
          `}
        >
          <div className="font-medium">{day}</div>
          {hasTodos && (
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
              {todosForDay.slice(0, 3).map((todo, idx) => {
                const colors = {
                  low: 'bg-green-500',
                  medium: 'bg-yellow-500',
                  high: 'bg-orange-500',
                  urgent: 'bg-red-500'
                };
                return (
                  <div
                    key={idx}
                    className={`w-1 h-1 rounded-full ${colors[todo.priority]}`}
                  />
                );
              })}
            </div>
          )}
        </button>
      );
    }
    
    return (
      <div className="space-y-4">
        {/* Calendar Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </h3>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={prevMonth}
              className="hover:bg-muted"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setCurrentMonth(new Date());
                setFilterDate(new Date());
                setCalendarOpen(false);
              }}
              className="hover:bg-accent hover:text-accent-foreground"
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={nextMonth}
              className="hover:bg-muted"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-xs font-semibold text-muted-foreground p-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {days}
        </div>

        {/* Clear filter button */}
        {filterDate && (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              setFilterDate(null);
              setCalendarOpen(false);
            }}
          >
            Clear Date Filter
          </Button>
        )}
      </div>
    );
  };

  const filteredTodos = todos.filter((todo) => {
    // Filter by status
    if (filter === "active" && todo.is_done) return false;
    if (filter === "completed" && !todo.is_done) return false;
    
    // Filter by date - check BOTH due_date AND start_date
    if (filterDate) {
      let hasMatchingDate = false;
      
      // Check due date
      if (todo.due_date) {
        const dueDate = new Date(todo.due_date);
        if (isSameDay(dueDate, filterDate)) {
          hasMatchingDate = true;
        }
      }
      
      // Check start date
      if (todo.start_date && !hasMatchingDate) {
        const startDate = new Date(todo.start_date);
        if (isSameDay(startDate, filterDate)) {
          hasMatchingDate = true;
        }
      }
      
      // If no matching date found, filter out
      if (!hasMatchingDate) {
        return false;
      }
    }
    
    return true;
  });

  const stats = {
    total: todos.length,
    active: todos.filter((t) => !t.is_done).length,
    completed: todos.filter((t) => t.is_done).length,
    progress: todos.length > 0 ? (todos.filter((t) => t.is_done).length / todos.length) * 100 : 0,
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
            <CheckSquare className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">To-Dos</h1>
            <p className="text-sm text-muted-foreground">Track your tasks and stay productive</p>
          </div>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNewDialog} className="bg-accent hover:bg-accent/90 text-accent-foreground">
              <Plus className="w-4 h-4" />
              New Todo
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-foreground">
                {editingTodo ? "Edit Todo" : "Create New Todo"}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                {editingTodo ? "Make changes to your todo" : "Add a new task to your list"}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              {/* Title */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Title *</label>
                <Input
                  placeholder="Enter todo title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="border-border focus:border-accent focus:ring-accent bg-background text-foreground"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Description</label>
                <Textarea
                  placeholder="Add more details..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="border-border focus:border-accent focus:ring-accent bg-background text-foreground"
                />
              </div>

              {/* Priority */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground focus:border-accent focus:ring-accent"
                >
                  <option value="low">🟢 Low</option>
                  <option value="medium">🟡 Medium</option>
                  <option value="high">🟠 High</option>
                  <option value="urgent">🔴 Urgent</option>
                </select>
              </div>

              {/* Date and Time Section */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Start Date</label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="border-border focus:border-accent focus:ring-accent bg-background text-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Start Time</label>
                  <Input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="border-border focus:border-accent focus:ring-accent bg-background text-foreground"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Due Date</label>
                  <Input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="border-border focus:border-accent focus:ring-accent bg-background text-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Due Time</label>
                  <Input
                    type="time"
                    value={dueTime}
                    onChange={(e) => setDueTime(e.target.value)}
                    className="border-border focus:border-accent focus:ring-accent bg-background text-foreground"
                  />
                </div>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Category</label>
                <Input
                  placeholder="e.g., Work, Personal, School..."
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="border-border focus:border-accent focus:ring-accent bg-background text-foreground"
                />
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Tags</label>
                <Input
                  placeholder="Separate tags with commas: urgent, important, review..."
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="border-border focus:border-accent focus:ring-accent bg-background text-foreground"
                />
              </div>

              {/* Recurring Checkbox */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={isRecurring}
                  onCheckedChange={(checked) => setIsRecurring(checked as boolean)}
                  className="border-accent data-[state=checked]:bg-accent"
                />
                <label className="text-sm font-medium text-foreground cursor-pointer">
                  Recurring Task
                </label>
              </div>

              {/* Recurrence Options (shown when isRecurring is true) */}
              {isRecurring && (
                <div className="space-y-4 p-4 border border-border rounded-lg bg-muted/50">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Repeat Type</label>
                    <select
                      value={recurrenceType}
                      onChange={(e) => setRecurrenceType(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground focus:border-accent"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Repeat every {recurrenceInterval} {recurrenceType === 'daily' ? 'day(s)' : recurrenceType === 'weekly' ? 'week(s)' : recurrenceType === 'monthly' ? 'month(s)' : 'year(s)'}
                    </label>
                    <Input
                      type="number"
                      min="1"
                      value={recurrenceInterval}
                      onChange={(e) => setRecurrenceInterval(parseInt(e.target.value) || 1)}
                      className="border-border focus:border-accent focus:ring-accent bg-background text-foreground"
                    />
                  </div>

                  {recurrenceType === 'weekly' && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Repeat on</label>
                      <div className="flex flex-wrap gap-2">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                          <Button
                            key={day}
                            type="button"
                            variant={recurrenceDaysOfWeek.includes(index) ? "default" : "outline"}
                            size="sm"
                            onClick={() => toggleDayOfWeek(index)}
                            className={recurrenceDaysOfWeek.includes(index) ? "bg-accent" : ""}
                          >
                            {day}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {recurrenceType === 'monthly' && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Day of month</label>
                      <Input
                        type="number"
                        min="1"
                        max="31"
                        value={recurrenceDayOfMonth}
                        onChange={(e) => setRecurrenceDayOfMonth(parseInt(e.target.value) || 1)}
                        className="border-border focus:border-accent focus:ring-accent bg-background text-foreground"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">End Date (optional)</label>
                    <Input
                      type="date"
                      value={recurrenceEndDate}
                      onChange={(e) => setRecurrenceEndDate(e.target.value)}
                      className="border-border focus:border-accent focus:ring-accent bg-background text-foreground"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-border text-foreground hover:bg-muted">
                Cancel
              </Button>
              <Button onClick={saveTodo} disabled={saving} className="bg-accent hover:bg-accent/90 text-accent-foreground">
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>{editingTodo ? "Update" : "Create"}</>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Progress Bar */}
      {todos.length > 0 && (
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-foreground">Progress</span>
                <span className="text-muted-foreground">
                  {stats.completed} of {stats.total} completed
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent transition-all duration-500"
                  style={{ width: `${stats.progress}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filter Tabs and Date Filter */}
      <div className="flex items-center gap-4">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as any)} className="flex-1">
          <TabsList className="bg-muted">
            <TabsTrigger value="all" className="data-[state=active]:bg-card data-[state=active]:text-accent">
              {t("todos.filter_all")} ({stats.total})
            </TabsTrigger>
            <TabsTrigger value="active" className="data-[state=active]:bg-card data-[state=active]:text-accent">
              {t("todos.filter_active")} ({stats.active})
            </TabsTrigger>
            <TabsTrigger value="completed" className="data-[state=active]:bg-card data-[state=active]:text-accent">
              {t("todos.filter_completed")} ({stats.completed})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Date Filter Button */}
        <Dialog open={calendarOpen} onOpenChange={setCalendarOpen}>
          <DialogTrigger asChild>
            <Button
              variant={filterDate ? "default" : "outline"}
              className={filterDate ? "bg-accent hover:bg-accent/90" : ""}
            >
              <CalendarIcon className="w-4 h-4 mr-2" />
              {filterDate ? filterDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Filter by Date'}
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border max-w-md">
            <DialogHeader>
              <DialogTitle className="text-foreground">Filter by Date</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Select a date to view tasks scheduled for that day
              </DialogDescription>
            </DialogHeader>
            {renderFilterCalendar()}
          </DialogContent>
        </Dialog>
      </div>

      {/* Active Filters Display */}
      {filterDate && (
        <div className="flex items-center gap-2 p-3 bg-accent/10 border border-accent/20 rounded-lg">
          <CalendarIcon className="w-4 h-4 text-accent" />
          <span className="text-sm text-foreground">
            Showing tasks for: <strong>{filterDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</strong>
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFilterDate(null)}
            className="ml-auto hover:bg-accent/20"
          >
            Clear
          </Button>
        </div>
      )}

      {/* Todos List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="animate-pulse bg-card border-border">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-4 h-4 bg-muted rounded"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-5 bg-muted rounded w-1/3"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredTodos.length === 0 ? (
        <Card className="border-2 border-dashed border-border bg-card">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <ListTodo className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              {filter === "all" ? t("todos.no_todos") : filter === "active" ? t("todos.no_active") : t("todos.no_completed")}
            </h3>
            <p className="text-muted-foreground mb-6 text-center">
              {filter === "all" ? t("todos.create_first") : t("todos.no_tasks", { filter })}
            </p>
            {filter === "all" && (
              <Button onClick={openNewDialog} className="bg-accent hover:bg-accent/90 text-accent-foreground">
                <Plus className="w-4 h-4" />
                {t("todos.create_todo")}
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredTodos.map((todo) => {
            const priorityColors = {
              low: 'text-green-500',
              medium: 'text-yellow-500',
              high: 'text-orange-500',
              urgent: 'text-red-500'
            };
            
            const priorityIcons = {
              low: '🟢',
              medium: '🟡',
              high: '🟠',
              urgent: '🔴'
            };

            return (
              <Card
                key={todo.id}
                className="group hover:shadow-md transition-all duration-200 bg-card border-border hover:border-accent"
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <Checkbox
                      checked={todo.is_done}
                      onCheckedChange={() => toggleTodo(todo.id, todo.is_done)}
                      className="mt-1 border-accent data-[state=checked]:bg-accent"
                    />
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-start gap-2">
                        <span className="text-lg">{priorityIcons[todo.priority]}</span>
                        <h3
                          className={`font-semibold text-lg transition-all ${
                            todo.is_done
                              ? "line-through text-muted-foreground"
                              : "text-foreground group-hover:text-accent"
                          }`}
                        >
                          {todo.title}
                        </h3>
                      </div>

                      {todo.description && (
                        <p className={`text-sm ${todo.is_done ? "line-through text-muted-foreground" : "text-muted-foreground"}`}>
                          {todo.description}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                        {todo.due_date && (
                          <span className="flex items-center gap-1">
                            📅 Due: {new Date(todo.due_date).toLocaleDateString()}
                            {todo.due_time && ` at ${todo.due_time}`}
                          </span>
                        )}
                        {todo.start_date && (
                          <span className="flex items-center gap-1">
                            🚀 Start: {new Date(todo.start_date).toLocaleDateString()}
                            {todo.start_time && ` at ${todo.start_time}`}
                          </span>
                        )}
                        {todo.category && (
                          <span className="px-2 py-1 bg-accent/10 text-accent rounded-md">
                            📁 {todo.category}
                          </span>
                        )}
                        {todo.is_recurring && (
                          <span className="px-2 py-1 bg-blue-500/10 text-blue-500 rounded-md">
                            🔄 {todo.recurrence_type}
                          </span>
                        )}
                      </div>

                      {todo.tags && todo.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {todo.tags.map((tag, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 text-xs bg-muted text-muted-foreground rounded-full"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}

                      <p className="text-xs text-muted-foreground/50">
                        Updated: {new Date(todo.updated_at).toLocaleDateString()} at {new Date(todo.updated_at).toLocaleTimeString()}
                      </p>
                    </div>

                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(todo)}
                        className="hover:bg-muted"
                      >
                        <Edit className="w-4 h-4 text-muted-foreground" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteTodo(todo.id, todo.title)}
                        className="hover:bg-red-900/20 hover:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
