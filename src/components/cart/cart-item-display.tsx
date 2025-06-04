
"use client";

import Image from 'next/image';
import type { CartItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MinusCircle, PlusCircle, Trash2, Loader2 } from 'lucide-react'; // Added Loader2
import { useToast } from "@/hooks/use-toast";
// Removed supabase direct import, handlers are now passed down or handled by parent
import { useState } from 'react';


interface CartItemDisplayProps {
  item: CartItem;
  // onQuantityChange now expects cartItemId and newQuantity
  onQuantityChange: (cartItemId: string, newQuantity: number) => Promise<void> | void; 
  // onRemove now expects cartItemId
  onRemove: (cartItemId: string) => Promise<void> | void;
}

export function CartItemDisplay({ item, onQuantityChange, onRemove }: CartItemDisplayProps) {
  const { toast } = useToast(); // Keep toast for potential direct feedback if needed, though parent handles DB ops
  const [isUpdating, setIsUpdating] = useState(false);


  const handleIncreaseQuantity = async () => {
    setIsUpdating(true);
    await onQuantityChange(item.cartItemId, item.quantity + 1);
    setIsUpdating(false);
  };

  const handleDecreaseQuantity = async () => {
    if (item.quantity > 1) {
      setIsUpdating(true);
      await onQuantityChange(item.cartItemId, item.quantity - 1);
      setIsUpdating(false);
    }
  };
  
  const handleQuantityInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    let newQuantity = parseInt(e.target.value, 10);
    if (isNaN(newQuantity) || newQuantity < 1) {
      newQuantity = 1;
    } else if (newQuantity > 99) {
        newQuantity = 99;
    }
    // Only call onQuantityChange if the new quantity is different
    if (newQuantity !== item.quantity) {
      setIsUpdating(true);
      await onQuantityChange(item.cartItemId, newQuantity);
      setIsUpdating(false);
    }
  };

  const handleRemoveItem = async () => {
    setIsUpdating(true);
    await onRemove(item.cartItemId);
    // setIsUpdating will implicitly be false if component is unmounted
    // If not unmounted immediately (e.g. parent delays removal from list), explicitly set:
    // setIsUpdating(false); 
  };

  return (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 gap-4 border-b border-border last:border-b-0">
      <div className="flex items-center space-x-3 md:space-x-4 flex-grow min-w-0">
        <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-md overflow-hidden flex-shrink-0">
          <Image src={item.imageUrl} alt={item.name} layout="fill" objectFit="cover" data-ai-hint="chocolate product"/>
        </div>
        <div className="flex-grow min-w-0">
          <h3 className="font-semibold font-headline text-base md:text-lg break-words">{item.name}</h3>
          <p className="text-xs md:text-sm text-muted-foreground">
            R$ {item.price.toFixed(2).replace('.', ',')}
          </p>
        </div>
      </div>

      <div className="flex flex-col items-stretch gap-2 w-full md:w-auto md:items-end shrink-0">
        <div className="flex items-center justify-between md:justify-end md:gap-2">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="w-8 h-8" onClick={handleDecreaseQuantity} disabled={item.quantity <= 1 || isUpdating}>
              {isUpdating && item.quantity -1 < item.quantity ? <Loader2 size={18} className="animate-spin"/> : <MinusCircle size={18} />}
            </Button>
            <Input 
              type="number" 
              value={item.quantity} 
              onChange={handleQuantityInputChange}
              className="w-12 text-center h-9 text-sm"
              min="1"
              max="99"
              disabled={isUpdating}
            />
            <Button variant="ghost" size="icon" className="w-8 h-8" onClick={handleIncreaseQuantity} disabled={isUpdating}>
               {isUpdating && item.quantity + 1 > item.quantity ? <Loader2 size={18} className="animate-spin"/> : <PlusCircle size={18} />}
            </Button>
          </div>
          <p className="font-semibold text-sm md:text-base whitespace-nowrap min-w-[80px] text-right">
            R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={handleRemoveItem} className="text-destructive hover:text-destructive self-end md:ml-2 w-8 h-8" disabled={isUpdating}>
          {isUpdating ? <Loader2 size={18} className="animate-spin"/> : <Trash2 size={18} />}
        </Button>
      </div>
    </div>
  );
}

