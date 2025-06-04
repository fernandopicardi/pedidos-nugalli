
import type { Product, PurchaseCycle, Order, CartItem, CycleProduct, User, DisplayableProduct, OrderItem } from '@/types';
import { supabase } from './supabaseClient';
import { v4 as uuidv4 } from 'uuid';

// --- Cart Update Listener System ---
let cartUpdateListeners: Array<(cartItems: CartItem[]) => void> = [];

async function notifyCartUpdateListeners() {
  const currentCart = await fetchCartItems(); // Fetch from Supabase
  for (const listener of cartUpdateListeners) {
    try {
      listener(currentCart);
    }catch (e) {
      console.error("Error in cart update listener:", e);
    }
}

export function subscribeToCartUpdates(callback: (cartItems: CartItem[]) => void): () => void { // Corrected position of the closing curly brace
  cartUpdateListeners.push(callback);
  // Immediately call callback with current cart state for initial load
  fetchCartItems().then(callback); // Fetch from Supabase on subscribe
  return () => {
    cartUpdateListeners = cartUpdateListeners.filter(cb => cb !== callback);
  };
}

// AUTH - Supabase Integration
// Note: Supabase Auth functions are typically imported directly from @supabase/supabase-js client.
// These placeholder functions mimic that pattern or provide wrappers if needed for consistency.

// The actual Supabase auth functions would be used like this:
// import { supabase } from './supabaseClient';
// const { data, error } = await supabase.auth.signInWithPassword({ email, password });

// For the purpose of keeping the placeholder structure and type consistency:

export async function signInWithEmail(email: string, password: string): Promise<{ user: User | null, error: { message: string } | null }> {
  console.log('signInWithEmail called with:', email);
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    console.error('Supabase sign in error:', error);
    if (error.message === 'Failed to fetch' || (error as any)?.message?.includes('fetch failed'))) { // More robust check for fetch errors
 return { user: null, error: { message: 'Network error: Unable to connect to authentication service. Please check your internet connection and ensure the Supabase service is reachable and configured correctly (URL/Key).' } as { message: string } }; // Added type assertion
    }
    return { user: null, error: { message: error.message } };
  }

  // Supabase returns a user object. We might need to fetch additional user details
  // from our 'users' table if it contains more than the default auth schema.
  if (data.user) {
       // Attempt to fetch user profile from our 'users' table
       const { data: userProfile, error: profileError } = await supabase
           .from('profiles') // Corrected table name
           .select('*')
           .eq('id', data.user.id) // Corrected column name
           .single();

       if (profileError) {
           console.error('Error fetching user profile after sign in:', profileError);
            // Decide how to handle this - potentially return auth user but log profile error
           const basicUser: User = {
               userId: data.user.id,
               email: data.user.email || 'N/A',
               displayName: data.user.user_metadata?.displayName || data.user.email?.split('@')[0] || 'User',
               whatsapp: data.user.user_metadata?.whatsapp || '',
               role: data.user.user_metadata?.role || 'customer', // Default role
               createdAt: data.user.created_at,
                // Default/empty address fields
               addressStreet: '',
               addressNumber: '',
               addressComplement: '',
               addressNeighborhood: '',
               addressCity: '',
               addressState: '',
               addressZip: '',
           };
 return { user: basicUser, error: { message: `Sign in successful, but failed to load profile: ${profileError.message}` } as { message: string } }; // Added type assertion
       }
        if (!userProfile) {
            console.warn('User profile not found after sign in for user ID:', data.user.id);
             const basicUser: User = {
               userId: data.user.id,
               email: data.user.email || 'N/A',
               displayName: data.user.user_metadata?.displayName || data.user.email?.split('@')[0] || 'User',
               whatsapp: data.user.user_metadata?.whatsapp || '',
               role: data.user.user_metadata?.role || 'customer',
               createdAt: data.user.created_at,
               addressStreet: '', addressNumber: '', addressComplement: '', addressNeighborhood: '', addressCity: '', addressState: '', addressZip: '',
           };
           return { user: basicUser, error: { message: `Sign in successful, but profile was not found.` } };
 }


       // Combine auth data with profile data, or just use profile data if comprehensive
       const fullUser: User = {
           userId: userProfile.id, // Corrected
           email: userProfile.email, 
           displayName: userProfile.display_name,
           whatsapp: userProfile.whatsapp,
           role: userProfile.role,
           createdAt: userProfile.created_at,
           addressStreet: userProfile.address_street,
           addressNumber: userProfile.address_number,
           addressComplement: userProfile.address_complement,
           addressNeighborhood: userProfile.address_neighborhood,
           addressCity: userProfile.address_city,
           addressState: userProfile.address_state,
           addressZip: userProfile.address_zip,
       };

       // Update localStorage or a state management solution with the new user
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('currentUser', JSON.stringify(fullUser));
        }


       return { user: fullUser, error: null };
  }


  return { user: null, error: { message: 'Unknown sign in error.' } };
}

export async function signUpWithEmail(email: string, password: string, displayName?: string, whatsapp?: string): Promise<{ user: User | null, error: { message: string } | null }> {
  console.log('signUpWithEmail called with:', email, displayName, whatsapp);
  // First, sign up the user using Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
        data: { 
            displayName: displayName || email.split('@')[0],
            whatsapp: whatsapp || '',
            // role: 'customer', // Role is managed in profiles table via trigger
        }
    }
  });

  if (authError) {
    console.error('Supabase sign up error:', authError);
    if (authError.message === 'Failed to fetch' || (authError as any)?.message?.includes('fetch failed'))) {
 return { user: null, error: { message: 'Network error: Unable to connect to authentication service for sign up. Please check your internet connection and Supabase configuration.' } as { message: string } }; // Added type assertion
    }
    return { user: null, error: { message: authError.message } };
  }

 if (!authData.user) {
    return { user: null, error: {message: "User not created in auth table."}};
  }

  // The trigger `on_auth_user_created` should automatically create a profile.
  // We can try to fetch this profile to return it.
  try {
    // Wait a brief moment for the trigger to potentially complete
    await new Promise(resolve => setTimeout(resolve, 500));

    const { data: profileData, error: profileError } = await supabase
        .from('profiles') // Corrected table name
        .select('*')
        .eq('id', authData.user.id) // Corrected column name
        .single();

    if (profileError || !profileData) {
        console.error('Error fetching profile after signup or profile not found:', profileError);
        // Fallback: return basic user info from auth if profile fetch fails
        const basicUser: User = {
            userId: authData.user.id,
            email: authData.user.email || 'N/A',
            displayName: authData.user.user_metadata?.displayName || authData.user.email?.split('@')[0] || 'User',
            whatsapp: authData.user.user_metadata?.whatsapp || '',
            role: 'customer', // Default assumption
            createdAt: authData.user.created_at,
            addressStreet: '', addressNumber: '', addressComplement: '', addressNeighborhood: '', addressCity: '', addressState: '', addressZip: '',
        };
        return { user: basicUser, error: { message: `Signup successful, but failed to fetch profile immediately: ${profileError?.message || "Profile not found"}` } };
 }

    const fullUser: User = {
        userId: profileData.id, // Corrected
        email: profileData.email,
        displayName: profileData.display_name,
        whatsapp: profileData.whatsapp,
        role: profileData.role,
        createdAt: profileData.created_at,
        addressStreet: profileData.address_street,
        addressNumber: profileData.address_number,
        addressComplement: profileData.address_complement,
        addressNeighborhood: profileData.address_neighborhood,
        addressCity: profileData.address_city,
        addressState: profileData.address_state,
        addressZip: profileData.address_zip,
    };

    if (typeof localStorage !== 'undefined') {
        localStorage.setItem('currentUser', JSON.stringify(fullUser));
    }
    return { user: fullUser, error: null };

  } catch (e) {
      console.error("Error in signUpWithEmail post-profile fetch:", e);
      const basicUser: User = {
         userId: authData.user.id,
         email: authData.user.email || 'N/A',
         displayName: authData.user.user_metadata?.displayName || authData.user.email?.split('@')[0] || 'User',
         whatsapp: authData.user.user_metadata?.whatsapp || '',
         role: 'customer', // Default assumption
         createdAt: authData.user.created_at,
         addressStreet: '', addressNumber: '', addressComplement: '', addressNeighborhood: '', addressCity: '', addressState: '', addressZip: '',
     };
 return { user: basicUser, error: { message: `Signup successful, but an exception occurred while fetching profile.` } as { message: string } }; // Added type assertion
  }
}


