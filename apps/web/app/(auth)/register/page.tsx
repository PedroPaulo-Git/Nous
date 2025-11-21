"use client";
import { AuthForm } from "@/components/auth/auth-form";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, UserPlus, Sparkles, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

export default function RegisterPage() {
  const t = useTranslations("landing");
  const common = useTranslations("common");
  return (
    <div className="min-h-screen relative overflow-hidden bg-background">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-[8%] w-72 h-72 bg-accent/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-[12%] w-64 h-64 bg-accent/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-[26rem] h-[26rem] bg-accent/10 rounded-full blur-3xl" />
      </div>
      <div className="container mx-auto px-4 py-20 flex flex-col items-center">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-accent transition-colors mb-6 self-start">
          <ArrowLeft className="w-4 h-4" /> {common("home")}
        </Link>
        <div className="relative w-20 h-20 mb-2">
          <Image src="/assets/Nous_assets/Logo_600px.png" alt="Nous Logo" fill className="object-contain" priority />
        </div>
        <h1 className="text-4xl font-bold text-foreground mb-3 text-center">
          {t("cta_create")}
        </h1>
        <p className="text-muted-foreground max-w-md text-center mb-10">
          Create your account and unlock all integrated productivity tools.
        </p>
       <div className="w-full max-w-md backdrop-blur-sm  p-6 space-y-6 transition-all">
    
          <AuthForm mode="register" />
         
        </div>
      </div>
    </div>
  );
}
