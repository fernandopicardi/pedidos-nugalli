
import { supabase } from '../lib/supabaseClient';
import Cookies from 'js-cookie';
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
			is_admin: false, // Default new users to is_admin: false
		};
		// Ensure all address fields from profileData are added to metadataForAuth
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
				data: metadataForAuth, // Pass all collected metadata here
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

		console.log('auth.ts: Supabase signUp response - User:', signUpAuthData.user?.id, 'Session:', signUpAuthData.session ? 'Exists' : 'Null');
		return { user: signUpAuthData.user, session: signUpAuthData.session, error: null };

	} catch (e: any) {
		console.error('auth.ts: Unexpected error during signUp:', e);
		return { user: null, session: null, error: { message: e.message || 'An unexpected error occurred during sign up.' } };
	}
};


export const signInWithEmail = async (email: string, password: string): Promise<{ user: User | null, error: { message: string } | null }> => {
  console.log('auth.ts: signInWithEmail called with:', email);
  try {
    const { data: authData, error: signInAuthError } = await supabase.auth.signInWithPassword({ email, password });
  
    if (signInAuthError) {
      if (signInAuthError.message !== 'Invalid login credentials') {
        console.error('auth.ts: Supabase sign in error:', signInAuthError.message);
      }
      if (signInAuthError.message === 'Failed to fetch' || signInAuthError.message.includes('fetch failed')) {
        return { user: null, error: { message: 'Network error: Unable to connect to authentication service. Please check your internet connection and ensure the Supabase service is reachable and configured correctly (URL/Key).' } };
      }
      return { user: null, error: { message: signInAuthError.message } };
    }

    if (!authData || !authData.user) {
      return { user: null, error: { message: "Sign in successful but no user data returned." } };
    }

    const { user: fullUser, error: getUserError } = await getUser(); 

    if (getUserError) {
        return { user: null, error: { message: `Failed to retrieve or create profile after sign in: ${getUserError.message}` } };
    }
    
    if (!fullUser) {
        return { user: null, error: { message: "User authenticated but profile could not be retrieved or created." } };
    }

    if (typeof localStorage !== 'undefined') {
      if (fullUser?.userId) {
        Cookies.set('user_id', fullUser.userId, { expires: 7 }); 
      }
      localStorage.setItem('currentUser', JSON.stringify(fullUser));
    }

    return { user: fullUser, error: null };
  } catch (e: any) {
    console.error('auth.ts: Unexpected critical error in signInWithEmail:', e);
    return { user: null, error: { message: e.message || 'An unexpected critical error occurred during sign in.' } };
  }
};

