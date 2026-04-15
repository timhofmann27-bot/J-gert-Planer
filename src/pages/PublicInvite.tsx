import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, MapPin, CheckCircle, XCircle, HelpCircle, Users, Lock, Mail, ArrowRight, User } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { motion } from 'motion/react';
import toast from 'react-hot-toast';

export default function PublicInvite() {
  const { token } = useParams();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const [status, setStatus] = useState('');
  const [comment, setComment] = useState('');
  const [guestsCount, setGuestsCount] = useState(0);

  // Profile setup state
  const [setupEmail, setSetupEmail] = useState('');
  const [setupPassword, setSetupPassword] = useState('');
  const [isSettingUp, setIsSettingUp] = useState(false);

  useEffect(() => {
    fetch(`/api/public/invite/${token}`)
      .then(res => {
        if (!res.ok) throw new Error('Ungültiger Link');
        return res.json();
      })
      .then(d => {
        setData(d);
        setStatus(d.invitee.status === 'pending' ? '' : d.invitee.status);
        setComment(d.invitee.comment || '');
        setGuestsCount(d.invitee.guests_count || 0);
      })
      .catch(e => setError(e.message));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!status) {
      toast.error('Bitte wähle eine Antwort aus.');
      return;
    }

    try {
      const res = await fetch(`/api/public/invite/${token}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, comment, guests_count: guestsCount })
      });

      if (res.ok) {
        setSuccess(true);
      } else {
        const err = await res.json();
        throw new Error(err.error || 'Fehler beim Speichern.');
      }
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleSetupProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSettingUp(true);
    try {
      const res = await fetch(`/api/public/invite/${token}/setup-profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: setupEmail, password: setupPassword })
      });

      if (res.ok) {
        toast.success('Profil erfolgreich erstellt!');
        // Refresh data to show profile is created
        const updatedData = { ...data };
        updatedData.invitee.has_profile = true;
        setData(updatedData);
      } else {
        const err = await res.json();
        throw new Error(err.error || 'Fehler beim Erstellen des Profils.');
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsSettingUp(false);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-[#111] p-8 rounded-[2rem] shadow-2xl border border-white/10 text-center max-w-md w-full">
          <div className="w-20 h-20 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-red-500/30">
            <XCircle className="w-10 h-10 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">Link ungültig</h1>
          <p className="text-white/50 font-medium">{error}</p>
        </motion.div>
      </div>
    );
  }

  if (!data) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Lade...</div>;

  const { aktion, invitee } = data;
  const isDeadlinePassed = aktion.response_deadline && new Date() > new Date(aktion.response_deadline);

  if (success) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 30 }} 
          animate={{ opacity: 1, scale: 1, y: 0 }} 
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="bg-[#111] p-10 rounded-[2.5rem] shadow-2xl border border-white/10 text-center max-w-md w-full relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent pointer-events-none" />
          <div className="relative z-10">
            <motion.div 
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', damping: 15, delay: 0.2 }}
              className="w-24 h-24 bg-green-500/20 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-green-500/30 shadow-2xl"
            >
              <CheckCircle className="w-12 h-12 text-green-400" />
            </motion.div>
            <h1 className="text-3xl font-bold text-white mb-3 tracking-tight">Vielen Dank, {invitee.name_snapshot || invitee.name}!</h1>
            <p className="text-white/60 mb-8 font-medium">Deine Antwort wurde erfolgreich gespeichert.</p>
            
            <div className="bg-white/5 p-6 rounded-2xl text-left text-sm text-white/70 border border-white/10 mb-8">
              <p className="font-bold text-white mb-2 uppercase tracking-widest text-xs">Deine aktuelle Antwort:</p>
              <p className="font-medium text-lg">
                {status === 'yes' && <span className="text-green-400">✅ Ich bin dabei</span>}
                {status === 'no' && <span className="text-red-400">❌ Ich kann leider nicht</span>}
                {status === 'maybe' && <span className="text-amber-400">❓ Ich weiß es noch nicht</span>}
              </p>
              {guestsCount > 0 && <p className="mt-2 text-white/50 font-bold">👥 + {guestsCount} Begleitperson(en)</p>}
            </div>
            
            <div className="flex flex-col gap-4">
              <Link 
                to="/dashboard"
                className="bg-white text-black font-bold py-4 px-6 rounded-xl hover:bg-gray-200 transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
              >
                Zum Dashboard <ArrowRight className="w-5 h-5" />
              </Link>
              <button 
                onClick={() => setSuccess(false)}
                className="text-white/40 hover:text-white text-sm font-bold transition-colors"
              >
                Antwort noch einmal ändern
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black py-12 px-4 sm:px-6">
      <div className="max-w-xl mx-auto space-y-8">
        {/* Header / Aktion Info */}
        <motion.div 
          initial={{ opacity: 0, y: 30, scale: 0.98 }} 
          animate={{ opacity: 1, y: 0, scale: 1 }} 
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="bg-[#111] rounded-[2.5rem] shadow-2xl border border-white/10 overflow-hidden relative"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
          <div className="bg-white/5 p-8 text-center border-b border-white/10 relative z-10">
            <h1 className="text-3xl font-bold mb-3 text-white tracking-tight">{aktion.title}</h1>
            <p className="text-white/60 font-medium text-lg">Hallo {invitee.name_snapshot || invitee.name}, du bist eingeladen!</p>
          </div>
          
          <div className="p-8 space-y-6 relative z-10">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center shrink-0 border border-white/10">
                <Calendar className="w-6 h-6 text-white/80" />
              </div>
              <div>
                <div className="font-bold text-white text-lg">Wann?</div>
                <div className="text-white/60 font-medium">{format(parseISO(aktion.date), 'EEEE, dd. MMMM yyyy', { locale: de })}</div>
                <div className="text-white/60 font-medium">{format(parseISO(aktion.date), 'HH:mm', { locale: de })} Uhr</div>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center shrink-0 border border-white/10">
                <MapPin className="w-6 h-6 text-white/80" />
              </div>
              <div>
                <div className="font-bold text-white text-lg">Wo?</div>
                <div className="text-white/60 font-medium">{aktion.location}</div>
                {aktion.meeting_point && (
                  <div className="text-sm text-white/40 mt-1 font-medium">Treffpunkt: {aktion.meeting_point}</div>
                )}
              </div>
            </div>

            {aktion.description && (
              <div className="pt-6 border-t border-white/10 mt-6">
                <div className="font-bold text-white mb-2 text-lg">Details</div>
                <p className="text-white/60 text-sm whitespace-pre-wrap leading-relaxed font-medium">{aktion.description}</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Response Form */}
        <motion.form 
          initial={{ opacity: 0, y: 30, scale: 0.98 }} 
          animate={{ opacity: 1, y: 0, scale: 1 }} 
          transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }} 
          onSubmit={handleSubmit} 
          className="bg-[#111] rounded-[2.5rem] shadow-2xl border border-white/10 p-8"
        >
          <h2 className="text-2xl font-bold text-white mb-6 tracking-tight">Deine Antwort</h2>
          
          {isDeadlinePassed && (
            <div className="bg-red-500/10 text-red-400 border border-red-500/20 p-4 rounded-xl mb-8 text-sm font-bold text-center">
              Die Antwortfrist für diese Aktion ist leider abgelaufen.
            </div>
          )}

          <div className={`grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 ${isDeadlinePassed ? 'opacity-50 pointer-events-none' : ''}`}>
            <motion.label 
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className={`
              cursor-pointer border-2 rounded-2xl p-5 text-center transition-all relative overflow-hidden
              ${status === 'yes' ? 'border-green-500 bg-green-500/10 text-green-400 shadow-[0_0_20px_rgba(34,197,94,0.2)]' : 'border-white/10 hover:border-white/30 bg-white/5 text-white/60'}
            `}>
              <input type="radio" name="status" value="yes" className="sr-only" checked={status === 'yes'} onChange={() => setStatus('yes')} disabled={isDeadlinePassed} />
              <CheckCircle className={`w-8 h-8 mx-auto mb-3 ${status === 'yes' ? 'text-green-400' : 'text-white/40'}`} />
              <span className="font-bold block">Bin dabei</span>
            </motion.label>
            
            <motion.label 
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className={`
              cursor-pointer border-2 rounded-2xl p-5 text-center transition-all relative overflow-hidden
              ${status === 'no' ? 'border-red-500 bg-red-500/10 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.2)]' : 'border-white/10 hover:border-white/30 bg-white/5 text-white/60'}
            `}>
              <input type="radio" name="status" value="no" className="sr-only" checked={status === 'no'} onChange={() => setStatus('no')} disabled={isDeadlinePassed} />
              <XCircle className={`w-8 h-8 mx-auto mb-3 ${status === 'no' ? 'text-red-400' : 'text-white/40'}`} />
              <span className="font-bold block">Kann nicht</span>
            </motion.label>

            <motion.label 
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className={`
              cursor-pointer border-2 rounded-2xl p-5 text-center transition-all relative overflow-hidden
              ${status === 'maybe' ? 'border-amber-500 bg-amber-500/10 text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.2)]' : 'border-white/10 hover:border-white/30 bg-white/5 text-white/60'}
            `}>
              <input type="radio" name="status" value="maybe" className="sr-only" checked={status === 'maybe'} onChange={() => setStatus('maybe')} disabled={isDeadlinePassed} />
              <HelpCircle className={`w-8 h-8 mx-auto mb-3 ${status === 'maybe' ? 'text-amber-400' : 'text-white/40'}`} />
              <span className="font-bold block">Vielleicht</span>
            </motion.label>
          </div>

          {status === 'yes' && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className={`mb-8 ${isDeadlinePassed ? 'opacity-50 pointer-events-none' : ''}`}>
              <label className="flex items-center gap-2 text-xs font-bold text-white/50 uppercase tracking-widest mb-3">
                <Users className="w-4 h-4" />
                Bringe ich Begleitpersonen mit?
              </label>
              <select 
                value={guestsCount} 
                onChange={e => setGuestsCount(Number(e.target.value))}
                className="w-full bg-black border border-white/10 rounded-xl p-4 text-white focus:ring-2 focus:ring-white/30 outline-none transition-all font-medium appearance-none"
                disabled={isDeadlinePassed}
              >
                <option value={0}>Nein, ich komme alleine</option>
                <option value={1}>+ 1 Person</option>
                <option value={2}>+ 2 Personen</option>
                <option value={3}>+ 3 Personen</option>
                <option value={4}>+ 4 Personen</option>
              </select>
            </motion.div>
          )}

          <div className={`mb-8 ${isDeadlinePassed ? 'opacity-50 pointer-events-none' : ''}`}>
            <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-3">
              Kommentar (optional)
            </label>
            <textarea 
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="z.B. Komme etwas später..."
              className="w-full bg-black border border-white/10 rounded-xl p-4 text-white focus:ring-2 focus:ring-white/30 outline-none transition-all font-medium"
              rows={3}
              disabled={isDeadlinePassed}
            />
          </div>

          {!isDeadlinePassed && (
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="w-full bg-white text-black font-bold py-4 px-6 rounded-xl hover:bg-gray-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] text-lg"
            >
              Antwort speichern
            </motion.button>
          )}
        </motion.form>

        {/* Profile Setup / Dashboard Link */}
        {!invitee.has_profile ? (
          <motion.div 
            initial={{ opacity: 0, y: 30, scale: 0.98 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }} 
            className="bg-[#111] rounded-[2.5rem] shadow-2xl border border-white/10 p-8 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 pointer-events-none" />
            <h2 className="text-2xl font-bold text-white mb-3 flex items-center gap-3 tracking-tight relative z-10">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              Profil erstellen
            </h2>
            <p className="text-white/60 mb-8 font-medium leading-relaxed">
              Erstelle ein Profil, um alle deine Einladungen an einem Ort zu sehen und deine Antworten jederzeit zu ändern.
            </p>
            
            <form onSubmit={handleSetupProfile} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-2">E-Mail Adresse</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                  <input 
                    type="email" 
                    required 
                    value={setupEmail}
                    onChange={e => setSetupEmail(e.target.value)}
                    placeholder="deine@email.de"
                    className="w-full bg-black border border-white/10 rounded-xl p-4 pl-12 text-white focus:ring-2 focus:ring-white/30 outline-none transition-all font-medium"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-2">Passwort wählen</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                  <input 
                    type="password" 
                    required 
                    minLength={8}
                    value={setupPassword}
                    onChange={e => setSetupPassword(e.target.value)}
                    placeholder="Mind. 8 Zeichen"
                    className="w-full bg-black border border-white/10 rounded-xl p-4 pl-12 text-white focus:ring-2 focus:ring-white/30 outline-none transition-all font-medium"
                  />
                </div>
              </div>
              <button 
                type="submit"
                disabled={isSettingUp}
                className="w-full bg-white/10 text-white font-bold py-4 px-6 rounded-xl hover:bg-white/20 transition-all disabled:opacity-50 border border-white/10 mt-2"
              >
                {isSettingUp ? 'Wird erstellt...' : 'Profil jetzt erstellen'}
              </button>
            </form>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-[#111] rounded-[2rem] shadow-2xl border border-white/10 p-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-500/20 rounded-2xl flex items-center justify-center border border-green-500/30">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <div className="font-bold text-white text-lg">Profil aktiv</div>
                <div className="text-white/50 font-medium">Du kannst dich jederzeit einloggen.</div>
              </div>
            </div>
            <Link 
              to="/dashboard"
              className="text-white font-bold text-sm hover:bg-white/10 px-4 py-2 rounded-xl transition-colors flex items-center gap-2 border border-white/10"
            >
              Dashboard <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  );
}