export async function signOut(): Promise<{ error: { message: string } | null }> {
  console.log('signOut called');
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Supabase sign out error:', error);
      if (error.message === 'Failed to fetch' || (error as any)?.message?.includes('fetch failed')) {
        // Even if sign out fails to reach server, clear local state
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem('currentUser');
        }
 return { error: { message: 'Network error during sign out. Local session cleared, but server state might be unchanged.' } as { message: string } }; // Added type assertion
      }
      return { error: { message: error.message } };
    }

    // Clear local storage or state management upon successful sign out
    if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('currentUser');
    }
    return { error: null };

  } catch (e: any) {
    console.error('Unexpected error during signOut:', e);
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('currentUser'); // Attempt to clear local session on any error
    }
 return { error: { message: e.message || 'An unexpected error occurred during sign out.' } as { message: string } }; // Added type assertion
  }
}


export async function getCurrentUser(): Promise<User | null> {
  try {
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError) {
      // Check for specific network-related errors
      if (authError.message === 'Failed to fetch' || (authError as any)?.message?.includes('fetch failed')) {
        console.warn('Supabase authError in getCurrentUser (Network Error - will return null):', authError.message);
      } else if (authError.name === 'AuthSessionMissingError') {
        console.warn('Supabase authError in getCurrentUser (AuthSessionMissingError - will return null):', authError.message);
      } else {
        console.warn('Supabase authError in getCurrentUser (will return null):', authError.message);
      }
      
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('currentUser');
      }
      return null;
    }

    if (!authData.user) {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('currentUser');
      }
      return null; // No authenticated user
    }

    // If an authenticated user exists, fetch their profile
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError) {
      console.warn('Error fetching current user profile (will return basic user info or null if critical):', profileError.message, '- User ID:', authData.user.id);
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('currentUser');
      }
      // Fallback to basic auth user info if profile is missing, but log it as an issue.
      // This can happen if RLS on profiles table blocks access, or profile doesn't exist.
      const basicUser: User = {
        userId: authData.user.id,
        email: authData.user.email || 'N/A',
        displayName: authData.user.user_metadata?.displayName || authData.user.email?.split('@')[0] || 'User',
        whatsapp: authData.user.user_metadata?.whatsapp || '',
        role: (authData.user.user_metadata?.role as 'customer' | 'admin') || 'customer',
        createdAt: authData.user.created_at,
        addressStreet: '', addressNumber: '', addressComplement: '', addressNeighborhood: '', addressCity: '', addressState: '', addressZip: '',
      };
      return basicUser;
    }
    
    if (!userProfile) {
        console.warn('User profile not found for authenticated user ID (will return basic user info):', authData.user.id);
        if (typeof localStorage !== 'undefined') {
            localStorage.removeItem('currentUser');
        }
        const basicUser: User = { // Construct from authData.user if profile is truly missing
            userId: authData.user.id,
            email: authData.user.email || 'N/A',
            displayName: authData.user.user_metadata?.displayName || authData.user.email?.split('@')[0] || 'User',
            whatsapp: authData.user.user_metadata?.whatsapp || '',
            role: (authData.user.user_metadata?.role as 'customer' | 'admin') || 'customer',
            createdAt: authData.user.created_at,
            addressStreet: '', addressNumber: '', addressComplement: '', addressNeighborhood: '', addressCity: '', addressState: '', addressZip: '',
        };
        return basicUser;
    }


    const currentUser: User = {
      userId: userProfile.id,
      email: userProfile.email,
      displayName: userProfile.display_name,
      whatsapp: userProfile.whatsapp,
      role: userProfile.role,
      createdAt: userProfile.created_at,
      addressStreet: userProfile.address_street,
      addressNumber: userProfile.address_number,
      addressComplement: userProfile.address_complement,
      addressNeighborhood: userProfile.address_neighborhood,
      addressCity: userProfile.address_city,
      addressState: userProfile.address_state,
      addressZip: userProfile.address_zip,
    };

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
    }
    return currentUser;

  } catch (error: any) {
    // Catch any unexpected errors from supabase.auth.getUser() itself
    console.error('Critical error in getCurrentUser (e.g., network issue, Supabase client problem):', error.message);
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('currentUser');
    }
    return null;
  }
}

export async function updateUserDetails(
  userId: string,
  data: Partial<Pick<User, 'displayName' | 'whatsapp' | 'addressStreet' | 'addressNumber' | 'addressComplement' | 'addressNeighborhood' | 'addressCity' | 'addressState' | 'addressZip'>>
): Promise<{ user: User | null; error: { message: string } | null }> {
  console.log('updateUserDetails called for userId:', userId, 'with data:', data);

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


  const { data: updatedData, error } = await supabase
    .from('profiles') // Corrected table name
    .update(updatePayload)
    .eq('id', userId) // Corrected column name
    .select() 
    .single(); 

  if (error) {
    console.error(`Error updating user details for user ${userId}:`, error);
    if (error.message === 'Failed to fetch' || (error as any)?.message?.includes('fetch failed')) {
 return { user: null, error: { message: 'Network error: Unable to save user details. Please check your internet connection and Supabase configuration.' } as { message: string } }; // Added type assertion
    }
    return { user: null, error: { message: error.message } };
  }

   if (!updatedData) {
       return { user: null, error: { message: "User not found after update attempt." } };
   }

   const updatedUser: User = {
       userId: updatedData.id, // Corrected
       email: updatedData.email,
       displayName: updatedData.display_name,
       whatsapp: updatedData.whatsapp,
       role: updatedData.role,
       createdAt: updatedData.created_at,
       addressStreet: updatedData.address_street,
       addressNumber: updatedData.address_number,
       addressComplement: updatedData.address_complement,
       addressNeighborhood: updatedData.address_neighborhood,
       addressCity: updatedData.address_city,
       addressState: updatedData.address_state,
       addressZip: updatedData.address_zip,
   };
 
   const currentUserFromStorage = await getCurrentUser(); 
   if (currentUserFromStorage && currentUserFromStorage.userId === userId) {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        }
   }

 
  return { user: updatedUser, error: null };
}


export async function checkAdminRole(): Promise<boolean> {
  const user = await getCurrentUser(); 
  return user?.role === 'admin';
}