export const signOut = async () => {
 console.log('auth.ts: signOut called');
 try {
 const { error } = await supabase.auth.signOut();
 if (error) {
 console.error('auth.ts: Supabase sign out error:', error);
 if (error.message === 'Failed to fetch' || error.message.includes('fetch failed')) {
    if (typeof window !== 'undefined') { 
         Cookies.remove('user_id'); 
    }
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
 } finally { if (typeof window !== 'undefined') { Cookies.remove('user_id'); } } 
 }

export const getUser = async (): Promise<{ user: User | null; error: Error | null }> => {
  console.log('auth.ts: getUser called');
  try {
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

    if (authError) {
      if (authError.message.includes('Auth session missing')) {
        // Expected when no user is logged in
      } else if (authError.message === 'Failed to fetch' || authError.message.includes('fetch failed')) {
        console.warn('auth.ts: Supabase authError in getUser (Network Error - will return null):', authError.message);
      } else {
        console.warn('auth.ts: Supabase authError in getUser (will return null):', authError.message);
      }
      return { user: null, error: new Error(authError.message) };
    }

    if (!authUser) {
      return { user: null, error: null };
    }

    let { data: profile, error: profileErrorPGRST } = await supabase
      .from('profiles')
      .select('*') 
      .eq('id', authUser.id)
      .single();

    const profileError = profileErrorPGRST as any; 

    if (!profile && (profileError?.code === 'PGRST116' || !profileError)) { 
      console.warn(`auth.ts: Profile not found for user ID: ${authUser.id}. Attempting to create one from auth.users metadata.`);
      
      const rawUserMetaData = authUser.raw_user_meta_data || {}; 

      const newProfilePayload = {
        id: authUser.id,
        email: authUser.email,
        display_name: rawUserMetaData.display_name || authUser.email?.split('@')[0] || 'Usuário',
        whatsapp: rawUserMetaData.whatsapp || '',
        is_admin: rawUserMetaData.is_admin === true, 
        created_at: authUser.created_at || new Date().toISOString(),
        address_street: rawUserMetaData.address_street || null,
        address_number: rawUserMetaData.address_number || null,
        address_complement: rawUserMetaData.address_complement || null,
        address_neighborhood: rawUserMetaData.address_neighborhood || null,
        address_city: rawUserMetaData.address_city || null,
        address_state: rawUserMetaData.address_state || null,
        address_zip: rawUserMetaData.address_zip || null,
      };

      const { data: createdProfile, error: createProfileError } = await supabase
        .from('profiles')
        .insert(newProfilePayload)
        .select()
        .single();

      if (createProfileError) {
        console.error(`auth.ts: Failed to create profile for user ID ${authUser.id}:`, createProfileError.message);
        const basicUser: User = {
          userId: authUser.id,
          email: authUser.email || 'N/A',
          displayName: rawUserMetaData.display_name || authUser.email?.split('@')[0] || 'Usuário',
          whatsapp: rawUserMetaData.whatsapp || '',
          isAdmin: rawUserMetaData.is_admin === true, 
          createdAt: authUser.created_at || new Date().toISOString(),
          addressStreet: rawUserMetaData.address_street || undefined,
          addressNumber: rawUserMetaData.address_number || undefined,
          addressComplement: rawUserMetaData.address_complement || undefined,
          addressNeighborhood: rawUserMetaData.address_neighborhood || undefined,
          addressCity: rawUserMetaData.address_city || undefined,
          addressState: rawUserMetaData.address_state || undefined,
          addressZip: rawUserMetaData.address_zip || undefined,
        };
        return { user: basicUser, error: new Error(`Profile fetch failed (PGRST116 or no error but no profile) and subsequent creation also failed: ${createProfileError.message}`) };
      }

      if (createdProfile) {
        console.log(`auth.ts: Successfully created profile for user ID ${authUser.id}.`);
        profile = createdProfile; 
      } else {
        console.error(`auth.ts: Profile creation attempt for user ID ${authUser.id} did not return data, though no error was thrown.`);
         const basicUser: User = {
          userId: authUser.id,
          email: authUser.email || 'N/A',
          displayName: rawUserMetaData.display_name || authUser.email?.split('@')[0] || 'Usuário',
          whatsapp: rawUserMetaData.whatsapp || '',
          isAdmin: rawUserMetaData.is_admin === true, 
          createdAt: authUser.created_at || new Date().toISOString(),
          addressStreet: rawUserMetaData.address_street || undefined,
          addressNumber: rawUserMetaData.address_number || undefined,
          addressComplement: rawUserMetaData.address_complement || undefined,
          addressNeighborhood: rawUserMetaData.address_neighborhood || undefined,
          addressCity: rawUserMetaData.address_city || undefined,
          addressState: rawUserMetaData.address_state || undefined,
          addressZip: rawUserMetaData.address_zip || undefined,
        };
        return { user: basicUser, error: new Error('Profile creation attempt did not return data.') };
      }
    } else if (profileError && profileError.code !== 'PGRST116') { 
        console.warn('auth.ts: Error fetching user profile (not PGRST116):', profileError.message, '- User ID:', authUser.id);
        const rawUserMetaDataFallback = authUser.raw_user_meta_data || {};
        const basicUser: User = {
          userId: authUser.id,
          email: authUser.email || 'N/A',
          displayName: rawUserMetaDataFallback.display_name || authUser.email?.split('@')[0] || 'User',
          whatsapp: rawUserMetaDataFallback.whatsapp || '',
          isAdmin: rawUserMetaDataFallback.is_admin === true, 
          createdAt: authUser.created_at || new Date().toISOString(),
          addressStreet: rawUserMetaDataFallback.address_street || undefined,
          addressNumber: rawUserMetaDataFallback.address_number || undefined,
          addressComplement: rawUserMetaDataFallback.address_complement || undefined,
          addressNeighborhood: rawUserMetaDataFallback.address_neighborhood || undefined,
          addressCity: rawUserMetaDataFallback.address_city || undefined,
          addressState: rawUserMetaDataFallback.address_state || undefined,
          addressZip: rawUserMetaDataFallback.address_zip || undefined,
        };
        return { user: basicUser, error: new Error(`Error fetching profile: ${profileError.message}`) };
    }
    
    const fullUser: User = {
      userId: profile.id,
      email: profile.email,
      displayName: profile.display_name,
      whatsapp: profile.whatsapp,
      isAdmin: profile.is_admin, 
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
): Promise<{ user: User | null; error: { message: string } | null }> => { 
	console.log('auth.ts: updateUserDetails called for userId:', userId, 'with data:', data);

  try {
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
      const { data: currentProfileData, error: fetchError } = await supabase
        .from('profiles')
        .select()
        .eq('id', userId)
        .single();
      if (fetchError || !currentProfileData) {
        return { user: null, error: { message: fetchError?.message || "Profile not found during no-op update."} };
      }
      const currentUser: User = {
          userId: currentProfileData.id,
          email: currentProfileData.email,
          displayName: currentProfileData.display_name,
          whatsapp: currentProfileData.whatsapp,
          isAdmin: currentProfileData.is_admin,
          createdAt: currentProfileData.created_at,
          addressStreet: currentProfileData.address_street,
          addressNumber: currentProfileData.address_number,
          addressComplement: currentProfileData.address_complement,
          addressNeighborhood: currentProfileData.address_neighborhood,
          addressCity: currentProfileData.address_city,
          addressState: currentProfileData.address_state,
          addressZip: currentProfileData.address_zip,
      };
      return { user: currentUser, error: null };
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
        return { user: null, error: { message: 'Network error: Unable to save user details. Please check your internet connection and Supabase configuration.' } };
      }
      return { user: null, error: { message: error.message } };
    }

    if (!updatedProfileData) { 
        return { user: null, error: { message: "Profile update seemed successful but no data was returned." } };
    }

    const updatedUser: User = {
        userId: updatedProfileData.id,
        email: updatedProfileData.email,
        displayName: updatedProfileData.display_name,
        whatsapp: updatedProfileData.whatsapp,
        isAdmin: updatedProfileData.is_admin,
        createdAt: updatedProfileData.created_at,
        addressStreet: updatedProfileData.address_street,
        addressNumber: updatedProfileData.address_number,
        addressComplement: updatedProfileData.address_complement,
        addressNeighborhood: updatedProfileData.address_neighborhood,
        addressCity: updatedProfileData.address_city,
        addressState: updatedProfileData.address_state,
        addressZip: updatedProfileData.address_zip,
    };

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    }

    console.log('auth.ts: User details updated successfully for userId:', userId);
    return { user: updatedUser, error: null };
  } catch (e: any) {
    console.error('auth.ts: Unexpected critical error in updateUserDetails for userId ' + userId + ':', e);
    return { user: null, error: { message: e.message || 'An unexpected critical error occurred during user details update.' } };
  }
};
