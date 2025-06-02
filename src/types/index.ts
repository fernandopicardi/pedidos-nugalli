
export interface User {
  userId: string; // Auth UID
  email: string;
  displayName: string;
  whatsapp?: string;
  role: 'customer' | 'admin';
  createdAt: string; // ISO date string
}

export interface Product { // Represents Master Product List
  productId: string; // auto-ID
  name: string;
  description: string;
  imageUrls: string[]; // array of strings
  attributes: Record<string, string[]>; // e.g., { "dietary": ["vegano", "sem glúten"] }
  isSeasonal: boolean; // default true
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  // Deprecating old fields, will be removed in subsequent steps
  // price?: number; // Base price, may be superseded by priceInCycle
  // imageUrl?: string; // Superseded by imageUrls
  // seasonId?: string; // Superseded by CycleProducts
}

export interface PurchaseCycle {
  cycleId: string; // auto-ID
  name: string; // e.g., "Pedidos Novembro 2024"
  startDate: string; // ISO date string (timestamp)
  endDate: string; // ISO date string (timestamp)
  isActive: boolean;
  createdAt: string; // ISO date string (timestamp)
}

export interface CycleProduct { // Product offering within a specific cycle
  cycleProductId: string; // auto-ID
  cycleId: string; // ref to PurchaseCycles
  productId: string; // ref to Products (Master)
  productNameSnapshot: string; // for historical display
  priceInCycle: number; // specific price for this product in this cycle
  isAvailableInCycle: boolean;
  // Storing a primary image for easier display in cart/order summaries
  displayImageUrl?: string; // Typically the first from Product.imageUrls or a specific one for the cycle
}

export interface CartItem {
  // cartItemId: string; // Or use cycleProductId if items are always from a cycle
  cycleProductId: string; // References the specific offering in a cycle
  productId: string; // Master product ID
  name: string; // Snapshot of product name (from CycleProduct or Product)
  price: number; // Price in cycle
  quantity: number;
  imageUrl: string; // Display image for cart
  description?: string; // Optional: short description if needed
}

export interface OrderItem {
  productId: string;
  cycleProductId: string;
  productName: string;
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
  orderStatus: "Pending Payment" | "Payment Confirmed" | "Preparing" | "Ready for Pickup/Delivery" | "Completed" | "Cancelled";
  paymentStatus: "Unpaid" | "Paid" | "Refunded";
  orderDate: string; // ISO date string (timestamp)
  adminNotes?: string;
  // Deprecating old fields
  // customerName?: string;
  // totalValue?: number;
  // status?: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
}
