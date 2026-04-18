import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { LogOut, Calendar, Users, BarChart, Layout, UserPlus } from 'lucide-react';
import { motion } from 'motion/react';
import NotificationsMenu from './NotificationsMenu';

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/check')
      .then(res => {
        if (!res.ok) throw new Error('Not logged in');
        return res.json();
      })
      .then(() => setLoading(false))
      .catch(() => navigate('/login'));
  }, [navigate]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    navigate('/login');
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white/50">Lade...</div>;

  const navItems = [
    { path: '/', label: 'Aktionen', icon: Calendar },
    { path: '/persons', label: 'Mitglieder', icon: Users },
    { path: '/registration-requests', label: 'Anfragen', icon: UserPlus },
    { path: '/stats', label: 'Statistik', icon: BarChart },
    { path: '/dashboard', label: 'Meine Übersicht', icon: Layout },
  ];

  return (
    <div className="min-h-screen bg-surface text-white flex flex-col selection:bg-white/20">
      <header className="sticky top-0 z-50 bg-black/60 backdrop-blur-2xl border-b border-white/5 pt-safe">
        <div className="max-w-[1920px] mx-auto px-6 sm:px-10 h-20 flex items-center justify-between">
          <div className="flex items-center gap-12">
            <Link to="/" className="flex items-center gap-4 text-white font-serif text-xl tracking-tight group active:scale-98 transition-transform">
              <div className="w-10 h-10 bg-white text-black rounded-lg flex items-center justify-center transition-all group-hover:rotate-3">
                <Calendar className="w-5 h-5" />
              </div>
              <div className="flex flex-col -space-y-0.5">
                <span className="font-bold tracking-tight">JT-ORGA</span>
                <span className="text-[8px] font-medium uppercase tracking-widest opacity-40">System</span>
              </div>
            </Link>
            <nav className="hidden lg:flex gap-0.5 bg-white/[0.03] rounded-lg p-0.5 border border-white/5">
              {navItems.map(item => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path || (item.path === '/' && location.pathname.startsWith('/events'));
                return (
                  <Link 
                    key={item.path} 
                    to={item.path}
                    className={`relative flex items-center gap-2 px-5 py-2 rounded-md text-[10px] font-semibold uppercase tracking-widest transition-all ${isActive ? 'text-white' : 'text-white/40 hover:text-white hover:bg-white/[0.04]'}`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="nav-indicator"
                        className="absolute inset-0 bg-white/5 rounded-md border border-white/10"
                        transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                      />
                    )}
                    <Icon className="w-3.5 h-3.5 relative z-10" />
                    <span className="relative z-10">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <NotificationsMenu apiPrefix="/api/admin" />
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-md bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20 transition-all active:scale-98"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden xl:inline text-[10px] font-bold uppercase tracking-widest">Exit</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-[1920px] w-full mx-auto px-6 sm:px-12 py-12 pb-32 lg:pb-12 h-full">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="h-full"
        >
          <Outlet />
        </motion.div>
      </main>

      {/* Mobile Bottom Tab Bar (Native Style) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#000000]/80 backdrop-blur-3xl border-t border-white/5 px-6 pt-3 pb-safe">
        <div className="flex items-center justify-between max-w-md mx-auto">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path === '/' && location.pathname.startsWith('/events'));
            return (
              <Link 
                key={item.path} 
                to={item.path}
                className={`flex flex-col items-center gap-1.5 transition-all active:scale-90 relative ${isActive ? 'text-white' : 'text-white/30'}`}
              >
                <div className={`p-2.5 rounded-2xl transition-all relative ${isActive ? 'bg-white/10 text-white' : ''}`}>
                  <Icon className="w-5 h-5" />
                  {isActive && (
                    <motion.div 
                      layoutId="tab-underline"
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full translate-y-3" 
                    />
                  )}
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
