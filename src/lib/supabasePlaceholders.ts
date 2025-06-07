
import type { Product, PurchaseCycle, Order, CartItem, CycleProduct, User, DisplayableProduct, OrderItem } from '@/types';
import { supabase } from '@/lib/supabaseClient';
import { getUser as fetchCurrentUserFromAuth } from '../lib/auth';

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

export async function getCurrentUser(): Promise<User | null> {
  const userFromStorage = typeof localStorage !== 'undefined' ? localStorage.getItem('currentUser') : null;
  if (userFromStorage) {
    try {
      const parsedUser = JSON.parse(userFromStorage) as User;
      if (parsedUser.isAdmin === undefined && (parsedUser as any).role !== undefined) {
         parsedUser.isAdmin = (parsedUser as any).role === true; 
         delete (parsedUser as any).role;
      }
      return parsedUser;
    } catch (e) {
      console.error("Error parsing currentUser from localStorage:", e);
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('currentUser');
      }
    }
  }
  const { user, error } = await fetchCurrentUserFromAuth();
  if (error) {
    return null;
  }
  if (user && typeof localStorage !== 'undefined') {
    localStorage.setItem('currentUser', JSON.stringify(user));
  }
  return user;
}

export async function updateUserDetails(
  userId: string,
  data: Partial<Pick<User, 'displayName' | 'whatsapp' | 'addressStreet' | 'addressNumber' | 'addressComplement' | 'addressNeighborhood' | 'addressCity' | 'addressState' | 'addressZip'>>
): Promise<{ user: User | null; error: { message: string } | null }> {
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
    console.error('updateUserDetails error:', error.message);
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
       isAdmin: updatedData.is_admin, 
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
   if (currentUserFromStorage && currentUserFromStorage.userId === userId && typeof localStorage !== 'undefined') {
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
   }
  return { user: updatedUser, error: null };
}


export async function fetchProductsForAdmin(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("fetchProductsForAdmin error:", error.message);
    if (error && typeof error.message === 'string' && (error.message === 'Failed to fetch' || error.message.includes('fetch failed'))) {
      throw new Error('Network error: Unable to fetch products. Please check connection and Supabase config.');
    }
    throw error;
  }
  return data.map(p => ({
    productId: p.product_id,
    name: p.name,
    description: p.description,
    imageUrl: p.image_url,   
    attributes: p.attributes,
    createdAt: p.created_at, 
    updatedAt: p.updated_at  
  })) as Product[];
}

