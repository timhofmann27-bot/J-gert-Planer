import React, { useState, useEffect } from 'react';
import { X, Eye, EyeOff, Settings, Fingerprint } from 'lucide-react';
import toast from 'react-hot-toast';
import { startRegistration } from '@simplewebauthn/browser';
import { motion } from 'motion/react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: Props) {
  const [username, setUsername] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isRegisteringWebAuthn, setIsRegisteringWebAuthn] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/admin/settings')
        .then(res => res.json())
        .then(data => {
          if (data.username) setUsername(data.username);
        })
        .catch(() => toast.error('Fehler beim Laden der Einstellungen'));
      
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRegisterWebAuthn = async () => {
    setIsRegisteringWebAuthn(true);
    try {
      const resp = await fetch('/api/auth/webauthn/generate-registration-options', { method: 'POST' });
      if (!resp.ok) throw new Error('Fehler beim Generieren der Optionen');
      const options = await resp.json();

      const attResp = await startRegistration(options);

      const verificationResp = await fetch('/api/auth/webauthn/verify-registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(attResp),
      });

      if (!verificationResp.ok) throw new Error('Fehler bei der Verifizierung');
      toast.success('Biometrische Anmeldung erfolgreich eingerichtet!');
    } catch (e: any) {
      if (e.name === 'NotAllowedError') {
        toast.error('Registrierung abgebrochen');
      } else {
        toast.error(e.message || 'Fehler bei der Einrichtung');
      }
    } finally {
      setIsRegisteringWebAuthn(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword && !currentPassword) {
      toast.error('Bitte gib dein aktuelles Passwort ein, um ein neues zu setzen');
      return;
    }

    if (currentPassword && !newPassword) {
      toast.error('Bitte gib ein neues Passwort ein');
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      toast.error('Die neuen Passwörter stimmen nicht überein');
      return;
    }

    if (newPassword && newPassword.length < 8) {
      toast.error('Das neue Passwort muss mindestens 8 Zeichen lang sein');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, currentPassword, newPassword })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Fehler beim Speichern');
      }

      toast.success('Einstellungen erfolgreich gespeichert');
      onClose();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-2xl">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="bg-[#111] border border-white/10 rounded-[2.5rem] shadow-2xl max-w-md w-full p-8 relative overflow-y-auto max-h-[90vh]"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
        <button 
          onClick={onClose} 
          className="absolute top-6 right-6 text-white/40 hover:text-white transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="flex items-center gap-4 mb-8 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center shrink-0">
            <Settings className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Einstellungen</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
          <div>
            <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-2">Benutzername</label>
            <input 
              required 
              type="text" 
              value={username} 
              onChange={e => setUsername(e.target.value)} 
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:ring-2 focus:ring-white/30 outline-none transition-all" 
            />
          </div>

          <div className="pt-6 border-t border-white/10">
            <h3 className="text-sm font-bold text-white mb-4">Biometrische Anmeldung</h3>
            <p className="text-xs text-white/50 mb-4 leading-relaxed">
              Richte Passkeys ein, um dich in Zukunft sicher und schnell mit deinem Fingerabdruck, Face ID oder Windows Hello anzumelden.
            </p>
            <button
              type="button"
              onClick={handleRegisterWebAuthn}
              disabled={isRegisteringWebAuthn}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-xl hover:bg-blue-500/20 font-bold transition-colors disabled:opacity-50"
            >
              <Fingerprint className="w-5 h-5" />
              {isRegisteringWebAuthn ? 'Wird eingerichtet...' : 'Fingerabdruck / Face ID hinzufügen'}
            </button>
          </div>

          <div className="pt-6 border-t border-white/10">
            <h3 className="text-sm font-bold text-white mb-4">Passwort ändern (optional)</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-2">Aktuelles Passwort</label>
                <div className="relative">
                  <input 
                    type={showCurrent ? "text" : "password"} 
                    value={currentPassword} 
                    onChange={e => setCurrentPassword(e.target.value)} 
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 pr-10 text-white focus:ring-2 focus:ring-white/30 outline-none transition-all" 
                  />
                  <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors">
                    {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-2">Neues Passwort</label>
                <div className="relative">
                  <input 
                    type={showNew ? "text" : "password"} 
                    value={newPassword} 
                    onChange={e => setNewPassword(e.target.value)} 
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 pr-10 text-white focus:ring-2 focus:ring-white/30 outline-none transition-all" 
                  />
                  <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors">
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-2">Neues Passwort bestätigen</label>
                <div className="relative">
                  <input 
                    type={showConfirm ? "text" : "password"} 
                    value={confirmPassword} 
                    onChange={e => setConfirmPassword(e.target.value)} 
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 pr-10 text-white focus:ring-2 focus:ring-white/30 outline-none transition-all" 
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors">
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-6">
            <button 
              type="button" 
              onClick={onClose} 
              disabled={loading}
              className="w-full sm:flex-1 px-4 py-3 border border-white/10 text-white rounded-xl hover:bg-white/5 font-bold transition-colors disabled:opacity-50"
            >
              Abbrechen
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="w-full sm:flex-1 px-4 py-3 bg-white text-black rounded-xl hover:bg-gray-200 font-bold transition-colors disabled:opacity-50 flex items-center justify-center"
            >
              {loading ? 'Speichert...' : 'Speichern'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
