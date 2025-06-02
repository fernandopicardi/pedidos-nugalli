
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
  try {
    // Immediately call callback with current cart state for initial load
    const currentCart = typeof localStorage !== 'undefined' ? JSON.parse(localStorage.getItem('mockCart') || '[]') : [...MOCK_CART_ITEMS];
    callback(currentCart);
  } catch (e) {
    console.error("Error in initial cart update callback:", e);
  }
  return () => {
    cartUpdateListeners = cartUpdateListeners.filter(cb => cb !== callback);
  };
}

// Persist cart to localStorage for a more realistic mock
function saveCartToLocalStorage() {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('mockCart', JSON.stringify(MOCK_CART_ITEMS));
  }
}

function loadCartFromLocalStorage(): CartItem[] {
  if (typeof localStorage !== 'undefined') {
    const storedCart = localStorage.getItem('mockCart');
    if (storedCart) {
      return JSON.parse(storedCart);
    }
  }
  return [];
}

// Initialize cart from localStorage
let MOCK_CART_ITEMS: CartItem[] = loadCartFromLocalStorage();


// AUTH
const MOCK_USERS: User[] = [
    { userId: 'admin-user', email: 'admin@nugali.com', displayName: 'Nugali Admin', role: 'admin', createdAt: new Date().toISOString() },
    { userId: 'fp-admin-user', email: 'fernandopicardi@gmail.com', displayName: 'Fernando Picardi', role: 'admin', createdAt: new Date().toISOString() },
    { userId: 'nn-admin-user', email: 'naiara.nasmaste@gmail.com', displayName: 'Naiara Nasmaste', role: 'admin', createdAt: new Date().toISOString() },
    { userId: 'test-user', email: 'user@nugali.com', displayName: 'Cliente Teste', role: 'customer', whatsapp: '5547999998888', createdAt: new Date().toISOString() },
    { userId: 'user-ana', email: 'ana.silva@example.com', displayName: 'Ana Silva', role: 'customer', whatsapp: '5521987654321', createdAt: '2023-10-15T00:00:00Z' },
    { userId: 'user-carlos', email: 'carlos.pereira@example.com', displayName: 'Carlos Pereira', role: 'customer', createdAt: '2023-11-01T00:00:00Z' },
];

export async function signInWithEmail(email: string, password: string) {
  console.log('signInWithEmail called with:', email, password);

  const foundUser = MOCK_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());

  if (foundUser) {
    let correctPassword = false;
    if (foundUser.role === 'admin' && password === 'adminpass') {
      correctPassword = true;
    } else if (foundUser.role === 'customer' && foundUser.email === 'user@nugali.com' && password === 'userpass') {
      correctPassword = true;
    } else if (foundUser.role === 'customer' && password === 'password123') { // Generic password for other customer mock users
      correctPassword = true;
    }


    if (correctPassword) {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('currentUser', JSON.stringify(foundUser));
      }
      return { user: foundUser, error: null };
    }
  }
  
  return { user: null, error: { message: 'Credenciais inválidas.' } };
}

export async function signUpWithEmail(email: string, password: string, displayName?: string, whatsapp?: string) {
  console.log('signUpWithEmail called with:', email, password, displayName, whatsapp);
  
  if (MOCK_USERS.find(u => u.email.toLowerCase() === email.toLowerCase())) {
    return { user: null, error: { message: 'Este email já está cadastrado.' }};
  }
  
  const newDisplayName = displayName || email.split('@')[0];
  const newUser: User = {
    userId: `new-user-${Date.now()}`,
    email,
    displayName: newDisplayName,
    whatsapp: whatsapp || undefined,
    role: 'customer', // New sign-ups are always customers
    createdAt: new Date().toISOString(),
  };
  MOCK_USERS.push(newUser);
  // For mock purposes, log them in directly or require login after signup.
  // Here, we won't log them in automatically to test the login flow separately.
  return { user: newUser, error: null };
}