export async function createProduct(productData: Omit<Product, 'productId' | 'createdAt' | 'updatedAt'>): Promise<Product> {
  const { data, error } = await supabase
    .from('products')
    .insert([
      { 
        name: productData.name,
        description: productData.description,
        image_url: productData.imageUrl,
        attributes: productData.attributes,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("createProduct error:", error.message);
    if (error && typeof error.message === 'string' && (error.message === 'Failed to fetch' || error.message.includes('fetch failed'))) {
      throw new Error('Network error: Unable to create product. Please check connection and Supabase config.');
    }
    throw error;
  }
  return { 
    productId: data.product_id,
    name: data.name,
    description: data.description,
    imageUrl: data.image_url,
    attributes: data.attributes,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  } as Product;
}

export async function updateProduct(productId: string, productData: Partial<Omit<Product, 'productId' | 'createdAt' | 'updatedAt'>>): Promise<Product> {
  const updatePayload: Record<string, any> = {}; 
  if (productData.name !== undefined) updatePayload.name = productData.name;
  if (productData.description !== undefined) updatePayload.description = productData.description;
  if (productData.imageUrl !== undefined) updatePayload.image_url = productData.imageUrl;
  if (productData.attributes !== undefined) updatePayload.attributes = productData.attributes;

  const { data, error } = await supabase
    .from('products')
    .update(updatePayload)
    .eq('product_id', productId)
    .select()
    .single();

  if (error) {
    console.error("updateProduct error:", error.message);
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
    imageUrl: data.image_url,
    attributes: data.attributes,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  } as Product;
}

export async function deleteProduct(productId: string): Promise<void> {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('product_id', productId); 

  if (error) {
    console.error("deleteProduct error:", error.message);
    if (error && typeof error.message === 'string' && (error.message === 'Failed to fetch' || error.message.includes('fetch failed'))) {
      throw new Error('Network error: Unable to delete product. Please check connection and Supabase config.');
    }
    throw error;
  }
}

export async function fetchPurchaseCycles(): Promise<PurchaseCycle[]> {
  const { data, error } = await supabase
    .from('purchase_cycles') 
    .select('*')
    .order('start_date', { ascending: false }); 

  if (error) {
    console.error("fetchPurchaseCycles error:", error.message);
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
  if (cycleData.isActive) {
      const { error: updateError } = await supabase
          .from('purchase_cycles')
          .update({ is_active: false }) 
          .eq('is_active', true);    
      if (updateError) {
           console.warn('Error deactivating other cycles during create (non-critical):', updateError.message);
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
    console.error("createPurchaseCycle error:", error.message);
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
  if (cycleData.isActive === true) {
      const { error: updateError } = await supabase
          .from('purchase_cycles')
          .update({ is_active: false }) 
          .eq('is_active', true)    
          .neq('cycle_id', cycleId); 
      if (updateError) {
          console.warn('Error deactivating other cycles during update (non-critical):', updateError.message);
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
    console.error("updatePurchaseCycle error:", error.message);
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
  const { error } = await supabase
    .from('purchase_cycles')
    .delete()
    .eq('cycle_id', cycleId); 

  if (error) {
    console.error("deletePurchaseCycle error:", error.message);
    if (error && typeof error.message === 'string' && (error.message === 'Failed to fetch' || error.message.includes('fetch failed'))) {
      throw new Error('Network error: Unable to delete purchase cycle. Please check connection and Supabase config.');
    }
    throw error;
  }
}

export async function fetchCycleProducts(cycleId: string): Promise<CycleProduct[]> {
  const { data, error } = await supabase
    .from('cycle_products') 
    .select('*, products(product_id, name, description, image_url, attributes)') 
    .eq('cycle_id', cycleId); 

  if (error) {
    console.error(`fetchCycleProducts for cycle ${cycleId} error:`, error.message);
    if (error && typeof error.message === 'string' && (error.message === 'Failed to fetch' || error.message.includes('fetch failed'))) {
      throw new Error('Network error: Unable to fetch cycle products for cycle ' + cycleId + '. Please check connection and Supabase config.');
    }
    throw error;
  }
  return data.map(cp => ({ 
      cycleProductId: cp.cycle_product_id,         
      cycleId: cp.cycle_id,                        
      productId: cp.product_id,                    
      productNameSnapshot: cp.product_name_snapshot || cp.products?.name || 'N/A', 
      priceInCycle: cp.price_in_cycle,             
      isAvailableInCycle: cp.is_available_in_cycle, 
      displayImageUrl: cp.display_image_url || cp.products?.image_url || 'https://placehold.co/400x300.png?text=Produto', 
      createdAt: cp.created_at,                    
      updatedAt: cp.updated_at                     
  })) as CycleProduct[];
}

export async function createCycleProduct(cycleProductData: Omit<CycleProduct, 'cycleProductId' | 'createdAt' | 'updatedAt'>): Promise<CycleProduct> {
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
    console.error("createCycleProduct error:", error.message);
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
    console.error("updateCycleProduct error:", error.message);
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
  const { error } = await supabase
    .from('cycle_products')
    .delete()
    .eq('cycle_product_id', cycleProductId); 

  if (error) {
    console.error("deleteCycleProduct error:", error.message);
    if (error && typeof error.message === 'string' && (error.message === 'Failed to fetch' || error.message.includes('fetch failed'))) {
      throw new Error('Network error: Unable to delete cycle product. Please check connection and Supabase config.');
    }
    throw error;
  }
}

export async function fetchDisplayableProducts(): Promise<DisplayableProduct[]> {
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
      products ( product_id, name, description, attributes, image_url )
    `)
    .eq('is_available_in_cycle', true) 
    .filter('cycle_id', 'in', '(select cycle_id from purchase_cycles where is_active = true)'); 

  if (error) {
    console.error("fetchDisplayableProducts error:", error.message);
    if (error && typeof error.message === 'string' && (error.message === 'Failed to fetch' || error.message.includes('fetch failed'))) {
      throw new Error('Network error: Unable to fetch displayable products. Please check connection and Supabase config.');
    }
    throw error;
  }

  const displayableProducts: DisplayableProduct[] = data.map((item: any) => ({ 
    cycleProductId: item.cycle_product_id,
    cycleId: item.cycle_id,
    productId: item.product_id,
    name: item.product_name_snapshot || item.products?.name || 'Unknown Product',
    description: item.products?.description || '',
    price: item.price_in_cycle || 0,
    isAvailableInCycle: item.is_available_in_cycle,
    imageUrl: item.display_image_url || item.products?.image_url || 'https://placehold.co/400x300.png?text=Produto',
    attributes: item.products?.attributes || {},
  }));
  return displayableProducts;
}

export async function fetchDisplayableProductById(cycleProductId: string): Promise<DisplayableProduct | null> {
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
      products ( product_id, name, description, attributes, image_url )
    `)
    .eq('cycle_product_id', cycleProductId) 
    .eq('is_available_in_cycle', true)  
    .filter('cycle_id', 'in', '(select cycle_id from purchase_cycles where is_active = true)') 
    .single(); // Changed to single to expect one or zero

  if (error && error.code !== 'PGRST116') { 
    console.error(`fetchDisplayableProductById for ${cycleProductId} error:`, error.message);
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
    name: data.product_name_snapshot || data.products?.name || 'Unknown Product',
    description: data.products?.description || '',
    price: data.price_in_cycle || 0,
    isAvailableInCycle: data.is_available_in_cycle,
    imageUrl: data.display_image_url || data.products?.image_url || 'https://placehold.co/400x300.png?text=Produto',
    attributes: data.products?.attributes || {},
  };
  return displayableProduct;
}

export async function fetchCartItems(): Promise<CartItem[]> {
  const user = await getCurrentUser();
  if (!user) {
    return [];
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
        display_image_url,
        products ( description ) 
      )
    `)
    .eq('user_id', user.userId); 

  if (error) {
    console.error("fetchCartItems error:", error.message);
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
    description: item.cycle_products?.products?.description || '',
  }));
  return cartItems;
}

export async function addToCart(displayableProduct: DisplayableProduct, quantity: number): Promise<void> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("User not logged in. Cannot add to cart.");
  }

  const { data: existingItems, error: fetchError } = await supabase
    .from('cart_items') 
    .select('cart_item_id, quantity')
    .eq('user_id', user.userId)                        
    .eq('cycle_product_id', displayableProduct.cycleProductId); 

  if (fetchError) {
    console.error("addToCart (fetch existing) error:", fetchError.message);
    if(fetchError && typeof fetchError.message === 'string' && (fetchError.message.includes('fetch failed'))) {
      throw new Error('Network error: Unable to check cart status. Please try again.');
    }
    throw fetchError;
  }

  if (existingItems && existingItems.length > 0) {
    const existingItem = existingItems[0];
    const newQuantity = existingItem.quantity + quantity;
    const { error: updateError } = await supabase
      .from('cart_items') 
      .update({ quantity: newQuantity })
      .eq('cart_item_id', existingItem.cart_item_id); 

    if (updateError) {
      console.error("addToCart (update) error:", updateError.message);
       if(updateError && typeof updateError.message === 'string' && (updateError.message.includes('fetch failed'))) {
         throw new Error('Network error: Unable to update cart item quantity. Please try again.');
       }
      throw updateError;
    }
  } else {
    const { error: insertError } = await supabase
      .from('cart_items') 
      .insert({ 
        user_id: user.userId,
        cycle_product_id: displayableProduct.cycleProductId,
        quantity: quantity,
      });

    if (insertError) {
      console.error("addToCart (insert) error:", insertError.message);
      if(insertError && typeof insertError.message === 'string' && (insertError.message.includes('fetch failed'))) {
        throw new Error('Network error: Unable to add item to cart. Please try again.');
      }
      throw insertError;
    }
  }
  await notifyCartUpdateListeners();
}

export async function updateCartItemQuantity(cartItemId: string, newQuantity: number): Promise<void> {
  const user = await getCurrentUser();
  if (!user) {
      throw new Error("User not logged in. Cannot update cart.");
  }

  if (newQuantity <= 0) {
    await removeFromCart(cartItemId);
    return;
  }

  const { error } = await supabase
    .from('cart_items') 
    .update({ quantity: newQuantity })
    .eq('cart_item_id', cartItemId) 
    .eq('user_id', user.userId);  

  if (error) {
    console.error("updateCartItemQuantity error:", error.message);
    if(error && typeof error.message === 'string' && (error.message.includes('fetch failed'))) {
      throw new Error('Network error: Unable to update cart item quantity. Please try again.');
    } else {
      throw error;
    }
  }
  await notifyCartUpdateListeners();
}

export async function removeFromCart(cartItemId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) {
      throw new Error("User not logged in. Cannot remove from cart.");
  }

  const { error } = await supabase
    .from('cart_items') 
    .delete()
    .eq('cart_item_id', cartItemId) 
    .eq('user_id', user.userId);  

  if (error) {
    console.error("removeFromCart error:", error.message);
    if(error && typeof error.message === 'string' && (error.message.includes('fetch failed'))) {
      throw new Error('Network error: Unable to remove item from cart. Please try again.');
    } else {
      throw error;
    }
  }
  await notifyCartUpdateListeners();
}

export async function processCheckout(cartItems: CartItem[]): Promise<Order> {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    throw new Error("User not logged in. Cannot process checkout.");
  }
  if (cartItems.length === 0) {
    throw new Error("Cart is empty. Cannot process checkout.");
  }

  const { data: activeCycleData, error: cycleError } = await supabase
    .from('purchase_cycles') 
    .select('cycle_id')      
    .eq('is_active', true)   
    .limit(1) 
    .maybeSingle(); 

  if (cycleError || !activeCycleData) {
    console.error("processCheckout (fetch active cycle) error:", cycleError?.message);
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
    .from('orders') 
    .select('order_number') 
    .order('created_at', { ascending: false }) 
    .limit(1)
    .maybeSingle();

  if (lastOrderError) { 
    console.error("Error fetching last order number:", lastOrderError.message);
     if (lastOrderError.message.includes('fetch failed')) {
      throw new Error("Network error: Unable to generate order number. Cannot process checkout.");
    }
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
    .from('orders') 
    .insert(newOrderPayload)
    .select() 
    .single();

  if (createOrderError || !createdOrderData) {
      console.error("processCheckout (create order) error:", createOrderError?.message);
      if(createOrderError && typeof createOrderError.message === 'string' && (createOrderError.message.includes('fetch failed'))) {
        throw new Error("Network error: Failed to save order. Please try again.");
      }
      throw new Error(`Failed to create order in database. ${createOrderError?.message || ''}`);
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
      console.error("processCheckout (create order items) error:", createOrderItemsError.message);
      await supabase.from('orders').delete().eq('order_id', createdOrderData.order_id);
      if(createOrderItemsError && typeof createOrderItemsError.message === 'string' && (createOrderItemsError.message.includes('fetch failed'))) {
          throw new Error("Network error: Failed to save order items. Order has been cancelled.");
      }
      throw new Error(`Failed to create order items in database. Order has been cancelled. ${createOrderItemsError.message}`);
  }

  const { error: clearCartError } = await supabase
    .from('cart_items') 
    .delete()
    .eq('user_id', currentUser.userId); 

  if (clearCartError) {
      console.warn("Failed to clear user cart after checkout (non-critical):", clearCartError.message);
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
  const { data: ordersData, error: ordersError } = await supabase
    .from('orders') 
    .select('*, profiles(display_name)') 
    .order('order_date', { ascending: false }); 

  if (ordersError) {
    console.error("fetchAdminOrders error:", ordersError.message);
    if(ordersError && typeof ordersError.message === 'string' && (ordersError.message.includes('fetch failed'))) {
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
      console.warn(`Error fetching items for order ${orderDto.order_id}:`, itemsError.message);
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
  const { data: ordersData, error: ordersError } = await supabase
    .from('orders') 
    .select('*') 
    .eq('user_id', userId) 
    .order('order_date', { ascending: false }); 

  if (ordersError) {
    console.error(`fetchUserOrders for user ${userId} error:`, ordersError.message);
    if(ordersError && typeof ordersError.message === 'string' && (ordersError.message.includes('fetch failed'))) {
      throw new Error('Network error: Unable to fetch orders for user ' + userId + '.');
    }
    throw ordersError;
  }

  const orders: Order[] = await Promise.all(ordersData.map(async (orderDto: any) => {
    const { data: itemsData, error: itemsError } = await supabase
      .from('order_items') 
      .select('*')
      .eq('order_id', orderDto.order_id); 

    if (itemsError) {
      console.warn(`Error fetching items for order ${orderDto.order_id} (user ${userId}):`, itemsError.message);
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
  const updatePayload: { order_status: string; payment_status?: string } = { 
    order_status: newOrderStatus,
  };

  if (newPaymentStatus) {
    updatePayload.payment_status = newPaymentStatus;
  } else {
    if (newOrderStatus === "Payment Confirmed" || newOrderStatus === "Completed") {
      const { data: currentOrder, error: fetchError } = await supabase
        .from('orders') 
        .select('payment_status') 
        .eq('order_id', orderId) 
        .single();
      
      if (fetchError) {
         console.warn(`Error fetching current order status for ${orderId} during auto-payment update:`, fetchError.message);
         if (fetchError.message.includes('fetch failed')) {
          throw new Error('Network error: Unable to fetch current order status for ' + orderId + '. Status update aborted.');
         }
      } else if (currentOrder && currentOrder.payment_status === "Unpaid") {
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
    console.error(`updateOrderStatus for order ${orderId} error:`, error?.message);
    if(error && typeof error.message === 'string' && (error.message.includes('fetch failed'))) {
      throw new Error('Network error: Failed to update order status for ' + orderId + '.');
    }
    throw new Error(`Failed to update order status for ${orderId}. ${error?.message || 'No data returned.'}`);
  }

  const { data: itemsData, error: itemsError } = await supabase
      .from('order_items') 
      .select('*')
      .eq('order_id', updatedOrderData.order_id); 

  if (itemsError) {
      console.warn(`Error fetching items for updated order ${updatedOrderData.order_id}:`, itemsError.message);
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
    adminNotes: updatedOrderData.admin_notes || null,
  } as Order;
}

export async function fetchActivePurchaseCycleTitle(): Promise<string> {
    const { data, error } = await supabase
        .from('purchase_cycles') 
        .select('name')          
        .eq('is_active', true)   
        .limit(1)
        .maybeSingle(); 

    if (error) {
        console.warn('fetchActivePurchaseCycleTitle error:', error.message);
        if(error && typeof error.message === 'string' && (error.message.includes('fetch failed'))) {
          console.warn('Network error fetching active cycle title. Using default.');
        }
        return "Temporada Atual"; 
    }
    return data?.name || "Temporada Atual"; 
}

export async function fetchActivePurchaseCycleProducts(): Promise<DisplayableProduct[]> {
  return fetchDisplayableProducts();
}

export async function fetchProductAvailabilityInActiveCycle(productId: string): Promise<boolean> {
    const { data: activeCycle, error: cycleError } = await supabase
        .from('purchase_cycles') 
        .select('cycle_id')      
        .eq('is_active', true)   
        .limit(1)
        .maybeSingle();

    if (cycleError || !activeCycle) {
        if (cycleError) console.warn('fetchProductAvailabilityInActiveCycle (fetch active cycle) error:', cycleError.message);
        if (cycleError && typeof cycleError.message === 'string' && (cycleError.message.includes('fetch failed'))) {
          console.warn('Network error fetching active cycle for availability check.');
        }
        return false; 
    }

    const { data: cycleProduct, error: cpError } = await supabase
        .from('cycle_products') 
        .select('is_available_in_cycle') 
        .eq('cycle_id', activeCycle.cycle_id) 
        .eq('product_id', productId)          
        .maybeSingle(); 

    if (cpError) { 
        console.warn(`Error fetching cycle product ${productId} in active cycle ${activeCycle.cycle_id}:`, cpError.message);
        if (cpError && typeof cpError.message === 'string' && (cpError.message.includes('fetch failed'))) {
           console.warn('Network error fetching cycle product for ' + productId + ' in active cycle.');
        }
        return false; 
    }
    return cycleProduct ? cycleProduct.is_available_in_cycle : false;
}

export async function setProductAvailabilityInActiveCycle(productId: string, isAvailable: boolean): Promise<void> {
    const { data: activeCycle, error: cycleError } = await supabase
        .from('purchase_cycles') 
        .select('cycle_id')      
        .eq('is_active', true)   
        .limit(1)
        .maybeSingle();

    if (cycleError || !activeCycle) {
        if(cycleError) console.error('setProductAvailabilityInActiveCycle (fetch active cycle) error:', cycleError.message);
        if (cycleError && typeof cycleError.message === 'string' && (cycleError.message.includes('fetch failed'))) {
          throw new Error("Network error: Unable to find active purchase cycle to set product availability.");
        }
        throw new Error("No active purchase cycle found or error fetching it.");
    }

    const { data: existingCycleProduct, error: fetchCpError } = await supabase
        .from('cycle_products') 
        .select('cycle_product_id, product_name_snapshot, price_in_cycle, display_image_url') 
        .eq('cycle_id', activeCycle.cycle_id) 
        .eq('product_id', productId)          
        .maybeSingle();

    if (fetchCpError) {
        console.error(`Error checking existing cycle product for ${productId}:`, fetchCpError.message);
        if (fetchCpError && typeof fetchCpError.message === 'string' && (fetchCpError.message.includes('fetch failed'))) {
           throw new Error('Network error: Unable to check existing cycle product for ' + productId + '.');
        }
        throw fetchCpError;
    }

    if (existingCycleProduct) {
        const { error: updateError } = await supabase
            .from('cycle_products') 
            .update({ is_available_in_cycle: isAvailable }) 
            .eq('cycle_product_id', existingCycleProduct.cycle_product_id); 
        if (updateError) {
            console.error(`Error updating availability for cycle product ${existingCycleProduct.cycle_product_id}:`, updateError.message);
            if (updateError && typeof updateError.message === 'string' && (updateError.message.includes('fetch failed'))) {
               throw new Error('Network error: Unable to update availability for cycle product ' + existingCycleProduct.cycle_product_id + '.');
            }
            throw updateError;
        }
    } else if (isAvailable) { 
        const { data: masterProduct, error: masterProductError } = await supabase
            .from('products') 
            .select('name, image_url') 
            .eq('product_id', productId) 
            .single();

        if (masterProductError || !masterProduct) {
            console.error(`Error fetching product ${productId} for new cycle product:`, masterProductError?.message);
            if (masterProductError && typeof masterProductError.message === 'string' && (masterProductError.message.includes('fetch failed'))) {
               throw new Error('Network error: Unable to fetch product ' + productId + ' for new cycle product.');
            }
            throw new Error(`Product ${productId} not found or error fetching it.`);
        }

        const { error: insertError } = await supabase
            .from('cycle_products') 
            .insert({ 
                cycle_id: activeCycle.cycle_id,
                product_id: productId,
                product_name_snapshot: masterProduct.name,
                price_in_cycle: 0, 
                is_available_in_cycle: true,
                display_image_url: masterProduct.image_url || 'https://placehold.co/400x300.png?text=Produto',
            });
        if (insertError) {
            console.error(`Error inserting new cycle product for ${productId}:`, insertError.message);
            if (insertError && typeof insertError.message === 'string' && (insertError.message.includes('fetch failed'))) {
               throw new Error('Network error: Unable to insert new cycle product for ' + productId + '.');
            }
            throw insertError;
        }
    }
}

interface AdminDashboardMetrics {
  activeCycle: PurchaseCycle | null;
  pendingOrdersCount: number;
  totalSalesActiveCycle: number;
}

export async function fetchActiveCycleMetrics(): Promise<AdminDashboardMetrics> {
  const { data: activeCycleData, error: cycleError } = await supabase
    .from('purchase_cycles') 
    .select('cycle_id, name, start_date, end_date, is_active, created_at') // Select specific columns
    .eq('is_active', true) 
    .limit(1)
    .maybeSingle();

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
  } else if (cycleError) { 
    console.warn('fetchActiveCycleMetrics (fetch active cycle) error:', cycleError.message);
    if (cycleError && typeof cycleError.message === 'string' && (cycleError.message.includes('fetch failed'))) {
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
      console.warn('fetchActiveCycleMetrics (fetch orders) error:', ordersError.message);
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
  const { data, error } = await supabase
    .from('profiles') 
    .select('*')
    .order('created_at', { ascending: false }); 

  if (error) {
    console.error("fetchAdminUsers error:", error.message);
    if (error && typeof error.message === 'string' && (error.message === 'Failed to fetch' || error.message.includes('fetch failed'))) {
      throw new Error("Network error: Unable to fetch admin users.");
    }
    throw error;
  }

  return data.map(profile => ({ 
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
  })) as User[];
}


export async function signInWithEmail(email: string, password: string): Promise<{ user: User | null, error: { message: string } | null }> {
  const { data: authData, error: signInAuthError } = await supabase.auth.signInWithPassword({ email, password });

  if (signInAuthError) {
    if (signInAuthError.message === 'Failed to fetch' || signInAuthError.message.includes('fetch failed')) {
      return { user: null, error: { message: 'Network error: Unable to connect to authentication service.' } };
    }
    if (signInAuthError.message !== 'Invalid login credentials') {
        console.warn('Sign in attempt failed (placeholders):', signInAuthError.message);
    }
    return { user: null, error: { message: signInAuthError.message } };
  }


  if (!authData || !authData.user) {
    return { user: null, error: { message: "Sign in successful but no user data returned from auth." } };
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', authData.user.id)
    .single();

  if (profileError && profileError.code !== 'PGRST116') { 
    const basicUser: User = { 
      userId: authData.user.id, email: authData.user.email || '', displayName: authData.user.email?.split('@')[0] || 'User', whatsapp: '', isAdmin: false, createdAt: new Date().toISOString()
    };
    return { user: basicUser, error: { message: profileError.message + " (profile fetch failed)" } };
  }
  if (!profile) { 
    const basicUser: User = {  
        userId: authData.user.id, email: authData.user.email || '', displayName: authData.user.email?.split('@')[0] || 'User', whatsapp: '', isAdmin: false, createdAt: new Date().toISOString()
    };
    return { user: basicUser, error: { message: "Profile not found for user." } };
  }

  const fullUser: User = {
    userId: profile.id, email: profile.email, displayName: profile.display_name, whatsapp: profile.whatsapp, isAdmin: profile.is_admin, createdAt: profile.created_at, 
    addressStreet: profile.address_street, addressNumber: profile.address_number, addressComplement: profile.address_complement, addressNeighborhood: profile.address_neighborhood, addressCity: profile.address_city, addressState: profile.address_state, addressZip: profile.address_zip
  };
  if (typeof localStorage !== 'undefined') localStorage.setItem('currentUser', JSON.stringify(fullUser));
  return { user: fullUser, error: null };
}

export async function signUpWithEmail(
  email: string,
  password: string,
  profileData?: { 
 }
): Promise<{ user: any | null; session: any | null; error: { message: string } | null }> {
  console.warn("signUpWithEmail from supabasePlaceholders.ts is a placeholder. Use from '@/lib/auth'.");
  return { user: null, session: null, error: { message: "Placeholder function, use from auth.ts" } };
}


export async function signOut(): Promise<{ error: { message: string } | null }> {
  console.warn("signOut from supabasePlaceholders.ts is a placeholder. Use from '@/lib/auth'.");
  const { error } = await supabase.auth.signOut();
  if (error) {
    if (error.message === 'Failed to fetch' || error.message.includes('fetch failed')) {
      return { error: { message: 'Network error during sign out (placeholders).' } };
    }
    return { error: { message: error.message } };
  }
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('currentUser');
  }
  return { error: null };
}

export async function checkAdminRole(): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.isAdmin === true;
}
