import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Package, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Copy, 
  Phone, 
  Mail,
  Eye,
  Search,
  RefreshCw,
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  id: string;
  user_name: string;
  user_phone: string;
  user_email: string | null;
  product_details: OrderItem[];
  total_amount: number;
  payment_method: string;
  transaction_id: string;
  sender_phone: string | null;
  order_status: 'pending' | 'approved' | 'rejected';
  rejection_reason: string | null;
  created_at: string;
}

const Orders = () => {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchOrders = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: "Error", description: "Failed to fetch orders", variant: "destructive" });
    } else {
      // Cast the data to our Order type
      const typedOrders = (data || []).map(order => ({
        ...order,
        product_details: order.product_details as unknown as OrderItem[]
      })) as Order[];
      setOrders(typedOrders);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchOrders();

    // Real-time subscription
    const channel = supabase
      .channel('orders-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          console.log('Order change:', payload);
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const sendNotification = async (order: Order, status: 'approved' | 'rejected', reason?: string) => {
    try {
      await supabase.functions.invoke('send-notification', {
        body: {
          type: 'order',
          action: status,
          recipientEmail: order.user_email,
          recipientName: order.user_name,
          details: {
            orderId: order.id,
            amount: order.total_amount,
            rejectionReason: reason,
          },
        },
      });
      console.log('Notification sent for order:', order.id);
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  };

  const updateOrderStatus = async (orderId: string, status: 'approved' | 'rejected', reason?: string) => {
    setIsUpdating(true);
    const order = orders.find(o => o.id === orderId);
    
    const { error } = await supabase
      .from('orders')
      .update({ 
        order_status: status,
        rejection_reason: reason || null
      })
      .eq('id', orderId);

    if (error) {
      toast({ title: "Error", description: "Failed to update order", variant: "destructive" });
    } else {
      toast({ 
        title: status === 'approved' ? "Order Approved" : "Order Rejected",
        description: `Order has been ${status}`
      });
      
      // Send email notification
      if (order) {
        sendNotification(order, status, reason);
      }
      
      setSelectedOrder(null);
      setShowRejectDialog(false);
      setRejectionReason("");
    }
    setIsUpdating(false);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: `${label} copied to clipboard` });
  };

  const deleteOrder = async (orderId: string) => {
    setIsUpdating(true);
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', orderId);

    if (error) {
      toast({ title: "Error", description: "Failed to delete order", variant: "destructive" });
    } else {
      toast({ title: "Order Deleted", description: "Order has been permanently deleted" });
      setShowDeleteDialog(false);
      setOrderToDelete(null);
    }
    setIsUpdating(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      case 'approved':
        return <Badge className="bg-green-500 hover:bg-green-600"><CheckCircle className="w-3 h-3 mr-1" /> Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500 hover:bg-red-600"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.transaction_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.user_phone.includes(searchQuery);
    const matchesStatus = statusFilter === 'all' || order.order_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = orders.filter(o => o.order_status === 'pending').length;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Package className="w-6 h-6" />
            Orders
            {pendingCount > 0 && (
              <Badge className="bg-yellow-500">{pendingCount} pending</Badge>
            )}
          </h1>
          <p className="text-muted-foreground">Manage customer orders</p>
        </div>
        <Button variant="outline" onClick={fetchOrders} disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, phone, or transaction ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'pending', 'approved', 'rejected'].map(status => (
            <Button
              key={status}
              variant={statusFilter === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(status)}
              className="capitalize"
            >
              {status}
            </Button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading orders...</div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No orders found</div>
      ) : (
        <div className="grid gap-4">
          <AnimatePresence>
            {filteredOrders.map((order, index) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
                className="bg-card border rounded-xl p-4 space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      order.payment_method === 'bkash' ? 'bg-pink-100 text-pink-600' : 'bg-orange-100 text-orange-600'
                    }`}>
                      <span className="font-bold text-sm">{order.payment_method === 'bkash' ? 'bK' : 'N'}</span>
                    </div>
                    <div>
                      <h3 className="font-semibold">{order.user_name}</h3>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {order.user_phone}
                        </span>
                        {order.user_email && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {order.user_email}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(order.order_status)}
                    <span className="font-bold text-lg">৳{order.total_amount}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <div className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-lg">
                    <span className="text-muted-foreground">TXN:</span>
                    <span className="font-mono font-medium">{order.transaction_id}</span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6"
                      onClick={() => copyToClipboard(order.transaction_id, 'Transaction ID')}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                  <span className="text-muted-foreground">
                    {format(new Date(order.created_at), 'MMM dd, yyyy h:mm a')}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View Details
                  </Button>
                  {order.order_status === 'pending' && (
                    <>
                      <Button 
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => updateOrderStatus(order.id, 'approved')}
                        disabled={isUpdating}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                      <Button 
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowRejectDialog(true);
                        }}
                        disabled={isUpdating}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                    </>
                  )}
                  <Button 
                    size="sm"
                    variant="outline"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => {
                      setOrderToDelete(order);
                      setShowDeleteDialog(true);
                    }}
                    disabled={isUpdating}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Order Details Dialog */}
      <Dialog open={!!selectedOrder && !showRejectDialog} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Status</span>
                {getStatusBadge(selectedOrder.order_status)}
              </div>
              
              <div className="bg-muted rounded-lg p-4 space-y-2">
                <h4 className="font-semibold">Customer</h4>
                <p>{selectedOrder.user_name}</p>
                <p className="text-sm text-muted-foreground">{selectedOrder.user_phone}</p>
                {selectedOrder.user_email && (
                  <p className="text-sm text-muted-foreground">{selectedOrder.user_email}</p>
                )}
              </div>

              <div className="bg-muted rounded-lg p-4 space-y-2">
                <h4 className="font-semibold">Payment</h4>
                <p className="capitalize">{selectedOrder.payment_method}</p>
                <div className="flex items-center gap-2">
                  <span className="font-mono">{selectedOrder.transaction_id}</span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6"
                    onClick={() => copyToClipboard(selectedOrder.transaction_id, 'Transaction ID')}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
                {selectedOrder.sender_phone && (
                  <p className="text-sm text-muted-foreground">From: {selectedOrder.sender_phone}</p>
                )}
              </div>

              <div className="bg-muted rounded-lg p-4 space-y-2">
                <h4 className="font-semibold">Items</h4>
                {selectedOrder.product_details.map((item, i) => (
                  <div key={i} className="flex justify-between">
                    <span>{item.name} x{item.quantity}</span>
                    <span>৳{item.price * item.quantity}</span>
                  </div>
                ))}
                <div className="border-t pt-2 flex justify-between font-bold">
                  <span>Total</span>
                  <span>৳{selectedOrder.total_amount}</span>
                </div>
              </div>

              {selectedOrder.rejection_reason && (
                <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 rounded-lg p-4">
                  <h4 className="font-semibold text-red-600">Rejection Reason</h4>
                  <p className="text-sm">{selectedOrder.rejection_reason}</p>
                </div>
              )}

              <p className="text-sm text-muted-foreground">
                Ordered on {format(new Date(selectedOrder.created_at), 'MMMM dd, yyyy at h:mm a')}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={(open) => {
        if (!open) {
          setShowRejectDialog(false);
          setRejectionReason("");
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Order</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this order.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Enter rejection reason..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={() => selectedOrder && updateOrderStatus(selectedOrder.id, 'rejected', rejectionReason)}
              disabled={isUpdating}
            >
              Reject Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={(open) => {
        if (!open) {
          setShowDeleteDialog(false);
          setOrderToDelete(null);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Order</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete this order? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {orderToDelete && (
            <div className="bg-muted rounded-lg p-4 space-y-2">
              <p><strong>Customer:</strong> {orderToDelete.user_name}</p>
              <p><strong>Amount:</strong> ৳{orderToDelete.total_amount}</p>
              <p><strong>Transaction ID:</strong> {orderToDelete.transaction_id}</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={() => orderToDelete && deleteOrder(orderToDelete.id)}
              disabled={isUpdating}
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Delete Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Orders;
