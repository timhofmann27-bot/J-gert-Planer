import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, MapPin, Clock, ChevronRight, Edit2, Trash2, Settings, Users, CheckCircle2, Calendar, Archive, Hourglass } from 'lucide-react';
import { motion } from 'motion/react';
import { format, parseISO, formatDistanceToNow, isFuture } from 'date-fns';
import { de } from 'date-fns/locale';
import toast from 'react-hot-toast';
import ConfirmModal from '../components/ConfirmModal';
import SettingsModal from '../components/SettingsModal';

export default function Dashboard() {
  const [aktionen, setAktionen] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [editingAktion, setEditingAktion] = useState<any>(null);
  const [formData, setFormData] = useState({ title: '', date: '', location: '', meeting_point: '', description: '', response_deadline: '' });
  
  const [stats, setStats] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  useEffect(() => {
    fetchAktionen();
    fetchStats();
  }, []);

  const fetchAktionen = async () => {
    try {
      const res = await fetch('/api/admin/events');
      if (res.ok) setAktionen(await res.json());
    } catch (e) {
      toast.error('Fehler beim Laden der Aktionen');
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats');
      if (res.ok) setStats(await res.json());
    } catch (e) {
      toast.error('Fehler beim Laden der Statistik');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingAktion ? `/api/admin/events/${editingAktion.id}` : '/api/admin/events';
    const method = editingAktion ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Fehler beim Speichern');
      }

      toast.success(editingAktion ? 'Aktion aktualisiert' : 'Aktion erstellt');
      setShowModal(false);
      setEditingAktion(null);
      setFormData({ title: '', date: '', location: '', meeting_point: '', description: '', response_deadline: '' });
      fetchAktionen();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/admin/events/${deleteId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Fehler beim Löschen');
      toast.success('Aktion gelöscht');
      fetchAktionen();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setDeleteId(null);
    }
  };

  const handleArchive = async (e: React.MouseEvent, id: number, is_archived: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const res = await fetch(`/api/admin/events/${id}/archive`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_archived: !is_archived })
      });
      if (!res.ok) throw new Error('Fehler beim Archivieren');
      toast.success(is_archived ? 'Aktion wiederhergestellt' : 'Aktion archiviert');
      fetchAktionen();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const openEdit = (e: React.MouseEvent, aktion: any) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingAktion(aktion);
    setFormData({ 
      title: aktion.title, 
      date: aktion.date, 
      location: aktion.location, 
      meeting_point: aktion.meeting_point || '',
      description: aktion.description || '', 
      response_deadline: aktion.response_deadline || '' 
    });
    setShowModal(true);
  };

  const openNew = () => {
    setEditingAktion(null);
    setFormData({ title: '', date: '', location: '', meeting_point: '', description: '', response_deadline: '' });
    setShowModal(true);
  };

  const now = new Date();
  const activeAktionen = aktionen.filter(e => !e.is_archived);
  const archivedAktionen = aktionen.filter(e => e.is_archived);
  const upcomingAktionen = activeAktionen.filter(e => new Date(e.date) >= now).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const pastAktionen = activeAktionen.filter(e => new Date(e.date) < now).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const renderAktionCard = (aktion: any, index: number) => (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ scale: 1.02, y: -5 }}
      whileTap={{ scale: 0.98 }}
      key={aktion.id}
    >
      <Link
        to={`/events/${aktion.id}`}
        className="bg-white/5 backdrop-blur-xl rounded-[2rem] border border-white/10 p-6 hover:bg-white/10 transition-all group flex flex-col relative overflow-hidden h-full"
      >
        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <button onClick={(e) => handleArchive(e, aktion.id, !!aktion.is_archived)} className={`p-2 bg-black/50 backdrop-blur-md border border-white/10 ${aktion.is_archived ? 'text-blue-400' : 'text-white/70'} hover:text-blue-400 rounded-xl transition-colors`}>
            <Archive className="w-4 h-4" />
          </button>
          <button onClick={(e) => openEdit(e, aktion)} className="p-2 bg-black/50 backdrop-blur-md border border-white/10 text-white/70 hover:text-white rounded-xl transition-colors">
            <Edit2 className="w-4 h-4" />
          </button>
          <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDeleteId(aktion.id); }} className="p-2 bg-black/50 backdrop-blur-md border border-white/10 text-white/70 hover:text-red-400 rounded-xl transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
        
        <h3 className="font-bold text-xl text-white mb-3 pr-16 group-hover:text-blue-400 transition-colors">
          {aktion.title}
        </h3>
        <div className="space-y-3 text-sm text-white/60 flex-1">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4 text-white/80" />
            </div>
            <span className="font-medium">{format(parseISO(aktion.date), 'EEEE, dd.MM.yyyy HH:mm', { locale: de })}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4 text-white/80" />
            </div>
            <span className="font-medium">{aktion.location}</span>
          </div>
          {aktion.response_deadline && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                <Hourglass className="w-4 h-4 text-white/80" />
              </div>
              <span className="font-medium">
                {isFuture(parseISO(aktion.response_deadline)) 
                  ? `Frist: ${formatDistanceToNow(parseISO(aktion.response_deadline), { addSuffix: true, locale: de })}`
                  : 'Frist abgelaufen'}
              </span>
            </div>
          )}
          <div className="flex items-center gap-3 pt-4 mt-4 border-t border-white/10">
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4 text-white/80" />
            </div>
            <span className="text-white font-semibold">
              {aktion.yes_count || 0} Zusagen <span className="text-white/40 font-normal">von {aktion.total_invites || 0}</span>
            </span>
          </div>
        </div>
        <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-sm text-white font-semibold">
          <span>Details ansehen</span>
          <ChevronRight className="w-5 h-5 text-white/40 group-hover:text-white transition-colors" />
        </div>
      </Link>
    </motion.div>
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
        <h1 className="text-3xl font-bold text-white tracking-tight">Aktionen</h1>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <button
            onClick={() => setShowSettings(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white/10 border border-white/10 text-white px-5 py-2.5 rounded-xl hover:bg-white/20 transition-all text-sm font-semibold backdrop-blur-md"
          >
            <Settings className="w-4 h-4" />
            Einstellungen
          </button>
          <button
            onClick={openNew}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white text-black px-5 py-2.5 rounded-xl hover:bg-gray-200 transition-all text-sm font-bold shadow-[0_0_15px_rgba(255,255,255,0.2)]"
          >
            <Plus className="w-4 h-4" />
            Neue Aktion
          </button>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <div className="bg-[#111] p-6 rounded-[2rem] border border-white/10 shadow-xl">
            <div className="text-white/40 text-[10px] uppercase tracking-widest font-black mb-2">Aktionen</div>
            <div className="text-3xl font-black text-white">{stats.events}</div>
          </div>
          <div className="bg-[#111] p-6 rounded-[2rem] border border-white/10 shadow-xl">
            <div className="text-white/40 text-[10px] uppercase tracking-widest font-black mb-2">Archiviert</div>
            <div className="text-3xl font-black text-blue-400">{stats.archived_events} <span className="text-sm font-bold text-white/40">({stats.archived_pct.toFixed(1)}%)</span></div>
          </div>
          <div className="bg-[#111] p-6 rounded-[2rem] border border-white/10 shadow-xl">
            <div className="text-white/40 text-[10px] uppercase tracking-widest font-black mb-2">Personen</div>
            <div className="text-3xl font-black text-white">{stats.persons}</div>
          </div>
          <div className="bg-[#111] p-6 rounded-[2rem] border border-white/10 shadow-xl">
            <div className="text-white/40 text-[10px] uppercase tracking-widest font-black mb-2">Einladungen</div>
            <div className="text-3xl font-black text-white">{stats.invites}</div>
          </div>
        </div>
      )}

      {upcomingAktionen.length > 0 && (
        <div className="mb-12">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            Anstehende Aktionen
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {upcomingAktionen.map((e, i) => renderAktionCard(e, i))}
          </div>
        </div>
      )}

      {pastAktionen.length > 0 && (
        <div className="mb-12">
          <h2 className="text-xl font-bold text-white/50 mb-6 flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-white/20" />
            Vergangene Aktionen
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 opacity-60 hover:opacity-100 transition-opacity duration-500">
            {pastAktionen.map((e, i) => renderAktionCard(e, i))}
          </div>
        </div>
      )}

      {archivedAktionen.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xl font-bold text-white/50 mb-6 flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-blue-500/50" />
            Archivierte Aktionen
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 opacity-50">
            {archivedAktionen.map((e, i) => renderAktionCard(e, i))}
          </div>
        </div>
      )}

      {aktionen.length === 0 && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="col-span-full text-center py-24 bg-white/5 rounded-[2.5rem] border border-dashed border-white/20 backdrop-blur-xl relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
          <motion.div 
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', damping: 15, delay: 0.2 }}
            className="w-24 h-24 bg-white/10 backdrop-blur-xl rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-white/10 shadow-2xl"
          >
            <Calendar className="w-12 h-12 text-white/60" />
          </motion.div>
          <p className="text-white/60 mb-8 text-lg font-medium">Noch keine Aktionen erstellt.</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={openNew}
            className="text-white font-bold hover:text-blue-400 transition-colors inline-flex items-center gap-2"
          >
            Erste Aktion anlegen <ChevronRight className="w-4 h-4" />
          </motion.button>
        </motion.div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-2xl">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-[#111] border border-white/10 rounded-[2.5rem] shadow-2xl max-w-md w-full p-8 max-h-[90vh] overflow-y-auto relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
            <h2 className="text-3xl font-bold mb-8 text-white tracking-tight relative z-10">{editingAktion ? 'Aktion bearbeiten' : 'Neue Aktion'}</h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-2">Titel</label>
                <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:ring-2 focus:ring-white/30 outline-none transition-all" placeholder="z.B. Wanderung im Taunus" />
              </div>
              <div>
                <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-2">Datum & Uhrzeit</label>
                <input required type="datetime-local" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:ring-2 focus:ring-white/30 outline-none transition-all [color-scheme:dark]" />
              </div>
              <div>
                <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-2">Ort</label>
                <input required type="text" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:ring-2 focus:ring-white/30 outline-none transition-all" />
              </div>
              <div>
                <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-2">Treffpunkt (optional)</label>
                <input type="text" value={formData.meeting_point} onChange={e => setFormData({...formData, meeting_point: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:ring-2 focus:ring-white/30 outline-none transition-all" placeholder="z.B. Parkplatz am Zoo" />
              </div>
              <div>
                <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-2">Beschreibung (optional)</label>
                <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:ring-2 focus:ring-white/30 outline-none transition-all" rows={3}></textarea>
              </div>
              <div>
                <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-2">Antwortfrist (optional)</label>
                <input type="datetime-local" value={formData.response_deadline} onChange={e => setFormData({...formData, response_deadline: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:ring-2 focus:ring-white/30 outline-none transition-all [color-scheme:dark]" />
                <p className="text-xs text-white/40 mt-2">Nach diesem Datum können Teilnehmer nicht mehr antworten.</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 pt-6">
                <button type="button" onClick={() => setShowModal(false)} className="w-full sm:flex-1 px-4 py-3 border border-white/10 text-white rounded-xl hover:bg-white/5 font-bold transition-colors">Abbrechen</button>
                <button type="submit" className="w-full sm:flex-1 px-4 py-3 bg-white text-black rounded-xl hover:bg-gray-200 font-bold transition-colors">Speichern</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      <ConfirmModal 
        isOpen={deleteId !== null}
        title="Aktion löschen"
        message="Möchtest du diese Aktion wirklich löschen? Alle Einladungen und Antworten werden ebenfalls unwiderruflich gelöscht."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />

      <SettingsModal 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
      />
    </div>
  );
}
