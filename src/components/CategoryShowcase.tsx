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
    <section id="categories" className="py-20 bg-muted/30" ref={ref}>
      <div className="container">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto mb-12"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Explore Our Menu
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
            Browse by <span className="text-secondary">Category</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Discover {totalItems}+ delicious dishes across {categories.length} categories
          </p>
        </motion.div>

        {/* Category Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
          {categories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
              transition={{ delay: 0.1 * Math.min(index, 5), duration: 0.4 }}
            >
              <Link
                to={`/menu?category=${encodeURIComponent(category.name)}`}
                className="group relative flex flex-col items-center p-4 sm:p-6 bg-card rounded-2xl border border-border hover:border-primary/50 hover:shadow-elegant transition-all duration-300 h-full"
              >
                {/* Item Count Badge */}
                <div className="absolute -top-2 -right-2 sm:top-2 sm:right-2 bg-secondary text-secondary-foreground text-xs font-bold px-2 py-1 rounded-full min-w-[24px] text-center shadow-md">
                  {category.itemCount}
                </div>

                {/* Icon Container */}
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 mb-3 sm:mb-4 rounded-full bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center overflow-hidden group-hover:scale-110 transition-transform duration-300">
                  {category.icon_url ? (
                    <img
                      src={category.icon_url}
                      alt={category.name}
                      className="w-10 h-10 sm:w-12 sm:h-12 object-contain"
                    />
                  ) : (
                    <UtensilsCrossed className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
                  )}
                  {/* Glow effect on hover */}
                  <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full blur-md" />
                </div>

                {/* Category Name */}
                <h3 className="font-display text-base sm:text-lg font-semibold text-foreground text-center group-hover:text-primary transition-colors line-clamp-2">
                  {category.name}
                </h3>

                {/* Item count text */}
                <p className="text-muted-foreground text-xs text-center mt-1">
                  {category.itemCount} {category.itemCount === 1 ? 'item' : 'items'}
                </p>

                {/* Description (if exists) */}
                {category.description && (
                  <p className="text-muted-foreground text-xs text-center mt-1 line-clamp-2 hidden sm:block">
                    {category.description}
                  </p>
                )}
              </Link>
            </motion.div>
          ))}
        </div>

        {/* View All Menu CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="text-center mt-10"
        >
          <Link to="/menu">
            <Button 
              variant="outline" 
              size="lg"
              className="border-primary text-primary hover:bg-primary hover:text-primary-foreground gap-2"
            >
              View All Categories
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default CategoryShowcase;
