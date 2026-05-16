import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, CreditCard, CheckCircle, Copy, Plus, Minus, X, MapPin, Truck, Store, ShoppingBag } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import { BkashLogo, NagadLogo, CashOnDeliveryIcon } from "@/components/PaymentLogos";
import { Helmet } from "react-helmet-async";

const checkoutSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(11, "Enter a valid phone number").max(14),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  transactionId: z.string().optional(),
  senderPhone: z.string().optional(),
  deliveryAddress: z.string().optional(),
});

interface DeliverySettings {
  enabled: boolean;
  delivery_charge: number;
  min_order_amount: number;
  delivery_areas: string[];
}

const defaultDeliverySettings: DeliverySettings = {
  enabled: true,
  delivery_charge: 50,
  min_order_amount: 200,
  delivery_areas: ["Kishoreganj Sadar"]
};

const Checkout = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { items, totalAmount, clearCart, updateQuantity, removeItem } = useCart();
  const [step, setStep] = useState<'details' | 'payment' | 'success'>('details');
  const [paymentMethod, setPaymentMethod] = useState<'bkash' | 'nagad' | 'cod' | null>(null);
  const [deliveryType, setDeliveryType] = useState<'pickup' | 'delivery'>('pickup');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentSettings, setPaymentSettings] = useState({ 
    bkash_number: "01308697630", 
    nagad_number: "01308697630",
    cod_enabled: true 
  });
  const [deliverySettings, setDeliverySettings] = useState<DeliverySettings>(defaultDeliverySettings);
  const [isEditing, setIsEditing] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    transactionId: "",
    senderPhone: "",
    deliveryAddress: "",
    deliveryArea: "Kishoreganj Sadar",
  });

  const deliveryCharge = deliveryType === 'delivery' ? deliverySettings.delivery_charge : 0;
  const finalTotal = totalAmount + deliveryCharge;

  useEffect(() => {
    const fetchSettings = async () => {
      const { data: paymentData, error: paymentErr } = await supabase.functions.invoke('get-payment-info');
      if (!paymentErr && paymentData) {
        setPaymentSettings(prev => ({ ...prev, ...(paymentData as object) }));
      }

      const { data: deliveryData } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'delivery_settings')
        .maybeSingle();
      
      if (deliveryData?.value) {
        setDeliverySettings(prev => ({ ...prev, ...deliveryData.value as object }));
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const copyNumber = () => {
    const number = paymentMethod === 'bkash' ? paymentSettings.bkash_number : paymentSettings.nagad_number;
    navigator.clipboard.writeText(number);
    toast({ title: "Copied!", description: "Payment number copied to clipboard" });
  };

  const validateDelivery = () => {
    if (deliveryType === 'delivery') {
      if (totalAmount < deliverySettings.min_order_amount) {
        toast({
          title: "Minimum order not met",
          description: `Minimum order for delivery is ৳${deliverySettings.min_order_amount}`,
          variant: "destructive"
        });
        return false;
      }
      if (!formData.deliveryAddress.trim()) {
        toast({
          title: "Address required",
          description: "Please enter your delivery address",
          variant: "destructive"
        });
        return false;
      }
    }
    return true;
  };

  const handleSubmitOrder = async () => {
    try {
      const validation = checkoutSchema.safeParse(formData);
      if (!validation.success) {
        toast({
          title: "Validation Error",
          description: validation.error.errors[0].message,
          variant: "destructive"
        });
        return;
      }

      if (!validateDelivery()) return;

      // For bKash/Nagad, transaction ID is required
      if ((paymentMethod === 'bkash' || paymentMethod === 'nagad') && !formData.transactionId) {
        toast({
          title: "Transaction ID Required",
          description: "Please enter your transaction ID",
          variant: "destructive"
        });
        return;
      }

      setIsSubmitting(true);

      // Server computes the authoritative total from menu_items prices
      // and enforces a unique transaction_id at the DB level.
      const { error } = await supabase.rpc('create_order', {
        _user_name: formData.fullName,
        _user_phone: formData.phone,
        _user_email: formData.email || '',
        _payment_method: paymentMethod!,
        _transaction_id: paymentMethod === 'cod' ? '' : formData.transactionId,
        _sender_phone: formData.senderPhone || '',
        _delivery_type: deliveryType,
        _delivery_address: deliveryType === 'delivery' ? formData.deliveryAddress : '',
        _delivery_area: deliveryType === 'delivery' ? formData.deliveryArea : '',
        _cart_items: items.map(i => ({ id: i.id, quantity: i.quantity })),
      });

      if (error) {
        const msg = (error.message || '').toLowerCase();
        let description = "Failed to place order. Please try again or contact us.";
        if (msg.includes('duplicate_transaction') || msg.includes('orders_transaction_id_unique')) {
          description = "This transaction ID has already been used.";
        } else if (msg.includes('item_unavailable')) {
          description = "One of the items in your cart is no longer available.";
        } else if (msg.includes('below_min_order')) {
          description = `Minimum order for delivery is ৳${deliverySettings.min_order_amount}.`;
        } else if (msg.includes('address_required')) {
          description = "Please enter your delivery address.";
        } else if (msg.includes('transaction_id_required')) {
          description = "Please enter your transaction ID.";
        }
        toast({ title: "Error", description, variant: "destructive" });
        setIsSubmitting(false);
        return;
      }

      setStep('success');
      clearCart();
    } catch (error: any) {
      console.error("Order submission error:", error);
      toast({
        title: "Error",
        description: "Failed to place order. Please try again or contact us.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0 && step !== 'success') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
          <Button onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Menu
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Checkout — Belly Full</title>
        <meta name="description" content="Review your order and complete checkout securely with bKash, Nagad or cash on delivery at Belly Full Kishoreganj." />
        <meta name="robots" content="noindex,nofollow" />
        <link rel="canonical" href="https://bellyfull.lovable.app/checkout" />
        <meta property="og:title" content="Checkout — Belly Full" />
        <meta property="og:description" content="Complete your Belly Full order — pickup or delivery in Kishoreganj." />
        <meta property="og:url" content="https://bellyfull.lovable.app/checkout" />
      </Helmet>
      <main className="max-w-2xl mx-auto p-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="Go back">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold">Checkout</h1>
        </div>
        <h2 className="sr-only">Your order</h2>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {['details', 'payment', 'success'].map((s, i) => (
            <div key={s} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === s ? 'bg-primary text-primary-foreground' : 
                ['details', 'payment', 'success'].indexOf(step) > i ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
              }`}>
                {i + 1}
              </div>
              {i < 2 && <div className={`w-12 h-0.5 ${['details', 'payment', 'success'].indexOf(step) > i ? 'bg-primary' : 'bg-muted'}`} />}
            </div>
          ))}
        </div>

        {/* Step 1: Order Details */}
        {step === 'details' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Order Summary - Editable */}
            <div className="bg-card rounded-xl p-4 border">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold">Order Summary</h3>
                <Button variant="ghost" size="sm" onClick={() => setIsEditing(!isEditing)}>
                  {isEditing ? "Done" : "Edit"}
                </Button>
              </div>
              <div className="space-y-3">
                {items.map(item => (
                  <div key={item.id} className="flex justify-between items-center">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {item.image_url && !item.image_url.startsWith("/src/") && (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-12 h-12 object-cover rounded-lg"
                          loading="lazy"
                          decoding="async"
                          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                        />
                      )}
                      <div className="min-w-0">
                        <p className="font-medium truncate">{item.name}</p>
                        <p className="text-sm text-muted-foreground">৳{item.price} each</p>
                      </div>
                    </div>
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          aria-label={`Decrease quantity of ${item.name}`}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          aria-label={`Increase quantity of ${item.name}`}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => removeItem(item.id)}
                          aria-label={`Remove ${item.name} from cart`}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="text-right">
                        <p className="font-medium">৳{(item.price * item.quantity).toFixed(0)}</p>
                        <p className="text-sm text-muted-foreground">x{item.quantity}</p>
                      </div>
                    )}
                  </div>
                ))}
                <div className="border-t pt-3 space-y-2">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span>৳{totalAmount.toFixed(0)}</span>
                  </div>
                  {deliveryType === 'delivery' && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Delivery Charge</span>
                      <span>৳{deliveryCharge}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span className="text-primary">৳{finalTotal.toFixed(0)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Delivery Type Selection */}
            {deliverySettings.enabled && (
              <div className="bg-card rounded-xl p-4 border space-y-4">
                <h3 className="font-semibold">Order Type</h3>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setDeliveryType('pickup')}
                    className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                      deliveryType === 'pickup' ? 'border-primary bg-primary/5' : 'border-muted hover:border-primary/50'
                    }`}
                  >
                    <Store className="w-8 h-8 text-primary" />
                    <span className="font-medium">Pickup</span>
                    <span className="text-xs text-muted-foreground">Collect from store</span>
                  </button>
                  <button
                    onClick={() => setDeliveryType('delivery')}
                    className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                      deliveryType === 'delivery' ? 'border-primary bg-primary/5' : 'border-muted hover:border-primary/50'
                    }`}
                  >
                    <Truck className="w-8 h-8 text-primary" />
                    <span className="font-medium">Delivery</span>
                    <span className="text-xs text-muted-foreground">+৳{deliverySettings.delivery_charge}</span>
                  </button>
                </div>

                {deliveryType === 'delivery' && (
                  <div className="space-y-4 pt-4 border-t">
                    <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 rounded-lg p-3 text-sm">
                      <p className="text-amber-800 dark:text-amber-200 flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>Home delivery available only in <strong>Kishoreganj Sadar</strong></span>
                      </p>
                      <p className="text-amber-700 dark:text-amber-300 text-xs mt-1">
                        Minimum order: ৳{deliverySettings.min_order_amount}
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="deliveryAddress">Delivery Address *</Label>
                      <Textarea
                        id="deliveryAddress"
                        name="deliveryAddress"
                        value={formData.deliveryAddress}
                        onChange={handleChange}
                        placeholder="Enter your full address in Kishoreganj Sadar"
                        rows={3}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* User Details Form */}
            <div className="bg-card rounded-xl p-4 border space-y-4">
              <h3 className="font-semibold">Your Details</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Mobile Number *</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="01XXXXXXXXX"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email (Optional)</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="your@email.com"
                  />
                </div>
              </div>
            </div>

            {/* Payment Method Selection */}
            <div className="bg-card rounded-xl p-4 border space-y-4">
              <h3 className="font-semibold">Payment Method</h3>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setPaymentMethod('bkash')}
                  className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                    paymentMethod === 'bkash' ? 'border-pink-500 bg-pink-50 dark:bg-pink-950/30' : 'border-muted hover:border-pink-300'
                  }`}
                >
                  <BkashLogo className="w-12 h-12" />
                  <span className="text-sm font-medium text-pink-600">bKash</span>
                </button>
                <button
                  onClick={() => setPaymentMethod('nagad')}
                  className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                    paymentMethod === 'nagad' ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/30' : 'border-muted hover:border-orange-300'
                  }`}
                >
                  <NagadLogo className="w-12 h-12" />
                  <span className="text-sm font-medium text-orange-600">Nagad</span>
                </button>
                {paymentSettings.cod_enabled && deliveryType === 'delivery' && (
                  <button
                    onClick={() => setPaymentMethod('cod')}
                    className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                      paymentMethod === 'cod' ? 'border-green-500 bg-green-50 dark:bg-green-950/30' : 'border-muted hover:border-green-300'
                    }`}
                  >
                    <CashOnDeliveryIcon className="w-12 h-12" />
                    <span className="text-sm font-medium text-green-600">COD</span>
                  </button>
                )}
              </div>
              {paymentMethod === 'cod' && (
                <p className="text-sm text-muted-foreground text-center">
                  Pay cash when your order arrives
                </p>
              )}
            </div>

            <Button 
              className="w-full" 
              size="lg"
              disabled={!formData.fullName || !formData.phone || !paymentMethod}
              onClick={() => {
                if (validateDelivery()) {
                  if (paymentMethod === 'cod') {
                    handleSubmitOrder();
                  } else {
                    setStep('payment');
                  }
                }
              }}
            >
              {paymentMethod === 'cod' ? 'Place Order' : 'Continue to Payment'}
            </Button>
          </motion.div>
        )}

        {/* Step 2: Payment & Verification (Combined) */}
        {step === 'payment' && paymentMethod && paymentMethod !== 'cod' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className={`rounded-xl p-6 ${paymentMethod === 'bkash' ? 'bg-pink-50 dark:bg-pink-950/30 border-pink-200' : 'bg-orange-50 dark:bg-orange-950/30 border-orange-200'} border`}>
              <div className="flex items-center gap-3 mb-4">
                {paymentMethod === 'bkash' ? <BkashLogo className="w-10 h-10" /> : <NagadLogo className="w-10 h-10" />}
                <h3 className="text-xl font-bold">
                  {paymentMethod === 'bkash' ? 'bKash' : 'Nagad'} Payment
                </h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Send Money to</p>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold font-mono">
                      {paymentMethod === 'bkash' ? paymentSettings.bkash_number : paymentSettings.nagad_number}
                    </span>
                    <Button variant="ghost" size="icon" onClick={copyNumber}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Amount to Send</p>
                  <p className="text-3xl font-bold text-primary">৳{finalTotal.toFixed(0)}</p>
                </div>

                <div className="bg-background/50 rounded-lg p-4 text-sm">
                  <p className="font-medium mb-2">Instructions:</p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                    <li>Open your {paymentMethod === 'bkash' ? 'bKash' : 'Nagad'} app</li>
                    <li>Go to "Send Money"</li>
                    <li>Enter the number above</li>
                    <li>Enter amount: ৳{finalTotal.toFixed(0)}</li>
                    <li>Complete the payment</li>
                    <li>Enter the Transaction ID below</li>
                  </ol>
                </div>
              </div>
            </div>

            {/* Transaction Verification */}
            <div className="bg-card rounded-xl p-6 border space-y-4">
              <h3 className="text-lg font-semibold">Verify Payment</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="transactionId">Transaction ID *</Label>
                  <Input
                    id="transactionId"
                    name="transactionId"
                    value={formData.transactionId}
                    onChange={handleChange}
                    placeholder="Enter Transaction ID from SMS"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="senderPhone">Sender Mobile Number</Label>
                  <Input
                    id="senderPhone"
                    name="senderPhone"
                    type="tel"
                    value={formData.senderPhone}
                    onChange={handleChange}
                    placeholder="Number you sent from"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <Button variant="outline" className="flex-1" onClick={() => setStep('details')}>
                Back
              </Button>
              <Button 
                className="flex-1" 
                onClick={handleSubmitOrder}
                disabled={!formData.transactionId || isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Submit Order"}
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Success */}
        {step === 'success' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }} 
            className="text-center space-y-6 py-12"
          >
            <div className="w-20 h-20 bg-green-100 dark:bg-green-950/50 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">Order Placed Successfully!</h2>
              <p className="text-muted-foreground">
                {paymentMethod === 'cod' 
                  ? "Your order will be delivered soon. Please keep cash ready."
                  : "Your order is being verified. You'll receive a confirmation soon."
                }
              </p>
            </div>
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 rounded-lg p-4">
              <p className="text-amber-800 dark:text-amber-200 text-sm">
                <strong>Status:</strong> {paymentMethod === 'cod' ? 'Cash on Delivery' : 'Waiting for admin approval'}
              </p>
            </div>
            <Button onClick={() => navigate('/')} className="mt-4">
              Back to Home
            </Button>
          </motion.div>
        )}
      </div>

      {/* Floating Continue Shopping Button */}
      {step !== 'success' && (
        <div className="fixed bottom-4 right-4 z-50">
          <Button 
            onClick={() => navigate('/menu')} 
            variant="outline"
            className="shadow-lg rounded-full px-5 gap-2 bg-background hover:bg-accent"
          >
            <ShoppingBag className="w-4 h-4" />
            Continue Shopping
          </Button>
        </div>
      )}
    </div>
  );
};

export default Checkout;
