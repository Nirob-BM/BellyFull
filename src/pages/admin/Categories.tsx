import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Pencil, Trash2, Eye, EyeOff, GripVertical, Check, X, Folder } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_visible: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

const Categories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_visible: true,
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch categories',
        variant: 'destructive',
      });
    } else {
      setCategories(data || []);
    }
    setIsLoading(false);
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast({
        title: 'Error',
        description: 'Category name is required',
        variant: 'destructive',
      });
      return;
    }

    const slug = generateSlug(formData.name);

    if (editingCategory) {
      const { error } = await supabase
        .from('categories')
        .update({
          name: formData.name.trim(),
          slug,
          description: formData.description.trim() || null,
          is_visible: formData.is_visible,
        })
        .eq('id', editingCategory.id);

      if (error) {
        toast({
          title: 'Error',
          description: error.message.includes('duplicate') 
            ? 'A category with this name already exists' 
            : 'Failed to update category',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Success',
          description: 'Category updated successfully',
        });
        setIsDialogOpen(false);
        resetForm();
        fetchCategories();
      }
    } else {
      const maxOrder = categories.length > 0 
        ? Math.max(...categories.map(c => c.sort_order)) + 1 
        : 0;

      const { error } = await supabase
        .from('categories')
        .insert({
          name: formData.name.trim(),
          slug,
          description: formData.description.trim() || null,
          is_visible: formData.is_visible,
          sort_order: maxOrder,
        });

      if (error) {
        toast({
          title: 'Error',
          description: error.message.includes('duplicate') 
            ? 'A category with this name already exists' 
            : 'Failed to create category',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Success',
          description: 'Category created successfully',
        });
        setIsDialogOpen(false);
        resetForm();
        fetchCategories();
      }
    }
  };

  const handleDelete = async () => {
    if (!categoryToDelete) return;

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', categoryToDelete.id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete category',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Category deleted successfully',
      });
      fetchCategories();
    }
    setIsDeleteDialogOpen(false);
    setCategoryToDelete(null);
  };

  const toggleVisibility = async (category: Category) => {
    const { error } = await supabase
      .from('categories')
      .update({ is_visible: !category.is_visible })
      .eq('id', category.id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update visibility',
        variant: 'destructive',
      });
    } else {
      setCategories(prev =>
        prev.map(c =>
          c.id === category.id ? { ...c, is_visible: !c.is_visible } : c
        )
      );
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      is_visible: category.is_visible,
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', is_visible: true });
    setEditingCategory(null);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newCategories = [...categories];
    const draggedItem = newCategories[draggedIndex];
    newCategories.splice(draggedIndex, 1);
    newCategories.splice(index, 0, draggedItem);
    
    setCategories(newCategories);
    setDraggedIndex(index);
  };

  const handleDragEnd = async () => {
    if (draggedIndex === null) return;

    // Update sort_order for all categories
    const updates = categories.map((category, index) => ({
      id: category.id,
      sort_order: index,
    }));

    for (const update of updates) {
      await supabase
        .from('categories')
        .update({ sort_order: update.sort_order })
        .eq('id', update.id);
    }

    setDraggedIndex(null);
    toast({
      title: 'Success',
      description: 'Category order updated',
    });
  };

  const moveCategory = async (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= categories.length) return;

    const newCategories = [...categories];
    [newCategories[index], newCategories[newIndex]] = [newCategories[newIndex], newCategories[index]];
    setCategories(newCategories);

    // Update sort_order for swapped categories
    await supabase
      .from('categories')
      .update({ sort_order: newIndex })
      .eq('id', categories[index].id);

    await supabase
      .from('categories')
      .update({ sort_order: index })
      .eq('id', categories[newIndex].id);

    toast({
      title: 'Success',
      description: 'Category order updated',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Category Manager</h1>
          <p className="text-muted-foreground mt-1">Manage menu categories, visibility, and order</p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setIsDialogOpen(true);
          }}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Category
        </Button>
      </div>

      {categories.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-lg border border-border">
          <Folder className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No categories yet</h3>
          <p className="text-muted-foreground mb-4">Create your first category to organize menu items</p>
          <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Category
          </Button>
        </div>
      ) : (
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="hidden md:table-cell">Description</TableHead>
                <TableHead className="w-24 text-center">Visible</TableHead>
                <TableHead className="w-32 text-center">Order</TableHead>
                <TableHead className="w-32 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category, index) => (
                <TableRow
                  key={category.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`cursor-move ${draggedIndex === index ? 'opacity-50' : ''}`}
                >
                  <TableCell>
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                  </TableCell>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {category.description || '-'}
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleVisibility(category)}
                      className={category.is_visible ? 'text-green-600' : 'text-muted-foreground'}
                    >
                      {category.is_visible ? (
                        <Eye className="h-4 w-4" />
                      ) : (
                        <EyeOff className="h-4 w-4" />
                      )}
                    </Button>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => moveCategory(index, 'up')}
                        disabled={index === 0}
                        className="h-8 w-8"
                      >
                        <span className="sr-only">Move up</span>
                        ↑
                      </Button>
                      <span className="text-sm text-muted-foreground w-6 text-center">
                        {index + 1}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => moveCategory(index, 'down')}
                        disabled={index === categories.length - 1}
                        className="h-8 w-8"
                      >
                        <span className="sr-only">Move down</span>
                        ↓
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(category)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setCategoryToDelete(category);
                          setIsDeleteDialogOpen(true);
                        }}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Edit Category' : 'Add New Category'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Category Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Main Course"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description for this category"
                rows={3}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="is_visible">Visible on Menu</Label>
              <Switch
                id="is_visible"
                checked={formData.is_visible}
                onCheckedChange={(checked) => setFormData({ ...formData, is_visible: checked })}
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                {editingCategory ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{categoryToDelete?.name}"? This action cannot be undone.
              Note: Menu items in this category will not be deleted but may need to be reassigned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
};

export default Categories;
