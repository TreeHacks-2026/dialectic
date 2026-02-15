import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronDown, ArrowDownUp, Building2, Briefcase, User, Mic, Video, Share2 } from "lucide-react";

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-blue-50 via-cyan-50 to-sky-100">
      {/* Animated Blue Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 top-20 h-96 w-96 animate-blob rounded-full bg-blue-300/30 mix-blend-multiply blur-3xl filter" />
        <div className="animation-delay-2000 absolute right-20 top-40 h-96 w-96 animate-blob rounded-full bg-cyan-300/30 mix-blend-multiply blur-3xl filter" />
        <div className="animation-delay-4000 absolute bottom-20 left-1/3 h-96 w-96 animate-blob rounded-full bg-sky-300/30 mix-blend-multiply blur-3xl filter" />
      </div>
      {/* Header */}
      <header className="relative z-10 mx-auto max-w-7xl px-6 py-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-12">
            <h1 className="text-2xl font-bold tracking-tight text-blue-600">RNT</h1>
            
            <nav className="hidden items-center gap-8 lg:flex">
              <Link href="#" className="text-sm font-medium text-foreground/80 hover:text-blue-600">
                Features
              </Link>
              <Link href="#" className="text-sm font-medium text-foreground/80 hover:text-blue-600">
                Private
              </Link>
              <Link href="#" className="text-sm font-medium text-foreground/80 hover:text-blue-600">
                Blog
              </Link>
              <Link href="#" className="text-sm font-medium text-foreground/80 hover:text-blue-600">
                About
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="ghost" className="text-sm font-medium hover:text-blue-600">
              Contact
            </Button>
            <Button className="rounded-full bg-blue-600 px-6 text-sm font-medium text-white hover:bg-blue-700">
              Get started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 mx-auto max-w-7xl px-6 pb-12 pt-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          {/* Left Side - Zoom Meeting Interface */}
          <div className="relative flex items-center justify-center">
            <div className="w-full max-w-xl space-y-4">
              {/* Zoom Meeting Container with Glassmorphism */}
              <div className="relative overflow-hidden rounded-3xl border border-white/40 bg-white/20 p-6 shadow-2xl backdrop-blur-xl">
                {/* Meeting Grid - 2x2 */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Participant 1 */}
                  <div className="group relative aspect-video overflow-hidden rounded-xl bg-gradient-to-br from-blue-400 to-blue-600">
                    <div className="flex h-full items-center justify-center">
                      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-700/50 backdrop-blur-sm">
                        <User className="h-10 w-10 text-white" />
                      </div>
                    </div>
                    <div className="absolute bottom-2 left-2 rounded-md bg-black/60 px-2 py-1 text-xs font-medium text-white backdrop-blur-sm">
                      Sarah K.
                    </div>
                    <div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100">
                      <div className="flex gap-1">
                        <button className="rounded-md bg-black/60 p-1.5 backdrop-blur-sm hover:bg-black/80">
                          <Mic className="h-3 w-3 text-white" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Participant 2 */}
                  <div className="group relative aspect-video overflow-hidden rounded-xl bg-gradient-to-br from-cyan-400 to-cyan-600">
                    <div className="flex h-full items-center justify-center">
                      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-cyan-700/50 backdrop-blur-sm">
                        <User className="h-10 w-10 text-white" />
                      </div>
                    </div>
                    <div className="absolute bottom-2 left-2 rounded-md bg-black/60 px-2 py-1 text-xs font-medium text-white backdrop-blur-sm">
                      Michael P.
                    </div>
                    <div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100">
                      <div className="flex gap-1">
                        <button className="rounded-md bg-black/60 p-1.5 backdrop-blur-sm hover:bg-black/80">
                          <Mic className="h-3 w-3 text-white" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Participant 3 */}
                  <div className="group relative aspect-video overflow-hidden rounded-xl bg-gradient-to-br from-sky-400 to-sky-600">
                    <div className="flex h-full items-center justify-center">
                      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-sky-700/50 backdrop-blur-sm">
                        <User className="h-10 w-10 text-white" />
                      </div>
                    </div>
                    <div className="absolute bottom-2 left-2 rounded-md bg-black/60 px-2 py-1 text-xs font-medium text-white backdrop-blur-sm">
                      Emma L.
                    </div>
                    <div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100">
                      <div className="flex gap-1">
                        <button className="rounded-md bg-black/60 p-1.5 backdrop-blur-sm hover:bg-black/80">
                          <Mic className="h-3 w-3 text-white" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Participant 4 - Active Speaker with Border */}
                  <div className="group relative aspect-video overflow-hidden rounded-xl border-2 border-blue-400 bg-gradient-to-br from-indigo-400 to-indigo-600">
                    <div className="flex h-full items-center justify-center">
                      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-indigo-700/50 backdrop-blur-sm">
                        <User className="h-10 w-10 text-white" />
                      </div>
                    </div>
                    <div className="absolute bottom-2 left-2 rounded-md bg-black/60 px-2 py-1 text-xs font-medium text-white backdrop-blur-sm">
                      Alex R. (You)
                    </div>
                    <div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100">
                      <div className="flex gap-1">
                        <button className="rounded-md bg-black/60 p-1.5 backdrop-blur-sm hover:bg-black/80">
                          <Mic className="h-3 w-3 text-white" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Meeting Controls Bar */}
                <div className="mt-4 flex items-center justify-center gap-3">
                  <button className="flex items-center gap-2 rounded-xl bg-white/30 px-4 py-2.5 backdrop-blur-md transition-all hover:bg-white/40">
                    <Mic className="h-4 w-4 text-white" />
                    <span className="text-xs font-medium text-white">Mute</span>
                  </button>
                  <button className="flex items-center gap-2 rounded-xl bg-white/30 px-4 py-2.5 backdrop-blur-md transition-all hover:bg-white/40">
                    <Video className="h-4 w-4 text-white" />
                    <span className="text-xs font-medium text-white">Video</span>
                  </button>
                  <button className="flex items-center gap-2 rounded-xl bg-white/30 px-4 py-2.5 backdrop-blur-md transition-all hover:bg-white/40">
                    <Share2 className="h-4 w-4 text-white" />
                    <span className="text-xs font-medium text-white">Share</span>
                  </button>
                </div>
              </div>

              {/* Floating Badge */}
              <div className="mx-auto w-fit rounded-full border border-blue-200/40 bg-white/40 px-4 py-2 backdrop-blur-md">
                <p className="text-sm font-medium text-blue-900">Connect with top designers remotely</p>
              </div>
            </div>
          </div>

          {/* Right Side - Exchange Interface */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-balance text-5xl font-bold leading-tight tracking-tight text-foreground lg:text-6xl">
                Find, match, and hire designers secure
              </h2>
            </div>

            {/* Exchange Card */}
            <div className="rounded-3xl border border-white/40 bg-white/80 p-8 shadow-2xl backdrop-blur-xl">
              <div className="space-y-6">
                {/* Tabs */}
                <div className="flex gap-2">
                  <button className="rounded-xl bg-blue-50 px-6 py-2 text-sm font-semibold text-blue-600">
                    Job Search
                  </button>
                  <button className="rounded-xl px-6 py-2 text-sm font-medium text-muted-foreground hover:text-blue-600">
                    Portfolio Match
                  </button>
                </div>

                {/* You're Looking For */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-muted-foreground">
                    You&apos;re looking for
                  </label>
                  <div className="flex items-center justify-between rounded-2xl border-2 border-muted p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100">
                        <Building2 className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <div className="text-sm font-bold">Interior Designer</div>
                        <div className="text-xs text-muted-foreground">Role</div>
                      </div>
                    </div>
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Experience range: 2-5 years
                  </div>
                </div>

                {/* Swap Button */}
                <div className="flex justify-center">
                  <button className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-muted bg-background hover:bg-muted">
                    <ArrowDownUp className="h-4 w-4" />
                  </button>
                </div>

                {/* You Get */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-muted-foreground">
                    You get
                  </label>
                  <div className="flex items-center justify-between rounded-2xl border-2 border-muted p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-100">
                        <Briefcase className="h-5 w-5 text-teal-600" />
                      </div>
                      <div>
                        <div className="text-sm font-bold">Qualified Candidates</div>
                        <div className="text-xs text-muted-foreground">Match</div>
                      </div>
                    </div>
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      Average match: 156 designers
                    </span>
                    <span className="text-green-600">(+ 23%)</span>
                  </div>
                </div>

                {/* Exchange Button */}
                <Button className="w-full rounded-2xl bg-blue-600 py-6 text-base font-semibold text-white hover:bg-blue-700">
                  Search now
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 mx-auto max-w-7xl px-6 py-8">
        <div className="flex items-center justify-between border-t border-border pt-8">
          <div className="flex gap-8">
            <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
              Terms of Service
            </Link>
            <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
              Privacy Policy
            </Link>
            <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
              Compliance
            </Link>
          </div>
          <div className="text-sm text-muted-foreground">
            @ 2026 RNT. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
