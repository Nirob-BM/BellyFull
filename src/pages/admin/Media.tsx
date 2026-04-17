import { useState, useEffect, useRef } from 'react';
import { Upload, Trash2, Copy, Image, FileText, Film, Loader2, Search, Grid, List } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
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

interface MediaItem {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number | null;
  created_at: string;
}

const Media = () => {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchMedia();
  }, []);

  const fetchMedia = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('media_library')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: 'Error fetching media', description: error.message, variant: 'destructive' });
    } else {
      setMedia(data || []);
    }
    setIsLoading(false);
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);

    for (const file of Array.from(files)) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `uploads/${fileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, file);

      if (uploadError) {
        toast({ title: 'Upload failed', description: uploadError.message, variant: 'destructive' });
        continue;
      }

      // Get public URL
      const { data: urlData } = supabase.storage.from('media').getPublicUrl(filePath);

      // Save to media_library table
      const { error: dbError } = await supabase.from('media_library').insert({
        name: file.name,
        url: urlData.publicUrl,
        type: file.type.split('/')[0] || 'file',
        size: file.size,
      });

      if (dbError) {
        toast({ title: 'Error saving media', description: dbError.message, variant: 'destructive' });
      }
    }

    toast({ title: 'Upload complete', description: `${files.length} file(s) uploaded successfully` });
    fetchMedia();
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDelete = async (id: string) => {
    const item = media.find(m => m.id === id);
    if (!item) return;

    // Extract file path from URL
    const urlParts = item.url.split('/media/');
    const filePath = urlParts[urlParts.length - 1];

    // Delete from storage
    await supabase.storage.from('media').remove([filePath]);

    // Delete from database
    const { error } = await supabase.from('media_library').delete().eq('id', id);

    if (error) {
      toast({ title: 'Error deleting', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Deleted', description: 'Media file removed successfully' });
      setMedia(media.filter(m => m.id !== id));
    }
    setDeleteId(null);
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({ title: 'Copied!', description: 'URL copied to clipboard' });
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getIcon = (type: string) => {
    if (type === 'image') return Image;
    if (type === 'video') return Film;
    return FileText;
  };

  const filteredMedia = media.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Media Library</h1>
          <p className="text-muted-foreground">Upload and manage images and files</p>
        </div>
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*,.pdf,.doc,.docx"
            onChange={handleUpload}
            className="hidden"
          />
          <Button onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
            {isUploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
            {isUploading ? 'Uploading...' : 'Upload Files'}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Media Grid/List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredMedia.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Image className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {searchQuery ? 'No files match your search' : 'No files uploaded yet'}
            </p>
            {!searchQuery && (
              <Button className="mt-4" onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4 mr-2" /> Upload your first file
              </Button>
            )}
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredMedia.map((item) => {
            const IconComponent = getIcon(item.type);
            return (
              <Card key={item.id} className="group overflow-hidden">
                <div className="aspect-square relative bg-muted flex items-center justify-center">
                  {item.type === 'image' ? (
                    <img
                      src={item.url}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
            decoding="async"/>
                  ) : (
                    <IconComponent className="h-12 w-12 text-muted-foreground" />
                  )}
                  <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button size="icon" variant="secondary" onClick={() => copyToClipboard(item.url)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="destructive" onClick={() => setDeleteId(item.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardContent className="p-3">
                  <p className="text-sm font-medium truncate" title={item.name}>{item.name}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(item.size)}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">File</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground hidden sm:table-cell">Type</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground hidden sm:table-cell">Size</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground hidden md:table-cell">Uploaded</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMedia.map((item) => {
                  const IconComponent = getIcon(item.type);
                  return (
                    <tr key={item.id} className="border-b border-border/50 hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded bg-muted flex items-center justify-center overflow-hidden">
                            {item.type === 'image' ? (
                              <img src={item.url} alt="" className="w-full h-full object-cover"
            loading="lazy"
            decoding="async"/>
                            ) : (
                              <IconComponent className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                          <span className="font-medium truncate max-w-[200px]">{item.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground capitalize hidden sm:table-cell">{item.type}</td>
                      <td className="py-3 px-4 text-muted-foreground hidden sm:table-cell">{formatFileSize(item.size)}</td>
                      <td className="py-3 px-4 text-muted-foreground hidden md:table-cell">
                        {new Date(item.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex justify-end gap-2">
                          <Button size="icon" variant="ghost" onClick={() => copyToClipboard(item.url)}>
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => setDeleteId(item.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this file?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The file will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && handleDelete(deleteId)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Media;
