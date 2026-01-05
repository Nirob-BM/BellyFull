import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, CreditCard, Phone, CheckCircle, Copy, Upload, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const checkoutSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(11, "Enter a valid phone number").max(14),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  transactionId: z.string().min(4, "Transaction ID is required"),
  senderPhone: z.string().min(11, "Enter sender phone number").optional().or(z.literal("")),
});

const Checkout = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { items, totalAmount, clearCart } = useCart();
  const [step, setStep] = useState<'details' | 'payment' | 'verify' | 'success'>('details');
  const [paymentMethod, setPaymentMethod] = useState<'bkash' | 'nagad' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentSettings, setPaymentSettings] = useState({ bkash_number: "01308697630", nagad_number: "01308697630" });
  
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    transactionId: "",
    senderPhone: "",
  });

  useEffect(() => {
    const fetchPaymentSettings = async () => {
      const { data } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'payment_settings')
        .maybeSingle();
      
      if (data?.value) {
        setPaymentSettings(data.value as { bkash_number: string; nagad_number: string });
      }
    };
    fetchPaymentSettings();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const copyNumber = () => {
    const number = paymentMethod === 'bkash' ? paymentSettings.bkash_number : paymentSettings.nagad_number;
    navigator.clipboard.writeText(number);
    toast({ title: "Copied!", description: "Payment number copied to clipboard" });
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

      setIsSubmitting(true);

      // Check for duplicate transaction ID
      const { data: existing } = await supabase
        .from('orders')
        .select('id')
        .eq('transaction_id', formData.transactionId)
        .maybeSingle();

      if (existing) {
        toast({
          title: "Duplicate Transaction",
          description: "This transaction ID has already been used",
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }

      const { error } = await supabase.from('orders').insert([{
        user_name: formData.fullName,
        user_phone: formData.phone,
        user_email: formData.email || null,
        product_details: JSON.parse(JSON.stringify(items)),
        total_amount: totalAmount,
        payment_method: paymentMethod!,
        transaction_id: formData.transactionId,
        sender_phone: formData.senderPhone || null,
        order_status: 'pending'
      }]);

      if (error) throw error;

      setStep('success');
      clearCart();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to place order",
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
      <div className="max-w-2xl mx-auto p-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold">Checkout</h1>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {['details', 'payment', 'verify', 'success'].map((s, i) => (
            <div key={s} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === s ? 'bg-primary text-primary-foreground' : 
                ['details', 'payment', 'verify', 'success'].indexOf(step) > i ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
              }`}>
                {i + 1}
              </div>
              {i < 3 && <div className={`w-12 h-0.5 ${['details', 'payment', 'verify', 'success'].indexOf(step) > i ? 'bg-primary' : 'bg-muted'}`} />}
            </div>
          ))}
        </div>

        {/* Step 1: Order Details */}
        {step === 'details' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Order Summary */}
            <div className="bg-card rounded-xl p-4 border">
              <h3 className="font-semibold mb-4">Order Summary</h3>
              <div className="space-y-3">
                {items.map(item => (
                  <div key={item.id} className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">x{item.quantity}</p>
                    </div>
                    <p className="font-medium">৳{(item.price * item.quantity).toFixed(0)}</p>
                  </div>
                ))}
                <div className="border-t pt-3 flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-primary">৳{totalAmount.toFixed(0)}</span>
                </div>
              </div>
            </div>

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
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setPaymentMethod('bkash')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    paymentMethod === 'bkash' ? 'border-pink-500 bg-pink-50 dark:bg-pink-950/30' : 'border-muted hover:border-pink-300'
                  }`}
                >
                  <div className="text-2xl font-bold text-pink-600">bKash</div>
                  <p className="text-sm text-muted-foreground mt-1">Send Money</p>
                </button>
                <button
                  onClick={() => setPaymentMethod('nagad')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    paymentMethod === 'nagad' ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/30' : 'border-muted hover:border-orange-300'
                  }`}
                >
                  <div className="text-2xl font-bold text-orange-600">Nagad</div>
                  <p className="text-sm text-muted-foreground mt-1">Send Money</p>
                </button>
              </div>
            </div>

            <Button 
              className="w-full" 
              size="lg"
              disabled={!formData.fullName || !formData.phone || !paymentMethod}
              onClick={() => setStep('payment')}
            >
              Continue to Payment
            </Button>
          </motion.div>
        )}

        {/* Step 2: Payment Instructions */}
        {step === 'payment' && paymentMethod && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className={`rounded-xl p-6 ${paymentMethod === 'bkash' ? 'bg-pink-50 dark:bg-pink-950/30 border-pink-200' : 'bg-orange-50 dark:bg-orange-950/30 border-orange-200'} border`}>
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                {paymentMethod === 'bkash' ? 'bKash' : 'Nagad'} Payment
              </h3>
              
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
                  <p className="text-3xl font-bold text-primary">৳{totalAmount.toFixed(0)}</p>
                </div>

                <div className="bg-background/50 rounded-lg p-4 text-sm">
                  <p className="font-medium mb-2">Instructions:</p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                    <li>Open your {paymentMethod === 'bkash' ? 'bKash' : 'Nagad'} app</li>
                    <li>Go to "Send Money"</li>
                    <li>Enter the number above</li>
                    <li>Enter amount: ৳{totalAmount.toFixed(0)}</li>
                    <li>Complete the payment</li>
                    <li>Note down the Transaction ID</li>
                  </ol>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <Button variant="outline" className="flex-1" onClick={() => setStep('details')}>
                Back
              </Button>
              <Button className="flex-1" onClick={() => setStep('verify')}>
                I've Made Payment
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Verify Transaction */}
        {step === 'verify' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="bg-card rounded-xl p-6 border space-y-4">
              <h3 className="text-xl font-bold">Verify Payment</h3>
              <p className="text-muted-foreground">Enter your transaction details to complete the order</p>
              
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
              <Button variant="outline" className="flex-1" onClick={() => setStep('payment')}>
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

        {/* Step 4: Success */}
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
                Your order is being verified. You'll receive a confirmation soon.
              </p>
            </div>
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 rounded-lg p-4">
              <p className="text-amber-800 dark:text-amber-200 text-sm">
                <strong>Status:</strong> Waiting for admin approval
              </p>
            </div>
            <Button onClick={() => navigate('/')} className="mt-4">
              Back to Home
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Checkout;
