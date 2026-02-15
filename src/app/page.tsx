import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronDown, ArrowDownUp, Building2, Briefcase } from "lucide-react";

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-purple-50 via-pink-50 to-purple-100">
      {/* Header */}
      <header className="relative z-10 mx-auto max-w-7xl px-6 py-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-12">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">RNT</h1>
            
            <nav className="hidden items-center gap-8 lg:flex">
              <Link href="#" className="text-sm font-medium text-foreground/80 hover:text-foreground">
                Features
              </Link>
              <Link href="#" className="text-sm font-medium text-foreground/80 hover:text-foreground">
                Private
              </Link>
              <Link href="#" className="text-sm font-medium text-foreground/80 hover:text-foreground">
                Blog
              </Link>
              <Link href="#" className="text-sm font-medium text-foreground/80 hover:text-foreground">
                About
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="ghost" className="text-sm font-medium">
              Contact
            </Button>
            <Button className="rounded-full bg-black px-6 text-sm font-medium text-white hover:bg-black/90">
              Get started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 mx-auto max-w-7xl px-6 pb-12 pt-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          {/* Left Side - Illustration */}
          <div className="relative flex items-center justify-center">
            {/* Curved Wave Shape */}
            <svg
              viewBox="0 0 600 600"
              className="h-full w-full max-w-2xl"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#e9d5ff" />
                  <stop offset="50%" stopColor="#f3e8ff" />
                  <stop offset="100%" stopColor="#fce7f3" />
                </linearGradient>
                <filter id="shadow">
                  <feDropShadow dx="0" dy="10" stdDeviation="20" floodOpacity="0.2" />
                </filter>
              </defs>
              
              {/* Wave Path */}
              <path
                d="M 50 300 Q 150 100, 300 200 Q 450 300, 550 250 L 550 600 Q 300 500, 50 600 Z"
                fill="url(#waveGradient)"
                filter="url(#shadow)"
              />
              
              {/* Portfolio Icons */}
              <g transform="translate(200, 150)">
                <circle cx="0" cy="0" r="40" fill="#e0e7ff" opacity="0.9" />
                <foreignObject x="-20" y="-20" width="40" height="40">
                  <div className="flex h-full w-full items-center justify-center">
                    <Building2 className="h-6 w-6 text-indigo-600" />
                  </div>
                </foreignObject>
              </g>
              
              <g transform="translate(350, 250)">
                <circle cx="0" cy="0" r="50" fill="#fef3c7" opacity="0.9" />
                <foreignObject x="-25" y="-25" width="50" height="50">
                  <div className="flex h-full w-full items-center justify-center">
                    <Briefcase className="h-8 w-8 text-amber-600" />
                  </div>
                </foreignObject>
              </g>
              
              <g transform="translate(450, 180)">
                <circle cx="0" cy="0" r="45" fill="#dbeafe" opacity="0.9" />
                <foreignObject x="-22" y="-22" width="44" height="44">
                  <div className="flex h-full w-full items-center justify-center">
                    <Building2 className="h-7 w-7 text-blue-600" />
                  </div>
                </foreignObject>
              </g>
            </svg>
          </div>

          {/* Right Side - Exchange Interface */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-balance text-5xl font-bold leading-tight tracking-tight text-foreground lg:text-6xl">
                Find, match, and hire designers secure
              </h2>
            </div>

            {/* Exchange Card */}
            <div className="rounded-3xl bg-white p-8 shadow-xl">
              <div className="space-y-6">
                {/* Tabs */}
                <div className="flex gap-2">
                  <button className="rounded-xl bg-muted px-6 py-2 text-sm font-semibold text-foreground">
                    Job Search
                  </button>
                  <button className="rounded-xl px-6 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">
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
                <Button className="w-full rounded-2xl bg-black py-6 text-base font-semibold text-white hover:bg-black/90">
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
