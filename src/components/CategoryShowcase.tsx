import { useState, useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Link } from "react-router-dom";
import { Loader2, UtensilsCrossed } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon_url: string | null;
  is_visible: boolean;
  sort_order: number;
}

const CategoryShowcase = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_visible', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching categories:', error);
    } else {
      setCategories(data || []);
    }
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

  return (
    <section id="categories" className="py-20 bg-muted/30" ref={ref}>
      <div className="container">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
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
            Discover our diverse selection of dishes organized by category
          </p>
        </motion.div>

        {/* Category Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
          {categories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: 0.1 * index, duration: 0.4 }}
            >
              <Link
                to={`/menu?category=${encodeURIComponent(category.name)}`}
                className="group flex flex-col items-center p-6 bg-card rounded-2xl border border-border hover:border-primary/50 hover:shadow-elegant transition-all duration-300"
              >
                {/* Icon Container */}
                <div className="relative w-20 h-20 mb-4 rounded-full bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center overflow-hidden group-hover:scale-110 transition-transform duration-300">
                  {category.icon_url ? (
                    <img
                      src={category.icon_url}
                      alt={category.name}
                      className="w-12 h-12 object-contain"
                    />
                  ) : (
                    <UtensilsCrossed className="w-8 h-8 text-primary" />
                  )}
                  {/* Glow effect on hover */}
                  <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full blur-md" />
                </div>

                {/* Category Name */}
                <h3 className="font-display text-lg font-semibold text-foreground text-center group-hover:text-primary transition-colors">
                  {category.name}
                </h3>

                {/* Description (if exists) */}
                {category.description && (
                  <p className="text-muted-foreground text-xs text-center mt-1 line-clamp-2">
                    {category.description}
                  </p>
                )}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoryShowcase;
