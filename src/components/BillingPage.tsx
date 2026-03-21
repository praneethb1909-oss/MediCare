import React, { useState, useEffect, useCallback } from 'react';
import { Receipt, IndianRupee, Download, Search, Filter, CheckCircle2, Clock, AlertCircle, ArrowRight, CreditCard, Wallet, Building2, Plus, Info, RefreshCcw, X, Smartphone, ShieldCheck, Stethoscope } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

interface Transaction {
  id: string;
  serviceName: string;
  provider: string;
  date: string;
  amount: number;
  status: 'paid' | 'pending' | 'yet-to-pay' | 'pay-at-hospital' | 'refunded' | 'failed';
  method?: string;
}

export function BillingPage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'paid' | 'pending'>('all');
  const [showPaymentModal, setShowPaymentModal] = useState<Transaction | null>(null);
  const [paymentStep, setPaymentStep] = useState<'select' | 'processing' | 'success'>('select');
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'wallet'>('upi');

  const loadTransactions = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const q = query(
        collection(db, 'transactions'),
        where('patient_id', '==', user.uid),
        orderBy('date', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const txns = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
      setTransactions(txns);
    } catch (error) {
      console.error('Error loading transactions:', error);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentStep('processing');
    
    // Simulate payment gateway delay
    await new Promise(resolve => setTimeout(resolve, 2500));
    setPaymentStep('success');
    
    // Reset after showing success
    setTimeout(() => {
      setShowPaymentModal(null);
      setPaymentStep('select');
    }, 2000);
  };

  const getStatusBadge = (status: Transaction['status']) => {
    switch (status) {
      case 'paid':
        return <span className="badge badge-success flex items-center gap-1"><CheckCircle2 size={12} /> Paid</span>;
      case 'pending':
        return <span className="badge badge-pending flex items-center gap-1"><Clock size={12} /> Pending</span>;
      case 'yet-to-pay':
        return <span className="badge badge-blue flex items-center gap-1"><AlertCircle size={12} /> Yet to Pay</span>;
      case 'pay-at-hospital':
        return <span className="badge badge-error flex items-center gap-1"><Building2 size={12} /> Pay at Hospital</span>;
      case 'refunded':
        return <span className="badge bg-purple-50 text-purple-600 flex items-center gap-1"><RefreshCcw size={12} /> Refunded</span>;
      case 'failed':
        return <span className="badge bg-red-50 text-red-600 flex items-center gap-1"><X size={12} /> Failed</span>;
    }
  };

  const filteredTransactions = transactions.filter(t => 
    filter === 'all' ? true : t.status === filter
  );

  const totalPaid = transactions.filter(t => t.status === 'paid').reduce((acc, t) => acc + t.amount, 0);
  const totalPending = transactions.filter(t => t.status !== 'paid').reduce((acc, t) => acc + t.amount, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">Billing & Payments</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Manage your invoices and payment history.</p>
        </div>
        
        <button className="btn-primary flex items-center gap-2 px-6 py-3 shadow-lg shadow-blue-200 dark:shadow-none">
          <Download size={18} /> Download All Statements
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6 border-none bg-blue-600 text-white shadow-xl shadow-blue-200 dark:shadow-none">
          <div className="flex items-center justify-between mb-4 text-blue-100">
            <span className="text-xs font-bold uppercase tracking-widest">Total Paid</span>
            <CheckCircle2 size={20} />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold">₹{totalPaid.toLocaleString('en-IN')}</span>
            <span className="text-xs text-blue-100">INR</span>
          </div>
        </div>
        
        <div className="card p-6 border-none bg-amber-500 text-white shadow-xl shadow-amber-100 dark:shadow-none">
          <div className="flex items-center justify-between mb-4 text-amber-100">
            <span className="text-xs font-bold uppercase tracking-widest">Outstanding</span>
            <Clock size={20} />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold">₹{totalPending.toLocaleString('en-IN')}</span>
            <span className="text-xs text-amber-100">INR</span>
          </div>
        </div>

        <div className="card p-6 border-none bg-slate-800 text-white shadow-xl shadow-slate-200 dark:shadow-none">
          <div className="flex items-center justify-between mb-4 text-slate-400">
            <span className="text-xs font-bold uppercase tracking-widest">Active Plan</span>
            <Wallet size={20} />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold">MediCare Plus+</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-2">Valid until Dec 2026</p>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Receipt size={20} className="text-blue-600" />
            Transaction History
          </h3>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input type="text" placeholder="Search bills..." className="input-field pl-9 py-2 text-xs w-48" />
            </div>
            <button className="btn-outline py-2 px-3 text-xs flex items-center gap-2">
              <Filter size={14} /> Filter
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
              {filteredTransactions.length === 0 ? (
                <div className="p-16 text-center">
                  <div className="bg-slate-50 dark:bg-slate-800 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                    <Receipt size={40} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">No Transactions Found</h3>
                  <p className="text-slate-500 dark:text-slate-400">Your payment history will appear here once available.</p>
                </div>
              ) : (
              <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-wider font-bold">
                <th className="px-6 py-4">Service Details</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Method</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredTransactions.map((txn) => (
                <tr key={txn.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{txn.serviceName}</p>
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter mt-0.5">{txn.provider}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                    {(() => {
                      const d: any = (txn as any).date;
                      const jsDate = d?.toDate ? d.toDate() : new Date(d);
                      return jsDate.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
                    })()}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      {txn.method || 'Online'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center font-bold text-slate-900 dark:text-white">
                      <IndianRupee size={14} className="text-slate-400" />
                      {txn.amount.toLocaleString('en-IN')}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(txn.status)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {txn.status === 'paid' ? (
                      <button className="text-blue-600 dark:text-blue-400 text-xs font-bold hover:underline flex items-center gap-1 ml-auto">
                        <Download size={14} /> Receipt
                      </button>
                    ) : (
                      <button 
                        onClick={() => setShowPaymentModal(txn)}
                        className="btn-primary py-1.5 px-4 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 ml-auto"
                      >
                        Pay Now <ArrowRight size={12} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
              </table>
              )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        <div className="card p-8 bg-gradient-to-br from-slate-800 to-slate-900 text-white border-none shadow-xl">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <CreditCard size={24} className="text-blue-400" />
            Saved Payment Methods
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 group hover:bg-white/10 transition-all cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="w-12 h-8 bg-slate-700 rounded-lg flex items-center justify-center font-bold italic text-white">VISA</div>
                <div>
                  <p className="text-sm font-bold">•••• •••• •••• 4242</p>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">Expires 12/28</p>
                </div>
              </div>
              <div className="w-5 h-5 rounded-full border-2 border-blue-400 flex items-center justify-center">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 border-dashed hover:bg-white/10 transition-all cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="w-12 h-8 bg-slate-700/50 rounded-lg flex items-center justify-center border border-dashed border-white/20">
                  <Plus size={16} className="text-slate-400" />
                </div>
                <p className="text-sm font-bold text-slate-400">Add New Card</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card p-8">
          <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6">Payment Support</h3>
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 flex-shrink-0">
                <Info size={20} />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">Need Help with Billing?</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  If you find any discrepancy in your bills, please contact our billing department immediately.
                </p>
              </div>
            </div>
            <button className="w-full btn-outline py-3 flex items-center justify-center gap-2 font-bold uppercase tracking-widest text-xs">
              Contact Billing Dept
            </button>
          </div>
        </div>
      </div>

      {/* Modern Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl animate-scaleIn border border-blue-100 dark:border-slate-800">
            <div className="p-8 bg-[#1E88E5] text-white">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-black uppercase tracking-widest text-blue-100 mb-1">Secure Checkout</h3>
                  <p className="text-3xl font-bold flex items-center">
                    <IndianRupee size={24} /> {showPaymentModal.amount.toLocaleString('en-IN')}
                  </p>
                </div>
                <button 
                  onClick={() => setShowPaymentModal(null)}
                  className="p-2 hover:bg-white/10 rounded-xl transition-all"
                >
                  <Building2 size={24} />
                </button>
              </div>
              <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-200 mb-1">Service</p>
                <p className="text-sm font-bold truncate">{showPaymentModal.serviceName}</p>
              </div>
            </div>

            <div className="p-8 space-y-6">
              {paymentStep === 'select' && (
                <form onSubmit={handlePayment} className="space-y-6 animate-fadeIn">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Select Payment Method</label>
                    <div className="grid grid-cols-1 gap-3">
                      {[
                        { id: 'upi', label: 'UPI (GPay, PhonePe, Paytm)', icon: Smartphone },
                        { id: 'card', label: 'Debit / Credit Card', icon: CreditCard },
                        { id: 'wallet', label: 'MediCare Wallet', icon: Wallet }
                      ].map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setPaymentMethod(m.id as any)}
                          className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${
                            paymentMethod === m.id 
                              ? 'bg-blue-50 border-[#1E88E5] text-[#1E88E5] shadow-lg shadow-blue-100 dark:bg-blue-900/20 dark:shadow-none' 
                              : 'bg-slate-50 border-slate-100 text-slate-400 dark:bg-slate-800 dark:border-slate-700'
                          }`}
                        >
                          <div className={`p-2 rounded-xl ${paymentMethod === m.id ? 'bg-[#1E88E5] text-white' : 'bg-white dark:bg-slate-700'}`}>
                            <m.icon size={20} />
                          </div>
                          <span className="text-sm font-black uppercase tracking-tight">{m.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <button type="submit" className="w-full p-5 bg-[#1E88E5] text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-blue-200 dark:shadow-none transition-all active:scale-95">
                    Authorize Payment
                  </button>
                </form>
              )}

              {paymentStep === 'processing' && (
                <div className="py-12 flex flex-col items-center justify-center gap-6 animate-fadeIn text-center">
                  <div className="relative">
                    <div className="w-20 h-20 border-4 border-slate-100 dark:border-slate-800 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-[#1E88E5] border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <div>
                    <h4 className="text-xl font-black text-slate-900 dark:text-white mb-2">Processing Transaction</h4>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Encrypting payment tokens...</p>
                  </div>
                </div>
              )}

              {paymentStep === 'success' && (
                <div className="py-12 flex flex-col items-center justify-center gap-6 animate-fadeIn text-center">
                  <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center text-emerald-500 shadow-xl shadow-emerald-100 dark:shadow-none">
                    <CheckCircle2 size={48} />
                  </div>
                  <div>
                    <h4 className="text-xl font-black text-slate-900 dark:text-white mb-2">Payment Successful</h4>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Receipt generated (TXN-{Math.floor(Math.random()*9000)+1000})</p>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-center gap-2 text-slate-400 text-[9px] font-black uppercase tracking-widest">
                <ShieldCheck size={14} className="text-emerald-500" />
                PCI-DSS Level 1 Secure
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
