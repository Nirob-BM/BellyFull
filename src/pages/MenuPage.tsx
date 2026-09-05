import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { 
  Flame, Leaf, Star, Plus, Minus, ShoppingBag, Eye, ArrowLeft, Search, ArrowUpDown,
  UtensilsCrossed, Coffee, Pizza, Salad, Beef, Fish as FishIcon, Soup, IceCream, Cookie, 
  Sandwich, Drumstick, Egg, Croissant, Apple, Cherry, Grape, Cake, Wine, Beer, 
  GlassWater, CupSoda, Milk, Wheat, ChefHat, LucideIcon
} from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import ImageLightbox from "@/components/ImageLightbox";
import DishDetailModal from "@/components/DishDetailModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/contexts/CartContext";
import { useOpeningStatus } from "@/hooks/useOpeningStatus";
import Header from "@/components/Header";
import ComingSoonBanner from "@/components/ComingSoonBanner";
import Footer from "@/components/Footer";
import BlurImage from "@/components/ui/blur-image";
import { resolveImageUrl, sanitizeImageUrl } from "@/lib/imageUrl";
import { Helmet } from "react-helmet-async";


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
  ingredients?: string[] | null;
  allergens?: string[] | null;
  spice_level?: number | null;
  prep_time_minutes?: number | null;
}

interface Category {
  id: string;
  name: string;
  icon_url: string | null;
  is_visible: boolean;
  sort_order: number;
}