// MASTER PRODUCTS - For Admin CRUD
let MOCK_MASTER_PRODUCTS: Product[] = [];


export async function fetchAdminProducts(): Promise<Product[]> {
  console.log('fetchAdminProducts called');

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false }); 

  if (error) {
    console.error('Error fetching admin products:', error);
    if (error.message === 'Failed to fetch' || (error as any)?.message?.includes('fetch failed')) {
 throw new Error('Network error: Unable to fetch admin products. Please check connection and Supabase config.');
    }
    throw error;
  }
  return data.map(p => ({ ...p, imageUrls: p.image_urls, isSeasonal: p.is_seasonal })) as Product[];
}

export async function createProduct(productData: Omit<Product, 'productId' | 'createdAt' | 'updatedAt'>): Promise<Product> {
  console.log('createProduct called with:', productData);

  const { data, error } = await supabase
    .from('products')
    .insert([
      {
        name: productData.name,
        description: productData.description,
        image_urls: productData.imageUrls, 
        attributes: productData.attributes, 
        is_seasonal: productData.isSeasonal, 
      },
    ])
    .select() 
    .single(); 

  if (error) {
    console.error('Error creating product:', error);
    if (error.message === 'Failed to fetch' || (error as any)?.message?.includes('fetch failed')) {
 throw new Error('Network error: Unable to create product. Please check connection and Supabase config.');
    }
    throw error;
  }
  return { ...data, imageUrls: data.image_urls, isSeasonal: data.is_seasonal } as Product;
}

export async function updateProduct(productId: string, productData: Partial<Omit<Product, 'productId' | 'createdAt' | 'updatedAt'>>): Promise<Product> {
  console.log('updateProduct called for ID', productId, 'with:', productData);
  
  const updatePayload: Record<string, any> = {};
  if (productData.name !== undefined) updatePayload.name = productData.name;
  if (productData.description !== undefined) updatePayload.description = productData.description;
  if (productData.imageUrls !== undefined) updatePayload.image_urls = productData.imageUrls;
  if (productData.attributes !== undefined) updatePayload.attributes = productData.attributes;
  if (productData.isSeasonal !== undefined) updatePayload.is_seasonal = productData.isSeasonal;


  const { data, error } = await supabase
    .from('products')
    .update(updatePayload)
    .eq('product_id', productId) 
    .select() 
    .single(); 

  if (error) {
    console.error('Error updating product:', error);
    if (error.message === 'Failed to fetch' || (error as any)?.message?.includes('fetch failed')) {
 throw new Error('Network error: Unable to update product. Please check connection and Supabase config.');
    }
    throw error;
  }

  if (!data) {
     throw new Error("Product not found after update");
  }
  return { ...data, imageUrls: data.image_urls, isSeasonal: data.is_seasonal } as Product;
}

export async function deleteProduct(productId: string): Promise<void> {
  console.log('deleteProduct called for ID:', productId);

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('product_id', productId);

  if (error) {
    console.error('Error deleting product:', error);
    if (error.message === 'Failed to fetch' || (error as any)?.message?.includes('fetch failed')) {
 throw new Error('Network error: Unable to delete product. Please check connection and Supabase config.');
    }
    throw error;
  }
}


// PURCHASE CYCLES - For Admin CRUD
const MOCK_PURCHASE_CYCLES: PurchaseCycle[] = [];

export async function fetchPurchaseCycles(): Promise<PurchaseCycle[]> {
  console.log('fetchPurchaseCycles called');

  const { data, error } = await supabase
    .from('purchase_cycles')
    .select('*')
    .order('start_date', { ascending: false }); 

  if (error) {
    console.error('Error fetching purchase cycles:', error);
    if (error.message === 'Failed to fetch' || (error as any)?.message?.includes('fetch failed')) {
 throw new Error('Network error: Unable to fetch purchase cycles. Please check connection and Supabase config.');
    }
    throw error;
  }
  return data.map(pc => ({...pc, cycleId: pc.cycle_id, startDate: pc.start_date, endDate: pc.end_date, isActive: pc.is_active })) as PurchaseCycle[];
}

export async function createPurchaseCycle(cycleData: Omit<PurchaseCycle, 'cycleId' | 'createdAt'>): Promise<PurchaseCycle> {
  console.log('createPurchaseCycle called with:', cycleData);

  if (cycleData.isActive) {
      const { error: updateError } = await supabase
          .from('purchase_cycles')
          .update({ is_active: false })
          .eq('is_active', true);

      if (updateError) {
          console.error('Error deactivating previous active cycles:', updateError);
           if (updateError.message === 'Failed to fetch' || (updateError as any)?.message?.includes('fetch failed')) {
             // Non-critical, proceed with creation but log it.
             console.warn('Network error while deactivating other cycles. Proceeding with new cycle creation.');
           } else {
             // Other errors might be more critical, but for now, we'll still try to create the new cycle.
             console.warn('Error deactivating other cycles. Details:', updateError.message);
           }
      }
  }


  const { data, error } = await supabase
    .from('purchase_cycles')
    .insert([
      {
        name: cycleData.name,
        start_date: cycleData.startDate, 
        end_date: cycleData.endDate,
        is_active: cycleData.isActive,
      },
    ])
    .select() 
    .single(); 

  if (error) {
    console.error('Error creating purchase cycle:', error);
    if (error.message === 'Failed to fetch' || (error as any)?.message?.includes('fetch failed')) {
 throw new Error('Network error: Unable to create purchase cycle. Please check connection and Supabase config.');
    }
    throw error;
  }
  return {...data, cycleId: data.cycle_id, startDate: data.start_date, endDate: data.end_date, isActive: data.is_active } as PurchaseCycle;
}

export async function updatePurchaseCycle(cycleId: string, cycleData: Partial<Omit<PurchaseCycle, 'cycleId' | 'createdAt'>>): Promise<PurchaseCycle> {
  console.log('updatePurchaseCycle called for ID', cycleId, 'with:', cycleData);

  if (cycleData.isActive === true) { 
      const { error: updateError } = await supabase
          .from('purchase_cycles')
          .update({ is_active: false })
          .eq('is_active', true)
          .neq('cycle_id', cycleId); 

      if (updateError) {
          console.error('Error deactivating other active cycles:', updateError);
          if (updateError.message === 'Failed to fetch' || (updateError as any)?.message?.includes('fetch failed')) {
             console.warn('Network error while deactivating other cycles during update. Proceeding with current cycle update.');
           } else {
             console.warn('Error deactivating other cycles during update. Details:', updateError.message);
           }
      }
  }

  const updatePayload: Record<string, any> = {};
  if (cycleData.name !== undefined) updatePayload.name = cycleData.name;
  if (cycleData.startDate !== undefined) updatePayload.start_date = cycleData.startDate;
  if (cycleData.endDate !== undefined) updatePayload.end_date = cycleData.endDate;
  if (cycleData.isActive !== undefined) updatePayload.is_active = cycleData.isActive;


  const { data, error } = await supabase
    .from('purchase_cycles')
    .update(updatePayload)
    .eq('cycle_id', cycleId) 
    .select() 
    .single(); 

  if (error) {
    console.error('Error updating purchase cycle:', error);
    if (error.message === 'Failed to fetch' || (error as any)?.message?.includes('fetch failed')) {
 throw new Error('Network error: Unable to update purchase cycle. Please check connection and Supabase config.');
    }
    throw error;
  }

  if (!data) {
     throw new Error("PurchaseCycle not found after update");
  }
  return {...data, cycleId: data.cycle_id, startDate: data.start_date, endDate: data.end_date, isActive: data.is_active } as PurchaseCycle;
}

