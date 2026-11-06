import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, Globe, FileCode, ExternalLink } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from "recharts";

type Sale = {
  id: string;
  created_at: string;
  order_status: string;
  total_amount: number;
  product_details: unknown;
};
type Booking = {
  id: string;
  name: string;
  date: string;
  time: string;
  guests: number;
  status: string;
  created_at: string;
};
const statuses = [
  "pending",
  "approved",
  "preparing",
  "out_for_delivery",
  "ready_for_pickup",
  "delivered",
  "rejected",
];
const colors = [1, 2, 3, 4, 5].map((n) => `hsl(var(--chart-${n}))`);
const statusColors: Record<string, string> = {
  pending: "hsl(var(--warning))",
  approved: "hsl(var(--info))",
  preparing: "hsl(var(--chart-2))",
  out_for_delivery: "hsl(var(--chart-4))",
  ready_for_pickup: "hsl(var(--chart-5))",
  delivered: "hsl(var(--success))",
  rejected: "hsl(var(--destructive))",
};
const dayKey = (value: Date | string) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
const money = (n: number) => `৳${n.toLocaleString("en-BD", { maximumFractionDigits: 2 })}`;
const tooltipStyle = {
  backgroundColor: "hsl(var(--card))",
  borderColor: "hsl(var(--border))",
  color: "hsl(var(--foreground))",
};

