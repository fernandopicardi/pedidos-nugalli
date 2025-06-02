
import type { Product, PurchaseCycle, Order, CartItem, CycleProduct, User, DisplayableProduct, OrderItem } from '@/types';
import { supabase } from './supabaseClient';

// --- Cart Update Listener System ---
// This remains largely the same as it interacts with localStorage, not Supabase.
// We'll only update the function names to align with a potential future
// migration to a server-side cart or to clarify they are client-side mocks.

let cartUpdateListeners: Array<(cartItems: CartItem[]) => void> = [];

function notifyCartUpdateListeners() {
  const currentCart = getCartFromLocalStorage();
  for (const listener of cartUpdateListeners) {
    try {
      listener(currentCart);
    } catch (e) {
      console.error("Error in cart update listener:", e);
    }
  }
}

function getCartFromLocalStorage(): CartItem[] {
  if (typeof localStorage !== 'undefined') {
    const storedCart = localStorage.getItem('mockCart'); // Keep mock name for clarity
    if (storedCart) {
      try {
        return JSON.parse(storedCart);
      } catch (e) {
        console.error("Error parsing cart from localStorage:", e);
        return []; // Return empty cart on error
      }
    }
  }
  return [];
}

export function subscribeToCartUpdates(callback: (cartItems: CartItem[]) => void): () => void {
  cartUpdateListeners.push(callback);
  // Immediately call callback with current cart state for initial load
  callback(getCartFromLocalStorage());
  return () => {
    cartUpdateListeners = cartUpdateListeners.filter(cb => cb !== callback);
  };
}

// Persist cart to localStorage for a more realistic mock
function saveCartToLocalStorage(cart: CartItem[]) {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('mockCart', JSON.stringify(cart)); // Keep mock name for clarity
  }
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
    return { user: null, error: { message: error.message } };
  }

  // Supabase returns a user object. We might need to fetch additional user details
  // from our 'users' table if it contains more than the default auth schema.
  if (data.user) {
       // Attempt to fetch user profile from our 'users' table
       const { data: userProfile, error: profileError } = await supabase
           .from('users')
           .select('*')
           .eq('user_id', data.user.id) // Supabase auth user id maps to user_id in our 'users' table
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
           return { user: basicUser, error: { message: `Sign in successful, but failed to load profile: ${profileError.message}` } };
       }

       // Combine auth data with profile data, or just use profile data if comprehensive
       const fullUser: User = {
           userId: userProfile.user_id,
           email: userProfile.email, // Use email from profile or auth? Consistency needed.
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
           // Include updatedAt if your 'users' table has it
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
        data: { // Include metadata that goes into auth.users table
            displayName: displayName || email.split('@')[0],
            whatsapp: whatsapp || '',
            role: 'customer', // Default role for new signups
        }
    }
  });

  if (authError) {
    console.error('Supabase sign up error:', authError);
     // Handle specific error codes, e.g., user already exists (authError.message includes "User already registered")
    return { user: null, error: { message: authError.message } };
  }

  // If auth sign up is successful, insert a corresponding record into our 'users' table
  // This table holds additional profile information.
  if (authData.user) {
      const newUserProfile: Omit<User, 'createdAt' | 'addressStreet' | 'addressNumber' | 'addressComplement' | 'addressNeighborhood' | 'addressCity' | 'addressState' | 'addressZip'> = {
          userId: authData.user.id,
          email: authData.user.email!, // Email is guaranteed after successful signup
          displayName: displayName || authData.user.email!.split('@')[0],
          whatsapp: whatsapp || '',
          role: 'customer', // Ensure role is set in your profile table as well
          // createdAt will be set by DB default
          // Address fields start empty
      };

      const { data: profileData, error: profileError } = await supabase
          .from('users')
          .insert([
              {
                user_id: newUserProfile.userId,
                email: newUserProfile.email,
                display_name: newUserProfile.displayName,
                whatsapp: newUserProfile.whatsapp,
                role: newUserProfile.role,
                // created_at will be set by DB default
              }
          ])
          .select() // Select the inserted row
          .single();

      if (profileError) {
          console.error('Error creating user profile after sign up:', profileError);
           // Decide how to handle this - potentially delete the auth user entry?
           // For now, return basic auth user and error message
           const basicUser: User = {
               userId: authData.user.id,
               email: authData.user.email || 'N/A',
               displayName: authData.user.user_metadata?.displayName || authData.user.email?.split('@')[0] || 'User',
               whatsapp: authData.user.user_metadata?.whatsapp || '',
               role: authData.user.user_metadata?.role || 'customer',
               createdAt: authData.user.created_at,
               addressStreet: '', addressNumber: '', addressComplement: '', addressNeighborhood: '', addressCity: '', addressState: '', addressZip: '',
           };
           return { user: basicUser, error: { message: `Signup successful, but failed to create profile: ${profileError.message}` } };
      }

      // Transform profile data to User type
       const fullUser: User = {
           userId: profileData.user_id,
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

       // Update localStorage or state management
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('currentUser', JSON.stringify(fullUser));
        }


      return { user: fullUser, error: null };
  }


   // This case should ideally not be reached if auth signup is successful
  return { user: null, error: { message: 'Unknown sign up error.' } };
}


export async function signOut(): Promise<{ error: { message: string } | null }> {
  console.log('signOut called');
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error('Supabase sign out error:', error);
    return { error: { message: error.message } };
  }

  // Clear local storage or state management upon successful sign out
   if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('currentUser');
    }


  return { error: null };
}


