import { Facebook, Instagram, Mail, MapPin, Phone } from "lucide-react";
import logo from "@/assets/logo.jpg";
import { useSiteSettings, useOpeningHours } from "@/hooks/useSiteSettings";

const Footer = () => {
  const { settings } = useSiteSettings();
  const { hours: openingHours } = useOpeningHours();

  // Group consecutive days with same hours for cleaner display
  const groupedHours = openingHours.reduce<{ days: string; hours: string }[]>((acc, curr, i, arr) => {
    if (i === 0 || curr.hours !== arr[i - 1].hours) {
      acc.push({ days: curr.day, hours: curr.hours });
    } else {
      // Extend the previous group
      const lastGroup = acc[acc.length - 1];
      const firstDay = lastGroup.days.split(" - ")[0];
      lastGroup.days = `${firstDay} - ${curr.day}`;
    }
    return acc;
  }, []);

  const displayHours = groupedHours.length > 0 ? groupedHours : [
    { days: "Saturday - Thursday", hours: "11AM - 11PM" },
    { days: "Friday", hours: "3PM - 11PM" },
  ];

  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand Column */}
          <div className="lg:col-span-1">
            <a href="#home" className="flex items-center gap-3 mb-6">
              <img
                src={logo}
                alt={`${settings.general.restaurantName} Logo`}
                className="h-14 w-14 rounded-lg object-cover"
              />
              <span className="font-display text-2xl font-bold">{settings.general.restaurantName}</span>
            </a>
            <p className="text-primary-foreground/80 leading-relaxed mb-6">
              {settings.general.tagline}
            </p>
            {/* Social Links */}
            <div className="flex gap-4">
              {settings.general.facebookUrl && (
                <a
                  href={settings.general.facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-primary-foreground/10 flex items-center justify-center hover:bg-secondary hover:text-secondary-foreground transition-all duration-300"
                >
                  <Facebook className="h-5 w-5" />
                </a>
              )}
              {settings.general.instagramUrl && (
                <a
                  href={settings.general.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-primary-foreground/10 flex items-center justify-center hover:bg-secondary hover:text-secondary-foreground transition-all duration-300"
                >
                  <Instagram className="h-5 w-5" />
                </a>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-display text-lg font-semibold mb-6">Quick Links</h3>
            <ul className="space-y-3">
              {[
                { name: "Home", href: "#home" },
                { name: "About Us", href: "#about" },
                { name: "Our Menu", href: "#menu" },
                { name: "Reservations", href: "#reservation" },
                { name: "Testimonials", href: "#testimonials" },
                { name: "FAQ", href: "#faq" },
              ].map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-primary-foreground/70 hover:text-secondary transition-colors"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Opening Hours */}
          <div>
            <h3 className="font-display text-lg font-semibold mb-6">Opening Hours</h3>
            <ul className="space-y-3 text-primary-foreground/70">
              {displayHours.map((item, index) => (
                <li key={index} className="flex justify-between">
                  <span>{item.days}</span>
                  <span className="text-secondary">{item.hours}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 pt-6 border-t border-primary-foreground/10">
              <p className="text-sm text-primary-foreground/60">
                * Kitchen closes 30 minutes before closing time
              </p>
            </div>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-display text-lg font-semibold mb-6">Contact Us</h3>
            <ul className="space-y-4">
              <li>
                <a
                  href={settings.general.googleMapsUrl.replace('/embed', '')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 text-primary-foreground/70 hover:text-secondary transition-colors"
                >
                  <MapPin className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <span>
                    {settings.general.address.split(",").slice(0, 2).join(",")}
                  </span>
                </a>
              </li>
              <li>
                <a
                  href={`tel:+88${settings.general.phone.replace(/[^0-9]/g, '')}`}
                  className="flex items-center gap-3 text-primary-foreground/70 hover:text-secondary transition-colors"
                >
                  <Phone className="h-5 w-5" />
                  {settings.general.phone}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${settings.general.email}`}
                  className="flex items-center gap-3 text-primary-foreground/70 hover:text-secondary transition-colors"
                >
                  <Mail className="h-5 w-5" />
                  {settings.general.email}
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-primary-foreground/10">
        <div className="container py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-primary-foreground/60">
            © {new Date().getFullYear()} {settings.general.restaurantName}. All rights reserved.
          </p>
          <p className="text-sm text-primary-foreground/60">
            Made with ❤️ in Kishoreganj, Bangladesh
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
