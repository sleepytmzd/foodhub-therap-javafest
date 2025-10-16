"use client";

import AuthButton from "@/components/AuthButton";
import { ModeToggle } from "@/components/ModeToggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SplitText from "@/components/ui/SplitText";
import createApi from "@/lib/api";
import api from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";
import { create } from "domain";
import { Bot, Users, UtensilsCrossed } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Home() {
  // console.log(keycloak);
  const { initialized, keycloak } = useAuth();
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    if (!keycloak?.authenticated) return;

    const sub = keycloak.tokenParsed?.sub;
    const email = keycloak.tokenParsed?.email;
    const name = keycloak.tokenParsed?.name;
    const firstName = keycloak.tokenParsed?.given_name;
    const lastName = keycloak.tokenParsed?.family_name;
    setUsername(name ?? firstName ?? email ?? null);

    const api = createApi(process.env.NEXT_PUBLIC_USER_SERVICE_URL);

    const performAction = async () => {
      try {
        await api.get(`/api/user/${sub}`);
        // console.log("User exists in DB");
      } catch (error: any) {
        if (error.response?.status === 404) {
          // console.log("User not found, creating...");
          const user = { id: sub, name, firstName, lastName, email, coins: 20, createdAt: new Date().toISOString() };
          await api.post(`/api/user`, user);
        } else {
          console.error("Unexpected error checking user", error);
        }
      }
    };

    performAction();
  }, [keycloak?.authenticated]);
  // console.log(keycloak?.authenticated);

  const handleRegister = () => {
    if (!initialized) return;
    if (!keycloak?.authenticated) {
      // use login with action register so Keycloak opens the registration page
      (keycloak as any)?.login?.({ action: "register" });
    } else {
      // if already authenticated, send user to explore
      window.location.href = "/explore";
    }
  };

  function handleAnimationComplete(): void {
    // console.log('All letters have animated!');
  }

  return (
    <main className="flex flex-col">
      {/* Hero Section */}
      
      <section className="relative flex min-h-[72vh] items-center py-12 px-6 justify-center max-w-7xl mx-auto">
        <div className="container grid gap-8 md:grid-cols-2 items-center">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight max-w-2xl">
                
                <SplitText
                  text="Discover & Share Your Culinary Journey"
                  className="text-7xl font-bold text-leading-tight"
                  delay={50}
                  duration={0.3}
                  ease="power3.out"
                  splitType="chars"
                  from={{ opacity: 0, y: 40 }}
                  to={{ opacity: 1, y: 0 }}
                  threshold={0.1}
                  rootMargin="-100px"
                  textAlign="center"
                  onLetterAnimationComplete={handleAnimationComplete}
                />
              </h1>
              {/* <div className="hidden md:flex items-center gap-2">
                <ModeToggle />
                <AuthButton />
              </div> */}
            </div>

            <p className="text-lg text-muted-foreground max-w-xl">
              Foodhub helps you explore restaurants, review dishes, get AI-powered
              food recommendations, and track nutrition — all in one place.
            </p>

            <div className="flex flex-wrap gap-4 items-center">
              <Button className="hover:scale-105 transition-transform" size="lg" asChild>
                <Link href="/explore">Start Exploring</Link>
              </Button>
              <Button size="lg" variant="outline" onClick={handleRegister}>
                {keycloak?.authenticated ? "Go to Explore" : "Sign up"}
              </Button>
            </div>

            {username && (
              <p className="text-sm text-muted-foreground mt-2">
                Welcome back, <span className="font-medium">{username}</span>!
              </p>
            )}
          </div>

          <div className="flex items-center justify-center">
            <div className="relative w-full max-w-md rounded-xl overflow-hidden shadow-lg">
              {/* changed: use a remote Unsplash hero image (no local file required) */}
              <img
                src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1400&q=80"
                alt="Delicious food"
                width={1000}
                height={800}
                className="w-full h-auto object-cover"
                loading="eager"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-muted/30 justify-center max-w-7xl mx-auto w-full">
        <div className="container grid gap-8 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
              <UtensilsCrossed /> Restaurant Reviews
              </CardTitle>
            </CardHeader>
            <CardContent>
              Share your dining experiences and discover hidden gems recommended
              by the community.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot /> AI Food Tools
              </CardTitle>
            </CardHeader>
            <CardContent>
              Get personalized dish recommendations, nutrition breakdowns, and AI
              suggestions tailored for you.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users /> Trusted Community
              </CardTitle>
            </CardHeader>
            <CardContent>
              Connect with food lovers, follow top reviewers, and build your
              culinary profile.
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 text-center">
        <div className="container max-w-2xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold">
            Ready to start your Foodhub journey?
          </h2>
          <p className="mt-3 text-muted-foreground">
            Join thousands of foodies already discovering amazing places.
          </p>
          <div className="mt-6 flex justify-center gap-4">
            <Button size="lg" onClick={handleRegister}>
              {keycloak?.authenticated ? "Explore" : "Sign up"}
            </Button>
            <Button size="lg" variant="ghost" asChild>
              <Link href="/about">Learn More</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
