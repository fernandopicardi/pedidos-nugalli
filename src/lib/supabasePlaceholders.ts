
import type { Product, PurchaseCycle, Order, CartItem, CycleProduct, User, DisplayableProduct, OrderItem } from '@/types';

// --- Cart Update Listener System ---
let cartUpdateListeners: Array<(cartItems: CartItem[]) => void> = [];

function notifyCartUpdateListeners() {
  const currentCart = [...MOCK_CART_ITEMS];
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
  // Immediately provide current state to the new subscriber
  try {
    callback([...MOCK_CART_ITEMS]);
  } catch (e) {
    console.error("Error in initial cart update callback:", e);
  }
  // Return an unsubscribe function
  return () => {
    cartUpdateListeners = cartUpdateListeners.filter(cb => cb !== callback);
  };
}
// Note: unsubscribeFromCartUpdates is not explicitly needed if the subscribe function returns an unsubscribe callback.

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

export async function signUpWithEmail(email: string, password: string, displayName?: string, whatsapp?: string) {
  console.log('signUpWithEmail called with:', email, password, displayName, whatsapp);
  const newDisplayName = displayName || email.split('@')[0];
  const newUser: User = {
    userId: `new-user-${Date.now()}`,
    email,
    displayName: newDisplayName,
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
  // Simulate admin user for testing purposes
  return { userId: 'admin-user', email: 'admin@nugali.com', displayName: 'Admin User', role: 'admin', createdAt: new Date().toISOString() };
  // return null; // Simulate no user logged in
}

export async function checkAdminRole(): Promise<boolean> {
  console.log('checkAdminRole called');
  const user = await getCurrentUser();
  return user?.role === 'admin';
}


// MASTER PRODUCTS - For Admin CRUD
const MOCK_MASTER_PRODUCTS: Product[] = [
  {
    productId: 'prod-1',
    name: 'Ovo Praliné Amargo (Master)',
    description: 'Master description for Praliné. Crocante e intenso, com pedaços de avelã caramelizada e cobertura de chocolate amargo 70% cacau. Uma experiência única para os amantes de sabores marcantes.',
    imageUrls: ['https://placehold.co/600x400.png?text=Master+P1+Img1', 'https://placehold.co/600x400.png?text=Master+P1+Img2'],
    attributes: {
      "categoria": ["Recheado"],
      "peso": ["500g"],
      "cacau": ["70%"],
      "dietary": ["sem glúten"]
    },
    isSeasonal: true,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-05T00:00:00Z'
  },
  {
    productId: 'prod-2',
    name: 'Caixa de Bombons Finos (Master)',
    description: 'Master description for Bombons. Uma seleção dos nossos melhores bombons artesanais, com recheios variados como ganache de maracujá, trufa clássica e caramelo salgado. Perfeito para presentear.',
    imageUrls: ['https://placehold.co/600x400.png?text=Master+P2+Img1'],
    attributes: {
      "categoria": ["Recheado"],
      "unidades": ["12"],
      "sabor": ["sortidos"],
      "peso": ["200g"],
      "dietary": ["Kosher", "sem glúten"]
    },
    isSeasonal: true,
    createdAt: '2023-01-02T00:00:00Z',
    updatedAt: '2023-01-02T00:00:00Z'
  },
  {
    productId: 'prod-3',
    name: 'Panettone Trufado (Master)',
    description: 'Master description for Panettone. Com massa de fermentação natural e generoso recheio de trufa de chocolate ao leite, coberto com chocolate Nugali. Ideal para o Natal.',
    imageUrls: ['https://placehold.co/600x400.png?text=Master+P3+Img1'],
    attributes: {
      "categoria": ["Recheado"],
      "peso": ["750g"],
      "cacau": ["45%"], // Assuming ao leite for panettone
      "dietary": ["sem lactose"] 
    },
    isSeasonal: true,
    createdAt: '2023-01-03T00:00:00Z',
    updatedAt: '2023-01-03T00:00:00Z'
  },
  {
    productId: 'prod-4',
    name: 'Tablete Ao Leite Clássico (Master)',
    description: 'Nosso chocolate ao leite tradicional, com 45% de cacau, cremoso e com dulçor equilibrado. Uma receita consagrada da Nugali.',
    imageUrls: ['https://placehold.co/600x400.png?text=Master+P4+Img1'],
    attributes: {
      "categoria": ["Tablete"],
      "peso": ["100g"],
      "cacau": ["45%"],
      "dietary": ["sem glúten"]
    },
    isSeasonal: false,
    createdAt: '2023-01-04T00:00:00Z',
    updatedAt: '2023-01-04T00:00:00Z'
  },
  {
    productId: 'prod-5',
    name: 'Barra Vegana 80% Cacau (Master)',
    description: 'Intenso sabor de cacau de origem única, esta barra com 80% de sólidos de cacau é totalmente vegana, sem lactose e sem glúten. Para paladares exigentes.',
    imageUrls: ['https://placehold.co/600x400.png?text=Master+P5+Img1'],
    attributes: {
      "categoria": ["Barra"],
      "peso": ["85g"],
      "cacau": ["80%"],
      "dietary": ["Vegano", "sem lactose", "sem glúten"]
    },
    isSeasonal: false,
    createdAt: '2023-01-05T00:00:00Z',
    updatedAt: '2023-01-05T00:00:00Z'
  },
  {
    productId: 'prod-6',
    name: 'Gotas de Chocolate 63% (Master)',
    description: 'Perfeitas para suas receitas de confeitaria, nosso chocolate 63% cacau em formato de gotas garante derretimento uniforme e sabor autêntico.',
    imageUrls: ['https://placehold.co/600x400.png?text=Master+P6+Img1'],
    attributes: {
      "categoria": ["Gotas"],
      "peso": ["1kg"],
      "cacau": ["63%"],
      "dietary": ["sem glúten"]
    },
    isSeasonal: false,
    createdAt: '2023-01-06T00:00:00Z',
    updatedAt: '2023-01-06T00:00:00Z'
  },
   {
    productId: 'prod-7',
    name: 'Pastilhas de Chocolate Zero Açúcar (Master)',
    description: 'Deliciosas pastilhas de chocolate 70% cacau, sem adição de açúcar, adoçadas com maltitol. Sabor intenso com menos culpa.',
    imageUrls: ['https://placehold.co/600x400.png?text=Master+P7+Img1'],
    attributes: {
      "categoria": ["Pastilhas"],
      "peso": ["40g"],
      "cacau": ["70%"],
      "dietary": ["Zero açúcar", "sem glúten"]
    },
    isSeasonal: false,
    createdAt: '2023-01-07T00:00:00Z',
    updatedAt: '2023-01-07T00:00:00Z'
  }
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
  { cycleProductId: 'cp-easter-1', cycleId: 'cycle-easter-2025', productId: 'prod-1', productNameSnapshot: 'Ovo Praliné Amargo (Ed. Páscoa)', priceInCycle: 149.90, isAvailableInCycle: true, displayImageUrl: 'https://placehold.co/400x300.png?text=Ovo+Praline' },
  { cycleProductId: 'cp-easter-2', cycleId: 'cycle-easter-2025', productId: 'prod-2', productNameSnapshot: 'Caixa de Bombons Finos (Seleção Páscoa)', priceInCycle: 109.50, isAvailableInCycle: true, displayImageUrl: 'https://placehold.co/400x300.png?text=Bombons+Pascoa' },
  { cycleProductId: 'cp-easter-4', cycleId: 'cycle-easter-2025', productId: 'prod-4', productNameSnapshot: 'Tablete Ao Leite Clássico (Especial Páscoa)', priceInCycle: 29.90, isAvailableInCycle: true },
  { cycleProductId: 'cp-easter-5', cycleId: 'cycle-easter-2025', productId: 'prod-5', productNameSnapshot: 'Barra Vegana 80% Cacau (Ed. Páscoa)', priceInCycle: 35.00, isAvailableInCycle: true, displayImageUrl: 'https://placehold.co/400x300.png?text=Barra+Vegana' },
  { cycleProductId: 'cp-easter-6', cycleId: 'cycle-easter-2025', productId: 'prod-6', productNameSnapshot: 'Gotas de Chocolate 63% (Especial Páscoa)', priceInCycle: 75.00, isAvailableInCycle: true },
  { cycleProductId: 'cp-easter-7', cycleId: 'cycle-easter-2025', productId: 'prod-7', productNameSnapshot: 'Pastilhas Zero Açúcar (Ed. Páscoa)', priceInCycle: 19.99, isAvailableInCycle: true },

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

  const masterProducts = await fetchAdminProducts();
  const cycleProductsForActiveCycle = MOCK_CYCLE_PRODUCTS.filter(
    cp => cp.cycleId === activeCycle.cycleId && cp.isAvailableInCycle
  );

  const displayableProducts: DisplayableProduct[] = cycleProductsForActiveCycle.map(cp => {
    const masterProduct = masterProducts.find(mp => mp.productId === cp.productId);
    if (!masterProduct) {
      console.warn(`Master product with ID ${cp.productId} not found for cycle product ${cp.cycleProductId}`);
      return null;
    }
    return {
      cycleProductId: cp.cycleProductId,
      productId: cp.productId, // from master Product
      cycleId: cp.cycleId, // from CycleProduct
      name: cp.productNameSnapshot, // from CycleProduct (snapshot)
      description: masterProduct.description, // from master Product
      price: cp.priceInCycle, // from CycleProduct
      imageUrl: cp.displayImageUrl || masterProduct.imageUrls[0] || 'https://placehold.co/400x300.png?text=Nugali', // specific image or fallback
      attributes: masterProduct.attributes || {},
      isAvailableInCycle: cp.isAvailableInCycle, // from CycleProduct
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
  notifyCartUpdateListeners(); // Ensure listeners are updated even on fetch if state could be stale
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
      description: product.description.substring(0,50) + "...",
    });
  }
  notifyCartUpdateListeners();
}

export async function updateCartItemQuantity(cycleProductId: string, quantity: number): Promise<void> {
  console.log('updateCartItemQuantity called for cycleProductId:', cycleProductId, 'new quantity:', quantity);
  const itemIndex = MOCK_CART_ITEMS.findIndex(item => item.cycleProductId === cycleProductId);
  if (itemIndex > -1) {
    if (quantity <= 0) {
      MOCK_CART_ITEMS.splice(itemIndex, 1);
    } else {
      MOCK_CART_ITEMS[itemIndex].quantity = quantity;
    }
  }
  notifyCartUpdateListeners();
}

export async function removeFromCart(cycleProductId: string): Promise<void> {
  console.log('removeFromCart called for cycleProductId:', cycleProductId);
  MOCK_CART_ITEMS = MOCK_CART_ITEMS.filter(item => item.cycleProductId !== cycleProductId);
  notifyCartUpdateListeners();
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
    userId: 'test-user', // Placeholder user
    customerNameSnapshot: 'Cliente Teste Checkout', // Placeholder
    customerWhatsappSnapshot: '55123456789', // Placeholder
    cycleId: activeCycle.cycleId,
    items: orderItems,
    orderTotalAmount,
    orderStatus: "Pending Payment",
    paymentStatus: "Unpaid",
    orderDate: new Date().toISOString(),
  };
  MOCK_ORDERS.push(newOrder);
  MOCK_CART_ITEMS = []; // Clear cart
  notifyCartUpdateListeners(); // Notify that cart is now empty
  return newOrder;
}

