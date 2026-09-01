import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import BlurImage from "@/components/ui/blur-image";
import { Flame, Leaf, Star, Clock, ShoppingBag, AlertTriangle, ChefHat } from "lucide-react";
import { resolveImageUrl } from "@/lib/imageUrl";

export interface DishDetail {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  image_url: string | null;
  images: string[] | null;
  is_popular: boolean | null;
  is_spicy: boolean | null;
  is_veg: boolean | null;
  ingredients?: string[] | null;
  allergens?: string[] | null;
  spice_level?: number | null;
  prep_time_minutes?: number | null;
}

const SPICE_LABELS = ["Mild", "Medium", "Hot", "Extra Hot"] as const;

interface DishDetailModalProps {
  item: DishDetail | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fallbackImage: string;
  onAddToCart: (item: DishDetail) => void;
}

const DishDetailModal = ({ item, open, onOpenChange, fallbackImage, onAddToCart }: DishDetailModalProps) => {
  if (!item) return null;

  const spiceLevel = item.is_spicy ? Math.max(1, item.spice_level ?? 1) : (item.spice_level ?? 0);
  const hasIngredients = item.ingredients && item.ingredients.length > 0;
  const hasAllergens = item.allergens && item.allergens.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90dvh] overflow-y-auto p-0 gap-0">
        <div className="relative h-56 sm:h-64 w-full bg-muted">
          <BlurImage
            src={resolveImageUrl(item.image_url, fallbackImage)}
            fallbackSrc={fallbackImage}
            alt={item.name}
            wrapperClassName="absolute inset-0 w-full h-full"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
            {item.is_popular && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-medium">
                <Star className="h-3 w-3 fill-current" /> Popular
              </span>
            )}
            {item.is_veg && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-600 text-white text-xs font-medium">
                <Leaf className="h-3 w-3" /> Vegetarian
              </span>
            )}
          </div>
        </div>

        <div className="p-5 sm:p-6 space-y-5">
          <DialogHeader className="space-y-1 text-left">
            <DialogTitle className="font-display text-2xl">{item.name}</DialogTitle>
            <p className="text-xs text-muted-foreground">{item.category}</p>
          </DialogHeader>

          {item.description && (
            <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
          )}

          {/* Quick facts: spice + prep time */}
          <div className="flex flex-wrap gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${
                spiceLevel > 0 ? "bg-destructive/10 text-destructive" : "bg-green-600/10 text-green-600"
              }`}
            >
              {spiceLevel > 0 ? (
                <>
                  {Array.from({ length: spiceLevel }).map((_, i) => (
                    <Flame key={i} className="h-3.5 w-3.5 fill-current" />
                  ))}
                  {SPICE_LABELS[spiceLevel]}
                </>
              ) : (
                <>
                  <Leaf className="h-3.5 w-3.5" /> Mild
                </>
              )}
            </span>
            {item.prep_time_minutes != null && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted text-foreground text-xs font-medium">
                <Clock className="h-3.5 w-3.5" /> ~{item.prep_time_minutes} min
              </span>
            )}
          </div>

          {/* Ingredients */}
          {hasIngredients && (
            <div>
              <h4 className="flex items-center gap-1.5 text-sm font-semibold text-foreground mb-2">
                <ChefHat className="h-4 w-4 text-secondary" /> Ingredients
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {item.ingredients!.map((ing) => (
                  <span key={ing} className="px-2.5 py-1 rounded-full bg-muted text-muted-foreground text-xs">
                    {ing}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Allergens */}
          {hasAllergens && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
              <h4 className="flex items-center gap-1.5 text-sm font-semibold text-destructive mb-1.5">
                <AlertTriangle className="h-4 w-4" /> Allergen Information
              </h4>
              <p className="text-xs text-muted-foreground">
                Contains: {item.allergens!.join(", ")}
              </p>
            </div>
          )}

          <div className="flex items-center justify-between gap-4 pt-2 border-t border-border">
            <span className="font-display text-2xl font-bold text-secondary">৳{item.price}</span>
            <Button
              onClick={() => onAddToCart(item)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground active:scale-[0.98]"
            >
              <ShoppingBag className="h-4 w-4 mr-2" /> Add to Order
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DishDetailModal;
