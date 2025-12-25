"use client"

import { createAuthClient } from "better-auth/react"
import { useEffect, useState } from "react"

export const authClient = createAuthClient({
  baseURL: typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_SITE_URL,
  fetchOptions: {
    headers: {
      Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem("bearer_token") : ""}`,
    },
    onSuccess: (ctx) => {
      const authToken = ctx.response.headers.get("set-auth-token")
      if (authToken) {
        const tokenPart = authToken.includes('.') ? authToken.split('.')[0] : authToken;
        localStorage.setItem("bearer_token", tokenPart);
      }
    }
  }
});

type SessionData = {
  data: any;
  isPending: boolean;
  error: any;
  refetch: () => void;
}

export function useSession(): SessionData {
  const [session, setSession] = useState<any>(null);
  const [isPending, setIsPending] = useState(true);
  const [error, setError] = useState<any>(null);

  const fetchSession = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem("bearer_token") || "" : "";
      const res = await authClient.getSession({
        fetchOptions: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      });
      setSession(res.data);
      setError(null);
    } catch (err) {
      setSession(null);
      setError(err);
    } finally {
      setIsPending(false);
    }
  };

  const refetch = () => {
    setIsPending(true);
    setError(null);
    fetchSession();
  };

  useEffect(() => {
    fetchSession();
  }, []);

  return { data: session, isPending, error, refetch };
}

// Social sign-in helpers
export const signInWithGoogle = () => {
  return authClient.signIn.social({
    provider: "google",
    callbackURL: "/",
  });
};

export const signInWithGithub = () => {
  return authClient.signIn.social({
    provider: "github",
    callbackURL: "/",
  });
};