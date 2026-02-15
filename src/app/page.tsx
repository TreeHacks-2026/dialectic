import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ChevronDown, User, Sparkles, Eye, Filter, Target } from "lucide-react";
import { DotPattern, GridPattern, AnimatedBeams, BackgroundGradientAnimation } from "@/components/ui/animated-background";

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[hsl(250,40%,94%)] via-[hsl(260,45%,92%)] to-[hsl(240,50%,95%)]">
      {/* Animated Background Layers */}
      <BackgroundGradientAnimation className="absolute inset-0">
        <DotPattern className="text-purple-400/40" />
        <GridPattern className="text-blue-400/30" strokeDasharray="4 2" />
        <AnimatedBeams />
      </BackgroundGradientAnimation>
      {/* Header */}
      <header className="relative z-10 mx-auto max-w-7xl px-6 py-6">
        <div className="flex items-center justify-between rounded-3xl bg-white/90 px-8 py-4 shadow-sm backdrop-blur-sm">
          <div className="flex items-center gap-12">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-400 via-pink-300 to-blue-300">
                <div className="text-lg font-bold">RNT</div>
              </div>
            </div>
            
            <nav className="hidden items-center gap-8 lg:flex">
              <div className="relative">
                <Input 
                  placeholder="What Are You Looking For?" 
                  className="w-64 border-0 bg-muted/50 pl-4 pr-4 focus-visible:ring-1"
                />
              </div>
              <button className="flex items-center gap-1 text-sm font-medium hover:text-accent">
                Jobs <ChevronDown className="h-4 w-4" />
              </button>
              <Link href="#" className="text-sm font-medium hover:text-accent">
                Post A Job
              </Link>
              <Link href="#" className="text-sm font-medium hover:text-accent">
                Hire A Designer
              </Link>
              <Link href="#" className="text-sm font-medium hover:text-accent">
                Browse Portfolio
              </Link>
              <Link href="#" className="text-sm font-medium hover:text-accent">
                Become A Designer
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="ghost" className="text-sm font-medium">
              Log In
            </Button>
            <Button className="rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              Sign Up
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 mx-auto max-w-7xl px-6 py-12">
        <div className="relative">
          <div className="flex flex-col gap-12 lg:flex-row lg:items-center lg:justify-between">
            {/* Left Content */}
            <div className="max-w-xl space-y-8">
              <div className="space-y-4">
                <h1 className="text-balance text-6xl font-bold leading-tight tracking-tight text-foreground lg:text-7xl">
                  Skill-Based Interior Design Hiring
                </h1>
                <p className="text-pretty text-lg leading-relaxed text-muted-foreground">
                  A global job board where interior designers are hired based on their portfolio, not personal details.
                </p>
              </div>

              <div className="flex items-center gap-4">
                <Button size="lg" className="rounded-xl bg-primary px-8 text-base font-semibold text-primary-foreground hover:bg-primary/90">
                  Search Jobs
                </Button>
                <Button size="lg" variant="outline" className="rounded-xl border-2 px-8 text-base font-semibold">
                  Register Your Self
                </Button>
              </div>
            </div>

            {/* Right Content - Floating Cards */}
            <div className="relative flex items-center justify-center lg:w-1/2">
              {/* Profile Card */}
              <div className="absolute right-0 top-0 z-10 rounded-2xl bg-white/95 p-6 shadow-lg backdrop-blur-sm">
                <div className="flex flex-col items-center gap-3">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-blue-500">
                    <User className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-bold">ID-L2342</div>
                    <div className="text-xs text-muted-foreground">Interior Designer, Ex Co.</div>
                  </div>
                  <Button size="sm" className="rounded-full bg-primary px-4 text-xs font-semibold">
                    Learn more
                  </Button>
                </div>
              </div>

              {/* Job Search Card */}
              <div className="mt-20 rounded-2xl bg-white/95 p-6 shadow-xl backdrop-blur-sm lg:w-96">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Find Job</label>
                    <button className="flex w-full items-center justify-between rounded-lg border-2 border-input bg-background px-4 py-2.5 text-left text-sm font-medium">
                      Interior Designer
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between rounded-xl border border-border p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black">
                          <Sparkles className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold">Interior Designer</div>
                          <div className="text-xs text-muted-foreground">Lullu Company</div>
                        </div>
                      </div>
                      <Button size="sm" className="rounded-full bg-blue-500 px-4 text-xs hover:bg-blue-600">
                        Apply
                      </Button>
                    </div>

                    <div className="flex items-center justify-between rounded-xl border border-border p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black">
                          <Target className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold">Interior Designer</div>
                          <div className="text-xs text-muted-foreground">Sintaral</div>
                        </div>
                      </div>
                      <Button size="sm" className="rounded-full bg-blue-500 px-4 text-xs hover:bg-blue-600">
                        Apply
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Decorative Image Placeholder */}
              <div className="absolute bottom-0 right-0 -z-10 h-64 w-64 rounded-3xl bg-gradient-to-br from-blue-300 via-blue-400 to-white opacity-80 shadow-2xl" />
            </div>
          </div>

          {/* Feature Cards */}
          <div className="mt-24 rounded-3xl bg-white/90 p-8 shadow-sm backdrop-blur-sm">
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                  <User className="h-7 w-7 text-blue-500" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-base font-bold">Anonymous hiring</h3>
                  <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
                    Hire based on talent, not personal details.
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-center gap-4 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-100">
                  <Eye className="h-7 w-7 text-purple-500" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-base font-bold">Showcase portfolio</h3>
                  <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
                    Designers are judged by their work, not resumes.
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-center gap-4 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <Search className="h-7 w-7 text-green-500" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-base font-bold">Smart Job Search</h3>
                  <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
                    Advanced filters to find the perfect match.
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-center gap-4 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-pink-100">
                  <Filter className="h-7 w-7 text-pink-500" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-base font-bold">Secure Design Test</h3>
                  <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
                    Evaluate skills with real-world challenges.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
