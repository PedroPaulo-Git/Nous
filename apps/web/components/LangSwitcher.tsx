'use client';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export function LangSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const [locale, setLocale] = useState('en');

  useEffect(() => {
    const stored = document.cookie
      .split('; ')
      .find((row) => row.startsWith('NEXT_LOCALE='))
      ?.split('=')[1];
    if (stored) setLocale(stored);
  }, []);

  const handleChange = (newLocale: string) => {
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`;
    setLocale(newLocale);
    router.refresh();
  };

  return (
    <select
      value={locale}
      onChange={(e) => handleChange(e.target.value)}
      className="px-3 py-2 bg-gray-800 dark:bg-gray-200 text-white dark:text-black rounded"
    >
      <option value="en">EN</option>
      <option value="pt-BR">PT-BR</option>
    </select>
  );
}
