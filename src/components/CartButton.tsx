import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { useNavigate } from "react-router-dom";

const CartButton = () => {
  const { totalItems, totalAmount } = useCart();
  const navigate = useNavigate();

  if (totalItems === 0) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
      <Button 
        onClick={() => navigate('/checkout')}
        size="lg"
        className="shadow-lg rounded-full px-6 gap-3"
      >
        <ShoppingCart className="w-5 h-5" />
        <span>{totalItems} items</span>
        <span className="font-bold">৳{totalAmount.toFixed(0)}</span>
      </Button>
    </div>
  );
};

export default CartButton;