export async function getCurrentUser(): Promise<User | null> {
   // Fetch the current authenticated user from Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.getUser();

   if (authError) {
       console.error('Error fetching current auth user:', authError);
       if (typeof localStorage !== 'undefined') {
            localStorage.removeItem('currentUser'); // Clear local storage if auth check fails
       }
       return null;
   }

   if (!authData.user) {
        if (typeof localStorage !== 'undefined') {
            localStorage.removeItem('currentUser'); // Clear local storage if no user is authenticated
       }
       return null; // No authenticated user
   }

   // If an authenticated user exists, fetch their profile from our 'users' table
   const { data: userProfile, error: profileError } = await supabase
       .from('users')
       .select('*')
       .eq('user_id', authData.user.id)
       .single();

   if (profileError) {
       console.error('Error fetching current user profile:', profileError);
        if (typeof localStorage !== 'undefined') {
            localStorage.removeItem('currentUser'); // Clear local storage if profile fetch fails
        }
        // Decide how to handle this - maybe return basic auth user info?
       const basicUser: User = {
           userId: authData.user.id,
           email: authData.user.email || 'N/A',
           displayName: authData.user.user_metadata?.displayName || authData.user.email?.split('@')[0] || 'User',
           whatsapp: authData.user.user_metadata?.whatsapp || '',
           role: authData.user.user_metadata?.role || 'customer',
           createdAt: authData.user.created_at,
            addressStreet: '', addressNumber: '', addressComplement: '', addressNeighborhood: '', addressCity: '', addressState: '', addressZip: '',
       };
       return basicUser; // Return basic info even if profile is missing
   }

   // Transform profile data to User type
   const currentUser: User = {
       userId: userProfile.user_id,
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

   // Update localStorage or state management
    if (typeof localStorage !== 'undefined') {
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
    }


   return currentUser;
}

export async function updateUserDetails(
  userId: string,
  data: Partial<Pick<User, 'displayName' | 'whatsapp' | 'addressStreet' | 'addressNumber' | 'addressComplement' | 'addressNeighborhood' | 'addressCity' | 'addressState' | 'addressZip'>>
): Promise<{ user: User | null; error: { message: string } | null }> {
  console.log('updateUserDetails called for userId:', userId, 'with data:', data);

   // Note: Updating displayName or whatsapp might also involve updating auth.users metadata
   // This example focuses on updating the 'users' profile table.

  const { data: updatedData, error } = await supabase
    .from('users')
    .update({
        ...(data.displayName !== undefined && { display_name: data.displayName }),
        ...(data.whatsapp !== undefined && { whatsapp: data.whatsapp }),
        ...(data.addressStreet !== undefined && { address_street: data.addressStreet }),
        ...(data.addressNumber !== undefined && { address_number: data.addressNumber }),
        ...(data.addressComplement !== undefined && { address_complement: data.addressComplement }),
        ...(data.addressNeighborhood !== undefined && { address_neighborhood: data.addressNeighborhood }),
        ...(data.addressCity !== undefined && { address_city: data.addressCity }),
        ...(data.addressState !== undefined && { address_state: data.addressState }),
        ...(data.addressZip !== undefined && { address_zip: data.addressZip }),
        // updated_at will be set by the database default
    })
    .eq('user_id', userId)
    .select() // Select the updated row
    .single();

  if (error) {
    console.error(`Error updating user details for user ${userId}:`, error);
    return { user: null, error: { message: error.message } };
  }

   if (!updatedData) {
       return { user: null, error: { message: "User not found after update attempt." } };
   }

  // Transform the updated data to User type
   const updatedUser: User = {
       userId: updatedData.user_id,
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

   // Update localStorage or state management if the updated user is the current user
   const currentUserFromStorage = await getCurrentUser(); // Fetch current user to compare
   if (currentUserFromStorage && currentUserFromStorage.userId === userId) {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        }
   }


  return { user: updatedUser, error: null };
}


export async function checkAdminRole(): Promise<boolean> {
   // Fetch the current user and check their role from the profile table
  const user = await getCurrentUser(); // This now fetches from DB profile
  return user?.role === 'admin';
}

// MASTER PRODUCTS - For Admin CRUD
// TODO: Remove MOCK_MASTER_PRODUCTS after data is migrated to Supabase
let MOCK_MASTER_PRODUCTS: Product[] = [
  // ... (keep existing mock data for now, but it's not used in the refactored functions)
];


export async function fetchAdminProducts(): Promise<Product[]> {
  console.log('fetchAdminProducts called');

  // Fetch all products from the 'products' table
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false }); // Example: Order by creation date

  if (error) {
    console.error('Error fetching admin products:', error);
    throw error;
  }

  // TODO: Add data transformation if needed (e.g., snake_case to camelCase)
  return data as Product[];
}

export async function createProduct(productData: Omit<Product, 'productId' | 'createdAt' | 'updatedAt'>): Promise<Product> {
  console.log('createProduct called with:', productData);

  // Insert the new product data into the 'products' table
  const { data, error } = await supabase
    .from('products')
    .insert([
      {
        name: productData.name,
        description: productData.description,
        image_urls: productData.imageUrls, // Assuming your column is named image_urls
        attributes: productData.attributes, // Assuming your column is named attributes (JSONB)
        is_seasonal: productData.isSeasonal, // Assuming your column is named is_seasonal
        // created_at and updated_at will be set by the database default
      },
    ])
    .select() // Select the inserted data to return the created product
    .single(); // Expect a single result

  if (error) {
    console.error('Error creating product:', error);
    throw error;
  }

  // TODO: Add data transformation if needed
  return data as Product;
}

