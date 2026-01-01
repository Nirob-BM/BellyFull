import { useState, useRef, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import { Flame, Leaf, Star, Plus, Minus, ShoppingBag, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  image_url: string | null;
  is_popular: boolean | null;
  is_spicy: boolean | null;
  is_veg: boolean | null;
  is_active: boolean | null;
}

const Menu = () => {
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<string[]>(["All"]);
  const [isLoading, setIsLoading] = useState(true);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const { toast } = useToast();

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching menu items:', error);
    } else {
      setMenuItems(data || []);
      // Extract unique categories
      const uniqueCategories = [...new Set((data || []).map(item => item.category))];
      setCategories(["All", ...uniqueCategories]);
    }
    setIsLoading(false);
  };

  const filteredItems = activeCategory === "All" 
    ? menuItems 
    : menuItems.filter(item => item.category === activeCategory);

  const handleItemClick = (item: MenuItem) => {
    setSelectedItem(item);
    setQuantity(1);
    setIsDialogOpen(true);
  };

  const handleAddToOrder = () => {
    if (selectedItem) {
      toast({
        title: "Added to Order! 🎉",
        description: `${quantity}x ${selectedItem.name} - ৳${selectedItem.price * quantity}`,
      });
      setIsDialogOpen(false);
      setSelectedItem(null);
      setQuantity(1);
    }
  };

  return (
    <section id="menu" className="py-24 bg-background" ref={ref}>
      <div className="container">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto mb-12"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-secondary/20 text-secondary-foreground text-sm font-medium mb-4">
            Our Menu
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
            Discover Our <span className="text-secondary">Signature Dishes</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Explore our carefully crafted menu featuring the finest multicuisine selections
          </p>
        </motion.div>

        {/* Category Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="flex flex-wrap justify-center gap-3 mb-12"
        >
          {categories.map((category) => (
            <Button
              key={category}
              variant={activeCategory === category ? "default" : "outline"}
              onClick={() => setActiveCategory(category)}
              className={activeCategory === category 
                ? "bg-primary text-primary-foreground" 
                : "border-border text-muted-foreground hover:text-foreground hover:border-primary"
              }
            >
              {category}
            </Button>
          ))}
        </motion.div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredItems.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No menu items available at the moment.</p>
          </div>
        )}

        {/* Menu Grid */}
        {!isLoading && filteredItems.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.1 * index, duration: 0.5 }}
                className="group bg-card rounded-2xl overflow-hidden shadow-elegant border border-border hover:shadow-elegant-lg transition-all duration-300"
              >
                {/* Image */}
                <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      No Image
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {/* Badges */}
                  <div className="absolute top-4 left-4 flex gap-2">
                    {item.is_popular && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-medium">
                        <Star className="h-3 w-3 fill-current" />
                        Popular
                      </span>
                    )}
                    {item.is_spicy && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-destructive text-destructive-foreground text-xs font-medium">
                        <Flame className="h-3 w-3" />
                        Spicy
                      </span>
                    )}
                    {item.is_veg && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-500 text-white text-xs font-medium">
                        <Leaf className="h-3 w-3" />
                        Veg
                      </span>
                    )}
                  </div>

                  {/* Price Badge */}
                  <div className="absolute bottom-4 right-4">
                    <span className="inline-block px-3 py-1.5 rounded-lg bg-card/95 backdrop-blur-sm font-display text-lg font-bold text-secondary">
                      ৳{item.price}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <h3 className="font-display text-xl font-semibold text-foreground group-hover:text-secondary transition-colors">
                      {item.name}
                    </h3>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                      {item.category}
                    </span>
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                    {item.description}
                  </p>
                  <Button 
                    onClick={() => handleItemClick(item)}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    <ShoppingBag className="h-4 w-4 mr-2" />
                    Order Now
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* View Full Menu CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="text-center mt-12"
        >
          <Button size="lg" variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
            View Full Menu
          </Button>
        </motion.div>
      </div>

      {/* Order Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">{selectedItem?.name}</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              {selectedItem.image_url ? (
                <img 
                  src={selectedItem.image_url} 
                  alt={selectedItem.name} 
                  className="w-full h-48 object-cover rounded-lg"
                />
              ) : (
                <div className="w-full h-48 bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
                  No Image
                </div>
              )}
              <p className="text-muted-foreground">{selectedItem.description}</p>
              
              <div className="flex items-center justify-between">
                <span className="font-display text-2xl font-bold text-secondary">
                  ৳{selectedItem.price * quantity}
                </span>
                <div className="flex items-center gap-3">
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="font-semibold text-lg w-8 text-center">{quantity}</span>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Button onClick={handleAddToOrder} className="w-full bg-primary text-primary-foreground">
                <ShoppingBag className="h-4 w-4 mr-2" />
                Add to Order - ৳{selectedItem.price * quantity}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default Menu;
