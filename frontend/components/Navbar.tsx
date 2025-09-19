"use client";

import Link from "next/link";
import { ModeToggle } from "@/components/ModeToggle";
import AuthButton from "./AuthButton";
import { Hamburger } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

export function Navbar() {
  const { initialized, keycloak } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isAuth = mounted && initialized && keycloak && (keycloak as any).authenticated;
  const { toast } = useToast();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl w-full mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <Hamburger />
          <span className="text-2xl font-bold">Foodhub</span>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center space-x-6 text-md font-medium">
          {isAuth ? (
            <>
              <Link href="/explore?view=reviews" className="transition-colors hover:text-primary hover:scale-115 transition-transform px-2 py-1 rounded">
                Timeline
              </Link>
              <Link href="/explore?view=restaurants" className="transition-colors hover:text-primary hover:scale-115 transition-transform px-2 py-1 rounded">
                Restaurants
              </Link> 
              <Link href="/explore?view=ai" className="transition-colors hover:text-primary hover:scale-115 transition-transform px-2 py-1 rounded">
                Recommendation
              </Link>
              <Link href="/explore?view=foods" className="transition-colors hover:text-primary hover:scale-115 transition-transform px-2 py-1 rounded">
                Food
              </Link>
              <Link href="/explore?view=users" className="transition-colors hover:text-primary hover:scale-115 transition-transform px-2 py-1 rounded">
                Users
              </Link>
            </>
          ) : (
            // guests: single Explore button that shows a toast when clicked
            <Button
              variant="ghost"
              onClick={() =>
                toast({
                  title: "Sign in required",
                  description: "Please sign in to access Explore.",
                  variant: "destructive",
                })
              }
            >
              Explore
            </Button>
          )}
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