export async function updateProduct(productId: string, productData: Partial<Omit<Product, 'productId' | 'createdAt' | 'updatedAt'>>): Promise<Product> {
  console.log('updateProduct called for ID', productId, 'with:', productData);

  // Update the product data in the 'products' table
  const { data, error } = await supabase
    .from('products')
    .update({
      ...(productData.name !== undefined && { name: productData.name }),
      ...(productData.description !== undefined && { description: productData.description }),
      ...(productData.imageUrls !== undefined && { image_urls: productData.imageUrls }),
      ...(productData.attributes !== undefined && { attributes: productData.attributes }),
      ...(productData.isSeasonal !== undefined && { is_seasonal: productData.isSeasonal }),
      // updated_at will be set by the database default
    })
    .eq('product_id', productId) // Assuming your primary key column is named product_id
    .select() // Select the updated data to return the product
    .single(); // Expect a single result

  if (error) {
    console.error('Error updating product:', error);
    throw error;
  }

  if (!data) {
     throw new Error("Product not found after update");
  }

  // TODO: Add data transformation if needed
  return data as Product;
}

export async function deleteProduct(productId: string): Promise<void> {
  console.log('deleteProduct called for ID:', productId);

  // Delete the product from the 'products' table
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('product_id', productId);

  if (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
  // Note: Deleting a product might require handling dependent records
  // like cycle_products. Database foreign key constraints with CASCADE DELETE
  // are the recommended way to handle this automatically.
}


// PURCHASE CYCLES - For Admin CRUD
// TODO: Remove MOCK_PURCHASE_CYCLES after data is migrated to Supabase
const MOCK_PURCHASE_CYCLES: PurchaseCycle[] = [
  // ... (keep existing mock data for now, but it's not used in the refactored functions)
];

export async function fetchPurchaseCycles(): Promise<PurchaseCycle[]> {
  console.log('fetchPurchaseCycles called');

  // Fetch all purchase cycles from the 'purchase_cycles' table
  const { data, error } = await supabase
    .from('purchase_cycles')
    .select('*')
    .order('start_date', { ascending: false }); // Example: Order by start date descending

  if (error) {
    console.error('Error fetching purchase cycles:', error);
    throw error;
  }

  // TODO: Add data transformation if needed (e.g., snake_case to camelCase)
  return data as PurchaseCycle[];
}

export async function createPurchaseCycle(cycleData: Omit<PurchaseCycle, 'cycleId' | 'createdAt'>): Promise<PurchaseCycle> {
  console.log('createPurchaseCycle called with:', cycleData);

  // Deactivate any currently active cycle if the new one is active
  if (cycleData.isActive) {
      const { error: updateError } = await supabase
          .from('purchase_cycles')
          .update({ is_active: false })
          .eq('is_active', true);

      if (updateError) {
          console.error('Error deactivating previous active cycles:', updateError);
          // Decide if you want to throw or just log a warning
      }
  }


  // Insert the new purchase cycle data into the 'purchase_cycles' table
  const { data, error } = await supabase
    .from('purchase_cycles')
    .insert([
      {
        name: cycleData.name,
        start_date: cycleData.startDate, // Assuming snake_case columns
        end_date: cycleData.endDate,
        is_active: cycleData.isActive,
        // created_at will be set by the database default
      },
    ])
    .select() // Select the inserted data to return the created cycle
    .single(); // Expect a single result

  if (error) {
    console.error('Error creating purchase cycle:', error);
    throw error;
  }

  // TODO: Add data transformation if needed
  return data as PurchaseCycle;
}

export async function updatePurchaseCycle(cycleId: string, cycleData: Partial<Omit<PurchaseCycle, 'cycleId' | 'createdAt'>>): Promise<PurchaseCycle> {
  console.log('updatePurchaseCycle called for ID', cycleId, 'with:', cycleData);

  // If the cycle is being set to active, deactivate any other active cycles first
  if (cycleData.isActive === true) { // Strictly check for true
      const { error: updateError } = await supabase
          .from('purchase_cycles')
          .update({ is_active: false })
          .eq('is_active', true)
          .neq('cycle_id', cycleId); // Don't deactivate the cycle we are about to activate

      if (updateError) {
          console.error('Error deactivating other active cycles:', updateError);
           // Decide if you want to throw or just log a warning
      }
  }

  // Update the purchase cycle data in the 'purchase_cycles' table
  const { data, error } = await supabase
    .from('purchase_cycles')
    .update({
      ...(cycleData.name !== undefined && { name: cycleData.name }),
      ...(cycleData.startDate !== undefined && { start_date: cycleData.startDate }),
      ...(cycleData.endDate !== undefined && { end_date: cycleData.endDate }),
      ...(cycleData.isActive !== undefined && { is_active: cycleData.isActive }),
      // updated_at will be set by the database default
    })
    .eq('cycle_id', cycleId) // Assuming your primary key column is named cycle_id
    .select() // Select the updated data to return the cycle
    .single(); // Expect a single result

  if (error) {
    console.error('Error updating purchase cycle:', error);
    throw error;
  }

  if (!data) {
     throw new Error("PurchaseCycle not found after update");
  }

  // TODO: Add data transformation if needed
  return data as PurchaseCycle;
}

export async function deletePurchaseCycle(cycleId: string): Promise<void> {
  console.log('deletePurchaseCycle called for ID:', cycleId);

  // Delete the purchase cycle from the 'purchase_cycles' table
  const { error } = await supabase
    .from('purchase_cycles')
    .delete()
    .eq('cycle_id', cycleId);

  if (error) {
    console.error('Error deleting purchase cycle:', error);
    throw error;
  }
    // Note: Deleting a cycle might require handling dependent records
    // like cycle_products. Database foreign key constraints with CASCADE DELETE
    // are the recommended way to handle this automatically.
}


// CYCLE PRODUCTS - For Admin CRUD and Customer Display
// TODO: Remove MOCK_CYCLE_PRODUCTS and MOCK_DISPLAYABLE_PRODUCTS after data is migrated to Supabase
let MOCK_CYCLE_PRODUCTS: CycleProduct[] = [
  // ... (keep existing mock data for now, but it's not used in the refactored functions)
];

let MOCK_DISPLAYABLE_PRODUCTS: DisplayableProduct[] = [
  // ... (keep existing mock data for now, but it's not used in the refactored functions)
];

export async function fetchCycleProducts(cycleId: string): Promise<CycleProduct[]> {
  console.log('fetchCycleProducts called for cycle ID:', cycleId);

  // Fetch cycle products for a specific cycle from the 'cycle_products' table
  const { data, error } = await supabase
    .from('cycle_products')
    .select('*')
    .eq('cycle_id', cycleId);

  if (error) {
    console.error(`Error fetching cycle products for cycle ${cycleId}:`, error);
    throw error;
  }

  // TODO: Add data transformation if needed (e.g., snake_case to camelCase)
  return data as CycleProduct[];
}

export async function createCycleProduct(cycleProductData: Omit<CycleProduct, 'cycleProductId' | 'createdAt' | 'updatedAt'>): Promise<CycleProduct> {
  console.log('createCycleProduct called with:', cycleProductData);

  // Insert the new cycle product data into the 'cycle_products' table
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
        // created_at and updated_at will be set by the database default
      },
    ])
    .select() // Select the inserted data to return the created cycle product
    .single(); // Expect a single result

  if (error) {
    console.error('Error creating cycle product:', error);
    throw error;
  }

  // TODO: Add data transformation if needed
  return data as CycleProduct;
}

