import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  Flame, 
  Leaf, 
  Star, 
  Plus, 
  Minus, 
  ShoppingBag, 
  Loader2,
  ChevronLeft,
  ChevronRight,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/contexts/CartContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BlurImage from "@/components/ui/blur-image";
import { sanitizeImageUrl } from "@/lib/imageUrl";


// Import local dish images as fallbacks
import dishBiryani from "@/assets/dish-biryani.jpg";
import dishButterChicken from "@/assets/dish-butter-chicken.jpg";
import dishFish from "@/assets/dish-fish.jpg";
import dishVegetable from "@/assets/dish-vegetable.jpg";
import dishCoffee from "@/assets/dish-coffee.jpg";
import dishBurger from "@/assets/dish-burger.jpg";

const getFallbackImage = (name: string, category: string): string => {
  const lowerName = name.toLowerCase();
  const lowerCategory = category.toLowerCase();
  
  if (lowerName.includes('biryani')) return dishBiryani;
  if (lowerName.includes('butter chicken') || lowerName.includes('tikka') || lowerName.includes('paneer')) return dishButterChicken;
  if (lowerName.includes('fish') || lowerName.includes('ilish')) return dishFish;
  if (lowerName.includes('vegetable') || lowerName.includes('veg curry')) return dishVegetable;
  if (lowerName.includes('coffee') || lowerName.includes('cappuccino') || lowerName.includes('lassi')) return dishCoffee;
  if (lowerName.includes('burger')) return dishBurger;
  
  if (lowerCategory.includes('beverage') || lowerCategory.includes('drink')) return dishCoffee;
  if (lowerCategory.includes('main') || lowerCategory.includes('curry')) return dishButterChicken;
  if (lowerCategory.includes('biryani')) return dishBiryani;
  
  return dishButterChicken;
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

interface Review {
  id: string;
  menu_item_id: string;
  user_name: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

const ProductDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<MenuItem | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [reviewName, setReviewName] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const { toast } = useToast();
  const { addItem } = useCart();

  useEffect(() => {
    if (id) {
      fetchProduct();
      fetchReviews();
    }
  }, [id]);

  const fetchProduct = async () => {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching product:', error);
    } else {
      setItem(data);
    }
    setIsLoading(false);
  };

  const fetchReviews = async () => {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('menu_item_id', id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching reviews:', error);
    } else {
      setReviews(data || []);
    }
  };

  const getImages = (): string[] => {
    if (!item) return [];
    
    const allImages: string[] = [];

    // Add images from images array
    if (item.images && item.images.length > 0) {
      const cleaned = item.images
        .map((img) => sanitizeImageUrl(img))
        .filter((img): img is string => Boolean(img));
      allImages.push(...cleaned);
    }

    // If no images, use image_url or fallback
    if (allImages.length === 0) {
      const primaryImage = sanitizeImageUrl(item.image_url) || getFallbackImage(item.name, item.category);
      allImages.push(primaryImage);
    }
    
    return allImages;
  };

  const handleAddToCart = () => {
    if (item) {
      for (let i = 0; i < quantity; i++) {
        addItem({
          id: item.id,
          name: item.name,
          price: item.price,
          image_url: item.image_url || undefined
        });
      }
      toast({
        title: "Added to Cart! 🎉",
        description: `${quantity}x ${item.name} - ৳${item.price * quantity}`,
      });
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = reviewName.trim();
    const trimmedComment = reviewComment.trim();

    if (trimmedName.length < 2 || trimmedName.length > 100) {
      toast({ title: "Invalid name", description: "Name must be 2-100 characters", variant: "destructive" });
      return;
    }
    if (trimmedComment.length > 1000) {
      toast({ title: "Comment too long", description: "Please keep comments under 1000 characters", variant: "destructive" });
      return;
    }
    if (reviewRating < 1 || reviewRating > 5) {
      toast({ title: "Invalid rating", description: "Rating must be between 1 and 5", variant: "destructive" });
      return;
    }

    setIsSubmittingReview(true);
    const { error } = await supabase
      .from('reviews')
      .insert([{
        menu_item_id: id,
        user_name: trimmedName,
        rating: reviewRating,
        comment: trimmedComment || null
      }]);

    if (error) {
      toast({ title: "Error", description: "Failed to submit review", variant: "destructive" });
    } else {
      toast({ title: "Thank you!", description: "Your review has been submitted" });
      setReviewName("");
      setReviewRating(5);
      setReviewComment("");
      fetchReviews();
    }
    setIsSubmittingReview(false);
  };

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  const images = getImages();

  const nextImage = () => {
    setActiveImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setActiveImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-16 container">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
            <Link to="/menu">
              <Button>Back to Menu</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      
      <main className="pt-24 pb-16">
        <div className="container max-w-6xl">
          {/* Back Link */}
          <Link to="/menu" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Menu
          </Link>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Image Gallery */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-muted">
                <BlurImage
                  src={images[activeImageIndex]}
                  alt={item.name}
                  wrapperClassName="absolute inset-0 w-full h-full"
                  className="w-full h-full object-cover"
                />
                
                {images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-card/90 backdrop-blur-sm text-foreground hover:bg-card transition-colors"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-card/90 backdrop-blur-sm text-foreground hover:bg-card transition-colors"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </>
                )}

                {/* Badges */}
                <div className="absolute top-4 left-4 flex gap-2">
                  {item.is_popular && (
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-sm font-medium">
                      <Star className="h-4 w-4 fill-current" />
                      Popular
                    </span>
                  )}
                  {item.is_spicy && (
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-destructive text-destructive-foreground text-sm font-medium">
                      <Flame className="h-4 w-4" />
                      Spicy
                    </span>
                  )}
                  {item.is_veg && (
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-green-500 text-white text-sm font-medium">
                      <Leaf className="h-4 w-4" />
                      Veg
                    </span>
                  )}
                </div>
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="flex gap-3 mt-4 overflow-x-auto pb-2">
                  {images.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveImageIndex(index)}
                      className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                        index === activeImageIndex 
                          ? 'border-primary ring-2 ring-primary/20' 
                          : 'border-transparent hover:border-muted-foreground/30'
                      }`}
                    >
                      <BlurImage src={img} alt="" wrapperClassName="block w-full h-full" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Product Info */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="space-y-6"
            >
              <div>
                <span className="inline-block px-3 py-1 rounded-full bg-muted text-muted-foreground text-sm mb-3">
                  {item.category}
                </span>
                <h1 className="font-display text-4xl font-bold text-foreground mb-2">
                  {item.name}
                </h1>
                {averageRating && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star 
                          key={star} 
                          className={`h-4 w-4 ${
                            star <= Math.round(Number(averageRating)) 
                              ? 'text-yellow-500 fill-yellow-500' 
                              : 'text-muted-foreground/30'
                          }`} 
                        />
                      ))}
                    </div>
                    <span>{averageRating}</span>
                    <span>({reviews.length} reviews)</span>
                  </div>
                )}
              </div>

              <p className="text-muted-foreground text-lg leading-relaxed">
                {item.description || "A delicious dish prepared with the finest ingredients."}
              </p>

              <div className="text-4xl font-display font-bold text-secondary">
                ৳{item.price}
              </div>

              {/* Quantity & Add to Cart */}
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-4">
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="font-semibold text-2xl w-12 text-center">{quantity}</span>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <Button 
                  size="lg" 
                  onClick={handleAddToCart}
                  className="flex-1 bg-primary text-primary-foreground"
                >
                  <ShoppingBag className="h-5 w-5 mr-2" />
                  Add to Cart - ৳{item.price * quantity}
                </Button>
              </div>
            </motion.div>
          </div>

          {/* Reviews Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-16"
          >
            <h2 className="font-display text-2xl font-bold text-foreground mb-8">
              Customer Reviews ({reviews.length})
            </h2>

            <div className="grid lg:grid-cols-2 gap-8">
              {/* Review Form */}
              <div className="bg-card rounded-2xl border p-6">
                <h3 className="font-semibold text-lg mb-4">Write a Review</h3>
                <form onSubmit={handleSubmitReview} className="space-y-4">
                  <div>
                    <label className="text-sm text-muted-foreground block mb-2">Your Name</label>
                    <Input
                      value={reviewName}
                      onChange={(e) => setReviewName(e.target.value)}
                      placeholder="Enter your name"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground block mb-2">Rating</label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewRating(star)}
                          className="p-1"
                        >
                          <Star 
                            className={`h-6 w-6 transition-colors ${
                              star <= reviewRating 
                                ? 'text-yellow-500 fill-yellow-500' 
                                : 'text-muted-foreground/30'
                            }`} 
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground block mb-2">Comment (optional)</label>
                    <Textarea
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Share your experience..."
                      rows={3}
                    />
                  </div>
                  <Button type="submit" disabled={isSubmittingReview} className="w-full">
                    {isSubmittingReview ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Submit Review'
                    )}
                  </Button>
                </form>
              </div>

              {/* Reviews List */}
              <div className="space-y-4">
                {reviews.length === 0 ? (
                  <div className="bg-card rounded-2xl border p-6 text-center text-muted-foreground">
                    No reviews yet. Be the first to review!
                  </div>
                ) : (
                  reviews.map((review) => (
                    <div key={review.id} className="bg-card rounded-2xl border p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                          <User className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold">{review.user_name}</span>
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star 
                                  key={star} 
                                  className={`h-3 w-3 ${
                                    star <= review.rating 
                                      ? 'text-yellow-500 fill-yellow-500' 
                                      : 'text-muted-foreground/30'
                                  }`} 
                                />
                              ))}
                            </div>
                          </div>
                          {review.comment && (
                            <p className="text-muted-foreground text-sm">{review.comment}</p>
                          )}
                          <span className="text-xs text-muted-foreground/60 mt-2 block">
                            {new Date(review.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProductDetails;
