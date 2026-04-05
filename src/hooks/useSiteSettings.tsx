import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SiteSettings {
  general: {
    restaurantName: string;
    tagline: string;
    phone: string;
    email: string;
    address: string;
    googleMapsUrl: string;
    facebookUrl: string;
    instagramUrl: string;
  };
  seo: {
    metaTitle: string;
    metaDescription: string;
    keywords: string;
    socialImage: string;
  };
  design: {
    primaryColor: string;
    heroVideoEnabled: boolean;
    heroTitle: string;
    heroSubtitle: string;
  };
  about: {
    title: string;
    description: string;
    secondaryDescription: string;
    establishedYear: string;
  };
}

const defaultSettings: SiteSettings = {
  general: {
    restaurantName: "Belly Full",
    tagline: "First authentic multicuisine restaurant & café in Kishoreganj",
    phone: "01863-339695",
    email: "bellyfull2022@gmail.com",
    address: "53, Opposite of Tomaltola Primary School, Rothkhola, Kishoreganj 2300, Dhaka Division, Bangladesh",
    googleMapsUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d912.9099878665849!2d90.78452089999999!3d24.4368456!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x375468e04c4a3477%3A0x63e2c10c4e7f88fd!2sBelly%20Full!5e1!3m2!1sen!2sbd!4v1705000000000!5m2!1sen!2sbd",
    facebookUrl: "https://www.facebook.com/profile.php?id=100084966930606",
    instagramUrl: "https://www.instagram.com/bellyfull_2022/",
  },
  seo: {
    metaTitle: "Belly Full - Multicuisine Restaurant & Café",
    metaDescription: "First authentic multicuisine restaurant & café in Kishoreganj",
    keywords: "restaurant, cafe, kishoreganj, bengali food, multicuisine",
    socialImage: "",
  },
  design: {
    primaryColor: "#2C5F2D",
    heroVideoEnabled: false,
    heroTitle: "Welcome to Belly Full",
    heroSubtitle: "Experience authentic multicuisine dining",
  },
  about: {
    title: "A Culinary Journey in the Heart of Kishoreganj",
    description: "Welcome to Belly Full — the first authentic multicuisine restaurant and café in Kishoreganj. Since 2022, we've been on a mission to bring diverse culinary experiences to our beloved city. Our passionate team of chefs crafts each dish with love, blending traditional recipes with modern techniques to create unforgettable dining moments.",
    secondaryDescription: "Whether you're craving the rich flavors of Bengali cuisine, the aromatic spices of Indian dishes, or the comfort of international classics, Belly Full promises a feast for your senses. Join us for breakfast, lunch, or dinner, and let us fill not just your belly, but your heart.",
    establishedYear: "2022",
  },
};

export const useSiteSettings = () => {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from("site_settings")
          .select("key, value");

        if (error) throw error;

        if (data && data.length > 0) {
          const merged: SiteSettings = {
            general: { ...defaultSettings.general },
            seo: { ...defaultSettings.seo },
            design: { ...defaultSettings.design },
            about: { ...defaultSettings.about },
          };
          data.forEach((setting) => {
            const key = setting.key as keyof SiteSettings;
            if (key === 'general') {
              const raw = setting.value as Record<string, string>;
              merged.general = {
                ...merged.general,
                ...(raw as Partial<SiteSettings['general']>),
                // Map snake_case DB keys to camelCase interface keys
                ...(raw.google_maps_url ? { googleMapsUrl: raw.google_maps_url } : {}),
                ...(raw.restaurant_name || raw.restaurantName ? { restaurantName: raw.restaurantName || raw.restaurant_name } : {}),
                ...(raw.facebook_url || raw.facebook ? { facebookUrl: raw.facebook_url || raw.facebook || raw.facebookUrl } : {}),
                ...(raw.instagram_url || raw.instagram ? { instagramUrl: raw.instagram_url || raw.instagram || raw.instagramUrl } : {}),
              };
            } else if (key === 'seo') {
              merged.seo = { ...merged.seo, ...(setting.value as Partial<SiteSettings['seo']>) };
            } else if (key === 'design') {
              merged.design = { ...merged.design, ...(setting.value as Partial<SiteSettings['design']>) };
            } else if (key === 'about') {
              merged.about = { ...merged.about, ...(setting.value as Partial<SiteSettings['about']>) };
            }
          });
          setSettings(merged);
        }
      } catch (error) {
        console.error("Error fetching site settings:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  return { settings, isLoading };
};

export interface OpeningHoursData {
  day_name: string;
  day_of_week: number;
  open_time: string | null;
  close_time: string | null;
  is_closed: boolean | null;
}

export const useOpeningHours = () => {
  const [hours, setHours] = useState<OpeningHoursData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHours = async () => {
      try {
        const { data, error } = await supabase
          .from("opening_hours")
          .select("*")
          .order("day_of_week");

        if (error) throw error;
        setHours(data || []);
      } catch (error) {
        console.error("Error fetching opening hours:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHours();
  }, []);

  // Format hours for display
  const formattedHours = hours.map((h) => ({
    day: h.day_name,
    hours: h.is_closed
      ? "Closed"
      : `${h.open_time || "N/A"} - ${h.close_time || "N/A"}`,
    isClosed: h.is_closed,
  }));

  return { hours: formattedHours, isLoading };
};
