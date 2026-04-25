"use client";

import { useQuery } from "@tanstack/react-query";

interface IUser {
  id: number;
  email: string;
  name: string;
  language: string;
  isPremium: boolean;
  subscriptionStatus: string | null;
  subscriptionPlanEnd: number | null;
  giftedExpiresAt: number | null;
  giftedLifetime: boolean;
}

async function fetchMe(): Promise<IUser | null> {
  const res = await fetch("/api/auth/me");
  if (!res.ok) return null;
  const data = await res.json();
  return data.user ?? null;
}

export default function useAuth() {
  const { data: user, isLoading } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: fetchMe,
    staleTime: Infinity,
    retry: false,
  });

  return {
    user: user ?? null,
    isLoggedIn: !!user,
    isPremium: !!user?.isPremium,
    isLoading,
  };
}
