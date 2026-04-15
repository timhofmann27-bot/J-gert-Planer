import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion } from 'motion/react';
import { Calendar, Lock, User, Shield } from 'lucide-react';

export default function Login() {
  const [loginType, setLoginType] = useState<'person' | 'admin'>('person');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // The previous code used /api/auth/login for admin and /api/public/login for person
    const endpoint = loginType === 'admin' ? '/api/auth/login' : '/api/public/login';
    
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      if (res.ok) {
        toast.success('Erfolgreich angemeldet', {
          style: { background: '#333', color: '#fff', borderRadius: '12px' }
        });
        if (loginType === 'admin') {
          navigate('/');
        } else {
          navigate('/dashboard');
        }
      } else {
        const data = await res.json();
        toast.error(data.error || 'Login fehlgeschlagen', {
          style: { background: '#333', color: '#fff', borderRadius: '12px' }
        });
      }
    } catch (e) {
      toast.error('Netzwerkfehler', {
        style: { background: '#333', color: '#fff', borderRadius: '12px' }
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4 selection:bg-white/30 relative overflow-hidden">
      {/* Cinematic Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-10">
          <motion.div 
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', damping: 15, delay: 0.2 }}
            className="w-20 h-20 bg-white/10 backdrop-blur-xl rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-white/10 shadow-2xl"
          >
            <Calendar className="w-10 h-10 text-white" />
          </motion.div>
          <h1 className="text-4xl font-semibold tracking-tight mb-3">Willkommen</h1>
          <p className="text-white/50 text-sm font-medium">Bitte melde dich an, um fortzufahren.</p>
        </div>

        <div className="bg-white/5 backdrop-blur-3xl border border-white/10 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
          {/* Inner subtle glow */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

          {/* Animated Toggle Switch */}
          <div className="flex bg-black/40 p-1.5 rounded-2xl mb-8 relative z-10 shadow-inner">
            <button
              type="button"
              onClick={() => setLoginType('person')}
              className={`flex-1 py-3 text-sm font-semibold rounded-xl relative z-10 transition-colors duration-300 ${loginType === 'person' ? 'text-black' : 'text-white/60 hover:text-white'}`}
            >
              Mitglied
            </button>
            <button
              type="button"
              onClick={() => setLoginType('admin')}
              className={`flex-1 py-3 text-sm font-semibold rounded-xl relative z-10 transition-colors duration-300 ${loginType === 'admin' ? 'text-black' : 'text-white/60 hover:text-white'}`}
            >
              Admin
            </button>
            <motion.div
              layout
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-white rounded-xl shadow-md"
              style={{ left: loginType === 'person' ? '6px' : 'calc(50%)' }}
            />
          </div>

          <form onSubmit={handleLogin} className="space-y-5 relative z-10">
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/50 uppercase tracking-widest ml-1">
                Benutzername
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  {loginType === 'admin' ? <Shield className="w-5 h-5 text-white/40 group-focus-within:text-white transition-colors" /> : <User className="w-5 h-5 text-white/40 group-focus-within:text-white transition-colors" />}
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-black/20 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all focus:bg-black/40"
                  placeholder={loginType === 'admin' ? 'admin' : 'Benutzername'}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-white/50 uppercase tracking-widest ml-1">Passwort</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-white/40 group-focus-within:text-white transition-colors" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black/20 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all focus:bg-black/40"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={isLoading}
              type="submit"
              className="w-full bg-white text-black font-bold py-4 rounded-2xl mt-6 hover:bg-gray-100 transition-colors disabled:opacity-50 flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.3)]"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
              ) : (
                'Anmelden'
              )}
            </motion.button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
