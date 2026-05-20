import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

type Role = "admin" | "agent" | "subagent" | "customer";

type AuthCtx = {
  user: User | null;
  session: Session | null;
  roles: Role[];
  loading: boolean;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isAgent: boolean;
};

const Ctx = createContext<AuthCtx>({} as AuthCtx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        setTimeout(() => {
          supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", s.user.id)
            .then(({ data }) => setRoles(((data as { role: Role }[]) || []).map((r) => r.role)));
        }, 0);
      } else setRoles([]);
    });

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", s.user.id)
          .then(({ data }) => setRoles(((data as { role: Role }[]) || []).map((r) => r.role)));
      }
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <Ctx.Provider
      value={{
        user,
        session,
        roles,
        loading,
        signOut: async () => {
          await supabase.auth.signOut();
        },
        isAdmin: roles.includes("admin"),
        isAgent: roles.includes("agent") || roles.includes("subagent") || roles.includes("admin"),
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
