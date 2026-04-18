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

type AuthFormError = {
  message?: string;
  code?: string;
  statusCode?: number;
};

export function AuthForm({ mode }: AuthFormProps) {
  const t = useTranslations();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const getErrorMessage = (error: AuthFormError) => {
    if (error?.message) return error.message;

    return mode === "login"
      ? "Unable to complete login right now. Please try again later."
      : "Unable to create account right now. Please try again later.";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const supabase = createClient();

    try {
      if (mode === "register") {
        const { data, error } = await supabase.auth.signUp({ email, password });
        
        if (error) throw error;
        
        if (data.user) {
          toast.success(t("common.success"), {
            description: "Welcome to Nous. Redirecting...",
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
    } catch (error: unknown) {
      toast.error(t("common.error"), {
        description: getErrorMessage(error as AuthFormError),
      });
    } finally {
      setLoading(false);
    }
  };

  return (

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
              {mode === "register" && "Mínimo de 6 caracteres"}
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button
            type="submit"
            className="w-full h-11 text-base font-medium"
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
          <div className="text-center text-xs">
            {mode === "register" ? (
              <p className="text-muted-foreground">
                {t("auth.have_account")} {""}
                <Link href="/login" className="text-accent font-medium hover:underline">
                  {t("auth.login")}
                </Link>
              </p>
            ) : (
              <p className="text-muted-foreground">
                {t("auth.no_account")} {""}
                <Link href="/register" className="text-accent font-medium hover:underline">
                  {t("auth.register")}
                </Link>
              </p>
            )}
          </div>
        </CardFooter>
      </form>
 
  );
}
