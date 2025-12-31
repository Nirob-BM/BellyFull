import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarDays, MessageSquare, UtensilsCrossed, TrendingUp, Users, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

interface Stats {
  totalReservations: number;
  pendingReservations: number;
  totalMenuItems: number;
  unreadMessages: number;
}

const Dashboard = () => {
  const [stats, setStats] = useState<Stats>({
    totalReservations: 0,
    pendingReservations: 0,
    totalMenuItems: 0,
    unreadMessages: 0,
  });
  const [recentReservations, setRecentReservations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchRecentReservations();
  }, []);

  const fetchStats = async () => {
    try {
      const [reservationsRes, menuRes, contactsRes] = await Promise.all([
        supabase.from('reservations').select('status', { count: 'exact' }),
        supabase.from('menu_items').select('id', { count: 'exact' }).eq('is_active', true),
        supabase.from('contact_submissions').select('id', { count: 'exact' }).eq('is_read', false),
      ]);

      const pendingCount = reservationsRes.data?.filter(r => r.status === 'pending').length || 0;

      setStats({
        totalReservations: reservationsRes.count || 0,
        pendingReservations: pendingCount,
        totalMenuItems: menuRes.count || 0,
        unreadMessages: contactsRes.count || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRecentReservations = async () => {
    const { data } = await supabase
      .from('reservations')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    setRecentReservations(data || []);
  };

  const statCards = [
    { title: 'Total Reservations', value: stats.totalReservations, icon: CalendarDays, color: 'text-blue-500' },
    { title: 'Pending Reservations', value: stats.pendingReservations, icon: Clock, color: 'text-orange-500' },
    { title: 'Active Menu Items', value: stats.totalMenuItems, icon: UtensilsCrossed, color: 'text-green-500' },
    { title: 'Unread Messages', value: stats.unreadMessages, icon: MessageSquare, color: 'text-purple-500' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's your restaurant overview.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-3xl font-bold text-foreground mt-1">
                      {isLoading ? '...' : stat.value}
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg bg-muted ${stat.color}`}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Recent Reservations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Recent Reservations
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentReservations.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No reservations yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Name</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Date</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Time</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Guests</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentReservations.map((reservation) => (
                    <tr key={reservation.id} className="border-b border-border/50">
                      <td className="py-3 px-4 font-medium">{reservation.name}</td>
                      <td className="py-3 px-4">{new Date(reservation.date).toLocaleDateString()}</td>
                      <td className="py-3 px-4">{reservation.time}</td>
                      <td className="py-3 px-4">{reservation.guests}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                          reservation.status === 'confirmed' 
                            ? 'bg-green-100 text-green-700'
                            : reservation.status === 'cancelled'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {reservation.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
