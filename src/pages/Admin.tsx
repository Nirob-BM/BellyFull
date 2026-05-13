import { useEffect, useState } from 'react';
import { useNavigate, Outlet, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, UtensilsCrossed, CalendarDays, MessageSquare, Clock, Settings, Image, FileText, Calendar, LogOut, Menu, X, ChefHat, Home, Package, Folder, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

const navItems = [{
  path: '/admin',
  icon: LayoutDashboard,
  label: 'Dashboard',
  exact: true
}, {
  path: '/admin/categories',
  icon: Folder,
  label: 'Categories'
}, {
  path: '/admin/menu',
  icon: UtensilsCrossed,
  label: 'Menu Manager'
}, {
  path: '/admin/orders',
  icon: Package,
  label: 'Orders'
}, {
  path: '/admin/reservations',
  icon: CalendarDays,
  label: 'Reservations'
}, {
  path: '/admin/contacts',
  icon: MessageSquare,
  label: 'Contact Submissions'
}, {
  path: '/admin/hours',
  icon: Clock,
  label: 'Opening Hours'
}, {
  path: '/admin/blog',
  icon: FileText,
  label: 'Blog Posts'
}, {
  path: '/admin/events',
  icon: Calendar,
  label: 'Events'
}, {
  path: '/admin/media',
  icon: Image,
  label: 'Media Library'
}, {
  path: '/admin/settings',
  icon: Settings,
  label: 'Site Settings'
}, {
  path: '/admin/seo',
  icon: Search,
  label: 'SEO Health'
}];

const Admin = () => {
  const {
    user,
    isAdmin,
    isLoading,
    signOut
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    toast
  } = useToast();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      navigate('/auth');
      return;
    }
    if (!isAdmin) {
      navigate('/');
    }
  }, [user, isAdmin, isLoading, navigate]);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: 'Signed out',
      description: 'You have been logged out successfully.'
    });
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div 
          className="flex flex-col items-center gap-4"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-muted-foreground text-sm">Loading dashboard...</p>
        </motion.div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  const isActiveRoute = (path: string, exact?: boolean) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-card/95 backdrop-blur-md border-b border-border z-50 flex items-center justify-between px-4 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <ChefHat className="h-5 w-5 text-primary" />
          </div>
          <div>
            <span className="font-display font-bold text-foreground text-sm">Belly Full</span>
            <p className="text-[10px] text-muted-foreground -mt-0.5">Admin</p>
          </div>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
          className="p-2 hover:bg-muted rounded-lg transition-colors"
          aria-label="Toggle menu"
        >
          <motion.div
            initial={false}
            animate={{ rotate: isSidebarOpen ? 90 : 0 }}
            transition={{ duration: 0.2 }}
          >
            {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </motion.div>
        </button>
      </header>

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-[280px] lg:w-64 bg-card border-r border-border z-40 transform transition-transform duration-300 ease-out lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Desktop Header */}
        <div className="p-5 border-b border-border hidden lg:block">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shadow-sm">
              <ChefHat className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="font-display font-bold text-foreground">Belly Full</h1>
              <p className="text-xs text-muted-foreground">Admin Panel</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <ScrollArea className="h-[calc(100vh-180px)] lg:h-[calc(100vh-160px)] mt-14 lg:mt-0">
          <nav className="p-3 space-y-1">
            {navItems.map((item, index) => {
              const isActive = isActiveRoute(item.path, item.exact);
              return (
                <motion.div
                  key={item.path}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03, duration: 0.2 }}
                >
                  <Link
                    to={item.path}
                    className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 relative overflow-hidden ${
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-md'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeNav"
                        className="absolute inset-0 bg-primary rounded-lg"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                    <item.icon className={`h-[18px] w-[18px] relative z-10 transition-transform duration-200 ${!isActive && 'group-hover:scale-110'}`} />
                    <span className="font-medium text-sm relative z-10">{item.label}</span>
                  </Link>
                </motion.div>
              );
            })}
          </nav>
        </ScrollArea>

        {/* Bottom Actions */}
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-border bg-card/50 backdrop-blur-sm space-y-1.5">
          <Link 
            to="/" 
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200 group"
          >
            <Home className="h-[18px] w-[18px] group-hover:scale-110 transition-transform" />
            <span className="font-medium text-sm">Back To Website</span>
          </Link>
          <button 
            onClick={handleSignOut} 
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-destructive hover:bg-destructive/10 transition-all duration-200 group"
          >
            <LogOut className="h-[18px] w-[18px] group-hover:scale-110 transition-transform" />
            <span className="font-medium text-sm">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden" 
            onClick={() => setIsSidebarOpen(false)} 
          />
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen pt-14 lg:pt-0">
        <div className="p-4 lg:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Admin;