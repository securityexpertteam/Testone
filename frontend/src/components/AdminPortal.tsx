import React, { FormEvent, useCallback, useEffect, useState } from 'react';
import {
  Activity, ArrowDownToLine, BadgeCheck, Building2, CircleDollarSign, ClipboardList,
  Eye, EyeOff, LayoutDashboard, LockKeyhole, LogOut, Mail, RefreshCw, ShieldCheck, ShoppingBag,
  Store, TriangleAlert, Users, Wallet
} from 'lucide-react';
import { API_BASE_URL } from '../utils/api';

type DashboardSection = 'overview' | 'sellers' | 'orders' | 'finance' | 'donations' | 'channels' | 'vendors' | 'operations' | 'analytics' | 'governance';
type DataRow = Record<string, unknown>;

interface DashboardData {
  generatedAt: string;
  metrics: {
    vendors: { total: number; approved: number; pending: number; suspended: number };
    orders: { orders: number; revenue: number };
    donations: { donations: number; revenue: number };
    products: { total: number; active: number };
    raffleCampaigns: number;
  };
  sellers: DataRow[];
  orders: DataRow[];
  donations: DataRow[];
  products: DataRow[];
  campaigns: DataRow[];
  orderChannels: Array<{ _id: string; orders: number; revenue: number }>;
  referralChannels: Array<{ _id: string; orders: number; revenue: number }>;
  donationCauses: Array<{ _id: string; contributions: number; revenue: number }>;
  financials: {
    paymentStatuses: Array<{ _id: string; orders: number; amount: number }>;
    orderStatuses: Array<{ _id: string; orders: number }>;
    monthlyRevenue: Array<{ _id: string; orders: number; revenue: number; donation: number }>;
    sellerPerformance: Array<{ _id: string; orders: number; revenue: number; contribution: number }>;
    catalogEconomics: { activeProducts: number; stockUnits: number; stockCostValue: number; averageListedMarginPerUnit: number };
    raffleTicketStatuses: Array<{ _id: string; tickets: number; revenue: number }>;
  };
  operations: { lowStockProducts: DataRow[]; lowStockCount: number; openSellerTickets: number };
  donorContributors: Array<{ _id: { email: string; name: string }; contributionCount: number; totalContribution: number; lastContributionAt: string | Date }>;
  auditEvents: DataRow[];
}

const sections: Array<{ id: DashboardSection; label: string; icon: React.ElementType }> = [
  { id: 'overview', label: 'Portfolio overview', icon: LayoutDashboard },
  { id: 'sellers', label: 'Seller management', icon: Users },
  { id: 'orders', label: 'Orders & revenue', icon: ShoppingBag },
  { id: 'finance', label: 'Finance & margins', icon: Wallet },
  { id: 'donations', label: 'Donors & sponsors', icon: HeartIcon },
  { id: 'channels', label: 'Sales channels', icon: Activity },
  { id: 'vendors', label: 'Vendors & catalog', icon: Store },
  { id: 'operations', label: 'Operations & stock', icon: ClipboardIcon },
  { id: 'analytics', label: 'Trends & performance', icon: ChartIcon },
  { id: 'governance', label: 'Governance log', icon: ShieldCheck }
];

function HeartIcon(props: React.ComponentProps<'svg'>) {
  return <CircleDollarSign {...props} />;
}
function ClipboardIcon(props: React.ComponentProps<'svg'>) {
  return <ClipboardList {...props} />;
}
function ChartIcon(props: React.ComponentProps<'svg'>) {
  return <Activity {...props} />;
}

const formatCurrency = (value: unknown) =>
  `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
const stringValue = (value: unknown, fallback = '—') =>
  typeof value === 'string' && value.trim() ? value : fallback;
const amountFromOrder = (order: DataRow) => {
  const metadata = order.orderMetadata as DataRow | undefined;
  const payment = order.payment as DataRow | undefined;
  return metadata?.finalPayableAmount ?? payment?.paymentAmount ?? 0;
};
const dateValue = (value: unknown) => {
  if (typeof value !== 'string' && !(value instanceof Date)) return '—';
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
};

const downloadCsv = (filename: string, rows: Array<Record<string, unknown>>) => {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const escape = (value: unknown) => {
    const text = String(value ?? '');
    const safe = /^[\s]*[=+\-@]/.test(text) ? `'${text}` : text;
    return `"${safe.replace(/"/g, '""')}"`;
  };
  const content = [headers.map(escape).join(','), ...rows.map(row => headers.map(key => escape(row[key])).join(','))].join('\r\n');
  const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};

