import React, { useMemo, useState } from 'react';
import { CreditCard, ShieldCheck, ArrowRight, CheckCircle2, IndianRupee, Building2, Tag, Download } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { jsPDF } from 'jspdf';

interface PaymentPageProps {
  amount: number;
  appointmentId?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function PaymentPage({ amount, appointmentId, onSuccess, onCancel }: PaymentPageProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi' | 'netbanking' | 'pay_at_hospital'>('card');
  const [coupon, setCoupon] = useState('');
  const [couponError, setCouponError] = useState('');
  const [discount, setDiscount] = useState(0);

  // Card details state
  const [cardDetails, setCardDetails] = useState({
    number: '',
    expiry: '',
    cvv: ''
  });

  const handleCouponChange = (val: string) => {
    // Only allow A-Z and 0-9, uppercase only
    const formatted = val.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setCoupon(formatted);
  };

  const handleCardNumberChange = (val: string) => {
    // Numbers only, max 16 digits
    const formatted = val.replace(/\D/g, '').slice(0, 16);
    setCardDetails(prev => ({ ...prev, number: formatted }));
  };

  const handleExpiryChange = (val: string) => {
    // Numbers only, max 4 digits (MMYY)
    let formatted = val.replace(/\D/g, '').slice(0, 4);
    
    if (formatted.length >= 2) {
      const month = parseInt(formatted.slice(0, 2));
      // Validate month
      if (month < 1 || month > 12) {
        // If invalid month, just keep the first digit if it's 0 or 1, else clear
        if (formatted[0] === '0' || formatted[0] === '1') {
          formatted = formatted[0];
        } else {
          formatted = '';
        }
      } else if (formatted.length >= 2) {
        // Auto insert slash
        formatted = formatted.slice(0, 2) + '/' + formatted.slice(2);
      }
    }
    
    setCardDetails(prev => ({ ...prev, expiry: formatted }));
  };

  const handleCVVChange = (val: string) => {
    // Numbers only, max 3 digits
    const formatted = val.replace(/\D/g, '').slice(0, 3);
    setCardDetails(prev => ({ ...prev, cvv: formatted }));
  };

  const validateExpiry = (expiry: string) => {
    if (expiry.length !== 5) return false;
    const [m, y] = expiry.split('/').map(n => parseInt(n));
    const now = new Date();
    const currentYear = now.getFullYear() % 100;
    const currentMonth = now.getMonth() + 1;

    if (y < currentYear) return false;
    if (y === currentYear && m < currentMonth) return false;
    return true;
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (paymentMethod === 'card') {
      if (cardDetails.number.length !== 16) {
        alert('Card number must be exactly 16 digits');
        return;
      }
      if (!validateExpiry(cardDetails.expiry)) {
        alert('Invalid or expired date');
        return;
      }
      if (cardDetails.cvv.length !== 3) {
        alert('CVV must be 3 digits');
        return;
      }
    }

    setLoading(true);
    
    try {
      // 1) Save transaction to Firestore
      if (user) {
        await addDoc(collection(db, 'transactions'), {
          patient_id: user.uid,
          appointment_id: appointmentId || null,
          amount: totalDue,
          date: serverTimestamp(),
          method: paymentMethod === 'card' ? 'Credit Card' : 
                  paymentMethod === 'upi' ? 'UPI' : 
                  paymentMethod === 'netbanking' ? 'Net Banking' : 'Pay at Hospital',
          status: paymentMethod === 'pay_at_hospital' ? 'pay-at-hospital' : 'paid',
          serviceName: 'General Consultation', // Default
          provider: 'MediCare Hospital'
        });
      }

      // 2) Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setLoading(false);
      setSuccess(true);
      
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (error) {
      console.error('Error processing payment:', error);
      alert('Error processing payment. Please try again.');
      setLoading(false);
    }
  };

  const applyCoupon = () => {
    setCouponError('');
    const code = coupon.trim().toUpperCase();
    if (!code) return;
    // Simple coupon rules for demo
    if (code === 'MEDI10') {
      setDiscount(Math.round(amount * 0.1));
    } else if (code === 'MEDI100') {
      setDiscount(100);
    } else {
      setDiscount(0);
      setCouponError('Invalid coupon code');
    }
  };

  const totalDue = useMemo(() => Math.max(amount - discount, 0), [amount, discount]);

  const generateInvoicePDF = () => {
    const doc = new jsPDF();
    const dateStr = new Date().toLocaleDateString();
    const invoiceNum = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');

    // Header
    doc.setFontSize(22);
    doc.setTextColor(37, 99, 235); // Blue-600
    doc.text('MediCare Invoice', 20, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Invoice #: MC-${invoiceNum}`, 150, 20);
    doc.text(`Date: ${dateStr}`, 150, 25);

    // Hospital Info
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text('MediCare Multispecialty Hospital', 20, 40);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('Main Road, Health City', 20, 45);
    doc.text('Phone: +91 94401 23456', 20, 50);

    // Patient Info
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text('Patient Details:', 20, 70);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Name: ${user?.displayName || 'Valued Patient'}`, 20, 75);
    doc.text(`Email: ${user?.email || 'N/A'}`, 20, 80);

    // Service Table
    doc.setDrawColor(200);
    doc.line(20, 90, 190, 90);
    
    doc.setFontSize(11);
    doc.setTextColor(0);
    doc.text('Service Description', 25, 100);
    doc.text('Amount', 160, 100);
    
    doc.line(20, 105, 190, 105);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('General Consultation Fee', 25, 115);
    doc.text(`INR ${amount.toLocaleString('en-IN')}.00`, 160, 115);

    if (discount > 0) {
      doc.text('Discount Applied', 25, 125);
      doc.text(`- INR ${discount.toLocaleString('en-IN')}.00`, 160, 125);
    }

    // Total
    doc.line(130, 135, 190, 135);
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text('Total Amount Paid:', 130, 145);
    doc.text(`INR ${totalDue.toLocaleString('en-IN')}.00`, 165, 145);

    // Footer
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text('Thank you for choosing MediCare. Get well soon!', 105, 180, { align: 'center' });
    doc.text('This is a computer-generated invoice and does not require a signature.', 105, 185, { align: 'center' });

    doc.save(`MediCare_Invoice_${invoiceNum}.pdf`);
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-fadeIn">
        <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-emerald-100 dark:shadow-none">
          <CheckCircle2 size={48} />
        </div>
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Payment Successful!</h2>
        <p className="text-slate-500 dark:text-slate-400">Your transaction has been processed in INR.</p>
        
        <div className="mt-8 flex flex-col items-center gap-4">
          <button 
            onClick={generateInvoicePDF}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-md hover:shadow-lg active:scale-95"
          >
            <Download size={20} />
            Download Invoice (PDF)
          </button>
          
          <button 
            onClick={onSuccess}
            className="text-blue-600 hover:text-blue-700 font-bold transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
        
        <p className="text-sm text-slate-400 mt-12">Thank you for your trust.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto animate-fadeIn">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Checkout</h2>
        <p className="text-slate-500 dark:text-slate-400">Complete your payment securely in Indian Rupees (INR).</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <div className="card p-6">
            <h3 className="font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
              <CreditCard size={20} className="text-blue-600" />
              Payment Method
            </h3>
            
            <div className="grid grid-cols-1 gap-3">
              {[
                { id: 'card', label: 'Credit / Debit Card', icon: CreditCard },
                { id: 'upi', label: 'UPI (GPay, PhonePe, etc.)', icon: ShieldCheck },
                { id: 'netbanking', label: 'Net Banking', icon: ArrowRight },
                { id: 'pay_at_hospital', label: 'Pay at Hospital', icon: Building2 },
              ].map((method) => (
                <button
                  key={method.id}
                  onClick={() => setPaymentMethod(method.id as any)}
                  className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                    paymentMethod === method.id 
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300' 
                      : 'border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <method.icon size={20} />
                    <span className="font-bold">{method.label}</span>
                  </div>
                  {paymentMethod === method.id && <div className="w-2 h-2 bg-blue-600 rounded-full"></div>}
                </button>
              ))}
            </div>

            <form onSubmit={handlePayment} className="mt-8 space-y-6">
              {/* Discount Coupon */}
              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3">
                <div className="relative">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 block mb-1">Discount Coupon</label>
                  <div className="relative">
                    <Tag size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      value={coupon} 
                      onChange={(e) => handleCouponChange(e.target.value)} 
                      placeholder="Enter code (e.g., MEDI10)" 
                      className="input-field pl-9" 
                    />
                  </div>
                  {couponError && <p className="text-red-500 text-[10px] font-bold mt-1">{couponError}</p>}
                </div>
                <button type="button" onClick={applyCoupon} className="btn-outline md:self-end py-3">Apply</button>
              </div>

              {paymentMethod === 'card' && (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Card Number</label>
                    <input 
                      type="text" 
                      value={cardDetails.number}
                      onChange={(e) => handleCardNumberChange(e.target.value)}
                      placeholder="XXXX XXXX XXXX XXXX" 
                      className="input-field" 
                      required 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Expiry Date</label>
                      <input 
                        type="text" 
                        value={cardDetails.expiry}
                        onChange={(e) => handleExpiryChange(e.target.value)}
                        placeholder="MM/YY" 
                        className="input-field" 
                        required 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">CVV</label>
                      <input 
                        type="password" 
                        value={cardDetails.cvv}
                        onChange={(e) => handleCVVChange(e.target.value)}
                        placeholder="***" 
                        className="input-field" 
                        required 
                      />
                    </div>
                  </div>
                </>
              )}

              {paymentMethod === 'upi' && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">UPI ID</label>
                  <input type="text" placeholder="yourname@upi" className="input-field" required />
                </div>
              )}

              {paymentMethod === 'pay_at_hospital' && (
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-sm">
                  Present this invoice at the hospital billing counter. No online payment required.
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-4 text-lg flex items-center justify-center gap-2 mt-4"
              >
                {loading ? (
                  <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    {paymentMethod === 'pay_at_hospital' ? 'Confirm & Generate Invoice' : `Pay ₹${totalDue.toLocaleString('en-IN')}`}
                    <ArrowRight size={20} />
                  </>
                )}
              </button>
            </form>
          </div>
          
          <button onClick={onCancel} className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-sm font-medium transition-colors">
            Cancel and return
          </button>
        </div>

        <div className="space-y-6">
          <div className="card p-6 bg-slate-50 dark:bg-slate-900/50 border-dashed">
            <h3 className="font-bold text-slate-800 dark:text-white mb-4">Order Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-300">Consultation Fee</span>
                <span className="font-bold text-slate-900 dark:text-white">₹{amount.toLocaleString('en-IN')}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-300">Discount</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">- ₹{discount.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-300">Service Tax (0%)</span>
                <span className="font-bold text-slate-900 dark:text-white">₹0</span>
              </div>
              <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-between">
                <span className="font-extrabold text-slate-900 dark:text-white">Total</span>
                <span className="font-extrabold text-blue-700 dark:text-blue-300">₹{totalDue.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-700 dark:text-blue-300 text-xs leading-relaxed">
            <ShieldCheck size={24} className="flex-shrink-0" />
            <p>Your payment is secured with 256-bit encryption. We only process payments in <strong>INR</strong>.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
