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
  onQuantityChange: (itemId: string, newQuantity: number) => void;
  onRemove: (itemId: string) => void;
}

export function CartItemDisplay({ item, onQuantityChange, onRemove }: CartItemDisplayProps) {
  const { toast } = useToast();

  const handleIncreaseQuantity = async () => {
    const newQuantity = item.quantity + 1;
    // TODO: Implement Supabase update quantity logic
    await updateCartItemQuantity(item.id, newQuantity);
    onQuantityChange(item.id, newQuantity);
  };

  const handleDecreaseQuantity = async () => {
    if (item.quantity > 1) {
      const newQuantity = item.quantity - 1;
      // TODO: Implement Supabase update quantity logic
      await updateCartItemQuantity(item.id, newQuantity);
      onQuantityChange(item.id, newQuantity);
    } else {
      // Optionally, remove if quantity becomes 0, or keep at 1
      // For now, just don't go below 1 with +/- buttons. Use remove button for that.
    }
  };
  
  const handleQuantityInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    let newQuantity = parseInt(e.target.value, 10);
    if (isNaN(newQuantity) || newQuantity < 1) {
      newQuantity = 1;
    }
    // TODO: Implement Supabase update quantity logic
    await updateCartItemQuantity(item.id, newQuantity);
    onQuantityChange(item.id, newQuantity);
  };

  const handleRemoveItem = async () => {
    // TODO: Implement Supabase remove item logic
    await removeFromCart(item.id);
    onRemove(item.id);
    toast({
      title: `${item.name} removido do carrinho.`,
      variant: "default",
    });
  };

  return (
    <div className="flex items-center justify-between p-4 border-b border-border last:border-b-0">
      <div className="flex items-center space-x-4">
        <div className="relative w-20 h-20 rounded-md overflow-hidden">
          <Image src={item.imageUrl} alt={item.name} layout="fill" objectFit="cover" data-ai-hint="chocolate product"/>
        </div>
        <div>
          <h3 className="font-semibold font-headline text-lg">{item.name}</h3>
          <p className="text-sm text-muted-foreground">
            R$ {item.price.toFixed(2).replace('.', ',')}
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-3">
        <Button variant="ghost" size="icon" onClick={handleDecreaseQuantity} disabled={item.quantity <= 1}>
          <MinusCircle size={20} />
        </Button>
        <Input 
          type="number" 
          value={item.quantity} 
          onChange={handleQuantityInputChange}
          className="w-16 text-center h-10"
          min="1"
        />
        <Button variant="ghost" size="icon" onClick={handleIncreaseQuantity}>
          <PlusCircle size={20} />
        </Button>
        <p className="w-24 text-right font-semibold text-lg">
          R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}
        </p>
        <Button variant="ghost" size="icon" onClick={handleRemoveItem} className="text-destructive hover:text-destructive">
          <Trash2 size={20} />
        </Button>
      </div>
    </div>
  );
}
