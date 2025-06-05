
import { supabase } from '../lib/supabaseClient';
import type { User } from '@/types'; // Explicitly import type

export const signUp = async (
	email: string,
	password: string,
	profileData?: {
		displayName?: string;
		whatsapp?: string;
		addressStreet?: string;
		addressNumber?: string;
		addressComplement?: string;
		addressNeighborhood?: string;
		addressCity?: string;
		addressState?: string;
		addressZip?: string;
	}
): Promise<{ user: any | null; session: any | null; error: { message: string } | null }> => {
	console.log('auth.ts: signUp called with email:', email, 'and profileData:', profileData);
	try {
		const metadataForAuth: Record<string, any> = {
			display_name: profileData?.displayName || email.split('@')[0] || 'Usuário',
			whatsapp: profileData?.whatsapp || '',
		};
		if (profileData?.addressStreet) metadataForAuth.address_street = profileData.addressStreet;
		if (profileData?.addressNumber) metadataForAuth.address_number = profileData.addressNumber;
		if (profileData?.addressComplement) metadataForAuth.address_complement = profileData.addressComplement;
		if (profileData?.addressNeighborhood) metadataForAuth.address_neighborhood = profileData.addressNeighborhood;
		if (profileData?.addressCity) metadataForAuth.address_city = profileData.addressCity;
		if (profileData?.addressState) metadataForAuth.address_state = profileData.addressState;
		if (profileData?.addressZip) metadataForAuth.address_zip = profileData.addressZip;

		const { data: signUpAuthData, error: authError } = await supabase.auth.signUp({
			email,
			password,
			options: {
				data: metadataForAuth,
			},
		});

		if (authError) {
			console.error('auth.ts: Supabase sign up error:', authError);
			if (authError.message === 'Failed to fetch' || authError.message.includes('fetch failed')) {
				return {
					user: null,
					session: null,
					error: {
						message: 'Network error: Unable to connect to authentication service for sign up. Please check your internet connection and Supabase configuration.',
					},
				};
			}
			return { user: null, session: null, error: { message: authError.message } };
		}

		// signUpAuthData.user will exist if auth part was successful.
		// signUpAuthData.session will exist if email confirmation is not required or auto-confirmed.
		console.log('auth.ts: Supabase signUp response - User:', signUpAuthData.user?.id, 'Session:', signUpAuthData.session ? 'Exists' : 'Null');
		return { user: signUpAuthData.user, session: signUpAuthData.session, error: null };

	} catch (e: any) {
		console.error('auth.ts: Unexpected error during signUp:', e);
		return { user: null, session: null, error: { message: e.message || 'An unexpected error occurred during sign up.' } };
	}
};


