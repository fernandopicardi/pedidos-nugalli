
import type { Product, PurchaseCycle, Order, CartItem, CycleProduct, User, DisplayableProduct, OrderItem } from '@/types';
import { supabase } from './supabaseClient';

// --- Cart Update Listener System ---
let cartUpdateListeners: Array<(cartItems: CartItem[]) => void> = [];

async function notifyCartUpdateListeners() {
  const currentCart = await fetchCartItems();
  for (const listener of cartUpdateListeners) {
    try {
      listener(currentCart);
    } catch (e) {
      console.error("Error in cart update listener:", e);
    }
  }
}

export function subscribeToCartUpdates(callback: (cartItems: CartItem[]) => void): () => void {
  cartUpdateListeners.push(callback);
  fetchCartItems().then(callback).catch(err => console.error("Error fetching cart items on subscribe:", err));
  return () => {
    cartUpdateListeners = cartUpdateListeners.filter(cb => cb !== callback);
  };
}

// AUTH - Supabase Integration
export async function signInWithEmail(email: string, password: string): Promise<{ user: User | null, error: { message: string } | null }> {
  console.log('signInWithEmail called with:', email);
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    if (error.message === 'Invalid login credentials') {
      // Do not log this specific common error to the console.
      // The calling function (login-form.tsx) will show a toast to the user.
    } else if (error.message === 'Failed to fetch' || error.message.includes('fetch failed')) {
      console.error(`Network error during sign in for ${email}:`, error.message);
      return { user: null, error: { message: 'Network error: Unable to connect to authentication service. Please check your internet connection and ensure the Supabase service is reachable and configured correctly (URL/Key).' } };
    } else {
      // Log other, unexpected Supabase errors
      console.error(`Supabase sign in error for ${email}:`, error);
    }
    return { user: null, error: { message: error.message } };
  }

  if (data.user) {
       const { data: userProfile, error: profileError } = await supabase
           .from('profiles')
           .select('*')
           .eq('id', data.user.id)
           .single();

       if (profileError) {
           console.error('Error fetching user profile after sign in:', profileError);
           const basicUser: User = {
               userId: data.user.id,
               email: data.user.email || 'N/A',
               displayName: data.user.user_metadata?.displayName || data.user.email?.split('@')[0] || 'User',
               whatsapp: data.user.user_metadata?.whatsapp || '',
               role: (data.user.user_metadata?.role as 'customer' | 'admin') || 'customer',
               createdAt: data.user.created_at || new Date().toISOString(),
               addressStreet: data.user.user_metadata?.addressStreet || '',
               addressNumber: data.user.user_metadata?.addressNumber || '',
               addressComplement: data.user.user_metadata?.addressComplement || '',
               addressNeighborhood: data.user.user_metadata?.addressNeighborhood || '',
               addressCity: data.user.user_metadata?.addressCity || '',
               addressState: data.user.user_metadata?.addressState || '',
               addressZip: data.user.user_metadata?.addressZip || '',
           };
           return { user: basicUser, error: { message: `Sign in successful, but failed to load full profile: ${profileError.message}` } };
       }
        if (!userProfile) { 
            console.warn('User profile not found after sign in for user ID (no error, but no data):', data.user.id);
             const basicUser: User = { 
               userId: data.user.id,
               email: data.user.email || 'N/A',
               displayName: data.user.user_metadata?.displayName || data.user.email?.split('@')[0] || 'User',
               whatsapp: data.user.user_metadata?.whatsapp || '',
               role: (data.user.user_metadata?.role as 'customer' | 'admin') || 'customer',
               createdAt: data.user.created_at || new Date().toISOString(),
               addressStreet: '', addressNumber: '', addressComplement: '', addressNeighborhood: '', addressCity: '', addressState: '', addressZip: '',
           };
           return { user: basicUser, error: { message: `Sign in successful, but profile data was unexpectedly missing.` } };
        }

       const fullUser: User = {
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
            localStorage.setItem('currentUser', JSON.stringify(fullUser));
        }
       return { user: fullUser, error: null };
  }
  return { user: null, error: { message: 'Unknown sign in error: No user data returned after sign in.' } };
}

export async function signUpWithEmail(email: string, password: string, displayName?: string, whatsapp?: string): Promise<{ user: User | null, error: { message: string } | null }> {
  console.log('signUpWithEmail called with:', email, displayName, whatsapp);
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
        data: { 
            displayName: displayName || email.split('@')[0],
            whatsapp: whatsapp || '',
            role: 'customer' 
        }
    }
  });

  if (authError) {
    console.error('Supabase sign up error:', authError);
    if (authError && typeof authError.message === 'string' && (authError.message === 'Failed to fetch' || authError.message.includes('fetch failed'))) {
      return { user: null, error: { message: 'Network error: Unable to connect to authentication service for sign up. Please check your internet connection and Supabase configuration.' } };
    }
    return { user: null, error: { message: authError.message } };
  }

 if (!authData.user) {
    return { user: null, error: {message: "User not created in Supabase auth table."}};
  }

  try {
    await new Promise(resolve => setTimeout(resolve, 500));

    const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

    if (profileError || !profileData) {
        console.warn('Error fetching profile after signup or profile not found (may be due to trigger delay or issue):', profileError);
        const basicUser: User = {
            userId: authData.user.id,
            email: authData.user.email || 'N/A',
            displayName: authData.user.user_metadata?.displayName || email.split('@')[0] || 'User',
            whatsapp: authData.user.user_metadata?.whatsapp || '',
            role: (authData.user.user_metadata?.role as 'customer' | 'admin') || 'customer',
            createdAt: authData.user.created_at || new Date().toISOString(),
            addressStreet: '', addressNumber: '', addressComplement: '', addressNeighborhood: '', addressCity: '', addressState: '', addressZip: '',
        };
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('currentUser', JSON.stringify(basicUser));
        }
        return { user: basicUser, error: null }; 
    }

    const fullUser: User = {
        userId: profileData.id,
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

  } catch (e: any) {
      console.error("Unexpected error in signUpWithEmail after profile fetch attempt:", e);
      const basicUser: User = {
         userId: authData.user.id,
         email: authData.user.email || 'N/A',
         displayName: authData.user.user_metadata?.displayName || email.split('@')[0] || 'User',
         whatsapp: authData.user.user_metadata?.whatsapp || '',
         role: (authData.user.user_metadata?.role as 'customer' | 'admin') || 'customer',
         createdAt: authData.user.created_at || new Date().toISOString(),
         addressStreet: '', addressNumber: '', addressComplement: '', addressNeighborhood: '', addressCity: '', addressState: '', addressZip: '',
     };
     return { user: basicUser, error: { message: `Signup successful, but an exception occurred during profile processing: ${e.message}` } };
  }
}


