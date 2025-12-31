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

const Events = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [formData, setFormData] = useState({ title: '', description: '', event_date: '', event_time: '', image_url: '', is_active: true });
  const { toast } = useToast();

  useEffect(() => { fetchEvents(); }, []);

  const fetchEvents = async () => {
    const { data } = await supabase.from('events').select('*').order('event_date', { ascending: true });
    setEvents(data || []);
    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const eventData = { ...formData, event_date: formData.event_date || null };
    
    if (editingEvent) {
      await supabase.from('events').update(eventData).eq('id', editingEvent.id);
    } else {
      await supabase.from('events').insert([eventData]);
    }
    toast({ title: 'Success', description: 'Event saved' });
    fetchEvents();
    setIsDialogOpen(false);
  };

  const deleteEvent = async (id: string) => {
    if (!confirm('Delete this event?')) return;
    await supabase.from('events').delete().eq('id', id);
    fetchEvents();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Events</h1>
          <p className="text-muted-foreground">Manage events and announcements</p>
        </div>
        <Button onClick={() => { setEditingEvent(null); setFormData({ title: '', description: '', event_date: '', event_time: '', image_url: '', is_active: true }); setIsDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" /> Add Event
        </Button>
      </div>

      {isLoading ? <div className="text-center py-12">Loading...</div> : (
        <div className="grid gap-4">
          {events.map((event) => (
            <Card key={event.id}>
              <CardContent className="p-6 flex justify-between items-center">
                <div>
                  <h3 className="font-semibold">{event.title}</h3>
                  <p className="text-sm text-muted-foreground">{event.description}</p>
                  {event.event_date && <p className="text-xs text-muted-foreground mt-1"><Calendar className="h-3 w-3 inline mr-1" />{new Date(event.event_date).toLocaleDateString()}</p>}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => { setEditingEvent(event); setFormData(event); setIsDialogOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteEvent(event.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingEvent ? 'Edit' : 'Add'} Event</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><Label>Title</Label><Input value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} required /></div>
            <div><Label>Description</Label><Textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} /></div>
            <div><Label>Date</Label><Input type="date" value={formData.event_date} onChange={(e) => setFormData({...formData, event_date: e.target.value})} /></div>
            <div className="flex items-center justify-between"><Label>Active</Label><Switch checked={formData.is_active} onCheckedChange={(c) => setFormData({...formData, is_active: c})} /></div>
            <DialogFooter><Button type="submit">Save</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Events;
