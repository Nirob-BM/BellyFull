import { forwardRef, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Star, Flame, Leaf, ShoppingBag, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import BlurImage from "@/components/ui/blur-image";
import { resolveImageUrl } from "@/lib/imageUrl";

import dishButterChicken from "@/assets/dish-butter-chicken.jpg";

interface PopularItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  image_url: string | null;
  is_popular: boolean | null;
  is_spicy: boolean | null;
  is_veg: boolean | null;
}

const PopularItems = forwardRef<HTMLElement>((_, forwardedRef) => {
  const [items, setItems] = useState<PopularItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const paused = useRef(false);
  const resumeTimeout = useRef<ReturnType<typeof setTimeout>>();
  const { addItem } = useCart();
  const { toast } = useToast();

  useEffect(() => {
    const fetchPopular = async () => {
      const { data, error } = await supabase
        .from("menu_items")
        .select("id, name, description, price, category, image_url, is_popular, is_spicy, is_veg")
        .eq("is_active", true)
        .eq("is_popular", true)
        .order("sort_order", { ascending: true })
        .limit(12);

      if (!error && data) setItems(data);
      setIsLoading(false);
    };
    fetchPopular();
  }, []);

  // Continuous slow auto-scroll loop with seamless infinite wrap
  useEffect(() => {
    if (items.length === 0 || !scrollRef.current) return;
    let animationId: number;
    const speed = 0.5;

    const step = () => {
      const el = scrollRef.current;
      if (!el) return;
      if (!paused.current) {
        // Content is tripled: [items][items][items]
        // One set width = total scrollable / 3 (approximately)
        const oneSetWidth = el.scrollWidth / 3;
        if (el.scrollLeft >= oneSetWidth * 2) {
          el.scrollLeft -= oneSetWidth;
        }
        el.scrollLeft += speed;
      }
      animationId = requestAnimationFrame(step);
    };

    animationId = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(animationId);
      if (resumeTimeout.current) clearTimeout(resumeTimeout.current);
    };
  }, [items]);

  const pauseAutoScroll = (duration = 2000) => {
    paused.current = true;
    if (resumeTimeout.current) clearTimeout(resumeTimeout.current);
    resumeTimeout.current = setTimeout(() => { paused.current = false; }, duration);
  };

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    pauseAutoScroll();
    const cardWidth = scrollRef.current.firstElementChild?.clientWidth ?? 280;
    const gap = 24;
    const scrollAmount = cardWidth + gap;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  const handleAddToCart = (item: PopularItem) => {
    addItem({
      id: item.id,
      name: item.name,
      price: item.price,
      image_url: item.image_url,
    });
    toast({ title: "Added to cart", description: `${item.name} added successfully` });
  };

  if (isLoading) {
    return (
      <section className="py-16 bg-muted/20">
        <div className="container flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </section>
    );
  }

  if (items.length === 0) return null;

  return (
    <section
      ref={forwardedRef}
      className="py-8 md:py-10 bg-gradient-to-b from-background to-muted/20 overflow-hidden"
    >
      <div className="container px-4 md:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-end justify-between mb-5 md:mb-6"
        >
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/15 text-secondary-foreground text-xs font-medium mb-2 border border-secondary/30">
              <Star className="w-3.5 h-3.5 fill-secondary text-secondary" />
              Customer Favorites
            </span>
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
              Popular <span className="text-secondary">Dishes</span>
            </h2>
          </div>
          <div className="hidden sm:flex gap-2">
            <Button
              variant="outline"
              size="icon"
              aria-label="Scroll popular dishes left"
              className="rounded-full border-border hover:bg-primary hover:text-primary-foreground transition-colors"
              onClick={() => scroll("left")}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label="Scroll popular dishes right"
              className="rounded-full border-border hover:bg-primary hover:text-primary-foreground transition-colors"
              onClick={() => scroll("right")}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </motion.div>

        {/* Carousel */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div
            ref={scrollRef}
            className="flex gap-5 md:gap-6 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            onMouseEnter={() => { paused.current = true; if (resumeTimeout.current) clearTimeout(resumeTimeout.current); }}
            onMouseLeave={() => { paused.current = false; }}
          >
            {[...items, ...items, ...items].map((item, index) => (
              <div
                key={`${item.id}-${index}`}
                className="w-[170px] sm:w-[190px] md:w-[220px] lg:w-[240px] flex-shrink-0"
              >
                <Link
                  to={`/product/${item.id}`}
                  className="group block bg-card rounded-2xl border border-border overflow-hidden hover:shadow-xl hover:border-primary/30 transition-all duration-300"
                >
                  <div className="relative aspect-[3/2] overflow-hidden">
                    <BlurImage
                      src={item.image_url || dishButterChicken}
                      alt={item.name}
                      wrapperClassName="absolute inset-0 w-full h-full"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex gap-1 sm:gap-1.5">
                      {item.is_spicy && (
                        <span className="bg-destructive/90 text-destructive-foreground text-[10px] sm:text-xs font-medium px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full backdrop-blur-sm flex items-center gap-0.5 sm:gap-1">
                          <Flame className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> Spicy
                        </span>
                      )}
                      {item.is_veg && (
                        <span className="bg-primary/90 text-primary-foreground text-[10px] sm:text-xs font-medium px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full backdrop-blur-sm flex items-center gap-0.5 sm:gap-1">
                          <Leaf className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> Veg
                        </span>
                      )}
                    </div>
                    <div className="absolute top-2 right-2 sm:top-3 sm:right-3">
                      <span className="bg-secondary/90 text-secondary-foreground text-[10px] sm:text-xs font-bold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full backdrop-blur-sm flex items-center gap-0.5 sm:gap-1">
                        <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-current" /> Popular
                      </span>
                    </div>
                  </div>
                  <div className="p-2.5 sm:p-3 md:p-4">
                    <p className="text-[10px] sm:text-xs text-muted-foreground font-medium uppercase tracking-wider mb-0.5 sm:mb-1">
                      {item.category}
                    </p>
                    <h3 className="font-display text-sm sm:text-base font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                      {item.name}
                    </h3>
                    {item.description && (
                      <p className="text-muted-foreground text-xs sm:text-sm mt-0.5 line-clamp-1">
                        {item.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-2 sm:mt-3">
                      <span className="text-base sm:text-lg font-bold text-primary">
                        ৳{item.price}
                      </span>
                      <Button
                        size="sm"
                        className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 gap-1 sm:gap-1.5 text-xs sm:text-sm h-7 sm:h-8 px-2.5 sm:px-3"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleAddToCart(item);
                        }}
                      >
                        <ShoppingBag className="w-3 h-3 sm:w-4 sm:h-4" />
                        Add
                      </Button>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </motion.div>

        {/* View all link */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="text-center mt-6"
        >
          <Link to="/menu">
            <Button
              size="default"
              variant="outline"
              className="rounded-full border-primary text-primary hover:bg-primary hover:text-primary-foreground gap-2 px-6 py-4 text-sm transition-all duration-300"
            >
              View All Dishes
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
});

PopularItems.displayName = "PopularItems";

export default PopularItems;