export async function signOut() {
  console.log('signOut called');
   if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('currentUser');
      // Also clear cart on sign out for this mock, or handle cart persistence per user if needed later
      // MOCK_CART_ITEMS = [];
      // saveCartToLocalStorage();
      // notifyCartUpdateListeners(); 
    }
  return { error: null };
}

export async function getCurrentUser(): Promise<User | null> {
  if (typeof localStorage !== 'undefined') {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      return JSON.parse(storedUser);
    }
  }
  return null; 
}


export async function checkAdminRole(): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.role === 'admin';
}


// MASTER PRODUCTS - For Admin CRUD
const MOCK_MASTER_PRODUCTS: Product[] = [
  {
    productId: 'prod-1',
    name: 'Ovo Praliné Amargo',
    description: 'Crocante e intenso, com pedaços de avelã caramelizada e cobertura de chocolate amargo 70% cacau. Uma experiência única para os amantes de sabores marcantes.',
    imageUrls: ['https://placehold.co/600x400.png?text=Ovo+Praline', 'https://placehold.co/600x400.png?text=Praline+Detail'],
    attributes: { "categoria": ["Recheado"], "peso": ["500g"], "cacau": ["70%"], "dietary": ["sem glúten"], "unidade": ["unidade"] },
    isSeasonal: true, createdAt: '2023-01-01T00:00:00Z', updatedAt: '2023-01-05T00:00:00Z'
  },
  {
    productId: 'prod-2',
    name: 'Caixa de Bombons Finos',
    description: 'Uma seleção dos nossos melhores bombons artesanais, com recheios variados como ganache de maracujá, trufa clássica e caramelo salgado. Perfeito para presentear.',
    imageUrls: ['https://placehold.co/600x400.png?text=Bombons+Finos'],
    attributes: { "categoria": ["Recheado"], "peso": ["200g"], "unidades": ["12"], "sabor": ["sortidos"], "dietary": ["Kosher", "sem glúten"], "unidade": ["caixa"] },
    isSeasonal: true, createdAt: '2023-01-02T00:00:00Z', updatedAt: '2023-01-02T00:00:00Z'
  },
  {
    productId: 'prod-3',
    name: 'Panettone Trufado',
    description: 'Com massa de fermentação natural e generoso recheio de trufa de chocolate ao leite, coberto com chocolate Nugali. Ideal para o Natal.',
    imageUrls: ['https://placehold.co/600x400.png?text=Panettone+Trufado'],
    attributes: { "categoria": ["Recheado"], "peso": ["750g"], "cacau": ["45%"], "dietary": ["sem lactose"], "unidade": ["unidade"] },
    isSeasonal: true, createdAt: '2023-01-03T00:00:00Z', updatedAt: '2023-01-03T00:00:00Z'
  },
  {
    productId: 'prod-4',
    name: 'Tablete Ao Leite Clássico',
    description: 'Nosso chocolate ao leite tradicional, com 45% de cacau, cremoso e com dulçor equilibrado. Uma receita consagrada da Nugali.',
    imageUrls: ['https://placehold.co/600x400.png?text=Tablete+Ao+Leite'],
    attributes: { "categoria": ["Tablete"], "peso": ["100g"], "cacau": ["45%"], "dietary": ["sem glúten"], "unidade": ["tablete"] },
    isSeasonal: false, createdAt: '2023-01-04T00:00:00Z', updatedAt: '2023-01-04T00:00:00Z'
  },
  {
    productId: 'prod-5',
    name: 'Barra Vegana 80% Cacau',
    description: 'Intenso sabor de cacau de origem única, esta barra com 80% de sólidos de cacau é totalmente vegana, sem lactose e sem glúten. Para paladares exigentes.',
    imageUrls: ['https://placehold.co/600x400.png?text=Barra+Vegana+80'],
    attributes: { "categoria": ["Barra"], "peso": ["85g"], "cacau": ["80%"], "dietary": ["Vegano", "sem lactose", "sem glúten"], "unidade": ["barra"] },
    isSeasonal: false, createdAt: '2023-01-05T00:00:00Z', updatedAt: '2023-01-05T00:00:00Z'
  },
  {
    productId: 'prod-6',
    name: 'Gotas de Chocolate 63%',
    description: 'Perfeitas para suas receitas de confeitaria, nosso chocolate 63% cacau em formato de gotas garante derretimento uniforme e sabor autêntico.',
    imageUrls: ['https://placehold.co/600x400.png?text=Gotas+63'],
    attributes: { "categoria": ["Gotas"], "peso": ["1kg"], "cacau": ["63%"], "dietary": ["sem glúten"], "unidade": ["pacote"] },
    isSeasonal: false, createdAt: '2023-01-06T00:00:00Z', updatedAt: '2023-01-06T00:00:00Z'
  },
   {
    productId: 'prod-7',
    name: 'Pastilhas de Chocolate Zero Açúcar',
    description: 'Deliciosas pastilhas de chocolate 70% cacau, sem adição de açúcar, adoçadas com maltitol. Sabor intenso com menos culpa.',
    imageUrls: ['https://placehold.co/600x400.png?text=Pastilhas+Zero'],
    attributes: { "categoria": ["Pastilhas"], "peso": ["40g"], "cacau": ["70%"], "dietary": ["Zero açúcar", "sem glúten"], "unidade": ["pacote"] },
    isSeasonal: false, createdAt: '2023-01-07T00:00:00Z', updatedAt: '2023-01-07T00:00:00Z'
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
  { cycleId: 'cycle-easter-2025', name: 'Páscoa 2025', startDate: '2025-03-01T08:00:00Z', endDate: '2025-04-20T23:59:00Z', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { cycleId: 'cycle-xmas-2024', name: 'Natal 2024', startDate: '2024-11-01T10:00:00Z', endDate: '2024-12-25T23:00:00Z', isActive: false, createdAt: '2024-01-01T00:00:00Z' },
  { cycleId: 'cycle-mothers-2025', name: 'Dia das Mães 2025', startDate: '2025-04-21T00:00:00Z', endDate: '2025-05-10T23:59:59Z', isActive: false, createdAt: '2024-02-01T00:00:00Z' },
];

export async function fetchPurchaseCycles(): Promise<PurchaseCycle[]> {
  console.log('fetchPurchaseCycles called');
  return [...MOCK_PURCHASE_CYCLES].sort((a,b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
}

export async function createPurchaseCycle(cycleData: Omit<PurchaseCycle, 'cycleId' | 'createdAt'>): Promise<PurchaseCycle> {
  console.log('createPurchaseCycle called with:', cycleData);
  if (cycleData.isActive) { // Ensure only one cycle is active
    MOCK_PURCHASE_CYCLES.forEach(c => c.isActive = false);
  }
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

  if (cycleData.isActive && MOCK_PURCHASE_CYCLES[cycleIndex].isActive === false) { // If activating this cycle
    MOCK_PURCHASE_CYCLES.forEach(c => { if (c.cycleId !== cycleId) c.isActive = false; });
  }

  MOCK_PURCHASE_CYCLES[cycleIndex] = { ...MOCK_PURCHASE_CYCLES[cycleIndex], ...cycleData };
  return MOCK_PURCHASE_CYCLES[cycleIndex];
}

export async function deletePurchaseCycle(cycleId: string): Promise<void> {
  console.log('deletePurchaseCycle called for ID:', cycleId);
   const index = MOCK_PURCHASE_CYCLES.findIndex(s => s.cycleId === cycleId);
  if (index > -1) MOCK_PURCHASE_CYCLES.splice(index, 1);
  // Also remove associated cycle products
  MOCK_CYCLE_PRODUCTS = MOCK_CYCLE_PRODUCTS.filter(cp => cp.cycleId !== cycleId);
}

export async function fetchActivePurchaseCycleTitle(): Promise<string> {
  const activeCycles = MOCK_PURCHASE_CYCLES.filter(pc => pc.isActive);
  if (activeCycles.length > 0) return activeCycles[0].name;
  return "Nossos Chocolates";
}

// CYCLE PRODUCTS - For associating Master Products with Purchase Cycles, defining price, availability
let MOCK_CYCLE_PRODUCTS: CycleProduct[] = [
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
      productId: cp.productId, 
      cycleId: cp.cycleId, 
      name: cp.productNameSnapshot, 
      description: masterProduct.description, 
      price: cp.priceInCycle, 
      imageUrl: cp.displayImageUrl || masterProduct.imageUrls[0] || 'https://placehold.co/400x300.png?text=Nugali', 
      attributes: masterProduct.attributes || {},
      isAvailableInCycle: cp.isAvailableInCycle, 
    };
  }).filter(dp => dp !== null) as DisplayableProduct[];

  return displayableProducts;
}


// CART & ORDERS

export async function fetchCartItems(): Promise<CartItem[]> {
  notifyCartUpdateListeners(); // Ensure listeners are notified with the latest cart from LS
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
  saveCartToLocalStorage();
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
  saveCartToLocalStorage();
  notifyCartUpdateListeners();
}

export async function removeFromCart(cycleProductId: string): Promise<void> {
  console.log('removeFromCart called for cycleProductId:', cycleProductId);
  MOCK_CART_ITEMS = MOCK_CART_ITEMS.filter(item => item.cycleProductId !== cycleProductId);
  saveCartToLocalStorage();
  notifyCartUpdateListeners();
}

const MOCK_ORDERS: Order[] = [
  { 
    orderId: 'order-mock-1', 
    orderNumber: 'ORD-00123', 
    userId: 'user-ana', 
    customerNameSnapshot: 'Ana Silva Exemplo', 
    customerWhatsappSnapshot: '5521987654321', 
    cycleId: 'cycle-easter-2025', 
    items: [
      { productId: 'prod-1', cycleProductId: 'cp-easter-1', productName: 'Ovo Praliné Amargo (Ed. Páscoa)', quantity: 1, priceAtPurchase: 149.90, lineItemTotal: 149.90 },
      { productId: 'prod-2', cycleProductId: 'cp-easter-2', productName: 'Caixa de Bombons Finos (Seleção Páscoa)', quantity: 2, priceAtPurchase: 109.50, lineItemTotal: 219.00 },
    ], 
    orderTotalAmount: 368.90, 
    orderStatus: 'Pending Payment', 
    paymentStatus: 'Unpaid', 
    orderDate: '2024-05-20T10:30:00Z' 
  },
  { 
    orderId: 'order-mock-2', 
    orderNumber: 'ORD-00124', 
    userId: 'user-carlos', 
    customerNameSnapshot: 'Carlos Pereira Exemplo', 
    customerWhatsappSnapshot: '5511998877665', 
    cycleId: 'cycle-easter-2025', 
    items: [
      { productId: 'prod-5', cycleProductId: 'cp-easter-5', productName: 'Barra Vegana 80% Cacau (Ed. Páscoa)', quantity: 3, priceAtPurchase: 35.00, lineItemTotal: 105.00 },
    ], 
    orderTotalAmount: 105.00, 
    orderStatus: 'Preparing', 
    paymentStatus: 'Paid', 
    orderDate: '2024-05-19T15:00:00Z' 
  },
  { 
    orderId: 'order-mock-3', 
    orderNumber: 'ORD-00125', 
    userId: 'user-ana', 
    customerNameSnapshot: 'Ana Silva Exemplo', 
    customerWhatsappSnapshot: '5521987654321', 
    cycleId: 'cycle-xmas-2024', 
    items: [{productId: 'prod-3', cycleProductId: 'cp-xmas-3', productName: 'Panettone Trufado (Natalino)', quantity: 1, priceAtPurchase: 89.90, lineItemTotal: 89.90 }], 
    orderTotalAmount: 89.90, 
    orderStatus: 'Completed', 
    paymentStatus: 'Paid', 
    orderDate: '2023-12-15T11:00:00Z' 
  }
];


export async function processCheckout(cartItems: CartItem[]): Promise<Order> {
  console.log('processCheckout called with cart:', cartItems);
  const activeCycle = MOCK_PURCHASE_CYCLES.find(pc => pc.isActive);
  if (!activeCycle) throw new Error("No active purchase cycle found for checkout.");

  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error("User must be logged in to checkout.");


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
    userId: currentUser.userId, 
    customerNameSnapshot: currentUser.displayName, 
    customerWhatsappSnapshot: currentUser.whatsapp || '',
    cycleId: activeCycle.cycleId,
    items: orderItems,
    orderTotalAmount,
    orderStatus: "Pending Payment", // Initial status
    paymentStatus: "Unpaid",      // Initial status
    orderDate: new Date().toISOString(),
  };
  MOCK_ORDERS.push(newOrder);
  MOCK_CART_ITEMS = []; 
  saveCartToLocalStorage();
  notifyCartUpdateListeners(); 
  return newOrder;
}