export async function updateCycleProduct(cycleProductId: string, cycleProductData: Partial<Omit<CycleProduct, 'cycleProductId' | 'createdAt' | 'updatedAt'>>): Promise<CycleProduct> {
  console.log('updateCycleProduct called for ID', cycleProductId, 'with:', cycleProductData);

  // Update the cycle product data in the 'cycle_products' table
  const { data, error } = await supabase
    .from('cycle_products')
    .update({
      ...(cycleProductData.cycleId !== undefined && { cycle_id: cycleProductData.cycleId }),
      ...(cycleProductData.productId !== undefined && { product_id: cycleProductData.productId }),
      ...(cycleProductData.productNameSnapshot !== undefined && { product_name_snapshot: cycleProductData.productNameSnapshot }),
      ...(cycleProductData.priceInCycle !== undefined && { price_in_cycle: cycleProductData.priceInCycle }),
      ...(cycleProductData.isAvailableInCycle !== undefined && { is_available_in_cycle: cycleProductData.isAvailableInCycle }),
      ...(cycleProductData.displayImageUrl !== undefined && { display_image_url: cycleProductData.displayImageUrl }),
      // updated_at will be set by the database default
    })
    .eq('cycle_product_id', cycleProductId)
    .select() // Select the updated data to return the cycle product
    .single(); // Expect a single result

  if (error) {
    console.error('Error updating cycle product:', error);
    throw error;
  }

   if (!data) {
     throw new Error("Cycle product not found after update");
  }

  // TODO: Add data transformation if needed
  return data as CycleProduct;
}

export async function deleteCycleProduct(cycleProductId: string): Promise<void> {
  console.log('deleteCycleProduct called for ID:', cycleProductId);

  // Delete the cycle product from the 'cycle_products' table
  const { error } = await supabase
    .from('cycle_products')
    .delete()
    .eq('cycle_product_id', cycleProductId);

  if (error) {
    console.error('Error deleting cycle product:', error);
    throw error;
  }
}

