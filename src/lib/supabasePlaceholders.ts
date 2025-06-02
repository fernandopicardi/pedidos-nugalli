
import type { Product, PurchaseCycle, Order, CartItem, CycleProduct, User } from '@/types';

// AUTH
export async function signInWithEmail(email: string, password: string) {
  // TODO: Implement Supabase sign-in logic
  console.log('signInWithEmail called with:', email, password);
  if (email === 'admin@nugali.com' && password === 'adminpass') {
    // Simulate returning a User object
    const user: User = { userId: 'admin-user', email, displayName: 'Admin User', role: 'admin', createdAt: new Date().toISOString() };
    return { user, error: null };
  }
  if (email === 'user@nugali.com' && password === 'userpass') {
     const user: User = { userId: 'test-user', email, displayName: 'Test User', role: 'customer', createdAt: new Date().toISOString() };
    return { user, error: null };
  }
  return { user: null, error: { message: 'Invalid credentials' } };
}

export async function signUpWithEmail(email: string, password: string, displayName: string, whatsapp?: string) {
  // TODO: Implement Supabase sign-up logic
  console.log('signUpWithEmail called with:', email, password, displayName, whatsapp);
  const newUser: User = {
    userId: `new-user-${Date.now()}`,
    email,
    displayName,
    whatsapp: whatsapp || undefined,
    role: 'customer',
    createdAt: new Date().toISOString(),
  };
  return { user: newUser, error: null };
}

export async function signOut() {
  // TODO: Implement Supabase sign-out logic
  console.log('signOut called');
  return { error: null };
}

export async function getCurrentUser(): Promise<User | null> {
  // TODO: Implement Supabase get current user logic
  console.log('getCurrentUser called');
  // Simulate a logged-in admin user for development
  // return { userId: 'admin-user', email: 'admin@nugali.com', displayName: 'Admin User', role: 'admin', createdAt: new Date().toISOString() };
  return null; // Simulate no user logged in
}

export async function checkAdminRole(): Promise<boolean> {
  // TODO: Implement Supabase admin role check
  console.log('checkAdminRole called');
  // const user = await getCurrentUser();
  // return user?.role === 'admin';
  return true; // Simulate admin for development
}


