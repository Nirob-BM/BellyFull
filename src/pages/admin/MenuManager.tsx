import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Plus, Pencil, Trash2, Star, Flame, Leaf, Search, Upload, X, Loader2, GripVertical, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  image_url: string | null;
  images: string[] | null;
  is_popular: boolean | null;
  is_spicy: boolean | null;
  is_veg: boolean | null;
  is_active: boolean | null;
  sort_order: number | null;
}

interface Category {
  id: string;
  name: string;
  icon_url: string | null;
  is_visible: boolean;
  sort_order: number;
}

const MenuManager = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    image_url: '',
    images: [] as string[],
    is_popular: false,
    is_spicy: false,
    is_veg: false,
    is_active: true,
  });
  const [isUploading, setIsUploading] = useState(false);
  const [draggedImageIndex, setDraggedImageIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const multiFileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>, isMultiple: boolean = false) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);

    try {
      const uploadedUrls: string[] = [];

      for (const file of Array.from(files)) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          toast({ title: 'Invalid file', description: `${file.name} is not an image`, variant: 'destructive' });
          continue;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          toast({ title: 'File too large', description: `${file.name} must be less than 5MB`, variant: 'destructive' });
          continue;
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `menu-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `menu-items/${fileName}`;

        // Upload to Supabase storage
        const { error: uploadError } = await supabase.storage
          .from('media')
          .upload(filePath, file, { cacheControl: '2592000' });

        if (uploadError) {
          toast({ title: 'Upload failed', description: uploadError.message, variant: 'destructive' });
          continue;
        }

        // Get public URL
        const { data: urlData } = supabase.storage.from('media').getPublicUrl(filePath);
        uploadedUrls.push(urlData.publicUrl);
      }

      if (uploadedUrls.length > 0) {
        if (isMultiple) {
          setFormData({ 
            ...formData, 
            images: [...formData.images, ...uploadedUrls],
            image_url: formData.image_url || uploadedUrls[0] // Set first as primary if none set
          });
        } else {
          setFormData({ ...formData, image_url: uploadedUrls[0] });
        }
        toast({ title: 'Uploaded', description: `${uploadedUrls.length} image(s) uploaded successfully` });
      }
    } catch (error: any) {
      toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (multiFileInputRef.current) multiFileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    // Fetch categories and menu items in parallel
    const [categoriesResult, menuResult] = await Promise.all([
      supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true }),
      supabase
        .from('menu_items')
        .select('*')
        .order('sort_order', { ascending: true })
    ]);
    
    if (categoriesResult.error) {
      toast({ title: 'Error', description: 'Failed to fetch categories', variant: 'destructive' });
    } else {
      setCategories(categoriesResult.data || []);
      // Set default category for new items
      if (categoriesResult.data && categoriesResult.data.length > 0 && !formData.category) {
        setFormData(prev => ({ ...prev, category: categoriesResult.data[0].name }));
      }
    }
    
    if (menuResult.error) {
      toast({ title: 'Error', description: 'Failed to fetch menu items', variant: 'destructive' });
    } else {
      setMenuItems(menuResult.data || []);
    }
    setIsLoading(false);
  };

  const fetchMenuItems = async () => {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .order('sort_order', { ascending: true });
    
    if (error) {
      toast({ title: 'Error', description: 'Failed to fetch menu items', variant: 'destructive' });
    } else {
      setMenuItems(data || []);
    }
  };

  const openAddDialog = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      category: categories.length > 0 ? categories[0].name : '',
      image_url: '',
      images: [],
      is_popular: false,
      is_spicy: false,
      is_veg: false,
      is_active: true,
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      price: item.price.toString(),
      category: item.category,
      image_url: item.image_url || '',
      images: item.images || [],
      is_popular: item.is_popular || false,
      is_spicy: item.is_spicy || false,
      is_veg: item.is_veg || false,
      is_active: item.is_active ?? true,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const itemData = {
      name: formData.name,
      description: formData.description || null,
      price: parseFloat(formData.price),
      category: formData.category,
      image_url: formData.image_url || null,
      images: formData.images.length > 0 ? formData.images : null,
      is_popular: formData.is_popular,
      is_spicy: formData.is_spicy,
      is_veg: formData.is_veg,
      is_active: formData.is_active,
    };

    if (editingItem) {
      const { error } = await supabase
        .from('menu_items')
        .update(itemData)
        .eq('id', editingItem.id);

      if (error) {
        toast({ title: 'Error', description: 'Failed to update menu item', variant: 'destructive' });
      } else {
        toast({ title: 'Success', description: 'Menu item updated successfully' });
        fetchMenuItems();
        setIsDialogOpen(false);
      }
    } else {
      const { error } = await supabase
        .from('menu_items')
        .insert([{ ...itemData, sort_order: menuItems.length + 1 }]);

      if (error) {
        toast({ title: 'Error', description: 'Failed to add menu item', variant: 'destructive' });
      } else {
        toast({ title: 'Success', description: 'Menu item added successfully' });
        fetchMenuItems();
        setIsDialogOpen(false);
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this menu item?')) return;

    const { error } = await supabase.from('menu_items').delete().eq('id', id);

    if (error) {
      toast({ title: 'Error', description: 'Failed to delete menu item', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Menu item deleted successfully' });
      fetchMenuItems();
    }
  };

  const removeImage = (index: number) => {
    const newImages = formData.images.filter((_, i) => i !== index);
    setFormData({ ...formData, images: newImages });
  };

  const handleDragStart = (index: number) => {
    setDraggedImageIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedImageIndex === null || draggedImageIndex === index) return;

    const newImages = [...formData.images];
    const draggedImage = newImages[draggedImageIndex];
    newImages.splice(draggedImageIndex, 1);
    newImages.splice(index, 0, draggedImage);

    setFormData({ ...formData, images: newImages });
    setDraggedImageIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedImageIndex(null);
  };

  const setAsPrimaryImage = (url: string) => {
    setFormData({ ...formData, image_url: url });
    toast({ title: 'Primary image set', description: 'This image will be shown as the main product image' });
  };

  const filteredItems = menuItems.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Menu Manager</h1>
          <p className="text-muted-foreground">Manage your restaurant menu items</p>
        </div>
        <Button onClick={openAddDialog} className="bg-primary text-primary-foreground">
          <Plus className="h-4 w-4 mr-2" /> Add Item
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search menu items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={selectedCategory === 'All' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory('All')}
          >
            All
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.name ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(cat.name)}
            >
              {cat.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Menu Items Grid */}
      {isLoading ? (
        <div className="text-center py-12">Loading...</div>
      ) : filteredItems.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No menu items found
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className={!item.is_active ? 'opacity-60' : ''}>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    {(item.image_url || (item.images && item.images.length > 0)) && (
                      <div className="relative">
                        <img
                          src={item.image_url || item.images?.[0]}
                          alt={item.name}
                          className="w-20 h-20 object-cover rounded-lg"
            loading="lazy"
            decoding="async"/>
                        {item.images && item.images.length > 1 && (
                          <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full">
                            +{item.images.length - 1}
                          </span>
                        )}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-foreground truncate">{item.name}</h3>
                        <span className="font-bold text-secondary whitespace-nowrap">৳{item.price}</span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{item.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs bg-muted px-2 py-0.5 rounded">{item.category}</span>
                        {item.is_popular && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />}
                        {item.is_spicy && <Flame className="h-4 w-4 text-red-500" />}
                        {item.is_veg && <Leaf className="h-4 w-4 text-green-500" />}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => openEditDialog(item)}>
                      <Pencil className="h-4 w-4 mr-1" /> Edit
                    </Button>
                    <Button variant="outline" size="sm" className="text-destructive" onClick={() => handleDelete(item.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Menu Item' : 'Add Menu Item'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price (৳) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Multiple Images Section */}
            <div className="space-y-3">
              <Label>Product Images (up to 4)</Label>
              
              {/* Current Primary Image */}
              {formData.image_url && (
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <img
                    src={formData.image_url}
                    alt="Primary"
                    className="w-16 h-16 object-cover rounded-lg border-2 border-primary"
            loading="lazy"
            decoding="async"/>
                  <div className="flex-1">
                    <span className="text-sm font-medium">Primary Image</span>
                    <p className="text-xs text-muted-foreground">This is shown on menu cards</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setFormData({ ...formData, image_url: '' })}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {/* Gallery Images with Drag & Drop */}
              {formData.images.length > 0 && (
                <div className="space-y-2">
                  <span className="text-sm text-muted-foreground">Gallery Images (drag to reorder)</span>
                  <div className="grid grid-cols-4 gap-3">
                    {formData.images.map((img, index) => (
                      <div
                        key={index}
                        draggable
                        onDragStart={() => handleDragStart(index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragEnd={handleDragEnd}
                        className={`relative group cursor-move ${
                          draggedImageIndex === index ? 'opacity-50' : ''
                        }`}
                      >
                        <img
                          src={img}
                          alt={`Gallery ${index + 1}`}
                          className={`w-full aspect-square object-cover rounded-lg border-2 transition-colors ${
                            img === formData.image_url ? 'border-primary' : 'border-transparent hover:border-muted-foreground/30'
                          }`}
            loading="lazy"
            decoding="async"/>
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-1">
                          <GripVertical className="h-4 w-4 text-white" />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                        {img !== formData.image_url && (
                          <button
                            type="button"
                            onClick={() => setAsPrimaryImage(img)}
                            className="absolute bottom-1 left-1 right-1 bg-card/90 text-foreground text-xs py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            Set Primary
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Upload Buttons */}
              <div className="flex gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, false)}
                  className="hidden"
                  id="image-upload"
                />
                <input
                  ref={multiFileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleImageUpload(e, true)}
                  className="hidden"
                  id="multi-image-upload"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="flex-1"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Primary
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => multiFileInputRef.current?.click()}
                  disabled={isUploading || formData.images.length >= 4}
                >
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Add Gallery ({formData.images.length}/4)
                </Button>
              </div>
              
              {/* Or use URL */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="flex-1 border-t" />
                <span>or paste URL for primary</span>
                <span className="flex-1 border-t" />
              </div>
              <Input
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="is_popular">Popular</Label>
                <Switch
                  id="is_popular"
                  checked={formData.is_popular}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_popular: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="is_spicy">Spicy</Label>
                <Switch
                  id="is_spicy"
                  checked={formData.is_spicy}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_spicy: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="is_veg">Vegetarian</Label>
                <Switch
                  id="is_veg"
                  checked={formData.is_veg}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_veg: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="is_active">Active</Label>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-primary text-primary-foreground">
                {editingItem ? 'Update' : 'Add'} Item
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MenuManager;
