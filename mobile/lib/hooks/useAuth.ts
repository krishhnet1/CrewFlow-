import * as React from 'react';
import { supabase } from '../supabase';
import type { Session } from '@supabase/supabase-js';
import type { Profile } from '../types';

interface AuthState {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
}

const INITIAL: AuthState = { session: null, profile: null, loading: true };

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) {
    console.warn('[useAuth] profile fetch failed', error.message);
    return null;
  }
  return (data as Profile | null) ?? null;
}

export function useAuth() {
  const [state, setState] = React.useState<AuthState>(INITIAL);

  React.useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(async ({ data }) => {
      const session = data.session ?? null;
      const profile = session?.user ? await fetchProfile(session.user.id) : null;
      if (active) setState({ session, profile, loading: false });
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const profile = session?.user ? await fetchProfile(session.user.id) : null;
      if (active) setState({ session: session ?? null, profile, loading: false });
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (
    email: string,
    password: string,
    firstName: string,
    lastName: string
  ) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { first_name: firstName, last_name: lastName } },
    });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return { ...state, signIn, signUp, signOut };
}
