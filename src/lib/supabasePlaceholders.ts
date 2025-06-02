
import type { Product, PurchaseCycle, Order, CartItem, CycleProduct, User, DisplayableProduct, OrderItem, Address } from '@/types';

// --- Cart Update Listener System ---
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
    const storedCart = localStorage.getItem('mockCart');
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
    localStorage.setItem('mockCart', JSON.stringify(cart));
  }
}


// AUTH
const MOCK_USERS: User[] = [
    { 
      userId: 'admin-user', email: 'admin@nugali.com', displayName: 'Nugali Admin', role: 'admin', whatsapp: '5547900000001',
      address: { street: 'Rua Admin', number: '10', complement: '', neighborhood: 'Centro Admin', city: 'Cidade Admin', state: 'AS', zipCode: '10000-001' },
      createdAt: new Date().toISOString() 
    },
    { 
      userId: 'fp-admin-user', email: 'fernandopicardi@gmail.com', displayName: 'Fernando Picardi', role: 'admin', whatsapp: '5547900000002',
      address: { street: 'Rua Fernando', number: '20', complement: 'Apto 1', neighborhood: 'Bairro FP', city: 'Cidade FP', state: 'FS', zipCode: '20000-002' },
      createdAt: new Date().toISOString() 
    },
    { 
      userId: 'nn-admin-user', email: 'naiara.nasmaste@gmail.com', displayName: 'Naiara Nasmaste', role: 'admin', whatsapp: '5547900000003',
      address: { street: 'Rua Naiara', number: '30', complement: '', neighborhood: 'Bairro NN', city: 'Cidade NN', state: 'NS', zipCode: '30000-003' },
      createdAt: new Date().toISOString() 
    },
    { 
      userId: 'test-user', email: 'user@nugali.com', displayName: 'Cliente Teste', role: 'customer', whatsapp: '5547999998888',
      address: { street: 'Rua Cliente Teste', number: '123', complement: 'Casa', neighborhood: 'Vila Teste', city: 'Testópolis', state: 'TS', zipCode: '89123-000' },
      createdAt: new Date().toISOString() 
    },
    { 
      userId: 'user-ana', email: 'ana.silva@example.com', displayName: 'Ana Silva', role: 'customer', whatsapp: '5521987654321',
      address: { street: 'Avenida Copacabana', number: '1000', complement: '', neighborhood: 'Copacabana', city: 'Rio de Janeiro', state: 'RJ', zipCode: '22000-001' },
      createdAt: '2023-10-15T00:00:00Z' 
    },
    { 
      userId: 'user-carlos', email: 'carlos.pereira@example.com', displayName: 'Carlos Pereira', role: 'customer', whatsapp: '5511988887777',
      address: { street: 'Rua Augusta', number: '500', complement: 'Ap 55', neighborhood: 'Consolação', city: 'São Paulo', state: 'SP', zipCode: '01305-000' },
      createdAt: '2023-11-01T00:00:00Z' 
    },
];

export async function signInWithEmail(email: string, password: string): Promise<{ user: User | null, error: { message: string } | null }> {
  console.log('signInWithEmail called with:', email, password);
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay

  const foundUser = MOCK_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());

  if (foundUser) {
    let correctPassword = false;
    if (foundUser.email === 'admin@nugali.com' && password === 'adminpass') correctPassword = true;
    else if (foundUser.email === 'fernandopicardi@gmail.com' && password === 'adminpass') correctPassword = true;
    else if (foundUser.email === 'naiara.nasmaste@gmail.com' && password === 'adminpass') correctPassword = true;
    else if (foundUser.email === 'user@nugali.com' && password === 'userpass') correctPassword = true;
    else if (foundUser.role === 'customer' && password === 'password123') correctPassword = true;


    if (correctPassword) {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('currentUser', JSON.stringify(foundUser));
      }
      return { user: foundUser, error: null };
    }
  }
  
  return { user: null, error: { message: 'Credenciais inválidas.' } };
}

export async function signUpWithEmail(email: string, password: string, displayName?: string, whatsapp?: string): Promise<{ user: User | null, error: { message: string } | null }> {
  console.log('signUpWithEmail called with:', email, password, displayName, whatsapp);
  await new Promise(resolve => setTimeout(resolve, 500)); 
  
  if (MOCK_USERS.find(u => u.email.toLowerCase() === email.toLowerCase())) {
    return { user: null, error: { message: 'Este email já está cadastrado.' }};
  }
  
  const newDisplayName = displayName || email.split('@')[0];
  const newUser: User = {
    userId: `new-user-${Date.now()}`,
    email,
    displayName: newDisplayName,
    whatsapp: '', // Initialized as empty, Account page will enforce filling
    role: 'customer', 
    createdAt: new Date().toISOString(),
  };
  MOCK_USERS.push(newUser);
  return { user: newUser, error: null };
}

