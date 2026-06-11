import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { CartProvider } from "@/contexts/CartContext";
import { Loader2 } from "lucide-react";
import Index from "./pages/Index";
import CartSheet from "./components/CartSheet";
import PWAUpdatePrompt from "./components/PWAUpdatePrompt";
import InstallBanner from "./components/InstallBanner";

// Lazy-loaded routes — keeps initial bundle small
const Auth = lazy(() => import("./pages/Auth"));
const Checkout = lazy(() => import("./pages/Checkout"));
const MenuPage = lazy(() => import("./pages/MenuPage"));
const ProductDetails = lazy(() => import("./pages/ProductDetails"));
const Admin = lazy(() => import("./pages/Admin"));
const Dashboard = lazy(() => import("./pages/admin/Dashboard"));
const MenuManager = lazy(() => import("./pages/admin/MenuManager"));
const Categories = lazy(() => import("./pages/admin/Categories"));
const Reservations = lazy(() => import("./pages/admin/Reservations"));
const Orders = lazy(() => import("./pages/admin/Orders"));
const Contacts = lazy(() => import("./pages/admin/Contacts"));
const OpeningHours = lazy(() => import("./pages/admin/OpeningHours"));
const BlogPosts = lazy(() => import("./pages/admin/BlogPosts"));
const Events = lazy(() => import("./pages/admin/Events"));
const Media = lazy(() => import("./pages/admin/Media"));
const Settings = lazy(() => import("./pages/admin/Settings"));
const SeoHealth = lazy(() => import("./pages/admin/SeoHealth"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CartProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <CartSheet />
            <PWAUpdatePrompt />
            <InstallBanner />
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/menu" element={<MenuPage />} />
                <Route path="/product/:id" element={<ProductDetails />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/admin" element={<Admin />}>
                  <Route index element={<Dashboard />} />
                  <Route path="categories" element={<Categories />} />
                  <Route path="menu" element={<MenuManager />} />
                  <Route path="reservations" element={<Reservations />} />
                  <Route path="orders" element={<Orders />} />
                  <Route path="contacts" element={<Contacts />} />
                  <Route path="hours" element={<OpeningHours />} />
                  <Route path="blog" element={<BlogPosts />} />
                  <Route path="events" element={<Events />} />
                  <Route path="media" element={<Media />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="seo" element={<SeoHealth />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </CartProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
