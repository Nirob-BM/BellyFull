import { useState, useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Link } from "react-router-dom";
import { Loader2, UtensilsCrossed, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon_url: string | null;
  is_visible: boolean;
  sort_order: number;
}

interface CategoryWithCount extends Category {
  itemCount: number;
}

const CategoryShowcase = () => {
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    fetchCategoriesWithCounts();
  }, []);

  const fetchCategoriesWithCounts = async () => {
    // Fetch categories and menu items in parallel
    const [categoriesResult, menuItemsResult] = await Promise.all([
      supabase
        .from('categories')
        .select('*')
        .eq('is_visible', true)
        .order('sort_order', { ascending: true }),
      supabase
        .from('menu_items')
        .select('category')
        .eq('is_active', true)
    ]);

    if (categoriesResult.error) {
      console.error('Error fetching categories:', categoriesResult.error);
      setIsLoading(false);
      return;
    }

    // Count items per category
    const itemCounts: Record<string, number> = {};
    if (menuItemsResult.data) {
      menuItemsResult.data.forEach(item => {
        itemCounts[item.category] = (itemCounts[item.category] || 0) + 1;
      });
    }

    // Merge counts with categories
    const categoriesWithCounts: CategoryWithCount[] = (categoriesResult.data || []).map(cat => ({
      ...cat,
      itemCount: itemCounts[cat.name] || 0
    }));

    setCategories(categoriesWithCounts);
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <section className="py-16 bg-muted/30">
        <div className="container flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </section>
    );
  }

  if (categories.length === 0) {
    return null;
  }

  const totalItems = categories.reduce((sum, cat) => sum + cat.itemCount, 0);

  return (
    <section id="categories" className="py-16 md:py-24 bg-gradient-to-b from-background via-muted/30 to-background" ref={ref}>
      <div className="container px-4 md:px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-10 md:mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4 border border-primary/20">
            <UtensilsCrossed className="w-4 h-4" />
            Explore Our Menu
          </span>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4">
            Browse by <span className="text-secondary">Category</span>
          </h2>
          <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
            Discover {totalItems}+ delicious dishes across {categories.length} categories, 
            crafted with love and the finest ingredients
          </p>
        </motion.div>

        {/* Category Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
          {categories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={isInView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 20, scale: 0.95 }}
              transition={{ delay: 0.1 * Math.min(index, 6), duration: 0.5, ease: "easeOut" }}
            >
              <Link
                to={`/menu?category=${encodeURIComponent(category.name)}`}
                className="group relative flex flex-col items-center p-5 sm:p-6 md:p-8 bg-card rounded-2xl md:rounded-3xl border border-border hover:border-primary/50 hover:shadow-xl transition-all duration-300 h-full overflow-hidden"
              >
                {/* Background Glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                {/* Item Count Badge */}
                <div className="absolute top-3 right-3 md:top-4 md:right-4 bg-secondary text-secondary-foreground text-xs font-bold px-2.5 py-1 rounded-full min-w-[28px] text-center shadow-lg z-10">
                  {category.itemCount}
                </div>

                {/* Icon Container */}
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 mb-4 md:mb-6 rounded-full bg-gradient-to-br from-primary/15 to-secondary/15 flex items-center justify-center overflow-hidden group-hover:scale-110 transition-transform duration-500 shadow-md">
                  {category.icon_url ? (
                    <img
                      src={category.icon_url}
                      alt={category.name}
                      className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 object-contain"
                    />
                  ) : (
                    <UtensilsCrossed className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 text-primary" />
                  )}
                  {/* Glow effect on hover */}
                  <div className="absolute inset-0 bg-primary/25 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-full blur-xl" />
                </div>

                {/* Category Name */}
                <h3 className="font-display text-base sm:text-lg md:text-xl font-semibold text-foreground text-center group-hover:text-primary transition-colors duration-300 line-clamp-2 relative z-10">
                  {category.name}
                </h3>

                {/* Item count text */}
                <p className="text-muted-foreground text-xs sm:text-sm text-center mt-1 md:mt-2 relative z-10">
                  {category.itemCount} {category.itemCount === 1 ? 'item' : 'items'}
                </p>

                {/* Description (if exists) */}
                {category.description && (
                  <p className="text-muted-foreground text-xs text-center mt-2 line-clamp-2 hidden md:block relative z-10">
                    {category.description}
                  </p>
                )}

                {/* Arrow indicator on hover */}
                <div className="mt-3 md:mt-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                  <ChevronRight className="w-5 h-5 text-primary" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* View All Menu CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="text-center mt-10 md:mt-14"
        >
          <Link to="/menu">
            <Button 
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 px-8 py-6 text-base md:text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
            >
              View Full Menu
              <ChevronRight className="h-5 w-5" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default CategoryShowcase;
