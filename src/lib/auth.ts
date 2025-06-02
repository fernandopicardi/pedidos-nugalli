import { supabase } from './supabaseClient';

export const signUp = async (email: string, password: string) => {
  const { data: user, error } = await supabase.auth.signUp({
    email,
    password,
  });
  return { user, error };
};

export const signIn = async (email: string, password: string) => {
  const { data: user, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { user, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  return { user, error };
};