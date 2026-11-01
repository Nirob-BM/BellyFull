import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import BlurImage from "@/components/ui/blur-image";
import { Minus, Plus, ShoppingBag } from "lucide-react";
import { resolveImageUrl } from "@/lib/imageUrl";

export interface OrderDialogItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  image_url: string | null;
}

interface OrderDialogProps {
  item: OrderDialogItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quantity: number;
  onQuantityChange: (next: number) => void;
  canOrder: boolean;
  closedReason: string;
  onAddToOrder: (goToCheckout: boolean) => void;
  fallbackImage: string;
}

/**
 * Product popup used by the homepage menu and the menu page.
 * Mobile-first: the card never leaves the viewport (max-h-[88dvh]), the body
 * scrolls on its own and the price + action buttons stay pinned at the bottom,
 * with 44px+ tap targets throughout.
 */
const OrderDialog = ({
  item,
  open,
  onOpenChange,
  quantity,
  onQuantityChange,
  canOrder,
  closedReason,
  onAddToOrder,
  fallbackImage,
}: OrderDialogProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent
      className={
        // mobile-first: fit the screen, scroll only the body, keep actions pinned
        "flex max-h-[88dvh] w-[calc(100vw-1.5rem)] max-w-[22rem] flex-col gap-3 overflow-hidden rounded-2xl p-4 " +
        "[&>button]:flex [&>button]:h-9 [&>button]:w-9 [&>button]:items-center [&>button]:justify-center " +
        "[&>button]:rounded-full [&>button]:bg-muted [&>button]:text-muted-foreground [&>button]:opacity-100 " +
        "[&>button]:transition-colors [&>button]:hover:bg-secondary/25 [&>button]:hover:text-foreground " +
        "sm:max-w-md sm:gap-4 sm:p-6"
      }
    >
      <DialogHeader className="min-w-0 pr-9 text-left sm:pr-10">
        <DialogTitle className="font-display text-xl leading-snug break-words sm:text-2xl">
          {item?.name}
        </DialogTitle>
      </DialogHeader>

      {item && (
        <>
          <div className="-mx-4 min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 sm:mx-0 sm:px-0">
            <BlurImage
              src={resolveImageUrl(item.image_url, fallbackImage)}
              fallbackSrc={fallbackImage}
              alt={item.name}
              wrapperClassName="block w-full h-40 rounded-xl sm:h-48"
              className="w-full h-40 object-cover rounded-xl sm:h-48"
            />

            {item.description && (
              <p className="mt-3 break-words text-sm leading-relaxed text-muted-foreground sm:text-base">
                {item.description}
              </p>
            )}

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <span className="font-display text-xl font-bold text-secondary sm:text-2xl">
                ৳{item.price * quantity}
              </span>
              <div className="flex items-center gap-2 sm:gap-3">
                <Button
                  size="icon"
                  variant="outline"
                  className="h-11 w-11 shrink-0"
                  onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  aria-label={`Decrease quantity of ${item.name}`}
                >
                  <Minus className="h-4 w-4" aria-hidden="true" />
                </Button>
                <span
                  className="w-10 text-center font-semibold text-lg tabular-nums"
                  aria-live="polite"
                  aria-atomic="true"
                >
                  {quantity}
                </span>
                <Button
                  size="icon"
                  variant="outline"
                  className="h-11 w-11 shrink-0"
                  onClick={() => onQuantityChange(quantity + 1)}
                  aria-label={`Increase quantity of ${item.name}`}
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </div>

            {!canOrder && (
              <p className="mt-4 rounded-lg bg-destructive/10 px-3 py-2 text-center text-sm text-destructive">
                We're closed right now. {closedReason}
              </p>
            )}
          </div>

          <div className="grid gap-2 border-t border-border/60 pt-3 sm:grid-cols-2 sm:pt-4">
            <Button
              onClick={() => onAddToOrder(false)}
              variant="outline"
              disabled={!canOrder}
              className="h-11 w-full border-secondary/50"
            >
              <ShoppingBag className="h-4 w-4 mr-2" />
              Add to Order
            </Button>
            <Button
              onClick={() => onAddToOrder(true)}
              disabled={!canOrder}
              className="h-11 w-full bg-primary text-primary-foreground"
            >
              {canOrder ? `Order Now - ৳${item.price * quantity}` : "Ordering closed"}
            </Button>
          </div>
        </>
      )}
    </DialogContent>
  </Dialog>
);

export default OrderDialog;
