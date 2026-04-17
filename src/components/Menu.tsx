import { useState, useRef, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import { Flame, Leaf, Star, Plus, Minus, ShoppingBag, Loader2, Eye } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import ImageLightbox from "@/components/ImageLightbox";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/contexts/CartContext";

// Import local dish images as fallbacks
import dishBiryani from "@/assets/dish-biryani.jpg";
import dishButterChicken from "@/assets/dish-butter-chicken.jpg";
import dishFish from "@/assets/dish-fish.jpg";
import dishVegetable from "@/assets/dish-vegetable.jpg";
import dishCoffee from "@/assets/dish-coffee.jpg";
import dishBurger from "@/assets/dish-burger.jpg";

// Map categories/keywords to fallback images
const getFallbackImage = (name: string, category: string): string => {
  const lowerName = name.toLowerCase();
  const lowerCategory = category.toLowerCase();
  
  if (lowerName.includes('biryani')) return dishBiryani;
  if (lowerName.includes('butter chicken') || lowerName.includes('tikka') || lowerName.includes('paneer')) return dishButterChicken;
  if (lowerName.includes('fish') || lowerName.includes('ilish')) return dishFish;
  if (lowerName.includes('vegetable') || lowerName.includes('veg curry')) return dishVegetable;
  if (lowerName.includes('coffee') || lowerName.includes('cappuccino') || lowerName.includes('lassi')) return dishCoffee;
  if (lowerName.includes('burger')) return dishBurger;
  
  // Category-based fallbacks
  if (lowerCategory.includes('beverage') || lowerCategory.includes('drink')) return dishCoffee;
  if (lowerCategory.includes('main') || lowerCategory.includes('curry')) return dishButterChicken;
  if (lowerCategory.includes('biryani')) return dishBiryani;
  
  return dishButterChicken; // Default fallback
};

interface MenuItem {
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
  is_active: boolean | null;
}

interface Category {
  id: string;
  name: string;
  icon_url: string | null;
  is_visible: boolean;
  sort_order: number;
}

const Menu = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lightboxItem, setLightboxItem] = useState<MenuItem | null>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const { toast } = useToast();
  const { addItem } = useCart();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    // Fetch categories and menu items in parallel
    const [categoriesResult, menuResult] = await Promise.all([
      supabase
        .from('categories')
        .select('*')
        .eq('is_visible', true)
        .order('sort_order', { ascending: true }),
      supabase
        .from('menu_items')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
    ]);

    if (categoriesResult.error) {
      console.error('Error fetching categories:', categoriesResult.error);
    } else {
      setCategories(categoriesResult.data || []);
    }

    if (menuResult.error) {
      console.error('Error fetching menu items:', menuResult.error);
    } else {
      // Show only first 6 items on homepage (featured/new items)
      setMenuItems((menuResult.data || []).slice(0, 6));
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

  const handleViewImage = (item: MenuItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setLightboxItem(item);
    setIsLightboxOpen(true);
  };

  const handleImageClick = (item: MenuItem) => {
    navigate(`/product/${item.id}`);
  };

  const getItemImages = (item: MenuItem): string[] => {
    const allImages: string[] = [];
    if (item.images && item.images.length > 0) {
      allImages.push(...item.images.filter(img => img && img.trim() !== ''));
    }
    if (allImages.length === 0) {
      const primaryImage = item.image_url || getFallbackImage(item.name, item.category);
      allImages.push(primaryImage);
    }
    return allImages;
  };

  const handleAddToOrder = () => {
    if (selectedItem) {
      for (let i = 0; i < quantity; i++) {
        addItem({
          id: selectedItem.id,
          name: selectedItem.name,
          price: selectedItem.price,
          image_url: selectedItem.image_url || undefined
        });
      }
      toast({
        title: "Added to Cart! 🎉",
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
            Featured Items
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
            Discover Our <span className="text-secondary">Signature Dishes</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            A taste of our most popular and newly added dishes
          </p>
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
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 md:gap-8">
            {filteredItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.1 * index, duration: 0.5 }}
                className="group bg-card rounded-2xl overflow-hidden shadow-elegant border border-border hover:shadow-elegant-lg transition-all duration-300"
              >
                {/* Image - Click to go to product details */}
                <div 
                  className="relative aspect-[4/3] overflow-hidden bg-muted cursor-pointer"
                  onClick={() => handleImageClick(item)}
                >
                  <img
                    src={item.image_url || getFallbackImage(item.name, item.category)}
                    alt={item.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {/* Eye Icon - View Full Image */}
                  <button
                    onClick={(e) => handleViewImage(item, e)}
                    className="absolute top-4 right-4 p-2 rounded-full bg-card/90 backdrop-blur-sm text-foreground hover:bg-secondary hover:text-secondary-foreground transition-all duration-200 opacity-0 group-hover:opacity-100 shadow-lg"
                    title="View full image"
                  >
                    <Eye className="h-5 w-5" />
                  </button>

                  {/* Badges */}
                  <div className="absolute top-2 left-2 md:top-4 md:left-4 flex flex-wrap gap-1 md:gap-2">
                    {item.is_popular && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 md:px-2 md:py-1 rounded-full bg-secondary text-secondary-foreground text-[10px] md:text-xs font-medium">
                        <Star className="h-2.5 w-2.5 md:h-3 md:w-3 fill-current" />
                        Popular
                      </span>
                    )}
                    {item.is_spicy && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 md:px-2 md:py-1 rounded-full bg-destructive text-destructive-foreground text-[10px] md:text-xs font-medium">
                        <Flame className="h-2.5 w-2.5 md:h-3 md:w-3" />
                        Spicy
                      </span>
                    )}
                    {item.is_veg && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 md:px-2 md:py-1 rounded-full bg-green-500 text-white text-[10px] md:text-xs font-medium">
                        <Leaf className="h-2.5 w-2.5 md:h-3 md:w-3" />
                        Veg
                      </span>
                    )}
                  </div>

                  {/* Price Badge */}
                  <div className="absolute bottom-2 right-2 md:bottom-4 md:right-4">
                    <span className="inline-block px-2 py-1 md:px-3 md:py-1.5 rounded-lg bg-card/95 backdrop-blur-sm font-display text-sm md:text-lg font-bold text-secondary">
                      ৳{item.price}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-3 md:p-6">
                  <div className="flex items-start justify-between gap-2 md:gap-4 mb-2">
                    <h3 className="font-display text-sm md:text-xl font-semibold text-foreground group-hover:text-secondary transition-colors line-clamp-2">
                      {item.name}
                    </h3>
                    <span className="hidden md:inline text-xs text-muted-foreground bg-muted px-2 py-1 rounded whitespace-nowrap">
                      {item.category}
                    </span>
                  </div>
                  <p className="text-muted-foreground text-xs md:text-sm leading-relaxed mb-3 md:mb-4 line-clamp-2">
                    {item.description}
                  </p>
                  <Button 
                    onClick={() => handleItemClick(item)}
                    size="sm"
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-xs md:text-sm"
                  >
                    <ShoppingBag className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
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
          <Link to="/menu">
            <Button size="lg" variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
              View Full Menu
            </Button>
          </Link>
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
              <img 
                src={selectedItem.image_url || getFallbackImage(selectedItem.name, selectedItem.category)} 
                alt={selectedItem.name} 
                className="w-full h-48 object-cover rounded-lg"
              />
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

      {/* Image Lightbox */}
      {lightboxItem && (
        <ImageLightbox
          images={getItemImages(lightboxItem)}
          isOpen={isLightboxOpen}
          onClose={() => {
            setIsLightboxOpen(false);
            setLightboxItem(null);
          }}
          alt={lightboxItem.name}
        />
      )}
    </section>
  );
};

export default Menu;
