'use client';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ThemeToggle } from './ThemeToggle';
import { LangSwitcher } from './LangSwitcher';
import { createClient } from '@/lib/supabase-client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LogOut, LogIn, UserPlus, Home, LayoutDashboard, Menu, X } from 'lucide-react';
import React from 'react';
import type { User } from '@/types';
import Image from 'next/image';

export function Navbar({ user }: { user: User | null }) {
  const t = useTranslations();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-border backdrop-blur-lg bg-card/70 supports-[backdrop-filter]:bg-card/60 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-18 h-18 -my-2 rounded-xl overflow-hidden flex items-center justify-center group-hover:scale-105 transition-transform">
            <Image
              src="/assets/Nous_assets/Nous_Logo_banner_white.png"
              alt="Nous Logo"
              width={80}
              height={80}
              className="object-contain"
              priority
            />
          </div>
        </Link>
        <div className="flex items-center gap-1">
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <LangSwitcher />
            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-2 ml-2">
              {user && (
                <>
                  <Link href="/">
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground hover:bg-muted">
                      <Home className="w-4 h-4 mr-1" />{t('common.home')}
                    </Button>
                  </Link>
                  <Link href="/dashboard">
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground hover:bg-muted">
                      <LayoutDashboard className="w-4 h-4 mr-1" />{t('common.dashboard')}
                    </Button>
                  </Link>
                </>
              )}
              {user ? (
                <Button onClick={handleLogout} variant="outline" size="sm" className="border-border text-foreground hover:bg-muted hover:text-accent">
                  <LogOut className="w-4 h-4 mr-1" />{t('auth.logout')}
                </Button>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="ghost" size="sm" className="text-foreground hover:bg-muted">
                      <LogIn className="w-4 h-4 mr-1" />{t('auth.login')}
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button size="sm" className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-sm hover:shadow-md">
                      <UserPlus className="w-4 h-4 mr-1" />{t('auth.register')}
                    </Button>
                  </Link>
                </>
              )}
            </div>
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden ml-1 text-muted-foreground hover:text-accent"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle navigation"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </div>
      {/* Mobile slide-down panel */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-card/90 backdrop-blur-xl animate-fade-in px-4 pb-4">
          <div className="flex flex-col gap-2 pt-4">
            {user && (
              <>
                <Link href="/" onClick={() => setMobileOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-muted">
                    <Home className="w-4 h-4 mr-2" />{t('common.home')}
                  </Button>
                </Link>
                <Link href="/dashboard" onClick={() => setMobileOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-muted">
                    <LayoutDashboard className="w-4 h-4 mr-2" />{t('common.dashboard')}
                  </Button>
                </Link>
              </>
            )}
            {user ? (
              <Button onClick={() => { handleLogout(); setMobileOpen(false); }} variant="outline" className="w-full justify-start border-border text-foreground hover:bg-muted hover:text-accent">
                <LogOut className="w-4 h-4 mr-2" />{t('auth.logout')}
              </Button>
            ) : (
              <>
                <Link href="/login" onClick={() => setMobileOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start text-foreground hover:bg-muted">
                    <LogIn className="w-4 h-4 mr-2" />{t('auth.login')}
                  </Button>
                </Link>
                <Link href="/register" onClick={() => setMobileOpen(false)}>
                  <Button className="w-full justify-start bg-accent hover:bg-accent/90 text-accent-foreground shadow-sm hover:shadow-md">
                    <UserPlus className="w-4 h-4 mr-2" />{t('auth.register')}
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
