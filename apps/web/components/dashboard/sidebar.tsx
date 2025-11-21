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
  Home,
  LayoutDashboard,
  Droplets,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useTranslations } from "next-intl";

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
  {
    name: "Drink Water",
    href: "/dashboard/drinkwater",
    icon: Droplets,
  },
];

export function Sidebar({ className }: SidebarProps) {
  const t = useTranslations();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Menu Button - only show when sidebar is closed */}
      {!mobileOpen && (
        <Button
          variant="ghost"
          size="icon"
          className="fixed top-4 left-4 z-50 lg:hidden bg-card border border-border shadow-lg hover:bg-accent hover:text-accent-foreground"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </Button>
      )}

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-screen bg-card border-r border-border z-50 transition-all duration-300 ease-in-out",
          collapsed ? "w-16" : "w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          className
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-border bg-card">
            {!collapsed ? (
              <Link href="/" className="flex items-center gap-3 group">
                <div className="relative w-20 rounded-lg overflow-hidden flex items-center justify-center group-hover:scale-105 transition-transform">
                            <Image
                              src="/assets/Nous_assets/Nous_Logo_banner_white.png"
                              alt="Nous Logo"
                              width={100}
                              height={100}
                              className="object-contain"
                            />
                          </div>
               
              </Link>
            ) : (
              <div onClick={() => setCollapsed(!collapsed)} className="mx-auto group cursor-pointer">
                <div className="relative w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Image
                    src="/assets/Nous_assets/Logo_600px.png"
                    alt="Nous"
                    width={100}
                    height={100}
                    className="object-contain"
                  />
                </div>
              </div>
            )}
            
            {/* Close button for mobile */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden hover:bg-muted"
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </Button>
            
            {/* Collapse button for desktop */}
            <Button
              variant="ghost"
              size="icon"
              className="hidden lg:flex ml-auto hover:bg-muted hover:text-accent transition-all"
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? (
                <></>
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* Quick Navigation */}
          <div className="px-3 py-3 border-b border-border bg-muted/20">
            <Link
              href="/"
              className={cn(
                "flex items-center gap-3 px-2.5 py-2 rounded-lg transition-all duration-200 group mb-2",
                "text-muted-foreground hover:bg-accent/10 hover:text-accent"
              )}
            >
              <Home className="w-5 h-5 flex-shrink-0" />
              {!collapsed && (
                <span className="text-sm font-medium">
                  {t('common.home')}
                </span>
              )}
            </Link>
            <Link
              href="/dashboard"
              className={cn(
                "flex items-center gap-3 px-2.5 py-2 rounded-lg transition-all duration-200 group",
                pathname === '/dashboard'
                  ? "bg-accent text-accent-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-accent/10 hover:text-accent"
              )}
            >
              <LayoutDashboard className="w-5 h-5 flex-shrink-0" />
              {!collapsed && (
                <span className="text-sm font-medium">
                  {t('common.dashboard')}
                </span>
              )}
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
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
                      : "text-muted-foreground hover:bg-accent/10 hover:text-accent"
                  )}
                >
                  <div className={cn(
                    "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-all",
                    isActive ? "bg-accent-foreground/10" : "bg-accent/10 group-hover:bg-accent/20"
                  )}>
                    <Icon
                      className={cn(
                        "w-5 h-5 transition-colors",
                        isActive ? "text-accent-foreground" : "text-accent"
                      )}
                    />
                  </div>
                  {!collapsed && (
                    <span className="text-sm font-medium flex-1">
                      {item.name}
                    </span>
                  )}
                  {isActive && !collapsed && (
                    <div className="w-2 h-2 rounded-full bg-accent-foreground" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-border bg-muted/20">
            {!collapsed ? (
              <div className="bg-gradient-to-br from-accent/20 to-accent/5 rounded-lg p-4 border border-accent/20">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                  <p className="text-xs font-semibold text-foreground">
                    Premium Active
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Unlimited access to all features
                </p>
              </div>
            ) : (
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/20 flex items-center justify-center mx-auto">
                <span className="text-sm font-bold text-accent">P</span>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