export async function deletePurchaseCycle(cycleId: string): Promise<void> {
  console.log('deletePurchaseCycle called for ID:', cycleId);

  const { error } = await supabase
    .from('purchase_cycles')
    .delete()
    .eq('cycle_id', cycleId);

  if (error) {
    console.error('Error deleting purchase cycle:', error);
    if (error.message === 'Failed to fetch' || (error as any)?.message?.includes('fetch failed')) {
 throw new Error('Network error: Unable to delete purchase cycle. Please check connection and Supabase config.');
    }
    throw error;
  }
}


// CYCLE PRODUCTS - For Admin CRUD and Customer Display
let MOCK_CYCLE_PRODUCTS: CycleProduct[] = [];
let MOCK_DISPLAYABLE_PRODUCTS: DisplayableProduct[] = [];

export async function fetchCycleProducts(cycleId: string): Promise<CycleProduct[]> {
  console.log('fetchCycleProducts called for cycle ID:', cycleId);

  const { data, error } = await supabase
    .from('cycle_products')
    .select('*')
    .eq('cycle_id', cycleId);

  if (error) {
    console.error(`Error fetching cycle products for cycle ${cycleId}:`, error);
    if (error.message === 'Failed to fetch' || (error as any)?.message?.includes('fetch failed')) {
 throw new Error(`Network error: Unable to fetch cycle products for cycle ${cycleId}. Please check connection and Supabase config.`);
    }
    throw error;
  }
  return data.map(cp => ({
      cycleProductId: cp.cycle_product_id,
      cycleId: cp.cycle_id,
      productId: cp.product_id,
      productNameSnapshot: cp.product_name_snapshot,
      priceInCycle: cp.price_in_cycle,
      isAvailableInCycle: cp.is_available_in_cycle,
      displayImageUrl: cp.display_image_url,
      createdAt: cp.created_at, // Ensure these are mapped if your type includes them
      updatedAt: cp.updated_at  // Ensure these are mapped if your type includes them
  })) as CycleProduct[];
}

export async function createCycleProduct(cycleProductData: Omit<CycleProduct, 'cycleProductId' | 'createdAt' | 'updatedAt'>): Promise<CycleProduct> {
  console.log('createCycleProduct called with:', cycleProductData);

  const { data, error } = await supabase
    .from('cycle_products')
    .insert([
      {
        cycle_id: cycleProductData.cycleId,
        product_id: cycleProductData.productId,
        product_name_snapshot: cycleProductData.productNameSnapshot,
        price_in_cycle: cycleProductData.priceInCycle,
        is_available_in_cycle: cycleProductData.isAvailableInCycle,
        display_image_url: cycleProductData.displayImageUrl,
      },
    ])
    .select() 
    .single(); 

  if (error) {
    console.error('Error creating cycle product:', error);
    if (error.message === 'Failed to fetch' || (error as any)?.message?.includes('fetch failed')) {
 throw new Error('Network error: Unable to create cycle product. Please check connection and Supabase config.');
    }
    throw error;
  }
  return {
      cycleProductId: data.cycle_product_id,
      cycleId: data.cycle_id,
      productId: data.product_id,
      productNameSnapshot: data.product_name_snapshot,
      priceInCycle: data.price_in_cycle,
      isAvailableInCycle: data.is_available_in_cycle,
      displayImageUrl: data.display_image_url,
      createdAt: data.created_at,
      updatedAt: data.updated_at
  } as CycleProduct;
}

export async function updateCycleProduct(cycleProductId: string, cycleProductData: Partial<Omit<CycleProduct, 'cycleProductId' | 'createdAt' | 'updatedAt'>>): Promise<CycleProduct> {
  console.log('updateCycleProduct called for ID', cycleProductId, 'with:', cycleProductData);

  const updatePayload: Record<string, any> = {};
  if (cycleProductData.cycleId !== undefined) updatePayload.cycle_id = cycleProductData.cycleId;
  if (cycleProductData.productId !== undefined) updatePayload.product_id = cycleProductData.productId;
  if (cycleProductData.productNameSnapshot !== undefined) updatePayload.product_name_snapshot = cycleProductData.productNameSnapshot;
  if (cycleProductData.priceInCycle !== undefined) updatePayload.price_in_cycle = cycleProductData.priceInCycle;
  if (cycleProductData.isAvailableInCycle !== undefined) updatePayload.is_available_in_cycle = cycleProductData.isAvailableInCycle;
  if (cycleProductData.displayImageUrl !== undefined) updatePayload.display_image_url = cycleProductData.displayImageUrl;

  const { data, error } = await supabase
    .from('cycle_products')
    .update(updatePayload)
    .eq('cycle_product_id', cycleProductId)
    .select() 
    .single(); 

  if (error) {
    console.error('Error updating cycle product:', error);
     if (error.message === 'Failed to fetch' || (error as any)?.message?.includes('fetch failed')) {
 throw new Error('Network error: Unable to update cycle product. Please check connection and Supabase config.');
    }
    throw error;
  }

   if (!data) {
     throw new Error("Cycle product not found after update");
  }
  return {
      cycleProductId: data.cycle_product_id,
      cycleId: data.cycle_id,
      productId: data.product_id,
      productNameSnapshot: data.product_name_snapshot,
      priceInCycle: data.price_in_cycle,
      isAvailableInCycle: data.is_available_in_cycle,
      displayImageUrl: data.display_image_url,
      createdAt: data.created_at,
      updatedAt: data.updated_at
  } as CycleProduct;
}

export async function deleteCycleProduct(cycleProductId: string): Promise<void> {
  console.log('deleteCycleProduct called for ID:', cycleProductId);

  const { error } = await supabase
    .from('cycle_products')
    .delete()
    .eq('cycle_product_id', cycleProductId);

  if (error) {
    console.error('Error deleting cycle product:', error);
    if (error.message === 'Failed to fetch' || (error as any)?.message?.includes('fetch failed')) {
 throw new Error('Network error: Unable to delete cycle product. Please check connection and Supabase config.');
    }
    throw error;
  }
}

export async function fetchDisplayableProducts(): Promise<DisplayableProduct[]> {
  console.log('fetchDisplayableProducts called');

  const { data, error } = await supabase
    .from('cycle_products')
    .select(`
      cycle_product_id,
      cycle_id,
      product_id,
      product_name_snapshot,
      price_in_cycle,
      is_available_in_cycle,
      display_image_url,
      products (
        description,
        attributes,
        image_urls
      )
    `)
    .eq('is_available_in_cycle', true)
    .filter('cycle_id', 'in', '(select cycle_id from purchase_cycles where is_active = true)'); 

  if (error) {
    console.error('Error fetching displayable products. Raw error object:', error);
    // Attempt to log common Supabase error properties if they exist
    const err = error as any; // Type assertion to access potential properties
    console.error(`Error details - Code: ${err.code}, Message: ${err.message}, Details: ${err.details}, Hint: ${err.hint}`);
    console.error('Full error stringified (if possible):', JSON.stringify(err, Object.getOwnPropertyNames(err), 2));
    if (error.message === 'Failed to fetch' || (error as any)?.message?.includes('fetch failed')) {
 throw new Error('Network error: Unable to fetch displayable products. Please check connection and Supabase config.');
    }
    throw err; // Re-throw the (potentially typed) error
  }

  const displayableProducts: DisplayableProduct[] = data.map((item: any) => ({
    cycleProductId: item.cycle_product_id,
    cycleId: item.cycle_id,
    productId: item.product_id,
    name: item.product_name_snapshot, 
    description: item.products?.description || '',
    price: item.price_in_cycle || 0, // Ensure price is a number, default to 0 if null/undefined
    isAvailable: item.is_available_in_cycle, // Will be true due to filter
    imageUrl: item.display_image_url || item.products?.image_urls?.[0] || 'https://placehold.co/400x300.png?text=Produto',
    attributes: item.products?.attributes || {},
  }));

  return displayableProducts;
}