export async function signOut(): Promise<{ error: { message: string } | null }> {
  console.log('signOut called');
  await new Promise(resolve => setTimeout(resolve, 300)); 
   if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('currentUser');
    }
  return { error: null };
}

export async function getCurrentUser(): Promise<User | null> {
  if (typeof localStorage !== 'undefined') {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        return JSON.parse(storedUser);
      } catch (e) {
        console.error("Error parsing current user from localStorage", e);
        localStorage.removeItem('currentUser');
        return null;
      }
    }
  }
  return null; 
}

export async function updateUserDetails(
  userId: string, 
  data: Partial<Pick<User, 'displayName' | 'whatsapp' | 'address'>>
): Promise<{ user: User | null, error: { message: string } | null }> {
  console.log('updateUserDetails called for userId:', userId, 'with data:', data);
  await new Promise(resolve => setTimeout(resolve, 500));

  const userIndex = MOCK_USERS.findIndex(u => u.userId === userId);
  if (userIndex === -1) {
    return { user: null, error: { message: "Usuário não encontrado." } };
  }

  let updatedUser = { ...MOCK_USERS[userIndex] };

  if (data.displayName !== undefined) {
    updatedUser.displayName = data.displayName;
  }
  if (data.whatsapp !== undefined) { 
    updatedUser.whatsapp = data.whatsapp;
  }
  if (data.address !== undefined) {
    updatedUser.address = { ...(updatedUser.address || {} as Address), ...data.address } as Address;
  }
  
  MOCK_USERS[userIndex] = updatedUser;
  
  const currentUser = await getCurrentUser();
  if (currentUser && currentUser.userId === userId) {
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
let MOCK_MASTER_PRODUCTS: Product[] = [
  {
    productId: 'prod-new-1',
    name: 'Barra Chocolate Vegano 60% (Sem Glúten, Sem Lactose)',
    description: 'Deliciosa barra de chocolate 60% cacau, totalmente vegana, sem glúten e sem lactose. Perfeita para quem busca sabor intenso com ingredientes selecionados.',
    imageUrls: ['https://placehold.co/600x400.png?text=Barra+Vegana+60'],
    attributes: { "categoria": ["Barra"], "peso": ["500g"], "cacau": ["60%"], "dietary": ["sem glúten", "sem lactose", "vegano"], "unidade": ["barra"] },
    isSeasonal: false, createdAt: '2024-06-01T00:00:00Z', updatedAt: '2024-06-01T00:00:00Z'
  },
  {
    productId: 'prod-new-2',
    name: 'Barra de chocolate ao leite 45%',
    description: 'Clássica barra de chocolate ao leite com 45% de cacau, oferecendo cremosidade e sabor equilibrado. Ideal para toda a família.',
    imageUrls: ['https://placehold.co/600x400.png?text=Barra+Ao+Leite+45'],
    attributes: { "categoria": ["Barra"], "peso": ["500g"], "cacau": ["45%"], "dietary": [], "unidade": ["barra"] },
    isSeasonal: false, createdAt: '2024-06-01T00:00:00Z', updatedAt: '2024-06-01T00:00:00Z'
  },
  {
    productId: 'prod-new-3',
    name: 'Barra de chocolate 70% ZERO AÇÚCAR vegano',
    description: 'Chocolate intenso com 70% cacau, vegano e sem adição de açúcares. Uma opção saudável e saborosa para os amantes de chocolate amargo.',
    imageUrls: ['https://placehold.co/600x400.png?text=Barra+70+Zero+Vegano'],
    attributes: { "categoria": ["Barra"], "peso": ["500g"], "cacau": ["70%"], "dietary": ["ZERO AÇÚCAR", "vegano"], "unidade": ["barra"] },
    isSeasonal: false, createdAt: '2024-06-01T00:00:00Z', updatedAt: '2024-06-01T00:00:00Z'
  },
  {
    productId: 'prod-new-4',
    name: 'Pastilhas para Chocolate Quente - GRANEL Sem lactose',
    description: 'Pastilhas de chocolate sem lactose, perfeitas para preparar um chocolate quente cremoso e delicioso. Embalagem a granel de 1kg.',
    imageUrls: ['https://placehold.co/600x400.png?text=Pastilhas+Choc+Quente'],
    attributes: { "categoria": ["Pastilhas", "Granel"], "peso": ["1kg"], "dietary": ["sem lactose"], "unidade": ["pacote"] },
    isSeasonal: false, createdAt: '2024-06-01T00:00:00Z', updatedAt: '2024-06-01T00:00:00Z'
  },
  {
    productId: 'prod-new-5',
    name: 'Pastilhas para Capuchino - GRANEL Sem lactose',
    description: 'Pastilhas de chocolate sem lactose, ideais para adicionar um toque especial ao seu cappuccino. Embalagem a granel de 1kg.',
    imageUrls: ['https://placehold.co/600x400.png?text=Pastilhas+Cappuccino'],
    attributes: { "categoria": ["Pastilhas", "Granel"], "peso": ["1kg"], "dietary": ["sem lactose"], "unidade": ["pacote"] },
    isSeasonal: false, createdAt: '2024-06-01T00:00:00Z', updatedAt: '2024-06-01T00:00:00Z'
  },
  {
    productId: 'prod-new-6',
    name: 'Tablete Cacau em Flor 70% Cacau com Açaí - SEM LACTOSE/VEGANO',
    description: 'Tablete de chocolate 70% cacau da linha Cacau em Flor, com o toque exótico do açaí. Sem lactose e vegano.',
    imageUrls: ['https://placehold.co/600x400.png?text=Tablete+Acai+70'],
    attributes: { "categoria": ["Tablete"], "sabor": ["Açaí"], "peso": ["100g"], "cacau": ["70%"], "dietary": ["SEM LACTOSE", "VEGANO"], "unidade": ["tablete"] },
    isSeasonal: false, createdAt: '2024-06-01T00:00:00Z', updatedAt: '2024-06-01T00:00:00Z'
  },
  {
    productId: 'prod-new-7',
    name: 'Tablete Cacau em Flor 63% Cacau com Cupuaçu - SEM LACTOSE/VEGANO',
    description: 'Tablete de chocolate 63% cacau da linha Cacau em Flor, enriquecido com o sabor tropical do cupuaçu. Sem lactose e vegano.',
    imageUrls: ['https://placehold.co/600x400.png?text=Tablete+Cupuacu+63'],
    attributes: { "categoria": ["Tablete"], "sabor": ["Cupuaçu"], "peso": ["100g"], "cacau": ["63%"], "dietary": ["SEM LACTOSE", "VEGANO"], "unidade": ["tablete"] },
    isSeasonal: false, createdAt: '2024-06-01T00:00:00Z', updatedAt: '2024-06-01T00:00:00Z'
  },
  {
    productId: 'prod-new-8',
    name: 'Tablete Cacau em Flor 63% Cacau com Pimenta Rosa - SEM LACTOSE/VEGANO/KOSHER',
    description: 'Tablete de chocolate 63% cacau da linha Cacau em Flor, com um toque picante e aromático da pimenta rosa. Sem lactose, vegano e Kosher.',
    imageUrls: ['https://placehold.co/600x400.png?text=Tablete+Pimenta+Rosa'],
    attributes: { "categoria": ["Tablete"], "sabor": ["Pimenta Rosa"], "peso": ["85g"], "cacau": ["63%"], "dietary": ["SEM LACTOSE", "VEGANO", "KOSHER"], "unidade": ["tablete"] },
    isSeasonal: false, createdAt: '2024-06-01T00:00:00Z', updatedAt: '2024-06-01T00:00:00Z'
  },
  {
    productId: 'prod-new-9',
    name: 'Tablete Serra do Conduru 80% Cacau - SEM LACTOSE/VEGANO/KOSHER',
    description: 'Chocolate intenso da linha Serra do Conduru, com 80% de cacau de origem. Sem lactose, vegano e Kosher.',
    imageUrls: ['https://placehold.co/600x400.png?text=Tablete+Conduru+80'],
    attributes: { "categoria": ["Tablete"], "peso": ["85g"], "cacau": ["80%"], "dietary": ["SEM LACTOSE", "VEGANO", "KOSHER"], "unidade": ["tablete"] },
    isSeasonal: false, createdAt: '2024-06-01T00:00:00Z', updatedAt: '2024-06-01T00:00:00Z'
  },
  {
    productId: 'prod-new-10',
    name: 'Tablete Gianduia - Chocolate ao leite refinado com avelãs - KOSHER',
    description: 'Clássico tablete Gianduia, combinando chocolate ao leite refinado com pasta de avelãs. Certificado Kosher.',
    imageUrls: ['https://placehold.co/600x400.png?text=Tablete+Gianduia'],
    attributes: { "categoria": ["Tablete", "Recheado"], "sabor": ["Avelã"], "peso": ["85g"], "dietary": ["KOSHER"], "unidade": ["tablete"] },
    isSeasonal: false, createdAt: '2024-06-01T00:00:00Z', updatedAt: '2024-06-01T00:00:00Z'
  },
  {
    productId: 'prod-new-11',
    name: 'Tablete ao Leite com recheio de Caramelo',
    description: 'Delicioso tablete de chocolate ao leite com um recheio cremoso de caramelo. Perfeito para uma pausa doce.',
    imageUrls: ['https://placehold.co/600x400.png?text=Tablete+Caramelo'],
    attributes: { "categoria": ["Tablete", "Recheado"], "sabor": ["Caramelo"], "peso": ["40g"], "dietary": [], "unidade": ["tablete"] },
    isSeasonal: false, createdAt: '2024-06-01T00:00:00Z', updatedAt: '2024-06-01T00:00:00Z'
  },
  {
    productId: 'prod-new-12',
    name: 'Tablete ao Leite com recheio de Ganashe',
    description: 'Tablete de chocolate ao leite com um recheio suave de ganache. Uma combinação clássica e irresistível.',
    imageUrls: ['https://placehold.co/600x400.png?text=Tablete+Ganache'],
    attributes: { "categoria": ["Tablete", "Recheado"], "sabor": ["Ganache"], "peso": ["40g"], "dietary": [], "unidade": ["tablete"] },
    isSeasonal: false, createdAt: '2024-06-01T00:00:00Z', updatedAt: '2024-06-01T00:00:00Z'
  },
  {
    productId: 'prod-new-13',
    name: 'Gotas Chocolate Amargo 70% Cacau - SEM LACTOSE/VEGANO/KOSHER',
    description: 'Gotas de chocolate amargo 70% cacau, ideais para culinária ou para saborear puras. Sem lactose, veganas e Kosher.',
    imageUrls: ['https://placehold.co/600x400.png?text=Gotas+Amargo+70'],
    attributes: { "categoria": ["Gotas"], "peso": ["450g"], "cacau": ["70%"], "dietary": ["SEM LACTOSE", "VEGANO", "KOSHER"], "unidade": ["pacote"] },
    isSeasonal: false, createdAt: '2024-06-01T00:00:00Z', updatedAt: '2024-06-01T00:00:00Z'
  }
];


export async function fetchAdminProducts(): Promise<Product[]> {
  console.log('fetchAdminProducts called');
  await new Promise(resolve => setTimeout(resolve, 300));
  return [...MOCK_MASTER_PRODUCTS];
}

export async function createProduct(productData: Omit<Product, 'productId' | 'createdAt' | 'updatedAt'>): Promise<Product> {
  console.log('createProduct called with:', productData);
  await new Promise(resolve => setTimeout(resolve, 500));
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
  await new Promise(resolve => setTimeout(resolve, 500));
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
  await new Promise(resolve => setTimeout(resolve, 500));
  const index = MOCK_MASTER_PRODUCTS.findIndex(p => p.productId === productId);
  if (index > -1) MOCK_MASTER_PRODUCTS.splice(index, 1);
  // Also remove any associated CycleProducts
  MOCK_CYCLE_PRODUCTS = MOCK_CYCLE_PRODUCTS.filter(cp => cp.productId !== productId);
}

// PURCHASE CYCLES - For Admin CRUD
const MOCK_PURCHASE_CYCLES: PurchaseCycle[] = [
  { cycleId: 'cycle-easter-2025', name: 'Páscoa 2025', startDate: '2025-03-01T08:00:00Z', endDate: '2025-04-20T23:59:00Z', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
  { cycleId: 'cycle-xmas-2024', name: 'Natal 2024', startDate: '2024-11-01T10:00:00Z', endDate: '2024-12-25T23:00:00Z', isActive: false, createdAt: '2024-01-01T00:00:00Z' },
  { cycleId: 'cycle-mothers-2025', name: 'Dia das Mães 2025', startDate: '2025-04-21T00:00:00Z', endDate: '2025-05-10T23:59:59Z', isActive: false, createdAt: '2024-02-01T00:00:00Z' },
];

export async function fetchPurchaseCycles(): Promise<PurchaseCycle[]> {
  console.log('fetchPurchaseCycles called');
  await new Promise(resolve => setTimeout(resolve, 300));
  return [...MOCK_PURCHASE_CYCLES].sort((a,b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
}

export async function createPurchaseCycle(cycleData: Omit<PurchaseCycle, 'cycleId' | 'createdAt'>): Promise<PurchaseCycle> {
  console.log('createPurchaseCycle called with:', cycleData);
  await new Promise(resolve => setTimeout(resolve, 500));
  if (cycleData.isActive) { 
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
  await new Promise(resolve => setTimeout(resolve, 500));
  const cycleIndex = MOCK_PURCHASE_CYCLES.findIndex(s => s.cycleId === cycleId);
  if (cycleIndex === -1) throw new Error("PurchaseCycle not found");

  if (cycleData.isActive && MOCK_PURCHASE_CYCLES[cycleIndex].isActive === false) { 
    MOCK_PURCHASE_CYCLES.forEach(c => { if (c.cycleId !== cycleId) c.isActive = false; });
  }

  MOCK_PURCHASE_CYCLES[cycleIndex] = { ...MOCK_PURCHASE_CYCLES[cycleIndex], ...cycleData };
  return MOCK_PURCHASE_CYCLES[cycleIndex];
}

export async function deletePurchaseCycle(cycleId: string): Promise<void> {
  console.log('deletePurchaseCycle called for ID:', cycleId);
  await new Promise(resolve => setTimeout(resolve, 500));
   const index = MOCK_PURCHASE_CYCLES.findIndex(s => s.cycleId === cycleId);
  if (index > -1) MOCK_PURCHASE_CYCLES.splice(index, 1);
  MOCK_CYCLE_PRODUCTS = MOCK_CYCLE_PRODUCTS.filter(cp => cp.cycleId !== cycleId);
}

export async function fetchActivePurchaseCycleTitle(): Promise<string> {
  await new Promise(resolve => setTimeout(resolve, 100));
  const activeCycles = MOCK_PURCHASE_CYCLES.filter(pc => pc.isActive);
  if (activeCycles.length > 0) return activeCycles[0].name;
  return "Nossos Chocolates";
}

// CYCLE PRODUCTS - For associating Master Products with Purchase Cycles, defining price, availability
let MOCK_CYCLE_PRODUCTS: CycleProduct[] = [
  { cycleProductId: 'cp-easter-new-1', cycleId: 'cycle-easter-2025', productId: 'prod-new-1', productNameSnapshot: 'Barra Chocolate Vegano 60% (Sem Glúten, Sem Lactose)', priceInCycle: 88.00, isAvailableInCycle: true, displayImageUrl: 'https://placehold.co/600x400.png?text=Barra+Vegana+60' },
  { cycleProductId: 'cp-easter-new-2', cycleId: 'cycle-easter-2025', productId: 'prod-new-2', productNameSnapshot: 'Barra de chocolate ao leite 45%', priceInCycle: 88.00, isAvailableInCycle: true, displayImageUrl: 'https://placehold.co/600x400.png?text=Barra+Ao+Leite+45' },
  { cycleProductId: 'cp-easter-new-3', cycleId: 'cycle-easter-2025', productId: 'prod-new-3', productNameSnapshot: 'Barra de chocolate 70% ZERO AÇÚCAR vegano', priceInCycle: 100.00, isAvailableInCycle: true, displayImageUrl: 'https://placehold.co/600x400.png?text=Barra+70+Zero+Vegano' },
  { cycleProductId: 'cp-easter-new-4', cycleId: 'cycle-easter-2025', productId: 'prod-new-4', productNameSnapshot: 'Pastilhas para Chocolate Quente - GRANEL Sem lactose', priceInCycle: 144.00, isAvailableInCycle: true, displayImageUrl: 'https://placehold.co/600x400.png?text=Pastilhas+Choc+Quente' },
  { cycleProductId: 'cp-easter-new-5', cycleId: 'cycle-easter-2025', productId: 'prod-new-5', productNameSnapshot: 'Pastilhas para Capuchino - GRANEL Sem lactose', priceInCycle: 144.00, isAvailableInCycle: true, displayImageUrl: 'https://placehold.co/600x400.png?text=Pastilhas+Cappuccino' },
  { cycleProductId: 'cp-easter-new-6', cycleId: 'cycle-easter-2025', productId: 'prod-new-6', productNameSnapshot: 'Tablete Cacau em Flor 70% Cacau com Açaí - SEM LACTOSE/VEGANO', priceInCycle: 20.66, isAvailableInCycle: true, displayImageUrl: 'https://placehold.co/600x400.png?text=Tablete+Acai+70' },
  { cycleProductId: 'cp-easter-new-7', cycleId: 'cycle-easter-2025', productId: 'prod-new-7', productNameSnapshot: 'Tablete Cacau em Flor 63% Cacau com Cupuaçu - SEM LACTOSE/VEGANO', priceInCycle: 20.66, isAvailableInCycle: true, displayImageUrl: 'https://placehold.co/600x400.png?text=Tablete+Cupuacu+63' },
  { cycleProductId: 'cp-easter-new-8', cycleId: 'cycle-easter-2025', productId: 'prod-new-8', productNameSnapshot: 'Tablete Cacau em Flor 63% Cacau com Pimenta Rosa - SEM LACTOSE/VEGANO/KOSHER', priceInCycle: 20.66, isAvailableInCycle: true, displayImageUrl: 'https://placehold.co/600x400.png?text=Tablete+Pimenta+Rosa' },
  { cycleProductId: 'cp-easter-new-9', cycleId: 'cycle-easter-2025', productId: 'prod-new-9', productNameSnapshot: 'Tablete Serra do Conduru 80% Cacau - SEM LACTOSE/VEGANO/KOSHER', priceInCycle: 23.25, isAvailableInCycle: true, displayImageUrl: 'https://placehold.co/600x400.png?text=Tablete+Conduru+80' },
  { cycleProductId: 'cp-easter-new-10', cycleId: 'cycle-easter-2025', productId: 'prod-new-10', productNameSnapshot: 'Tablete Gianduia - Chocolate ao leite refinado com avelãs - KOSHER', priceInCycle: 20.66, isAvailableInCycle: true, displayImageUrl: 'https://placehold.co/600x400.png?text=Tablete+Gianduia' },
  { cycleProductId: 'cp-easter-new-11', cycleId: 'cycle-easter-2025', productId: 'prod-new-11', productNameSnapshot: 'Tablete ao Leite com recheio de Caramelo', priceInCycle: 11.24, isAvailableInCycle: true, displayImageUrl: 'https://placehold.co/600x400.png?text=Tablete+Caramelo' },
  { cycleProductId: 'cp-easter-new-12', cycleId: 'cycle-easter-2025', productId: 'prod-new-12', productNameSnapshot: 'Tablete ao Leite com recheio de Ganashe', priceInCycle: 11.24, isAvailableInCycle: true, displayImageUrl: 'https://placehold.co/600x400.png?text=Tablete+Ganache' },
  { cycleProductId: 'cp-easter-new-13', cycleId: 'cycle-easter-2025', productId: 'prod-new-13', productNameSnapshot: 'Gotas Chocolate Amargo 70% Cacau - SEM LACTOSE/VEGANO/KOSHER', priceInCycle: 81.75, isAvailableInCycle: true, displayImageUrl: 'https://placehold.co/600x400.png?text=Gotas+Amargo+70' },
  { cycleProductId: 'cp-xmas-new-1', cycleId: 'cycle-xmas-2024', productId: 'prod-new-2', productNameSnapshot: 'Barra Chocolate Ao Leite 45% (Especial Natal)', priceInCycle: 90.00, isAvailableInCycle: true, displayImageUrl: 'https://placehold.co/600x400.png?text=Barra+Natal' },
];

export async function fetchCycleProducts(cycleId: string): Promise<CycleProduct[]> {
  console.log('fetchCycleProducts for cycleId:', cycleId);
  await new Promise(resolve => setTimeout(resolve, 300));
  return MOCK_CYCLE_PRODUCTS.filter(cp => cp.cycleId === cycleId);
}

export async function fetchProductAvailabilityInActiveCycle(productId: string): Promise<boolean> {
  await new Promise(resolve => setTimeout(resolve, 150));
  const activeCycle = MOCK_PURCHASE_CYCLES.find(pc => pc.isActive);
  if (!activeCycle) {
    console.warn("No active cycle found to check product availability.");
    return false;
  }
  const cycleProduct = MOCK_CYCLE_PRODUCTS.find(cp => cp.cycleId === activeCycle.cycleId && cp.productId === productId);
  return cycleProduct ? cycleProduct.isAvailableInCycle : false; // Default to false if not explicitly in cycle
}

export async function setProductAvailabilityInActiveCycle(productId: string, isAvailable: boolean): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 250));
  const activeCycle = MOCK_PURCHASE_CYCLES.find(pc => pc.isActive);
  if (!activeCycle) {
    console.error("No active cycle found. Cannot set product availability.");
    throw new Error("Nenhum ciclo de compra ativo encontrado.");
  }

  const masterProduct = MOCK_MASTER_PRODUCTS.find(mp => mp.productId === productId);
  if (!masterProduct) {
    console.error(`Master product ${productId} not found.`);
    throw new Error("Produto mestre não encontrado.");
  }

  const cycleProductIndex = MOCK_CYCLE_PRODUCTS.findIndex(cp => cp.cycleId === activeCycle.cycleId && cp.productId === productId);

  if (cycleProductIndex > -1) {
    MOCK_CYCLE_PRODUCTS[cycleProductIndex].isAvailableInCycle = isAvailable;
    console.log(`Availability for ${productId} in cycle ${activeCycle.cycleId} set to ${isAvailable}`);
  } else {
    // If the CycleProduct doesn't exist for this master product in the active cycle, create it.
    // This is important for newly created master products.
    // For mocks, we'll use a default price or derive from master if available (e.g. 0 for now).
    // A real implementation would need a proper way to set price when adding a product to a cycle.
    const newCycleProduct: CycleProduct = {
      cycleProductId: `cp-${activeCycle.cycleId.slice(-5)}-${productId.slice(-5)}-${Date.now()}`,
      cycleId: activeCycle.cycleId,
      productId: productId,
      productNameSnapshot: masterProduct.name, // Take snapshot from master
      priceInCycle: 0, // Placeholder: Price should be set when product is added to cycle properly
      isAvailableInCycle: isAvailable,
      displayImageUrl: masterProduct.imageUrls[0] || 'https://placehold.co/400x300.png?text=Nugali',
    };
    MOCK_CYCLE_PRODUCTS.push(newCycleProduct);
    console.log(`New CycleProduct created for ${productId} in cycle ${activeCycle.cycleId}, availability set to ${isAvailable}`);
  }
}


// DISPLAYABLE PRODUCTS FOR CLIENT HOMEPAGE
export async function fetchActivePurchaseCycleProducts(): Promise<DisplayableProduct[]> {
  await new Promise(resolve => setTimeout(resolve, 400));
  const activeCycle = MOCK_PURCHASE_CYCLES.find(pc => pc.isActive);
  if (!activeCycle) {
    return [];
  }

  const masterProducts = await fetchAdminProducts(); 
  const cycleProductsForActiveCycle = MOCK_CYCLE_PRODUCTS.filter(
    cp => cp.cycleId === activeCycle.cycleId && cp.isAvailableInCycle // This filter is key
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
let MOCK_CART_ITEMS: CartItem[] = getCartFromLocalStorage();


export async function fetchCartItems(): Promise<CartItem[]> {
  MOCK_CART_ITEMS = getCartFromLocalStorage(); 
  notifyCartUpdateListeners(); 
  return [...MOCK_CART_ITEMS];
}

export async function addToCart(product: DisplayableProduct, quantity: number): Promise<void> {
  console.log('addToCart called for product:', product.name, 'cycleProductId:', product.cycleProductId, 'quantity:', quantity);
  MOCK_CART_ITEMS = getCartFromLocalStorage(); 
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
  saveCartToLocalStorage(MOCK_CART_ITEMS);
  notifyCartUpdateListeners();
}

export async function updateCartItemQuantity(cycleProductId: string, quantity: number): Promise<void> {
  console.log('updateCartItemQuantity called for cycleProductId:', cycleProductId, 'new quantity:', quantity);
  MOCK_CART_ITEMS = getCartFromLocalStorage();
  const itemIndex = MOCK_CART_ITEMS.findIndex(item => item.cycleProductId === cycleProductId);
  if (itemIndex > -1) {
    if (quantity <= 0) {
      MOCK_CART_ITEMS.splice(itemIndex, 1);
    } else {
      MOCK_CART_ITEMS[itemIndex].quantity = quantity;
    }
  }
  saveCartToLocalStorage(MOCK_CART_ITEMS);
  notifyCartUpdateListeners();
}

export async function removeFromCart(cycleProductId: string): Promise<void> {
  console.log('removeFromCart called for cycleProductId:', cycleProductId);
  MOCK_CART_ITEMS = getCartFromLocalStorage().filter(item => item.cycleProductId !== cycleProductId);
  saveCartToLocalStorage(MOCK_CART_ITEMS);
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
      { productId: 'prod-new-1', cycleProductId: 'cp-easter-new-1', productName: 'Barra Chocolate Vegano 60%', quantity: 1, priceAtPurchase: 88.00, lineItemTotal: 88.00 },
      { productId: 'prod-new-6', cycleProductId: 'cp-easter-new-6', productName: 'Tablete Cacau em Flor 70% com Açaí', quantity: 2, priceAtPurchase: 20.66, lineItemTotal: 41.32 },
    ], 
    orderTotalAmount: 129.32, 
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
      { productId: 'prod-new-3', cycleProductId: 'cp-easter-new-3', productName: 'Barra de chocolate 70% ZERO AÇÚCAR vegano', quantity: 1, priceAtPurchase: 100.00, lineItemTotal: 100.00 },
    ], 
    orderTotalAmount: 100.00, 
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
    items: [{productId: 'prod-new-2', cycleProductId: 'cp-xmas-new-1', productName: 'Barra Chocolate Ao Leite 45% (Especial Natal)', quantity: 1, priceAtPurchase: 90.00, lineItemTotal: 90.00 }], 
    orderTotalAmount: 90.00, 
    orderStatus: 'Completed', 
    paymentStatus: 'Paid', 
    orderDate: '2023-12-15T11:00:00Z' 
  }
];


export async function processCheckout(cartItems: CartItem[]): Promise<Order> {
  console.log('processCheckout called with cart:', cartItems);
  await new Promise(resolve => setTimeout(resolve, 700));
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
    orderStatus: "Pending Payment", 
    paymentStatus: "Unpaid",      
    orderDate: new Date().toISOString(),
  };
  MOCK_ORDERS.push(newOrder);
  MOCK_CART_ITEMS = []; 
  saveCartToLocalStorage(MOCK_CART_ITEMS);
  notifyCartUpdateListeners(); 
  return newOrder;
}

export async function fetchAdminOrders(): Promise<Order[]> {
  console.log('fetchAdminOrders called');
  await new Promise(resolve => setTimeout(resolve, 300));
  return [...MOCK_ORDERS];
}


export async function updateOrderStatus(orderId: string, newOrderStatus: Order['orderStatus'], newPaymentStatus?: Order['paymentStatus']): Promise<Order> {
  console.log('updateOrderStatus called for order ID:', orderId, 'new orderStatus:', newOrderStatus, 'new paymentStatus:', newPaymentStatus);
  await new Promise(resolve => setTimeout(resolve, 500));
  const orderIndex = MOCK_ORDERS.findIndex(o => o.orderId === orderId);
  if (orderIndex === -1) throw new Error('Order not found');

  MOCK_ORDERS[orderIndex].orderStatus = newOrderStatus;
  
  if (newPaymentStatus) {
    MOCK_ORDERS[orderIndex].paymentStatus = newPaymentStatus;
  } else { 
    if (newOrderStatus === "Payment Confirmed" || newOrderStatus === "Preparing" || newOrderStatus === "Ready for Pickup/Delivery" || newOrderStatus === "Completed") {
        if (MOCK_ORDERS[orderIndex].paymentStatus === "Unpaid") {
            MOCK_ORDERS[orderIndex].paymentStatus = "Paid";
        }
    } else if (newOrderStatus === "Cancelled") {
        if (MOCK_ORDERS[orderIndex].paymentStatus === "Paid") {
            MOCK_ORDERS[orderIndex].paymentStatus = "Refunded";
        }
    } else if (newOrderStatus === "Pending Payment") {
        if (MOCK_ORDERS[orderIndex].paymentStatus !== "Refunded") { // Don't revert a refund to unpaid automatically
            MOCK_ORDERS[orderIndex].paymentStatus = "Unpaid";
        }
    }
  }
  
  return MOCK_ORDERS[orderIndex];
}

// --- Admin Dashboard Metrics ---
export async function fetchActiveCycleMetrics(): Promise<{ activeCycle: PurchaseCycle | null; pendingOrdersCount: number; totalSalesActiveCycle: number; }> {
  console.log('fetchActiveCycleMetrics called');
  await new Promise(resolve => setTimeout(resolve, 300));
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
    await new Promise(resolve => setTimeout(resolve, 300));
    return MOCK_USERS.filter(user => user.role === 'customer');
}
