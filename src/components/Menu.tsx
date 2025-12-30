import { useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Flame, Leaf, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

import biryaniImg from "@/assets/dish-biryani.jpg";
import butterChickenImg from "@/assets/dish-butter-chicken.jpg";
import fishImg from "@/assets/dish-fish.jpg";
import vegetableImg from "@/assets/dish-vegetable.jpg";
import coffeeImg from "@/assets/dish-coffee.jpg";
import burgerImg from "@/assets/dish-burger.jpg";

const categories = ["All", "Bengali", "Indian", "Fast Food", "Beverages"];

const menuItems = [
  {
    id: 1,
    name: "Mutton Biryani",
    description: "Aromatic basmati rice layered with tender mutton and saffron",
    price: 350,
    category: "Bengali",
    image: biryaniImg,
    isPopular: true,
    isSpicy: true,
  },
  {
    id: 2,
    name: "Butter Chicken",
    description: "Creamy tomato-based curry with tender chicken pieces",
    price: 320,
    category: "Indian",
    image: butterChickenImg,
    isPopular: true,
  },
  {
    id: 3,
    name: "Grilled Ilish",
    description: "Fresh hilsa fish grilled with traditional Bengali spices",
    price: 450,
    category: "Bengali",
    image: fishImg,
    isPopular: true,
  },
  {
    id: 4,
    name: "Mixed Vegetable Curry",
    description: "Seasonal vegetables in a rich, aromatic gravy",
    price: 180,
    category: "Bengali",
    image: vegetableImg,
    isVeg: true,
  },
  {
    id: 5,
    name: "Cappuccino",
    description: "Rich espresso with steamed milk and chocolate brownie",
    price: 150,
    category: "Beverages",
    image: coffeeImg,
    isVeg: true,
  },
  {
    id: 6,
    name: "Classic Beef Burger",
    description: "Juicy beef patty with cheese, lettuce, and special sauce",
    price: 280,
    category: "Fast Food",
    image: burgerImg,
    isPopular: true,
  },
];

const Menu = () => {
  const [activeCategory, setActiveCategory] = useState("All");
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const filteredItems = activeCategory === "All" 
    ? menuItems 
    : menuItems.filter(item => item.category === activeCategory);

  return (
    <section id="menu" className="py-24 bg-background" ref={ref}>
      <div className="container">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto mb-12"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-secondary/20 text-secondary-foreground text-sm font-medium mb-4">
            Our Menu
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
            Discover Our <span className="text-secondary">Signature Dishes</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Explore our carefully crafted menu featuring the finest multicuisine selections
          </p>
        </motion.div>

        {/* Category Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="flex flex-wrap justify-center gap-3 mb-12"
        >
          {categories.map((category) => (
            <Button
              key={category}
              variant={activeCategory === category ? "default" : "outline"}
              onClick={() => setActiveCategory(category)}
              className={activeCategory === category 
                ? "bg-primary text-primary-foreground" 
                : "border-border text-muted-foreground hover:text-foreground hover:border-primary"
              }
            >
              {category}
            </Button>
          ))}
        </motion.div>

        {/* Menu Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.1 * index, duration: 0.5 }}
              className="group bg-card rounded-2xl overflow-hidden shadow-elegant border border-border hover:shadow-elegant-lg transition-all duration-300"
            >
              {/* Image */}
              <div className="relative aspect-[4/3] overflow-hidden">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                {/* Badges */}
                <div className="absolute top-4 left-4 flex gap-2">
                  {item.isPopular && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-medium">
                      <Star className="h-3 w-3 fill-current" />
                      Popular
                    </span>
                  )}
                  {item.isSpicy && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-destructive text-destructive-foreground text-xs font-medium">
                      <Flame className="h-3 w-3" />
                      Spicy
                    </span>
                  )}
                  {item.isVeg && (
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
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {item.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* View Full Menu CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="text-center mt-12"
        >
          <Button size="lg" variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
            View Full Menu
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default Menu;
