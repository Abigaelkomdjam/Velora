// context/AuthContext.tsx
import { supabase } from '@/supabase';
import { Session, User } from '@supabase/supabase-js';
import { router } from 'expo-router';
import { createContext, useContext, useEffect, useState } from 'react';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  role: string | null;
  loading: boolean;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  role: null,
  loading: true,
  signOut: () => {},
});

export const SessionContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser]       = useState<User | null>(null);
  const [role, setRole]       = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1) On récupère la session actuelle
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // 2) On écoute les changements de session
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        // 3) Récupère le rôle depuis profiles
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        const userRole = !error && profile ? profile.role : null;
        setRole(userRole);

        // 4) Redirection selon le rôle
        if (userRole === 'admin') {
          router.replace('/admin');
        } else {
          router.replace('/');
        }
      } else {
        // Pas de session : vers signin
        setRole(null);
        router.replace('/signin');
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setRole(null);
    router.replace('/signin');
  };

  return (
    <AuthContext.Provider value={{ session, user, role, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
