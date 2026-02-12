import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Package, BarChart3, Users, CreditCard,
  Monitor, LogOut, Crown, Menu, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '../store/authStore';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/dashboard/inventory', icon: Package, label: 'Inventory' },
  { to: '/dashboard/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/dashboard/leads', icon: Users, label: 'Leads' },
  { to: '/dashboard/subscription', icon: CreditCard, label: 'Subscription' },
];

export default function DashboardLayout() {
  const navigate = useNavigate();
  const { shop, signOut } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const subscriptionColors = {
    trial: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    expired: 'bg-red-500/10 text-red-400 border-red-500/30'
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-red-500/30">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-red-900/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-rose-900/10 rounded-full blur-[150px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20" />
      </div>

      {/* Mobile Top Bar */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 bg-black/60 backdrop-blur-xl border-b border-white/5">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-rose-700 flex items-center justify-center shadow-lg shadow-red-500/20 border border-white/10 overflow-hidden">
              <img src="/assets/logo.png" alt="RetailVision" className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold truncate">{shop?.shop_name || 'My Shop'}</div>
              <div className="text-[11px] text-slate-400 truncate">Owner Dashboard</div>
            </div>
          </div>
          <button
            className="inline-flex items-center justify-center w-11 h-11 rounded-full border border-white/10 bg-white/5 hover:bg-white/10"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/70" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full w-64 bg-black/70 md:bg-black/50 backdrop-blur-xl border-r border-white/5 z-50 transform transition-transform duration-300 md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Mobile close */}
        <div className="md:hidden p-4 flex justify-end">
          <button
            className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-white/10 bg-white/5 hover:bg-white/10"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {/* Logo & Shop Info */}
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-red-600 to-rose-700 flex items-center justify-center shadow-lg shadow-red-500/20 border border-white/10 overflow-hidden">
              <img src="/assets/logo.png" alt="RetailVision" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-bold text-white truncate">{shop?.shop_name || 'My Shop'}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${subscriptionColors[shop?.subscription_status] || subscriptionColors.trial}`}>
                  <Crown className="w-3 h-3" />
                  {shop?.subscription_status
                    ? shop.subscription_status.charAt(0).toUpperCase() + shop.subscription_status.slice(1)
                    : 'Trial'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all border ${
                  isActive
                    ? 'bg-gradient-to-r from-red-600/20 to-rose-600/20 text-red-300 border-red-500/30'
                    : 'border-transparent text-slate-400 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Bottom Actions */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/5 bg-black/40">
          <Button
            onClick={() => navigate('/kiosk')}
            className="w-full mb-3 rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/20 border border-white/5"
          >
            <Monitor className="w-4 h-4 mr-2" />
            Launch Kiosk
          </Button>
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="w-full rounded-xl text-slate-400 hover:text-white hover:bg-white/5"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="min-h-screen relative z-10 md:ml-64 pt-16 md:pt-0">
        <Outlet />
      </main>
    </div>
  );
}
