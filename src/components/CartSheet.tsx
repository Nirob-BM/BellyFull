import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useNavigate } from "react-router-dom";

const CartSheet = () => {
  const { items, totalItems, totalAmount } = useCart();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  if (totalItems === 0) return null;

  const handleCheckout = () => {
    setOpen(false);
    navigate('/checkout');
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button size="lg" className="shadow-lg rounded-full px-6 gap-3">
            <ShoppingCart className="w-5 h-5" />
            <span>{totalItems} items</span>
            <span className="font-bold">৳{totalAmount.toFixed(0)}</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-auto max-h-[60vh] rounded-t-3xl">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Your Cart ({totalItems} items)
            </SheetTitle>
          </SheetHeader>
          
          <div className="flex flex-col pt-4">
            {/* Cart Items - View Only */}
            <div className="overflow-y-auto space-y-3 pb-4 max-h-[30vh]">
              {items.map((item) => (
                <div key={item.id} className="flex gap-3 bg-muted/50 rounded-xl p-3">
                  {item.image_url && (
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-12 h-12 object-cover rounded-lg"
            loading="lazy"
            decoding="async"/>
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">{item.name}</h4>
                    <p className="text-sm text-muted-foreground">৳{item.price} × {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-primary">৳{(item.price * item.quantity).toFixed(0)}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Checkout Footer */}
            <div className="border-t pt-4 space-y-4">
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-primary">৳{totalAmount.toFixed(0)}</span>
              </div>
              <Button 
                className="w-full" 
                size="lg"
                onClick={handleCheckout}
              >
                Proceed to Checkout
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default CartSheet;
