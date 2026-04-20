import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Phone } from "lucide-react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.jpg";

type NavLinkDef = { name: string; hash?: string; to?: string };

const navLinks: NavLinkDef[] = [
  { name: "Home", hash: "home" },
  { name: "About", hash: "about" },
  { name: "Menu", to: "/menu" },
  { name: "Testimonials", hash: "testimonials" },
  { name: "Location", hash: "location" },
  { name: "FAQ", hash: "faq" },
];

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Lock body scroll when mobile menu open
  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  const goToHash = (hash: string) => {
    setIsMobileMenuOpen(false);
    if (location.pathname === "/") {
      // Defer until after the menu close re-enables body scroll
      setTimeout(() => {
        const el = document.getElementById(hash);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
          history.replaceState(null, "", `#${hash}`);
        }
      }, 50);
    } else {
      navigate(`/#${hash}`);
    }
  };

  const handleNavClick = (link: NavLinkDef) => (e: React.MouseEvent) => {
    if (link.hash) {
      e.preventDefault();
      goToHash(link.hash);
    } else {
      setIsMobileMenuOpen(false);
    }
  };

  // On non-home routes always use solid styling so text is readable
  const isTransparent = location.pathname === "/" && !isScrolled;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isTransparent
          ? "bg-transparent py-4"
          : "bg-card/95 backdrop-blur-md shadow-elegant-md py-2"
      }`}
    >
      <div
        className={`container flex items-center justify-between ${
          isTransparent ? "[text-shadow:_0_1px_8px_rgba(0,0,0,0.5)]" : ""
        }`}
      >
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group" onClick={() => setIsMobileMenuOpen(false)}>
          <img
            src={logo}
            alt="Belly Full Logo"
            className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg object-cover transition-transform group-hover:scale-105"
            loading="eager"
            fetchPriority="high"
            decoding="async"
          />
          <span
            className={`font-display text-lg sm:text-xl font-semibold transition-colors duration-300 ${
              isTransparent ? "text-white" : "text-primary"
            }`}
          >
            Belly Full
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) =>
            link.to ? (
              <Link
                key={link.name}
                to={link.to}
                className={`text-sm font-medium transition-colors relative group ${
                  isTransparent ? "text-white/80 hover:text-white" : "text-muted-foreground hover:text-primary"
                }`}
              >
                {link.name}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-secondary transition-all duration-300 group-hover:w-full" />
              </Link>
            ) : (
              <a
                key={link.name}
                href={`/#${link.hash}`}
                onClick={handleNavClick(link)}
                className={`text-sm font-medium transition-colors relative group ${
                  isTransparent ? "text-white/80 hover:text-white" : "text-muted-foreground hover:text-primary"
                }`}
              >
                {link.name}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-secondary transition-all duration-300 group-hover:w-full" />
              </a>
            )
          )}
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden lg:flex items-center gap-4">
          <a
            href="tel:+8801863339695"
            className={`flex items-center gap-2 text-sm transition-colors ${
              isTransparent ? "text-white/80 hover:text-white" : "text-muted-foreground hover:text-primary"
            }`}
          >
            <Phone className="h-4 w-4" />
            01863-339695
          </a>
          <Button
            variant="default"
            size="lg"
            className="bg-gradient-gold hover:opacity-90 text-primary font-semibold"
            onClick={() => goToHash("reservation")}
          >
            Book a Table
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <button
          aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={isMobileMenuOpen}
          onClick={() => setIsMobileMenuOpen((v) => !v)}
          className={`lg:hidden p-2 -mr-2 transition-colors duration-300 ${
            isTransparent ? "text-white" : "text-primary"
          }`}
        >
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="lg:hidden bg-card border-t border-border overflow-hidden [text-shadow:none]"
          >
            <nav className="container py-4 flex flex-col gap-1 max-h-[calc(100vh-4rem)] overflow-y-auto">
              {navLinks.map((link) =>
                link.to ? (
                  <Link
                    key={link.name}
                    to={link.to}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-base font-medium text-foreground hover:text-secondary transition-colors py-3 border-b border-border/50"
                  >
                    {link.name}
                  </Link>
                ) : (
                  <a
                    key={link.name}
                    href={`/#${link.hash}`}
                    onClick={handleNavClick(link)}
                    className="text-base font-medium text-foreground hover:text-secondary transition-colors py-3 border-b border-border/50"
                  >
                    {link.name}
                  </a>
                )
              )}
              <div className="pt-4 flex flex-col gap-3">
                <a
                  href="tel:+8801863339695"
                  className="flex items-center gap-2 text-muted-foreground py-2"
                >
                  <Phone className="h-4 w-4" />
                  01863-339695
                </a>
                <Button
                  variant="default"
                  className="bg-gradient-gold text-primary font-semibold w-full"
                  onClick={() => goToHash("reservation")}
                >
                  Book a Table
                </Button>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