export async function fetchDisplayableProductById(cycleProductId: string): Promise<DisplayableProduct | null> {
  console.log('fetchDisplayableProductById called for ID:', cycleProductId);

  const { data, error } = await supabase
    .from('cycle_products')
    .select(`
      cycle_product_id,
      cycle_id,
      product_id,
      product_name_snapshot,
      price_in_cycle,
      is_available_in_cycle,
      display_image_url,
      products (
        description,
        attributes,
        image_urls
      )
    `)
    .eq('cycle_product_id', cycleProductId)
     .eq('is_available_in_cycle', true)
    .filter('cycle_id', 'in', '(select cycle_id from purchase_cycles where is_active = true)') 
    .single(); 

  if (error && error.code !== 'PGRST116') { 
    console.error(`Error fetching displayable product ${cycleProductId}:`, error);
     if (error.message === 'Failed to fetch' || (error as any)?.message?.includes('fetch failed')) {
 throw new Error(`Network error: Unable to fetch displayable product ${cycleProductId}. Please check connection and Supabase config.`);
    }
    throw error;
  }

  if (!data) {
    return null; 
  }

  const displayableProduct: DisplayableProduct = {
    cycleProductId: data.cycle_product_id,
    cycleId: data.cycle_id,
    productId: data.product_id,
    name: data.product_name_snapshot, 
    description: data.products?.description || '', 
    price: data.price_in_cycle || 0, // Ensure price is a number, default to 0 if null/undefined
    isAvailable: data.is_available_in_cycle,
    imageUrl: data.display_image_url || data.products?.image_urls?.[0] || 'https://placehold.co/400x300.png?text=Produto',
    attributes: data.products?.attributes || {}, 
  };

  return displayableProduct;
}


// CART - Local Storage based (client-side only)
export async function fetchCartItems(): Promise<CartItem[]> { // Corrected function declaration
  console.log('fetchCartItems called (from Supabase)');
  const user = await getCurrentUser();
  if (!user) {
    console.warn('fetchCartItems called without a logged-in user.');
    return []; // Return empty cart if no user is logged in
  }

  const { data, error } = await supabase
    .from('cart_items')
    .select(`
      cart_item_id,
      cycle_product_id,
      quantity,
      cycle_products (
        product_id,
        product_name_snapshot,
        price_in_cycle,
        display_image_url
      )
    `)
    .eq('user_id', user.userId);

  if (error) {
    console.error('Error fetching cart items:', error);
    if((error as any)?.message?.includes('fetch failed')) {
 throw new Error('Network error: Unable to fetch cart items. Please check connection and Supabase config.');
    }
    throw error;
  }

  const cartItems: CartItem[] = data.map((item: any) => ({
    cartItemId: item.cart_item_id,
    cycleProductId: item.cycle_product_id,
    // Data from cycle_products relationship
    productId: item.cycle_products?.product_id || '', // Add product_id
    name: item.cycle_products?.product_name_snapshot || 'Unknown Product',
    price: item.cycle_products?.price_in_cycle || 0,
    imageUrl: item.cycle_products?.display_image_url || 'https://placehold.co/400x300.png?text=Produto',
    // Data from cart_items
    quantity: item.quantity,
    // Description is not in cart_items or the cycle_products select, so it's omitted or defaulted
    description: '', // Description is not fetched here
  }));

  return cartItems;
}

export async function addToCart(cycleProductId: string, quantity: number): Promise<void> {
  console.log('addToCart called for cycleProductId:', cycleProductId, 'quantity:', quantity, '(to Supabase)');
  const user = await getCurrentUser();
  if (!user) {
    console.error('addToCart called without a logged-in user.');
    throw new Error("User not logged in. Cannot add to cart.");
  }

  // Check if the item already exists for this user and cycle_product
  const { data: existingItems, error: fetchError } = await supabase
    .from('cart_items')
    .select('cart_item_id, quantity')
    .eq('user_id', user.userId)
    .eq('cycle_product_id', cycleProductId);

  if (fetchError) {
    console.error('Error checking existing cart item:', fetchError);
    if((fetchError as any)?.message?.includes('fetch failed')) {
 throw new Error('Network error: Unable to check cart status. Please try again.');
    }
    throw fetchError;
  }

  if (existingItems && existingItems.length > 0) {
    // Item exists, update quantity
    const existingItem = existingItems[0];
    const newQuantity = existingItem.quantity + quantity;
    const { error: updateError } = await supabase
      .from('cart_items')
      .update({ quantity: newQuantity })
      .eq('cart_item_id', existingItem.cart_item_id);

    if (updateError) {
      console.error('Error updating cart item quantity:', updateError);
       if((updateError as any)?.message?.includes('fetch failed')) {
 throw new Error('Network error: Unable to update cart item quantity. Please try again.');
       }
      throw updateError;
    }
    console.log(`Updated quantity for cart item ${existingItem.cart_item_id}`);
  } else {
    // Item does not exist, insert new row
    const { error: insertError } = await supabase
      .from('cart_items')
      .insert({
        user_id: user.userId,
        cycle_product_id: cycleProductId,
        quantity: quantity,
      });

    if (insertError) {
      console.error('Error adding new item to cart:', insertError);
      if((insertError as any)?.message?.includes('fetch failed')) {
 throw new Error('Network error: Unable to add item to cart. Please try again.');
      }
      throw insertError;
    }
    console.log(`Added new item ${cycleProductId} to cart for user ${user.userId}`);
  }

  // After modifying the cart in DB, notify listeners to refetch
  await notifyCartUpdateListeners();
}

export async function updateCartItemQuantity(cartItemId: string, newQuantity: number): Promise<void> {
  console.log('updateCartItemQuantity called for cartItemId:', cartItemId, 'newQuantity:', newQuantity, '(to Supabase)');
  // Ensure user is logged in, although RLS should handle this
  const user = await getCurrentUser();
  if (!user) {
      console.warn('updateCartItemQuantity called without a logged-in user.');
      throw new Error("User not logged in. Cannot update cart.");
  }

  if (newQuantity <= 0) {
    // If quantity is 0 or less, remove the item instead
    await removeFromCart(cartItemId);
    return;
  }

  const { error } = await supabase
    .from('cart_items')
    .update({ quantity: newQuantity })
    .eq('cart_item_id', cartItemId)
    .eq('user_id', user.userId); // Ensure the user owns the cart item

  if (error) {
    console.error(`Error updating cart item quantity for ${cartItemId}:`, error);
    if((error as any)?.message?.includes('fetch failed')) {
 throw new Error('Network error: Unable to update cart item quantity. Please try again.');
    } else {
      throw error;
    }
  }
  console.log(`Updated quantity for cart item ${cartItemId}`);

  await notifyCartUpdateListeners(); // Notify listeners after DB update
}

