-- Populate dish detail metadata for existing menu items
UPDATE public.menu_items SET
  ingredients = ARRAY['Aged basmati rice','Chicken','Saffron','Fried onions','Yogurt','Biryani spices','Ghee'],
  allergens = ARRAY['Dairy'],
  spice_level = 2, is_spicy = true,
  prep_time_minutes = 35
WHERE lower(name) LIKE '%biryani%' AND ingredients IS NULL;

UPDATE public.menu_items SET
  ingredients = ARRAY['Chicken','Tomato','Butter','Cream','Ginger-garlic','Garam masala','Kasuri methi'],
  allergens = ARRAY['Dairy'],
  spice_level = 2, is_spicy = true,
  prep_time_minutes = 25
WHERE (lower(name) LIKE '%butter chicken%' OR lower(name) LIKE '%tikka masala%') AND ingredients IS NULL;

UPDATE public.menu_items SET
  ingredients = ARRAY['Paneer','Tomato','Onion','Cream','Butter','Spices'],
  allergens = ARRAY['Dairy'],
  spice_level = 1, is_spicy = true,
  prep_time_minutes = 20
WHERE lower(name) LIKE '%paneer%' AND ingredients IS NULL;

UPDATE public.menu_items SET
  ingredients = ARRAY['Fresh fish','Mustard paste','Green chili','Turmeric','Mustard oil'],
  allergens = ARRAY['Fish','Mustard'],
  spice_level = 3, is_spicy = true,
  prep_time_minutes = 30
WHERE (lower(name) LIKE '%fish%' OR lower(name) LIKE '%ilish%' OR lower(name) LIKE '%hilsa%') AND ingredients IS NULL;

UPDATE public.menu_items SET
  ingredients = ARRAY['Seasonal vegetables','Onion','Tomato','Ginger','Mixed spices'],
  allergens = NULL,
  spice_level = 1, is_spicy = true, is_veg = true,
  prep_time_minutes = 20
WHERE (lower(name) LIKE '%vegetable%' OR lower(name) LIKE '%veg curry%') AND ingredients IS NULL;

UPDATE public.menu_items SET
  ingredients = ARRAY['Beef patty','Brioche bun','Cheddar','Lettuce','Tomato','House sauce'],
  allergens = ARRAY['Gluten','Dairy','Egg','Sesame'],
  spice_level = 0, is_spicy = false,
  prep_time_minutes = 15
WHERE lower(name) LIKE '%burger%' AND ingredients IS NULL;

UPDATE public.menu_items SET
  ingredients = ARRAY['Espresso','Steamed milk','Milk foam'],
  allergens = ARRAY['Dairy'],
  spice_level = 0, is_spicy = false,
  prep_time_minutes = 5
WHERE (lower(name) LIKE '%coffee%' OR lower(name) LIKE '%cappuccino%' OR lower(name) LIKE '%latte%') AND ingredients IS NULL;

UPDATE public.menu_items SET
  ingredients = ARRAY['Yogurt','Sugar','Cardamom'],
  allergens = ARRAY['Dairy'],
  spice_level = 0, is_spicy = false,
  prep_time_minutes = 5
WHERE lower(name) LIKE '%lassi%' AND ingredients IS NULL;

UPDATE public.menu_items SET
  ingredients = ARRAY['Naan dough','Butter','Garlic','Coriander'],
  allergens = ARRAY['Gluten','Dairy'],
  spice_level = 0, is_spicy = false,
  prep_time_minutes = 10
WHERE lower(name) LIKE '%naan%' AND ingredients IS NULL;

-- Generic defaults for anything still missing
UPDATE public.menu_items SET
  prep_time_minutes = COALESCE(prep_time_minutes, 20),
  spice_level = COALESCE(spice_level, CASE WHEN is_spicy THEN 2 ELSE 0 END)
WHERE prep_time_minutes IS NULL OR spice_level IS NULL;