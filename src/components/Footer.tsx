import { Facebook, Instagram, Mail, MapPin, Phone } from "lucide-react";
import logo from "@/assets/logo.jpg";

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand Column */}
          <div className="lg:col-span-1">
            <a href="#home" className="flex items-center gap-3 mb-6">
              <img
                src={logo}
                alt="Belly Full Logo"
                className="h-14 w-14 rounded-lg object-cover"
              />
              <span className="font-display text-2xl font-bold">Belly Full</span>
            </a>
            <p className="text-primary-foreground/80 leading-relaxed mb-6">
              First authentic multicuisine restaurant & café in the heart of Kishoreganj. 
              Experience flavors that fill not just your belly, but your heart.
            </p>
            {/* Social Links */}
            <div className="flex gap-4">
              <a
                href="https://www.facebook.com/profile.php?id=100084966930606"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-primary-foreground/10 flex items-center justify-center hover:bg-secondary hover:text-secondary-foreground transition-all duration-300"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="https://www.instagram.com/bellyfull_2022/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-primary-foreground/10 flex items-center justify-center hover:bg-secondary hover:text-secondary-foreground transition-all duration-300"
              >
                <Instagram className="h-5 w-5" />
              </a>
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
              <li className="flex justify-between">
                <span>Saturday - Thursday</span>
                <span className="text-secondary">11AM - 11PM</span>
              </li>
              <li className="flex justify-between">
                <span>Friday</span>
                <span className="text-secondary">3PM - 11PM</span>
              </li>
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
                  href="https://maps.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 text-primary-foreground/70 hover:text-secondary transition-colors"
                >
                  <MapPin className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <span>
                    53, Opposite of Tomaltola Primary School,<br />
                    Rothkhola, Kishoreganj 2300
                  </span>
                </a>
              </li>
              <li>
                <a
                  href="tel:+8801863339695"
                  className="flex items-center gap-3 text-primary-foreground/70 hover:text-secondary transition-colors"
                >
                  <Phone className="h-5 w-5" />
                  01863-339695
                </a>
              </li>
              <li>
                <a
                  href="mailto:bellyfull2022@gmail.com"
                  className="flex items-center gap-3 text-primary-foreground/70 hover:text-secondary transition-colors"
                >
                  <Mail className="h-5 w-5" />
                  bellyfull2022@gmail.com
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
            © {new Date().getFullYear()} Belly Full. All rights reserved.
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