export async function fetchAdminOrders(): Promise<Order[]> {
  console.log('fetchAdminOrders called');
  return [...MOCK_ORDERS];
}


export async function updateOrderStatus(orderId: string, newOrderStatus: Order['orderStatus'], newPaymentStatus?: Order['paymentStatus']): Promise<Order> {
  console.log('updateOrderStatus called for order ID:', orderId, 'new orderStatus:', newOrderStatus, 'new paymentStatus:', newPaymentStatus);
  const orderIndex = MOCK_ORDERS.findIndex(o => o.orderId === orderId);
  if (orderIndex === -1) throw new Error('Order not found');

  MOCK_ORDERS[orderIndex].orderStatus = newOrderStatus;
  
  // If a specific payment status is provided, use it
  if (newPaymentStatus) {
    MOCK_ORDERS[orderIndex].paymentStatus = newPaymentStatus;
  } else { // Otherwise, apply some default logic based on order status
    if (newOrderStatus === "Payment Confirmed" || newOrderStatus === "Preparing" || newOrderStatus === "Ready for Pickup/Delivery" || newOrderStatus === "Completed") {
        if (MOCK_ORDERS[orderIndex].paymentStatus === "Unpaid") {
            MOCK_ORDERS[orderIndex].paymentStatus = "Paid";
        }
    } else if (newOrderStatus === "Cancelled") {
        if (MOCK_ORDERS[orderIndex].paymentStatus === "Paid") {
            MOCK_ORDERS[orderIndex].paymentStatus = "Refunded";
        }
    } else if (newOrderStatus === "Pending Payment") {
        // If moving back to Pending Payment, reset payment status unless it was already Refunded
        if (MOCK_ORDERS[orderIndex].paymentStatus !== "Refunded") {
            MOCK_ORDERS[orderIndex].paymentStatus = "Unpaid";
        }
    }
  }
  
  return MOCK_ORDERS[orderIndex];
}

