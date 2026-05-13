import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CalendarDays, MessageSquare, UtensilsCrossed, Clock, TrendingUp, Users, Eye, Package, Search, Globe, FileCode, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend } from 'recharts';

interface Stats {
  totalReservations: number;
  pendingReservations: number;
  confirmedReservations: number;
  cancelledReservations: number;
  totalMenuItems: number;
  unreadMessages: number;
  totalEvents: number;
  totalBlogPosts: number;
  totalOrders: number;
  pendingOrders: number;
}

interface Reservation {
  id: string;
  name: string;
  date: string;
  time: string;
  guests: number;
  status: string;
  created_at: string;
}

interface ReservationsByDay {
  day: string;
  count: number;
}

interface CategoryData {
  name: string;
  count: number;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

const Dashboard = () => {
  const [stats, setStats] = useState<Stats>({
    totalReservations: 0,
    pendingReservations: 0,
    confirmedReservations: 0,
    cancelledReservations: 0,
    totalMenuItems: 0,
    unreadMessages: 0,
    totalEvents: 0,
    totalBlogPosts: 0,
    totalOrders: 0,
    pendingOrders: 0,
  });
  const [recentReservations, setRecentReservations] = useState<Reservation[]>([]);
  const [reservationsByDay, setReservationsByDay] = useState<ReservationsByDay[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [statusData, setStatusData] = useState<{ name: string; value: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    await Promise.all([
      fetchStats(),
      fetchRecentReservations(),
      fetchReservationsByDay(),
      fetchCategoryData(),
    ]);
    setIsLoading(false);
  };

  const fetchStats = async () => {
    try {
      const [reservationsRes, menuRes, contactsRes, eventsRes, blogRes, ordersRes] = await Promise.all([
        supabase.from('reservations').select('status'),
        supabase.from('menu_items').select('id', { count: 'exact' }).eq('is_active', true),
        supabase.from('contact_submissions').select('id', { count: 'exact' }).eq('is_read', false),
        supabase.from('events').select('id', { count: 'exact' }).eq('is_active', true),
        supabase.from('blog_posts').select('id', { count: 'exact' }).eq('is_published', true),
        supabase.from('orders').select('order_status'),
      ]);

      const reservations = reservationsRes.data || [];
      const pendingCount = reservations.filter(r => r.status === 'pending').length;
      const confirmedCount = reservations.filter(r => r.status === 'confirmed').length;
      const cancelledCount = reservations.filter(r => r.status === 'cancelled').length;

      const orders = ordersRes.data || [];
      const pendingOrdersCount = orders.filter(o => o.order_status === 'pending').length;

      setStats({
        totalReservations: reservations.length,
        pendingReservations: pendingCount,
        confirmedReservations: confirmedCount,
        cancelledReservations: cancelledCount,
        totalMenuItems: menuRes.count || 0,
        unreadMessages: contactsRes.count || 0,
        totalEvents: eventsRes.count || 0,
        totalBlogPosts: blogRes.count || 0,
        totalOrders: orders.length,
        pendingOrders: pendingOrdersCount,
      });

      setStatusData([
        { name: 'Pending', value: pendingCount },
        { name: 'Confirmed', value: confirmedCount },
        { name: 'Cancelled', value: cancelledCount },
      ]);
    } catch (error) {
      console.error('Error fetching stats:', error);
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

  const fetchReservationsByDay = async () => {
    const { data } = await supabase
      .from('reservations')
      .select('date')
      .gte('date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

    if (data) {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const counts: Record<string, number> = {};
      
      // Initialize all days with 0
      for (let i = 6; i >= 0; i--) {
        const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        const dayName = days[date.getDay()];
        counts[dayName] = 0;
      }
      
      data.forEach(r => {
        const date = new Date(r.date);
        const dayName = days[date.getDay()];
        counts[dayName] = (counts[dayName] || 0) + 1;
      });

      setReservationsByDay(
        Object.entries(counts).map(([day, count]) => ({ day, count }))
      );
    }
  };

  const fetchCategoryData = async () => {
    const { data } = await supabase
      .from('menu_items')
      .select('category')
      .eq('is_active', true);

    if (data) {
      const counts: Record<string, number> = {};
      data.forEach(item => {
        counts[item.category] = (counts[item.category] || 0) + 1;
      });
      setCategoryData(
        Object.entries(counts).map(([name, count]) => ({ name, count }))
      );
    }
  };

  const statCards = [
    { title: 'Total Orders', value: stats.totalOrders, icon: Package, color: 'bg-emerald-500/10 text-emerald-500' },
    { title: 'Pending Orders', value: stats.pendingOrders, icon: Clock, color: 'bg-yellow-500/10 text-yellow-500' },
    { title: 'Total Reservations', value: stats.totalReservations, icon: CalendarDays, color: 'bg-blue-500/10 text-blue-500' },
    { title: 'Active Menu Items', value: stats.totalMenuItems, icon: UtensilsCrossed, color: 'bg-green-500/10 text-green-500' },
    { title: 'Unread Messages', value: stats.unreadMessages, icon: MessageSquare, color: 'bg-purple-500/10 text-purple-500' },
    { title: 'Published Posts', value: stats.totalBlogPosts, icon: Eye, color: 'bg-cyan-500/10 text-cyan-500' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's your restaurant overview.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="h-full">
              <CardContent className="p-4">
                <div className="flex flex-col gap-2">
                  <div className={`p-2 rounded-lg w-fit ${stat.color}`}>
                    <stat.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">
                      {isLoading ? '...' : stat.value}
                    </p>
                    <p className="text-xs text-muted-foreground">{stat.title}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Reservations by Day */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Reservations This Week</CardTitle>
            <CardDescription>Daily reservation trends</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reservationsByDay}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="day" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }} 
                  />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Reservation Status Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Reservation Status</CardTitle>
            <CardDescription>Distribution by status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {statusData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Menu Categories & Recent Reservations */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Menu Categories */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <UtensilsCrossed className="h-5 w-5" />
              Menu by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={80} 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} 
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }} 
                  />
                  <Bar dataKey="count" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent Reservations */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Recent Reservations
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentReservations.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No reservations yet</p>
            ) : (
              <div className="space-y-3">
                {recentReservations.map((reservation) => (
                  <div 
                    key={reservation.id} 
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{reservation.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(reservation.date).toLocaleDateString()} • {reservation.time} • {reservation.guests} guests
                        </p>
                      </div>
                    </div>
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                      reservation.status === 'confirmed' 
                        ? 'bg-green-500/10 text-green-600'
                        : reservation.status === 'cancelled'
                        ? 'bg-red-500/10 text-red-600'
                        : 'bg-yellow-500/10 text-yellow-600'
                    }`}>
                      {reservation.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* SEO & Indexing Tools */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Search className="h-5 w-5" />
            SEO & Indexing
          </CardTitle>
          <CardDescription>
            Monitor and submit your sitemap to search engines.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-3 gap-3">
            <Button asChild variant="outline" className="h-auto py-3 justify-start">
              <Link to="/admin/seo">
                <FileCode className="h-4 w-4 mr-2 shrink-0" />
                <span className="flex-1 text-left">
                  <span className="block font-medium">SEO Health Check</span>
                  <span className="block text-xs text-muted-foreground">Sitemap & robots.txt status</span>
                </span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto py-3 justify-start">
              <a
                href="https://search.google.com/search-console/sitemaps?resource_id=https%3A%2F%2Fbellyfull.lovable.app%2F"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Globe className="h-4 w-4 mr-2 shrink-0" />
                <span className="flex-1 text-left">
                  <span className="block font-medium">Google Search Console</span>
                  <span className="block text-xs text-muted-foreground">Submit sitemap</span>
                </span>
                <ExternalLink className="h-3 w-3 ml-2 shrink-0 opacity-60" />
              </a>
            </Button>
            <Button asChild variant="outline" className="h-auto py-3 justify-start">
              <a
                href="https://www.bing.com/webmasters/sitemaps?siteUrl=https://bellyfull.lovable.app"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Globe className="h-4 w-4 mr-2 shrink-0" />
                <span className="flex-1 text-left">
                  <span className="block font-medium">Bing Webmaster Tools</span>
                  <span className="block text-xs text-muted-foreground">Submit sitemap</span>
                </span>
                <ExternalLink className="h-3 w-3 ml-2 shrink-0 opacity-60" />
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
