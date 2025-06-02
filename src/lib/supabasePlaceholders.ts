import type { Product, Season, Order, CartItem } from '@/types';

// AUTH
export async function signInWithEmail(email: string, password: string) {
  // TODO: Implement Supabase sign-in logic
  console.log('signInWithEmail called with:', email, password);
  if (email === 'admin@nugali.com' && password === 'adminpass') {
    return { user: { id: 'admin-user', email }, error: null };
  }
  if (email === 'user@nugali.com' && password === 'userpass') {
    return { user: { id: 'test-user', email }, error: null };
  }
  return { user: null, error: { message: 'Invalid credentials' } };
}

export async function signUpWithEmail(email: string, password: string) {
  // TODO: Implement Supabase sign-up logic
  console.log('signUpWithEmail called with:', email, password);
  return { user: { id: 'new-user', email }, error: null };
}

export async function signOut() {
  // TODO: Implement Supabase sign-out logic
  console.log('signOut called');
  return { error: null };
}

export async function getCurrentUser() {
  // TODO: Implement Supabase get current user logic
  console.log('getCurrentUser called');
  // Simulate a logged-in user for development
  // return { id: 'test-user', email: 'user@nugali.com', is_admin: false };
  return null; // Simulate no user logged in
}

export async function checkAdminRole(): Promise<boolean> {
  // TODO: Implement Supabase admin role check
  console.log('checkAdminRole called');
  // const user = await getCurrentUser();
  // return user?.is_admin || false;
  return true; // Simulate admin for development
}


// PRODUCTS
export async function fetchActiveSeasonProducts(): Promise<Product[]> {
  // TODO: Implement Supabase logic to fetch products for the active season
  console.log('fetchActiveSeasonProducts called');
  return [
    { id: '1', name: 'Ovo Praliné Amargo', price: 129.90, imageUrl: 'https://placehold.co/400x300.png?text=Chocolate+1', description: 'Delicioso ovo de chocolate amargo com praliné crocante.' },
    { id: '2', name: 'Caixa de Bombons Finos', price: 89.50, imageUrl: 'https://placehold.co/400x300.png?text=Chocolate+2', description: 'Seleção especial de bombons artesanais.' },
    { id: '3', name: 'Tablete Ao Leite com Nozes', price: 45.00, imageUrl: 'https://placehold.co/400x300.png?text=Chocolate+3', description: 'Chocolate ao leite cremoso com pedaços de nozes.' },
    { id: '4', name: 'Trufas Sortidas Premium', price: 68.00, imageUrl: 'https://placehold.co/400x300.png?text=Chocolate+4', description: 'Caixa com trufas de sabores variados e intensos.' },
  ];
}

export async function fetchAdminProducts(): Promise<Product[]> {
  // TODO: Implement Supabase logic to fetch all products for admin
  console.log('fetchAdminProducts called');
  return [
    { id: '1', name: 'Ovo Praliné Amargo', price: 129.90, imageUrl: 'https://placehold.co/80x80.png?text=P1', seasonId: 'easter-2025' },
    { id: '2', name: 'Caixa de Bombons Finos', price: 89.50, imageUrl: 'https://placehold.co/80x80.png?text=P2', seasonId: 'easter-2025' },
    { id: '3', name: 'Panettone Trufado Natal', price: 150.00, imageUrl: 'https://placehold.co/80x80.png?text=P3', seasonId: 'xmas-2024' },
  ];
}

export async function createProduct(productData: Omit<Product, 'id'>): Promise<Product> {
  // TODO: Implement Supabase logic to create a product
  console.log('createProduct called with:', productData);
  return { ...productData, id: Date.now().toString() };
}

export async function updateProduct(productId: string, productData: Partial<Product>): Promise<Product> {
  // TODO: Implement Supabase logic to update a product
  console.log('updateProduct called for ID', productId, 'with:', productData);
  const products = await fetchAdminProducts();
  const existingProduct = products.find(p => p.id === productId);
  if (!existingProduct) throw new Error("Product not found");
  return { ...existingProduct, ...productData };
}

export async function deleteProduct(productId: string): Promise<void> {
  // TODO: Implement Supabase logic to delete a product
  console.log('deleteProduct called for ID:', productId);
}

