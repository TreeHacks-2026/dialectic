"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ChevronDown, ArrowDownUp, Building2, Briefcase, Mic, Video, Share2 } from "lucide-react";
import { motion } from "framer-motion";
import { DotPattern, GridPattern, AnimatedBeams } from "@/components/ui/animated-background";

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-white via-blue-50/30 to-cyan-50/20">
      {/* Aceternity Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <DotPattern className="text-blue-400/20" />
        <GridPattern className="text-cyan-400/10" strokeDasharray="4 2" />
        <AnimatedBeams />
        <div className="absolute -left-20 top-20 h-96 w-96 animate-blob rounded-full bg-blue-400/20 mix-blend-multiply blur-3xl filter" />
        <div className="animation-delay-2000 absolute right-20 top-40 h-96 w-96 animate-blob rounded-full bg-cyan-400/15 mix-blend-multiply blur-3xl filter" />
        <div className="animation-delay-4000 absolute bottom-20 left-1/3 h-96 w-96 animate-blob rounded-full bg-sky-400/15 mix-blend-multiply blur-3xl filter" />
      </div>

      {/* Glassmorphic Taskbar */}
      <div className="fixed bottom-8 left-1/2 z-50 -translate-x-1/2">
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="rounded-2xl border border-white/40 bg-white/30 px-6 py-3 shadow-2xl backdrop-blur-xl"
        >
          <div className="flex items-center gap-4">
            <button className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/40 transition-all hover:bg-white/60">
              <Video className="h-5 w-5 text-blue-600" />
            </button>
            <button className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/40 transition-all hover:bg-white/60">
              <Mic className="h-5 w-5 text-blue-600" />
            </button>
            <button className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/40 transition-all hover:bg-white/60">
              <Share2 className="h-5 w-5 text-blue-600" />
            </button>
            <div className="mx-2 h-8 w-px bg-white/40" />
            <button className="rounded-xl bg-red-500/80 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-red-600">
              Leave
            </button>
          </div>
        </motion.div>
      </div>
      {/* Header */}
      <header className="relative z-10 mx-auto max-w-7xl px-6 py-8">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between rounded-2xl border border-white/40 bg-white/60 px-6 py-4 shadow-[0_8px_32px_rgba(0,0,0,0.08)] backdrop-blur-2xl"
        >
          <div className="flex items-center gap-12">
            <Link href="/" className="flex items-center">
              <div className="relative h-10 w-10 overflow-hidden rounded-xl">
                <Image
                  src="/dialectic-logo.jpg"
                  alt="Dialectic"
                  fill
                  className="object-cover"
                />
              </div>
            </Link>
            
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
        </motion.div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 mx-auto max-w-7xl px-6 pb-12 pt-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          {/* Left Side - Scattered Zoom Meeting Interface */}
          <div className="relative flex min-h-[600px] items-center justify-center">
            <div className="relative h-full w-full max-w-xl">
              {/* Participant 1 - Top Left */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8, x: -50, y: -50 }}
                animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                transition={{ delay: 0.1, duration: 0.5 }}
                className="absolute left-0 top-0 z-30"
              >
                <div className="group relative h-40 w-56 overflow-hidden rounded-2xl border-2 border-white/60 bg-gradient-to-br from-white/90 to-white/70 shadow-2xl backdrop-blur-xl">
                  <Image
                    src="/participant-1.jpg"
                    alt="Sarah K."
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  <div className="absolute bottom-2 left-2 rounded-lg bg-black/60 px-2 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                    Sarah K.
                  </div>
                  <div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100">
                    <button className="rounded-lg bg-white/90 p-1.5 backdrop-blur-sm hover:bg-white">
                      <Mic className="h-3 w-3 text-blue-600" />
                    </button>
                  </div>
                </div>
              </motion.div>

              {/* Participant 2 - Top Right */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8, x: 50, y: -50 }}
                animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="absolute right-0 top-12 z-20"
              >
                <div className="group relative h-36 w-52 overflow-hidden rounded-2xl border-2 border-white/60 bg-gradient-to-br from-white/90 to-white/70 shadow-2xl backdrop-blur-xl">
                  <Image
                    src="/participant-2.jpg"
                    alt="Michael P."
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  <div className="absolute bottom-2 left-2 rounded-lg bg-black/60 px-2 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                    Michael P.
                  </div>
                  <div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100">
                    <button className="rounded-lg bg-white/90 p-1.5 backdrop-blur-sm hover:bg-white">
                      <Mic className="h-3 w-3 text-blue-600" />
                    </button>
                  </div>
                </div>
              </motion.div>

              {/* Participant 3 - Center Large (Active Speaker) */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="absolute left-1/2 top-1/2 z-40 -translate-x-1/2 -translate-y-1/2"
              >
                <div className="group relative h-52 w-72 overflow-hidden rounded-3xl border-4 border-blue-400 bg-gradient-to-br from-white/95 to-white/80 shadow-2xl backdrop-blur-xl">
                  <Image
                    src="/participant-3.jpg"
                    alt="Emma L."
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  <div className="absolute bottom-3 left-3 rounded-lg bg-black/70 px-3 py-1.5 text-sm font-bold text-white backdrop-blur-sm">
                    Emma L. (Speaking)
                  </div>
                  <div className="absolute right-3 top-3 opacity-0 transition-opacity group-hover:opacity-100">
                    <button className="rounded-lg bg-white/90 p-2 backdrop-blur-sm hover:bg-white">
                      <Mic className="h-4 w-4 text-blue-600" />
                    </button>
                  </div>
                </div>
              </motion.div>

              {/* Participant 4 - Bottom Left */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8, x: -50, y: 50 }}
                animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="absolute bottom-8 left-4 z-30"
              >
                <div className="group relative h-36 w-48 overflow-hidden rounded-2xl border-2 border-white/60 bg-gradient-to-br from-white/90 to-white/70 shadow-2xl backdrop-blur-xl">
                  <Image
                    src="/participant-4.jpg"
                    alt="Alex R."
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  <div className="absolute bottom-2 left-2 rounded-lg bg-black/60 px-2 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                    Alex R.
                  </div>
                  <div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100">
                    <button className="rounded-lg bg-white/90 p-1.5 backdrop-blur-sm hover:bg-white">
                      <Mic className="h-3 w-3 text-blue-600" />
                    </button>
                  </div>
                </div>
              </motion.div>

              {/* Participant 5 - Bottom Right */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8, x: 50, y: 50 }}
                animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="absolute bottom-0 right-8 z-10"
              >
                <div className="group relative h-32 w-44 overflow-hidden rounded-2xl border-2 border-white/60 bg-gradient-to-br from-white/90 to-white/70 shadow-2xl backdrop-blur-xl">
                  <Image
                    src="/participant-5.jpg"
                    alt="Jessica M."
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  <div className="absolute bottom-2 left-2 rounded-lg bg-black/60 px-2 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                    Jessica M.
                  </div>
                  <div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100">
                    <button className="rounded-lg bg-white/90 p-1.5 backdrop-blur-sm hover:bg-white">
                      <Mic className="h-3 w-3 text-blue-600" />
                    </button>
                  </div>
                </div>
              </motion.div>

              {/* Floating Badge */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.5 }}
                className="absolute -bottom-16 left-1/2 -translate-x-1/2"
              >
                <div className="rounded-full border border-white/60 bg-white/50 px-6 py-2 backdrop-blur-xl">
                  <p className="text-sm font-semibold text-blue-900">Connect with top designers remotely</p>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Right Side - Dialectic Hero */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="flex flex-col items-center justify-center space-y-12 text-center"
          >
            {/* Dialectic Title */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <h1 className="text-balance bg-gradient-to-br from-gray-900 via-blue-800 to-blue-600 bg-clip-text text-7xl font-bold tracking-tighter text-transparent lg:text-8xl">
                Dialectic
              </h1>
              <p className="mt-4 text-lg font-medium text-gray-600">
                AI Teaching Assistant with Avatar Office Hours
              </p>
            </motion.div>

            {/* Get Started Button */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.5 }}
            >
              <Button
                size="lg"
                className="group relative overflow-hidden rounded-2xl border border-white/40 bg-white/70 px-12 py-6 text-lg font-semibold text-gray-900 shadow-[0_8px_32px_rgba(0,0,0,0.12)] backdrop-blur-2xl transition-all hover:bg-white/80 hover:shadow-[0_8px_32px_rgba(0,0,0,0.16)]"
              >
                <span className="relative z-10">Get Started</span>
                <div className="absolute inset-0 -z-0 bg-gradient-to-r from-blue-400/20 to-cyan-400/20 opacity-0 transition-opacity group-hover:opacity-100" />
              </Button>
            </motion.div>

            {/* Optional subtitle */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9, duration: 0.5 }}
              className="max-w-md text-sm leading-relaxed text-gray-500"
            >
              Experience the future of learning with our AI-powered teaching assistant. Connect with experts and get instant help through interactive avatar sessions.
            </motion.p>
          </motion.div>
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
            @ 2026 Dialectic. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