// --- Admin Dashboard Metrics ---
export async function fetchActiveCycleMetrics(): Promise<{ activeCycle: PurchaseCycle | null; pendingOrdersCount: number; totalSalesActiveCycle: number; }> {
  console.log('fetchActiveCycleMetrics called');
  const activeCycle = MOCK_PURCHASE_CYCLES.find(pc => pc.isActive) || null;
  let pendingOrdersCount = 0;
  let totalSalesActiveCycle = 0;

  if (activeCycle) {
    const ordersInActiveCycle = MOCK_ORDERS.filter(order => order.cycleId === activeCycle.cycleId);
    pendingOrdersCount = ordersInActiveCycle.filter(order => order.orderStatus === "Pending Payment" || order.orderStatus === "Preparing" || order.orderStatus === "Payment Confirmed").length;
    totalSalesActiveCycle = ordersInActiveCycle
      .filter(order => order.paymentStatus === "Paid")
      .reduce((sum, order) => sum + order.orderTotalAmount, 0);
  }
  
  return { activeCycle, pendingOrdersCount, totalSalesActiveCycle };
}

// --- Placeholder for Customer Data Viewing (Admin) ---
export async function fetchAdminUsers(): Promise<User[]> {
    console.log('fetchAdminUsers called');
    return MOCK_USERS.filter(user => user.role === 'customer');
}

    