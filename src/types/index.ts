
export interface User {
  userId: string; // Auth UID
  email: string;
  displayName: string;
  whatsapp: string;
  isAdmin: boolean; // true for admin, false for customer
  createdAt: string; // ISO date string
  addressStreet?: string;
  addressNumber?: string;
  addressComplement?: string;
  addressNeighborhood?: string;
  addressCity?: string;
  addressState?: string; // UF (e.g., SP, RJ)
  addressZip?: string;   // CEP
}

export interface Product { // Represents Product List
  productId: string; // auto-ID
  name: string;
  description: string;
  imageUrl: string; // single string URL
  attributes: Record<string, string[]>; // e.g., { "dietary": ["vegano", "sem glúten"], "categoria": ["Barra"], "peso": ["100g"], "cacau": ["70%"] }
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

export interface PurchaseCycle {
  cycleId: string; // auto-ID
  name: string; // e.g., "Pedidos Novembro 2024"
  startDate: string; // ISO date string (timestamp)
  endDate: string; // ISO date string (timestamp)
  isActive: boolean;
  description?: string; // Optional description for the homepage
  createdAt: string; // ISO date string (timestamp)
}

export interface CycleProduct { // Product offering within a specific cycle
  cycleProductId: string; // auto-ID
  cycleId: string; // ref to PurchaseCycles
  productId: string; // ref to Products
  productNameSnapshot: string; // for historical display
  priceInCycle: number; // specific price for this product in this cycle
  isAvailableInCycle: boolean;
  displayImageUrl?: string; // Typically the first from Product.imageUrls or a specific one for the cycle
}


// New type for product data displayed in the ProductCard and ProductGrid
export interface DisplayableProduct extends Omit<CycleProduct, 'productNameSnapshot' | 'priceInCycle' | 'displayImageUrl'> {
  name: string; // From CycleProduct.productNameSnapshot
  description: string; // From master Product.description
  price: number; // From CycleProduct.priceInCycle
  imageUrl: string; // From CycleProduct.displayImageUrl or a fallback
  attributes: Record<string, string[]>; // From master Product.attributes
  isAvailableInCycle: boolean; // Inherited from CycleProduct
}

export interface CartItem {
  cartItemId: string; // auto-ID
  cycleProductId: string; // References the specific offering in a cycle
  productId: string; // Master product ID
  name: string; // Snapshot of product name
  price: number; // Price in cycle at time of adding to cart
  quantity: number;
  imageUrl: string; // Display image for cart
  description?: string; // Optional: short description
}

export interface OrderItem {
  productId: string; // Master product ID
  cycleProductId: string; // Specific cycle offering ID
  productName: string; // Name snapshot at time of purchase
  quantity: number;
  priceAtPurchase: number; // Price from CycleProduct at the time of order
  lineItemTotal: number;
}

export interface Order {
  orderId: string; // auto-ID
  orderNumber: string; // human-readable e.g., ORD-00001
  userId: string; // ref to Users
  customerNameSnapshot: string;
  customerWhatsappSnapshot?: string;
  cycleId: string; // ref to PurchaseCycles active at time of order
  items: OrderItem[];
  orderTotalAmount: number; // auto-calculated
  orderStatus: "Pending Payment" | "Payment Confirmed" | "Preparing" | "Pronto para Retirada" | "Completed" | "Cancelled";
  paymentStatus: "Unpaid" | "Paid" | "Refunded";
  orderDate: string; // ISO date string (timestamp)
  adminNotes?: string;
}