// PRODUCTS (Master List)
export async function fetchActivePurchaseCycleProducts(): Promise<Product[]> {
  // TODO: This should ideally fetch CycleProducts or Products tailored for the active cycle.
  // For now, returning master products that might be in an "active cycle".
  // The pricing and availability should come from CycleProduct.
  console.log('fetchActivePurchaseCycleProducts called');
  // This placeholder returns master Product details.
  // In a real scenario, you'd filter Products based on active CycleProducts.
  return [
    { productId: '1', name: 'Ovo Praliné Amargo', description: 'Delicioso ovo de chocolate amargo com praliné crocante.', imageUrls: ['https://placehold.co/400x300.png?text=Chocolate+1'], attributes: { "weight": ["500g"] }, isSeasonal: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { productId: '2', name: 'Caixa de Bombons Finos', description: 'Seleção especial de bombons artesanais.', imageUrls: ['https://placehold.co/400x300.png?text=Chocolate+2'], attributes: { "count": ["12 unidades"] }, isSeasonal: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { productId: '3', name: 'Tablete Ao Leite com Nozes', description: 'Chocolate ao leite cremoso com pedaços de nozes.', imageUrls: ['https://placehold.co/400x300.png?text=Chocolate+3'], attributes: { "weight": ["100g"] }, isSeasonal: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { productId: '4', name: 'Trufas Sortidas Premium', description: 'Caixa com trufas de sabores variados e intensos.', imageUrls: ['https://placehold.co/400x300.png?text=Chocolate+4'], attributes: { "count": ["16 unidades"] }, isSeasonal: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  ];
  // The price property has been removed from the Product type, it's now in CycleProduct.
  // The ProductCard component will need to be updated to reflect this.
  // For now, I'll add a placeholder price to avoid breaking ProductCard immediately.
  // This will be addressed when CycleProduct is fully integrated.
  // return (await fetchActivePurchaseCycleProductsFull()).map(p => ({...p, price: p.priceInCycle}));
}

export async function fetchAdminProducts(): Promise<Product[]> {
  // Fetches master product list for admin
  console.log('fetchAdminProducts called');
  return [
    { productId: 'prod-1', name: 'Ovo Praliné Amargo (Master)', description: 'Master description for Praliné.', imageUrls: ['https://placehold.co/400x300.png?text=Master+P1'], attributes: {"dietary": ["sem glúten"]}, isSeasonal: true, createdAt: '2023-01-01T00:00:00Z', updatedAt: '2023-01-01T00:00:00Z' },
    { productId: 'prod-2', name: 'Caixa de Bombons Finos (Master)', description: 'Master description for Bombons.', imageUrls: ['https://placehold.co/400x300.png?text=Master+P2'], attributes: {"contains": ["nozes"]}, isSeasonal: true, createdAt: '2023-01-02T00:00:00Z', updatedAt: '2023-01-02T00:00:00Z' },
    { productId: 'prod-3', name: 'Panettone Trufado (Master)', description: 'Master description for Panettone.', imageUrls: ['https://placehold.co/400x300.png?text=Master+P3'], attributes: {}, isSeasonal: true, createdAt: '2023-01-03T00:00:00Z', updatedAt: '2023-01-03T00:00:00Z' },
  ];
}

export async function createProduct(productData: Omit<Product, 'productId' | 'createdAt' | 'updatedAt'>): Promise<Product> {
  console.log('createProduct called with:', productData);
  const newProduct: Product = {
    ...productData,
    productId: `prod-${Date.now().toString()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  // In a real app, save to Supabase and return the saved product
  return newProduct;
}

export async function updateProduct(productId: string, productData: Partial<Omit<Product, 'productId' | 'createdAt' | 'updatedAt'>>): Promise<Product> {
  console.log('updateProduct called for ID', productId, 'with:', productData);
  const products = await fetchAdminProducts(); // Fetch current products
  const existingProduct = products.find(p => p.productId === productId);
  if (!existingProduct) throw new Error("Product not found");
  const updatedProduct: Product = {
    ...existingProduct,
    ...productData,
    updatedAt: new Date().toISOString(),
  };
  // In a real app, update in Supabase and return the updated product
  return updatedProduct;
}

export async function deleteProduct(productId: string): Promise<void> {
  console.log('deleteProduct called for ID:', productId);
  // In a real app, delete from Supabase
}

// PURCHASE CYCLES
export async function fetchPurchaseCycles(): Promise<PurchaseCycle[]> {
  console.log('fetchPurchaseCycles called');
  return [
    { cycleId: 'cycle-easter-2025', name: 'Páscoa 2025', startDate: '2025-03-01T00:00:00Z', endDate: '2025-04-20T23:59:59Z', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
    { cycleId: 'cycle-xmas-2024', name: 'Natal 2024', startDate: '2024-11-01T00:00:00Z', endDate: '2024-12-25T23:59:59Z', isActive: false, createdAt: '2024-01-01T00:00:00Z' },
  ];
}

export async function createPurchaseCycle(cycleData: Omit<PurchaseCycle, 'cycleId' | 'createdAt'>): Promise<PurchaseCycle> {
  console.log('createPurchaseCycle called with:', cycleData);
  const newCycle: PurchaseCycle = {
    ...cycleData,
    cycleId: `cycle-${Date.now().toString()}`,
    createdAt: new Date().toISOString(),
  };
  return newCycle;
}

export async function updatePurchaseCycle(cycleId: string, cycleData: Partial<Omit<PurchaseCycle, 'cycleId' | 'createdAt'>>): Promise<PurchaseCycle> {
  console.log('updatePurchaseCycle called for ID', cycleId, 'with:', cycleData);
  const cycles = await fetchPurchaseCycles();
  const existingCycle = cycles.find(s => s.cycleId === cycleId);
  if (!existingCycle) throw new Error("PurchaseCycle not found");
  return { ...existingCycle, ...cycleData };
}

export async function deletePurchaseCycle(cycleId: string): Promise<void> {
  console.log('deletePurchaseCycle called for ID:', cycleId);
}

export async function fetchActivePurchaseCycleTitle(): Promise<string> {
  // TODO: Connect to Supabase to get the active purchase cycle name
  const activeCycles = (await fetchPurchaseCycles()).filter(pc => pc.isActive);
  if (activeCycles.length > 0) return activeCycles[0].name;
  return "Nossos Chocolates"; // Placeholder
}


// CYCLE PRODUCTS
// Placeholder functions for CycleProduct - to be implemented
export async function fetchCycleProducts(cycleId: string): Promise<CycleProduct[]> {
  console.log('fetchCycleProducts for cycleId:', cycleId);
  // Simulate some cycle products
  if (cycleId === 'cycle-easter-2025') {
    return [
      { cycleProductId: 'cp-1', cycleId: 'cycle-easter-2025', productId: 'prod-1', productNameSnapshot: 'Ovo Praliné Amargo (Páscoa 2025)', priceInCycle: 139.90, isAvailableInCycle: true, displayImageUrl: 'https://placehold.co/400x300.png?text=Ovo+Pascoa' },
      { cycleProductId: 'cp-2', cycleId: 'cycle-easter-2025', productId: 'prod-2', productNameSnapshot: 'Caixa de Bombons Finos (Páscoa 2025)', priceInCycle: 99.50, isAvailableInCycle: true, displayImageUrl: 'https://placehold.co/400x300.png?text=Bombons+Pascoa' },
    ];
  }
  return [];
}


// CART & ORDERS
// These cart functions will need to be updated to use CycleProductId and priceInCycle
export async function fetchCartItems(): Promise<CartItem[]> {
  console.log('fetchCartItems called');
  // This needs to be updated to reflect CartItem structure with cycleProductId
  // For now, providing placeholder data that roughly matches old structure to avoid immediate breaks elsewhere
  return [
    { cycleProductId: 'cp-1', productId: 'prod-1', name: 'Ovo Praliné Amargo', price: 139.90, quantity: 1, imageUrl: 'https://placehold.co/80x80.png?text=P1', description: 'Delicioso ovo de chocolate' },
    { cycleProductId: 'cp-2', productId: 'prod-2', name: 'Caixa de Bombons Finos', price: 99.50, quantity: 2, imageUrl: 'https://placehold.co/80x80.png?text=P2', description: 'Seleção especial' },
  ];
}

export async function addToCart(cycleProduct: CycleProduct, quantity: number): Promise<void> {
  console.log('addToCart called for cycleProduct:', cycleProduct.productNameSnapshot, 'quantity:', quantity);
  // TODO: Implement Supabase logic or local storage. Use cycleProduct.cycleProductId and cycleProduct.priceInCycle
}

export async function updateCartItemQuantity(cycleProductId: string, quantity: number): Promise<void> {
  console.log('updateCartItemQuantity called for cycleProductId:', cycleProductId, 'new quantity:', quantity);
}

export async function removeFromCart(cycleProductId: string): Promise<void> {
  console.log('removeFromCart called for cycleProductId:', cycleProductId);
}

export async function processCheckout(cartItems: CartItem[]): Promise<Order> {
  console.log('processCheckout called with cart:', cartItems);
  const orderTotalAmount = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const orderItems: OrderItem[] = cartItems.map(ci => ({
    productId: ci.productId,
    cycleProductId: ci.cycleProductId,
    productName: ci.name,
    quantity: ci.quantity,
    priceAtPurchase: ci.price, // This should be priceInCycle from CycleProduct
    lineItemTotal: ci.price * ci.quantity,
  }));

  return {
    orderId: `order-${Date.now().toString()}`,
    orderNumber: `ORD-${Date.now().toString().slice(-5)}`,
    userId: 'mock-user-id', // Replace with actual user ID
    customerNameSnapshot: 'Mocked Customer Name', // Replace with actual
    customerWhatsappSnapshot: '123456789', // Replace with actual
    cycleId: 'cycle-easter-2025', // Replace with actual active cycle ID
    items: orderItems,
    orderTotalAmount,
    orderStatus: 'Pending Payment',
    paymentStatus: 'Unpaid',
    orderDate: new Date().toISOString(),
  };
}

export async function fetchAdminOrders(): Promise<Order[]> {
  console.log('fetchAdminOrders called');
  const cartItems = await fetchCartItems(); // Re-use for placeholder data
   const orderTotalAmount = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
   const orderItems: OrderItem[] = cartItems.map(ci => ({
    productId: ci.productId,
    cycleProductId: ci.cycleProductId,
    productName: ci.name,
    quantity: ci.quantity,
    priceAtPurchase: ci.price,
    lineItemTotal: ci.price * ci.quantity,
  }));

  return [
    { orderId: 'order123', orderNumber: 'ORD-00123', userId: 'user-1', customerNameSnapshot: 'João Silva', customerWhatsappSnapshot: '5511999998888', cycleId: 'cycle-easter-2025', items: orderItems, orderTotalAmount: 219.40, orderStatus: 'Pending Payment', paymentStatus: 'Unpaid', orderDate: '2024-05-20T10:30:00Z' },
    { orderId: 'order124', orderNumber: 'ORD-00124', userId: 'user-2', customerNameSnapshot: 'Maria Oliveira', customerWhatsappSnapshot: '5521988887777', cycleId: 'cycle-xmas-2024', items: [orderItems[1]], orderTotalAmount: 89.50, orderStatus: 'Preparing', paymentStatus: 'Paid', orderDate: '2024-05-19T15:00:00Z' },
  ];
}

export async function updateOrderStatus(orderId: string, status: Order['orderStatus'], paymentStatus?: Order['paymentStatus']): Promise<Order> {
  console.log('updateOrderStatus called for order ID:', orderId, 'new orderStatus:', status, 'new paymentStatus:', paymentStatus);
  const orders = await fetchAdminOrders();
  const order = orders.find(o => o.orderId === orderId);
  if (!order) throw new Error('Order not found');
  const updatedOrder = { ...order, orderStatus: status };
  if (paymentStatus) {
    updatedOrder.paymentStatus = paymentStatus;
  }
  return updatedOrder;
}
