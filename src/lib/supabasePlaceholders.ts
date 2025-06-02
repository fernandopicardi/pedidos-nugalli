
import type { Product, PurchaseCycle, Order, CartItem, CycleProduct, User, DisplayableProduct, OrderItem } from '@/types';

// AUTH
export async function signInWithEmail(email: string, password: string) {
  console.log('signInWithEmail called with:', email, password);
  if (email === 'admin@nugali.com' && password === 'adminpass') {
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
  console.log('signOut called');
  return { error: null };
}

export async function getCurrentUser(): Promise<User | null> {
  console.log('getCurrentUser called');
  return true ? { userId: 'admin-user', email: 'admin@nugali.com', displayName: 'Admin User', role: 'admin', createdAt: new Date().toISOString() } : null;
}

export async function checkAdminRole(): Promise<boolean> {
  console.log('checkAdminRole called');
  return true; 
}


// MASTER PRODUCTS - For Admin CRUD
const MOCK_MASTER_PRODUCTS: Product[] = [
  { productId: 'prod-1', name: 'Ovo Praliné Amargo (Master)', description: 'Master description for Praliné. Crocante e intenso.', imageUrls: ['https://placehold.co/600x400.png?text=Master+P1+Img1', 'https://placehold.co/600x400.png?text=Master+P1+Img2'], attributes: {"peso": ["500g"], "cacau": ["70%"], "dietary": ["sem glúten"]}, isSeasonal: true, createdAt: '2023-01-01T00:00:00Z', updatedAt: '2023-01-05T00:00:00Z' },
  { productId: 'prod-2', name: 'Caixa de Bombons Finos (Master)', description: 'Master description for Bombons. Uma seleção dos nossos melhores.', imageUrls: ['https://placehold.co/600x400.png?text=Master+P2+Img1'], attributes: {"unidades": ["12"], "sabor": ["sortidos"]}, isSeasonal: true, createdAt: '2023-01-02T00:00:00Z', updatedAt: '2023-01-02T00:00:00Z' },
  { productId: 'prod-3', name: 'Panettone Trufado (Master)', description: 'Master description for Panettone. Ideal para o Natal.', imageUrls: ['https://placehold.co/600x400.png?text=Master+P3+Img1'], attributes: {"peso": ["750g"]}, isSeasonal: true, createdAt: '2023-01-03T00:00:00Z', updatedAt: '2023-01-03T00:00:00Z' },
  { productId: 'prod-4', name: 'Tablete Ao Leite Clássico (Master)', description: 'Nosso chocolate ao leite tradicional, cremoso e delicioso.', imageUrls: ['https://placehold.co/600x400.png?text=Master+P4+Img1'], attributes: {"peso": ["100g"], "cacau": ["40%"]}, isSeasonal: false, createdAt: '2023-01-04T00:00:00Z', updatedAt: '2023-01-04T00:00:00Z' },
];

export async function fetchAdminProducts(): Promise<Product[]> {
  console.log('fetchAdminProducts called');
  return [...MOCK_MASTER_PRODUCTS];
}

export async function createProduct(productData: Omit<Product, 'productId' | 'createdAt' | 'updatedAt'>): Promise<Product> {
  console.log('createProduct called with:', productData);
  const newProduct: Product = {
    ...productData,
    productId: `prod-${Date.now().toString()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  MOCK_MASTER_PRODUCTS.push(newProduct);
  return newProduct;
}

export async function updateProduct(productId: string, productData: Partial<Omit<Product, 'productId' | 'createdAt' | 'updatedAt'>>): Promise<Product> {
  console.log('updateProduct called for ID', productId, 'with:', productData);
  const productIndex = MOCK_MASTER_PRODUCTS.findIndex(p => p.productId === productId);
  if (productIndex === -1) throw new Error("Product not found");
  MOCK_MASTER_PRODUCTS[productIndex] = {
    ...MOCK_MASTER_PRODUCTS[productIndex],
    ...productData,
    updatedAt: new Date().toISOString(),
  };
  return MOCK_MASTER_PRODUCTS[productIndex];
}

export async function deleteProduct(productId: string): Promise<void> {
  console.log('deleteProduct called for ID:', productId);
  const index = MOCK_MASTER_PRODUCTS.findIndex(p => p.productId === productId);
  if (index > -1) MOCK_MASTER_PRODUCTS.splice(index, 1);
}

// PURCHASE CYCLES - For Admin CRUD
const MOCK_PURCHASE_CYCLES: PurchaseCycle[] = [
  { cycleId: 'cycle-easter-2025', name: 'Páscoa 2025', startDate: '2025-03-01T00:00:00Z', endDate: '2025-04-20T23:59:59Z', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { cycleId: 'cycle-xmas-2024', name: 'Natal 2024', startDate: '2024-11-01T00:00:00Z', endDate: '2024-12-25T23:59:59Z', isActive: false, createdAt: '2024-01-01T00:00:00Z' },
];

export async function fetchPurchaseCycles(): Promise<PurchaseCycle[]> {
  console.log('fetchPurchaseCycles called');
  return [...MOCK_PURCHASE_CYCLES];
}

export async function createPurchaseCycle(cycleData: Omit<PurchaseCycle, 'cycleId' | 'createdAt'>): Promise<PurchaseCycle> {
  console.log('createPurchaseCycle called with:', cycleData);
  const newCycle: PurchaseCycle = {
    ...cycleData,
    cycleId: `cycle-${Date.now().toString()}`,
    createdAt: new Date().toISOString(),
  };
  MOCK_PURCHASE_CYCLES.push(newCycle);
  return newCycle;
}

export async function updatePurchaseCycle(cycleId: string, cycleData: Partial<Omit<PurchaseCycle, 'cycleId' | 'createdAt'>>): Promise<PurchaseCycle> {
  console.log('updatePurchaseCycle called for ID', cycleId, 'with:', cycleData);
  const cycleIndex = MOCK_PURCHASE_CYCLES.findIndex(s => s.cycleId === cycleId);
  if (cycleIndex === -1) throw new Error("PurchaseCycle not found");
  MOCK_PURCHASE_CYCLES[cycleIndex] = { ...MOCK_PURCHASE_CYCLES[cycleIndex], ...cycleData };
  return MOCK_PURCHASE_CYCLES[cycleIndex];
}

export async function deletePurchaseCycle(cycleId: string): Promise<void> {
  console.log('deletePurchaseCycle called for ID:', cycleId);
   const index = MOCK_PURCHASE_CYCLES.findIndex(s => s.cycleId === cycleId);
  if (index > -1) MOCK_PURCHASE_CYCLES.splice(index, 1);
}

export async function fetchActivePurchaseCycleTitle(): Promise<string> {
  const activeCycles = MOCK_PURCHASE_CYCLES.filter(pc => pc.isActive);
  if (activeCycles.length > 0) return activeCycles[0].name;
  return "Nossos Chocolates";
}

// CYCLE PRODUCTS - For associating Master Products with Purchase Cycles, defining price, availability
const MOCK_CYCLE_PRODUCTS: CycleProduct[] = [
  { cycleProductId: 'cp-easter-1', cycleId: 'cycle-easter-2025', productId: 'prod-1', productNameSnapshot: 'Ovo Praliné Amargo (Ed. Páscoa)', priceInCycle: 149.90, isAvailableInCycle: true, displayImageUrl: 'https://placehold.co/400x300.png?text=Ovo+Pascoa+25' },
  { cycleProductId: 'cp-easter-2', cycleId: 'cycle-easter-2025', productId: 'prod-2', productNameSnapshot: 'Caixa de Bombons Finos (Seleção Páscoa)', priceInCycle: 109.50, isAvailableInCycle: true, displayImageUrl: 'https://placehold.co/400x300.png?text=Bombom+Pascoa+25' },
  { cycleProductId: 'cp-easter-4', cycleId: 'cycle-easter-2025', productId: 'prod-4', productNameSnapshot: 'Tablete Ao Leite Clássico (Especial Páscoa)', priceInCycle: 29.90, isAvailableInCycle: false }, // Not available
  { cycleProductId: 'cp-xmas-3', cycleId: 'cycle-xmas-2024', productId: 'prod-3', productNameSnapshot: 'Panettone Trufado (Natalino)', priceInCycle: 89.90, isAvailableInCycle: true, displayImageUrl: 'https://placehold.co/400x300.png?text=Panettone+Natal+24' },
  { cycleProductId: 'cp-xmas-4', cycleId: 'cycle-xmas-2024', productId: 'prod-4', productNameSnapshot: 'Tablete Ao Leite Clássico (Festivo)', priceInCycle: 25.00, isAvailableInCycle: true, displayImageUrl: 'https://placehold.co/400x300.png?text=Tablete+Natal+24' },
];

export async function fetchCycleProducts(cycleId: string): Promise<CycleProduct[]> {
  console.log('fetchCycleProducts for cycleId:', cycleId);
  return MOCK_CYCLE_PRODUCTS.filter(cp => cp.cycleId === cycleId);
}

// DISPLAYABLE PRODUCTS FOR CLIENT HOMEPAGE
export async function fetchActivePurchaseCycleProducts(): Promise<DisplayableProduct[]> {
  console.log('fetchActivePurchaseCycleProducts (Displayable) called');
  const activeCycle = MOCK_PURCHASE_CYCLES.find(pc => pc.isActive);
  if (!activeCycle) {
    return [];
  }

  const masterProducts = await fetchAdminProducts(); // Using this as the source of all master products
  const cycleProductsForActiveCycle = MOCK_CYCLE_PRODUCTS.filter(
    cp => cp.cycleId === activeCycle.cycleId && cp.isAvailableInCycle
  );

  const displayableProducts: DisplayableProduct[] = cycleProductsForActiveCycle.map(cp => {
    const masterProduct = masterProducts.find(mp => mp.productId === cp.productId);
    if (!masterProduct) {
      // This case should ideally not happen if data is consistent
      console.warn(`Master product with ID ${cp.productId} not found for cycle product ${cp.cycleProductId}`);
      return null; // Or handle as an error
    }
    return {
      cycleProductId: cp.cycleProductId,
      productId: cp.productId,
      cycleId: cp.cycleId,
      name: cp.productNameSnapshot,
      description: masterProduct.description,
      price: cp.priceInCycle,
      imageUrl: cp.displayImageUrl || masterProduct.imageUrls[0] || 'https://placehold.co/400x300.png?text=Nugali',
      attributes: masterProduct.attributes,
      isAvailableInCycle: cp.isAvailableInCycle,
    };
  }).filter(dp => dp !== null) as DisplayableProduct[];
  
  return displayableProducts;
}


// CART & ORDERS
let MOCK_CART_ITEMS: CartItem[] = [
  { cycleProductId: 'cp-easter-1', productId: 'prod-1', name: 'Ovo Praliné Amargo (Ed. Páscoa)', price: 149.90, quantity: 1, imageUrl: 'https://placehold.co/80x80.png?text=P1Cart', description: 'Delicioso ovo de chocolate' },
  { cycleProductId: 'cp-easter-2', productId: 'prod-2', name: 'Caixa de Bombons Finos (Seleção Páscoa)', price: 109.50, quantity: 2, imageUrl: 'https://placehold.co/80x80.png?text=P2Cart', description: 'Seleção especial' },
];

export async function fetchCartItems(): Promise<CartItem[]> {
  console.log('fetchCartItems called');
  return [...MOCK_CART_ITEMS];
}

export async function addToCart(product: DisplayableProduct, quantity: number): Promise<void> {
  console.log('addToCart called for product:', product.name, 'cycleProductId:', product.cycleProductId, 'quantity:', quantity);
  const existingItemIndex = MOCK_CART_ITEMS.findIndex(item => item.cycleProductId === product.cycleProductId);
  if (existingItemIndex > -1) {
    MOCK_CART_ITEMS[existingItemIndex].quantity += quantity;
  } else {
    MOCK_CART_ITEMS.push({
      cycleProductId: product.cycleProductId,
      productId: product.productId,
      name: product.name,
      price: product.price,
      quantity: quantity,
      imageUrl: product.imageUrl,
      description: product.description.substring(0,50) + "...", // Shorten description for cart
    });
  }
}

export async function updateCartItemQuantity(cycleProductId: string, quantity: number): Promise<void> {
  console.log('updateCartItemQuantity called for cycleProductId:', cycleProductId, 'new quantity:', quantity);
  const itemIndex = MOCK_CART_ITEMS.findIndex(item => item.cycleProductId === cycleProductId);
  if (itemIndex > -1) {
    if (quantity <= 0) {
      MOCK_CART_ITEMS.splice(itemIndex, 1); // Remove if quantity is 0 or less
    } else {
      MOCK_CART_ITEMS[itemIndex].quantity = quantity;
    }
  }
}

export async function removeFromCart(cycleProductId: string): Promise<void> {
  console.log('removeFromCart called for cycleProductId:', cycleProductId);
  MOCK_CART_ITEMS = MOCK_CART_ITEMS.filter(item => item.cycleProductId !== cycleProductId);
}

const MOCK_ORDERS: Order[] = [];

export async function processCheckout(cartItems: CartItem[]): Promise<Order> {
  console.log('processCheckout called with cart:', cartItems);
  const activeCycle = MOCK_PURCHASE_CYCLES.find(pc => pc.isActive);
  if (!activeCycle) throw new Error("No active purchase cycle found for checkout.");

  const orderTotalAmount = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const orderItems: OrderItem[] = cartItems.map(ci => ({
    productId: ci.productId,
    cycleProductId: ci.cycleProductId,
    productName: ci.name,
    quantity: ci.quantity,
    priceAtPurchase: ci.price,
    lineItemTotal: ci.price * ci.quantity,
  }));

  const newOrder: Order = {
    orderId: `order-${Date.now().toString()}`,
    orderNumber: `ORD-${Date.now().toString().slice(-5)}`,
    userId: 'test-user', // Placeholder, replace with actual user ID
    customerNameSnapshot: 'Cliente Teste Checkout', // Placeholder
    customerWhatsappSnapshot: '55123456789', // Placeholder
    cycleId: activeCycle.cycleId,
    items: orderItems,
    orderTotalAmount,
    orderStatus: 'Pending Payment',
    paymentStatus: 'Unpaid',
    orderDate: new Date().toISOString(),
  };
  MOCK_ORDERS.push(newOrder);
  MOCK_CART_ITEMS = []; // Clear cart after checkout
  return newOrder;
}

export async function fetchAdminOrders(): Promise<Order[]> {
  console.log('fetchAdminOrders called');
  // Simulate some existing orders if MOCK_ORDERS is empty for demo
  if (MOCK_ORDERS.length === 0) {
    const placeholderOrderItems: OrderItem[] = [
      { productId: 'prod-1', cycleProductId: 'cp-easter-1', productName: 'Ovo Praliné Amargo (Ed. Páscoa)', quantity: 1, priceAtPurchase: 149.90, lineItemTotal: 149.90 },
      { productId: 'prod-2', cycleProductId: 'cp-easter-2', productName: 'Caixa de Bombons Finos (Seleção Páscoa)', quantity: 1, priceAtPurchase: 109.50, lineItemTotal: 109.50 },
    ];
     MOCK_ORDERS.push(
      { orderId: 'order-mock-1', orderNumber: 'ORD-00123', userId: 'user-1', customerNameSnapshot: 'João Silva Exemplo', customerWhatsappSnapshot: '5511999998888', cycleId: 'cycle-easter-2025', items: placeholderOrderItems, orderTotalAmount: 259.40, orderStatus: 'Pending Payment', paymentStatus: 'Unpaid', orderDate: '2024-05-20T10:30:00Z' },
      { orderId: 'order-mock-2', orderNumber: 'ORD-00124', userId: 'user-2', customerNameSnapshot: 'Maria Oliveira Exemplo', customerWhatsappSnapshot: '5521988887777', cycleId: 'cycle-easter-2025', items: [placeholderOrderItems[1]], orderTotalAmount: 109.50, orderStatus: 'Preparing', paymentStatus: 'Paid', orderDate: '2024-05-19T15:00:00Z' }
    );
  }
  return [...MOCK_ORDERS];
}

export async function updateOrderStatus(orderId: string, status: Order['orderStatus'], paymentStatus?: Order['paymentStatus']): Promise<Order> {
  console.log('updateOrderStatus called for order ID:', orderId, 'new orderStatus:', status, 'new paymentStatus:', paymentStatus);
  const orderIndex = MOCK_ORDERS.findIndex(o => o.orderId === orderId);
  if (orderIndex === -1) throw new Error('Order not found');
  
  MOCK_ORDERS[orderIndex].orderStatus = status;
  if (paymentStatus) {
    MOCK_ORDERS[orderIndex].paymentStatus = paymentStatus;
  }
  return MOCK_ORDERS[orderIndex];
}
