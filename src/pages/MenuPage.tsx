import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { 
  Flame, Leaf, Star, Plus, Minus, ShoppingBag, Loader2, Eye, ArrowLeft, Search, ArrowUpDown,
  UtensilsCrossed, Coffee, Pizza, Salad, Beef, Fish as FishIcon, Soup, IceCream, Cookie, 
  Sandwich, Drumstick, Egg, Croissant, Apple, Cherry, Grape, Cake, Wine, Beer, 
  GlassWater, CupSoda, Milk, Wheat, ChefHat, LucideIcon
} from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import ImageLightbox from "@/components/ImageLightbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/contexts/CartContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BlurImage from "@/components/ui/blur-image";
import { resolveImageUrl, sanitizeImageUrl } from "@/lib/imageUrl";


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

// Map of preset icon names to their components
const presetIconMap: Record<string, LucideIcon> = {
  UtensilsCrossed, ChefHat, Pizza, Beef, Drumstick, Fish: FishIcon, Salad, Soup, Sandwich,
  Egg, Coffee, CupSoda, Beer, Wine, GlassWater, Milk, IceCream, Cake, Cookie,
  Croissant, Apple, Cherry, Grape, Flame, Leaf, Wheat
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

const MenuPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryFromUrl = searchParams.get('category');
  
  const [activeCategory, setActiveCategory] = useState(categoryFromUrl || "All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"default" | "price_low" | "price_high" | "newest">("default");
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lightboxItem, setLightboxItem] = useState<MenuItem | null>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const { toast } = useToast();
  const { addItem } = useCart();

  // Sync URL param with state
  useEffect(() => {
    if (categoryFromUrl && categoryFromUrl !== activeCategory) {
      setActiveCategory(categoryFromUrl);
    }
  }, [categoryFromUrl]);

  // Update URL when category changes
  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    if (category === "All") {
      searchParams.delete('category');
    } else {
      searchParams.set('category', category);
    }
    setSearchParams(searchParams);
  };

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
      setMenuItems(menuResult.data || []);
    }
    setIsLoading(false);
  };

  // Filter and sort items
  const filteredAndSortedItems = useMemo(() => {
    let result = [...menuItems];
    
    // Category filter
    if (activeCategory !== "All") {
      result = result.filter(item => item.category === activeCategory);
    }
    
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(item => 
        item.name.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query)
      );
    }
    
    // Sorting
    switch (sortBy) {
      case "price_low":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price_high":
        result.sort((a, b) => b.price - a.price);
        break;
      case "newest":
        result.sort((a, b) => new Date(b.id).getTime() - new Date(a.id).getTime());
        break;
      default:
        // Keep original sort_order
        break;
    }
    
    return result;
  }, [menuItems, activeCategory, searchQuery, sortBy]);

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
      const cleaned = item.images
        .map((img) => sanitizeImageUrl(img))
        .filter((img): img is string => Boolean(img));
      allImages.push(...cleaned);
    }
    if (allImages.length === 0) {
      const primaryImage = sanitizeImageUrl(item.image_url) || getFallbackImage(item.name, item.category);
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
    <div className="min-h-screen bg-background">
      <Header />
      
      
      <main className="pt-24 pb-16">
        <div className="container">
          {/* Back Link */}
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>

          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-2xl mx-auto mb-12"
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-secondary/20 text-secondary-foreground text-sm font-medium mb-4">
              Full Menu
            </span>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
              Explore Our <span className="text-secondary">Complete Menu</span>
            </h1>
            <p className="text-muted-foreground text-lg">
              Browse through all our delicious dishes and find your favorites
            </p>
          </motion.div>

          {/* Search and Sort Controls */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 mb-6 max-w-2xl mx-auto"
          >
            {/* Search Bar */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search dishes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-card border-border"
              />
            </div>
            
            {/* Sort Dropdown */}
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-full sm:w-[180px] bg-card border-border">
                <ArrowUpDown className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="price_low">Price: Low to High</SelectItem>
                <SelectItem value="price_high">Price: High to Low</SelectItem>
                <SelectItem value="newest">Newest First</SelectItem>
              </SelectContent>
            </Select>
          </motion.div>

          {/* Category Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="flex flex-wrap justify-center gap-3 mb-12"
          >
            <Button
              variant={activeCategory === "All" ? "default" : "outline"}
              onClick={() => handleCategoryChange("All")}
              className={activeCategory === "All" 
                ? "bg-primary text-primary-foreground" 
                : "border-border text-muted-foreground hover:text-foreground hover:border-primary"
              }
            >
              All
            </Button>
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={activeCategory === category.name ? "default" : "outline"}
                onClick={() => handleCategoryChange(category.name)}
                className={`gap-2 ${activeCategory === category.name 
                  ? "bg-primary text-primary-foreground" 
                  : "border-border text-muted-foreground hover:text-foreground hover:border-primary"
                }`}
              >
                {category.icon_url && (
                  category.icon_url.startsWith('preset:') ? (
                    (() => {
                      const iconName = category.icon_url.replace('preset:', '');
                      const IconComponent = presetIconMap[iconName] || UtensilsCrossed;
                      return <IconComponent className="w-4 h-4" />;
                    })()
                  ) : (
                    <img 
                      src={category.icon_url} 
                      alt="" 
                      className="w-4 h-4 object-cover rounded"
            loading="lazy"
            decoding="async"/>
                  )
                )}
                {category.name}
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
          {!isLoading && filteredAndSortedItems.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {searchQuery ? `No items found for "${searchQuery}"` : "No menu items available at the moment."}
              </p>
              {searchQuery && (
                <Button variant="link" onClick={() => setSearchQuery("")} className="mt-2">
                  Clear search
                </Button>
              )}
            </div>
          )}

          {/* Results Count */}
          {!isLoading && filteredAndSortedItems.length > 0 && (searchQuery || activeCategory !== "All") && (
            <div className="text-center mb-6">
              <p className="text-sm text-muted-foreground">
                Showing {filteredAndSortedItems.length} {filteredAndSortedItems.length === 1 ? 'item' : 'items'}
                {searchQuery && ` for "${searchQuery}"`}
                {activeCategory !== "All" && ` in ${activeCategory}`}
              </p>
            </div>
          )}

          {/* Menu Grid */}
          {!isLoading && filteredAndSortedItems.length > 0 && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredAndSortedItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * index, duration: 0.5 }}
                  className="group bg-card rounded-2xl overflow-hidden shadow-elegant border border-border hover:shadow-elegant-lg transition-all duration-300"
                >
                  {/* Image - Click to go to product details */}
                  <div 
                    className="relative aspect-[4/3] overflow-hidden bg-muted cursor-pointer"
                    onClick={() => handleImageClick(item)}
                  >
                    <BlurImage
                      src={item.image_url || getFallbackImage(item.name, item.category)}
                      alt={item.name}
                      wrapperClassName="absolute inset-0 w-full h-full"
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
        </div>
      </main>

      <Footer />

      {/* Order Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">{selectedItem?.name}</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <BlurImage
                src={selectedItem.image_url || getFallbackImage(selectedItem.name, selectedItem.category)}
                alt={selectedItem.name}
                wrapperClassName="block w-full h-48 rounded-lg"
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
    </div>
  );
};

export default MenuPage;