// Renamed status from old placeholder to match new Order type
export async function fetchAdminOrders(): Promise<Order[]> {
  console.log('fetchAdminOrders called');
  if (MOCK_ORDERS.length === 0) {
    // Add some more realistic placeholder orders
    const placeholderOrderItems1: OrderItem[] = [
      { productId: 'prod-1', cycleProductId: 'cp-easter-1', productName: 'Ovo Praliné Amargo (Ed. Páscoa)', quantity: 1, priceAtPurchase: 149.90, lineItemTotal: 149.90 },
      { productId: 'prod-2', cycleProductId: 'cp-easter-2', productName: 'Caixa de Bombons Finos (Seleção Páscoa)', quantity: 2, priceAtPurchase: 109.50, lineItemTotal: 219.00 },
    ];
     const placeholderOrderItems2: OrderItem[] = [
      { productId: 'prod-5', cycleProductId: 'cp-easter-5', productName: 'Barra Vegana 80% Cacau (Ed. Páscoa)', quantity: 3, priceAtPurchase: 35.00, lineItemTotal: 105.00 },
    ];
     MOCK_ORDERS.push(
      { orderId: 'order-mock-1', orderNumber: 'ORD-00123', userId: 'user-1', customerNameSnapshot: 'João Silva Exemplo', customerWhatsappSnapshot: '5511999998888', cycleId: 'cycle-easter-2025', items: placeholderOrderItems1, orderTotalAmount: 368.90, orderStatus: 'Pending Payment', paymentStatus: 'Unpaid', orderDate: '2024-05-20T10:30:00Z' },
      { orderId: 'order-mock-2', orderNumber: 'ORD-00124', userId: 'user-2', customerNameSnapshot: 'Maria Oliveira Exemplo', customerWhatsappSnapshot: '5521988887777', cycleId: 'cycle-easter-2025', items: placeholderOrderItems2, orderTotalAmount: 105.00, orderStatus: 'Preparing', paymentStatus: 'Paid', orderDate: '2024-05-19T15:00:00Z' },
      { orderId: 'order-mock-3', orderNumber: 'ORD-00125', userId: 'user-1', customerNameSnapshot: 'João Silva Exemplo', customerWhatsappSnapshot: '5511999998888', cycleId: 'cycle-xmas-2024', items: [{productId: 'prod-3', cycleProductId: 'cp-xmas-3', productName: 'Panettone Trufado (Natalino)', quantity: 1, priceAtPurchase: 89.90, lineItemTotal: 89.90 }], orderTotalAmount: 89.90, orderStatus: 'Completed', paymentStatus: 'Paid', orderDate: '2023-12-15T11:00:00Z' }
    );
  }
  return [...MOCK_ORDERS];
}


