import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Calendar, MapPin, CheckCircle, XCircle, HelpCircle, LogOut, User, Clock, ChevronRight, AlertCircle } from 'lucide-react';
import { format, parseISO, differenceInSeconds } from 'date-fns';
import { de } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';
import NotificationsMenu from '../components/NotificationsMenu';

function Countdown({ deadline }: { deadline: string }) {
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    const target = parseISO(deadline);
    const update = () => {
      const diff = differenceInSeconds(target, new Date());
      setTimeLeft(Math.max(0, diff));
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [deadline]);

  if (timeLeft === 0) return null;

  const days = Math.floor(timeLeft / (24 * 3600));
  const hours = Math.floor((timeLeft % (24 * 3600)) / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;

  return (
    <motion.div 
      animate={timeLeft < 86400 ? { 
        scale: [1, 1.02, 1],
        boxShadow: ["0 0 0px rgba(239, 68, 68, 0)", "0 0 20px rgba(239, 68, 68, 0.2)", "0 0 0px rgba(239, 68, 68, 0)"]
      } : {}}
      transition={{ duration: 2, repeat: Infinity }}
      className="flex flex-col items-end justify-center px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-2xl backdrop-blur-md shrink-0"
    >
      <div className="text-[9px] font-black text-red-400 uppercase tracking-widest mb-1 flex items-center gap-1">
        <AlertCircle className="w-3 h-3" /> Frist läuft ab
      </div>
      <div className="flex gap-1.5 font-mono text-sm font-black text-white">
        {days > 0 && (
          <div className="flex flex-col items-center">
            <span>{days}d</span>
          </div>
        )}
        <div className="flex flex-col items-center">
          <span>{hours.toString().padStart(2, '0')}h</span>
        </div>
        <div className="flex flex-col items-center">
          <span>{minutes.toString().padStart(2, '0')}m</span>
        </div>
        <div className="flex flex-col items-center text-red-400">
          <span>{seconds.toString().padStart(2, '0')}s</span>
        </div>
      </div>
    </motion.div>
  );
}

export default function PersonDashboard() {
  const [user, setUser] = useState<any>(null);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/public/check');
        if (!res.ok) throw new Error('Not authenticated');
        const data = await res.json();
        setUser(data.user);
        
        const invRes = await fetch('/api/public/dashboard');
        if (invRes.ok) {
          const invData = await invRes.json();
          setInvitations(invData);
        }
      } catch (err) {
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await fetch('/api/public/logout', { method: 'POST' });
      toast.success('Abgemeldet');
      navigate('/login');
    } catch (err) {
      toast.error('Fehler beim Abmelden');
    }
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Lade...</div>;

  const upcoming = invitations.filter(i => new Date(i.date) >= new Date());
  const past = invitations.filter(i => new Date(i.date) < new Date());
  const pending = upcoming.filter(i => i.status === 'pending');
  const responded = upcoming.filter(i => i.status !== 'pending');

  return (
    <div className="min-h-screen bg-black pb-12">
      <header className="bg-black/50 border-b border-white/10 sticky top-0 z-10 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/10">
              <User className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-white text-lg hidden sm:inline">Hallo, {user?.name}</span>
          </div>
          <div className="flex items-center gap-6">
            <NotificationsMenu apiPrefix="/api/public" />
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors font-bold bg-white/5 px-4 py-2 rounded-xl border border-white/10 hover:bg-white/10"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Abmelden</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-10 space-y-12">
        {/* Offene Einladungen */}
        {pending.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center border border-amber-500/30">
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Offene Einladungen</h2>
            </div>
            <div className="grid gap-4">
              {pending.map((inv, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 30, scale: 0.95 }} 
                  animate={{ opacity: 1, y: 0, scale: 1 }} 
                  transition={{ duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }} 
                  whileHover={{ scale: 1.02, y: -5 }}
                  whileTap={{ scale: 0.98 }}
                  key={inv.id}
                >
                  <Link 
                    to={`/invite/${inv.token}`}
                    className={`bg-[#111] p-6 rounded-[2rem] shadow-xl border transition-all flex items-center justify-between group relative overflow-hidden ${
                      inv.response_deadline && differenceInSeconds(parseISO(inv.response_deadline), new Date()) < 86400 
                      ? 'border-red-500/50 shadow-red-500/10' 
                      : 'border-amber-500/30 hover:border-amber-400'
                    }`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-transparent pointer-events-none" />
                    {inv.response_deadline && differenceInSeconds(parseISO(inv.response_deadline), new Date()) < 86400 && (
                      <div className="absolute top-0 right-0 bg-red-500 text-white text-[8px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-widest z-20 animate-pulse">
                        Dringend
                      </div>
                    )}
                    <div className="flex items-start gap-5 relative z-10">
                      <div className="w-14 h-14 bg-amber-500/10 rounded-2xl flex flex-col items-center justify-center text-amber-400 shrink-0 border border-amber-500/20">
                        <span className="text-[10px] font-black uppercase tracking-widest">{format(parseISO(inv.date), 'MMM', { locale: de })}</span>
                        <span className="text-xl font-black leading-none">{format(parseISO(inv.date), 'dd')}</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-white group-hover:text-amber-400 transition-colors">{inv.title}</h3>
                        <div className="flex items-center gap-4 text-sm text-white/50 mt-2 font-medium">
                          <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {format(parseISO(inv.date), 'HH:mm')} Uhr</span>
                          <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {inv.location}</span>
                        </div>
                      </div>
                      {inv.response_deadline && (
                        <div className="ml-auto">
                          <Countdown deadline={inv.response_deadline} />
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3 relative z-10">
                      <span className="text-sm font-bold text-white/40 group-hover:text-amber-400 transition-colors hidden sm:block">Antworten</span>
                      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
                        <ChevronRight className="w-5 h-5 text-white/30 group-hover:text-amber-400 transition-colors" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Meine Aktionen */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center border border-white/10">
              <Calendar className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Kommende Aktionen</h2>
          </div>
          {responded.length > 0 ? (
            <div className="grid gap-4">
              {responded.map((inv, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 30, scale: 0.95 }} 
                  animate={{ opacity: 1, y: 0, scale: 1 }} 
                  transition={{ duration: 0.5, delay: i * 0.08 + 0.1, ease: [0.22, 1, 0.36, 1] }} 
                  whileHover={{ scale: 1.02, y: -5 }}
                  whileTap={{ scale: 0.98 }}
                  key={inv.id}
                >
                  <Link 
                    to={`/invite/${inv.token}`}
                    className="bg-[#111] p-6 rounded-[2rem] shadow-xl border border-white/10 hover:border-white/30 transition-all flex items-center justify-between group relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex items-start gap-5 relative z-10">
                      <div className="w-14 h-14 bg-white/5 rounded-2xl flex flex-col items-center justify-center text-white/60 shrink-0 border border-white/10">
                        <span className="text-[10px] font-black uppercase tracking-widest">{format(parseISO(inv.date), 'MMM', { locale: de })}</span>
                        <span className="text-xl font-black leading-none">{format(parseISO(inv.date), 'dd')}</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-white">{inv.title}</h3>
                        <div className="flex items-center gap-4 text-sm text-white/50 mt-2 font-medium">
                          <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {inv.location}</span>
                          <span className="flex items-center gap-1.5">
                            {inv.status === 'yes' && <span className="text-green-400 flex items-center gap-1 font-bold bg-green-500/10 px-2 py-0.5 rounded-md"><CheckCircle className="w-3.5 h-3.5" /> Zugesagt</span>}
                            {inv.status === 'no' && <span className="text-red-400 flex items-center gap-1 font-bold bg-red-500/10 px-2 py-0.5 rounded-md"><XCircle className="w-3.5 h-3.5" /> Abgesagt</span>}
                            {inv.status === 'maybe' && <span className="text-amber-400 flex items-center gap-1 font-bold bg-amber-500/10 px-2 py-0.5 rounded-md"><HelpCircle className="w-3.5 h-3.5" /> Vielleicht</span>}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 relative z-10">
                      <span className="text-sm font-bold text-white/40 group-hover:text-white transition-colors hidden sm:block">Bearbeiten</span>
                      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                        <ChevronRight className="w-5 h-5 text-white/30 group-hover:text-white transition-colors" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="bg-[#111] p-12 rounded-[2.5rem] border border-white/10 text-center flex flex-col items-center justify-center relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
              <motion.div 
                initial={{ scale: 0, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', damping: 15, delay: 0.2 }}
                className="w-20 h-20 bg-white/5 rounded-[2rem] flex items-center justify-center mb-6 border border-white/10 shadow-2xl relative z-10"
              >
                <Calendar className="w-10 h-10 text-white/30" />
              </motion.div>
              <p className="text-white/50 font-medium text-lg relative z-10">Du hast noch keine kommenden Aktionen mit Antwort.</p>
            </motion.div>
          )}
        </section>

        {/* Vergangene Aktionen */}
        {past.length > 0 && (
          <section className="opacity-60 hover:opacity-100 transition-opacity">
            <h2 className="text-xl font-bold text-white mb-6 tracking-tight">Vergangene Aktionen</h2>
            <div className="grid gap-3">
              {past.map((inv, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 20, scale: 0.98 }} 
                  animate={{ opacity: 1, y: 0, scale: 1 }} 
                  transition={{ duration: 0.4, delay: i * 0.05 + 0.2, ease: [0.22, 1, 0.36, 1] }} 
                  whileHover={{ scale: 1.01, x: 5 }}
                  whileTap={{ scale: 0.99 }}
                  key={inv.id}
                >
                  <Link to={`/invite/${inv.token}`} className="bg-[#111] p-5 rounded-2xl border border-white/10 flex items-center justify-between hover:bg-white/5 transition-colors group">
                    <div className="flex items-center gap-5">
                      <div className="text-sm font-black text-white/40 w-12 text-center bg-white/5 py-1 rounded-lg">
                        {format(parseISO(inv.date), 'dd.MM.')}
                      </div>
                      <div className="font-bold text-white/80 group-hover:text-white transition-colors">{inv.title}</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className={`text-xs font-black uppercase px-3 py-1 rounded-lg ${inv.status === 'yes' ? 'bg-green-500/10 text-green-400' : 'bg-white/5 text-white/40'}`}>
                        {inv.status === 'yes' ? 'Teilgenommen' : 'Nicht dabei'}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white/40 group-hover:text-white transition-colors hidden sm:block">Details</span>
                        <ChevronRight className="w-5 h-5 text-white/30 group-hover:text-white transition-colors" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
