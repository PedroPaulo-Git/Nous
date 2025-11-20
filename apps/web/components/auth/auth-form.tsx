"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { LogIn, UserPlus, Loader2, Mail, Lock } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useTranslations } from "next-intl";

interface AuthFormProps {
  mode: "login" | "register";
}

export function AuthForm({ mode }: AuthFormProps) {
  const t = useTranslations();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const supabase = createClient();

    try {
      if (mode === "register") {
        const { data, error } = await supabase.auth.signUp({ email, password });
        
        if (error) throw error;
        
        if (data.user) {
          // Create profile
          const { error: profileError } = await supabase
            .from("profiles")
            .insert({ id: data.user.id, is_subscribed: false, is_admin: false });
          
          if (profileError) throw profileError;
          
          toast.success(t("common.success"), {
            description: "Welcome to Notisafe. Redirecting...",
          });
          
          setTimeout(() => {
            router.push("/");
            router.refresh();
          }, 1000);
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        
        if (error) throw error;
        
        toast.success(t("common.success"), {
          description: "You've successfully logged in.",
        });
        
        setTimeout(() => {
          router.push("/");
          router.refresh();
        }, 1000);
      }
    } catch (error: any) {
      toast.error(t("common.error"), {
        description: error.message || "Please check your credentials and try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-blue-950">
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      
      <Card className="w-full max-w-md relative shadow-2xl border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <CardHeader className="space-y-1 text-center pb-6">
          <div className="mx-auto w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-4 shadow-lg">
            {mode === "register" ? (
              <UserPlus className="w-6 h-6 text-white" />
            ) : (
              <LogIn className="w-6 h-6 text-white" />
            )}
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {mode === "register" ? t("auth.register_title") : t("auth.login_title")}
          </CardTitle>
          <CardDescription className="text-base">
            {mode === "register"
              ? "Start your productivity journey with Notisafe"
              : "Sign in to access your productivity suite"}
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                {t("auth.email")}
              </label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="h-11"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Lock className="w-4 h-4 text-muted-foreground" />
                {t("auth.password")}
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                minLength={6}
                className="h-11"
              />
              <p className="text-xs text-muted-foreground">
                {mode === "register" && "Minimum 6 characters"}
              </p>
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full h-11 text-base font-semibold shadow-lg hover:shadow-xl transition-all"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t("common.loading")}
                </>
              ) : (
                <>
                  {mode === "register" ? (
                    <>
                      <UserPlus className="w-4 h-4" />
                      {t("auth.register")}
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      {t("auth.login")}
                    </>
                  )}
                </>
              )}
            </Button>
            
            <div className="text-center text-sm">
              {mode === "register" ? (
                <p className="text-muted-foreground">
                  {t("auth.have_account")} {""}
                  <Link href="/login" className="text-primary font-semibold hover:underline">
                    {t("auth.login")}
                  </Link>
                </p>
              ) : (
                <p className="text-muted-foreground">
                  {t("auth.no_account")} {""}
                  <Link href="/register" className="text-primary font-semibold hover:underline">
                    {t("auth.register")}
                  </Link>
                </p>
              )}
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