export async function updateOrderStatus(orderId: string, newOrderStatus: Order['orderStatus'], newPaymentStatus?: Order['paymentStatus']): Promise<Order> {
  console.log('updateOrderStatus called for order ID:', orderId, 'new orderStatus:', newOrderStatus, 'new paymentStatus:', newPaymentStatus);
  const orderIndex = MOCK_ORDERS.findIndex(o => o.orderId === orderId);
  if (orderIndex === -1) throw new Error('Order not found');

  MOCK_ORDERS[orderIndex].orderStatus = newOrderStatus;
  if (newPaymentStatus) {
    MOCK_ORDERS[orderIndex].paymentStatus = newPaymentStatus;
  }
  // If order status implies payment, update payment status too (example logic)
  if (newOrderStatus === "Payment Confirmed" && MOCK_ORDERS[orderIndex].paymentStatus === "Unpaid") {
    MOCK_ORDERS[orderIndex].paymentStatus = "Paid";
  }
  if (newOrderStatus === "Preparing" && MOCK_ORDERS[orderIndex].paymentStatus === "Unpaid") {
     MOCK_ORDERS[orderIndex].paymentStatus = "Paid"; // Assuming preparing implies payment
  }
  if (newOrderStatus === "Completed" && MOCK_ORDERS[orderIndex].paymentStatus !== "Paid") {
    MOCK_ORDERS[orderIndex].paymentStatus = "Paid";
  }
  if (newOrderStatus === "Cancelled" && MOCK_ORDERS[orderIndex].paymentStatus === "Paid") {
    // Potentially set to "Refunded" or handle refund logic elsewhere
    // MOCK_ORDERS[orderIndex].paymentStatus = "Refunded";
  }

  return MOCK_ORDERS[orderIndex];
}


