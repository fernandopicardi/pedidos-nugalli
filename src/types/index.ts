export interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  description?: string;
  seasonId?: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Season {
  id: string;
  name: string;
  startDate: string; // ISO date string
  endDate: string;   // ISO date string
  isActive: boolean;
}

export interface Order {
  id: string;
  customerName: string; // Simplified for now
  customerId?: string;
  orderDate: string; // ISO date string
  totalValue: number;
  status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  items: CartItem[];
}
