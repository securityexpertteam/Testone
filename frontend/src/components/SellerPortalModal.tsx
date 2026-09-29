import React, { useState, useMemo, useRef } from 'react';
import {
  X, Store, Lock, ArrowRight, ShieldCheck, Mail, Key, Package, Truck, Heart,
  LogOut, CheckCircle2, Check, MapPin, RefreshCw, Plus, Edit2,
  Trash2, Search, AlertTriangle, Download, Printer, BarChart3, Bell,
  Settings, HelpCircle, Shield, Eye, Send, Building2,
  TrendingUp, Layers, Tag
} from 'lucide-react';
import { 
  SellerProductItem, 
  SellerOrderItem, 
  InventoryLog 
} from '../data/sellerData';
import { API_BASE_URL } from '../utils/api';
import { displayValue, organization } from '../config/organization';

interface SellerPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SellerTab = 
  | 'dashboard'
  | 'products'
  | 'categories'
  | 'donations'
  | 'inventory'
  | 'orders'
  | 'shipping'
  | 'analytics'
  | 'payouts'
  | 'notifications'
  | 'profile'
  | 'settings'
  | 'support'
  | 'security';

export const SellerPortalModal: React.FC<SellerPortalModalProps> = ({ isOpen, onClose }) => {
  // Auth state
  const [authView, setAuthView] = useState<'login' | 'register' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [jwtToken, setJwtToken] = useState<string | null>(null);
  const [authError, setAuthError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [portalSaveStatus, setPortalSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');

  // Registration form
  const [regStoreName, setRegStoreName] = useState('');
  const [regSellerName, setRegSellerName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regGstin, setRegGstin] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');

  // Active section tab
  const [activeTab, setActiveTab] = useState<SellerTab>('dashboard');
  const [toast, setToast] = useState<string | null>(null);

  // Data state
  const [products, setProducts] = useState<SellerProductItem[]>([]);
  const [orders, setOrders] = useState<SellerOrderItem[]>([]);
  const [pickupCodes, setPickupCodes] = useState<Record<string, string>>({});
  const [inventoryLogs, setInventoryLogs] = useState<InventoryLog[]>([]);
  const [payouts, setPayouts] = useState<Record<string, unknown>[]>([]);
  const [profile, setProfile] = useState<Record<string, unknown>>({});
  const profileSettings = (profile.settings && typeof profile.settings === 'object' ? profile.settings : {}) as Record<string, unknown>;
  const profilePolicies = (profile.policies && typeof profile.policies === 'object' ? profile.policies : {}) as Record<string, unknown>;
  const profileNotifications = (profileSettings.notificationsEnabled && typeof profileSettings.notificationsEnabled === 'object'
    ? profileSettings.notificationsEnabled
    : {}) as Record<string, boolean>;
  const shippingRegions = Array.from(new Set(products.map(product => product.shippingAvailability).filter(Boolean)));
  const deliveryHubs = Array.from(new Set(orders.map(order => order.nearbyNodalPoint).filter(Boolean)));

  // Filters & Search
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('All');
  const [orderStatusFilter, setOrderStatusFilter] = useState('All');

  // Modals & Drawers
  const [selectedProductForPreview, setSelectedProductForPreview] = useState<SellerProductItem | null>(null);
  const [editingProduct, setEditingProduct] = useState<SellerProductItem | null>(null);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [confirmedRaffleDrawDate, setConfirmedRaffleDrawDate] = useState('');
  const raffleDrawDateInput = useRef<HTMLInputElement>(null);
  const [activeInvoiceOrder, setActiveInvoiceOrder] = useState<SellerOrderItem | null>(null);

  // Support ticket form
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketCategory, setTicketCategory] = useState('Order Dispatch');
  const [ticketDesc, setTicketDesc] = useState('');
  const [ticketsList, setTicketsList] = useState<Record<string, any>[]>([]);

  // Notifications
  const [notifications, setNotifications] = useState<Record<string, any>[]>([]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const savePortalState = async (updates: Record<string, unknown>) => {
    if (!jwtToken) throw new Error('Seller session is missing');
    setPortalSaveStatus('saving');
    try {
      const response = await fetch(`${API_BASE_URL}/seller/portal/state`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwtToken}` },
        body: JSON.stringify(updates)
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || 'MongoDB save failed');
      setPortalSaveStatus('saved');
      return result.state;
    } catch (error) {
      setPortalSaveStatus('error');
      throw error;
    }
  };

  const handleDeleteProduct = async (product: SellerProductItem) => {
    if (!window.confirm(`Permanently delete "${product.name}"?`)) return;
    if (!jwtToken) return;
    setPortalSaveStatus('saving');
    try {
      const response = await fetch(`${API_BASE_URL}/seller/portal/products/${encodeURIComponent(product.id)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${jwtToken}` }
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || 'Delete failed');
      setProducts(result.products);
      setPortalSaveStatus('saved');
      showToast(`${product.name} deleted from MongoDB.`);
    } catch (error) {
      setPortalSaveStatus('error');
      showToast(error instanceof Error ? error.message : 'Product could not be deleted.');
    }
  };

  const loadPortalState = async (token: string) => {
    const response = await fetch(`${API_BASE_URL}/seller/portal/state`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const result = await response.json();
    if (!response.ok || !result.success || !result.state) {
      throw new Error(result.message || 'Could not load seller records from MongoDB');
    }
    const state = result.state;
    setProducts(state.products || []);
    setOrders(state.orders || []);
    setInventoryLogs(state.inventoryLogs || []);
    setPayouts(state.payouts || []);
    setTicketsList(state.tickets || []);
    setNotifications((state.notifications || []).map((notification: Record<string, unknown>) => ({
      ...notification,
      time: notification.time || notification.timestamp || ''
    })));
    setProfile(state.profile || {});
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);
    setAuthError('');
    try {
      const response = await fetch(`${API_BASE_URL}/auth/seller/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const result = await response.json();
      if (!response.ok || !result.token) throw new Error(result.message || 'Seller login failed');
      await loadPortalState(result.token);
      setJwtToken(result.token);
      setIsLoggedIn(true);
      showToast('Seller data loaded from MongoDB.');
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Seller login failed');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);
    setAuthError('');
    try {
      const response = await fetch(`${API_BASE_URL}/auth/seller/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeName: regStoreName,
          sellerName: regSellerName,
          email: regEmail,
          phone: regPhone,
          gstin: regGstin,
          password: regPassword
        })
      });
      const result = await response.json();
      if (!response.ok || !result.token) throw new Error(result.message || 'Seller registration failed');
      await loadPortalState(result.token);
      setJwtToken(result.token);
      setIsLoggedIn(true);
      showToast('Seller account created and data loaded from MongoDB.');
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Seller registration failed');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleStockAdjust = async (productId: string, delta: number, reason: string) => {
    const product = products.find(item => item.id === productId);
    if (!product) return;
    const nextQty = Math.max(0, product.stockQuantity + delta);
    try {
      const response = await fetch(`${API_BASE_URL}/seller/portal/products/${encodeURIComponent(productId)}/stock`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwtToken}` },
        body: JSON.stringify({ newQuantity: nextQty, reason })
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || 'Inventory update failed');
      setProducts(previous => previous.map(item => item.id === productId ? result.product : item));
      setInventoryLogs(result.inventoryLogs);
      showToast('Inventory adjustment saved to MongoDB.');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Inventory update failed; MongoDB was not changed.');
    }
  };

  const handleOrderStatusChange = async (orderId: string, newStatus: SellerOrderItem['status']) => {
    if (!jwtToken) return;
    const order = orders.find(candidate => candidate.orderId === orderId);
    if (!order) return;
    const courierPartner = order.courierPartner;
    const trackingNumber = order.trackingNumber;
    try {
      const response = await fetch(`${API_BASE_URL}/seller/portal/orders/${encodeURIComponent(orderId)}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwtToken}` },
        body: JSON.stringify({ status: newStatus, courierPartner, trackingNumber })
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || 'Order status update failed');
      setOrders(previous => previous.map(item => item.orderId === orderId ? result.order : item));
      showToast(newStatus === 'Ready for Pickup' ? 'Buyer notified by email with a one-time pickup code.' : `Order #${orderId} status saved to MongoDB.`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Order update failed; MongoDB was not changed.');
    }
  };

  const handlePickupClaim = async (orderId: string) => {
    if (!jwtToken) return;
    try {
      const response = await fetch(`${API_BASE_URL}/seller/portal/orders/${encodeURIComponent(orderId)}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwtToken}` },
        body: JSON.stringify({ code: pickupCodes[orderId] || '' })
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || 'Pickup could not be checked in');
      setOrders(previous => previous.map(item => item.orderId === orderId ? result.order : item));
      setPickupCodes(previous => ({ ...previous, [orderId]: '' }));
      showToast('Pickup code accepted. Order marked delivered in MongoDB.');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Pickup check-in failed.');
    }
  };

  const downloadOrderSummary = () => {
    if (!orders.length) return showToast('There are no MongoDB orders to export yet.');
    const rows = orders.map(order => ({
      nodalPoint: order.nearbyNodalPoint || 'Unassigned', community: order.community, orderId: order.orderId,
      orderDate: order.orderDate, status: order.status, customer: order.customerName,
      amount: order.totalAmount, paymentStatus: order.paymentStatus, paymentMethod: order.paymentMethod
    }));
    const columns = Object.keys(rows[0]) as (keyof typeof rows[number])[];
    const escapeCsv = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const csv = [columns.join(','), ...rows.map(row => columns.map(column => escapeCsv(row[column])).join(','))].join('\r\n');
    const url = URL.createObjectURL(new Blob(['\ufeff', csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = 'seller-orders-nodal-payments.csv'; link.click(); URL.revokeObjectURL(url);
  };

  const handleRaiseTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject || !ticketDesc) return;
    try {
      const response = await fetch(`${API_BASE_URL}/seller/portal/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwtToken}` },
        body: JSON.stringify({ subject: ticketSubject, category: ticketCategory, description: ticketDesc })
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || 'Ticket could not be saved');
      setTicketsList(previous => [result.ticket, ...previous]);
      setTicketSubject('');
      setTicketDesc('');
      showToast('Support ticket saved to MongoDB.');
    } catch {
      showToast('Ticket could not be saved; MongoDB was not changed.');
    }
  };

  // Metrics for Dashboard
  const metrics = useMemo(() => {
    const totalProd = products.length;
    const totalStock = products.reduce((acc, p) => acc + p.stockQuantity, 0);
    const lowStock = products.filter(p => p.stockQuantity > 0 && p.stockQuantity < 10).length;
    const outOfStock = products.filter(p => p.stockQuantity === 0).length;
    const pendingOrd = orders.filter(o => o.status === 'Pending').length;
    const shippedOrd = orders.filter(o => o.status === 'Shipped').length;
    const deliveredOrd = orders.filter(o => o.status === 'Delivered').length;
    const cancelledOrd = orders.filter(o => o.status === 'Cancelled').length;
    const totalRevenue = orders.reduce((acc, o) => acc + o.totalAmount, 0);
    const moneyReceived = orders.filter(order => ['PAID', 'SUCCESS'].includes(order.paymentStatus.toUpperCase()) && !['Cancelled', 'Refunded'].includes(order.status)).reduce((total, order) => total + order.totalAmount, 0);
    const awaitingPayment = orders.filter(order => order.paymentStatus.toUpperCase() === 'PAY_ON_DELIVERY_CONFIRMED' && !['Cancelled', 'Refunded'].includes(order.status)).reduce((total, order) => total + order.totalAmount, 0);
    const totalDonation = orders.reduce((acc, o) => acc + o.donationTotal, 0);

    return {
      totalProd, totalStock, lowStock, outOfStock,
      pendingOrd, shippedOrd, deliveredOrd, cancelledOrd,
      totalRevenue, totalDonation, moneyReceived, awaitingPayment
    };
  }, [products, orders]);

  const pendingPayoutTotal = payouts
    .filter(payout => payout.status === 'Processing' || payout.status === 'Scheduled')
    .reduce((total, payout) => total + Number(payout.netPayout || 0), 0);
  const completedPayoutTotal = payouts
    .filter(payout => payout.status === 'Completed')
    .reduce((total, payout) => total + Number(payout.netPayout || 0), 0);
  const nextPayout = payouts.find(payout => payout.status === 'Processing' || payout.status === 'Scheduled');
  const grossPayoutSales = payouts.reduce((total, payout) => total + Number(payout.grossSales || 0), 0);
  const platformFeeTotal = payouts.reduce((total, payout) => total + Number(payout.platformFee || 0), 0);
  const productCategories = Array.from(new Set(products.map(product => product.category).filter(Boolean))).sort();
  const totalUnitsSold = orders.reduce((total, order) => total + order.items.reduce((units, item) => units + item.quantity, 0), 0);
  const averageOrderValue = orders.length ? metrics.totalRevenue / orders.length : 0;
  const cancellationRate = orders.length ? (metrics.cancelledOrd / orders.length) * 100 : 0;
  const revenueByCategory = new Map<string, number>();
  const donationsByCause = new Map<string, number>();
  orders.flatMap(order => order.items).forEach(item => {
    const product = products.find(candidate => candidate.id === item.productId);
    const category = product?.category || 'Other';
    const cause = item.donationCause || product?.donationCause;
    revenueByCategory.set(category, (revenueByCategory.get(category) || 0) + item.quantity * item.unitPrice);
    if (cause) donationsByCause.set(cause, (donationsByCause.get(cause) || 0) + item.donationAmount);
  });

  const formatLocalDateTime = (date: Date) => new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
  const minimumRaffleDrawDate = formatLocalDateTime(new Date(Date.now() + 32 * 24 * 60 * 60 * 1000));
  const savedDrawDate = editingProduct?.raffle?.drawDate || '';
  const parsedSavedDrawDate = new Date(savedDrawDate);
  const raffleDrawDateDefault = savedDrawDate && Number.isFinite(parsedSavedDrawDate.getTime())
    ? formatLocalDateTime(parsedSavedDrawDate)
    : '';

  const saveSellerProfile = async (nextProfile: Record<string, unknown>) => {
    try {
      const state = await savePortalState({ profile: nextProfile });
      setProfile(state.profile);
      showToast('Seller profile/settings saved to MongoDB.');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Profile/settings could not be saved to MongoDB.');
    }
  };

  const downloadPayoutStatement = () => {
    if (!payouts.length) {
      showToast('No payout records exist in MongoDB yet.');
      return;
    }
    const columns = ['period', 'grossSales', 'platformFee', 'taxDeductions', 'donationRemittance', 'refundDeductions', 'netPayout', 'status', 'payoutDate', 'utrNumber', 'bankAccount'];
    const escapeCsv = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const csv = [columns.join(','), ...payouts.map(payout => columns.map(column => escapeCsv(payout[column])).join(','))].join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'seller-payouts.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs overflow-hidden">
      <div className="relative w-full h-full bg-white shadow-2xl overflow-hidden border-0 flex flex-col">
        
        {/* Toast Alert */}
        {toast && (
          <div className="absolute top-4 right-4 z-50 bg-slate-900 text-white text-xs px-4 py-2.5 rounded-xl shadow-lg border border-slate-700 flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toast}</span>
          </div>
        )}

        {/* Global Header */}
        <div className="bg-[#0e4429] text-white px-5 py-3.5 flex items-center justify-between shrink-0 border-b border-emerald-900/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-800 text-amber-300 flex items-center justify-center shadow-inner">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold font-serif">Rural Artisan & Seller Portal</h3>
                {isLoggedIn && (
                  <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                    {String(profile.sellerId || '')} • Seller Account
                  </span>
                )}
              </div>
              <p className="text-[11px] text-emerald-200">
                100% Non-Profit Producer Ecosystem • {organization.legalName || 'Organization Name'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isLoggedIn && (
              <button
                onClick={() => {
                  setIsLoggedIn(false);
                  setJwtToken(null);
                  showToast('Logged out of Seller Portal.');
                }}
                className="px-2.5 py-1 rounded-lg bg-emerald-800/80 hover:bg-rose-700 text-emerald-100 hover:text-white text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            )}
            {!isLoggedIn && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-800/60 transition cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

                {isLoggedIn && <span className={`text-[10px] ${portalSaveStatus === 'error' ? 'text-rose-200' : 'text-emerald-100'}`}>{portalSaveStatus === 'saving' ? 'Saving to MongoDB...' : portalSaveStatus === 'saved' ? 'Saved in MongoDB' : 'MongoDB save failed'}</span>}
        {/* ======================================================== */}
        {/* VIEW 1: AUTHENTICATION FLOW (LOGIN, REGISTER, FORGOT)   */}
        {/* ======================================================== */}
        {!isLoggedIn ? (
          <div className="p-6 space-y-5 bg-[#fafaf8] overflow-y-auto">
            {/* Auth Mode Tabs */}
            <div className="flex border-b border-slate-200">
              <button
                onClick={() => setAuthView('login')}
                className={`flex-1 pb-2 text-xs font-bold border-b-2 text-center transition cursor-pointer ${
                  authView === 'login' ? 'border-emerald-700 text-emerald-800' : 'border-transparent text-slate-500'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setAuthView('register')}
                className={`flex-1 pb-2 text-xs font-bold border-b-2 text-center transition cursor-pointer ${
                  authView === 'register' ? 'border-emerald-700 text-emerald-800' : 'border-transparent text-slate-500'
                }`}
              >
                Register SHG / Artisan
              </button>
              <button
                onClick={() => setAuthView('forgot')}
                className={`flex-1 pb-2 text-xs font-bold border-b-2 text-center transition cursor-pointer ${
                  authView === 'forgot' ? 'border-emerald-700 text-emerald-800' : 'border-transparent text-slate-500'
                }`}
              >
                Reset Password
              </button>
            </div>

            {/* Tab 1: Login */}
            {authView === 'login' && (
              <form onSubmit={handleLogin} className="space-y-3.5 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Seller Registered Email / ID *</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-emerald-600 bg-slate-50/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Password / Security Key *</label>
                  <div className="relative">
                    <Key className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-emerald-600 bg-slate-50/50 font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isAuthenticating}
                  className="w-full py-2.5 rounded-xl bg-[#0e4429] hover:bg-[#08301d] text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  <Lock className="w-3.5 h-3.5 text-emerald-300" />
                  <span>{isAuthenticating ? 'Loading seller data...' : 'Sign In to Seller Dashboard'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                {authError && <p className="text-xs text-rose-700" role="alert">{authError}</p>}
              </form>
            )}

            {/* Tab 2: Register */}
            {authView === 'register' && (
              <form
                onSubmit={handleRegister}
                className="space-y-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs"
              >
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Cluster / Cooperative / SHG Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Pochampally Organic Weavers SHG"
                    value={regStoreName}
                    onChange={(e) => setRegStoreName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-emerald-600"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Primary Representative *</label>
                    <input
                      type="text"
                      required
                      placeholder="Lakshmi Devi"
                      value={regSellerName}
                      onChange={(e) => setRegSellerName(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Phone / WhatsApp *</label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 98490 12345"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-emerald-600"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Business Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="weaver@cooperative.org"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">GSTIN or Village SHG Reg. Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter GSTIN or village SHG registration number"
                    value={regGstin}
                    onChange={(e) => setRegGstin(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Password (8 characters minimum) *</label>
                  <input
                    type="password"
                    minLength={8}
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-emerald-600"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isAuthenticating}
                  className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition cursor-pointer"
                >
                  {isAuthenticating ? 'Creating account...' : 'Create Seller Account'}
                </button>
                {authError && <p className="text-xs text-rose-700" role="alert">{authError}</p>}
              </form>
            )}

            {/* Tab 3: Forgot Password */}
            {authView === 'forgot' && (
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <p className="text-xs text-slate-600">
                  Enter your registered seller email or WhatsApp number. A one-time verification token (OTP) will be dispatched instantly.
                </p>
                <input
                  type="text"
                  placeholder="Enter your registered seller email"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-emerald-600"
                />
                <button
                  onClick={() => {
                    showToast('OTP sent to registered phone/email. Check messages.');
                    setAuthView('login');
                  }}
                  className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition cursor-pointer"
                >
                  Send OTP Reset Token
                </button>
              </div>
            )}
          </div>
        ) : (
          /* ======================================================== */
          /* VIEW 2: FULL SELLER PORTAL WITH ALL 15 SECTIONS          */
          /* ======================================================== */
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-[#fafaf8]">
            
            {/* Sidebar Navigation */}
            <div className="w-full md:w-60 bg-white border-b md:border-b-0 md:border-r border-slate-200 flex flex-row md:flex-col overflow-x-auto md:overflow-y-auto shrink-0 p-2 md:p-3 space-x-1 md:space-x-0 md:space-y-1">
              <div className="hidden md:block px-3 py-2 mb-2 bg-emerald-50/80 rounded-xl border border-emerald-100">
                <p className="text-[11px] font-bold text-emerald-950 truncate">{String(profile.storeName || 'Seller Store')}</p>
                <p className="text-[10px] text-emerald-700 font-mono">ID: {String(profile.sellerId || '')}</p>
              </div>

              {[
                { id: 'dashboard', label: '1. Dashboard', icon: BarChart3 },
                { id: 'products', label: '2. Products', icon: Package },
                { id: 'categories', label: '3. Categories', icon: Layers },
                { id: 'donations', label: '4. Donations', icon: Heart },
                { id: 'inventory', label: '5. Inventory', icon: RefreshCw },
                { id: 'orders', label: '6. Orders', icon: Truck },
                { id: 'shipping', label: '7. Shipping & ETA', icon: MapPin },
                { id: 'analytics', label: '8. Analytics', icon: TrendingUp },
                { id: 'payouts', label: '9. Payouts', icon: Download },
                { id: 'notifications', label: '10. Alerts', icon: Bell },
                { id: 'profile', label: '11. Store Profile', icon: Building2 },
                { id: 'settings', label: '12. Settings', icon: Settings },
                { id: 'support', label: '13. Help & Tickets', icon: HelpCircle },
                { id: 'security', label: '14. Security & Audit', icon: Shield }
              ].map(tab => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as SellerTab)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer text-left ${
                      active
                        ? 'bg-emerald-800 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${active ? 'text-amber-300' : 'text-slate-500'}`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Main Content Workspace */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">

              {/* ---------------------------------------------------- */}
              {/* TAB 1: SELLER DASHBOARD                              */}
              {/* ---------------------------------------------------- */}
              {activeTab === 'dashboard' && (
                <div className="space-y-6">
                  {/* Top Header Metrics Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
                      <p className="text-[11px] text-slate-500 font-medium">Total Products</p>
                      <p className="text-2xl font-bold text-slate-900 mt-1">{metrics.totalProd}</p>
                      <span className="text-[10px] text-emerald-700 font-semibold">{metrics.totalStock} units in stock</span>
                    </div>

                    <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
                      <p className="text-[11px] text-slate-500 font-medium">Pending Orders</p>
                      <p className="text-2xl font-bold text-amber-600 mt-1">{metrics.pendingOrd}</p>
                      <span className="text-[10px] text-amber-700 font-semibold">Ready to pack & dispatch</span>
                    </div>

                    <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
                      <p className="text-[11px] text-slate-500 font-medium">Gross Revenue</p>
                      <p className="text-2xl font-bold text-slate-900 mt-1">₹{metrics.totalRevenue.toLocaleString('en-IN')}</p>
                      <span className="text-[10px] text-emerald-700 font-semibold">100% compliant Section 8</span>
                    </div>

                    <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
                      <p className="text-[11px] text-slate-500 font-medium">Donation Generated</p>
                      <p className="text-2xl font-bold text-emerald-700 mt-1">₹{metrics.totalDonation.toLocaleString('en-IN')}</p>
                      <span className="text-[10px] text-emerald-800 font-semibold">Based on MongoDB order totals</span>
                    </div>
                  </div>

                  {/* Stock Status Bar */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-emerald-950">Active Orders Shipped</p>
                        <p className="text-lg font-bold text-emerald-800">{metrics.shippedOrd} in transit</p>
                      </div>
                      <Truck className="w-6 h-6 text-emerald-600" />
                    </div>

                    <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-200 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-amber-950">Low Stock Alert (&lt; 10)</p>
                        <p className="text-lg font-bold text-amber-800">{metrics.lowStock} products</p>
                      </div>
                      <AlertTriangle className="w-6 h-6 text-amber-600" />
                    </div>

                    <div className="p-3.5 bg-rose-50/60 rounded-xl border border-rose-200 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-rose-950">Out of Stock</p>
                        <p className="text-lg font-bold text-rose-800">{metrics.outOfStock} products</p>
                      </div>
                      <X className="w-6 h-6 text-rose-600" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-4 bg-white rounded-2xl border border-slate-200">
                      <p className="text-xs font-bold text-slate-500">Payments recorded as received</p>
                      <p className="text-2xl font-black text-emerald-800">₹{metrics.moneyReceived.toLocaleString('en-IN')}</p>
                      <p className="text-[11px] text-slate-500">Based on MongoDB orders marked PAID or SUCCESS.</p>
                    </div>
                    <div className="p-4 bg-white rounded-2xl border border-amber-200">
                      <p className="text-xs font-bold text-slate-500">Pay on delivery</p>
                      <p className="text-2xl font-black text-amber-800">₹{metrics.awaitingPayment.toLocaleString('en-IN')}</p>
                      <p className="text-[11px] text-slate-500">Confirmed orders still awaiting collection; excluded from received totals.</p>
                    </div>
                  </div>

                  {/* Recent Orders Overview */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900 text-sm">Recent Bookings & Hyderabad Deliveries</h4>
                      <button 
                        onClick={() => setActiveTab('orders')}
                        className="text-xs text-emerald-700 font-bold hover:underline"
                      >
                        View All Orders →
                      </button>
                    </div>

                    <div className="space-y-2">
                      {orders.slice(0, 3).map(o => (
                        <div key={o.orderId} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-slate-800">{o.orderId}</span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                {o.status}
                              </span>
                            </div>
                            <p className="text-slate-600 mt-0.5">{o.customerName} • {o.community} ({o.nearbyNodalPoint})</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-slate-900">₹{o.totalAmount.toLocaleString('en-IN')}</p>
                            <p className="text-[10px] text-emerald-700">Donation: ₹{o.donationTotal}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ---------------------------------------------------- */}
              {/* TAB 2: PRODUCT MANAGEMENT                            */}
              {/* ---------------------------------------------------- */}
              {activeTab === 'products' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm sm:text-base">Product Catalog Management</h4>
                      <p className="text-xs text-slate-500">Add, edit, manage SKU, pricing, images, and live status.</p>
                    </div>
                    <button
                      onClick={() => { setConfirmedRaffleDrawDate(''); setEditingProduct(null); setIsAddProductOpen(true); }}
                      className="px-3 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add New Product</span>
                    </button>
                  </div>

                  {/* Filter & Search Bar */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        placeholder="Search product name or SKU..."
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-emerald-600"
                      />
                    </div>
                    <select
                      value={productCategoryFilter}
                      onChange={(e) => setProductCategoryFilter(e.target.value)}
                      className="px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-semibold text-slate-700"
                    >
                      <option value="All">All Categories</option>
                      {productCategories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>

                  {/* Products Table */}
                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-slate-700">
                        <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase border-b border-slate-200">
                          <tr>
                            <th className="p-3">Product</th>
                            <th className="p-3">SKU & Barcode</th>
                            <th className="p-3">Category</th>
                            <th className="p-3">Price</th>
                            <th className="p-3">Stock</th>
                            <th className="p-3">Donation %</th>
                            <th className="p-3">Status</th>
                            <th className="p-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {products
                            .filter(p => {
                              const matchSearch = p.name.toLowerCase().includes(productSearch.toLowerCase()) || p.sku.toLowerCase().includes(productSearch.toLowerCase());
                              const matchCat = productCategoryFilter === 'All' || p.category === productCategoryFilter;
                              return matchSearch && matchCat;
                            })
                            .map(prod => (
                              <tr key={prod.id} className="hover:bg-slate-50/60">
                                <td className="p-3">
                                  <div className="flex items-center gap-2.5">
                                    <img src={prod.images[0]} alt={prod.name} className="w-10 h-10 rounded-lg object-cover border border-slate-200" />
                                    <div>
                                      <p className="font-bold text-slate-900">{prod.name}</p>
                                      <p className="text-[10px] text-slate-500">{prod.weight} • {prod.shippingAvailability}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="p-3 font-mono text-[11px]">
                                  <span className="font-bold text-slate-800">{prod.sku}</span>
                                  <span className="block text-[10px] text-slate-400">{prod.barcode}</span>
                                </td>
                                <td className="p-3">{prod.category}</td>
                                <td className="p-3">
                                  <span className="font-bold text-slate-900">₹{prod.discountPrice || prod.price}</span>
                                  {prod.discountPrice && <span className="line-through text-slate-400 ml-1">₹{prod.price}</span>}
                                </td>
                                <td className="p-3">
                                  <span className={`font-bold ${prod.stockQuantity === 0 ? 'text-rose-600' : prod.stockQuantity < 10 ? 'text-amber-600' : 'text-emerald-700'}`}>
                                    {prod.stockQuantity} units
                                  </span>
                                </td>
                                <td className="p-3 font-bold text-emerald-800">{prod.donationPercentage}%</td>
                                <td className="p-3">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    prod.status === 'Active' ? 'bg-emerald-100 text-emerald-800' :
                                    prod.status === 'Out of stock' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'
                                  }`}>
                                    {prod.status}
                                  </span>
                                </td>
                                <td className="p-3 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      onClick={() => setSelectedProductForPreview(prod)}
                                      title="Preview product"
                                      className="p-1 text-slate-500 hover:text-emerald-700 cursor-pointer"
                                    >
                                      <Eye className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        setConfirmedRaffleDrawDate('');
                                        setEditingProduct(prod);
                                        setIsAddProductOpen(false);
                                      }}
                                      title="Edit product"
                                      className="p-1 text-slate-500 hover:text-blue-700 cursor-pointer"
                                    >
                                      <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => void handleDeleteProduct(prod)}
                                      title="Delete product permanently"
                                      className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ---------------------------------------------------- */}
              {/* TAB 3: PRODUCT CATEGORIES                            */}
              {/* ---------------------------------------------------- */}
              {activeTab === 'categories' && (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm sm:text-base">Product & Social Cause Categories</h4>
                    <p className="text-xs text-slate-500">Standardized product categories configured for Section 8 rural artisan collectives.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {productCategories.map(category => (
                      <div key={category} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
                        <div className="flex items-center gap-2">
                          <Tag className="w-4 h-4 text-emerald-700" />
                          <h5 className="font-bold text-slate-900 text-xs sm:text-sm">{category}</h5>
                        </div>
                        <div className="pt-2 flex justify-between items-center text-[10px] text-slate-400">
                          <span>Catalog Products: {products.filter(p => p.category === category).length}</span>
                          <span className="text-emerald-700 font-bold">100% Aid Linked</span>
                        </div>
                      </div>
                    ))}
                    {productCategories.length === 0 && <p className="text-xs text-slate-500">Categories appear here after products are saved in MongoDB.</p>}
                  </div>
                </div>
              )}

              {/* ---------------------------------------------------- */}
              {/* TAB 4: DONATION CONFIGURATION                        */}
              {/* ---------------------------------------------------- */}
              {activeTab === 'donations' && (
                <div className="space-y-5">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm sm:text-base">Donation & Social Impact Settings</h4>
                    <p className="text-xs text-slate-500">Configure donation percentage per item and live impact statements.</p>
                  </div>

                  <div className="p-5 bg-emerald-50/80 rounded-2xl border border-emerald-200 space-y-3">
                    <div className="flex items-center gap-2 text-emerald-950 font-bold text-sm">
                      <Heart className="w-4 h-4 text-emerald-700" />
                      <span>Live Example Impact Statement</span>
                    </div>
                    <blockquote className="italic text-xs sm:text-sm text-emerald-900 border-l-4 border-emerald-600 pl-3">
                      {String(products[0]?.impactStatement || 'No impact statement has been saved for this seller catalog yet.')}
                    </blockquote>
                    <p className="text-[11px] text-emerald-800">
                      Impact totals are calculated from recorded MongoDB orders and product donation settings.
                    </p>
                  </div>

                  {/* Cause Selection Breakdown */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 shadow-xs">
                    <h5 className="font-bold text-slate-900 text-xs uppercase text-slate-500 tracking-wider">Associated Causes for {String(profile.storeName || 'Seller')}</h5>
                    <div className="space-y-2 text-xs">
                      {Array.from(donationsByCause.entries()).map(([cause, amount]) => (
                        <div key={cause} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                          <p className="font-bold text-slate-800">{cause}</p>
                          <span className="font-bold text-emerald-700">₹{amount.toLocaleString('en-IN')} Generated</span>
                        </div>
                      ))}
                      {donationsByCause.size === 0 && <p className="p-3 text-slate-500">No donation amounts recorded in MongoDB yet.</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* ---------------------------------------------------- */}
              {/* TAB 5: INVENTORY MANAGEMENT                          */}
              {/* ---------------------------------------------------- */}
              {activeTab === 'inventory' && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm sm:text-base">Inventory & Stock Tracking</h4>
                      <p className="text-xs text-slate-500">Real-time stock controls, batch replenishment, and audit reason logger.</p>
                    </div>
                  </div>

                  {/* Stock Quick Adjustment Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {products.map(p => (
                      <div key={p.id} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between gap-3">
                        <div>
                          <p className="font-bold text-slate-900 text-xs sm:text-sm">{p.name}</p>
                          <p className="text-[10px] text-slate-500 font-mono mt-0.5">SKU: {p.sku} • In Stock: <strong className={p.stockQuantity < 10 ? 'text-amber-600' : 'text-emerald-700'}>{p.stockQuantity}</strong></p>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => handleStockAdjust(p.id, -1, 'Physical Stock Count Audit')}
                            disabled={p.stockQuantity <= 0}
                            className="w-7 h-7 rounded-lg border border-slate-200 hover:bg-slate-100 flex items-center justify-center font-bold text-slate-700 cursor-pointer disabled:opacity-40"
                          >
                            -
                          </button>
                          <span className="w-8 text-center font-bold text-xs">{p.stockQuantity}</span>
                          <button
                            onClick={() => handleStockAdjust(p.id, 10, 'New Production Batch')}
                            className="px-2 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold text-[11px] cursor-pointer"
                          >
                            +10
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Adjustment History Log */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2 shadow-xs">
                    <h5 className="font-bold text-slate-900 text-xs uppercase text-slate-500 tracking-wider">Recent Stock Adjustment Logs</h5>
                    <div className="space-y-1.5 text-xs text-slate-600">
                      {inventoryLogs.map(log => (
                        <div key={log.id} className="p-2.5 rounded-xl bg-slate-50 flex items-center justify-between">
                          <div>
                            <span className="font-bold text-slate-800">{log.productName}</span>
                            <span className="text-[10px] text-slate-500 block">{log.reason} ({log.timestamp})</span>
                          </div>
                          <span className={`font-mono font-bold ${log.changeAmount > 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                            {log.changeAmount > 0 ? `+${log.changeAmount}` : log.changeAmount} ({log.updatedQuantity} total)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ---------------------------------------------------- */}
              {/* TAB 6: SELLER ORDERS                                 */}
              {/* ---------------------------------------------------- */}
              {activeTab === 'orders' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm sm:text-base">Booked Orders & Fulfillment</h4>
                      <p className="text-xs text-slate-500">Plan nodal point workloads, prepare pickup batches, and verify collection codes.</p>
                    </div>
                    <button onClick={downloadOrderSummary} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-emerald-200 text-emerald-900 text-xs font-bold hover:bg-emerald-50"><Download className="w-4 h-4" />Export orders for Excel</button>

                    {/* Status filter pills */}
                    <div className="flex flex-wrap gap-1">
                      {['All', 'Pending', 'Confirmed', 'Packed', 'Ready for Pickup', 'Shipped', 'Delivered', 'Cancelled'].map(st => (
                        <button
                          key={st}
                          onClick={() => setOrderStatusFilter(st)}
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition cursor-pointer ${
                            orderStatusFilter === st
                              ? 'bg-emerald-800 text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {Array.from(orders.reduce((groups, order) => {
                      const point = order.nearbyNodalPoint?.trim() || 'Unassigned nodal point';
                      const item = groups.get(point) || { total: 0, open: 0, ready: 0, delivered: 0 };
                      item.total += 1;
                      if (!['Delivered', 'Cancelled', 'Refunded'].includes(order.status)) item.open += 1;
                      if (order.status === 'Ready for Pickup') item.ready += 1;
                      if (order.status === 'Delivered') item.delivered += 1;
                      groups.set(point, item);
                      return groups;
                    }, new Map<string, { total: number; open: number; ready: number; delivered: number }>()).entries()).map(([point, counts]) => (
                      <div key={point} className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                        <p className="text-xs font-bold text-emerald-950 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{point}</p>
                        <p className="mt-1 text-[11px] text-slate-600">{counts.total} booked · {counts.open} active · {counts.ready} ready · {counts.delivered} collected</p>
                      </div>
                    ))}
                    {orders.length === 0 && <p className="text-xs text-slate-500">Nodal workload will appear as MongoDB orders are booked.</p>}
                  </div>

                  {/* Orders Cards List */}
                  <div className="space-y-3">
                    {orders
                      .filter(o => orderStatusFilter === 'All' || o.status === orderStatusFilter)
                      .map(order => (
                        <div key={order.orderId} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-slate-900 text-xs bg-slate-100 px-2 py-0.5 rounded">
                                {order.orderId}
                              </span>
                              <span className="text-[11px] text-slate-500">{order.orderDate}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                order.status === 'Delivered' ? 'bg-emerald-100 text-emerald-800' :
                                order.status === 'Shipped' ? 'bg-blue-100 text-blue-800' :
                                order.status === 'Pending' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                              }`}>
                                {order.status.toUpperCase()}
                              </span>
                              <span className="font-bold text-slate-900 text-xs">
                                ₹{order.totalAmount.toLocaleString('en-IN')}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            <div>
                              <p className="font-bold text-slate-800">{order.customerName}</p>
                              <p className="text-slate-600">📱 {order.customerMobile} (WhatsApp: {order.customerMobile})</p>
                              <p className="text-slate-500">{order.customerEmail}</p>
                            </div>
                            <div>
                              <p className="font-medium text-slate-700">{order.community}, Hyderabad - {order.pincode}</p>
                              <p className="text-emerald-800 font-bold text-[11px]">Nodal Point: {order.nearbyNodalPoint}</p>
                              {order.courierPartner && (
                                <p className="text-blue-700 text-[11px] mt-0.5">
                                  Courier: {order.courierPartner} (AWB: <span className="font-mono font-bold">{order.trackingNumber}</span>)
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setActiveInvoiceOrder(order)}
                                className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center gap-1 cursor-pointer"
                              >
                                <Printer className="w-3.5 h-3.5" />
                                <span>Print Invoice</span>
                              </button>
                            </div>

                            <div className="flex items-center gap-1.5">
                              {order.status === 'Pending' && (
                                <button
                                  onClick={() => handleOrderStatusChange(order.orderId, 'Confirmed')}
                                  className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-bold text-xs hover:bg-blue-100 cursor-pointer"
                                >
                                  Confirm Order
                                </button>
                              )}
                              {(order.status === 'Pending' || order.status === 'Confirmed') && (
                                <button
                                  onClick={() => handleOrderStatusChange(order.orderId, 'Packed')}
                                  className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 font-bold text-xs hover:bg-amber-100 cursor-pointer"
                                >
                                  Mark as Packed
                                </button>
                              )}
                              {order.status === 'Packed' && (
                                <>
                                  <button onClick={() => handleOrderStatusChange(order.orderId, 'Ready for Pickup')} className="px-2.5 py-1 rounded-lg bg-emerald-800 text-white font-bold text-xs hover:bg-emerald-900 cursor-pointer">Ready at Nodal Point</button>
                                  <button onClick={() => handleOrderStatusChange(order.orderId, 'Shipped')} className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-bold text-xs hover:bg-blue-100 cursor-pointer">Dispatch & Ship</button>
                                </>
                              )}
                              {order.status === 'Ready for Pickup' && (
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span className="text-[11px] text-emerald-800">Buyer emailed pickup code</span>
                                  <button onClick={() => handleOrderStatusChange(order.orderId, 'Ready for Pickup')} className="px-2 py-1 rounded-lg border border-emerald-200 text-emerald-800 font-bold text-xs hover:bg-emerald-50">Resend code</button>
                                  <input aria-label={`Pickup code for ${order.orderId}`} inputMode="numeric" maxLength={6} placeholder="6 digit code" value={pickupCodes[order.orderId] || ''} onChange={event => setPickupCodes(previous => ({ ...previous, [order.orderId]: event.target.value.replace(/\D/g, '').slice(0, 6) }))} className="w-24 px-2 py-1 rounded-lg border border-slate-300 text-xs" />
                                  <button onClick={() => handlePickupClaim(order.orderId)} className="px-2.5 py-1 rounded-lg bg-emerald-700 text-white font-bold text-xs hover:bg-emerald-800">Verify & hand over</button>
                                </div>
                              )}
                              {order.status === 'Shipped' && (
                                <button
                                  onClick={() => handleOrderStatusChange(order.orderId, 'Delivered')}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 cursor-pointer"
                                >
                                  Mark as Delivered
                                </button>
                              )}
                              {order.status !== 'Delivered' && order.status !== 'Cancelled' && (
                                <button
                                  onClick={() => handleOrderStatusChange(order.orderId, 'Cancelled')}
                                  className="px-2.5 py-1 rounded-lg text-rose-600 hover:bg-rose-50 font-bold text-xs cursor-pointer"
                                >
                                  Cancel
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* ---------------------------------------------------- */}
              {/* TAB 7: SHIPPING & FULFILLMENT                        */}
              {/* ---------------------------------------------------- */}
              {activeTab === 'shipping' && (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm sm:text-base">Shipping & Nodal Delivery SLAs</h4>
                    <p className="text-xs text-slate-500">Shipping configuration and delivery hubs attached to this seller&apos;s MongoDB records.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-2">
                      <div className="flex items-center gap-2 text-emerald-800 font-bold">
                        <Truck className="w-4 h-4" />
                        <span>Seller Shipping Policy</span>
                      </div>
                      <p className="text-slate-600">{String(profilePolicies.shipping || 'No shipping policy is saved for this seller.')}</p>
                      <p className="font-semibold text-slate-700">Product shipping regions</p>
                      {shippingRegions.map(region => <p key={region} className="text-slate-600">{region}</p>)}
                      {shippingRegions.length === 0 && <p className="text-slate-500">No product shipping regions are saved.</p>}
                    </div>

                    <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-2">
                      <div className="flex items-center gap-2 text-emerald-800 font-bold">
                        <MapPin className="w-4 h-4" />
                        <span>Order Delivery Hubs</span>
                      </div>
                      {deliveryHubs.map(hub => <p key={hub} className="text-slate-600">{hub}</p>)}
                      {deliveryHubs.length === 0 && <p className="text-slate-500">No delivery hubs appear on MongoDB orders yet.</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* ---------------------------------------------------- */}
              {/* TAB 8: SALES ANALYTICS                               */}
              {/* ---------------------------------------------------- */}
              {activeTab === 'analytics' && (
                <div className="space-y-5">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm sm:text-base">Sales & Aid Analytics</h4>
                    <p className="text-xs text-slate-500">Comprehensive breakdown of sales volume, revenue, and welfare impact.</p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 bg-white rounded-xl border border-slate-200">
                      <p className="text-[10px] text-slate-500">Net Revenue</p>
                      <p className="text-lg font-bold text-slate-900">₹{(metrics.totalRevenue - platformFeeTotal).toLocaleString('en-IN')}</p>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-slate-200">
                      <p className="text-[10px] text-slate-500">Average Order Value</p>
                      <p className="text-lg font-bold text-slate-900">₹{Math.round(averageOrderValue).toLocaleString('en-IN')}</p>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-slate-200">
                      <p className="text-[10px] text-slate-500">Total Units Sold</p>
                      <p className="text-lg font-bold text-slate-900">{totalUnitsSold.toLocaleString('en-IN')} Units</p>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-slate-200">
                      <p className="text-[10px] text-slate-500">Cancellation Rate</p>
                      <p className="text-lg font-bold text-emerald-700">{cancellationRate.toFixed(1)}%</p>
                    </div>
                  </div>

                  {/* Revenue by Category visual bar */}
                  <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-3">
                    <h5 className="font-bold text-xs uppercase text-slate-500 tracking-wider">Revenue by Category</h5>
                    <div className="space-y-2 text-xs">
                      {Array.from(revenueByCategory.entries()).map(([category, revenue]) => {
                        const percentage = metrics.totalRevenue ? Math.round((revenue / metrics.totalRevenue) * 100) : 0;
                        return (
                          <div key={category}>
                            <div className="flex justify-between mb-1">
                              <span className="font-semibold">{category}</span>
                              <span className="font-bold">{percentage}% (₹{revenue.toLocaleString('en-IN')})</span>
                            </div>
                            <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                              <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${percentage}%` }}></div>
                            </div>
                          </div>
                        );
                      })}
                      {revenueByCategory.size === 0 && <p className="text-slate-500">No order revenue recorded in MongoDB yet.</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* ---------------------------------------------------- */}
              {/* TAB 9: SELLER PAYOUTS                                */}
              {/* ---------------------------------------------------- */}
              {activeTab === 'payouts' && (
                <div className="space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm sm:text-base">Producer Payouts & Settlement</h4>
                      <p className="text-xs text-slate-500">Transparent bank remittance with 0% platform deductions for Section 8.</p>
                    </div>
                    <button
                      onClick={downloadPayoutStatement}
                      className="px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-50 font-bold text-xs flex items-center gap-1.5 cursor-pointer text-slate-700"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download MongoDB Statement</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-4 bg-white rounded-2xl border border-slate-200">
                      <p className="text-xs text-slate-500 font-medium">Pending Fortnightly Settlement</p>
                      <p className="text-xl font-bold text-amber-600 mt-1">₹{pendingPayoutTotal.toLocaleString('en-IN')}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Scheduled Date: {String(nextPayout?.payoutDate || 'Not scheduled')}</p>
                    </div>

                    <div className="p-4 bg-white rounded-2xl border border-slate-200">
                      <p className="text-xs text-slate-500 font-medium">Completed Payouts to Date</p>
                      <p className="text-xl font-bold text-emerald-700 mt-1">₹{completedPayoutTotal.toLocaleString('en-IN')}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Direct to {String(payouts[0]?.bankName || organization.bankName || 'verified bank account')}</p>
                    </div>

                    <div className="p-4 bg-white rounded-2xl border border-slate-200">
                      <p className="text-xs text-slate-500 font-medium">Platform Fee Commission</p>
                      <p className="text-xl font-bold text-slate-900 mt-1">{grossPayoutSales ? ((platformFeeTotal / grossPayoutSales) * 100).toFixed(1) : '0'}% (₹{platformFeeTotal.toLocaleString('en-IN')})</p>
                      <p className="text-[10px] text-emerald-700 mt-0.5">Subsidized Non-Profit Partner</p>
                    </div>
                  </div>

                  {/* Bank Details */}
                  <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-2 text-xs">
                    <h5 className="font-bold text-slate-800">Verified Disbursal Bank Account</h5>
                    <p className="text-slate-600">Account: <strong className="text-slate-800">{String(payouts[0]?.bankAccount || 'No payout account on file')}</strong></p>
                    <p className="text-slate-600">Beneficiary: <strong className="text-slate-800">{String(profile.storeName || 'Seller account')}</strong></p>
                  </div>
                </div>
              )}

              {/* ---------------------------------------------------- */}
              {/* TAB 10: NOTIFICATIONS                                */}
              {/* ---------------------------------------------------- */}
              {activeTab === 'notifications' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm sm:text-base">Seller Notifications & Alerts</h4>
                      <p className="text-xs text-slate-500">Order updates, inventory triggers, and payout notices.</p>
                    </div>
                    <button
                      onClick={async () => {
                        const updated = notifications.map(notification => ({ ...notification, read: true }));
                        try {
                          const state = await savePortalState({ notifications: updated });
                          setNotifications(state.notifications);
                          showToast('Notification status saved to MongoDB.');
                        } catch {
                          showToast('Notification update failed; MongoDB was not changed.');
                        }
                      }}
                      className="text-xs text-emerald-700 font-bold hover:underline"
                    >
                      Mark all as read
                    </button>
                  </div>

                  <div className="space-y-2">
                    {notifications.map(notif => (
                      <div key={notif.id} className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs ${
                        notif.read ? 'bg-white border-slate-200' : 'bg-emerald-50/60 border-emerald-200 font-medium'
                      }`}>
                        <div className="flex items-center gap-2.5">
                          <Bell className={`w-4 h-4 shrink-0 ${notif.read ? 'text-slate-400' : 'text-emerald-700'}`} />
                          <div>
                            <p className="text-slate-900">{notif.title}</p>
                            <span className="text-[10px] text-slate-400">{notif.time}</span>
                          </div>
                        </div>
                        {!notif.read && (
                          <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0"></span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ---------------------------------------------------- */}
              {/* TAB 11: STORE PROFILE                                */}
              {/* ---------------------------------------------------- */}
              {activeTab === 'profile' && (
                <div className="space-y-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm sm:text-base">Store & Cluster Profile</h4>
                    <p className="text-xs text-slate-500">Public profile displayed to donors and buyers.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Store / Cluster Name</label>
                      <input 
                        type="text" 
                        value={String(profile.storeName || '')}
                        onChange={(event) => setProfile(current => ({ ...current, storeName: event.target.value }))}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300" 
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Registered Entity ID</label>
                      <input 
                        type="text" 
                        readOnly 
                        value={String(profile.sellerId || '')}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 font-mono font-bold" 
                      />
                    </div>
                  </div>

                  <div className="text-xs">
                    <label className="block font-semibold text-slate-700 mb-1">Store Description & Mission</label>
                    <textarea 
                      rows={3}
                      value={String(profile.storeDescription || '')}
                      onChange={(event) => setProfile(current => ({ ...current, storeDescription: event.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">GSTIN</label>
                      <input type="text" value={String(profile.gstin || '')} onChange={(event) => setProfile(current => ({ ...current, gstin: event.target.value }))} className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono" />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">PAN Card</label>
                      <input type="text" value={String(profile.pan || '')} onChange={(event) => setProfile(current => ({ ...current, pan: event.target.value }))} className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono" />
                    </div>
                  </div>

                  <button
                    onClick={async () => {
                      try {
                        const state = await savePortalState({ profile });
                        setProfile(state.profile);
                        showToast('Store profile saved to MongoDB.');
                      } catch {
                        showToast('Profile update failed; MongoDB was not changed.');
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-800 text-white font-bold text-xs hover:bg-emerald-900 cursor-pointer"
                  >
                    Save Profile Changes
                  </button>
                </div>
              )}

              {/* ---------------------------------------------------- */}
              {/* TAB 12: SETTINGS                                     */}
              {/* ---------------------------------------------------- */}
              {activeTab === 'settings' && (
                <div className="space-y-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs text-xs">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm sm:text-base">Seller Account Settings</h4>
                    <p className="text-slate-500">Security, notification channels, and store visibility.</p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                      <div>
                        <p className="font-bold text-slate-800">Store Visibility</p>
                        <p className="text-slate-500">Allow customers across Hyderabad to browse and purchase items</p>
                      </div>
                      <label className="flex items-center gap-2 font-semibold text-slate-700">
                        <input type="checkbox" checked={profileSettings.storeVisibility !== 'PRIVATE'} onChange={(event) => void saveSellerProfile({ ...profile, settings: { ...profileSettings, storeVisibility: event.target.checked ? 'PUBLIC' : 'PRIVATE' } })} className="h-4 w-4 accent-emerald-700" />
                        <span>{profileSettings.storeVisibility === 'PRIVATE' ? 'Private' : 'Public'}</span>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                      <div>
                        <p className="font-bold text-slate-800">WhatsApp Dispatch Alerts</p>
                        <p className="text-slate-500">Receive real-time alerts when a new order is booked</p>
                      </div>
                      <input type="checkbox" checked={Boolean(profileNotifications.whatsapp)} onChange={(event) => void saveSellerProfile({ ...profile, settings: { ...profileSettings, notificationsEnabled: { ...profileNotifications, whatsapp: event.target.checked } } })} className="w-4 h-4 accent-emerald-700" />
                    </div>

                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                      <div>
                        <p className="font-bold text-slate-800">Email Settlement Receipts</p>
                        <p className="text-slate-500">Auto-dispatch fortnightly bank credit slips</p>
                      </div>
                      <input type="checkbox" checked={Boolean(profileNotifications.email)} onChange={(event) => void saveSellerProfile({ ...profile, settings: { ...profileSettings, notificationsEnabled: { ...profileNotifications, email: event.target.checked } } })} className="w-4 h-4 accent-emerald-700" />
                    </div>
                  </div>
                </div>
              )}

              {/* ---------------------------------------------------- */}
              {/* TAB 13: SUPPORT & TICKETS                            */}
              {/* ---------------------------------------------------- */}
              {activeTab === 'support' && (
                <div className="space-y-5">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm sm:text-base">Seller Support & Field Helpdesk</h4>
                    <p className="text-xs text-slate-500">Raise issues regarding packaging, courier pickups, or payout reconciliations.</p>
                  </div>

                  {/* Ticket creation form */}
                  <form onSubmit={handleRaiseTicket} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 text-xs">
                    <h5 className="font-bold text-slate-900">Raise a Support Ticket</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Issue Category</label>
                        <select
                          value={ticketCategory}
                          onChange={(e) => setTicketCategory(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                        >
                          <option>Order Dispatch</option>
                          <option>Logistics & Cartons</option>
                          <option>Payment & Payout</option>
                          <option>Inventory Sync</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Subject</label>
                        <input
                          type="text"
                          required
                          placeholder="Brief summary of the issue..."
                          value={ticketSubject}
                          onChange={(e) => setTicketSubject(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Detailed Description</label>
                      <textarea
                        rows={3}
                        required
                        placeholder="Provide tracking number, order ID, or details..."
                        value={ticketDesc}
                        onChange={(e) => setTicketDesc(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300"
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-emerald-800 text-white font-bold text-xs hover:bg-emerald-900 cursor-pointer flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Submit Ticket to Support</span>
                    </button>
                  </form>

                  {/* Active tickets */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2 shadow-xs">
                    <h5 className="font-bold text-slate-900 text-xs uppercase text-slate-500 tracking-wider">Your Active Tickets</h5>
                    {ticketsList.map(t => (
                      <div key={t.id} className="p-3 bg-slate-50 rounded-xl flex items-center justify-between text-xs">
                        <div>
                          <p className="font-bold text-slate-800">{t.subject}</p>
                          <span className="text-[10px] text-slate-400 font-mono">{t.id} • {t.category} ({t.createdAt})</span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                          {t.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ---------------------------------------------------- */}
              {/* TAB 14: SECURITY & PERMISSIONS                       */}
              {/* ---------------------------------------------------- */}
              {activeTab === 'security' && (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm sm:text-base">Security & Section 8 Immutability Audit</h4>
                    <p className="text-xs text-slate-500">Zero data tampering guarantee for confirmed donor pledges and orders.</p>
                  </div>

                  <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-emerald-800 font-bold">
                      <ShieldCheck className="w-5 h-5 text-emerald-600" />
                      <span>Role-Based Access Control (RBAC)</span>
                    </div>
                    <p className="text-slate-600">
                      Your session is scoped to <strong className="text-slate-800 font-mono">{String(profile.sellerId || '')}</strong>. Seller data is stored per account in MongoDB.
                    </p>
                    <div className="pt-2 font-mono text-[11px] bg-slate-50 p-2.5 rounded-xl text-slate-700">
                      <p>JWT session: {jwtToken ? 'Active' : 'Not signed in'}</p>
                      <p>Seller portal data: MongoDB</p>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

      </div>

      {/* ======================================================== */}
      {/* MODAL: PREVIEW PRODUCT BEFORE PUBLISHING                */}
      {/* ======================================================== */}
      {selectedProductForPreview && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Product Catalog Live Preview</span>
              <button onClick={() => setSelectedProductForPreview(null)} className="text-slate-400 hover:text-slate-800">
                <X className="w-4 h-4" />
              </button>
            </div>

            <img src={selectedProductForPreview.images[0]} alt={selectedProductForPreview.name} className="w-full h-44 object-cover rounded-2xl border" />
            <div>
              <h4 className="font-bold text-slate-900 text-sm">{selectedProductForPreview.name}</h4>
              <p className="text-xs text-slate-500 mt-1">{selectedProductForPreview.description}</p>
              <div className="flex items-center justify-between mt-3 text-xs">
                <span className="font-bold text-base text-slate-900">₹{selectedProductForPreview.discountPrice || selectedProductForPreview.price}</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                  {selectedProductForPreview.donationPercentage}% to {selectedProductForPreview.donationCause}
                </span>
              </div>
            </div>
            <button
              onClick={() => setSelectedProductForPreview(null)}
              className="w-full py-2 rounded-xl bg-slate-900 text-white font-bold text-xs"
            >
              Close Preview
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ADD / EDIT PRODUCT                                */}
      {/* ======================================================== */}
      {(isAddProductOpen || editingProduct) && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl overflow-hidden shadow-2xl p-5 sm:p-7 space-y-5 max-h-[min(92dvh,900px)] overflow-y-auto overscroll-contain">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-xs font-bold text-slate-900 uppercase">
                {editingProduct ? 'Edit Product Details' : 'Add New Producer Item'}
              </span>
              <button 
                onClick={() => {
                  setIsAddProductOpen(false);
                  setEditingProduct(null);
                }} 
                className="text-slate-400 hover:text-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const readImage = async (fieldName: string, urlFieldName: string, existingImage = '') => {
                  const file = formData.get(fieldName);
                  if (file instanceof File && file.size > 0) {
                    if (!file.type.startsWith('image/')) throw new Error('Choose a valid image file.');
                    if (file.size > 3 * 1024 * 1024) throw new Error('Each uploaded image must be 3 MB or smaller.');
                    return await new Promise<string>((resolve, reject) => {
                      const reader = new FileReader();
                      reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Image could not be read.'));
                      reader.onerror = () => reject(new Error('Image could not be read.'));
                      reader.readAsDataURL(file);
                    });
                  }
                  return String(formData.get(urlFieldName) || '').trim() || existingImage;
                };
                const discountValue = String(formData.get('discountPrice') || '').trim();
                const raffleEnabled = formData.get('raffleEnabled') === 'on';
                const submittedDrawDate = String(formData.get('raffleDrawDate') || '').trim();
                if (raffleEnabled && submittedDrawDate !== confirmedRaffleDrawDate) {
                  showToast('Select and confirm the raffle draw date and time before saving.');
                  return;
                }
                let imageUrl: string;
                let raffleImage: string;
                try {
                  imageUrl = await readImage('imageFile', 'imageUrl', editingProduct?.images?.[0] || '');
                  raffleImage = await readImage('raffleItemImageFile', 'raffleItemImage', editingProduct?.raffle?.itemImage || '');
                } catch (error) {
                  showToast(error instanceof Error ? error.message : 'Image could not be read.');
                  return;
                }
                const product: SellerProductItem = {
                  id: editingProduct?.id || '',
                  name: String(formData.get('name') || '').trim(),
                  category: String(formData.get('category') || '').trim(),
                  price: Number(formData.get('price')),
                  discountPrice: discountValue ? Number(discountValue) : undefined,
                  sku: String(formData.get('sku') || '').trim(),
                  barcode: editingProduct?.barcode || `BAR-${crypto.randomUUID()}`,
                  stockQuantity: Number(formData.get('stockQuantity')),
                  weight: editingProduct?.weight || '',
                  dimensions: editingProduct?.dimensions || '',
                  status: Number(formData.get('stockQuantity')) === 0 ? 'Out of stock' : editingProduct?.status === 'Draft' ? 'Draft' : 'Active',
                  donationPercentage: Number(formData.get('donationPercentage') || 0),
                  donationCause: String(formData.get('donationCause') || ''),
                  impactStatement: editingProduct?.impactStatement || '',
                  images: imageUrl ? [imageUrl] : editingProduct?.images || [],
                  videoUrl: editingProduct?.videoUrl,
                  shippingAvailability: editingProduct?.shippingAvailability || '',
                  description: String(formData.get('description') || '').trim(),
                  raffle: {
                    campaignId: editingProduct?.raffle?.campaignId || '',
                    enabled: raffleEnabled,
                    itemName: String(formData.get('raffleItemName') || '').trim(),
                    itemPrice: Number(formData.get('raffleItemPrice')),
                    itemImage: raffleImage,
                    ticketPrice: Number(formData.get('raffleTicketPrice')),
                    drawDate: submittedDrawDate
                  }
                };
                setPortalSaveStatus('saving');
                try {
                  const response = await fetch(
                    editingProduct
                      ? `${API_BASE_URL}/seller/portal/products/${encodeURIComponent(editingProduct.id)}`
                      : `${API_BASE_URL}/seller/portal/products`,
                    {
                      method: editingProduct ? 'PATCH' : 'POST',
                      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwtToken}` },
                      body: JSON.stringify(product)
                    }
                  );
                  const result = await response.json();
                  if (!response.ok || !result.success) throw new Error(result.message || 'Product could not be saved');
                  if (editingProduct) setProducts(result.products);
                  else setProducts(prev => [result.product, ...prev]);
                  setPortalSaveStatus('saved');
                  showToast(editingProduct ? 'Product changes saved to MongoDB.' : 'Product added to MongoDB.');
                  setIsAddProductOpen(false);
                  setEditingProduct(null);
                } catch (error) {
                  setPortalSaveStatus('error');
                  showToast(error instanceof Error ? error.message : 'Product could not be saved to MongoDB.');
                }
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Product Name *</label>
                <input
                  type="text"
                  name="name"
                  required
                  defaultValue={editingProduct?.name || ''}
                  placeholder="e.g. Cold-Pressed Sesame Oil (1L)"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category *</label>
                  <select name="category" required defaultValue={editingProduct?.category || ''} className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white">
                    <option value="" disabled>Choose a product category</option>
                    {editingProduct?.category && !['Food & Groceries', 'Home & Kitchen', 'Clothing & Textiles', 'Handicrafts & Home Decor', 'Jewelry & Accessories', 'Personal Care & Wellness', 'Books & Learning', 'Toys & Kids', 'Eco-friendly Products', 'Festive Gifts'].includes(editingProduct.category) && <option value={editingProduct.category}>{editingProduct.category}</option>}
                    {['Food & Groceries', 'Home & Kitchen', 'Clothing & Textiles', 'Handicrafts & Home Decor', 'Jewelry & Accessories', 'Personal Care & Wellness', 'Books & Learning', 'Toys & Kids', 'Eco-friendly Products', 'Festive Gifts'].map(category => <option key={category} value={category}>{category}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">SKU Code *</label>
                  <input
                    type="text"
                    name="sku"
                    required
                    defaultValue={editingProduct?.sku || `SKU-HYD-${Math.floor(100 + Math.random() * 900)}`}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Price (₹) *</label>
                  <input type="number" name="price" min="0" step="0.01" required defaultValue={editingProduct?.price ?? ''} className="w-full px-3 py-2 rounded-xl border border-slate-300" />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Discount Price (₹)</label>
                  <input type="number" name="discountPrice" min="0" step="0.01" defaultValue={editingProduct?.discountPrice ?? ''} className="w-full px-3 py-2 rounded-xl border border-slate-300" />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Stock Units *</label>
                  <input type="number" name="stockQuantity" min="0" required defaultValue={editingProduct?.stockQuantity ?? ''} className="w-full px-3 py-2 rounded-xl border border-slate-300" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Donation % *</label>
                  <input type="number" name="donationPercentage" min="0" max="100" defaultValue={editingProduct?.donationPercentage ?? 0} className="w-full px-3 py-2 rounded-xl border border-slate-300" />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Donation Cause</label>
                  <select name="donationCause" defaultValue={editingProduct?.donationCause || 'Mid-Day Child Nutrition'} className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white">
                    <option>Mid-Day Child Nutrition</option>
                    <option>Rural Girl Child Education</option>
                    <option>Village Artisan Livelihood Fund</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Product Image</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input type="url" name="imageUrl" defaultValue={editingProduct?.images[0] || ''} placeholder="Paste an image URL (optional if uploading)" className="w-full min-w-0 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 outline-none transition" />
                  <input type="file" name="imageFile" accept="image/*" className="w-full min-w-0 rounded-xl border border-dashed border-emerald-300 bg-emerald-50/60 text-slate-600 text-[11px] file:mr-3 file:border-0 file:bg-emerald-800 file:px-4 file:py-2.5 file:font-semibold file:text-white hover:file:bg-emerald-900 file:cursor-pointer cursor-pointer" />
                </div>
                <p className="mt-1.5 text-[10px] text-slate-500">Upload up to 3 MB or paste an image URL.</p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description *</label>
                <textarea name="description" required rows={3} defaultValue={editingProduct?.description || ''} className="w-full px-3 py-2 rounded-xl border border-slate-300" />
              </div>

              <fieldset className="space-y-3 rounded-xl border border-amber-300 bg-amber-50 p-3">
                <label className="flex items-center gap-2 font-bold text-amber-950">
                  <input type="checkbox" name="raffleEnabled" defaultChecked={editingProduct?.raffle?.enabled ?? false} />
                  Enable raffle tickets for this product
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Raffle Prize Item</label>
                    <input name="raffleItemName" defaultValue={editingProduct?.raffle?.itemName || ''} placeholder="e.g. Apple iPhone 16 (128GB)" className="w-full px-3 py-2 rounded-xl border border-slate-300" />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Raffle Prize Value (₹)</label>
                    <input type="number" min="0" step="0.01" name="raffleItemPrice" defaultValue={editingProduct?.raffle?.itemPrice ?? ''} className="w-full px-3 py-2 rounded-xl border border-slate-300" />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Raffle Prize Image</label>
                    <input type="url" name="raffleItemImage" defaultValue={editingProduct?.raffle?.itemImage || ''} placeholder="Image URL (optional if uploading)" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 outline-none transition mb-2" />
                    <input type="file" name="raffleItemImageFile" accept="image/*" className="w-full rounded-xl border border-dashed border-amber-300 bg-white text-slate-600 text-[11px] file:mr-3 file:border-0 file:bg-amber-500 file:px-4 file:py-2.5 file:font-semibold file:text-amber-950 hover:file:bg-amber-400 file:cursor-pointer cursor-pointer" />
                    <p className="mt-1.5 text-[10px] text-slate-500">Upload up to 3 MB or paste an image URL.</p>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Price Per Ticket (₹)</label>
                    <input type="number" min="0" step="0.01" name="raffleTicketPrice" defaultValue={editingProduct?.raffle?.ticketPrice ?? ''} className="w-full px-3 py-2 rounded-xl border border-slate-300" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">Draw Date / Time</label>
                    <div className="flex gap-2">
                      <input ref={raffleDrawDateInput} type="datetime-local" name="raffleDrawDate" min={minimumRaffleDrawDate} defaultValue={raffleDrawDateDefault} onChange={() => setConfirmedRaffleDrawDate('')} className="min-w-0 flex-1 px-3 py-2.5 rounded-xl border border-slate-300 bg-white" />
                      <button type="button" onClick={() => {
                        const selectedDate = raffleDrawDateInput.current?.value || '';
                        if (!selectedDate || new Date(selectedDate).getTime() < Date.now() + 31 * 24 * 60 * 60 * 1000) {
                          showToast('Choose a draw date at least one month from today.');
                          return;
                        }
                        setConfirmedRaffleDrawDate(selectedDate);
                      }} aria-label="Confirm raffle draw date and time" title="Confirm date and time" className={`shrink-0 inline-flex items-center justify-center w-11 rounded-xl border transition ${confirmedRaffleDrawDate && confirmedRaffleDrawDate === raffleDrawDateInput.current?.value ? 'border-emerald-700 bg-emerald-700 text-white' : 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'}`}>
                        <Check className="w-5 h-5" />
                      </button>
                    </div>
                    <p className="mt-1 text-[10px] text-slate-500">Choose a date at least one month ahead, confirm with ✓, then save the product to MongoDB.</p>
                  </div>
                </div>
              </fieldset>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow transition cursor-pointer"
              >
                {editingProduct ? 'Save Product Changes' : 'Publish Product to Welfare Shop'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: PRINT TAX INVOICE                                 */}
      {/* ======================================================== */}
      {activeInvoiceOrder && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h4 className="font-bold text-slate-900 font-serif text-sm">{organization.legalName || 'Organization Name'}</h4>
                <p className="text-[10px] text-slate-500">Tax Invoice & Delivery Dispatch Note</p>
              </div>
              <button onClick={() => setActiveInvoiceOrder(null)} className="text-slate-400 hover:text-slate-800">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl space-y-1 font-mono text-[11px]">
              <div className="flex justify-between">
                <span>Invoice No: <strong>INV-{activeInvoiceOrder.orderId}</strong></span>
                <span>Date: {activeInvoiceOrder.orderDate}</span>
              </div>
              <p>Seller ID: {String(profile.sellerId || '')} ({String(profile.storeName || 'Seller account')})</p>
              <p>GSTIN: {displayValue(organization.gstin)} • Section 8 Reg: {displayValue(organization.section8Registration)}</p>
            </div>

            <div>
              <p className="font-bold text-slate-800">Billed / Delivered To:</p>
              <p className="text-slate-700">{activeInvoiceOrder.customerName} ({activeInvoiceOrder.customerMobile})</p>
              <p className="text-slate-500">{activeInvoiceOrder.community}, Hyderabad - {activeInvoiceOrder.pincode}</p>
              <p className="text-emerald-800 font-bold">Nodal Hub: {activeInvoiceOrder.nearbyNodalPoint}</p>
            </div>

            {/* Itemized Table */}
            <table className="w-full text-left divide-y divide-slate-100">
              <thead className="bg-slate-100 font-bold text-[10px] text-slate-600">
                <tr>
                  <th className="p-2">Item</th>
                  <th className="p-2 text-center">Qty</th>
                  <th className="p-2 text-right">Price</th>
                  <th className="p-2 text-right">Pledged Aid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeInvoiceOrder.items.map((it, idx) => (
                  <tr key={idx}>
                    <td className="p-2 font-medium">{it.productName}</td>
                    <td className="p-2 text-center">{it.quantity}</td>
                    <td className="p-2 text-right">₹{it.unitPrice * it.quantity}</td>
                    <td className="p-2 text-right text-emerald-700 font-bold">₹{it.donationAmount}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="border-t pt-2 space-y-1 text-right">
              <p className="font-bold text-slate-900 text-sm">Total Paid: ₹{activeInvoiceOrder.totalAmount}</p>
              <p className="text-emerald-800 font-bold text-[11px]">Welfare Aid Transferred: ₹{activeInvoiceOrder.donationTotal}</p>
            </div>

            <button
              onClick={() => {
                showToast('Printing invoice command sent to printer.');
                window.print();
              }}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold flex items-center justify-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Download PDF Invoice</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