export async function removeFromCart(cartItemId: string): Promise<void> {
  console.log('removeFromCart called for cartItemId:', cartItemId, '(to Supabase)');
  // Ensure user is logged in, although RLS should handle this
  const user = await getCurrentUser();
  if (!user) {
      console.warn('removeFromCart called without a logged-in user.');
      throw new Error("User not logged in. Cannot remove from cart.");
  }

  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('cart_item_id', cartItemId)
    .eq('user_id', user.userId); // Ensure the user owns the cart item

  if (error) {
    console.error(`Error removing cart item ${cartItemId}:`, error);
    if((error as any)?.message?.includes('fetch failed')) {
 throw new Error('Network error: Unable to remove item from cart. Please try again.');
    } else {
      throw error;
    }
  }
  console.log(`Removed cart item ${cartItemId}`);

  await notifyCartUpdateListeners(); // Notify listeners after DB update
}



export async function processCheckout(cartItems: CartItem[]): Promise<Order> {
  console.log('processCheckout called with items:', cartItems, '(to Supabase)');
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    throw new Error("User not logged in. Cannot process checkout.");
  }

  if (cartItems.length === 0) {
    throw new Error("Cart is empty. Cannot process checkout.");
  }

  // Fetch the active cycle details from the database
  const { data: activeCycleData, error: cycleError } = await supabase
    .from('purchase_cycles')
    .select('cycle_id')
    .eq('is_active', true)
    .single();

  if (cycleError || !activeCycleData) {
    console.error('Error fetching active cycle or no active cycle found:', cycleError);
    if((cycleError as any)?.message?.includes('fetch failed')) {
 throw new Error("Network error: Unable to verify active purchase cycle. Cannot process checkout.");
    }
    throw new Error("No active purchase cycle found or error fetching it. Cannot process checkout.");
  }
  const activeCycleId = activeCycleData.cycle_id;


  const orderItems: OrderItem[] = cartItems.map(cartItem => ({
    productId: cartItem.productId,
    cycleProductId: cartItem.cycleProductId,
    productName: cartItem.name,
    quantity: cartItem.quantity,
    priceAtPurchase: cartItem.price,
    lineItemTotal: cartItem.price * cartItem.quantity,
  }));

  const orderTotalAmount = orderItems.reduce((sum, item) => sum + item.lineItemTotal, 0);

  // Generate a new order number
  const { data: lastOrder, error: lastOrderError } = await supabase
    .from('orders')
    .select('order_number')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (lastOrderError && lastOrderError.code !== 'PGRST116' && (lastOrderError as any)?.message?.includes('fetch failed')) { // PGRST116 means no rows found, which is fine for the first order, but log network errors
 console.error("Network error fetching last order number:", lastOrderError);
      throw new Error("Network error: Unable to generate order number. Cannot process checkout.");
  }


  let newOrderNumber = `ORD${new Date().getFullYear()}001`;
  if (!lastOrderError && lastOrder && lastOrder.order_number) {
    const lastNum = parseInt(lastOrder.order_number.slice(-3));
    newOrderNumber = `ORD${new Date().getFullYear()}${(lastNum + 1).toString().padStart(3, '0')}`;
  }


  const newOrderPayload = {
    // order_id will be auto-generated by Supabase
    order_number: newOrderNumber,
    user_id: currentUser.userId,
    customer_name_snapshot: currentUser.displayName,
    customer_whatsapp_snapshot: currentUser.whatsapp,
    cycle_id: activeCycleId,
    order_total_amount: orderTotalAmount,
    order_status: "Pending Payment", 
    payment_status: "Unpaid",        
    order_date: new Date().toISOString(),
  };

  const { data: createdOrderData, error: createOrderError } = await supabase
    .from('orders')
    .insert(newOrderPayload)
    .select()
    .single();
  
  if (createOrderError || !createdOrderData) {
      console.error("Error creating order in database:", createOrderError);
      if((createOrderError as any)?.message?.includes('fetch failed')) {
 throw new Error("Network error: Failed to save order. Please try again.");
      }
      throw new Error("Failed to create order in database.");
  }

  const orderItemsPayload = orderItems.map(item => ({
      order_id: createdOrderData.order_id,
      product_id: item.productId,
      cycle_product_id: item.cycleProductId,
      product_name: item.productName,
      quantity: item.quantity,
      price_at_purchase: item.priceAtPurchase,
      line_item_total: item.lineItemTotal,
  }));

  const { error: createOrderItemsError } = await supabase
    .from('order_items')
    .insert(orderItemsPayload);

  if (createOrderItemsError) {
      console.error("Error creating order items in database:", createOrderItemsError);
      // Potentially delete the order record if items fail to insert (rollback logic)
      await supabase.from('orders').delete().eq('order_id', createdOrderData.order_id);
 if((createOrderItemsError as any)?.message?.includes('fetch failed')) {
          throw new Error("Network error: Failed to save order items. Order has been cancelled.");
      }
      throw new Error("Failed to create order items in database. Order has been cancelled.");
  }

  // Clear the user's cart in the database after a successful order
  const { error: clearCartError } = await supabase
    .from('cart_items')
    .delete()
    .eq('user_id', currentUser.userId);

  if (clearCartError) {
      console.error("Error clearing user cart after checkout:", clearCartError);
      // Decide how critical this is. Order is created, so maybe just log the error and don't block?
 if ((clearCartError as any)?.message?.includes('fetch failed')) {
         console.warn("Network error: Failed to clear user cart after checkout. Manual cleanup may be needed.");
      }
  }
  notifyCartUpdateListeners(); 

  return {
      orderId: createdOrderData.order_id,
      orderNumber: createdOrderData.order_number,
      userId: createdOrderData.user_id,
      customerNameSnapshot: createdOrderData.customer_name_snapshot,
      customerWhatsappSnapshot: createdOrderData.customer_whatsapp_snapshot,
      cycleId: createdOrderData.cycle_id,
      items: orderItems, // Use the already mapped items
      orderTotalAmount: createdOrderData.order_total_amount,
      orderStatus: createdOrderData.order_status,
      paymentStatus: createdOrderData.payment_status,
      orderDate: createdOrderData.order_date,
      adminNotes: createdOrderData.admin_notes,
      // Ensure all fields from Order type are mapped
  } as Order;
}


export async function fetchAdminOrders(): Promise<Order[]> {
  console.log('fetchAdminOrders called (from Supabase)');
  
  const { data: ordersData, error: ordersError } = await supabase
    .from('orders')
    .select('*')
    .order('order_date', { ascending: false });

  if (ordersError) {
    console.error("Error fetching admin orders:", ordersError);
    if((ordersError as any)?.message?.includes('fetch failed')) {
 throw new Error("Network error: Unable to fetch admin orders.");
    }
    throw ordersError;
  }

  const orders: Order[] = await Promise.all(ordersData.map(async (orderDto: any) => {
    const { data: itemsData, error: itemsError } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderDto.order_id);

    if (itemsError) {
      console.error(`Error fetching items for order ${orderDto.order_id}:`, itemsError);
 if((itemsError as any)?.message?.includes('fetch failed')) {
        console.warn(`Network error fetching items for order ${orderDto.order_id}. Order items may be incomplete.`);
         // Continue with empty items or handle as critical error
      }
    }

    return {
      orderId: orderDto.order_id,
      orderNumber: orderDto.order_number,
      userId: orderDto.user_id,
      customerNameSnapshot: orderDto.customer_name_snapshot,
      customerWhatsappSnapshot: orderDto.customer_whatsapp_snapshot,
      cycleId: orderDto.cycle_id,
      items: itemsData?.map(itemDto => ({
        productId: itemDto.product_id,
        cycleProductId: itemDto.cycle_product_id,
        productName: itemDto.product_name,
        quantity: itemDto.quantity,
        priceAtPurchase: itemDto.price_at_purchase,
        lineItemTotal: itemDto.line_item_total,
      })) || [],
      orderTotalAmount: orderDto.order_total_amount,
      orderStatus: orderDto.order_status,
      paymentStatus: orderDto.payment_status,
      orderDate: orderDto.order_date,
      adminNotes: orderDto.admin_notes,
    } as Order;
  }));

  return orders;
}