// SEASONS
export async function fetchSeasons(): Promise<Season[]> {
  // TODO: Implement Supabase logic to fetch seasons
  console.log('fetchSeasons called');
  return [
    { id: 'easter-2025', name: 'Páscoa 2025', startDate: '2025-03-01', endDate: '2025-04-20', isActive: true },
    { id: 'xmas-2024', name: 'Natal 2024', startDate: '2024-11-01', endDate: '2024-12-25', isActive: false },
  ];
}

export async function createSeason(seasonData: Omit<Season, 'id'>): Promise<Season> {
  // TODO: Implement Supabase logic to create a season
  console.log('createSeason called with:', seasonData);
  return { ...seasonData, id: Date.now().toString() };
}

export async function updateSeason(seasonId: string, seasonData: Partial<Season>): Promise<Season> {
  // TODO: Implement Supabase logic to update a season
  console.log('updateSeason called for ID', seasonId, 'with:', seasonData);
  const seasons = await fetchSeasons();
  const existingSeason = seasons.find(s => s.id === seasonId);
  if (!existingSeason) throw new Error("Season not found");
  return { ...existingSeason, ...seasonData };
}

export async function deleteSeason(seasonId: string): Promise<void> {
  // TODO: Implement Supabase logic to delete a season
  console.log('deleteSeason called for ID:', seasonId);
}

// CART & ORDERS
export async function fetchCartItems(): Promise<CartItem[]> {
  // TODO: Implement Supabase logic or local storage for cart
  console.log('fetchCartItems called');
  return [
    { id: '1', name: 'Ovo Praliné Amargo', price: 129.90, quantity: 1, imageUrl: 'https://placehold.co/80x80.png?text=P1' },
    { id: '2', name: 'Caixa de Bombons Finos', price: 89.50, quantity: 2, imageUrl: 'https://placehold.co/80x80.png?text=P2' },
  ];
}

export async function addToCart(product: Product, quantity: number): Promise<void> {
  // TODO: Implement Supabase logic or local storage for cart
  console.log('addToCart called for product:', product.name, 'quantity:', quantity);
}

export async function updateCartItemQuantity(productId: string, quantity: number): Promise<void> {
  // TODO: Implement Supabase logic or local storage for cart
  console.log('updateCartItemQuantity called for product ID:', productId, 'new quantity:', quantity);
}

export async function removeFromCart(productId: string): Promise<void> {
  // TODO: Implement Supabase logic or local storage for cart
  console.log('removeFromCart called for product ID:', productId);
}

export async function processCheckout(cartItems: CartItem[]): Promise<Order> {
  // TODO: Implement Supabase logic to create an order
  console.log('processCheckout called with cart:', cartItems);
  const totalValue = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  return {
    id: Date.now().toString(),
    customerName: 'Mocked Customer',
    orderDate: new Date().toISOString(),
    totalValue,
    status: 'Pending',
    items: cartItems,
  };
}

export async function fetchAdminOrders(): Promise<Order[]> {
  // TODO: Implement Supabase logic to fetch all orders for admin
  console.log('fetchAdminOrders called');
  const cartItems = await fetchCartItems();
  const totalValue = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  return [
    { id: 'order123', customerName: 'João Silva', orderDate: '2024-05-20T10:30:00Z', totalValue: 219.40, status: 'Pending', items: cartItems },
    { id: 'order124', customerName: 'Maria Oliveira', orderDate: '2024-05-19T15:00:00Z', totalValue: 89.50, status: 'Shipped', items: [cartItems[1]] },
  ];
}

export async function updateOrderStatus(orderId: string, status: Order['status']): Promise<Order> {
  // TODO: Implement Supabase logic to update order status
  console.log('updateOrderStatus called for order ID:', orderId, 'new status:', status);
  const orders = await fetchAdminOrders();
  const order = orders.find(o => o.id === orderId);
  if (!order) throw new Error('Order not found');
  return { ...order, status };
}

export async function fetchActiveSeasonTitle(): Promise<string> {
  // TODO: Connect to Supabase to get the active season name
  return "Coleção de Páscoa 2025"; // Placeholder
}
