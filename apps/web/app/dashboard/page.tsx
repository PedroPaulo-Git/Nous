"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StickyNote, CheckSquare, Brain, Lock, ArrowRight, Dumbbell } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { getToken, API_URL } from "@/lib/api";
import { createClient } from "@/lib/supabase-client";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const t = useTranslations();
  const router = useRouter();
  const [stats, setStats] = useState({
    notes: 0,
    todos: 0,
    decks: 0,
    passwords: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUserAndFetchStats();
  }, []);

  const checkUserAndFetchStats = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      router.push("/login");
      return;
    }

    await fetchStats();
  };

  const fetchStats = async () => {
    try {
      const token = await getToken();

      // Fetch all stats in parallel
      const [notesRes, todosRes, decksRes, passwordsRes] = await Promise.all([
        fetch(`${API_URL}/notes`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/todos`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/flashcards/decks`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/passwords`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const [notes, todos, decks, passwords] = await Promise.all([
        notesRes.ok ? notesRes.json() : [],
        todosRes.ok ? todosRes.json() : [],
        decksRes.ok ? decksRes.json() : [],
        passwordsRes.ok ? passwordsRes.json() : [],
      ]);

      setStats({
        notes: notes.length || 0,
        todos: todos.filter((t: any) => !t.is_done).length || 0,
        decks: decks.length || 0,
        passwords: passwords.length || 0,
      });
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const tools = [
    {
      name: t("dashboard.tool_notes"),
      description: t("dashboard.tool_notes_desc"),
      icon: StickyNote,
      href: "/dashboard/notes",
      color: "text-accent",
    },
    {
      name: t("dashboard.tool_todos"),
      description: t("dashboard.tool_todos_desc"),
      icon: CheckSquare,
      href: "/dashboard/todos",
      color: "text-accent",
    },
    {
      name: t("dashboard.tool_flashcards"),
      description: t("dashboard.tool_flashcards_desc"),
      icon: Brain,
      href: "/dashboard/flashcards",
      color: "text-accent",
    },
    {
      name: t("dashboard.tool_passwords"),
      description: t("dashboard.tool_passwords_desc"),
      icon: Lock,
      href: "/dashboard/passwords",
      color: "text-accent",
    },
    {
      name: t("dashboard.tool_workouts"),
      description: t("dashboard.tool_workouts_desc"),
      icon: Dumbbell,
      href: "/dashboard/workouts",
      color: "text-accent",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            {t("dashboard.title")}
          </h1>
          <p className="text-lg text-muted-foreground">
            {t("dashboard.subtitle")}
          </p>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tools.map((tool) => {
            const Icon = tool.icon;

            return (
              <Link key={tool.name} href={tool.href}>
                <Card className="p-6 hover:shadow-lg transition-all duration-200 group cursor-pointer border-border bg-card hover:bg-muted">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 rounded-lg bg-accent/10 group-hover:bg-accent/20 transition-colors">
                      <Icon className={`w-8 h-8 ${tool.color}`} />
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-accent group-hover:translate-x-1 transition-all" />
                  </div>

                  <h2 className="text-2xl font-bold text-foreground mb-2">
                    {tool.name}
                  </h2>
                  <p className="text-muted-foreground">
                    {tool.description}
                  </p>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Stats Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="p-6 border-border bg-card">
            <p className="text-sm text-muted-foreground mb-1">{t("dashboard.stats_total_notes")}</p>
            <p className="text-3xl font-bold text-foreground">
              {loading ? "..." : stats.notes}
            </p>
          </Card>
          <Card className="p-6 border-border bg-card">
            <p className="text-sm text-muted-foreground mb-1">{t("dashboard.stats_active_todos")}</p>
            <p className="text-3xl font-bold text-foreground">
              {loading ? "..." : stats.todos}
            </p>
          </Card>
          <Card className="p-6 border-border bg-card">
            <p className="text-sm text-muted-foreground mb-1">{t("dashboard.stats_flashcard_decks")}</p>
            <p className="text-3xl font-bold text-foreground">
              {loading ? "..." : stats.decks}
            </p>
          </Card>
          <Card className="p-6 border-border bg-card">
            <p className="text-sm text-muted-foreground mb-1">{t("dashboard.stats_saved_passwords")}</p>
            <p className="text-3xl font-bold text-foreground">
              {loading ? "..." : stats.passwords}
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