export async function fetchUserOrders(userId: string): Promise<Order[]> {
  console.log(`fetchUserOrders called for userId: ${userId} (from Supabase)`);
  
  const { data: ordersData, error: ordersError } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', userId)
    .order('order_date', { ascending: false });

  if (ordersError) {
    console.error(`Error fetching orders for user ${userId}:`, ordersError);
    if((ordersError as any)?.message?.includes('fetch failed')) {
 throw new Error(`Network error: Unable to fetch orders for user ${userId}.`);
    }
    throw ordersError;
  }

  const orders: Order[] = await Promise.all(ordersData.map(async (orderDto: any) => {
    const { data: itemsData, error: itemsError } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderDto.order_id);

    if (itemsError) {
      console.error(`Error fetching items for order ${orderDto.order_id} (user ${userId}):`, itemsError);
 if((itemsError as any)?.message?.includes('fetch failed')) {
        console.warn(`Network error fetching items for order ${orderDto.order_id} (user ${userId}). Order items may be incomplete.`);
      }
    }

    return {
      orderId: orderDto.order_id,
      orderNumber: orderDto.order_number,
      userId: orderDto.user_id,
      customerNameSnapshot: orderDto.customer_name_snapshot,
      customerWhatsappSnapshot: orderDto.customer_whatsapp_snapshot,
      cycleId: orderDto.cycle_id,
      items: itemsData?.map(itemDto => ({
        productId: itemDto.product_id,
        cycleProductId: itemDto.cycle_product_id,
        productName: itemDto.product_name,
        quantity: itemDto.quantity,
        priceAtPurchase: itemDto.price_at_purchase,
        lineItemTotal: itemDto.line_item_total,
      })) || [],
      orderTotalAmount: orderDto.order_total_amount,
      orderStatus: orderDto.order_status,
      paymentStatus: orderDto.payment_status,
      orderDate: orderDto.order_date,
      adminNotes: orderDto.admin_notes,
    } as Order;
  }));
  
  return orders;
}


export async function updateOrderStatus(
  orderId: string,
  newOrderStatus: Order['orderStatus'],
  newPaymentStatus?: Order['paymentStatus'] 
): Promise<Order> {
  console.log(`updateOrderStatus called for orderId: ${orderId}, newOrderStatus: ${newOrderStatus}, newPaymentStatus: ${newPaymentStatus} (to Supabase)`);
  
  const updatePayload: { order_status: string; payment_status?: string } = {
    order_status: newOrderStatus,
  };

  if (newPaymentStatus) {
    updatePayload.payment_status = newPaymentStatus;
  } else {
    // Auto-update payment status based on order status if not explicitly provided
    if (newOrderStatus === "Payment Confirmed" || newOrderStatus === "Completed") {
      const { data: currentOrder, error: fetchError } = await supabase.from('orders').select('payment_status').eq('order_id', orderId).single(); // Use single() since we expect one order
      if (fetchError && (fetchError as any)?.message?.includes('fetch failed')) {
          throw new Error(`Network error: Unable to fetch current order status for ${orderId}. Status update aborted.`);
      }
      if (currentOrder && currentOrder.payment_status === "Unpaid") {
        updatePayload.payment_status = "Paid";
      }
    }
  }


  const { data: updatedOrderData, error } = await supabase
    .from('orders')
    .update(updatePayload)
    .eq('order_id', orderId)
    .select()
    .single();

  if (error || !updatedOrderData) {
    console.error(`Error updating order status for ${orderId}:`, error);
    if((error as any)?.message?.includes('fetch failed')) {
 throw new Error(`Network error: Failed to update order status for ${orderId}.`);
    }
    throw new Error(`Failed to update order status for ${orderId}.`);
  }

  // Fetch items separately to reconstruct the full Order object to return
  const { data: itemsData, error: itemsError } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', updatedOrderData.order_id);
  
  if (itemsError) {
      console.error(`Error fetching items for updated order ${updatedOrderData.order_id}:`, itemsError); // Log this error, but the main order update is successful
 if ((itemsError as any)?.message?.includes('fetch failed')) {
        console.warn(`Network error fetching items for updated order ${updatedOrderData.order_id}. Order details might be incomplete.`);
      }
      // Decide if this is critical, for now, proceed but log
  }

  return {
      orderId: updatedOrderData.order_id,
      orderNumber: updatedOrderData.order_number,
      userId: updatedOrderData.user_id,
      customerNameSnapshot: updatedOrderData.customer_name_snapshot,
      customerWhatsappSnapshot: updatedOrderData.customer_whatsapp_snapshot,
      cycleId: updatedOrderData.cycle_id,
      items: itemsData?.map(itemDto => ({
        productId: itemDto.product_id,
        cycleProductId: itemDto.cycle_product_id,
        productName: itemDto.product_name,
        quantity: itemDto.quantity,
        priceAtPurchase: itemDto.price_at_purchase,
        lineItemTotal: itemDto.line_item_total,
      })) || [],
      orderTotalAmount: updatedOrderData.order_total_amount,
      orderStatus: updatedOrderData.order_status,
      paymentStatus: updatedOrderData.payment_status,
      orderDate: updatedOrderData.order_date,
      adminNotes: updatedOrderData.admin_notes,
  } as Order;
}


export async function fetchActivePurchaseCycleTitle(): Promise<string> {
    console.log('fetchActivePurchaseCycleTitle called (from Supabase)');
    const { data, error } = await supabase
        .from('purchase_cycles')
        .select('name')
        .eq('is_active', true)
        .single();

    if (error || !data) {
        console.warn('No active purchase cycle found or error fetching title:', error);
        if((error as any)?.message?.includes('fetch failed')) {
 console.warn('Network error fetching active cycle title. Using default.');
        }
        return "Temporada Atual"; // Default title
    }
    return data.name;
}

export async function fetchActivePurchaseCycleProducts(): Promise<DisplayableProduct[]> {
  console.log('fetchActivePurchaseCycleProducts called (from Supabase)');
  // This is the same as fetchDisplayableProducts, as it filters by active cycle
  return fetchDisplayableProducts();
}


