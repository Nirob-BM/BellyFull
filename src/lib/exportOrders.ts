import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

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

export const exportOrdersToCSV = (orders: Order[], filename: string = 'orders') => {
  const headers = [
    'Order ID',
    'Date',
    'Customer Name',
    'Phone',
    'Email',
    'Items',
    'Total Amount',
    'Payment Method',
    'Transaction ID',
    'Status'
  ];

  const rows = orders.map(order => [
    order.id.slice(0, 8),
    format(new Date(order.created_at), 'yyyy-MM-dd HH:mm'),
    order.user_name,
    order.user_phone,
    order.user_email || '-',
    order.product_details.map(item => `${item.name} x${item.quantity}`).join('; '),
    `৳${order.total_amount}`,
    order.payment_method,
    order.transaction_id,
    order.order_status
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}-${format(new Date(), 'yyyy-MM-dd')}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportOrdersToPDF = (orders: Order[], filename: string = 'orders') => {
  const doc = new jsPDF();

  // Title
  doc.setFontSize(20);
  doc.text('Orders Report', 14, 22);
  
  // Date
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generated on: ${format(new Date(), 'MMMM dd, yyyy HH:mm')}`, 14, 30);
  doc.text(`Total Orders: ${orders.length}`, 14, 36);

  // Summary
  const totalRevenue = orders.reduce((sum, o) => sum + o.total_amount, 0);
  const approvedOrders = orders.filter(o => o.order_status === 'approved').length;
  const pendingOrders = orders.filter(o => o.order_status === 'pending').length;
  const rejectedOrders = orders.filter(o => o.order_status === 'rejected').length;

  doc.text(`Total Revenue: ৳${totalRevenue.toLocaleString()}`, 14, 42);
  doc.text(`Approved: ${approvedOrders} | Pending: ${pendingOrders} | Rejected: ${rejectedOrders}`, 14, 48);

  // Table
  const tableData = orders.map(order => [
    order.id.slice(0, 8),
    format(new Date(order.created_at), 'MM/dd/yy'),
    order.user_name.slice(0, 15),
    order.user_phone,
    order.product_details.map(item => `${item.name} x${item.quantity}`).join(', ').slice(0, 30) + 
      (order.product_details.map(item => `${item.name} x${item.quantity}`).join(', ').length > 30 ? '...' : ''),
    `৳${order.total_amount}`,
    order.order_status
  ]);

  autoTable(doc, {
    head: [['ID', 'Date', 'Customer', 'Phone', 'Items', 'Amount', 'Status']],
    body: tableData,
    startY: 55,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [139, 69, 19] },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: 22 },
      2: { cellWidth: 30 },
      3: { cellWidth: 28 },
      4: { cellWidth: 45 },
      5: { cellWidth: 22 },
      6: { cellWidth: 20 }
    }
  });

  doc.save(`${filename}-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};

export const exportOrdersToJSON = (orders: Order[], filename: string = 'orders') => {
  const jsonContent = JSON.stringify(orders, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}-${format(new Date(), 'yyyy-MM-dd')}.json`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
