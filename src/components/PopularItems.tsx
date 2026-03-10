import { useState, useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Star, Flame, Leaf, ShoppingBag, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

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

const PopularItems = () => {
  const [items, setItems] = useState<PopularItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [scrollIndex, setScrollIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "100px" });
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

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
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
    <section ref={ref} className="py-16 md:py-24 bg-gradient-to-b from-background to-muted/20 overflow-hidden">
      <div className="container px-4 md:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6 }}
          className="flex items-end justify-between mb-10 md:mb-14"
        >
          <div>
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/15 text-secondary-foreground text-sm font-medium mb-4 border border-secondary/30">
              <Star className="w-4 h-4 fill-secondary text-secondary" />
              Customer Favorites
            </span>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-foreground">
              Popular <span className="text-secondary">Dishes</span>
            </h2>
          </div>
          <div className="hidden sm:flex gap-2">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full border-border hover:bg-primary hover:text-primary-foreground transition-colors"
              onClick={() => scroll("left")}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
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
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div
            ref={scrollRef}
            className="flex gap-5 md:gap-6 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-4 -mx-4 px-4"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {items.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ delay: 0.1 * Math.min(index, 5), duration: 0.5 }}
                className="min-w-[260px] sm:min-w-[280px] md:min-w-[300px] snap-start"
              >
                <Link
                  to={`/product/${item.id}`}
                  className="group block bg-card rounded-2xl border border-border overflow-hidden hover:shadow-xl hover:border-primary/30 transition-all duration-300"
                >
                  {/* Image */}
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img
                      src={item.image_url || dishButterChicken}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex gap-1.5">
                      {item.is_spicy && (
                        <span className="bg-destructive/90 text-destructive-foreground text-xs font-medium px-2 py-1 rounded-full backdrop-blur-sm flex items-center gap-1">
                          <Flame className="w-3 h-3" /> Spicy
                        </span>
                      )}
                      {item.is_veg && (
                        <span className="bg-primary/90 text-primary-foreground text-xs font-medium px-2 py-1 rounded-full backdrop-blur-sm flex items-center gap-1">
                          <Leaf className="w-3 h-3" /> Veg
                        </span>
                      )}
                    </div>
                    {/* Popular badge */}
                    <div className="absolute top-3 right-3">
                      <span className="bg-secondary/90 text-secondary-foreground text-xs font-bold px-2.5 py-1 rounded-full backdrop-blur-sm flex items-center gap-1">
                        <Star className="w-3 h-3 fill-current" /> Popular
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4 md:p-5">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">
                      {item.category}
                    </p>
                    <h3 className="font-display text-lg font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                      {item.name}
                    </h3>
                    {item.description && (
                      <p className="text-muted-foreground text-sm mt-1 line-clamp-2">
                        {item.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-4">
                      <span className="text-xl font-bold text-primary">
                        ৳{item.price}
                      </span>
                      <Button
                        size="sm"
                        className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleAddToCart(item);
                        }}
                      >
                        <ShoppingBag className="w-4 h-4" />
                        Add
                      </Button>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* View all link */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="text-center mt-10"
        >
          <Link to="/menu">
            <Button
              size="lg"
              variant="outline"
              className="rounded-full border-primary text-primary hover:bg-primary hover:text-primary-foreground gap-2 px-8 py-6 text-base transition-all duration-300"
            >
              View All Dishes
              <ChevronRight className="h-5 w-5" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default PopularItems;
