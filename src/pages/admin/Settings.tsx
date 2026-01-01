import { useState, useEffect } from 'react';
import { Save, Loader2, Globe, Palette, Search, Building } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface GeneralSettings {
  restaurant_name: string;
  tagline: string;
  phone: string;
  email: string;
  address: string;
  google_maps_url: string;
  facebook_url: string;
  instagram_url: string;
  twitter_url: string;
}

interface SeoSettings {
  meta_title: string;
  meta_description: string;
  og_image: string;
  keywords: string;
}

interface DesignSettings {
  primary_color: string;
  show_hero_video: boolean;
  hero_title: string;
  hero_subtitle: string;
}

const defaultGeneral: GeneralSettings = {
  restaurant_name: '',
  tagline: '',
  phone: '',
  email: '',
  address: '',
  google_maps_url: '',
  facebook_url: '',
  instagram_url: '',
  twitter_url: '',
};

const defaultSeo: SeoSettings = {
  meta_title: '',
  meta_description: '',
  og_image: '',
  keywords: '',
};

const defaultDesign: DesignSettings = {
  primary_color: '#c4a574',
  show_hero_video: false,
  hero_title: '',
  hero_subtitle: '',
};

const Settings = () => {
  const [general, setGeneral] = useState<GeneralSettings>(defaultGeneral);
  const [seo, setSeo] = useState<SeoSettings>(defaultSeo);
  const [design, setDesign] = useState<DesignSettings>(defaultDesign);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from('site_settings').select('*');

    if (error) {
      toast({ title: 'Error loading settings', description: error.message, variant: 'destructive' });
    } else if (data) {
      data.forEach((setting) => {
        const value = setting.value as Record<string, unknown>;
        if (setting.key === 'general') setGeneral({ ...defaultGeneral, ...value });
        if (setting.key === 'seo') setSeo({ ...defaultSeo, ...value });
        if (setting.key === 'design') setDesign({ ...defaultDesign, ...value });
      });
    }
    setIsLoading(false);
  };

  const saveSettings = async (key: string, value: GeneralSettings | SeoSettings | DesignSettings) => {
    setIsSaving(true);

    // First check if setting exists
    const { data: existing } = await supabase
      .from('site_settings')
      .select('id')
      .eq('key', key)
      .maybeSingle();

    let error;
    if (existing) {
      const result = await supabase
        .from('site_settings')
        .update({ value: value as unknown as import('@/integrations/supabase/types').Json, updated_at: new Date().toISOString() })
        .eq('key', key);
      error = result.error;
    } else {
      const result = await supabase
        .from('site_settings')
        .insert([{ key, value: value as unknown as import('@/integrations/supabase/types').Json }]);
      error = result.error;
    }

    if (error) {
      toast({ title: 'Error saving settings', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Settings saved', description: 'Your changes have been saved successfully' });
    }
    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Site Settings</h1>
        <p className="text-muted-foreground">Configure your restaurant website</p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="general" className="gap-2">
            <Building className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="seo" className="gap-2">
            <Search className="h-4 w-4" />
            SEO
          </TabsTrigger>
          <TabsTrigger value="design" className="gap-2">
            <Palette className="h-4 w-4" />
            Design
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Information</CardTitle>
              <CardDescription>Basic information about your restaurant</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="restaurant_name">Restaurant Name</Label>
                  <Input
                    id="restaurant_name"
                    value={general.restaurant_name}
                    onChange={(e) => setGeneral({ ...general, restaurant_name: e.target.value })}
                    placeholder="Your Restaurant"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tagline">Tagline</Label>
                  <Input
                    id="tagline"
                    value={general.tagline}
                    onChange={(e) => setGeneral({ ...general, tagline: e.target.value })}
                    placeholder="Delicious food, great atmosphere"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={general.phone}
                    onChange={(e) => setGeneral({ ...general, phone: e.target.value })}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={general.email}
                    onChange={(e) => setGeneral({ ...general, email: e.target.value })}
                    placeholder="info@restaurant.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={general.address}
                  onChange={(e) => setGeneral({ ...general, address: e.target.value })}
                  placeholder="123 Main Street, City, Country"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="google_maps_url">Google Maps URL</Label>
                <Input
                  id="google_maps_url"
                  value={general.google_maps_url}
                  onChange={(e) => setGeneral({ ...general, google_maps_url: e.target.value })}
                  placeholder="https://maps.google.com/..."
                />
              </div>

              <div className="border-t pt-6">
                <h3 className="font-medium mb-4">Social Media Links</h3>
                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="facebook_url">Facebook</Label>
                    <Input
                      id="facebook_url"
                      value={general.facebook_url}
                      onChange={(e) => setGeneral({ ...general, facebook_url: e.target.value })}
                      placeholder="https://facebook.com/..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="instagram_url">Instagram</Label>
                    <Input
                      id="instagram_url"
                      value={general.instagram_url}
                      onChange={(e) => setGeneral({ ...general, instagram_url: e.target.value })}
                      placeholder="https://instagram.com/..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="twitter_url">Twitter</Label>
                    <Input
                      id="twitter_url"
                      value={general.twitter_url}
                      onChange={(e) => setGeneral({ ...general, twitter_url: e.target.value })}
                      placeholder="https://twitter.com/..."
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => saveSettings('general', general)} disabled={isSaving}>
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SEO Settings */}
        <TabsContent value="seo">
          <Card>
            <CardHeader>
              <CardTitle>SEO Settings</CardTitle>
              <CardDescription>Optimize your website for search engines</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="meta_title">Meta Title</Label>
                <Input
                  id="meta_title"
                  value={seo.meta_title}
                  onChange={(e) => setSeo({ ...seo, meta_title: e.target.value })}
                  placeholder="Restaurant Name - Best Food in Town"
                />
                <p className="text-xs text-muted-foreground">Recommended: 50-60 characters</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="meta_description">Meta Description</Label>
                <Textarea
                  id="meta_description"
                  value={seo.meta_description}
                  onChange={(e) => setSeo({ ...seo, meta_description: e.target.value })}
                  placeholder="Describe your restaurant in a few sentences..."
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">Recommended: 150-160 characters</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="keywords">Keywords</Label>
                <Input
                  id="keywords"
                  value={seo.keywords}
                  onChange={(e) => setSeo({ ...seo, keywords: e.target.value })}
                  placeholder="restaurant, fine dining, local food, cuisine"
                />
                <p className="text-xs text-muted-foreground">Comma-separated list of keywords</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="og_image">Social Share Image URL</Label>
                <Input
                  id="og_image"
                  value={seo.og_image}
                  onChange={(e) => setSeo({ ...seo, og_image: e.target.value })}
                  placeholder="https://..."
                />
                <p className="text-xs text-muted-foreground">Recommended size: 1200x630 pixels</p>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => saveSettings('seo', seo)} disabled={isSaving}>
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Design Settings */}
        <TabsContent value="design">
          <Card>
            <CardHeader>
              <CardTitle>Design Preferences</CardTitle>
              <CardDescription>Customize the look and feel of your website</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="primary_color">Primary Color</Label>
                <div className="flex gap-3">
                  <Input
                    id="primary_color"
                    type="color"
                    value={design.primary_color}
                    onChange={(e) => setDesign({ ...design, primary_color: e.target.value })}
                    className="w-16 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    value={design.primary_color}
                    onChange={(e) => setDesign({ ...design, primary_color: e.target.value })}
                    placeholder="#c4a574"
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Show Hero Video</Label>
                  <p className="text-sm text-muted-foreground">Display a video in the hero section instead of an image</p>
                </div>
                <Switch
                  checked={design.show_hero_video}
                  onCheckedChange={(checked) => setDesign({ ...design, show_hero_video: checked })}
                />
              </div>

              <div className="border-t pt-6">
                <h3 className="font-medium mb-4">Hero Section</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="hero_title">Hero Title</Label>
                    <Input
                      id="hero_title"
                      value={design.hero_title}
                      onChange={(e) => setDesign({ ...design, hero_title: e.target.value })}
                      placeholder="Welcome to Our Restaurant"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hero_subtitle">Hero Subtitle</Label>
                    <Input
                      id="hero_subtitle"
                      value={design.hero_subtitle}
                      onChange={(e) => setDesign({ ...design, hero_subtitle: e.target.value })}
                      placeholder="Experience culinary excellence"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => saveSettings('design', design)} disabled={isSaving}>
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
