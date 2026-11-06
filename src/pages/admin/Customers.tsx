import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

type Order = {
  id: string;
  user_name: string;
  user_phone: string;
  user_email: string | null;
  created_at: string;
  order_status: string;
  total_amount: number;
  product_details: unknown;
};
type Customer = {
  key: string;
  name: string;
  phone: string;
  email: string;
  orders: Order[];
  spent: number;
  last: string;
};
const money = (n: number) => `৳${n.toLocaleString("en-BD")}`;
const date = (s: string) => new Date(s).toLocaleString("en-BD", { timeZone: "Asia/Dhaka" });
const phoneKey = (phone: string) => {
  let value = phone.replace(/\D/g, "");
  if (value.startsWith("00880")) value = value.slice(2);
  if (value.startsWith("880") && value.length === 13) value = "0" + value.slice(3);
  return value;
};
const Customers = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Customer | null>(null);
  useEffect(() => {
    let alive = true;
    const load = async () => {
      setLoading(true);
      setError(false);
      try {
        const all: Order[] = [];
        for (let start = 0; ; start += 1000) {
          const result = await supabase
            .from("orders")
            .select("id,user_name,user_phone,user_email,created_at,order_status,total_amount,product_details")
            .order("created_at", { ascending: false })
            .order("id")
            .range(start, start + 999);
          if (result.error) throw result.error;
          all.push(...result.data);
          if (result.data.length < 1000) break;
        }
        if (alive) setOrders(all);
      } catch {
        if (alive) setError(true);
      } finally {
        if (alive) setLoading(false);
      }
    };
    void load();
    return () => {
      alive = false;
    };
  }, [retry]);
  const customers = useMemo(() => {
    const grouped = new Map<string, Customer>();
    orders.forEach((order) => {
      const key = phoneKey(order.user_phone || "") || `missing:${order.id}`;
      let customer = grouped.get(key);
      if (!customer) {
        customer = {
          key,
          name: order.user_name,
          phone: order.user_phone || "",
          email: order.user_email || "",
          orders: [],
          spent: 0,
          last: order.created_at,
        };
        grouped.set(key, customer);
      }
      if (!customer.email && order.user_email) customer.email = order.user_email;
      customer.orders.push(order);
      if (order.order_status !== "rejected") customer.spent += Number(order.total_amount);
    });
    return [...grouped.values()];
  }, [orders]);
  const filtered = customers.filter((c) =>
    `${c.name} ${c.phone} ${c.email}`.toLowerCase().includes(search.toLowerCase()),
  );
  const exportCSV = () => {
    const cell = (v: unknown) => {
      let s = String(v ?? "");
      if (/^[\s]*[=+@-]/.test(s)) s = "'" + s;
      return '"' + s.replace(/"/g, '""') + '"';
    };
    const rows = [
      [
        "Name",
        "Phone",
        "Email",
        "Order count",
        "Total spent (excluding rejected; includes pending)",
        "Last order (Asia/Dhaka)",
      ],
      ...filtered.map((c) => [c.name, c.phone, c.email, c.orders.length, c.spent, date(c.last)]),
    ];
    const blob = new Blob(["\uFEFF" + rows.map((row) => row.map(cell).join(",")).join("\r\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "customers.csv";
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  if (error)
    return (
      <Card role="alert">
        <CardContent className="p-6 space-y-3">
          <p>Unable to load customers.</p>
          <Button onClick={() => setRetry((n) => n + 1)}>Retry</Button>
        </CardContent>
      </Card>
    );
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Customers</h1>
          <p className="text-muted-foreground">
            Grouped by phone · spending excludes rejected and includes pending orders
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" disabled={loading} onClick={() => setRetry((n) => n + 1)}>
            Refresh
          </Button>
          <Button disabled={loading || !filtered.length} onClick={exportCSV}>
            Export CSV
          </Button>
        </div>
      </div>
      <Input
        aria-label="Search customers"
        placeholder="Search name, phone or email…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      {loading ? (
        <p role="status">Loading customers…</p>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">{filtered.length} customers · dates in Asia/Dhaka</p>
          {!filtered.length && <p>No customers found.</p>}
          <div className="md:hidden space-y-3">
            {filtered.map((c) => (
              <Card key={c.key}>
                <CardContent className="p-4 space-y-2 break-words">
                  <h2 className="font-semibold">{c.name}</h2>
                  <p>
                    {c.phone || "No phone"} · {c.email || "No email"}
                  </p>
                  <p>
                    {c.orders.length} orders · {money(c.spent)}
                  </p>
                  <p className="text-sm text-muted-foreground">Last order: {date(c.last)}</p>
                  <Button variant="outline" onClick={() => setSelected(c)}>
                    Past orders
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b">
                  {["Name", "Phone", "Email", "Orders", "Total spent", "Last order", "History"].map((h) => (
                    <th key={h} className="p-3">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.key} className="border-b">
                    <td className="p-3">{c.name}</td>
                    <td className="p-3">{c.phone || "—"}</td>
                    <td className="p-3 break-all">{c.email || "—"}</td>
                    <td className="p-3">{c.orders.length}</td>
                    <td className="p-3">{money(c.spent)}</td>
                    <td className="p-3">{date(c.last)}</td>
                    <td className="p-3">
                      <Button variant="outline" onClick={() => setSelected(c)}>
                        Past orders
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      <Dialog
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <DialogContent className="max-h-[85dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selected?.name} · past orders</DialogTitle>
            <DialogDescription>
              {selected?.phone} · {selected?.email || "No email"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {selected?.orders.map((o) => (
              <article key={o.id} className="rounded-lg border p-3 space-y-1">
                <p className="text-xs break-all text-muted-foreground">{o.id}</p>
                <p>{date(o.created_at)}</p>
                <p className="capitalize">
                  {o.order_status.replace(/_/g, " ")} · {money(Number(o.total_amount))}
                </p>
                {Array.isArray(o.product_details) && (
                  <ul className="text-sm text-muted-foreground">
                    {o.product_details.map((item, i) =>
                      item && typeof item === "object" && "name" in item ? (
                        <li key={i}>
                          {String(item.name)} × {String(item.quantity ?? "")}
                        </li>
                      ) : null,
                    )}
                  </ul>
                )}
              </article>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
export default Customers;