const Dashboard = () => {
  const [data, setData] = useState<{
    orders: Sale[];
    bookings: Booking[];
    menu: number;
    messages: number;
    events: number;
    posts: number;
    categories: { name: string; count: number }[];
  } | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let alive = true;
    let running = false;
    let queued = false;
    const load = async () => {
      if (running) {
        queued = true;
        return;
      }
      running = true;
      try {
        // Explicit pagination avoids Supabase's default 1,000-row truncation.
        const orders: Sale[] = [];
        const bookings: Booking[] = [];
        for (let start = 0; ; start += 1000) {
          const result = await supabase
            .from("orders")
            .select("id,created_at,order_status,total_amount,product_details")
            .order("id")
            .range(start, start + 999);
          if (result.error) throw result.error;
          orders.push(...result.data);
          if (result.data.length < 1000) break;
        }
        for (let start = 0; ; start += 1000) {
          const result = await supabase
            .from("reservations")
            .select("id,name,date,time,guests,status,created_at")
            .order("id")
            .range(start, start + 999);
          if (result.error) throw result.error;
          bookings.push(...result.data);
          if (result.data.length < 1000) break;
        }
        const results = await Promise.all([
          supabase.from("menu_items").select("id", { count: "exact", head: true }).eq("is_active", true),
          supabase
            .from("contact_submissions")
            .select("id", { count: "exact", head: true })
            .eq("is_read", false),
          supabase.from("events").select("id", { count: "exact", head: true }).eq("is_active", true),
          supabase.from("blog_posts").select("id", { count: "exact", head: true }).eq("is_published", true),
        ]);
        for (const result of results) if (result.error) throw result.error;
        const categoryCounts = new Map<string, number>();
        for (let start = 0; ; start += 1000) {
          const result = await supabase
            .from("menu_items")
            .select("id,category")
            .eq("is_active", true)
            .order("id")
            .range(start, start + 999);
          if (result.error) throw result.error;
          result.data.forEach((item) =>
            categoryCounts.set(item.category, (categoryCounts.get(item.category) || 0) + 1),
          );
          if (result.data.length < 1000) break;
        }
        if (alive) {
          setData({
            orders,
            bookings,
            menu: results[0].count || 0,
            messages: results[1].count || 0,
            events: results[2].count || 0,
            posts: results[3].count || 0,
            categories: [...categoryCounts].map(([name, count]) => ({ name, count })),
          });
          setError(false);
        }
      } catch {
        if (alive) setError(true);
      } finally {
        running = false;
        if (alive) setLoading(false);
        if (queued && alive) {
          queued = false;
          void load();
        }
      }
    };
    void load();
    const timer = window.setInterval(() => void load(), 60000);
    const channel = supabase
      .channel("dashboard-refresh")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => void load())
      .on("postgres_changes", { event: "*", schema: "public", table: "reservations" }, () => void load())
      .subscribe();
    return () => {
      alive = false;
      window.clearInterval(timer);
      void supabase.removeChannel(channel);
    };
  }, [retry]);

  if (error)
    return (
      <Card role="alert">
        <CardHeader>
          <CardTitle>Unable to load dashboard</CardTitle>
          <CardDescription>Numbers could not be refreshed. Please try again.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => {
              setError(false);
              setLoading(true);
              setRetry((n) => n + 1);
            }}
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  if (loading || !data)
    return (
      <p role="status" className="text-muted-foreground">
        Loading dashboard…
      </p>
    );
  const today = dayKey(new Date());
  const calendar = (offset: number) => {
    const date = new Date(`${today}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() - offset);
    return date.toISOString().slice(0, 10);
  };
  const days = Array.from({ length: 7 }, (_, i) => calendar(6 - i));
  const eligible = data.orders.filter((o) => o.order_status !== "rejected" && dayKey(o.created_at) <= today);
  const revenue = (length: number) =>
    eligible
      .filter((o) => dayKey(o.created_at) >= calendar(length - 1))
      .reduce((sum, o) => sum + Number(o.total_amount), 0);
  const daily = days.map((day) => ({
    day: day.slice(5),
    sales: eligible
      .filter((o) => dayKey(o.created_at) === day)
      .reduce((sum, o) => sum + Number(o.total_amount), 0),
    reservations: data.bookings.filter((b) => b.date === day).length,
  }));
  const statusData = statuses.map((status) => ({
    name: status.replace(/_/g, " "),
    value: data.orders.filter((o) => o.order_status === status).length,
  }));
  const dishes = new Map<string, { name: string; quantity: number }>();
  eligible.forEach((order) => {
    if (!Array.isArray(order.product_details)) return;
    order.product_details.forEach((item) => {
      if (!item || typeof item !== "object" || typeof item.name !== "string") return;
      const quantity = Number(item.quantity);
      if (!Number.isFinite(quantity) || quantity <= 0) return;
      const key = String(item.id || item.name);
      const previous = dishes.get(key);
      dishes.set(key, { name: item.name, quantity: (previous?.quantity || 0) + quantity });
    });
  });
  const best = [...dishes.values()].sort((a, b) => b.quantity - a.quantity).slice(0, 5);
  const stats = [
    ["Total Orders", data.orders.length],
    ["Pending Orders", data.orders.filter((o) => o.order_status === "pending").length],
    ["Total Reservations", data.bookings.length],
    ["Active Menu Items", data.menu],
    ["Unread Messages", data.messages],
    ["Published Posts", data.posts],
    ["Active Events", data.events],
  ];
  return (
    <div className="space-y-6 min-w-0">
      <div className="flex flex-wrap justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Restaurant overview · Asia/Dhaka · refreshes every 60 seconds
          </p>
        </div>
        <Button variant="outline" onClick={() => setRetry((n) => n + 1)}>
          Refresh
        </Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map(([title, value]) => (
          <Card key={title}>
            <CardContent className="p-4">
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-sm text-muted-foreground">{title}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid sm:grid-cols-3 gap-3">
        {[1, 7, 30].map((n) => (
          <Card key={n}>
            <CardHeader>
              <CardTitle className="text-base">Revenue {n === 1 ? "today" : `last ${n} days`}</CardTitle>
              <CardDescription>Excluding rejected; includes pending</CardDescription>
            </CardHeader>
            <CardContent className="text-2xl font-bold">{money(revenue(n))}</CardContent>
          </Card>
        ))}
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        {(["sales", "reservations"] as const).map((metric) => (
          <Card key={metric} className="min-w-0">
            <CardHeader>
              <CardTitle className="text-lg">
                {metric === "sales" ? "Daily sales" : "Reservations"} · last 7 days
              </CardTitle>
              <CardDescription>
                {metric === "sales"
                  ? "Excluding rejected; includes pending"
                  : "Booking dates, today and previous six days only"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-48 sm:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={daily} margin={{ left: 0, right: 8 }}>
                    <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
                    <XAxis dataKey="day" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                    <YAxis
                      width={48}
                      allowDecimals={metric === "sales"}
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                    />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey={metric} fill={colors[metric === "sales" ? 0 : 1]} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        ))}
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle className="text-lg">Order status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-44 sm:h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} dataKey="value" innerRadius="50%" outerRadius="85%" label={false}>
                    {statusData.map((s, i) => (
                      <Cell key={s.name} fill={statusColors[statuses[i]] || colors[i % colors.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="grid grid-cols-2 gap-2 text-sm">
              {statusData.map((s, i) => (
                <li key={s.name} className="flex items-center gap-2 capitalize">
                  <span
                    className="w-3 h-3 shrink-0 rounded-full"
                    style={{ background: statusColors[statuses[i]] || colors[i % colors.length] }}
                  />
                  {s.name}: {s.value}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Best-selling dishes</CardTitle>
            <CardDescription>
              Top 5 by quantity · all time · excluding rejected; includes pending
            </CardDescription>
          </CardHeader>
          <CardContent>
            {best.length ? (
              <ol className="space-y-3">
                {best.map((dish, i) => (
                  <li key={i} className="flex justify-between gap-3">
                    <span>
                      {i + 1}. {dish.name}
                    </span>
                    <strong>{dish.quantity}</strong>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-muted-foreground">No sales yet.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Menu by category</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {data.categories.map((c) => (
                <li key={c.name} className="flex justify-between">
                  <span>{c.name}</span>
                  <strong>{c.count}</strong>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent reservations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[...data.bookings]
              .sort((a, b) => b.created_at.localeCompare(a.created_at))
              .slice(0, 5)
              .map((b) => (
                <div key={b.id} className="flex flex-wrap justify-between gap-2 border-b pb-2">
                  <span>
                    {b.name} · {b.guests} guests
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {b.date} {b.time} · {b.status}
                  </span>
                </div>
              ))}
            <Button asChild variant="outline">
              <Link to="/69/reservations">Manage reservations</Link>
            </Button>
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
              <Link to="/69/seo">
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