export const signInWithEmail = async (email: string, password: string): Promise<{ user: User | null, error: { message: string } | null }> => {
  console.log('signInWithEmail called with:', email);
  const { data: authData, error: signInAuthError } = await supabase.auth.signInWithPassword({ email, password });

  if (signInAuthError) {
    if (signInAuthError.message !== 'Invalid login credentials') {
      // Log other errors, but not "Invalid login credentials" to reduce console noise for expected user errors.
      console.error('Supabase sign in error:', signInAuthError.message);
    }
    if (signInAuthError.message === 'Failed to fetch' || signInAuthError.message.includes('fetch failed')) {
      return { user: null, error: { message: 'Network error: Unable to connect to authentication service. Please check your internet connection and ensure the Supabase service is reachable and configured correctly (URL/Key).' } };
    }
    return { user: null, error: { message: signInAuthError.message } };
  }

  if (!authData || !authData.user) {
    return { user: null, error: { message: "Sign in successful but no user data returned." } };
  }

  // Fetch profile details
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', authData.user.id)
    .single();

  if (profileError) {
    console.warn('auth.ts: Error fetching profile after sign in:', profileError.message, '- User ID:', authData.user.id);
    // Return basic user info if profile fetch fails, so app doesn't break
    const basicUser: User = {
      userId: authData.user.id,
      email: authData.user.email || 'N/A',
      displayName: authData.user.user_metadata?.display_name || authData.user.email?.split('@')[0] || 'User',
      whatsapp: authData.user.user_metadata?.whatsapp || '',
      role: (authData.user.user_metadata?.role as 'customer' | 'admin') || 'customer',
      createdAt: authData.user.created_at || new Date().toISOString(),
      // address fields will be empty
    };
    return { user: basicUser, error: null }; // Or return with profileError if critical
  }

  if (!profile) {
      console.warn('auth.ts: Profile not found for user ID after sign in:', authData.user.id);
      const basicUser: User = {
        userId: authData.user.id,
        email: authData.user.email || 'N/A',
        displayName: authData.user.user_metadata?.display_name || authData.user.email?.split('@')[0] || 'User',
        whatsapp: authData.user.user_metadata?.whatsapp || '',
        role: (authData.user.user_metadata?.role as 'customer' | 'admin') || 'customer',
        createdAt: authData.user.created_at || new Date().toISOString(),
      };
      return { user: basicUser, error: null };
  }

  const fullUser: User = {
    userId: profile.id,
    email: profile.email,
    displayName: profile.display_name,
    whatsapp: profile.whatsapp,
    role: profile.role,
    createdAt: profile.created_at,
    addressStreet: profile.address_street,
    addressNumber: profile.address_number,
    addressComplement: profile.address_complement,
    addressNeighborhood: profile.address_neighborhood,
    addressCity: profile.address_city,
    addressState: profile.address_state,
    addressZip: profile.address_zip,
  };

  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('currentUser', JSON.stringify(fullUser));
  }

  return { user: fullUser, error: null };
};

export const signOut = async () => {
 console.log('auth.ts: signOut called');
 try {
 const { error } = await supabase.auth.signOut();
 if (error) {
 console.error('auth.ts: Supabase sign out error:', error);
 if (error.message === 'Failed to fetch' || error.message.includes('fetch failed')) {
 return { error: { message: 'Network error during sign out. Local session cleared, but server state might be unchanged.' } };
 }
 return { error: { message: error.message } };
 }
    if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('currentUser');
    }
 return { error: null };
 } catch (e: any) {
 console.error('auth.ts: Unexpected error during signOut:', e);
 return { error: { message: e.message || 'An unexpected error occurred during sign out.' } };
 }
};

