import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, Calendar, Check, Trash2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import ConfirmDialog from '@/components/admin/ConfirmDialog';

interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  is_read: boolean | null;
  created_at: string;
}

const PAGE_SIZE = 25;

const Contacts = () => {
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterUnread, setFilterUnread] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const nextOffset = useRef(0);
  const fetching = useRef(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async (append = false) => {
    if (fetching.current) return;
    fetching.current = true;
    if (append) setIsLoadingMore(true);
    const offset = append ? nextOffset.current : 0;
    const { data, error } = await supabase
      .from('contact_submissions')
      .select('*')
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) {
      toast({ title: 'Error', description: 'Failed to fetch submissions', variant: 'destructive' });
    } else {
      const page = data || [];
      setSubmissions((cur) => (append ? [...cur, ...page.filter((r) => !cur.some((c) => c.id === r.id))] : page));
      nextOffset.current = offset + page.length;
      setHasMore(page.length === PAGE_SIZE);
    }
    fetching.current = false;
    setIsLoading(false);
    setIsLoadingMore(false);
  };

  const markAsRead = async (id: string) => {
    const { error } = await supabase.from('contact_submissions').update({ is_read: true }).eq('id', id);
    if (error) {
      toast({ title: 'Error', description: 'Failed to update', variant: 'destructive' });
    } else {
      setSubmissions((cur) => cur.map((r) => (r.id === id ? { ...r, is_read: true } : r)));
    }
  };

  const deleteSubmission = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    const { error } = await supabase.from('contact_submissions').delete().eq('id', deleteId);
    setIsDeleting(false);
    if (error) {
      toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' });
      return;
    }
    setSubmissions((cur) => cur.filter((r) => r.id !== deleteId));
    nextOffset.current = Math.max(0, nextOffset.current - 1);
    setDeleteId(null);
    toast({ title: 'Success', description: 'Message deleted' });
  };

  const q = searchQuery.toLowerCase();
  const filteredSubmissions = submissions.filter((sub) => {
    const matchesSearch =
      sub.name.toLowerCase().includes(q) ||
      sub.email.toLowerCase().includes(q) ||
      sub.message.toLowerCase().includes(q);
    const matchesFilter = !filterUnread || !sub.is_read;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-w-0 space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-foreground">Contact Submissions</h1>
        <p className="text-muted-foreground">View and manage customer inquiries</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 pl-9"
          />
        </div>
        <Button className="h-10" variant={filterUnread ? 'default' : 'outline'} onClick={() => setFilterUnread(!filterUnread)}>
          {filterUnread ? 'Showing Unread' : 'Show Unread Only'}
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12">Loading...</div>
      ) : filteredSubmissions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">No messages found</CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredSubmissions.map((sub, index) => (
            <motion.div
              key={sub.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(index, 10) * 0.05 }}
            >
              <Card className={!sub.is_read ? 'border-secondary bg-secondary/5' : ''}>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg text-foreground break-words">{sub.name}</h3>
                        {!sub.is_read && <Badge className="bg-secondary text-secondary-foreground">New</Badge>}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground mb-3">
                        <div className="flex min-w-0 items-center gap-1">
                          <Mail className="h-4 w-4 shrink-0" />
                          <a href={`mailto:${sub.email}`} className="break-all hover:text-primary">{sub.email}</a>
                        </div>
                        {sub.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-4 w-4" />
                            <a href={`tel:${sub.phone}`} className="hover:text-primary">{sub.phone}</a>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(sub.created_at).toLocaleDateString('en-US', {
                            month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
                          })}
                        </div>
                      </div>

                      <p className="text-foreground whitespace-pre-wrap break-words">{sub.message}</p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {!sub.is_read && (
                        <Button className="h-10" variant="outline" onClick={() => markAsRead(sub.id)}>
                          <Check className="h-4 w-4 mr-1" /> Mark Read
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        className="h-10 w-10 p-0 text-destructive"
                        aria-label="Delete message"
                        onClick={() => setDeleteId(sub.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {!isLoading && hasMore && (
        <div className="flex justify-center">
          <Button variant="outline" className="h-10" disabled={isLoadingMore} onClick={() => fetchSubmissions(true)}>
            {isLoadingMore ? 'Loading…' : 'Load more'}
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Delete this message?"
        description="This action cannot be undone."
        loading={isDeleting}
        onConfirm={deleteSubmission}
      />
    </div>
  );
};

export default Contacts;
