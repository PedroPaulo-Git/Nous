import { getUser, getProfile } from '@/lib/auth';
import { getTranslations } from 'next-intl/server';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  StickyNote,
  CheckSquare,
  Brain,
  Lock,
  Zap,
  Shield,
  Globe,
  Sparkles,
  ArrowRight,
  Check,
} from 'lucide-react';
import Link from 'next/link';

export default async function HomePage() {
  const user = await getUser();
  const tLanding = await getTranslations('landing');
  const profile = user ? await getProfile(user.id) : null;
  const freePlanLimit = 10;

  if (user && profile) {
    return (
      <>
        <Navbar user={user} />
        <main className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-16">
            {!profile.is_subscribed ? (
              <div className="max-w-4xl mx-auto space-y-8">
                <div className="text-center space-y-4">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-semibold mb-4">
                    <Check className="w-4 h-4" />
                    Free Plan Active
                  </div>
                  <h1 className="text-5xl lg:text-6xl font-bold text-foreground">
                    Your workspace is ready
                  </h1>
                  <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    Use the dashboard normally on the free plan. You can create up to {freePlanLimit} notes, todos, flashcards, and passwords before upgrading.
                  </p>
                </div>

                <Card className="border-accent/50 bg-card hover:shadow-2xl transition-shadow">
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                      {[
                        { icon: StickyNote, title: `Up to ${freePlanLimit} Notes`, desc: 'Capture your ideas without paying upfront' },
                        { icon: CheckSquare, title: `Up to ${freePlanLimit} To-Dos`, desc: 'Manage daily work and personal tasks' },
                        { icon: Brain, title: `Up to ${freePlanLimit} Flashcards`, desc: 'Study with a focused starter collection' },
                        { icon: Lock, title: `Up to ${freePlanLimit} Passwords`, desc: 'Store your most important credentials securely' },
                      ].map((feature, i) => (
                        <div key={i} className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0">
                            <feature.icon className="w-6 h-6 text-accent" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground mb-1">{feature.title}</h3>
                            <p className="text-sm text-muted-foreground">{feature.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="text-center space-y-4">
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                        <Link href="/dashboard">
                          <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground text-lg px-8">
                            View Dashboard
                            <ArrowRight className="w-5 h-5 ml-2" />
                          </Button>
                        </Link>
                        <Link href="/pricing">
                          <Button size="lg" variant="outline" className="text-lg px-8 border-border text-foreground hover:bg-muted">
                            View Pricing
                          </Button>
                        </Link>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Premium is enabled manually for now and removes all usage limits.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="max-w-4xl mx-auto space-y-8">
                <div className="text-center space-y-4">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-semibold mb-4">
                    <Check className="w-4 h-4" />
                    Premium Active
                  </div>
                  <h1 className="text-5xl lg:text-6xl font-bold text-foreground">
                    Welcome Back!
                  </h1>
                  <p className="text-xl text-muted-foreground">
                    Ready to boost your productivity?
                  </p>
                </div>

                <Card className="border-accent/50 bg-card hover:shadow-2xl transition-shadow">
                  <CardContent className="pt-6 text-center space-y-6">
                    <div className="w-20 h-20 rounded-full bg-accent/20 flex items-center justify-center mx-auto">
                      <Sparkles className="w-10 h-10 text-accent" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-foreground mb-2">
                        Your Workspace Awaits
                      </h2>
                      <p className="text-muted-foreground">
                        Access all your tools, notes, tasks, and more in one place
                      </p>
                    </div>
                    <Link href="/dashboard">
                      <Button size="lg" className="bg-accent hover:bg-accent/90 mt-4 text-accent-foreground text-lg px-8">
                        Go to Dashboard
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { icon: StickyNote, label: 'Notes', value: 'Unlimited' },
                    { icon: CheckSquare, label: 'Tasks', value: 'Unlimited' },
                    { icon: Brain, label: 'Decks', value: 'Unlimited' },
                    { icon: Lock, label: 'Passwords', value: 'Unlimited' },
                  ].map((stat, i) => (
                    <Card key={i} className="bg-card border-border">
                      <CardContent className="pt-6 text-center">
                        <stat.icon className="w-6 h-6 text-accent mx-auto mb-2" />
                        <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                        <p className="text-sm text-muted-foreground">{stat.label}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
      </>
    );
  }

  const features = [
    {
      icon: StickyNote,
      title: 'Smart Notes',
      description: 'Capture ideas instantly with rich formatting and organization',
    },
    {
      icon: CheckSquare,
      title: 'Task Management',
      description: 'Stay on top of your to-dos with beautiful progress tracking',
    },
    {
      icon: Brain,
      title: 'Flashcards',
      description: 'Master any subject with spaced repetition learning',
    },
    {
      icon: Lock,
      title: 'Password Vault',
      description: 'Military-grade encryption keeps passwords secure',
    },
  ];

  const benefits = [
    { icon: Zap, title: 'Lightning Fast', description: 'Built for instant response times' },
    { icon: Shield, title: 'Bank-Level Security', description: 'AES-256 encryption with PBKDF2' },
    { icon: Globe, title: 'Multi-Language', description: 'English and Portuguese support' },
    { icon: Sparkles, title: 'Beautiful UI', description: 'Dark mode and stunning design' },
  ];

  return (
    <>
      <Navbar user={null} />
      <div className="min-h-screen bg-background">
        <section className="relative overflow-hidden border-b border-border">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl"></div>

          <div className="relative container mx-auto px-4 py-20 lg:py-32">
            <div className="text-center max-w-4xl mx-auto space-y-8">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-semibold">
                <Sparkles className="w-4 h-4" />
                All-in-One Productivity Suite
              </span>

              <h1 className="text-5xl lg:text-7xl font-bold text-foreground leading-tight">
                Your Digital Brain,
                <br />
                <span className="text-accent">Simplified</span>
              </h1>

              <p className="text-xl lg:text-2xl text-muted-foreground max-w-2xl mx-auto">
                Notes, to-dos, flashcards, and secure password management all in one beautiful workspace
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/register">
                  <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground text-lg px-8 py-6">
                    Start Free <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-border text-foreground hover:bg-muted">
                    Sign In
                  </Button>
                </Link>
              </div>

              <p className="text-sm text-muted-foreground">
                Free plan includes up to {freePlanLimit} notes, todos, flashcards, and passwords
              </p>
            </div>
          </div>
        </section>

        <section className="py-20 px-4">
          <div className="container mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-foreground mb-4">Everything You Need</h2>
              <p className="text-xl text-muted-foreground">Four powerful tools, one seamless experience</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              {features.map((feature, i) => (
                <Card key={i} className="group hover:shadow-xl transition-all hover:-translate-y-2 bg-card border-border">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <feature.icon className="w-6 h-6 text-accent" />
                    </div>
                    <CardTitle className="text-foreground">{feature.title}</CardTitle>
                    <CardDescription className="text-muted-foreground">{feature.description}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 px-4 bg-muted/30 border-y border-border">
          <div className="container mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, i) => (
              <div key={i} className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center">
                  <benefit.icon className="w-8 h-8 text-accent" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">{benefit.title}</h3>
                <p className="text-sm text-muted-foreground">{benefit.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="py-28 px-4 relative">
          <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -top-32 left-1/3 w-[40rem] h-[40rem] bg-accent/15 rounded-full blur-3xl" />
            <div className="absolute bottom-0 -right-20 w-[32rem] h-[32rem] bg-accent/10 rounded-full blur-3xl" />
          </div>
          <div className="container mx-auto max-w-5xl">
            <div className="group relative rounded-3xl border border-accent/30 bg-background/40 backdrop-blur-xl shadow-[0_8px_32px_-4px_rgba(0,0,0,0.45)] ring-1 ring-accent/20 overflow-hidden transition-all duration-500 hover:shadow-[0_12px_48px_-6px_rgba(0,0,0,0.55)]">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" />
              <div className="absolute inset-0 [mask-image:radial-gradient(circle_at_30%_20%,white,transparent)] bg-accent/5 animate-[pulse_6s_ease-in-out_infinite]" />
              <div className="relative z-10 text-center px-6 md:px-14 py-20">
                <h2 className="text-4xl md:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-accent to-accent/70 mb-6">
                  {tLanding('cta_title')}
                </h2>
                <p className="text-xl md:text-2xl text-muted-foreground/90 max-w-2xl mx-auto mb-10">
                  {tLanding('cta_subtitle')}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/register" className="w-full sm:w-auto">
                    <Button size="lg" className="w-full sm:w-auto text-lg px-8 md:px-12 py-6 md:py-7 rounded-full bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg shadow-accent/30 hover:shadow-accent/40 transition-all">
                      {tLanding('cta_create')} <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </Link>
                  <Link href="/login" className="w-full sm:w-auto">
                    <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-8 md:px-12 py-6 md:py-7 rounded-full border-accent/40 backdrop-blur-sm hover:bg-accent/10 hover:border-accent/60 transition-all">
                      {tLanding('cta_login')}
                    </Button>
                  </Link>
                </div>
                <p className="mt-6 text-sm opacity-80">
                  {tLanding('cta_no_credit')}
                </p>
              </div>
            </div>
          </div>
        </section>

        <footer className="border-t border-border py-12 px-4">
          <div className="container mx-auto text-center text-muted-foreground">
            <p>© 2025 Nous. Built with love using Next.js, Fastify, and Supabase</p>
          </div>
        </footer>
      </div>
    </>
  );
}
