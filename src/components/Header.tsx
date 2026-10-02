import { useState, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Menu, X, Phone, CalendarDays } from "lucide-react";
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
  const [activeSection, setActiveSection] = useState("home");
  const navigate = useNavigate();
  const location = useLocation();
  const reduceMotion = useReducedMotion();

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

  // Sections below the hero mount lazily, so resolve them at scroll time.
  useEffect(() => {
    if (location.pathname !== "/") return;

    const sectionIds = navLinks.flatMap((link) => (link.hash ? [link.hash] : []));
    const hashSection = location.hash.slice(1);
    if (hashSection && sectionIds.includes(hashSection)) setActiveSection(hashSection);
    let frame = 0;
    const updateActive = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const threshold = window.innerHeight * 0.35;
        const current = sectionIds.reduce((matched, id) => {
          const section = document.getElementById(id);
          return section && section.getBoundingClientRect().top <= threshold ? id : matched;
        }, "home");
        setActiveSection(current);
      });
    };
    updateActive();
    window.addEventListener("scroll", updateActive, { passive: true });
    window.addEventListener("resize", updateActive);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", updateActive);
      window.removeEventListener("resize", updateActive);
    };
  }, [location.hash, location.pathname]);

  // Lock body scroll when mobile menu open
  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? "hidden" : "";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsMobileMenuOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isMobileMenuOpen]);

  const goToHash = (hash: string) => {
    setIsMobileMenuOpen(false);
    setActiveSection(hash);
    if (location.pathname === "/") {
      // Defer until after the menu close re-enables body scroll
      setTimeout(() => {
        const el = document.getElementById(hash);
        if (el) {
          el.scrollIntoView({ behavior: reduceMotion ? "instant" : "smooth", block: "start" });
          history.replaceState(null, "", `#${hash}`);
        }
      }, 50);
    } else {
      navigate(`/#${hash}`);
    }
  };

  const isLinkActive = (link: NavLinkDef) => {
    if (link.to === "/menu") {
      return location.pathname === "/menu" || location.pathname.startsWith("/product/");
    }
    return location.pathname === "/" && link.hash === activeSection;
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
  const isTransparent = location.pathname === "/" && !isScrolled && !isMobileMenuOpen;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isTransparent
          ? "bg-transparent py-3 sm:py-4"
          : "bg-card/95 backdrop-blur-md shadow-elegant-md py-2"
      }`}
    >
      <div
        className={`container flex items-center justify-between gap-4 ${
          isTransparent ? "drop-shadow-md" : ""
        }`}
      >
        {/* Logo */}
        <Link
          to="/"
          aria-label="Belly Full home"
          className="flex min-w-0 items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-transparent sm:gap-3"
          onClick={() => {
            setActiveSection("home");
            setIsMobileMenuOpen(false);
          }}
        >
          <img
            src={logo}
            alt="Belly Full Logo"
            className="h-10 w-10 shrink-0 rounded-md object-cover transition-transform duration-300 hover:scale-105 sm:h-11 sm:w-11"
            loading="eager"
            fetchPriority="high"
            decoding="async"
          />
          <span
            className={`truncate font-display text-lg font-semibold transition-colors duration-300 sm:text-xl ${
              isTransparent ? "text-primary-foreground" : "text-primary"
            }`}
          >
            Belly Full
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav aria-label="Primary navigation" className="hidden xl:flex items-center gap-1">
          {navLinks.map((link) => {
            const active = isLinkActive(link);
            const linkClass = `relative rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary ${
              isTransparent
                ? active
                  ? "text-primary bg-secondary"
                  : "text-primary-foreground/85 hover:bg-card/15 hover:text-primary-foreground"
                : active
                  ? "text-primary bg-muted"
                  : "text-muted-foreground hover:bg-muted hover:text-primary"
            }`;

            return link.to ? (
              <Link
                key={link.name}
                to={link.to}
                aria-current={active ? "page" : undefined}
                className={linkClass}
              >
                {link.name}
              </Link>
            ) : (
              <a
                key={link.name}
                href={`/#${link.hash}`}
                onClick={handleNavClick(link)}
                aria-current={active ? "location" : undefined}
                className={linkClass}
              >
                {link.name}
              </a>
            );
          })}
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden xl:flex items-center gap-3">
          <a
            href="tel:+8801863339695"
            aria-label="Call Belly Full at 01863-339695"
            className={`flex items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary ${
              isTransparent ? "text-primary-foreground/85 hover:text-primary-foreground" : "text-muted-foreground hover:text-primary"
            }`}
          >
            <Phone className="h-4 w-4" />
            01863-339695
          </a>
          <Button
            variant="default"
            size="default"
            className="bg-gradient-gold text-primary font-semibold shadow-elegant hover:opacity-90"
            onClick={() => goToHash("reservation")}
          >
            <CalendarDays className="h-4 w-4" />
            Book a Table
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobile-navigation"
          onClick={() => setIsMobileMenuOpen((v) => !v)}
          className={`xl:hidden -mr-2 shrink-0 ${
            isTransparent ? "text-primary-foreground hover:bg-card/15 hover:text-primary-foreground" : "text-primary hover:bg-muted"
          }`}
        >
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.25 }}
            id="mobile-navigation"
            className="xl:hidden bg-card/98 border-t border-border shadow-elegant-md overflow-hidden [text-shadow:none]"
          >
            <nav aria-label="Mobile navigation" className="container py-3 flex flex-col gap-1 max-h-[calc(100dvh-4rem)] overflow-y-auto">
              {navLinks.map((link) => {
                const active = isLinkActive(link);
                const linkClass = `flex min-h-11 items-center rounded-md px-3 py-2.5 text-base font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  active ? "bg-muted text-primary" : "text-foreground hover:bg-muted hover:text-primary"
                }`;

                return link.to ? (
                  <Link
                    key={link.name}
                    to={link.to}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={linkClass}
                  >
                    {link.name}
                  </Link>
                ) : (
                  <a
                    key={link.name}
                    href={`/#${link.hash}`}
                    onClick={handleNavClick(link)}
                    aria-current={active ? "location" : undefined}
                    className={linkClass}
                  >
                    {link.name}
                  </a>
                );
              })}
              <div className="mt-2 border-t border-border pt-3 flex flex-col gap-2">
                <a
                  href="tel:+8801863339695"
                  className="flex min-h-11 items-center gap-2 rounded-md px-3 py-2 text-muted-foreground hover:bg-muted hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Phone className="h-4 w-4" />
                  01863-339695
                </a>
                <Button
                  variant="default"
                  className="bg-gradient-gold text-primary font-semibold w-full"
                  onClick={() => goToHash("reservation")}
                >
                  <CalendarDays className="h-4 w-4" />
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
