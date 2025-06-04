import { User } from '@/types';

import { supabase } from './supabaseClient';

export const signUp = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    return { user: null, error };
  }

  // After successful sign-up, create a profile entry
  const { error: profileError } = await supabase
    .from('profiles')
    .insert([{ id: data.user?.id, email: data.user?.email, role: 'customer' }]);

  // Return the user data from the auth sign-up and any error from profile creation
  return { user: data.user, error: profileError };
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

export const getUser = async (): Promise<{ user: User | null; error: Error | null }> => {
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error) {
    console.error("Error fetching auth user:", error);
    return { user: null, error };
  }

  if (!user) {
    return { user: null, error: null };
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError) {
    console.error("Error fetching user profile:", profileError);
    return { user: null, error: profileError };
  }

  if (!profile) {
    console.error("User profile not found for user ID:", user.id);
    return { user: null, error: new Error("User profile not found.") };
  }

  // Combine user and profile data, mapping snake_case to camelCase
  return {
    user: {
      ...user,
      ...profile,
      userId: profile.id,
      displayName: profile.display_name,
      addressStreet: profile.address_street,
      addressNumber: profile.address_number,
      addressComplement: profile.address_complement,
      addressNeighborhood: profile.address_neighborhood,
      addressCity: profile.address_city,
      addressState: profile.address_state,
      addressZip: profile.address_zip
    }, error: null };
};

export const updateUserDetails = async (
  userId: string,
  data: {
    displayName: string;
    whatsapp: string;
    addressStreet?: string;
    addressNumber?: string;
    addressComplement?: string;
    addressNeighborhood?: string;
    addressCity?: string;
    addressState?: string;
    addressZip?: string;
  }
) => {
  const { data: updatedUser, error } = await supabase.from('profiles').update({
    display_name: data.displayName,
    whatsapp: data.whatsapp,
    address_street: data.addressStreet,
    address_number: data.addressNumber,
    address_complement: data.addressComplement,
    address_neighborhood: data.addressNeighborhood,
    address_city: data.addressCity,
    address_state: data.addressState,
    address_zip: data.addressZip,
  }).eq('id', userId);
  return { data: updatedUser, error };
};