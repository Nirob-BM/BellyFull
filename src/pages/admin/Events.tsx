import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import ConfirmDialog from '@/components/admin/ConfirmDialog';

interface EventRow {
  id: string;
  title: string;
  description: string | null;
  event_date: string | null;
  event_time: string | null;
  image_url: string | null;
  is_active: boolean | null;
}

const emptyForm = { title: '', description: '', event_date: '', event_time: '', image_url: '', is_active: true };

const Events = () => {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventRow | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [titleError, setTitleError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  useEffect(() => { fetchEvents(); }, []);

  const fetchEvents = async () => {
    const { data, error } = await supabase.from('events').select('*').order('event_date', { ascending: true });
    if (error) {
      setLoadError(true);
      toast({ title: 'Error', description: 'Failed to load events', variant: 'destructive' });
    } else {
      setLoadError(false);
      setEvents((data as EventRow[]) || []);
    }
    setIsLoading(false);
  };

  const openAddDialog = () => {
    setEditingEvent(null);
    setFormData(emptyForm);
    setTitleError('');
    setIsDialogOpen(true);
  };

  const openEditDialog = (event: EventRow) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description || '',
      event_date: event.event_date || '',
      event_time: event.event_time || '',
      image_url: event.image_url || '',
      is_active: event.is_active ?? true,
    });
    setTitleError('');
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    const title = formData.title.trim();
    if (!title) {
      setTitleError('Title is required.');
      return;
    }
    setTitleError('');
    setIsSaving(true);
    const eventData = {
      ...formData,
      title,
      description: formData.description || null,
      event_date: formData.event_date || null,
      event_time: formData.event_time || null,
      image_url: formData.image_url || null,
    };
    const { error } = editingEvent
      ? await supabase.from('events').update(eventData).eq('id', editingEvent.id)
      : await supabase.from('events').insert([eventData]);
    setIsSaving(false);
    if (error) {
      toast({ title: 'Save failed', description: error.message || 'Could not save the event.', variant: 'destructive' });
      return;
    }
    toast({ title: 'Success', description: 'Event saved' });
    setIsDialogOpen(false);
    fetchEvents();
  };

  const deleteEvent = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    const { error } = await supabase.from('events').delete().eq('id', deleteId);
    setIsDeleting(false);
    if (error) {
      toast({ title: 'Delete failed', description: error.message || 'Could not delete the event.', variant: 'destructive' });
      return;
    }
    setEvents((cur) => cur.filter((ev) => ev.id !== deleteId));
    setDeleteId(null);
    toast({ title: 'Success', description: 'Event deleted' });
  };

  return (
    <div className="min-w-0 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Events</h1>
          <p className="text-muted-foreground">Manage events and announcements</p>
        </div>
        <Button className="h-10 self-start sm:self-auto" onClick={openAddDialog}>
          <Plus className="h-4 w-4 mr-2" /> Add Event
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12">Loading...</div>
      ) : loadError ? (
        <Card>
          <CardContent className="space-y-4 py-12 text-center">
            <p className="text-destructive">Couldn't load events.</p>
            <Button variant="outline" className="h-10" onClick={fetchEvents}>Try again</Button>
          </CardContent>
        </Card>
      ) : events.length === 0 ? (
        <Card>
          <CardContent className="space-y-4 py-12 text-center">
            <Calendar className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">No events yet</p>
            <Button className="h-10" onClick={openAddDialog}>
              <Plus className="h-4 w-4 mr-2" /> Add your first event
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {events.map((event) => (
            <Card key={event.id}>
              <CardContent className="flex min-w-0 flex-col items-start gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold break-words">{event.title}</h3>
                  {event.description && <p className="text-sm text-muted-foreground break-words">{event.description}</p>}
                  {event.event_date && (
                    <p className="text-xs text-muted-foreground mt-1">
                      <Calendar className="h-3 w-3 inline mr-1" />
                      {new Date(event.event_date).toLocaleDateString()}
                    </p>
                  )}
                  {!event.is_active && <p className="mt-1 text-xs text-muted-foreground">Hidden</p>}
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button variant="outline" className="h-10 w-10 p-0" aria-label={`Edit ${event.title}`} onClick={() => openEditDialog(event)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" className="h-10 w-10 p-0 text-destructive" aria-label={`Delete ${event.title}`} onClick={() => setDeleteId(event.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={(o) => !isSaving && setIsDialogOpen(o)}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-lg">
          <DialogHeader><DialogTitle>{editingEvent ? 'Edit' : 'Add'} Event</DialogTitle></DialogHeader>
          <form noValidate onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="event-title">Title *</Label>
              <Input
                id="event-title"
                value={formData.title}
                onChange={(e) => { setFormData({ ...formData, title: e.target.value }); setTitleError(''); }}
                aria-invalid={Boolean(titleError)}
                aria-describedby={titleError ? 'event-title-error' : undefined}
              />
              {titleError && <p id="event-title-error" role="alert" className="text-sm text-destructive">{titleError}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-desc">Description</Label>
              <Textarea id="event-desc" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-date">Date</Label>
              <Input id="event-date" type="date" value={formData.event_date} onChange={(e) => setFormData({ ...formData, event_date: e.target.value })} />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="event-active">Active</Label>
              <Switch id="event-active" checked={formData.is_active} onCheckedChange={(c) => setFormData({ ...formData, is_active: c })} />
            </div>
            <DialogFooter>
              <Button type="submit" className="h-10" disabled={isSaving}>{isSaving ? 'Saving…' : 'Save'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Delete this event?"
        description="This action cannot be undone."
        loading={isDeleting}
        onConfirm={deleteEvent}
      />
    </div>
  );
};

export default Events;
