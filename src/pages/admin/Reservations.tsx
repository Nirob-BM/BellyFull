import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarDays, Check, X, Clock, Phone, Mail, Users, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import ConfirmDialog from '@/components/admin/ConfirmDialog';

interface Reservation {
  id: string;
  name: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  guests: number;
  special_requests: string | null;
  status: string;
  created_at: string;
}

const PAGE_SIZE = 25;

const Reservations = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [busy, setBusy] = useState<Set<string>>(new Set());
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const busyIds = useRef(new Set<string>());
  const nextOffset = useRef(0);
  const fetching = useRef(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async (append = false) => {
    if (fetching.current) return;
    fetching.current = true;
    if (append) setIsLoadingMore(true);
    const offset = append ? nextOffset.current : 0;
    // Newest dates first so upcoming bookings are always on the first page.
    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .order('date', { ascending: false })
      .order('time', { ascending: true })
      .order('id', { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) {
      toast({ title: 'Error', description: 'Failed to fetch reservations', variant: 'destructive' });
    } else {
      const page = data || [];
      setReservations((cur) => (append ? [...cur, ...page.filter((r) => !cur.some((c) => c.id === r.id))] : page));
      nextOffset.current = offset + page.length;
      setHasMore(page.length === PAGE_SIZE);
    }
    fetching.current = false;
    setIsLoading(false);
    setIsLoadingMore(false);
  };

  const sendNotification = async (reservation: Reservation, status: string) => {
    const { error } = await supabase.functions.invoke('send-notification', {
      body: {
        type: 'reservation',
        action: status,
        recipientEmail: reservation.email,
        recipientName: reservation.name,
        details: {
          reservationId: reservation.id,
          date: reservation.date,
          time: reservation.time,
          guests: reservation.guests,
        },
      },
    });
    if (error) throw error;
  };

  const setBusyFor = (id: string, on: boolean) => {
    if (on) busyIds.current.add(id);
    else busyIds.current.delete(id);
    setBusy(new Set(busyIds.current));
  };

  const updateStatus = async (id: string, status: string) => {
    if (busyIds.current.has(id)) return;
    const reservation = reservations.find((r) => r.id === id);
    if (!reservation) return;
    setBusyFor(id, true);
    try {
      const { error } = await supabase.from('reservations').update({ status }).eq('id', id);
      if (error) {
        toast({ title: 'Error', description: 'Failed to update reservation', variant: 'destructive' });
        return;
      }
      setReservations((cur) => cur.map((r) => (r.id === id ? { ...r, status } : r)));
      setCancelId((cur) => (cur === id ? null : cur));
      toast({ title: 'Success', description: `Reservation ${status}` });

      if (status === 'confirmed' || status === 'cancelled') {
        try {
          await sendNotification(reservation, status);
        } catch {
          toast({
            title: 'Email not sent',
            description: 'Status saved, but the guest email failed.',
            variant: 'destructive',
          });
        }
      }
    } finally {
      setBusyFor(id, false);
    }
  };

  const deleteReservation = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    const { error } = await supabase.from('reservations').delete().eq('id', deleteId);
    setIsDeleting(false);
    if (error) {
      toast({ title: 'Error', description: 'Failed to delete reservation', variant: 'destructive' });
      return;
    }
    setReservations((cur) => cur.filter((r) => r.id !== deleteId));
    nextOffset.current = Math.max(0, nextOffset.current - 1);
    setDeleteId(null);
    toast({ title: 'Success', description: 'Reservation deleted' });
  };

  const q = searchQuery.toLowerCase();
  const filteredReservations = reservations.filter((res) => {
    const matchesSearch =
      res.name.toLowerCase().includes(q) || res.email.toLowerCase().includes(q) || res.phone.includes(searchQuery);
    const matchesStatus = statusFilter === 'all' || res.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-success/15 text-success border-success/30';
      case 'cancelled': return 'bg-destructive/15 text-destructive border-destructive/30';
      default: return 'bg-warning/15 text-warning border-warning/30';
    }
  };

  return (
    <div className="min-w-0 space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-foreground">Reservations</h1>
        <p className="text-muted-foreground">Manage table reservations</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {['all', 'pending', 'confirmed', 'cancelled'].map((status) => (
            <Button
              key={status}
              className="h-10"
              variant={statusFilter === status ? 'default' : 'outline'}
              onClick={() => setStatusFilter(status)}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">Loading...</div>
      ) : filteredReservations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">No reservations found</CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredReservations.map((res, index) => {
            const isBusy = busy.has(res.id);
            return (
              <motion.div
                key={res.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index, 10) * 0.05 }}
              >
                <Card>
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg text-foreground break-words">{res.name}</h3>
                          <Badge variant="outline" className={getStatusColor(res.status)}>{res.status}</Badge>
                        </div>

                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <CalendarDays className="h-4 w-4" />
                            {new Date(res.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            {res.time}
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Users className="h-4 w-4" />
                            {res.guests} guests
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Phone className="h-4 w-4" />
                            {res.phone}
                          </div>
                        </div>

                        <div className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground mt-2">
                          <Mail className="h-4 w-4 shrink-0" />
                          <span className="break-all">{res.email}</span>
                        </div>

                        {res.special_requests && (
                          <p className="text-sm text-muted-foreground mt-2 italic break-words">"{res.special_requests}"</p>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {res.status === 'pending' && (
                          <>
                            <Button
                              disabled={isBusy}
                              className="h-10 bg-success text-success-foreground hover:bg-success/90"
                              onClick={() => updateStatus(res.id, 'confirmed')}
                            >
                              <Check className="h-4 w-4 mr-1" /> Confirm
                            </Button>
                            <Button
                              disabled={isBusy}
                              variant="outline"
                              className="h-10 text-destructive border-destructive/30 hover:bg-destructive/10"
                              onClick={() => setCancelId(res.id)}
                            >
                              <X className="h-4 w-4 mr-1" /> Cancel
                            </Button>
                          </>
                        )}
                        {res.status !== 'pending' && (
                          <Button disabled={isBusy} className="h-10" variant="outline" onClick={() => updateStatus(res.id, 'pending')}>
                            Reset to Pending
                          </Button>
                        )}
                        <Button disabled={isBusy} variant="ghost" className="h-10 text-destructive" onClick={() => setDeleteId(res.id)}>
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {!isLoading && hasMore && (
        <div className="flex justify-center">
          <Button variant="outline" className="h-10" disabled={isLoadingMore} onClick={() => fetchReservations(true)}>
            {isLoadingMore ? 'Loading…' : 'Load more'}
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={cancelId !== null}
        onOpenChange={(o) => !o && setCancelId(null)}
        title="Cancel this reservation?"
        description="The guest will be emailed that their booking is cancelled."
        confirmLabel="Cancel reservation"
        cancelLabel="Keep it"
        loading={cancelId !== null && busy.has(cancelId)}
        onConfirm={() => cancelId ? updateStatus(cancelId, 'cancelled') : undefined}
      />
      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Delete this reservation?"
        description="This action cannot be undone."
        loading={isDeleting}
        onConfirm={deleteReservation}
      />
    </div>
  );
};

export default Reservations;