export const getUser = async (): Promise<{ user: User | null; error: Error | null }> => {
  console.log('auth.ts: getUser called');
  try {
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

    if (authError) {
      if (authError.message.includes('Auth session missing')) {
        // This is expected when no user is logged in, no need to log as error
      } else if (authError.message === 'Failed to fetch' || authError.message.includes('fetch failed')) {
        console.warn('auth.ts: Supabase authError in getUser (Network Error - will return null):', authError.message);
      } else {
        console.warn('auth.ts: Supabase authError in getUser (will return null):', authError.message);
      }
      return { user: null, error: authError };
    }

    if (!authUser) {
      return { user: null, error: null };
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (profileError) {
      console.warn('auth.ts: Error fetching user profile (will return basic user info or null if critical):', profileError.message, '- User ID:', authUser.id);
      const basicUser: User = {
        userId: authUser.id,
        email: authUser.email || 'N/A',
        displayName: authUser.user_metadata?.display_name || authUser.email?.split('@')[0] || 'User',
        whatsapp: authUser.user_metadata?.whatsapp || '',
        role: (authUser.user_metadata?.role as 'customer' | 'admin') || 'customer',
        createdAt: authUser.created_at || new Date().toISOString(),
        addressStreet: '',
        addressNumber: '',
        addressComplement: '',
        addressNeighborhood: '',
        addressCity: '',
        addressState: '',
        addressZip: '',
      };
      return { user: basicUser, error: null };
    }

    if (!profile) {
      console.warn('auth.ts: User profile not found for user ID (will return basic user info):', authUser.id);
      const basicUser: User = {
        userId: authUser.id,
        email: authUser.email || 'N/A',
        displayName: authUser.user_metadata?.display_name || authUser.email?.split('@')[0] || 'User',
        whatsapp: authUser.user_metadata?.whatsapp || '',
        role: (authUser.user_metadata?.role as 'customer' | 'admin') || 'customer',
        createdAt: authUser.created_at || new Date().toISOString(),
        addressStreet: '',
        addressNumber: '',
        addressComplement: '',
        addressNeighborhood: '',
        addressCity: '',
        addressState: '',
        addressZip: '',
      };
      return { user: basicUser, error: null };
    }

    const fullUser: User = {
      userId: profile.id,
      email: profile.email,
      displayName: profile.display_name,
      whatsapp: profile.whatsapp,
      role: profile.role,
      createdAt: profile.created_at,
      addressStreet: profile.address_street,
      addressNumber: profile.address_number,
      addressComplement: profile.address_complement,
      addressNeighborhood: profile.address_neighborhood,
      addressCity: profile.address_city,
      addressState: profile.address_state,
      addressZip: profile.address_zip,
    };

    return { user: fullUser, error: null };

  } catch (e: unknown) {
    const errorToReturn = e instanceof Error ? e : new Error(String(e));
    console.error('auth.ts: Critical error in getUser (e.g., network issue, Supabase client problem):', errorToReturn.message);
    return { user: null, error: errorToReturn };
  }
};

export const updateUserDetails = async (
	userId: string,
	data: {
		displayName?: string;
		whatsapp?: string;
		addressStreet?: string;
		addressNumber?: string;
		addressComplement?: string;
		addressNeighborhood?: string;
		addressCity?: string;
		addressState?: string;
		addressZip?: string;
	}
): Promise<{ data: any | null; error: { message: string } | null }> => {
	console.log('auth.ts: updateUserDetails called for userId:', userId, 'with data:', data);

	const updatePayload: Record<string, any> = {};
	if (data.displayName !== undefined) updatePayload.display_name = data.displayName;
	if (data.whatsapp !== undefined) updatePayload.whatsapp = data.whatsapp;
	if (data.addressStreet !== undefined) updatePayload.address_street = data.addressStreet;
	if (data.addressNumber !== undefined) updatePayload.address_number = data.addressNumber;
	if (data.addressComplement !== undefined) updatePayload.address_complement = data.addressComplement;
	if (data.addressNeighborhood !== undefined) updatePayload.address_neighborhood = data.addressNeighborhood;
	if (data.addressCity !== undefined) updatePayload.address_city = data.addressCity;
	if (data.addressState !== undefined) updatePayload.address_state = data.addressState;
	if (data.addressZip !== undefined) updatePayload.address_zip = data.addressZip;

	if (Object.keys(updatePayload).length === 0) {
		console.log('auth.ts: updateUserDetails called with no data to update for userId:', userId);
		return { data: null, error: null };
	}
	
	const { data: updatedProfileData, error } = await supabase
		.from('profiles')
		.update(updatePayload)
		.eq('id', userId)
		.select()
		.single();

	if (error) {
		console.error('auth.ts: Error updating user details for user ' + userId + ':', error.message);
		if (error.message === 'Failed to fetch' || error.message.includes('fetch failed')) {
			return { data: null, error: { message: 'Network error: Unable to save user details. Please check your internet connection and Supabase configuration.' } };
		}
		return { data: null, error: { message: error.message } };
	}

  if (updatedProfileData && typeof localStorage !== 'undefined') {
    const userToStore: User = {
        userId: updatedProfileData.id,
        email: updatedProfileData.email,
        displayName: updatedProfileData.display_name,
        whatsapp: updatedProfileData.whatsapp,
        role: updatedProfileData.role,
        createdAt: updatedProfileData.created_at,
        addressStreet: updatedProfileData.address_street,
        addressNumber: updatedProfileData.address_number,
        addressComplement: updatedProfileData.address_complement,
        addressNeighborhood: updatedProfileData.address_neighborhood,
        addressCity: updatedProfileData.address_city,
        addressState: updatedProfileData.address_state,
        addressZip: updatedProfileData.address_zip,
    };
    localStorage.setItem('currentUser', JSON.stringify(userToStore));
  }

	console.log('auth.ts: User details updated successfully for userId:', userId);
	return { data: updatedProfileData, error: null };
};