// Skeleton card that mirrors the real menu card layout for perceived speed
const MenuCardSkeleton = () => (
  <div
    aria-hidden="true"
    className="bg-card rounded-2xl overflow-hidden shadow-elegant border border-border animate-pulse"
  >
    <div className="aspect-[4/3] bg-muted" />
    <div className="p-4 sm:p-5 lg:p-6 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="h-5 bg-muted rounded-md w-2/3" />
        <div className="hidden sm:block h-5 bg-muted rounded-md w-14" />
      </div>
      <div className="space-y-2">
        <div className="h-3.5 bg-muted rounded-md w-full" />
        <div className="h-3.5 bg-muted rounded-md w-4/5" />
      </div>
      <div className="h-9 bg-muted rounded-md w-full" />
    </div>
  </div>
);

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
  const [detailItem, setDetailItem] = useState<MenuItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [dietFilters, setDietFilters] = useState({ veg: false, mildOnly: false, popular: false });
  const [excludedAllergens, setExcludedAllergens] = useState<string[]>([]);
  const { toast } = useToast();
  const { addItem } = useCart();
  const { isOpen: isRestaurantOpen, isLoading: hoursLoading, nextOpeningLabel } = useOpeningStatus();
  const canOrder = hoursLoading || isRestaurantOpen;
  const closedReason = nextOpeningLabel
    ? `${nextOpeningLabel}. You can still browse the menu.`
    : "Ordering reopens with our next service.";

  // Section refs for scroll-spy + smooth scroll navigation
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const isProgrammaticScroll = useRef(false);

  const scrollToCategory = useCallback((category: string) => {
    if (category === "All") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const el = sectionRefs.current[category];
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 150;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  }, []);

  // Sync URL param with state
  useEffect(() => {
    if (categoryFromUrl && categoryFromUrl !== activeCategory) {
      setActiveCategory(categoryFromUrl);
    }
  }, [categoryFromUrl]);

  // Update URL + smooth scroll when a tab is tapped
  const handleCategoryChange = (category: string) => {
    isProgrammaticScroll.current = true;
    setActiveCategory(category);
    if (category === "All") {
      searchParams.delete('category');
    } else {
      searchParams.set('category', category);
    }
    setSearchParams(searchParams, { preventScrollReset: true });
    scrollToCategory(category);
    // Re-enable scroll-spy shortly after the smooth scroll settles
    window.setTimeout(() => { isProgrammaticScroll.current = false; }, 900);
  };

  useEffect(() => {
    fetchData();

    // Live updates: refetch when admin edits menu items or categories
    const channel = supabase
      .channel('menu-live-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => fetchData())
      .subscribe();

    // Also refetch when the app/tab becomes visible again
    const onVisible = () => {
      if (document.visibilityState === 'visible') fetchData();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);

    return () => {
      supabase.removeChannel(channel);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
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

  // All allergens present across the menu, for exclusion filters
  const allAllergens = useMemo(() => {
    const set = new Set<string>();
    menuItems.forEach(item => item.allergens?.forEach(a => set.add(a)));
    return Array.from(set).sort();
  }, [menuItems]);

  // Filter and sort items
  const filteredAndSortedItems = useMemo(() => {
    let result = [...menuItems];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(item => 
        item.name.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query) ||
        item.ingredients?.some(ing => ing.toLowerCase().includes(query))
      );
    }

    // Dietary filters
    if (dietFilters.veg) {
      result = result.filter(item => item.is_veg);
    }
    if (dietFilters.mildOnly) {
      result = result.filter(item => !item.is_spicy);
    }
    if (dietFilters.popular) {
      result = result.filter(item => item.is_popular);
    }

    // Allergen exclusions
    if (excludedAllergens.length > 0) {
      result = result.filter(item =>
        !item.allergens?.some(a => excludedAllergens.includes(a))
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
  }, [menuItems, searchQuery, sortBy, dietFilters, excludedAllergens]);

  // Group the filtered items into their visible categories (in sort order)
  const groupedItems = useMemo(() => {
    const groups: { category: Category; items: MenuItem[] }[] = [];
    for (const cat of categories) {
      const items = filteredAndSortedItems.filter((i) => i.category === cat.name);
      if (items.length > 0) groups.push({ category: cat, items });
    }
    // Items whose category isn't in the visible categories list
    const known = new Set(categories.map((c) => c.name));
    const other = filteredAndSortedItems.filter((i) => !known.has(i.category));
    if (other.length > 0) {
      groups.push({
        category: { id: "other", name: "Other", icon_url: null, is_visible: true, sort_order: 999 },
        items: other,
      });
    }
    return groups;
  }, [filteredAndSortedItems, categories]);

  // Scroll-spy: highlight the tab for the section currently in view
  useEffect(() => {
    if (isLoading || groupedItems.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (isProgrammaticScroll.current) return;
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const cat = entry.target.getAttribute("data-category");
            if (cat) setActiveCategory(cat);
          }
        }
      },
      { rootMargin: "-160px 0px -55% 0px", threshold: 0 }
    );
    Object.values(sectionRefs.current).forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [isLoading, groupedItems]);

  // Keep the active tab scrolled into view inside the tab bar
  useEffect(() => {
    const tab = tabRefs.current[activeCategory];
    tab?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [activeCategory]);

  // Deep link: scroll to the category from the URL once data has loaded
  useEffect(() => {
    if (!isLoading && categoryFromUrl && categoryFromUrl !== "All") {
      const t = window.setTimeout(() => scrollToCategory(categoryFromUrl), 150);
      return () => window.clearTimeout(t);
    }
  }, [isLoading, categoryFromUrl, scrollToCategory]);

  const handleItemClick = (item: MenuItem) => {
    setSelectedItem(item);
    setQuantity(1);
    setIsDialogOpen(true);
  };

  const handleViewImage = (item: MenuItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setDetailItem(item);
    setIsDetailOpen(true);
  };

  const handleImageClick = (item: MenuItem) => {
    setDetailItem(item);
    setIsDetailOpen(true);
  };

  const handleDetailAddToCart = (item: MenuItem) => {
    if (!canOrder) {
      toast({
        title: "We're closed right now",
        description: closedReason,
        variant: "destructive",
      });
      return;
    }
    addItem({
      id: item.id,
      name: item.name,
      price: item.price,
      image_url: item.image_url || undefined
    });
    toast({
      title: "Added to your order 🎉",
      description: `1x ${item.name} - ৳${item.price}`,
      action: (
        <ToastAction altText="Go to checkout" onClick={() => navigate('/checkout')}>
          Checkout
        </ToastAction>
      ),
    });
    setIsDetailOpen(false);
    setDetailItem(null);
  };

  const toggleAllergenExclusion = (allergen: string) => {
    setExcludedAllergens(prev =>
      prev.includes(allergen) ? prev.filter(a => a !== allergen) : [...prev, allergen]
    );
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

  const handleAddToOrder = (goToCheckout = false) => {
    if (!selectedItem) return;
    if (!canOrder) {
      toast({
        title: "We're closed right now",
        description: closedReason,
        variant: "destructive",
      });
      return;
    }
    addItem({
      id: selectedItem.id,
      name: selectedItem.name,
      price: selectedItem.price,
      image_url: selectedItem.image_url || undefined
    }, quantity);

    if (goToCheckout) {
      setIsDialogOpen(false);
      setSelectedItem(null);
      setQuantity(1);
      navigate('/checkout');
      return;
    }

    toast({
      title: "Added to your order 🎉",
      description: `${quantity}x ${selectedItem.name} - ৳${selectedItem.price * quantity}`,
      action: (
        <ToastAction altText="Go to checkout" onClick={() => navigate('/checkout')}>
          Checkout
        </ToastAction>
      ),
    });
    setIsDialogOpen(false);
    setSelectedItem(null);
    setQuantity(1);
  };

  const renderMenuCard = (item: MenuItem, index: number) => (
    <motion.div
      key={item.id}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ delay: Math.min(index, 6) * 0.05, duration: 0.5 }}
      className="group bg-card rounded-2xl overflow-hidden shadow-elegant border border-border hover:shadow-elegant-lg hover:-translate-y-1 hover:border-secondary/40 focus-within:shadow-elegant-lg focus-within:border-secondary/40 transition-all duration-300 ease-out"
    >
      {/* Image - Click to view dish details */}
      <div
        className="relative aspect-[4/3] overflow-hidden bg-muted cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        onClick={() => handleImageClick(item)}
        role="link"
        tabIndex={0}
        aria-label={`View details of ${item.name}`}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleImageClick(item);
          }
        }}
      >
        <BlurImage
          src={resolveImageUrl(item.image_url, getFallbackImage(item.name, item.category))}
          fallbackSrc={getFallbackImage(item.name, item.category)}
          alt={item.name}
          wrapperClassName="absolute inset-0 w-full h-full"
          className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-110 motion-reduce:group-hover:scale-100"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-300" />

        {/* Eye Icon - View Details */}
        <button
          onClick={(e) => handleViewImage(item, e)}
          aria-label={`View full image of ${item.name}`}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 p-1.5 sm:p-2 rounded-full bg-card/90 backdrop-blur-sm text-foreground hover:bg-secondary hover:text-secondary-foreground hover:scale-110 focus-visible:scale-110 focus-visible:bg-secondary focus-visible:text-secondary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary transition-all duration-200 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100 shadow-lg"
          title="View full image"
        >
          <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>

        {/* Badges */}
        <div className="absolute top-3 left-3 sm:top-4 sm:left-4 flex flex-wrap gap-1.5 sm:gap-2 max-w-[75%]">
          {item.is_popular && (
            <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full bg-secondary text-secondary-foreground text-[10px] sm:text-xs font-medium">
              <Star className="h-2.5 w-2.5 sm:h-3 sm:w-3 fill-current" />
              Popular
            </span>
          )}
          {item.is_spicy && (
            <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full bg-destructive text-destructive-foreground text-[10px] sm:text-xs font-medium">
              <Flame className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
              Spicy
            </span>
          )}
          {item.is_veg && (
            <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full bg-green-500 text-white text-[10px] sm:text-xs font-medium">
              <Leaf className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
              Veg
            </span>
          )}
        </div>

        {/* Price Badge */}
        <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4">
          <span className="inline-block px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg bg-card/95 backdrop-blur-sm font-display text-base sm:text-lg font-bold text-secondary">
            ৳{item.price}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-5 lg:p-6">
        <div className="flex items-start justify-between gap-2 sm:gap-4 mb-2">
          <h3 className="font-display text-base sm:text-lg lg:text-xl font-semibold text-foreground group-hover:text-secondary group-focus-within:text-secondary transition-colors duration-300 line-clamp-1">
            {item.name}
          </h3>
          <span className="hidden sm:inline text-xs text-muted-foreground bg-muted px-2 py-1 rounded shrink-0">
            {item.category}
          </span>
        </div>
        <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed mb-3 sm:mb-4 line-clamp-2">
          {item.description}
        </p>
        <Button
          onClick={() => handleItemClick(item)}
          size="sm"
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground sm:text-sm transition-all duration-200 hover:shadow-lg hover:shadow-primary/25 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2"
        >
          <ShoppingBag className="h-4 w-4 mr-2" />
          Order Now
        </Button>
      </div>
    </motion.div>
  );

  const menuSchema = {
    "@context": "https://schema.org",
    "@type": "Menu",
    name: "Belly Full Menu",
    hasMenuSection: categories.map((c) => ({
      "@type": "MenuSection",
      name: c.name,
      hasMenuItem: menuItems
        .filter((m) => m.category === c.name)
        .map((m) => ({
          "@type": "MenuItem",
          name: m.name,
          description: m.description ?? undefined,
          offers: { "@type": "Offer", price: m.price, priceCurrency: "BDT" },
        })),
    })),
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Menu — Belly Full Restaurant, Kishoreganj</title>
        <meta name="description" content="Browse Belly Full's full multicuisine menu — Bengali, Indian and international dishes with prices, photos and online ordering." />
        <link rel="canonical" href="https://bellyfull.lovable.app/menu" />
        <meta property="og:title" content="Menu — Belly Full Restaurant" />
        <meta property="og:description" content="Browse our full menu of Bengali, Indian and international dishes." />
        <meta property="og:url" content="https://bellyfull.lovable.app/menu" />
        <script type="application/ld+json">{JSON.stringify(menuSchema)}</script>
      </Helmet>
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
                aria-label="Search menu dishes"
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

          {/* Dietary & Allergen Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18, duration: 0.6 }}
            className="flex flex-col items-center gap-3 mb-8"
          >
            <div className="flex flex-wrap justify-center gap-2" role="group" aria-label="Dietary filters">
              <Button
                size="sm"
                variant={dietFilters.veg ? "default" : "outline"}
                onClick={() => setDietFilters(f => ({ ...f, veg: !f.veg }))}
                aria-pressed={dietFilters.veg}
                className={dietFilters.veg ? "bg-green-600 hover:bg-green-600/90 text-white" : "border-border text-muted-foreground hover:text-foreground"}
              >
                <Leaf className="h-3.5 w-3.5 mr-1" /> Vegetarian
              </Button>
              <Button
                size="sm"
                variant={dietFilters.mildOnly ? "default" : "outline"}
                onClick={() => setDietFilters(f => ({ ...f, mildOnly: !f.mildOnly }))}
                aria-pressed={dietFilters.mildOnly}
                className={dietFilters.mildOnly ? "bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:text-foreground"}
              >
                <Flame className="h-3.5 w-3.5 mr-1" /> Mild Only
              </Button>
              <Button
                size="sm"
                variant={dietFilters.popular ? "default" : "outline"}
                onClick={() => setDietFilters(f => ({ ...f, popular: !f.popular }))}
                aria-pressed={dietFilters.popular}
                className={dietFilters.popular ? "bg-secondary text-secondary-foreground" : "border-border text-muted-foreground hover:text-foreground"}
              >
                <Star className="h-3.5 w-3.5 mr-1" /> Popular
              </Button>
            </div>

            {allAllergens.length > 0 && (
              <div className="flex flex-wrap items-center justify-center gap-2" role="group" aria-label="Exclude allergens">
                <span className="text-xs text-muted-foreground">Exclude:</span>
                {allAllergens.map((allergen) => {
                  const active = excludedAllergens.includes(allergen);
                  return (
                    <button
                      key={allergen}
                      onClick={() => toggleAllergenExclusion(allergen)}
                      aria-pressed={active}
                      className={`px-2.5 py-1 rounded-full text-xs border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                        active
                          ? "bg-destructive text-destructive-foreground border-destructive"
                          : "bg-card text-muted-foreground border-border hover:border-destructive/50 hover:text-foreground"
                      }`}
                    >
                      No {allergen}
                    </button>
                  );
                })}
              </div>
            )}
          </motion.div>

          {/* Category Tabs — sticky, smooth-scroll to sections, scroll-spy highlight */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="sticky top-16 sm:top-20 z-30 -mx-4 px-4 py-3 mb-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border/50"
          >
            <div
              className="flex gap-2 sm:gap-3 overflow-x-auto sm:flex-wrap sm:justify-center scrollbar-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              role="tablist"
              aria-label="Menu categories"
            >
              <button
                ref={(el) => { tabRefs.current["All"] = el; }}
                role="tab"
                aria-selected={activeCategory === "All"}
                onClick={() => handleCategoryChange("All")}
                className={`shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary ${
                  activeCategory === "All"
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary"
                }`}
              >
                All
              </button>
              {groupedItems.map(({ category }) => (
                <button
                  key={category.id}
                  ref={(el) => { tabRefs.current[category.name] = el; }}
                  role="tab"
                  aria-selected={activeCategory === category.name}
                  onClick={() => handleCategoryChange(category.name)}
                  className={`shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary ${
                    activeCategory === category.name
                      ? "bg-primary text-primary-foreground"
                      : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary"
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
                        decoding="async"
                      />
                    )
                  )}
                  {category.name}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Loading State — skeleton grid mirrors final layout */}
          {isLoading && (
            <div
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8"
              role="status"
              aria-label="Loading menu items"
            >
              {Array.from({ length: 8 }).map((_, i) => (
                <MenuCardSkeleton key={i} />
              ))}
              <span className="sr-only">Loading menu…</span>
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

          {/* Results Count (search/filter mode) */}
          {!isLoading && filteredAndSortedItems.length > 0 && searchQuery && (
            <div className="text-center mb-6">
              <p className="text-sm text-muted-foreground">
                Showing {filteredAndSortedItems.length} {filteredAndSortedItems.length === 1 ? 'item' : 'items'}
                {` for "${searchQuery}"`}
              </p>
            </div>
          )}

          {/* Flat grid while searching */}
          {!isLoading && searchQuery && filteredAndSortedItems.length > 0 && (
            <>
              <h2 className="sr-only">Search Results</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
                {filteredAndSortedItems.map((item, index) => renderMenuCard(item, index))}
              </div>
            </>
          )}

          {/* Grouped menu sections with scroll-spy anchors */}
          {!isLoading && !searchQuery && groupedItems.length > 0 && (
            <div className="space-y-14">
              {groupedItems.map(({ category, items }) => (
                <section
                  key={category.id}
                  data-category={category.name}
                  ref={(el) => { sectionRefs.current[category.name] = el; }}
                  aria-labelledby={`menu-section-${category.id}`}
                  className="scroll-mt-40"
                >
                  <div className="flex items-center gap-3 mb-6">
                    {category.icon_url && (
                      category.icon_url.startsWith('preset:') ? (
                        (() => {
                          const iconName = category.icon_url.replace('preset:', '');
                          const IconComponent = presetIconMap[iconName] || UtensilsCrossed;
                          return (
                            <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-secondary/15 text-secondary">
                              <IconComponent className="w-5 h-5" />
                            </span>
                          );
                        })()
                      ) : (
                        <img
                          src={category.icon_url}
                          alt=""
                          className="w-9 h-9 object-cover rounded-full"
                          loading="lazy"
                          decoding="async"
                        />
                      )
                    )}
                    <h2
                      id={`menu-section-${category.id}`}
                      className="font-display text-2xl sm:text-3xl font-bold text-foreground"
                    >
                      {category.name}
                    </h2>
                    <span className="text-sm text-muted-foreground">
                      {items.length} {items.length === 1 ? 'item' : 'items'}
                    </span>
                    <div className="flex-1 h-px bg-border" aria-hidden="true" />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
                    {items.map((item, index) => renderMenuCard(item, index))}
                  </div>
                </section>
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
                src={resolveImageUrl(selectedItem.image_url, getFallbackImage(selectedItem.name, selectedItem.category))}
                fallbackSrc={getFallbackImage(selectedItem.name, selectedItem.category)}
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
                    aria-label={`Decrease quantity of ${selectedItem?.name ?? 'item'}`}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="font-semibold text-lg w-8 text-center" aria-live="polite">{quantity}</span>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => setQuantity(quantity + 1)}
                    aria-label={`Increase quantity of ${selectedItem?.name ?? 'item'}`}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {!canOrder && (
                <p className="text-sm text-center text-destructive bg-destructive/10 rounded-lg px-3 py-2 mb-2">
                  We're closed right now. {closedReason}
                </p>
              )}

              <div className="grid gap-2 sm:grid-cols-2">
                <Button
                  onClick={() => handleAddToOrder(false)}
                  variant="outline"
                  disabled={!canOrder}
                  className="w-full border-secondary/50"
                >
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  Add to Order
                </Button>
                <Button
                  onClick={() => handleAddToOrder(true)}
                  disabled={!canOrder}
                  className="w-full bg-primary text-primary-foreground"
                >
                  {canOrder ? `Order Now - ৳${selectedItem.price * quantity}` : "Ordering closed"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dish Detail Modal (ingredients, spice level, prep time, allergens) */}
      <DishDetailModal
        item={detailItem}
        open={isDetailOpen}
        onOpenChange={(open) => {
          setIsDetailOpen(open);
          if (!open) setDetailItem(null);
        }}
        fallbackImage={detailItem ? getFallbackImage(detailItem.name, detailItem.category) : dishButterChicken}
        onAddToCart={handleDetailAddToCart}
      />

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
