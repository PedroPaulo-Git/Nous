'use client';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ThemeToggle } from './ThemeToggle';
import { LangSwitcher } from './LangSwitcher';
import { createClient } from '@/lib/supabase-client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LogOut, LogIn, UserPlus } from 'lucide-react';
import type { User } from '@/types';

export function Navbar({ user }: { user: User | null }) {
  const t = useTranslations();
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-border backdrop-blur-sm bg-card/95">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold text-foreground hover:text-accent transition-colors">
          Notisafe
        </Link>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <LangSwitcher />
          {user ? (
            <Button
              onClick={handleLogout}
              variant="outline"
              className="border-border text-foreground hover:bg-muted"
            >
              <LogOut className="w-4 h-4 mr-2" />
              {t('auth.logout')}
            </Button>
          ) : (
            <>
              <Link href="/login">
                <Button variant="outline" className="border-border text-foreground hover:bg-muted">
                  <LogIn className="w-4 h-4 mr-2" />
                  {t('auth.login')}
                </Button>
              </Link>
              <Link href="/register">
                <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
                  <UserPlus className="w-4 h-4 mr-2" />
                  {t('auth.register')}
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
