"use client";

import Link from "next/link";
import { ModeToggle } from "@/components/ModeToggle";
// import { AuthButton } from "@/components/AuthButton";
import { Button } from "@/components/ui/button";
import AuthButton from "./AuthButton";
import { Hamburger } from "lucide-react";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* keep content centered and add horizontal padding so items don't touch edges */}
      <div className="max-w-7xl w-full mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <Hamburger/>
          <span className="text-2xl font-bold">Foodhub</span>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center space-x-6 text-md font-medium">
          <Link href="/explore" className="transition-colors hover:text-primary">
            Explore
          </Link>
          <Link href="/reviews" className="transition-colors hover:text-primary">
            Reviews
          </Link>
          <Link href="/ai-tools" className="transition-colors hover:text-primary">
            AI Tools
          </Link>
          <Link href="/about" className="transition-colors hover:text-primary">
            About
          </Link>
        </nav>

        {/* Right Section */}
        <div className="flex items-center space-x-3">
          <ModeToggle />
          <AuthButton />
        </div>
      </div>
    </header>
  );
}
