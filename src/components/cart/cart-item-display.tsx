
"use client";

import Image from 'next/image';
import type { CartItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MinusCircle, PlusCircle, Trash2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { updateCartItemQuantity, removeFromCart } from '@/lib/supabasePlaceholders';

interface CartItemDisplayProps {
  item: CartItem;
  onQuantityChange: (cycleProductId: string, newQuantity: number) => void;
  onRemove: (cycleProductId: string) => void;
}

export function CartItemDisplay({ item, onQuantityChange, onRemove }: CartItemDisplayProps) {
  const { toast } = useToast();

  const handleIncreaseQuantity = async () => {
    const newQuantity = item.quantity + 1;
    await updateCartItemQuantity(item.cycleProductId, newQuantity);
    onQuantityChange(item.cycleProductId, newQuantity);
  };

  const handleDecreaseQuantity = async () => {
    if (item.quantity > 1) {
      const newQuantity = item.quantity - 1;
      await updateCartItemQuantity(item.cycleProductId, newQuantity);
      onQuantityChange(item.cycleProductId, newQuantity);
    }
  };
  
  const handleQuantityInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    let newQuantity = parseInt(e.target.value, 10);
    if (isNaN(newQuantity) || newQuantity < 1) {
      newQuantity = 1; // Default to 1 if invalid input or less than 1
    } else if (newQuantity > 99) { // Optional: set a max quantity limit
        newQuantity = 99;
    }
    await updateCartItemQuantity(item.cycleProductId, newQuantity);
    onQuantityChange(item.cycleProductId, newQuantity);
  };

  const handleRemoveItem = async () => {
    await removeFromCart(item.cycleProductId);
    onRemove(item.cycleProductId);
    toast({
      title: `${item.name} removido do carrinho.`,
      variant: "default",
    });
  };

  return (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 gap-4 border-b border-border last:border-b-0">
      {/* Left side: Image and Product Info */}
      <div className="flex items-center space-x-3 md:space-x-4 flex-grow min-w-0"> {/* Added min-w-0 to allow shrinking */}
        <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-md overflow-hidden flex-shrink-0">
          <Image src={item.imageUrl} alt={item.name} layout="fill" objectFit="cover" data-ai-hint="chocolate product"/>
        </div>
        <div className="flex-grow min-w-0"> {/* Added min-w-0 here */}
          <h3 className="font-semibold font-headline text-base md:text-lg break-words">{item.name}</h3>
          <p className="text-xs md:text-sm text-muted-foreground">
            R$ {item.price.toFixed(2).replace('.', ',')}
          </p>
        </div>
      </div>

      {/* Right side: Quantity controls, Total price, Remove button */}
      <div className="flex flex-col items-stretch gap-2 w-full md:w-auto md:items-end shrink-0">
        <div className="flex items-center justify-between md:justify-end md:gap-2"> {/* Groups Qty and Item Total */}
          <div className="flex items-center gap-1"> {/* Quantity controls */}
            <Button variant="ghost" size="icon" className="w-8 h-8" onClick={handleDecreaseQuantity} disabled={item.quantity <= 1}>
              <MinusCircle size={18} />
            </Button>
            <Input 
              type="number" 
              value={item.quantity} 
              onChange={handleQuantityInputChange}
              className="w-12 text-center h-9 text-sm"
              min="1"
              max="99" // Optional: consistent with input change handler
            />
            <Button variant="ghost" size="icon" className="w-8 h-8" onClick={handleIncreaseQuantity}>
              <PlusCircle size={18} />
            </Button>
          </div>
          <p className="font-semibold text-sm md:text-base whitespace-nowrap min-w-[80px] text-right"> {/* Item total */}
            R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={handleRemoveItem} className="text-destructive hover:text-destructive self-end md:ml-2 w-8 h-8"> {/* Remove button */}
          <Trash2 size={18} />
        </Button>
      </div>
    </div>
  );
}