export async function fetchProductAvailabilityInActiveCycle(productId: string): Promise<boolean> {
    console.log(`fetchProductAvailabilityInActiveCycle called for productId: ${productId} (from Supabase)`);
    
    const { data: activeCycle, error: cycleError } = await supabase
        .from('purchase_cycles')
        .select('cycle_id')
        .eq('is_active', true)
        .single();

    if (cycleError || !activeCycle) {
        console.warn("No active cycle to check product availability or error fetching cycle:", cycleError); // Log a warning, don't throw if it's just no active cycle
        if ((cycleError as any)?.message?.includes('fetch failed')) {
 console.warn('Network error fetching active cycle for availability check.');
        }
        return false;
    }

    const { data: cycleProduct, error: cpError } = await supabase
        .from('cycle_products')
        .select('is_available_in_cycle')
        .eq('cycle_id', activeCycle.cycle_id)
        .eq('product_id', productId)
        .single();
    
    if (cpError && cpError.code !== 'PGRST116') { // PGRST116 = no rows found, which is fine
        console.warn(`Error fetching cycle product for product ${productId} in active cycle:`, cpError); // Log warning for other errors
 if ((cpError as any)?.message?.includes('fetch failed')) {
           console.warn(`Network error fetching cycle product for ${productId} in active cycle.`);
        }
        return false;
    }
    
    return cycleProduct ? cycleProduct.is_available_in_cycle : false;
}

export async function setProductAvailabilityInActiveCycle(productId: string, isAvailable: boolean): Promise<void> {
    console.log(`setProductAvailabilityInActiveCycle called for productId: ${productId}, isAvailable: ${isAvailable} (to Supabase)`);
    
    const { data: activeCycle, error: cycleError } = await supabase
        .from('purchase_cycles')
        .select('cycle_id')
        .eq('is_active', true)
        .single();

    if (cycleError || !activeCycle) {
        console.error("No active cycle to set product availability or error fetching cycle:", cycleError); // This is a critical error for setting availability
        if ((cycleError as any)?.message?.includes('fetch failed')) {
 throw new Error("Network error: Unable to find active purchase cycle to set product availability.");
        }
        throw new Error("No active purchase cycle found.");
    }

    // Check if cycle_product entry exists
    const { data: existingCycleProduct, error: fetchCpError } = await supabase
        .from('cycle_products')
        .select('cycle_product_id, product_name_snapshot, price_in_cycle, display_image_url') // select fields needed for potential insert
        .eq('cycle_id', activeCycle.cycle_id)
        .eq('product_id', productId)
        .single();

    if (fetchCpError && fetchCpError.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error(`Error checking existing cycle_product for product ${productId}:`, fetchCpError); // Log and throw for other errors during fetch
 if ((fetchCpError as any)?.message?.includes('fetch failed')) {
           throw new Error(`Network error: Unable to check existing cycle product for ${productId}.`);
        }
        throw fetchCpError;
    }

    if (existingCycleProduct) {
        // Update existing cycle_product
        const { error: updateError } = await supabase
            .from('cycle_products')
            .update({ is_available_in_cycle: isAvailable })
            .eq('cycle_product_id', existingCycleProduct.cycle_product_id);
        if (updateError) {
            console.error(`Error updating availability for cycle_product ${existingCycleProduct.cycle_product_id}:`, updateError); // Log and throw for update errors
 if ((updateError as any)?.message?.includes('fetch failed')) {
               throw new Error(`Network error: Unable to update availability for cycle product ${existingCycleProduct.cycle_product_id}.`);
            }
            throw updateError;
        }
    } else if (isAvailable) {
        // Create new cycle_product because it's being made available and doesn't exist
        const { data: masterProduct, error: masterProductError } = await supabase
            .from('products')
            .select('name, image_urls')
            .eq('product_id', productId)
            .single();

        if (masterProductError || !masterProduct) {
            console.error(`Master product ${productId} not found to create new cycle_product:`, masterProductError); // Critical if master product is missing for a new entry
 if ((masterProductError as any)?.message?.includes('fetch failed')) {
               throw new Error(`Network error: Unable to fetch master product ${productId} for new cycle product.`);
            }
            throw new Error(`Master product ${productId} not found.`);
        }
        
        const { error: insertError } = await supabase
            .from('cycle_products')
            .insert({
                cycle_id: activeCycle.cycle_id,
                product_id: productId,
                product_name_snapshot: masterProduct.name,
                price_in_cycle: 0, // Default price, admin should set this via ProductForm or another interface
                is_available_in_cycle: true,
                display_image_url: masterProduct.image_urls?.[0] || 'https://placehold.co/400x300.png?text=Produto',
            });
        if (insertError) {
            console.error(`Error inserting new cycle_product for product ${productId}:`, insertError); // Log and throw for insert errors
 if ((insertError as any)?.message?.includes('fetch failed')) {
               throw new Error(`Network error: Unable to insert new cycle product for ${productId}.`);
            }
            throw insertError;
        }
        console.log(`Created new cycle_product for ${masterProduct.name} in active cycle as it was made available.`);
    }
    // If it doesn't exist and isAvailable is false, do nothing.
}


interface AdminDashboardMetrics {
  activeCycle: PurchaseCycle | null;
  pendingOrdersCount: number;
  totalSalesActiveCycle: number;
}

export async function fetchActiveCycleMetrics(): Promise<AdminDashboardMetrics> {
  console.log('fetchActiveCycleMetrics called (from Supabase)');
  
  const { data: activeCycleData, error: cycleError } = await supabase
    .from('purchase_cycles')
    .select('*')
    .eq('is_active', true)
    .single();

  let activeCycle: PurchaseCycle | null = null;
  if (!cycleError && activeCycleData) {
    activeCycle = {
        cycleId: activeCycleData.cycle_id,
        name: activeCycleData.name,
        startDate: activeCycleData.start_date,
        endDate: activeCycleData.end_date,
        isActive: activeCycleData.is_active,
        createdAt: activeCycleData.created_at,
    };
  } else if (cycleError && cycleError.code !== 'PGRST116') { // PGRST116 means no rows found
    console.warn("Error fetching active cycle for metrics:", cycleError); // Log warning for other errors
    if ((cycleError as any)?.message?.includes('fetch failed')) {
 // Network error, metrics will be default/zero
    }
  }


  let pendingOrdersCount = 0;
  let totalSalesActiveCycle = 0;

  if (activeCycle) {
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('order_status, payment_status, order_total_amount')
      .eq('cycle_id', activeCycle.cycleId);

    if (ordersError) {
      console.warn("Error fetching orders for active cycle metrics:", ordersError); // Log warning, don't block metrics if order fetch fails
 if ((ordersError as any)?.message?.includes('fetch failed')) {
        // Network error, metrics will be default/zero
      }
    } else if (ordersData) {
      pendingOrdersCount = ordersData.filter(
        (o: any) => o.order_status === "Pending Payment" || o.order_status === "Preparing" || o.order_status === "Payment Confirmed"
      ).length;
      totalSalesActiveCycle = ordersData
        .filter((o: any) => o.payment_status === "Paid")
        .reduce((sum: number, o: any) => sum + o.order_total_amount, 0);
    }
  }

  return {
    activeCycle,
    pendingOrdersCount,
    totalSalesActiveCycle,
  };
}



export async function fetchAdminUsers(): Promise<User[]> {
  console.log('fetchAdminUsers called (from Supabase)');
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });
    // .eq('role', 'customer'); // If you only want customers, uncomment this

  if (error) {
    console.error("Error fetching admin users (profiles):", error);
    if ((error as any)?.message?.includes('fetch failed')) {
 throw new Error("Network error: Unable to fetch admin users.");
    }
    throw error;
  }

  return data.map(profile => ({
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
  })) as User[];
}