// Old Season functions (deprecated, effectively replaced by PurchaseCycle)
// These can be removed if no longer referenced anywhere.
// For now, keeping them commented out in case there's a missed reference.
/*
export interface Season { // This will be replaced by PurchaseCycle
  id: string;
  name: string;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  isActive: boolean;
}
const MOCK_SEASONS: Season[] = [
  { id: 'season-1', name: 'Páscoa 2024', startDate: '2024-03-01T00:00:00Z', endDate: '2024-04-20T23:59:59Z', isActive: true },
  { id: 'season-2', name: 'Natal 2023', startDate: '2023-11-01T00:00:00Z', endDate: '2023-12-25T23:59:59Z', isActive: false },
];
export async function fetchSeasons(): Promise<Season[]> { return [...MOCK_SEASONS]; }
export async function createSeason(seasonData: Omit<Season, 'id'>): Promise<Season> {
  const newSeason: Season = { ...seasonData, id: `season-${Date.now()}` };
  MOCK_SEASONS.push(newSeason);
  return newSeason;
}
export async function updateSeason(seasonId: string, seasonData: Partial<Season>): Promise<Season> {
  const seasonIndex = MOCK_SEASONS.findIndex(s => s.id === seasonId);
  if (seasonIndex === -1) throw new Error("Season not found");
  MOCK_SEASONS[seasonIndex] = { ...MOCK_SEASONS[seasonIndex], ...seasonData };
  return MOCK_SEASONS[seasonIndex];
}
export async function deleteSeason(seasonId: string): Promise<void> {
  const index = MOCK_SEASONS.findIndex(s => s.id === seasonId);
  if (index > -1) MOCK_SEASONS.splice(index, 1);
}
*/
