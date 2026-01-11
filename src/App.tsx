import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { CartProvider } from "@/contexts/CartContext";
import Index from "./pages/Index";
import CartSheet from "./components/CartSheet";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import Checkout from "./pages/Checkout";
import MenuPage from "./pages/MenuPage";
import ProductDetails from "./pages/ProductDetails";
import Dashboard from "./pages/admin/Dashboard";
import MenuManager from "./pages/admin/MenuManager";
import Categories from "./pages/admin/Categories";
import Reservations from "./pages/admin/Reservations";
import Orders from "./pages/admin/Orders";
import Contacts from "./pages/admin/Contacts";
import OpeningHours from "./pages/admin/OpeningHours";
import BlogPosts from "./pages/admin/BlogPosts";
import Events from "./pages/admin/Events";
import Media from "./pages/admin/Media";
import Settings from "./pages/admin/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CartProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <CartSheet />
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
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </CartProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