export async function signOut(): Promise<{ error: { message: string } | null }> {
  console.log('signOut called');
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Supabase sign out error:', error);
      if (error && typeof error.message === 'string' && (error.message === 'Failed to fetch' || error.message.includes('fetch failed'))) {
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem('currentUser'); 
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
    console.error('Unexpected error during signOut:', e);
    if (typeof localStorage !== 'undefined') { 
      localStorage.removeItem('currentUser');
    }
    return { error: { message: e.message || 'An unexpected error occurred during sign out.' } };
  }
}


export async function getCurrentUser(): Promise<User | null> {
  try {
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError) {
      if (authError.message.includes('Auth session missing')) {
      } else if (authError && typeof authError.message === 'string' && (authError.message === 'Failed to fetch' || authError.message.includes('fetch failed'))) {
        console.warn('Supabase authError in getCurrentUser (Network Error - will return null):', authError.message);
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
      return null;
    }

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
      const basicUser: User = {
        userId: authData.user.id,
        email: authData.user.email || 'N/A',
        displayName: authData.user.user_metadata?.displayName || authData.user.email?.split('@')[0] || 'User',
        whatsapp: authData.user.user_metadata?.whatsapp || '',
        role: (authData.user.user_metadata?.role as 'customer' | 'admin') || 'customer',
        createdAt: authData.user.created_at || new Date().toISOString(),
        addressStreet: authData.user.user_metadata?.addressStreet || '',
        addressNumber: authData.user.user_metadata?.addressNumber || '',
        addressComplement: authData.user.user_metadata?.addressComplement || '',
        addressNeighborhood: authData.user.user_metadata?.addressNeighborhood || '',
        addressCity: authData.user.user_metadata?.addressCity || '',
        addressState: authData.user.user_metadata?.addressState || '',
        addressZip: authData.user.user_metadata?.addressZip || '',
      };
      return basicUser;
    }
    
    if (!userProfile) { 
        console.warn('User profile not found for authenticated user ID (will return basic user info):', authData.user.id);
        if (typeof localStorage !== 'undefined') {
            localStorage.removeItem('currentUser');
        }
        const basicUser: User = { 
            userId: authData.user.id,
            email: authData.user.email || 'N/A',
            displayName: authData.user.user_metadata?.displayName || authData.user.email?.split('@')[0] || 'User',
            whatsapp: authData.user.user_metadata?.whatsapp || '',
            role: (authData.user.user_metadata?.role as 'customer' | 'admin') || 'customer',
            createdAt: authData.user.created_at || new Date().toISOString(),
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
    .from('profiles')
    .update(updatePayload)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating user details for user ' + userId + ':', error);
    if (error && typeof error.message === 'string' && (error.message === 'Failed to fetch' || error.message.includes('fetch failed'))) {
      return { user: null, error: { message: 'Network error: Unable to save user details. Please check your internet connection and Supabase configuration.' } };
    }
    return { user: null, error: { message: error.message } };
  }

   if (!updatedData) {
       return { user: null, error: { message: "User profile not found after update attempt." } };
   }

   const updatedUser: User = {
       userId: updatedData.id,
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
export async function fetchAdminProducts(): Promise<Product[]> {
  console.log('fetchAdminProducts called');
  const { data, error } = await supabase
    .from('Products')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching admin products:', error);
    if (error && typeof error.message === 'string' && (error.message === 'Failed to fetch' || error.message.includes('fetch failed'))) {
      throw new Error('Network error: Unable to fetch admin products. Please check connection and Supabase config.');
    }
    throw error;
  }
  return data.map(p => ({
    productId: p.product_id,
    name: p.name,
    description: p.description,
    imageUrls: p.image_urls,
    attributes: p.attributes,
    isSeasonal: p.is_seasonal,
    createdAt: p.created_at,
    updatedAt: p.updated_at
  })) as Product[];
}

export async function createProduct(productData: Omit<Product, 'productId' | 'createdAt' | 'updatedAt'>): Promise<Product> {
  console.log('createProduct called with:', productData);
  const { data, error } = await supabase
    .from('Products')
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
    if (error && typeof error.message === 'string' && (error.message === 'Failed to fetch' || error.message.includes('fetch failed'))) {
      throw new Error('Network error: Unable to create product. Please check connection and Supabase config.');
    }
    throw error;
  }
  return {
    productId: data.product_id,
    name: data.name,
    description: data.description,
    imageUrls: data.image_urls,
    attributes: data.attributes,
    isSeasonal: data.is_seasonal,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  } as Product;
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
    .from('Products')
    .update(updatePayload)
    .eq('product_id', productId)
    .select()
    .single();

  if (error) {
    console.error('Error updating product:', error);
    if (error && typeof error.message === 'string' && (error.message === 'Failed to fetch' || error.message.includes('fetch failed'))) {
      throw new Error('Network error: Unable to update product. Please check connection and Supabase config.');
    }
    throw error;
  }
  if (!data) {
     throw new Error("Product not found after update");
  }
  return {
    productId: data.product_id,
    name: data.name,
    description: data.description,
    imageUrls: data.image_urls,
    attributes: data.attributes,
    isSeasonal: data.is_seasonal,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  } as Product;
}

export async function deleteProduct(productId: string): Promise<void> {
  console.log('deleteProduct called for ID:', productId);
  const { error } = await supabase
    .from('Products')
    .delete()
    .eq('product_id', productId);

  if (error) {
    console.error('Error deleting product:', error);
    if (error && typeof error.message === 'string' && (error.message === 'Failed to fetch' || error.message.includes('fetch failed'))) {
      throw new Error('Network error: Unable to delete product. Please check connection and Supabase config.');
    }
    throw error;
  }
}

// PURCHASE CYCLES - For Admin CRUD
export async function fetchPurchaseCycles(): Promise<PurchaseCycle[]> {
  console.log('fetchPurchaseCycles called');
  const { data, error } = await supabase
    .from('Purchase Cycles')
    .select('*')
    .order('start_date', { ascending: false });

  if (error) {
    console.error('Error fetching purchase cycles:', error);
    if (error && typeof error.message === 'string' && (error.message === 'Failed to fetch' || error.message.includes('fetch failed'))) {
      throw new Error('Network error: Unable to fetch purchase cycles. Please check connection and Supabase config.');
    }
    throw error;
  }
  return data.map(pc => ({
    cycleId: pc.cycle_id,
    name: pc.name,
    startDate: pc.start_date,
    endDate: pc.end_date,
    isActive: pc.is_active,
    createdAt: pc.created_at
  })) as PurchaseCycle[];
}

export async function createPurchaseCycle(cycleData: Omit<PurchaseCycle, 'cycleId' | 'createdAt'>): Promise<PurchaseCycle> {
  console.log('createPurchaseCycle called with:', cycleData);
  if (cycleData.isActive) {
      const { error: updateError } = await supabase
          .from('Purchase Cycles')
          .update({ is_active: false })
          .eq('is_active', true);
      if (updateError) {
          console.error('Error deactivating previous active cycles:', updateError);
           if (updateError && typeof updateError.message === 'string' && (updateError.message === 'Failed to fetch' || updateError.message.includes('fetch failed'))) {
             console.warn('Network error while deactivating other cycles. Proceeding with new cycle creation.');
           } else {
             console.warn('Error deactivating other cycles. Details:', updateError.message);
           }
      }
  }

  const { data, error } = await supabase
    .from('Purchase Cycles')
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
    if (error && typeof error.message === 'string' && (error.message === 'Failed to fetch' || error.message.includes('fetch failed'))) {
      throw new Error('Network error: Unable to create purchase cycle. Please check connection and Supabase config.');
    }
    throw error;
  }
  return {
    cycleId: data.cycle_id,
    name: data.name,
    startDate: data.start_date,
    endDate: data.end_date,
    isActive: data.is_active,
    createdAt: data.created_at
  } as PurchaseCycle;
}