export const AdminPortal: React.FC = () => {
  const [token, setToken] = useState('');
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [section, setSection] = useState<DashboardSection>('overview');
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [recoveryOpen, setRecoveryOpen] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryMobile, setRecoveryMobile] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [otp, setOtp] = useState('');
  const [developmentOtp, setDevelopmentOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [recoveryStep, setRecoveryStep] = useState<'request' | 'verify' | 'complete'>('request');

  const request = useCallback(async <T,>(path: string, options: RequestInit = {}, authToken = token): Promise<T> => {
    const headers = new Headers(options.headers);
    headers.set('Content-Type', 'application/json');
    if (authToken) headers.set('Authorization', `Bearer ${authToken}`);
    const response = await fetch(`${API_BASE_URL}/admin${path}`, {
      ...options,
      headers
    });
    const result = await response.json() as T & { success?: boolean; message?: string };
    if (!response.ok || result.success === false) throw new Error(result.message || 'Administrator request failed');
    return result;
  }, [token]);

  const loadDashboard = useCallback(async (authToken = token) => {
    setLoading(true);
    setError('');
    try {
      const result = await request<{ dashboard: DashboardData }>('/dashboard', {}, authToken);
      setDashboard(result.dashboard);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Portfolio data could not be loaded');
    } finally {
      setLoading(false);
    }
  }, [request, token]);

  useEffect(() => {
    if (token && !mustChangePassword) void loadDashboard(token);
  }, [token, mustChangePassword, loadDashboard]);

  const signIn = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true); setError('');
    try {
      const result = await request<{ token: string; mustChangePassword: boolean }>('/login', {
        method: 'POST', body: JSON.stringify({ username, password })
      }, '');
      setToken(result.token);
      setMustChangePassword(result.mustChangePassword);
      setPassword('');
      if (result.mustChangePassword) setNotice('For security, choose a new administrator password before opening the portfolio.');
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Sign-in failed');
    } finally { setBusy(false); }
  };

  const changePassword = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true); setError('');
    try {
      const result = await request<{ token: string }>('/password/change', {
        method: 'POST', body: JSON.stringify({ currentPassword, newPassword })
      });
      setToken(result.token);
      setMustChangePassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setNotice('Administrator password changed. Portfolio access is now enabled.');
    } catch (changeError) {
      setError(changeError instanceof Error ? changeError.message : 'Password could not be changed');
    } finally { setBusy(false); }
  };

  const requestRecovery = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true); setError(''); setDevelopmentOtp('');
    try {
      const result = await request<{ developmentOtp?: string; message: string }>('/recovery/request', {
        method: 'POST',
        body: JSON.stringify({ username, email: recoveryEmail, mobile: recoveryMobile, resetCode })
      }, '');
      setDevelopmentOtp(result.developmentOtp || '');
      setRecoveryStep('verify');
      setNotice(result.message);
    } catch (recoveryError) {
      setError(recoveryError instanceof Error ? recoveryError.message : 'Recovery code could not be sent');
    } finally { setBusy(false); }
  };

  const verifyRecovery = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true); setError('');
    try {
      const result = await request<{ resetToken: string }>('/recovery/verify', {
        method: 'POST',
        body: JSON.stringify({ username, email: recoveryEmail, mobile: recoveryMobile, resetCode, otp })
      }, '');
      setResetToken(result.resetToken);
      setRecoveryStep('complete');
    } catch (verifyError) {
      setError(verifyError instanceof Error ? verifyError.message : 'Recovery code was not accepted');
    } finally { setBusy(false); }
  };

  const completeRecovery = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true); setError('');
    try {
      const result = await request<{ token: string }>('/recovery/complete', {
        method: 'POST', body: JSON.stringify({ resetToken, newPassword })
      }, '');
      setToken(result.token);
      setMustChangePassword(false);
      setRecoveryOpen(false);
      setResetToken('');
      setResetCode('');
      setOtp('');
      setNewPassword('');
      setNotice('Password reset successfully. Your administrator session is active.');
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : 'Password could not be reset');
    } finally { setBusy(false); }
  };

  const updateSellerStatus = async (sellerId: string, status: 'APPROVED' | 'SUSPENDED') => {
    setBusy(true); setError(''); setNotice('');
    try {
      const result = await request<{ notificationSent: boolean; notificationMessage: string }>(`/sellers/${encodeURIComponent(sellerId)}/status`, {
        method: 'PATCH', body: JSON.stringify({ status })
      });
      setNotice(result.notificationMessage);
      await loadDashboard();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Seller status could not be updated');
    } finally { setBusy(false); }
  };

  const signOut = () => {
    setToken('');
    setDashboard(null);
    setMustChangePassword(false);
    setSection('overview');
    setNotice('');
    setError('');
  };

  const downloadSection = () => {
    if (!dashboard) return;
    if (section === 'sellers') downloadCsv('seller-register.csv', dashboard.sellers);
    else if (section === 'orders') downloadCsv('orders.csv', dashboard.orders.map(order => ({
      orderId: order.orderId,
      sellerId: (order.orderMetadata as DataRow | undefined)?.sellerId,
      amount: amountFromOrder(order),
      status: (order.payment as DataRow | undefined)?.paymentStatus,
      paymentChannel: (order.payment as DataRow | undefined)?.paymentMethod,
      referral: order.refid || 'subhash',
      placed: order.createdAt
    })));
    else if (section === 'donations') downloadCsv('donor-contributions.csv', dashboard.donations);
    else if (section === 'vendors') downloadCsv('vendor-catalog.csv', dashboard.products);
    else if (section === 'channels') downloadCsv('revenue-channels.csv', [
      ...dashboard.orderChannels.map(row => ({ channelType: 'Payment method', channel: row._id, orders: row.orders, revenue: row.revenue })),
      ...dashboard.referralChannels.map(row => ({ channelType: 'Referral source', channel: row._id, orders: row.orders, revenue: row.revenue }))
    ]);
    else if (section === 'finance') downloadCsv('financial-summary.csv', [
      ...dashboard.financials.paymentStatuses.map(row => ({ metric: 'Payment status', category: row._id, count: row.orders, amount: row.amount })),
      ...dashboard.financials.sellerPerformance.map(row => ({ metric: 'Seller performance', category: row._id, count: row.orders, amount: row.revenue, recordedContribution: row.contribution })),
      { metric: 'Current catalog snapshot', category: 'Active stock cost value', count: dashboard.financials.catalogEconomics.stockUnits, amount: dashboard.financials.catalogEconomics.stockCostValue }
    ]);
    else if (section === 'operations') downloadCsv('operations-stock.csv', dashboard.operations.lowStockProducts);
    else if (section === 'analytics') downloadCsv('monthly-performance.csv', dashboard.financials.monthlyRevenue);
    else downloadCsv('portfolio-audit.csv', dashboard.auditEvents);
  };

  const metricCards = dashboard ? [
    { title: 'Total vendors', value: dashboard.metrics.vendors.total, hint: `${dashboard.metrics.vendors.approved} approved · ${dashboard.metrics.vendors.pending} awaiting review`, icon: Store, color: 'text-emerald-700 bg-emerald-50' },
    { title: 'Orders recorded', value: dashboard.metrics.orders.orders, hint: `${formatCurrency(dashboard.metrics.orders.revenue)} recognized order revenue`, icon: ShoppingBag, color: 'text-blue-700 bg-blue-50' },
    { title: 'Order-linked donations', value: dashboard.metrics.donations.donations, hint: `${formatCurrency(dashboard.metrics.donations.revenue)} saved contributions`, icon: HeartIcon, color: 'text-rose-700 bg-rose-50' },
    { title: 'Live catalog', value: `${dashboard.metrics.products.active} / ${dashboard.metrics.products.total}`, hint: `${dashboard.metrics.raffleCampaigns} raffle campaigns`, icon: Building2, color: 'text-violet-700 bg-violet-50' }
  ] : [];

  if (!token) {
    return (
      <main className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-100 via-slate-50 to-slate-100 px-4 py-10">
        <div className="mx-auto max-w-md">
          <div className="mb-7 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-900 text-white shadow-lg"><ShieldCheck className="h-7 w-7" /></div>
            <h1 className="mt-4 text-2xl font-black tracking-tight text-slate-900">Governance console</h1>
            <p className="mt-1 text-sm text-slate-500">Restricted administrator access · private workspace</p>
          </div>
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
            {!recoveryOpen ? (
              <form className="space-y-4" onSubmit={signIn}>
                <div><label className="text-xs font-bold text-slate-700">Administrator username</label><input required autoComplete="username" value={username} onChange={event => setUsername(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" /></div>
                <div>
                  <label htmlFor="admin-login-password" className="text-xs font-bold text-slate-700">Password</label>
                  <div className="mt-1.5 flex items-stretch gap-2">
                    <input id="admin-login-password" required type={showLoginPassword ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" />
                    <button type="button" onClick={() => setShowLoginPassword(visible => !visible)} aria-label={showLoginPassword ? 'Hide password' : 'Show password'} aria-pressed={showLoginPassword} className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-emerald-800 bg-white px-3 text-xs font-bold text-emerald-900 transition hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300">
                      {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      {showLoginPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>
                <button disabled={busy} className="w-full rounded-xl bg-emerald-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-800 disabled:opacity-60">{busy ? 'Verifying…' : 'Sign in securely'}</button>
                <button type="button" onClick={() => { setRecoveryOpen(true); setError(''); }} className="w-full text-center text-xs font-semibold text-emerald-800 hover:underline">Recover administrator access</button>
              </form>
            ) : (
              <div>
                <div className="mb-5 flex items-center gap-2"><LockKeyhole className="h-5 w-5 text-emerald-800" /><h2 className="font-bold text-slate-900">Secure password recovery</h2></div>
                {recoveryStep === 'request' && <form className="space-y-3" onSubmit={requestRecovery}>
                  <p className="rounded-xl bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">Recovery requires the administrator username, registered email and mobile, plus the secret reset code configured only in the backend environment.</p>
                  <input required value={username} onChange={event => setUsername(event.target.value)} placeholder="Admin username" className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm" />
                  <input required type="email" value={recoveryEmail} onChange={event => setRecoveryEmail(event.target.value)} placeholder="Registered admin email" className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm" />
                  <input required autoComplete="tel" value={recoveryMobile} onChange={event => setRecoveryMobile(event.target.value)} placeholder="Registered mobile (with country code)" className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm" />
                  <input required type="password" value={resetCode} onChange={event => setResetCode(event.target.value)} placeholder="Backend-only secret reset code" className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm" />
                  <button disabled={busy} className="w-full rounded-xl bg-emerald-900 px-4 py-3 text-sm font-bold text-white disabled:opacity-60">{busy ? 'Sending…' : 'Send recovery code'}</button>
                </form>}
                {recoveryStep === 'verify' && <form className="space-y-3" onSubmit={verifyRecovery}>
                  {developmentOtp && <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-950"><strong>Development-only OTP:</strong> <span className="font-mono text-base font-black">{developmentOtp}</span><p className="mt-1">This is exposed only because ADMIN_OTP_MODE=development. Do not enable that setting in production.</p></div>}
                  <p className="text-xs text-slate-600">Enter the six-digit recovery code from the configured delivery method.</p>
                  <input required inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={otp} onChange={event => setOtp(event.target.value)} placeholder="Six-digit recovery code" className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm tracking-[0.3em]" />
                  <button disabled={busy} className="w-full rounded-xl bg-emerald-900 px-4 py-3 text-sm font-bold text-white disabled:opacity-60">{busy ? 'Verifying…' : 'Verify code'}</button>
                </form>}
                {recoveryStep === 'complete' && <form className="space-y-3" onSubmit={completeRecovery}>
                  <p className="text-xs text-slate-600">Choose a new password with at least 14 characters.</p>
                  <input required type="password" minLength={14} autoComplete="new-password" value={newPassword} onChange={event => setNewPassword(event.target.value)} placeholder="New administrator password" className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm" />
                  <button disabled={busy} className="w-full rounded-xl bg-emerald-900 px-4 py-3 text-sm font-bold text-white disabled:opacity-60">{busy ? 'Resetting…' : 'Reset password and continue'}</button>
                </form>}
                <button type="button" onClick={() => { setRecoveryOpen(false); setRecoveryStep('request'); setDevelopmentOtp(''); setResetCode(''); setOtp(''); setError(''); }} className="mt-4 w-full text-center text-xs font-semibold text-slate-500 hover:text-slate-800">Back to administrator sign in</button>
              </div>
            )}
            {error && <p role="alert" className="mt-4 rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-800">{error}</p>}
            {notice && !error && <p role="status" className="mt-4 rounded-xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">{notice}</p>}
          </section>
          <p className="mt-5 text-center text-[11px] leading-relaxed text-slate-400">No public navigation points to this console. Keep the initial password and recovery code private, and change the initial password immediately.</p>
        </div>
      </main>
    );
  }

  if (mustChangePassword) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-100 px-4 py-8">
        <form onSubmit={changePassword} className="w-full max-w-md space-y-4 rounded-3xl border border-slate-200 bg-white p-7 shadow-xl">
          <LockKeyhole className="h-8 w-8 text-emerald-800" />
          <h1 className="text-2xl font-black text-slate-900">Set your private password</h1>
          <p className="text-sm leading-relaxed text-slate-600">This is the first sign-in. Replace the environment-provided bootstrap password before using administration features.</p>
          <div>
            <label htmlFor="admin-current-password" className="text-xs font-bold text-slate-700">Current bootstrap password</label>
            <div className="relative mt-1.5">
              <input id="admin-current-password" required type={showCurrentPassword ? 'text' : 'password'} autoComplete="current-password" value={currentPassword} onChange={event => setCurrentPassword(event.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-3 pr-12 text-sm" />
              <button type="button" onClick={() => setShowCurrentPassword(visible => !visible)} aria-label={showCurrentPassword ? 'Hide entered current password' : 'Show entered current password'} aria-pressed={showCurrentPassword} className="absolute inset-y-0 right-2 flex items-center rounded-lg px-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900">
                {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="mt-1.5 text-[10px] text-slate-500">This only reveals what you typed here. It does not display or retrieve the backend password.</p>
          </div>
          <div><label className="text-xs font-bold text-slate-700">New password (14+ characters)</label><input required type="password" minLength={14} autoComplete="new-password" value={newPassword} onChange={event => setNewPassword(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm" /></div>
          <button disabled={busy} className="w-full rounded-xl bg-emerald-900 px-4 py-3 text-sm font-bold text-white disabled:opacity-60">{busy ? 'Updating…' : 'Change password and continue'}</button>
          {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-xs text-rose-800">{error}</p>}
          <button type="button" onClick={signOut} className="w-full text-xs font-semibold text-slate-500">Sign out</button>
        </form>
      </main>
    );
  }

  const title = sections.find(item => item.id === section)?.label || 'Portfolio overview';
  return (
    <div className="flex min-h-screen bg-[#f3f6f5] text-slate-900">
      <aside className="hidden w-64 shrink-0 flex-col bg-[#092f25] p-4 text-white lg:flex">
        <div className="flex items-center gap-3 border-b border-white/10 px-2 pb-5 pt-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-300 text-emerald-950"><ShieldCheck className="h-5 w-5" /></div>
          <div><p className="text-sm font-black">Akshaya Patra</p><p className="text-[10px] uppercase tracking-[0.16em] text-emerald-200">Governance</p></div>
        </div>
        <nav className="mt-6 space-y-1">
          {sections.map(item => {
            const Icon = item.icon;
            return <button key={item.id} onClick={() => setSection(item.id)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-xs font-semibold transition ${section === item.id ? 'bg-white/15 text-white' : 'text-emerald-100/75 hover:bg-white/10 hover:text-white'}`}>
              <Icon className="h-4 w-4" />{item.label}
              {item.id === 'sellers' && dashboard?.metrics.vendors.pending ? <span className="ml-auto rounded-full bg-amber-300 px-2 py-0.5 text-[10px] font-black text-emerald-950">{dashboard.metrics.vendors.pending}</span> : null}
            </button>;
          })}
        </nav>
        <div className="mt-auto rounded-2xl border border-white/10 bg-white/5 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-200">Access controls</p>
          <p className="mt-1 text-[11px] leading-relaxed text-emerald-50/70">Private session · seller approvals are audited</p>
          <button onClick={signOut} className="mt-3 flex items-center gap-2 text-xs font-bold text-white"><LogOut className="h-3.5 w-3.5" /> Sign out</button>
        </div>
      </aside>

      <main className="min-w-0 flex-1">
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur sm:px-7">
          <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-3">
            <div><p className="text-[10px] font-bold uppercase tracking-[0.15em] text-emerald-800">Private governance workspace</p><h1 className="text-lg font-black sm:text-xl">{title}</h1></div>
            <div className="flex items-center gap-2">
              <button onClick={() => void loadDashboard()} disabled={loading} className="rounded-xl border border-slate-200 p-2.5 text-slate-600 hover:bg-slate-50" aria-label="Refresh portfolio data"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /></button>
              <button onClick={downloadSection} className="hidden items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 sm:flex"><ArrowDownToLine className="h-4 w-4" /> Export CSV</button>
              <button onClick={signOut} className="rounded-xl bg-slate-100 p-2.5 text-slate-700 hover:bg-slate-200 lg:hidden" aria-label="Sign out"><LogOut className="h-4 w-4" /></button>
            </div>
          </div>
        </header>
        <div className="mx-auto max-w-[1500px] space-y-5 p-4 sm:p-7">
          <nav className="flex gap-1 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1.5 lg:hidden">
            {sections.map(item => <button key={item.id} onClick={() => setSection(item.id)} className={`whitespace-nowrap rounded-xl px-3 py-2 text-[11px] font-bold ${section === item.id ? 'bg-emerald-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>{item.label}</button>)}
          </nav>
          {error && <div role="alert" className="flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800"><TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}
          {notice && <div role="status" className="flex items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900"><BadgeCheck className="mt-0.5 h-4 w-4 shrink-0" />{notice}<button className="ml-auto text-xs font-bold" onClick={() => setNotice('')}>Dismiss</button></div>}
          {loading && !dashboard && <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">Loading secured portfolio records…</div>}
          {!dashboard && !loading && <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">No portfolio data has loaded.</div>}

          {dashboard && section === 'overview' && <>
            <div className="flex flex-wrap items-end justify-between gap-2"><div><p className="text-sm text-slate-500">Operating snapshot across seller accounts and saved transaction records.</p><p className="mt-1 text-[11px] text-slate-400">Updated {dateValue(dashboard.generatedAt)}</p></div><span className="rounded-full bg-emerald-100 px-3 py-1.5 text-[10px] font-bold text-emerald-900">Live from connected MongoDB</span></div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {metricCards.map(card => { const Icon = card.icon; return <article key={card.title} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-start justify-between"><span className="text-xs font-semibold text-slate-500">{card.title}</span><span className={`rounded-xl p-2 ${card.color}`}><Icon className="h-4 w-4" /></span></div><p className="mt-2 text-2xl font-black tracking-tight">{card.value}</p><p className="mt-1 text-[11px] text-slate-500">{card.hint}</p></article>; })}
            </div>
            <Panel
              title="Donations & welfare contributions"
              subtitle="A portfolio snapshot of paid, order-linked contributions saved in the donation ledger."
              action={<button onClick={() => setSection('donations')} className="whitespace-nowrap text-xs font-bold text-emerald-800 hover:text-emerald-950">Open donation register →</button>}
            >
              <div className="grid gap-5 lg:grid-cols-[0.8fr_1fr_1.4fr]">
                <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
                  <div className="rounded-xl bg-rose-50 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-rose-700">Paid contributions</p>
                    <p className="mt-1 text-xl font-black text-slate-950">{Number(dashboard.metrics.donations.donations || 0).toLocaleString('en-IN')}</p>
                    <p className="mt-0.5 text-[10px] text-slate-500">Successful donation records</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Recorded total</p>
                    <p className="mt-1 text-xl font-black text-slate-950">{formatCurrency(dashboard.metrics.donations.revenue)}</p>
                    <p className="mt-0.5 text-[10px] text-slate-500">Paid / successful only</p>
                  </div>
                </div>
                <div className="min-w-0">
                  <p className="mb-3 text-[10px] font-bold uppercase tracking-wide text-slate-500">Contribution by cause</p>
                  {dashboard.donationCauses.length ? (
                    <div className="space-y-3">
                      {dashboard.donationCauses.slice(0, 4).map(cause => (
                        <MetricLine
                          key={cause._id}
                          label={`${cause._id} · ${cause.contributions}`}
                          value={cause.revenue}
                          max={Math.max(...dashboard.donationCauses.map(item => Number(item.revenue || 0)), 1)}
                          color="bg-rose-500"
                        />
                      ))}
                    </div>
                  ) : <p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500">No paid contributions are recorded yet.</p>}
                </div>
                <div className="min-w-0">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Recent contribution activity</p>
                    <span className="text-[10px] text-slate-400">Latest saved records</span>
                  </div>
                  {dashboard.donations.length ? (
                    <div className="divide-y divide-slate-100">
                      {dashboard.donations.slice(0, 4).map((donation, index) => (
                        <div key={stringValue(donation.donationId, String(index))} className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0">
                          <div className="min-w-0">
                            <p className="truncate text-xs font-bold text-slate-800">{stringValue(donation.donorName, 'Contributor')}</p>
                            <p className="mt-0.5 truncate text-[10px] text-slate-500">{stringValue(donation.cause, 'Unspecified cause')} · {dateValue(donation.recordedAt)}</p>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="text-xs font-black text-slate-900">{formatCurrency(donation.amount)}</p>
                            <StatusBadge value={stringValue(donation.paymentStatus, 'Unknown')} />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : <p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500">No donation records are available.</p>}
                </div>
              </div>
              <p className="mt-4 border-t border-slate-100 pt-3 text-[10px] leading-relaxed text-slate-400">
                Scope: order-linked contributions only. Direct donation form submissions and sponsor records are not currently stored in the backend ledger.
              </p>
            </Panel>
            <div className="grid gap-4 xl:grid-cols-2">
              <Panel title="Seller onboarding pipeline" subtitle="Only explicitly approved accounts can sign in.">
                <div className="grid grid-cols-3 gap-2 text-center">{[
                  ['Pending review', dashboard.metrics.vendors.pending, 'bg-amber-50 text-amber-900'],
                  ['Approved', dashboard.metrics.vendors.approved, 'bg-emerald-50 text-emerald-900'],
                  ['Suspended', dashboard.metrics.vendors.suspended, 'bg-rose-50 text-rose-900']
                ].map(([label, value, color]) => <div key={String(label)} className={`rounded-xl p-3 ${color}`}><p className="text-xl font-black">{value}</p><p className="mt-1 text-[10px] font-bold">{label}</p></div>)}</div>
                <button onClick={() => setSection('sellers')} className="mt-4 flex w-full items-center justify-between rounded-xl bg-slate-50 px-3 py-3 text-xs font-bold text-slate-700 hover:bg-emerald-50"><span>Review pending applications</span><span className="rounded-full bg-amber-300 px-2 py-0.5">{dashboard.metrics.vendors.pending}</span></button>
              </Panel>
              <Panel title="Revenue pulse" subtitle="Recognized paid and confirmed order revenue; direct contributions are separate.">
                <div className="space-y-4"><MetricLine label="Order revenue" value={dashboard.metrics.orders.revenue} max={dashboard.metrics.orders.revenue + dashboard.metrics.donations.revenue} color="bg-blue-600" /><MetricLine label="Recorded donations" value={dashboard.metrics.donations.revenue} max={dashboard.metrics.orders.revenue + dashboard.metrics.donations.revenue} color="bg-rose-500" />
                  <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs"><span className="font-semibold text-slate-600">Combined recorded inflow</span><strong>{formatCurrency(Number(dashboard.metrics.orders.revenue || 0) + Number(dashboard.metrics.donations.revenue || 0))}</strong></div>
                </div>
              </Panel>
              <Panel title="Recent orders" subtitle="Latest records from the transaction ledger." action={<button onClick={() => setSection('orders')} className="text-xs font-bold text-emerald-800">Open register</button>}>
                <div className="overflow-x-auto"><table className="w-full min-w-[560px] text-left text-xs"><thead><tr className="border-b text-[10px] uppercase tracking-wider text-slate-400"><th className="pb-2">Order</th><th className="pb-2">Source</th><th className="pb-2">Payment</th><th className="pb-2 text-right">Value</th></tr></thead><tbody>{dashboard.orders.slice(0, 5).map((order, index) => <tr key={stringValue(order.orderId, String(index))} className="border-b border-slate-100 last:border-0"><td className="py-2.5 font-semibold">{stringValue(order.orderId)}</td><td>{stringValue(order.refid, 'subhash')}</td><td>{stringValue((order.payment as DataRow | undefined)?.paymentStatus)}</td><td className="text-right font-bold">{formatCurrency(amountFromOrder(order))}</td></tr>)}</tbody></table></div>
              </Panel>
              <Panel title="Portfolio notices" subtitle="Items requiring governance attention.">
                <div className="space-y-2"><Notice icon={TriangleAlert} title={`${dashboard.metrics.vendors.pending} seller applications awaiting review`} detail="Review identity, organization, product provenance, and payout ownership before approval." tone="amber" /><Notice icon={Wallet} title={`${dashboard.metrics.vendors.suspended} suspended seller accounts`} detail="Suspended accounts cannot use the seller portal while their status remains suspended." tone="slate" /><Notice icon={Mail} title="Approval email is conditional on SMTP" detail="The seller status change is saved even if SMTP is unavailable; the action result reports delivery status." tone="blue" /></div>
              </Panel>
            </div>
          </>}

          {dashboard && section === 'sellers' && <Panel title="Seller review queue" subtitle="Approving an account immediately enables the separate seller portal; suspension revokes active API sessions.">
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-950"><strong>Review checklist:</strong> verify representative identity, organization registration, product provenance, and payout ownership. Existing accounts without APPROVED status remain unable to sign in.</div>
            <DataTable headers={['Seller / representative', 'Contact', 'Organization', 'Status', 'Review']} rows={dashboard.sellers} render={(seller, index) => <tr key={stringValue(seller.sellerId, String(index))} className="border-b border-slate-100 align-middle last:border-0">
              <td className="py-3"><strong>{stringValue(seller.storeName)}</strong><span className="mt-1 block text-slate-500">{stringValue(seller.sellerName)}</span><span className="mt-1 block font-mono text-[10px] text-slate-400">{stringValue(seller.sellerId)}</span></td>
              <td>{stringValue(seller.email)}<span className="mt-1 block text-slate-500">{stringValue(seller.phone)}</span></td>
              <td>{stringValue(seller.gstin, 'Registration pending')}</td>
              <td className="py-3 align-middle"><StatusBadge value={stringValue(seller.status, 'PENDING_REVIEW')} /></td>
              <td className="py-3 align-middle"><div className="flex min-w-[160px] items-center gap-1.5"><button disabled={busy || seller.status === 'APPROVED'} onClick={() => void updateSellerStatus(stringValue(seller.sellerId), 'APPROVED')} className="rounded-lg bg-emerald-800 px-2.5 py-2 text-[10px] font-bold text-white disabled:opacity-40">Approve</button><button disabled={busy || seller.status === 'SUSPENDED'} onClick={() => void updateSellerStatus(stringValue(seller.sellerId), 'SUSPENDED')} className="rounded-lg border border-rose-200 px-2.5 py-2 text-[10px] font-bold text-rose-700 disabled:opacity-40">Suspend</button></div></td>
            </tr>} empty="No seller accounts have been provisioned." />
          </Panel>}

          {dashboard && section === 'orders' && <Panel title="Orders & revenue register" subtitle="Saved order amount, seller association, referral and payment status.">
            <DataTable headers={['Order / customer', 'Vendor', 'Referral', 'Payment channel', 'Status', 'Revenue']} rows={dashboard.orders} render={(order, index) => <tr key={stringValue(order.orderId, String(index))} className="border-b border-slate-100 last:border-0">
              <td className="py-3"><strong>{stringValue(order.orderId)}</strong><span className="mt-1 block text-slate-500">{stringValue((order.customerDetails as DataRow | undefined)?.fullName)}</span><span className="mt-1 block text-[10px] text-slate-400">{dateValue(order.createdAt)}</span></td>
              <td>{stringValue((order.orderMetadata as DataRow | undefined)?.sellerId)}</td><td>{stringValue(order.refid, 'subhash')}</td>
              <td>{stringValue((order.payment as DataRow | undefined)?.paymentMethod)}</td><td><StatusBadge value={stringValue((order.payment as DataRow | undefined)?.paymentStatus)} /></td>
              <td className="text-right font-bold">{formatCurrency(amountFromOrder(order))}</td>
            </tr>} empty="No order records are available." />
          </Panel>}

          {dashboard && section === 'finance' && <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <SmallStat label="Recognized order revenue" value={dashboard.metrics.orders.revenue} currency />
              <SmallStat label="Recorded donation total" value={dashboard.metrics.donations.revenue} currency />
              <SmallStat label="Current stock cost value" value={dashboard.financials.catalogEconomics.stockCostValue} currency />
              <SmallStat label="Average listed margin / active SKU" value={dashboard.financials.catalogEconomics.averageListedMarginPerUnit} currency />
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-relaxed text-amber-950">
              <strong>Profit reporting limitation:</strong> the system does not store complete accounting costs, seller settlements, operating expenses, refunds, or historical cost snapshots. Stock value and catalog margin are current-catalog estimates only; they are not net profit, cash balance, or audited financial results.
            </div>
            <div className="grid gap-4 xl:grid-cols-2">
              <Panel title="Monthly collected revenue & welfare contribution" subtitle="Only PAID/SUCCESS orders count as collected revenue; contribution is reported separately.">
                <MonthlyBars rows={dashboard.financials.monthlyRevenue} />
              </Panel>
              <Panel title="Payment status reconciliation" subtitle="Amount and order count by recorded payment status; statuses are not a bank settlement statement.">
                <DataTable headers={['Payment status', 'Orders', 'Recorded amount']} rows={dashboard.financials.paymentStatuses} render={(row, index) => <tr key={`${row._id}-${index}`} className="border-b border-slate-100 last:border-0"><td className="py-3"><StatusBadge value={stringValue(row._id, 'Unknown')} /></td><td>{row.orders}</td><td className="text-right font-bold">{formatCurrency(row.amount)}</td></tr>} empty="No payment records." />
              </Panel>
              <Panel title="Seller revenue contribution" subtitle="Seller-associated order count, recognized revenue and saved welfare contribution.">
                <DataTable headers={['Seller ID', 'Orders', 'Revenue', 'Contribution']} rows={dashboard.financials.sellerPerformance} render={(row, index) => <tr key={`${row._id}-${index}`} className="border-b border-slate-100 last:border-0"><td className="py-3 font-mono text-[10px]">{stringValue(row._id)}</td><td>{row.orders}</td><td className="font-bold">{formatCurrency(row.revenue)}</td><td>{formatCurrency(row.contribution)}</td></tr>} empty="No seller-attributed orders." />
              </Panel>
              <Panel title="Working-capital snapshot" subtitle="Current active-catalog quantities multiplied by current costPrice.">
                <div className="grid grid-cols-2 gap-3"><SmallStat label="Active SKUs" value={dashboard.financials.catalogEconomics.activeProducts} /><SmallStat label="Units in stock" value={dashboard.financials.catalogEconomics.stockUnits} /></div>
                <div className="mt-3 rounded-xl bg-slate-50 p-3 text-xs text-slate-700">Estimated inventory cost value: <strong>{formatCurrency(dashboard.financials.catalogEconomics.stockCostValue)}</strong>. Historical cost changes are not tracked.</div>
              </Panel>
            </div>
          </div>}

          {dashboard && section === 'donations' && <div className="space-y-4">
            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-xs leading-relaxed text-blue-950"><strong>Record definition:</strong> this ledger currently includes order-linked donation contributions only. Direct donation form records are not submitted to a backend donation API yet, so they are not included here. There is no independent sponsor CRM; this is not a verified sponsor directory.</div>
            <div className="grid gap-4 xl:grid-cols-2"><Panel title="Contribution by cause" subtitle="Amounts calculated from saved donation documents.">
              <div className="space-y-3">{dashboard.donationCauses.map(item => <MetricLine key={item._id} label={`${item._id} · ${item.contributions} records`} value={item.revenue} max={Math.max(...dashboard.donationCauses.map(cause => Number(cause.revenue || 0)), 1)} color="bg-rose-500" />)}</div>
            </Panel><Panel title="Donor contribution register" subtitle={`${dashboard.donations.length} most recent contribution records`}>
              <DataTable headers={['Contributor', 'Source', 'Cause', 'Status', 'Amount']} rows={dashboard.donations} render={(donation, index) => <tr key={stringValue(donation.donationId, String(index))} className="border-b border-slate-100 last:border-0">
                <td className="py-3"><strong>{stringValue(donation.donorName)}</strong></td><td>{stringValue(donation.source)}</td><td>{stringValue(donation.cause)}</td><td><StatusBadge value={stringValue(donation.paymentStatus)} /></td><td className="text-right font-bold">{formatCurrency(donation.amount)}</td>
              </tr>} empty="No saved contribution entries exist." />
            </Panel></div>
          </div>}

          {dashboard && section === 'donations' && <Panel title="Repeat contributors" subtitle="Donors grouped by saved email from order-linked donation records; no standalone sponsor CRM exists yet.">
            <DataTable headers={['Contributor', 'Contribution records', 'Lifetime recorded amount', 'Last contribution']} rows={dashboard.donorContributors} render={(donor, index) => <tr key={`${donor._id.email}-${index}`} className="border-b border-slate-100 last:border-0"><td className="py-3"><strong>{stringValue(donor._id.name)}</strong><span className="mt-1 block text-slate-500">{stringValue(donor._id.email)}</span></td><td>{donor.contributionCount}</td><td className="font-bold">{formatCurrency(donor.totalContribution)}</td><td>{dateValue(donor.lastContributionAt)}</td></tr>} empty="No backend donor records exist." />
          </Panel>}

          {dashboard && section === 'channels' && <div className="grid gap-4 xl:grid-cols-2">
            <Panel title="Payment-channel revenue" subtitle="Channel means the recorded payment method; no separate marketing-channel attribution field exists yet.">
              <div className="space-y-4">{dashboard.orderChannels.map(channel => <MetricLine key={channel._id} label={`${channel._id} · ${channel.orders} orders`} value={channel.revenue} max={Math.max(...dashboard.orderChannels.map(item => Number(item.revenue || 0)), 1)} color="bg-blue-600" />)}</div>
            </Panel>
            <Panel title="Referral-source revenue" subtitle="Order attribution uses the saved refid; older missing values are reported as subhash.">
              <div className="space-y-4">{dashboard.referralChannels.map(channel => <MetricLine key={channel._id} label={`${channel._id} · ${channel.orders} orders`} value={channel.revenue} max={Math.max(...dashboard.referralChannels.map(item => Number(item.revenue || 0)), 1)} color="bg-emerald-700" />)}</div>
            </Panel>
            <Panel title="Revenue definitions" subtitle="Interpretation and source-of-truth notes">
              <div className="space-y-3"><Notice icon={CircleDollarSign} title="Collected order revenue" detail="Sum of final payable amount for PAID and SUCCESS records. Confirmed pay-on-delivery is not treated as cash collected." tone="blue" /><Notice icon={Wallet} title="Donation contribution" detail="Sum of saved, paid order-linked donation ledger amounts; direct donation entries are not yet backend-persisted." tone="rose" /><Notice icon={Activity} title="No inferred marketing channel" detail="This codebase does not persist campaign/marketing channel fields; do not treat payment method or refid as a complete channel CRM." tone="amber" /></div>
            </Panel>
          </div>}

          {dashboard && section === 'operations' && <div className="grid gap-4 xl:grid-cols-2">
            <Panel title="Low-stock watchlist" subtitle="Active/non-archived products with ten or fewer recorded units.">
              <div className="mb-3 grid grid-cols-2 gap-3"><SmallStat label="Low-stock SKUs" value={dashboard.operations.lowStockCount} /><SmallStat label="Open seller support tickets" value={dashboard.operations.openSellerTickets} /></div>
              <DataTable headers={['Product', 'Seller', 'Units', 'Status']} rows={dashboard.operations.lowStockProducts} render={(product, index) => <tr key={stringValue(product.id, String(index))} className="border-b border-slate-100 last:border-0"><td className="py-3 font-semibold">{stringValue(product.name)}</td><td>{stringValue(product.sellerId)}</td><td className="font-bold text-amber-800">{Number(product.stockQuantity || 0)}</td><td><StatusBadge value={stringValue(product.status)} /></td></tr>} empty="No low-stock alerts." />
            </Panel>
            <Panel title="Order fulfillment status" subtitle="Status counts from persisted order metadata.">
              <div className="space-y-4">{dashboard.financials.orderStatuses.map(status => <MetricLine key={stringValue(status._id)} label={`${stringValue(status._id, 'Unknown')} · ${status.orders} orders`} value={status.orders} max={Math.max(...dashboard.financials.orderStatuses.map(item => Number(item.orders || 0)), 1)} color="bg-violet-600" />)}</div>
            </Panel>
            <Panel title="Raffle ticket ledger" subtitle="Tickets by current status, using saved ticket price values.">
              <DataTable headers={['Ticket status', 'Tickets', 'Recorded ticket value']} rows={dashboard.financials.raffleTicketStatuses} render={(row, index) => <tr key={`${row._id}-${index}`} className="border-b border-slate-100 last:border-0"><td className="py-3"><StatusBadge value={stringValue(row._id, 'Unknown')} /></td><td>{row.tickets}</td><td className="text-right font-bold">{formatCurrency(row.revenue)}</td></tr>} empty="No raffle ticket records." />
            </Panel>
            <Panel title="Operational coverage" subtitle="Data readiness for a single administrator.">
              <div className="space-y-3"><Notice icon={TriangleAlert} title="Delivery route and SLA" detail="Order location/nodal point and saved delivery window are available in seller records; live route optimization and carrier tracking are not connected to admin reporting." tone="amber" /><Notice icon={ClipboardList} title="Seller support queue" detail="Open and in-progress seller tickets are counted for triage; customer support tickets are not represented in this schema." tone="blue" /></div>
            </Panel>
          </div>}

          {dashboard && section === 'analytics' && <div className="space-y-4">
            <Panel title="Monthly trend" subtitle="Up to 24 months of saved order history; months without date-typed createdAt values are omitted.">
              <MonthlyBars rows={dashboard.financials.monthlyRevenue} />
            </Panel>
            <div className="grid gap-4 xl:grid-cols-2">
              <Panel title="Order-volume trend" subtitle="Monthly order count">
                <div className="space-y-3">{dashboard.financials.monthlyRevenue.map(month => <MetricLine key={month._id} label={`${month._id} · ${month.orders} orders`} value={month.orders} max={Math.max(...dashboard.financials.monthlyRevenue.map(item => Number(item.orders || 0)), 1)} color="bg-violet-600" />)}</div>
              </Panel>
              <Panel title="Cause contributions" subtitle="Contribution records by saved welfare cause">
                <div className="space-y-3">{dashboard.donationCauses.map(cause => <MetricLine key={cause._id} label={`${cause._id} · ${cause.contributions} records`} value={cause.revenue} max={Math.max(...dashboard.donationCauses.map(item => Number(item.revenue || 0)), 1)} color="bg-rose-500" />)}</div>
              </Panel>
            </div>
          </div>}

          {dashboard && section === 'vendors' && <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3"><SmallStat label="Vendor accounts" value={dashboard.metrics.vendors.total} /><SmallStat label="Products in catalog" value={dashboard.metrics.products.total} /><SmallStat label="Active products" value={dashboard.metrics.products.active} /></div>
            <Panel title="Catalog & campaign register" subtitle="Seller-owned products and raffle campaigns currently saved in MongoDB.">
              <DataTable headers={['Product', 'Seller', 'Category', 'Availability', 'Price']} rows={dashboard.products} render={(product, index) => <tr key={stringValue(product.id, String(index))} className="border-b border-slate-100 last:border-0"><td className="py-3"><strong>{stringValue(product.name)}</strong><span className="mt-1 block font-mono text-[10px] text-slate-400">{stringValue(product.id)}</span></td><td>{stringValue(product.sellerId)}</td><td>{stringValue(product.category)}</td><td><StatusBadge value={stringValue(product.status)} /> <span className="mt-1 block text-[10px] text-slate-500">{Number(product.stockQuantity || 0)} stock</span></td><td className="text-right font-bold">{formatCurrency(product.price)}</td></tr>} empty="No catalog products are available." />
            </Panel>
            <Panel title="Raffle campaigns" subtitle={`${dashboard.campaigns.length} campaigns shown`}>
              <DataTable headers={['Campaign', 'Seller', 'Status', 'Ticket price', 'Draw date']} rows={dashboard.campaigns} render={(campaign, index) => <tr key={stringValue(campaign.campaignId, String(index))} className="border-b border-slate-100 last:border-0"><td className="py-3"><strong>{stringValue(campaign.itemName)}</strong><span className="mt-1 block font-mono text-[10px] text-slate-400">{stringValue(campaign.campaignId)}</span></td><td>{stringValue(campaign.sellerId)}</td><td><StatusBadge value={stringValue(campaign.status)} /></td><td>{formatCurrency(campaign.ticketPrice)}</td><td>{dateValue(campaign.drawDate)}</td></tr>} empty="No raffle campaigns are registered." />
            </Panel>
          </div>}

          {dashboard && section === 'governance' && <Panel title="Administrator audit trail" subtitle="Seller access status changes initiated from this console.">
            <DataTable headers={['Time', 'Actor', 'Action', 'Seller']} rows={dashboard.auditEvents} render={(event, index) => <tr key={`${stringValue(event.sellerId)}-${index}`} className="border-b border-slate-100 last:border-0"><td className="py-3">{dateValue(event.occurredAt)}</td><td>{stringValue(event.actor)}</td><td><StatusBadge value={stringValue(event.action)} /></td><td className="font-mono text-[11px]">{stringValue(event.sellerId)}</td></tr>} empty="No administrator actions have been recorded yet." />
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">The audit trail records approval and suspension actions. It is operational governance logging, not a substitute for an immutable external audit ledger.</div>
          </Panel>}
          <footer className="flex flex-wrap items-center justify-between gap-2 py-3 text-[10px] text-slate-400"><span>Restricted admin workspace · MongoDB-backed live records</span><span>Approval notifications use configured SMTP; recovery delivery requires configured SMTP and Twilio SMS.</span></footer>
        </div>
      </main>
    </div>
  );
};

const Panel: React.FC<{ title: string; subtitle: string; children: React.ReactNode; action?: React.ReactNode }> = ({ title, subtitle, children, action }) => (
  <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
    <div className="mb-4 flex items-start justify-between gap-3"><div><h2 className="text-sm font-black text-slate-900">{title}</h2><p className="mt-1 text-[11px] text-slate-500">{subtitle}</p></div>{action}</div>
    {children}
  </section>
);

const MetricLine: React.FC<{ label: string; value: unknown; max: number; color: string }> = ({ label, value, max, color }) => (
  <div><div className="mb-1.5 flex items-center justify-between gap-2 text-xs"><span className="truncate font-semibold text-slate-600">{label}</span><strong>{formatCurrency(value)}</strong></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${color}`} style={{ width: `${Math.max(Number(value || 0) > 0 ? 2 : 0, Math.min(100, Number(value || 0) / max * 100))}%` }} /></div></div>
);

const Notice: React.FC<{ icon: React.ElementType; title: string; detail: string; tone: 'amber' | 'slate' | 'blue' | 'rose' }> = ({ icon: Icon, title, detail, tone }) => {
  const tones = { amber: 'bg-amber-50 text-amber-900', slate: 'bg-slate-100 text-slate-800', blue: 'bg-blue-50 text-blue-900', rose: 'bg-rose-50 text-rose-900' };
  return <div className={`flex items-start gap-2.5 rounded-xl p-3 ${tones[tone]}`}><Icon className="mt-0.5 h-4 w-4 shrink-0" /><div><p className="text-xs font-bold">{title}</p><p className="mt-0.5 text-[10px] leading-relaxed opacity-80">{detail}</p></div></div>;
};

const SmallStat: React.FC<{ label: string; value: number; currency?: boolean }> = ({ label, value, currency = false }) => <div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-xs font-semibold text-slate-500">{label}</p><p className="mt-1 text-2xl font-black">{currency ? formatCurrency(value) : Number(value).toLocaleString('en-IN')}</p></div>;

const MonthlyBars: React.FC<{ rows: DashboardData['financials']['monthlyRevenue'] }> = ({ rows }) => {
  const max = Math.max(...rows.map(row => Number(row.revenue || 0)), 1);
  return rows.length ? (
    <div className="overflow-x-auto pb-2">
      <div className="flex h-48 min-w-max items-end gap-2 border-b border-slate-200 px-1">
        {rows.map(row => <div key={row._id} className="flex h-full w-14 flex-col justify-end text-center">
          <span className="mb-1 text-[9px] font-bold text-slate-600">{formatCurrency(row.revenue)}</span>
          <div className="mx-auto flex w-8 items-end gap-0.5" style={{ height: '72%' }}>
            <div className="w-4 rounded-t bg-blue-600" title={`Revenue ${formatCurrency(row.revenue)}`} style={{ height: `${Math.max(Number(row.revenue) > 0 ? 3 : 0, Number(row.revenue || 0) / max * 100)}%` }} />
            <div className="w-3 rounded-t bg-rose-400" title={`Recorded welfare contribution ${formatCurrency(row.donation)}`} style={{ height: `${Math.max(Number(row.donation) > 0 ? 3 : 0, Number(row.donation || 0) / max * 100)}%` }} />
          </div>
          <span className="mt-2 text-[9px] font-semibold text-slate-500">{row._id}</span>
        </div>)}
      </div>
      <div className="mt-2 flex gap-4 text-[10px] text-slate-500"><span className="flex items-center gap-1"><i className="h-2 w-2 rounded-sm bg-blue-600" /> Order revenue</span><span className="flex items-center gap-1"><i className="h-2 w-2 rounded-sm bg-rose-400" /> Welfare contribution</span></div>
    </div>
  ) : <p className="py-8 text-center text-xs text-slate-400">No date-typed order history is available for charting.</p>;
};

const StatusBadge: React.FC<{ value: string }> = ({ value }) => {
  const tone = value.toUpperCase().includes('APPROVED') || value.toUpperCase() === 'ACTIVE' || value.toUpperCase() === 'PAID' || value.toUpperCase() === 'SUCCESS'
    ? 'bg-emerald-100 text-emerald-800'
    : value.toUpperCase().includes('PENDING') || value.toUpperCase().includes('REVIEW')
      ? 'bg-amber-100 text-amber-800'
      : value.toUpperCase().includes('SUSPENDED') || value.toUpperCase().includes('CANCEL')
        ? 'bg-rose-100 text-rose-800'
        : 'bg-slate-100 text-slate-700';
  return <span className={`inline-flex rounded-full px-2 py-1 text-[9px] font-black uppercase tracking-wide ${tone}`}>{value.replace(/_/g, ' ')}</span>;
};

const DataTable: React.FC<{
  headers: string[];
  rows: DataRow[];
  render: (row: DataRow, index: number) => React.ReactNode;
  empty: string;
}> = ({ headers, rows, render, empty }) => (
  <div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left text-[11px]"><thead><tr className="border-b border-slate-200 text-[9px] uppercase tracking-wider text-slate-400">{headers.map(header => <th key={header} className="pb-2 pr-3 last:pr-0">{header}</th>)}</tr></thead><tbody>{rows.map(render)}</tbody></table>{!rows.length && <p className="py-8 text-center text-xs text-slate-400">{empty}</p>}</div>
);
