"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  StickyNote,
  CheckSquare,
  Brain,
  Lock,
  Dumbbell,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  className?: string;
}

const navigation = [
  {
    name: "Notes",
    href: "/dashboard/notes",
    icon: StickyNote,
  },
  {
    name: "To-Dos",
    href: "/dashboard/todos",
    icon: CheckSquare,
  },
  {
    name: "Flashcards",
    href: "/dashboard/flashcards",
    icon: Brain,
  },
  {
    name: "Passwords",
    href: "/dashboard/passwords",
    icon: Lock,
  },
  {
    name: "Workouts",
    href: "/dashboard/workouts",
    icon: Dumbbell,
  },
];

export function Sidebar({ className }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden bg-white shadow-lg"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </Button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-gray-900/50 z-40 lg:hidden animate-fade-in"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-screen bg-card border-r border-border z-40 transition-all duration-300 ease-in-out",
          collapsed ? "w-16" : "w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          className
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-border">
            {!collapsed && (
              <h1 className="text-xl font-bold text-foreground animate-fade-in">
                Notisafe
              </h1>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="hidden lg:flex ml-auto hover:bg-muted"
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? (
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronLeft className="w-4 h-4 text-muted-foreground" />
              )}
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname?.includes(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                    isActive
                      ? "bg-accent text-accent-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon
                    className={cn(
                      "w-5 h-5 flex-shrink-0 transition-colors",
                      isActive ? "text-accent-foreground" : "text-accent group-hover:text-accent"
                    )}
                  />
                  {!collapsed && (
                    <span className="text-sm font-medium animate-fade-in">
                      {item.name}
                    </span>
                  )}
                  {isActive && !collapsed && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-accent-foreground animate-fade-in" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-border">
            {!collapsed ? (
              <div className="bg-accent/10 rounded-lg p-3 animate-fade-in">
                <p className="text-xs font-medium text-foreground mb-1">
                  Pro Version
                </p>
                <p className="text-xs text-muted-foreground">
                  Unlimited access to all features
                </p>
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center mx-auto">
                <span className="text-xs font-bold text-accent">P</span>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
