import type { Metadata } from 'next';
import { getMessages, getLocale } from 'next-intl/server';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/toaster';
import { IntlProvider } from '@/components/providers/intl-provider';
import './globals.css';

export const metadata: Metadata = {
  title: 'Nous – All-in-One Productivity Suite',
  description: 'Flashcards, To-Dos, Notes, and Secure Password Manager in one platform.',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const messages = await getMessages();
  const locale = await getLocale();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <IntlProvider locale={locale} messages={messages}>
            {children}
            <Toaster />
          </IntlProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