export async function fetchDisplayableProducts(): Promise<DisplayableProduct[]> {
  console.log('fetchDisplayableProducts called');

  // Fetch displayable products by joining 'cycle_products' and 'products' tables
  // Filter for the active cycle and available products
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
        attributes
      )
    `)
    .eq('is_available_in_cycle', true)
    .filter('cycle_id', 'in', '(select cycle_id from purchase_cycles where is_active = true)'); // Subquery to get the active cycle_id

  if (error) {
    console.error('Error fetching displayable products:', error);
    throw error;
  }

  // Transform the data to match the DisplayableProduct type
  const displayableProducts: DisplayableProduct[] = data.map((item: any) => ({
    cycleProductId: item.cycle_product_id,
    cycleId: item.cycle_id,
    productId: item.product_id,
    name: item.product_name_snapshot, // Use the snapshot name
    description: item.products?.description, // Get description from the joined products table (handle potential null)
    price: item.price_in_cycle,
    isAvailable: item.is_available_in_cycle,
    imageUrl: item.display_image_url,
    attributes: item.products?.attributes, // Get attributes from the joined products table (handle potential null)
  }));

  return displayableProducts;
}

export async function fetchDisplayableProductById(cycleProductId: string): Promise<DisplayableProduct | null> {
  console.log('fetchDisplayableProductById called for ID:', cycleProductId);

   // Fetch a single displayable product by joining 'cycle_products' and 'products' tables
   // Filter by cycle_product_id and ensure it's in the active cycle and available
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
        attributes
      )
    `)
    .eq('cycle_product_id', cycleProductId)
     .eq('is_available_in_cycle', true)
    .filter('cycle_id', 'in', '(select cycle_id from purchase_cycles where is_active = true)') // Subquery to get the active cycle_id
    .single(); // Use single() as we expect one result

  if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
    console.error(`Error fetching displayable product ${cycleProductId}:`, error);
    throw error;
  }

  if (!data) {
    return null; // Product not found or not available/in active cycle
  }

  // Transform the data to match the DisplayableProduct type
  const displayableProduct: DisplayableProduct = {
    cycleProductId: data.cycle_product_id,
    cycleId: data.cycle_id,
    productId: data.product_id,
    name: data.product_name_snapshot, // Use the snapshot name
    description: data.products?.description, // Get description from the joined products table (handle potential null)
    price: data.price_in_cycle,
    isAvailable: data.is_available_in_cycle,
    imageUrl: data.display_image_url,
    attributes: data.products?.attributes, // Get attributes from the joined products table (handle potential null)
  };

  return displayableProduct;
}


// CART - Local Storage based (client-side only)
// This remains largely the same as it interacts with localStorage, not Supabase.
// We'll only update the function names to align with a potential future
// migration to a server-side cart or to clarify they are client-side mocks.

// Keep the existing listener system and localStorage functions as they are client-side mocks
// (Already defined at the top)

// Refactored Cart functions using local storage

export async function fetchCartItems(): Promise<CartItem[]> {
  console.log('fetchCartItems called (using localStorage)');
  await new Promise(resolve => setTimeout(resolve, 100)); // Simulate async
  return getCartFromLocalStorage();
}

export async function addToCart(product: DisplayableProduct, quantity: number): Promise<void> {
  console.log('addToCart called for product:', product.cycleProductId, 'quantity:', quantity, '(using localStorage)');
  await new Promise(resolve => setTimeout(resolve, 50)); // Simulate async
  let cart = getCartFromLocalStorage();
  const existingItemIndex = cart.findIndex(item => item.cycleProductId === product.cycleProductId);

  if (existingItemIndex > -1) {
    cart[existingItemIndex].quantity += quantity;
  } else {
    cart.push({
      cycleProductId: product.cycleProductId,
      productId: product.productId,
      name: product.name,
      price: product.price,
      quantity: quantity,
      imageUrl: product.imageUrl,
      description: product.description, // Storing full description in cart item
    });
  }
  saveCartToLocalStorage(cart);
  notifyCartUpdateListeners();
}

export async function updateCartItemQuantity(cycleProductId: string, newQuantity: number): Promise<void> {
  console.log('updateCartItemQuantity called for product:', cycleProductId, 'newQuantity:', newQuantity, '(using localStorage)');
  await new Promise(resolve => setTimeout(resolve, 50)); // Simulate async
  let cart = getCartFromLocalStorage();
  const itemIndex = cart.findIndex(item => item.cycleProductId === cycleProductId);
  if (itemIndex > -1) {
    if (newQuantity > 0) {
      cart[itemIndex].quantity = newQuantity;
    } else {
      cart.splice(itemIndex, 1); // Remove if quantity is 0 or less
    }
    saveCartToLocalStorage(cart);
    notifyCartUpdateListeners();
  }
}

export async function removeFromCart(cycleProductId: string): Promise<void> {
  console.log('removeFromCart called for product:', cycleProductId, '(using localStorage)');
  await new Promise(resolve => setTimeout(resolve, 50)); // Simulate async
  let cart = getCartFromLocalStorage();
  cart = cart.filter(item => item.cycleProductId !== cycleProductId);
  saveCartToLocalStorage(cart);
  notifyCartUpdateListeners();
}


// ORDERS - Mocked (using localStorage for simplicity, would be Supabase in real app)