export async function updatePurchaseCycle(cycleId: string, cycleData: Partial<Omit<PurchaseCycle, 'cycleId' | 'createdAt'>>): Promise<PurchaseCycle> {
  console.log('updatePurchaseCycle called for ID', cycleId, 'with:', cycleData);
  if (cycleData.isActive === true) { 
      const { error: updateError } = await supabase
          .from('Purchase Cycles')
          .update({ is_active: false })
          .eq('is_active', true)
          .neq('cycle_id', cycleId); 
      if (updateError) {
          console.error('Error deactivating other active cycles:', updateError);
          if (updateError && typeof updateError.message === 'string' && (updateError.message === 'Failed to fetch' || updateError.message.includes('fetch failed'))) {
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
    .from('Purchase Cycles')
    .update(updatePayload)
    .eq('cycle_id', cycleId)
    .select()
    .single();

  if (error) {
    console.error('Error updating purchase cycle:', error);
    if (error && typeof error.message === 'string' && (error.message === 'Failed to fetch' || error.message.includes('fetch failed'))) {
      throw new Error('Network error: Unable to update purchase cycle. Please check connection and Supabase config.');
    }
    throw error;
  }
  if (!data) {
     throw new Error("PurchaseCycle not found after update");
  }
  return {
    cycleId: data.cycle_id,
    name: data.name,
    startDate: data.start_date,
    endDate: data.end_date,
    isActive: data.is_active,
    createdAt: data.created_at
  } as PurchaseCycle;
}

export async function deletePurchaseCycle(cycleId: string): Promise<void> {
  console.log('deletePurchaseCycle called for ID:', cycleId);
  const { error } = await supabase
    .from('Purchase Cycles')
    .delete()
    .eq('cycle_id', cycleId);

  if (error) {
    console.error('Error deleting purchase cycle:', error);
    if (error && typeof error.message === 'string' && (error.message === 'Failed to fetch' || error.message.includes('fetch failed'))) {
      throw new Error('Network error: Unable to delete purchase cycle. Please check connection and Supabase config.');
    }
    throw error;
  }
}

// CYCLE PRODUCTS - For Admin CRUD and Customer Display
export async function fetchCycleProducts(cycleId: string): Promise<CycleProduct[]> {
  console.log('fetchCycleProducts called for cycle ID:', cycleId);
  const { data, error } = await supabase
    .from('Cycle Products')
    .select('*, Products(product_id, name, description, image_urls, attributes, is_seasonal)') 
    .eq('cycle_id', cycleId);

  if (error) {
    console.error('Error fetching cycle products for cycle ' + cycleId + ':', error);
    if (error && typeof error.message === 'string' && (error.message === 'Failed to fetch' || error.message.includes('fetch failed'))) {
      throw new Error('Network error: Unable to fetch cycle products for cycle ' + cycleId + '. Please check connection and Supabase config.');
    }
    throw error;
  }
  return data.map(cp => ({
      cycleProductId: cp.cycle_product_id,
      cycleId: cp.cycle_id,
      productId: cp.product_id,
      productNameSnapshot: cp.product_name_snapshot || cp.Products?.name || 'N/A',
      priceInCycle: cp.price_in_cycle,
      isAvailableInCycle: cp.is_available_in_cycle,
      displayImageUrl: cp.display_image_url || cp.Products?.image_urls?.[0] || 'https://placehold.co/400x300.png?text=Produto',
      createdAt: cp.created_at,
      updatedAt: cp.updated_at
  })) as CycleProduct[];
}

export async function createCycleProduct(cycleProductData: Omit<CycleProduct, 'cycleProductId' | 'createdAt' | 'updatedAt'>): Promise<CycleProduct> {
  console.log('createCycleProduct called with:', cycleProductData);
  const { data, error } = await supabase
    .from('Cycle Products')
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
    if (error && typeof error.message === 'string' && (error.message === 'Failed to fetch' || error.message.includes('fetch failed'))) {
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
    .from('Cycle Products')
    .update(updatePayload)
    .eq('cycle_product_id', cycleProductId)
    .select()
    .single();

  if (error) {
    console.error('Error updating cycle product:', error);
     if (error && typeof error.message === 'string' && (error.message === 'Failed to fetch' || error.message.includes('fetch failed'))) {
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
    .from('Cycle Products')
    .delete()
    .eq('cycle_product_id', cycleProductId);

  if (error) {
    console.error('Error deleting cycle product:', error);
    if (error && typeof error.message === 'string' && (error.message === 'Failed to fetch' || error.message.includes('fetch failed'))) {
      throw new Error('Network error: Unable to delete cycle product. Please check connection and Supabase config.');
    }
    throw error;
  }
}

export async function fetchDisplayableProducts(): Promise<DisplayableProduct[]> {
  console.log('fetchDisplayableProducts called');
  const { data, error } = await supabase
    .from('Cycle Products')
    .select(`
      cycle_product_id,
      cycle_id,
      product_id,
      product_name_snapshot,
      price_in_cycle,
      is_available_in_cycle,
      display_image_url,
      Products ( 
        description,
        attributes,
        image_urls,
        is_seasonal 
      )
    `)
    .eq('is_available_in_cycle', true)
    .filter('cycle_id', 'in', '(select cycle_id from "Purchase Cycles" where is_active = true)');

  if (error) {
    console.error('Error fetching displayable products. Raw error object:', error);
    console.error('Error details - Code:', error.code, 'Message:', error.message, 'Details:', error.details, 'Hint:', error.hint);
    if (error && typeof error.message === 'string' && (error.message === 'Failed to fetch' || error.message.includes('fetch failed'))) {
      throw new Error('Network error: Unable to fetch displayable products. Please check connection and Supabase config.');
    }
    throw error; 
  }

  const displayableProducts: DisplayableProduct[] = data.map((item: any) => ({
    cycleProductId: item.cycle_product_id,
    cycleId: item.cycle_id,
    productId: item.product_id,
    name: item.product_name_snapshot || item.Products?.name || 'Unknown Product',
    description: item.Products?.description || '',
    price: item.price_in_cycle || 0,
    isAvailable: item.is_available_in_cycle, 
    imageUrl: item.display_image_url || item.Products?.image_urls?.[0] || 'https://placehold.co/400x300.png?text=Produto',
    attributes: item.Products?.attributes || {},
    isSeasonal: item.Products?.is_seasonal || false, 
  }));
  return displayableProducts;
}

export async function fetchDisplayableProductById(cycleProductId: string): Promise<DisplayableProduct | null> {
  console.log('fetchDisplayableProductById called for ID:', cycleProductId);
  const { data, error } = await supabase
    .from('Cycle Products')
    .select(`
      cycle_product_id,
      cycle_id,
      product_id,
      product_name_snapshot,
      price_in_cycle,
      is_available_in_cycle,
      display_image_url,
      Products ( 
        description,
        attributes,
        image_urls,
        is_seasonal
      )
    `)
    .eq('cycle_product_id', cycleProductId)
    .eq('is_available_in_cycle', true) 
    .filter('cycle_id', 'in', '(select cycle_id from "Purchase Cycles" where is_active = true)') 
    .single();

  if (error && error.code !== 'PGRST116') { 
    console.error('Error fetching displayable product ' + cycleProductId + ':', error);
     if (error && typeof error.message === 'string' && (error.message === 'Failed to fetch' || error.message.includes('fetch failed'))) {
      throw new Error('Network error: Unable to fetch displayable product ' + cycleProductId + '. Please check connection and Supabase config.');
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
    name: data.product_name_snapshot || data.Products?.name || 'Unknown Product',
    description: data.Products?.description || '',
    price: data.price_in_cycle || 0,
    isAvailable: data.is_available_in_cycle,
    imageUrl: data.display_image_url || data.Products?.image_urls?.[0] || 'https://placehold.co/400x300.png?text=Produto',
    attributes: data.Products?.attributes || {},
    isSeasonal: data.Products?.is_seasonal || false,
  };
  return displayableProduct;
}

// CART
export async function fetchCartItems(): Promise<CartItem[]> {
  console.log('fetchCartItems called (from Supabase)');
  const user = await getCurrentUser();
  if (!user) {
    console.warn('fetchCartItems called without a logged-in user.');
    return [];
  }

  const { data, error } = await supabase
    .from('Cart Items')
    .select(`
      cart_item_id,
      cycle_product_id,
      quantity,
      cycle_products:cycle_product_id (
        product_id,
        product_name_snapshot,
        price_in_cycle,
        display_image_url,
        Products ( description ) 
      )
    `)
    .eq('user_id', user.userId);

  if (error) {
    console.error('Error fetching cart items:', error);
    if(error && typeof error.message === 'string' && (error.message.includes('fetch failed'))) {
      throw new Error('Network error: Unable to fetch cart items. Please check connection and Supabase config.');
    }
    throw error;
  }

  const cartItems: CartItem[] = data.map((item: any) => ({
    cartItemId: item.cart_item_id, 
    cycleProductId: item.cycle_product_id,
    productId: item.cycle_products?.product_id || '',
    name: item.cycle_products?.product_name_snapshot || 'Unknown Product',
    price: item.cycle_products?.price_in_cycle || 0,
    imageUrl: item.cycle_products?.display_image_url || 'https://placehold.co/400x300.png?text=Produto',
    quantity: item.quantity,
    description: item.cycle_products?.Products?.description || '',
  }));
  return cartItems;
}

export async function addToCart(displayableProduct: DisplayableProduct, quantity: number): Promise<void> {
  console.log('addToCart called for product:', displayableProduct.name, 'quantity:', quantity, '(to Supabase)');
  const user = await getCurrentUser();
  if (!user) {
    console.error('addToCart called without a logged-in user.');
    throw new Error("User not logged in. Cannot add to cart.");
  }

  const { data: existingItems, error: fetchError } = await supabase
    .from('Cart Items')
    .select('cart_item_id, quantity')
    .eq('user_id', user.userId)
    .eq('cycle_product_id', displayableProduct.cycleProductId);

  if (fetchError) {
    console.error('Error checking existing cart item:', fetchError);
    if(fetchError && typeof fetchError.message === 'string' && (fetchError.message.includes('fetch failed'))) {
      throw new Error('Network error: Unable to check cart status. Please try again.');
    }
    throw fetchError;
  }

  if (existingItems && existingItems.length > 0) {
    const existingItem = existingItems[0];
    const newQuantity = existingItem.quantity + quantity;
    const { error: updateError } = await supabase
      .from('Cart Items')
      .update({ quantity: newQuantity })
      .eq('cart_item_id', existingItem.cart_item_id);

    if (updateError) {
      console.error('Error updating cart item quantity:', updateError);
       if(updateError && typeof updateError.message === 'string' && (updateError.message.includes('fetch failed'))) {
         throw new Error('Network error: Unable to update cart item quantity. Please try again.');
       }
      throw updateError;
    }
  } else {
    const { error: insertError } = await supabase
      .from('Cart Items')
      .insert({
        user_id: user.userId,
        cycle_product_id: displayableProduct.cycleProductId,
        quantity: quantity,
      });

    if (insertError) {
      console.error('Error adding new item to cart:', insertError);
      if(insertError && typeof insertError.message === 'string' && (insertError.message.includes('fetch failed'))) {
        throw new Error('Network error: Unable to add item to cart. Please try again.');
      }
      throw insertError;
    }
  }
  await notifyCartUpdateListeners();
}

export async function updateCartItemQuantity(cartItemId: string, newQuantity: number): Promise<void> {
  console.log('updateCartItemQuantity called for cartItemId:', cartItemId, 'newQuantity:', newQuantity, '(to Supabase)');
  const user = await getCurrentUser();
  if (!user) {
      console.warn('updateCartItemQuantity called without a logged-in user.');
      throw new Error("User not logged in. Cannot update cart.");
  }

  if (newQuantity <= 0) {
    await removeFromCart(cartItemId); 
    return;
  }

  const { error } = await supabase
    .from('Cart Items')
    .update({ quantity: newQuantity })
    .eq('cart_item_id', cartItemId) 
    .eq('user_id', user.userId);

  if (error) {
    console.error('Error updating cart item quantity for ' + cartItemId + ':', error);
    if(error && typeof error.message === 'string' && (error.message.includes('fetch failed'))) {
      throw new Error('Network error: Unable to update cart item quantity. Please try again.');
    } else {
      throw error;
    }
  }
  await notifyCartUpdateListeners();
}

export async function removeFromCart(cartItemId: string): Promise<void> { 
  console.log('removeFromCart called for cartItemId:', cartItemId, '(to Supabase)');
  const user = await getCurrentUser();
  if (!user) {
      console.warn('removeFromCart called without a logged-in user.');
      throw new Error("User not logged in. Cannot remove from cart.");
  }

  const { error } = await supabase
    .from('Cart Items')
    .delete()
    .eq('cart_item_id', cartItemId) 
    .eq('user_id', user.userId);

  if (error) {
    console.error('Error removing cart item ' + cartItemId + ':', error);
    if(error && typeof error.message === 'string' && (error.message.includes('fetch failed'))) {
      throw new Error('Network error: Unable to remove item from cart. Please try again.');
    } else {
      throw error;
    }
  }
  await notifyCartUpdateListeners();
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

  const { data: activeCycleData, error: cycleError } = await supabase
    .from('Purchase Cycles')
    .select('cycle_id')
    .eq('is_active', true)
    .single();

  if (cycleError || !activeCycleData) {
    console.error('Error fetching active cycle or no active cycle found:', cycleError);
    if(cycleError && typeof cycleError.message === 'string' && (cycleError.message.includes('fetch failed'))) {
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

  const { data: lastOrder, error: lastOrderError } = await supabase
    .from('Orders')
    .select('order_number')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (lastOrderError && lastOrderError.code !== 'PGRST116' && lastOrderError.message.includes('fetch failed')) { 
    console.error("Network error fetching last order number:", lastOrderError);
    throw new Error("Network error: Unable to generate order number. Cannot process checkout.");
  } else if (lastOrderError && lastOrderError.code !== 'PGRST116') {
    console.error("Error fetching last order number (non-network):", lastOrderError);
  }


  let newOrderNumber = `ORD${new Date().getFullYear()}001`;
  if (lastOrder && lastOrder.order_number) {
    const currentYear = new Date().getFullYear().toString();
    const lastOrderYear = lastOrder.order_number.substring(3, 7);
    let lastNumPart = parseInt(lastOrder.order_number.substring(7));

    if (lastOrderYear === currentYear) {
        newOrderNumber = `ORD${currentYear}${(lastNumPart + 1).toString().padStart(3, '0')}`;
    } else {
        newOrderNumber = `ORD${currentYear}001`; 
    }
  }


  const newOrderPayload = {
    order_number: newOrderNumber,
    user_id: currentUser.userId,
    customer_name_snapshot: currentUser.displayName,
    customer_whatsapp_snapshot: currentUser.whatsapp,
    cycle_id: activeCycleId,
    order_total_amount: orderTotalAmount,
    order_status: "Pending Payment" as Order['orderStatus'],
    payment_status: "Unpaid" as Order['paymentStatus'],
    order_date: new Date().toISOString(),
  };

  const { data: createdOrderData, error: createOrderError } = await supabase
    .from('Orders')
    .insert(newOrderPayload)
    .select()
    .single();

  if (createOrderError || !createdOrderData) {
      console.error("Error creating order in database:", createOrderError);
      if(createOrderError && typeof createOrderError.message === 'string' && (createOrderError.message.includes('fetch failed'))) {
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
    .from('Order Items')
    .insert(orderItemsPayload);

  if (createOrderItemsError) {
      console.error("Error creating order items in database:", createOrderItemsError);
      await supabase.from('Orders').delete().eq('order_id', createdOrderData.order_id);
      if(createOrderItemsError && typeof createOrderItemsError.message === 'string' && (createOrderItemsError.message.includes('fetch failed'))) {
          throw new Error("Network error: Failed to save order items. Order has been cancelled.");
      }
      throw new Error("Failed to create order items in database. Order has been cancelled.");
  }

  const { error: clearCartError } = await supabase
    .from('Cart Items')
    .delete()
    .eq('user_id', currentUser.userId);

  if (clearCartError) {
      console.error("Error clearing user cart after checkout:", clearCartError);
      if (clearCartError && typeof clearCartError.message === 'string' && (clearCartError.message.includes('fetch failed'))) {
         console.warn("Network error: Failed to clear user cart after checkout. Manual cleanup may be needed.");
      }
  }
  await notifyCartUpdateListeners(); 

  return {
      orderId: createdOrderData.order_id,
      orderNumber: createdOrderData.order_number,
      userId: createdOrderData.user_id,
      customerNameSnapshot: createdOrderData.customer_name_snapshot,
      customerWhatsappSnapshot: createdOrderData.customer_whatsapp_snapshot,
      cycleId: createdOrderData.cycle_id,
      items: orderItems,
      orderTotalAmount: createdOrderData.order_total_amount,
      orderStatus: createdOrderData.order_status as Order['orderStatus'],
      paymentStatus: createdOrderData.payment_status as Order['paymentStatus'],
      orderDate: createdOrderData.order_date,
      adminNotes: createdOrderData.admin_notes,
  } as Order;
}

export async function fetchAdminOrders(): Promise<Order[]> {
  console.log('fetchAdminOrders called (from Supabase)');
  const { data: ordersData, error: ordersError } = await supabase
    .from('Orders')
    .select('*, profiles(display_name)') 
    .order('order_date', { ascending: false });

  if (ordersError) {
    console.error("Error fetching admin orders:", ordersError);
    if(ordersError && typeof ordersError.message === 'string' && (ordersError.message.includes('fetch failed'))) {
      throw new Error("Network error: Unable to fetch admin orders.");
    }
    throw ordersError;
  }

  const orders: Order[] = await Promise.all(ordersData.map(async (orderDto: any) => {
    const { data: itemsData, error: itemsError } = await supabase
      .from('Order Items')
      .select('*')
      .eq('order_id', orderDto.order_id);

    if (itemsError) {
      console.error('Error fetching items for order ' + orderDto.order_id + ':', itemsError);
      if(itemsError && typeof itemsError.message === 'string' && (itemsError.message.includes('fetch failed'))) {
        console.warn('Network error fetching items for order ' + orderDto.order_id + '. Order items may be incomplete.');
      }
    }

    return {
      orderId: orderDto.order_id,
      orderNumber: orderDto.order_number,
      userId: orderDto.user_id,
      customerNameSnapshot: orderDto.profiles?.display_name || orderDto.customer_name_snapshot || 'N/A', 
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
      orderStatus: orderDto.order_status as Order['orderStatus'],
      paymentStatus: orderDto.payment_status as Order['paymentStatus'],
      orderDate: orderDto.order_date,
      adminNotes: orderDto.admin_notes,
    } as Order;
  }));
  return orders;
}

export async function fetchUserOrders(userId: string): Promise<Order[]> {
  console.log('fetchUserOrders called for userId: ' + userId + ' (from Supabase)');
  const { data: ordersData, error: ordersError } = await supabase
    .from('Orders')
    .select('*')
    .eq('user_id', userId)
    .order('order_date', { ascending: false });

  if (ordersError) {
    console.error('Error fetching orders for user ' + userId + ':', ordersError);
    if(ordersError && typeof ordersError.message === 'string' && (ordersError.message.includes('fetch failed'))) {
      throw new Error('Network error: Unable to fetch orders for user ' + userId + '.');
    }
    throw ordersError;
  }

  const orders: Order[] = await Promise.all(ordersData.map(async (orderDto: any) => {
    const { data: itemsData, error: itemsError } = await supabase
      .from('Order Items')
      .select('*')
      .eq('order_id', orderDto.order_id);

    if (itemsError) {
      console.error('Error fetching items for order ' + orderDto.order_id + ' (user ' + userId + '):', itemsError);
      if(itemsError && typeof itemsError.message === 'string' && (itemsError.message.includes('fetch failed'))) {
        console.warn('Network error fetching items for order ' + orderDto.order_id + ' (user ' + userId + '). Order items may be incomplete.');
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
      orderStatus: orderDto.order_status as Order['orderStatus'],
      paymentStatus: orderDto.payment_status as Order['paymentStatus'],
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
  console.log('updateOrderStatus called for orderId: ' + orderId + ', newOrderStatus: ' + newOrderStatus + ', newPaymentStatus: ' + (newPaymentStatus || 'N/A') + ' (to Supabase)');
  const updatePayload: { order_status: string; payment_status?: string } = {
    order_status: newOrderStatus,
  };

  if (newPaymentStatus) {
    updatePayload.payment_status = newPaymentStatus;
  } else { 
    if (newOrderStatus === "Payment Confirmed" || newOrderStatus === "Completed") {
      const { data: currentOrder, error: fetchError } = await supabase.from('Orders').select('payment_status').eq('order_id', orderId).single();
      if (fetchError && (fetchError.message.includes('fetch failed'))) {
          throw new Error('Network error: Unable to fetch current order status for ' + orderId + '. Status update aborted.');
      }
      if (currentOrder && currentOrder.payment_status === "Unpaid") {
        updatePayload.payment_status = "Paid";
      }
    }
  }

  const { data: updatedOrderData, error } = await supabase
    .from('Orders')
    .update(updatePayload)
    .eq('order_id', orderId)
    .select()
    .single();

  if (error || !updatedOrderData) {
    console.error('Error updating order status for ' + orderId + ':', error);
    if(error && typeof error.message === 'string' && (error.message.includes('fetch failed'))) {
      throw new Error('Network error: Failed to update order status for ' + orderId + '.');
    }
    throw new Error('Failed to update order status for ' + orderId + '.');
  }

  const { data: itemsData, error: itemsError } = await supabase
      .from('Order Items')
      .select('*')
      .eq('order_id', updatedOrderData.order_id);

  if (itemsError) {
      console.error('Error fetching items for updated order ' + updatedOrderData.order_id + ':', itemsError);
      if (itemsError && typeof itemsError.message === 'string' && (itemsError.message.includes('fetch failed'))) {
        console.warn('Network error fetching items for updated order ' + updatedOrderData.order_id + '. Order details might be incomplete.');
      }
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
      orderStatus: updatedOrderData.order_status as Order['orderStatus'],
      paymentStatus: updatedOrderData.payment_status as Order['paymentStatus'],
      orderDate: updatedOrderData.order_date,
      adminNotes: updatedOrderData.admin_notes,
  } as Order;
}

export async function fetchActivePurchaseCycleTitle(): Promise<string> {
    console.log('fetchActivePurchaseCycleTitle called (from Supabase)');
    const { data, error } = await supabase
        .from('Purchase Cycles')
        .select('name')
        .eq('is_active', true)
        .single();

    if (error || !data) {
        console.warn('No active purchase cycle found or error fetching title:', error);
        if(error && typeof error.message === 'string' && (error.message.includes('fetch failed'))) {
          console.warn('Network error fetching active cycle title. Using default.');
        }
        return "Temporada Atual"; 
    }
    return data.name;
}

export async function fetchActivePurchaseCycleProducts(): Promise<DisplayableProduct[]> {
  console.log('fetchActivePurchaseCycleProducts called (from Supabase)');
  return fetchDisplayableProducts();
}

export async function fetchProductAvailabilityInActiveCycle(productId: string): Promise<boolean> {
    console.log('fetchProductAvailabilityInActiveCycle called for productId: ' + productId + ' (from Supabase)');
    const { data: activeCycle, error: cycleError } = await supabase
        .from('Purchase Cycles')
        .select('cycle_id')
        .eq('is_active', true)
        .single();

    if (cycleError || !activeCycle) {
        console.warn("No active cycle to check product availability or error fetching cycle:", cycleError);
        if (cycleError && typeof cycleError.message === 'string' && (cycleError.message.includes('fetch failed'))) {
          console.warn('Network error fetching active cycle for availability check.');
        }
        return false; 
    }

    const { data: cycleProduct, error: cpError } = await supabase
        .from('Cycle Products')
        .select('is_available_in_cycle')
        .eq('cycle_id', activeCycle.cycle_id)
        .eq('product_id', productId)
        .single();

    if (cpError && cpError.code !== 'PGRST116') { 
        console.warn('Error fetching cycle product for product ' + productId + ' in active cycle:', cpError);
        if (cpError && typeof cpError.message === 'string' && (cpError.message.includes('fetch failed'))) {
           console.warn('Network error fetching cycle product for ' + productId + ' in active cycle.');
        }
        return false;
    }
    return cycleProduct ? cycleProduct.is_available_in_cycle : false; 
}

export async function setProductAvailabilityInActiveCycle(productId: string, isAvailable: boolean): Promise<void> {
    console.log('setProductAvailabilityInActiveCycle called for productId: ' + productId + ', isAvailable: ' + isAvailable + ' (to Supabase)');
    const { data: activeCycle, error: cycleError } = await supabase
        .from('Purchase Cycles')
        .select('cycle_id')
        .eq('is_active', true)
        .single();

    if (cycleError || !activeCycle) {
        console.error("No active cycle to set product availability or error fetching cycle:", cycleError);
        if (cycleError && typeof cycleError.message === 'string' && (cycleError.message.includes('fetch failed'))) {
          throw new Error("Network error: Unable to find active purchase cycle to set product availability.");
        }
        throw new Error("No active purchase cycle found.");
    }

    const { data: existingCycleProduct, error: fetchCpError } = await supabase
        .from('Cycle Products')
        .select('cycle_product_id, product_name_snapshot, price_in_cycle, display_image_url')
        .eq('cycle_id', activeCycle.cycle_id)
        .eq('product_id', productId)
        .single();

    if (fetchCpError && fetchCpError.code !== 'PGRST116') { 
        console.error('Error checking existing cycle_product for product ' + productId + ':', fetchCpError);
        if (fetchCpError && typeof fetchCpError.message === 'string' && (fetchCpError.message.includes('fetch failed'))) {
           throw new Error('Network error: Unable to check existing cycle product for ' + productId + '.');
        }
        throw fetchCpError;
    }

    if (existingCycleProduct) { 
        const { error: updateError } = await supabase
            .from('Cycle Products')
            .update({ is_available_in_cycle: isAvailable })
            .eq('cycle_product_id', existingCycleProduct.cycle_product_id);
        if (updateError) {
            console.error('Error updating availability for cycle_product ' + existingCycleProduct.cycle_product_id + ':', updateError);
            if (updateError && typeof updateError.message === 'string' && (updateError.message.includes('fetch failed'))) {
               throw new Error('Network error: Unable to update availability for cycle product ' + existingCycleProduct.cycle_product_id + '.');
            }
            throw updateError;
        }
    } else if (isAvailable) { 
        const { data: masterProduct, error: masterProductError } = await supabase
            .from('Products')
            .select('name, image_urls')
            .eq('product_id', productId)
            .single();

        if (masterProductError || !masterProduct) {
            console.error('Master product ' + productId + ' not found to create new cycle_product:', masterProductError);
            if (masterProductError && typeof masterProductError.message === 'string' && (masterProductError.message.includes('fetch failed'))) {
               throw new Error('Network error: Unable to fetch master product ' + productId + ' for new cycle product.');
            }
            throw new Error('Master product ' + productId + ' not found.');
        }
        
        const { error: insertError } = await supabase
            .from('Cycle Products')
            .insert({
                cycle_id: activeCycle.cycle_id,
                product_id: productId,
                product_name_snapshot: masterProduct.name,
                price_in_cycle: 0, 
                is_available_in_cycle: true,
                display_image_url: masterProduct.image_urls?.[0] || 'https://placehold.co/400x300.png?text=Produto',
            });
        if (insertError) {
            console.error('Error inserting new cycle_product for product ' + productId + ':', insertError);
            if (insertError && typeof insertError.message === 'string' && (insertError.message.includes('fetch failed'))) {
               throw new Error('Network error: Unable to insert new cycle product for ' + productId + '.');
            }
            throw insertError;
        }
        console.log('Created new cycle_product for ' + masterProduct.name + ' in active cycle as it was made available.');
    }
}

interface AdminDashboardMetrics {
  activeCycle: PurchaseCycle | null;
  pendingOrdersCount: number;
  totalSalesActiveCycle: number;
}

export async function fetchActiveCycleMetrics(): Promise<AdminDashboardMetrics> {
  console.log('fetchActiveCycleMetrics called (from Supabase)');
  const { data: activeCycleData, error: cycleError } = await supabase
    .from('Purchase Cycles')
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
  } else if (cycleError && cycleError.code !== 'PGRST116') { 
    console.warn("Error fetching active cycle for metrics:", cycleError);
    if (cycleError && typeof cycleError.message === 'string' && (cycleError.message.includes('fetch failed'))) {
    }
  }

  let pendingOrdersCount = 0;
  let totalSalesActiveCycle = 0;

  if (activeCycle) {
    const { data: ordersData, error: ordersError } = await supabase
      .from('Orders')
      .select('order_status, payment_status, order_total_amount')
      .eq('cycle_id', activeCycle.cycleId);

    if (ordersError) {
      console.warn("Error fetching orders for active cycle metrics:", ordersError);
      if (ordersError && typeof ordersError.message === 'string' && (ordersError.message.includes('fetch failed'))) {
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

  if (error) {
    console.error("Error fetching admin users (profiles):", error);
    if (error && typeof error.message === 'string' && (error.message.includes('fetch failed'))) {
      throw new Error("Network error: Unable to fetch admin users.");
    }
    throw error;
  }

  return data.map(profile => ({
      userId: profile.id,
      email: profile.email,
      displayName: profile.display_name,
      whatsapp: profile.whatsapp,
      role: profile.role as 'customer' | 'admin',
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
