import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Calendar, Users, Layout, UserPlus, BarChart } from 'lucide-react';
import { motion } from 'motion/react';
import NotificationsMenu from './NotificationsMenu';

export default function PersonLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/public/check')
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
    { path: '/dashboard', label: 'Übersicht', icon: Layout },
    { path: '/dashboard', label: 'Meine Events', icon: Calendar },
  ];

  return (
    <div className="min-h-screen bg-surface text-white flex flex-col selection:bg-white/20">
      <header className="sticky top-0 z-50 bg-black/60 backdrop-blur-2xl border-b border-white/5 pt-safe">
        <div className="max-w-[1920px] mx-auto px-6 sm:px-12 h-20 flex items-center justify-between">
          <div className="flex items-center gap-16">
            <div 
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-4 text-white font-serif text-2xl tracking-tighter group active:scale-95 transition-transform cursor-pointer"
            >
              <div className="w-12 h-12 bg-white text-black rounded-2xl flex items-center justify-center transition-all group-hover:rotate-6 group-hover:scale-110 shadow-2xl shadow-white/10 ring-1 ring-white/20">
                <Calendar className="w-6 h-6" />
              </div>
              <div className="flex flex-col -space-y-1">
                <span className="font-black tracking-tighter italic">JT-ORGA</span>
                <span className="micro-label !text-[8px] opacity-40 italic">Mitglieder</span>
              </div>
            </div>
            <nav className="hidden lg:flex gap-1 bg-white/[0.03] rounded-2xl p-1 border border-white/5">
              {navItems.map(item => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <div 
                    key={item.path} 
                    onClick={() => navigate(item.path)}
                    className={`relative flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all group cursor-pointer ${isActive ? 'text-white' : 'text-white/30 hover:text-white/60 hover:bg-white/[0.02]'}`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="nav-indicator"
                        className="absolute inset-0 bg-white/10 rounded-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] border border-white/5"
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                    <Icon className="w-3.5 h-3.5 relative z-10 transition-transform group-hover:scale-110" />
                    <span className="relative z-10">{item.label}</span>
                  </div>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-6">
            <NotificationsMenu apiPrefix="/api/public" />
            <div className="h-6 w-px bg-white/10 hidden sm:block" />
            <button 
              onClick={handleLogout}
              className="group flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-white/5 border border-white/5 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 transition-all active:scale-95"
            >
              <LogOut className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              <span className="hidden xl:inline text-[10px] font-black uppercase tracking-widest">Abmelden</span>
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

      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#000000]/80 backdrop-blur-3xl border-t border-white/5 px-6 pt-3 pb-safe">
        <div className="flex items-center justify-between max-w-md mx-auto">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <div 
                key={item.path} 
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center gap-1.5 transition-all active:scale-90 cursor-pointer ${isActive ? 'text-white' : 'text-white/30'}`}
              >
                <div className={`p-2.5 rounded-2xl transition-all ${isActive ? 'bg-white/10 text-white' : ''}`}>
                  <Icon className="w-5 h-5" />
                  {isActive && (
                    <motion.div 
                      layoutId="tab-underline"
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full translate-y-3" 
                    />
                  )}
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
              </div>
            );
          })}
        </div>
      </nav>
    </div>
  );
}