// TODO: Remove MOCK_ORDERS after migration
let MOCK_ORDERS: Order[] = [
    {
        orderId: 'ord-mock-1',
        orderNumber: "ORD2024001",
        userId: 'user-mock-customer-1', // John Doe
        customerNameSnapshot: "John Doe",
        customerWhatsappSnapshot: "5511999990001",
        cycleId: 'cycle-easter-2025',
        items: [
            { productId: 'prod-classic-dark-70', cycleProductId: 'cp-easter-classic-dark-70', productName: 'Barra Clássica Amargo 70% Cacau', quantity: 2, priceAtPurchase: 25.00, lineItemTotal: 50.00 },
            { productId: 'prod-truffle-box-assorted', cycleProductId: 'cp-easter-truffle-box-assorted', productName: 'Caixa de Trufas Sortidas (12 un)', quantity: 1, priceAtPurchase: 45.00, lineItemTotal: 45.00 }
        ],
        orderTotalAmount: 95.00,
        orderStatus: "Completed",
        paymentStatus: "Paid",
        orderDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
    },
    {
        orderId: 'ord-mock-2',
        orderNumber: "ORD2024002",
        userId: 'user-mock-admin-1', // Admin User
        customerNameSnapshot: "Admin User",
        customerWhatsappSnapshot: "5511988880000",
        cycleId: 'cycle-mothers-day-2025',
        items: [
            { productId: 'prod-ganache-praline-bar', cycleProductId: 'cp-mothers-ganache-praline-bar', productName: 'Barra Recheada Praliné Crocante', quantity: 3, priceAtPurchase: 18.00, lineItemTotal: 54.00 }
        ],
        orderTotalAmount: 54.00,
        orderStatus: "Preparing",
        paymentStatus: "Paid",
        orderDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    },
    {
        orderId: 'ord-mock-3',
        orderNumber: "ORD2024003",
        userId: 'user-mock-customer-1', // John Doe again
        customerNameSnapshot: "John Doe",
        customerWhatsappSnapshot: "5511999990001",
        cycleId: 'cycle-mothers-day-2025',
        items: [
            { productId: 'prod-new-03', cycleProductId: 'cp-mothers-new-03', productName: 'Bombons Finos de Licor de Cereja', quantity: 1, priceAtPurchase: 33.50, lineItemTotal: 33.50 },
             { productId: 'prod-new-06', cycleProductId: 'cp-mothers-new-06', productName: 'Drágeas Crocantes de Café com Chocolate Amargo', quantity: 2, priceAtPurchase: 15.75, lineItemTotal: 31.50 }
        ],
        orderTotalAmount: 65.00,
        orderStatus: "Pending Payment",
        paymentStatus: "Unpaid",
        orderDate: new Date().toISOString(), // Today
    }
];

if (typeof localStorage !== 'undefined' && !localStorage.getItem('mockOrders')) {
    localStorage.setItem('mockOrders', JSON.stringify(MOCK_ORDERS));
}

function getOrdersFromLocalStorage(): Order[] {
  if (typeof localStorage !== 'undefined') {
    const storedOrders = localStorage.getItem('mockOrders');
    if (storedOrders) return JSON.parse(storedOrders);
  }
  return [];
}

function saveOrdersToLocalStorage(orders: Order[]) {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('mockOrders', JSON.stringify(orders));
  }
}

export async function processCheckout(cartItems: CartItem[]): Promise<Order> {
  console.log('processCheckout called with items:', cartItems, '(using localStorage)');
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    throw new Error("User not logged in. Cannot process checkout.");
  }

  if (cartItems.length === 0) {
    throw new Error("Cart is empty. Cannot process checkout.");
  }

  // Find the active cycle. For mock, we'll assume one exists or pick the first from a mock list.
  // In a real scenario, this would involve fetching the active cycleId.
  // For this mock, we'll use the cycleId from the first cart item if available, or a default.
  const activeCycleId = cartItems[0]?.cycleId || 'cycle-easter-2025'; // Fallback cycleId for mock

  const orderItems: OrderItem[] = cartItems.map(cartItem => ({
    productId: cartItem.productId,
    cycleProductId: cartItem.cycleProductId,
    productName: cartItem.name,
    quantity: cartItem.quantity,
    priceAtPurchase: cartItem.price,
    lineItemTotal: cartItem.price * cartItem.quantity,
  }));

  const orderTotalAmount = orderItems.reduce((sum, item) => sum + item.lineItemTotal, 0);

  const allOrders = getOrdersFromLocalStorage();
  const newOrderNumber = `ORD${new Date().getFullYear()}${(allOrders.length + 1).toString().padStart(3, '0')}`;

  const newOrder: Order = {
    orderId: `ord-mock-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    orderNumber: newOrderNumber,
    userId: currentUser.userId,
    customerNameSnapshot: currentUser.displayName,
    customerWhatsappSnapshot: currentUser.whatsapp,
    cycleId: activeCycleId,
    items: orderItems,
    orderTotalAmount,
    orderStatus: "Pending Payment", // Initial status
    paymentStatus: "Unpaid",        // Initial status
    orderDate: new Date().toISOString(),
  };

  allOrders.push(newOrder);
  saveOrdersToLocalStorage(allOrders);

  // Clear the cart after checkout
  saveCartToLocalStorage([]);
  notifyCartUpdateListeners(); // Notify that cart is now empty

  console.log('Order processed (mock):', newOrder);
  return newOrder;
}


export async function fetchAdminOrders(): Promise<Order[]> {
  console.log('fetchAdminOrders called (using localStorage)');
  await new Promise(resolve => setTimeout(resolve, 100)); // Simulate async
  return getOrdersFromLocalStorage();
}

export async function fetchUserOrders(userId: string): Promise<Order[]> {
  console.log(`fetchUserOrders called for userId: ${userId} (using localStorage)`);
  await new Promise(resolve => setTimeout(resolve, 100)); // Simulate async
  const allOrders = getOrdersFromLocalStorage();
  return allOrders.filter(order => order.userId === userId);
}


export async function updateOrderStatus(
  orderId: string,
  newOrderStatus: Order['orderStatus'],
  newPaymentStatus?: Order['paymentStatus'] // Optional, as it might not always change with order status
): Promise<Order> {
  console.log(`updateOrderStatus called for orderId: ${orderId}, newOrderStatus: ${newOrderStatus}, newPaymentStatus: ${newPaymentStatus} (using localStorage)`);
  await new Promise(resolve => setTimeout(resolve, 50)); // Simulate async

  let orders = getOrdersFromLocalStorage();
  const orderIndex = orders.findIndex(o => o.orderId === orderId);

  if (orderIndex === -1) {
    throw new Error(`Mock Order with ID ${orderId} not found.`);
  }

  orders[orderIndex].orderStatus = newOrderStatus;
  if (newPaymentStatus) {
    orders[orderIndex].paymentStatus = newPaymentStatus;
  }
  
  // Logic to automatically update payment status based on order status if needed
  if (newOrderStatus === "Payment Confirmed" && orders[orderIndex].paymentStatus === "Unpaid") {
    orders[orderIndex].paymentStatus = "Paid";
  }
  if (newOrderStatus === "Completed" && orders[orderIndex].paymentStatus === "Unpaid") {
      // This scenario might be less common, but if an order is completed, it should imply payment.
      orders[orderIndex].paymentStatus = "Paid";
  }
  if (newOrderStatus === "Cancelled" && orders[orderIndex].paymentStatus === "Paid") {
      // Optional: if an order is cancelled after payment, it might go to "Refunded" or admin decides manually.
      // For simplicity, we'll leave this manual or specific.
  }


  saveOrdersToLocalStorage(orders);
  return orders[orderIndex];
}

// MISC / Other placeholder functions that might be needed

export async function fetchActivePurchaseCycleTitle(): Promise<string> {
    console.log('fetchActivePurchaseCycleTitle called (using mock data)');
    // In a real app, this would query Supabase for the active cycle.
    // For mock, find an active cycle or return a default.
    const activeCycle = MOCK_PURCHASE_CYCLES.find(c => c.isActive);
    return activeCycle ? activeCycle.name : "Temporada Atual"; // Default title
}

// This function now needs to return DisplayableProduct[]
export async function fetchActivePurchaseCycleProducts(): Promise<DisplayableProduct[]> {
  console.log('fetchActivePurchaseCycleProducts called (using mock data)');
  await new Promise(resolve => setTimeout(resolve, 200)); // Simulate async

  const activeCycle = MOCK_PURCHASE_CYCLES.find(c => c.isActive);
  if (!activeCycle) {
      console.warn("No active purchase cycle found in mock data for fetchActivePurchaseCycleProducts.");
      return [];
  }

  const cycleProds = MOCK_CYCLE_PRODUCTS.filter(cp => cp.cycleId === activeCycle.cycleId && cp.isAvailableInCycle);

  const displayableProducts: DisplayableProduct[] = cycleProds.map(cp => {
      const masterProduct = MOCK_MASTER_PRODUCTS.find(mp => mp.productId === cp.productId);
      if (!masterProduct) {
          console.warn(`Master product with ID ${cp.productId} not found for cycle product ${cp.cycleProductId}. Skipping.`);
          return null; // Or handle as an error
      }
      return {
          cycleProductId: cp.cycleProductId,
          cycleId: cp.cycleId,
          productId: cp.productId,
          name: cp.productNameSnapshot,
          description: masterProduct.description,
          price: cp.priceInCycle,
          isAvailable: cp.isAvailableInCycle, // This should always be true due to filter above
          imageUrl: cp.displayImageUrl || masterProduct.imageUrls[0] || 'https://placehold.co/400x300.png?text=Produto',
          attributes: masterProduct.attributes,
      };
  }).filter(dp => dp !== null) as DisplayableProduct[]; // Filter out any nulls

  return displayableProducts;
}


// Placeholder for fetching product availability in the active cycle (used in ProductForm)
export async function fetchProductAvailabilityInActiveCycle(productId: string): Promise<boolean> {
    console.log(`fetchProductAvailabilityInActiveCycle called for productId: ${productId} (mock)`);
    const activeCycle = MOCK_PURCHASE_CYCLES.find(c => c.isActive);
    if (!activeCycle) return false; // No active cycle, so not available

    const cycleProduct = MOCK_CYCLE_PRODUCTS.find(
        cp => cp.cycleId === activeCycle.cycleId && cp.productId === productId
    );
    return cycleProduct ? cycleProduct.isAvailableInCycle : false; // Default to false if not explicitly in cycle
}

// Placeholder for setting product availability in the active cycle (used in ProductForm)
export async function setProductAvailabilityInActiveCycle(productId: string, isAvailable: boolean): Promise<void> {
    console.log(`setProductAvailabilityInActiveCycle called for productId: ${productId}, isAvailable: ${isAvailable} (mock)`);
    const activeCycle = MOCK_PURCHASE_CYCLES.find(c => c.isActive);
    if (!activeCycle) {
        console.warn("No active cycle to set product availability.");
        return;
    }

    const cycleProductIndex = MOCK_CYCLE_PRODUCTS.findIndex(
        cp => cp.cycleId === activeCycle.cycleId && cp.productId === productId
    );

    if (cycleProductIndex > -1) {
        MOCK_CYCLE_PRODUCTS[cycleProductIndex].isAvailableInCycle = isAvailable;
    } else {
        // If product is not yet in the cycle, and we want to make it available, we might need to add it.
        // For simplicity, this mock will only update existing entries.
        // A real implementation would handle creating a new cycle_product entry if needed.
        const masterProduct = MOCK_MASTER_PRODUCTS.find(mp => mp.productId === productId);
        if (masterProduct && isAvailable) { // Only add if making available and master product exists
             MOCK_CYCLE_PRODUCTS.push({
                cycleProductId: `cp-mock-${activeCycle.cycleId}-${productId}-${Date.now()}`,
                cycleId: activeCycle.cycleId,
                productId: productId,
                productNameSnapshot: masterProduct.name, // Take snapshot from master
                priceInCycle: 0, // Default price, admin should set this
                isAvailableInCycle: true,
                displayImageUrl: masterProduct.imageUrls[0] || 'https://placehold.co/400x300.png?text=Produto',
            });
            console.log(`Mock: Added ${masterProduct.name} to active cycle as it was made available.`);
        } else {
            console.warn(`Product ${productId} not found in active cycle ${activeCycle.name}. Availability not set.`);
        }
    }
    // In a real scenario, you'd save MOCK_CYCLE_PRODUCTS or update Supabase.
}

// Admin Dashboard Metrics
interface AdminDashboardMetrics {
  activeCycle: PurchaseCycle | null;
  pendingOrdersCount: number;
  totalSalesActiveCycle: number;
}

export async function fetchActiveCycleMetrics(): Promise<AdminDashboardMetrics> {
  console.log('fetchActiveCycleMetrics called (using mock data)');
  await new Promise(resolve => setTimeout(resolve, 150));

  const activeCycle = MOCK_PURCHASE_CYCLES.find(c => c.isActive) || null;
  let pendingOrdersCount = 0;
  let totalSalesActiveCycle = 0;

  if (activeCycle) {
    const ordersInActiveCycle = getOrdersFromLocalStorage().filter(o => o.cycleId === activeCycle.cycleId);
    pendingOrdersCount = ordersInActiveCycle.filter(
      o => o.orderStatus === "Pending Payment" || o.orderStatus === "Preparing" || o.orderStatus === "Payment Confirmed"
    ).length;
    totalSalesActiveCycle = ordersInActiveCycle
      .filter(o => o.paymentStatus === "Paid")
      .reduce((sum, o) => sum + o.orderTotalAmount, 0);
  }

  return {
    activeCycle,
    pendingOrdersCount,
    totalSalesActiveCycle,
  };
}


// SEASONS - Deprecated, use Purchase Cycles. These are kept for completeness of the old spec but should be removed.
export interface Season {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}
let MOCK_SEASONS: Season[] = [];
export async function fetchSeasons(): Promise<Season[]> { console.warn("fetchSeasons is deprecated. Use fetchPurchaseCycles."); return MOCK_SEASONS; }
export async function createSeason(seasonData: Omit<Season, 'id'>): Promise<Season> { console.warn("createSeason is deprecated. Use createPurchaseCycle."); const newSeason = { ...seasonData, id: `s-${Date.now()}` }; MOCK_SEASONS.push(newSeason); return newSeason; }
export async function updateSeason(seasonId: string, seasonData: Partial<Season>): Promise<Season> { console.warn("updateSeason is deprecated. Use updatePurchaseCycle."); const index = MOCK_SEASONS.findIndex(s => s.id === seasonId); if (index === -1) throw new Error("Season not found"); MOCK_SEASONS[index] = { ...MOCK_SEASONS[index], ...seasonData }; return MOCK_SEASONS[index]; }
export async function deleteSeason(seasonId: string): Promise<void> { console.warn("deleteSeason is deprecated. Use deletePurchaseCycle."); MOCK_SEASONS = MOCK_SEASONS.filter(s => s.id !== seasonId); }


// USER MANAGEMENT (for Admin Panel - Customers View)
export async function fetchAdminUsers(): Promise<User[]> {
  console.log('fetchAdminUsers called (using mock data)');
  await new Promise(resolve => setTimeout(resolve, 100));
  // In a real app, this would query Supabase profiles table.
  // For mock, we'll simulate fetching from a predefined list of users.
  const MOCK_USERS: User[] = [
    {
      userId: 'user-mock-customer-1',
      email: 'john.doe@example.com',
      displayName: 'John Doe',
      whatsapp: '5511999990001',
      role: 'customer',
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
      addressStreet: 'Rua das Palmeiras', addressNumber: '123', addressComplement: 'Apto 10', addressNeighborhood: 'Vila Madalena', addressCity: 'São Paulo', addressState: 'SP', addressZip: '05432-010'
    },
    {
      userId: 'user-mock-customer-2',
      email: 'jane.smith@example.com',
      displayName: 'Jane Smith',
      whatsapp: '5521988880002',
      role: 'customer',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
      addressStreet: 'Avenida Copacabana', addressNumber: '456', addressComplement: '', addressNeighborhood: 'Copacabana', addressCity: 'Rio de Janeiro', addressState: 'RJ', addressZip: '22020-001'
    },
     {
      userId: 'user-mock-admin-1', // Included for completeness, though normally filtered out if fetching only 'customer'
      email: 'admin@nugali.com',
      displayName: 'Admin User',
      whatsapp: '5511988880000',
      role: 'admin',
      createdAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString(), // 100 days ago
      addressStreet: 'Rua Principal', addressNumber: '01', addressComplement: 'Escritório', addressNeighborhood: 'Centro', addressCity: 'Blumenau', addressState: 'SC', addressZip: '89010-000'
    },
  ];
  return MOCK_USERS.filter(user => user.role === 'customer'); // Return only customers
}

    