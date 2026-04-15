import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Users, CalendarPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'motion/react';
import ConfirmModal from '../components/ConfirmModal';

export default function Persons() {
  const [persons, setPersons] = useState<any[]>([]);
  const [aktionen, setAktionen] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [selectedAktionId, setSelectedAktionId] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [editingPerson, setEditingPerson] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '', notes: '' });
  
  const [deleteId, setDeleteId] = useState<number | null>(null);

  useEffect(() => {
    fetchPersons();
    fetchAktionen();
  }, []);

  const fetchPersons = async () => {
    try {
      const res = await fetch('/api/admin/persons');
      if (res.ok) setPersons(await res.json());
    } catch (e) {
      toast.error('Fehler beim Laden der Personen');
    }
  };

  const fetchAktionen = async () => {
    try {
      const res = await fetch('/api/admin/events');
      if (res.ok) setAktionen(await res.json());
    } catch (e) {
      toast.error('Fehler beim Laden der Aktionen');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingPerson ? `/api/admin/persons/${editingPerson.id}` : '/api/admin/persons';
    const method = editingPerson ? 'PUT' : 'POST';

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

      toast.success(editingPerson ? 'Person aktualisiert' : 'Person angelegt');
      setShowModal(false);
      setEditingPerson(null);
      setFormData({ name: '', notes: '' });
      fetchPersons();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/admin/persons/${deleteId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Fehler beim Löschen');
      toast.success('Person gelöscht');
      fetchPersons();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setDeleteId(null);
    }
  };

  const handleBulkInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAktionId) return toast.error('Bitte wähle eine Aktion aus');
    
    setIsInviting(true);
    try {
      const personIds = persons.map(p => p.id);
      const res = await fetch(`/api/admin/events/${selectedAktionId}/invites/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ person_ids: personIds })
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Fehler beim Einladen');
      }

      const data = await res.json();
      toast.success(`${data.count} Personen erfolgreich eingeladen!`);
      setShowBulkModal(false);
      setSelectedAktionId('');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsInviting(false);
    }
  };

  const openEdit = (person: any) => {
    setEditingPerson(person);
    setFormData({ name: person.name, notes: person.notes || '' });
    setShowModal(true);
  };

  const openNew = () => {
    setEditingPerson(null);
    setFormData({ name: '', notes: '' });
    setShowModal(true);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3 tracking-tight">
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          Personen
        </h1>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <button
            onClick={() => setShowBulkModal(true)}
            disabled={persons.length === 0}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white/10 border border-white/10 text-white px-5 py-2.5 rounded-xl hover:bg-white/20 transition-all text-sm font-semibold disabled:opacity-50 backdrop-blur-md"
          >
            <CalendarPlus className="w-4 h-4" />
            Alle einladen
          </button>
          <button
            onClick={openNew}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white text-black px-5 py-2.5 rounded-xl hover:bg-gray-200 transition-all text-sm font-bold shadow-[0_0_15px_rgba(255,255,255,0.2)]"
          >
            <Plus className="w-4 h-4" />
            Person anlegen
          </button>
        </div>
      </div>

      <div className="bg-[#111] rounded-[2rem] shadow-xl border border-white/10 overflow-hidden">
        <div className="divide-y divide-white/5">
          {persons.map((person, i) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              key={person.id} 
              className="p-6 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-white/5 gap-4 transition-colors group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center font-black text-lg text-white shadow-inner">
                  {person.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-bold text-lg text-white">{person.name}</div>
                  {person.notes && <div className="text-sm text-white/50 mt-1">{person.notes}</div>}
                </div>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-auto sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => openEdit(person)}
                  className="p-2.5 text-white/60 bg-white/5 hover:text-white hover:bg-white/20 rounded-xl transition-all border border-white/10"
                  title="Bearbeiten"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setDeleteId(person.id)}
                  className="p-2.5 text-white/60 bg-white/5 hover:text-red-400 hover:bg-red-500/20 rounded-xl transition-all border border-white/10"
                  title="Löschen"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
          {persons.length === 0 && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="p-16 text-center relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
              <motion.div 
                initial={{ scale: 0, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', damping: 15, delay: 0.2 }}
                className="w-24 h-24 bg-white/5 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-white/10 shadow-2xl relative z-10"
              >
                <Users className="w-12 h-12 text-white/30" />
              </motion.div>
              <p className="text-white/50 font-medium text-lg relative z-10">Noch keine Personen angelegt.</p>
            </motion.div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-2xl">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-[#111] border border-white/10 rounded-[2.5rem] shadow-2xl max-w-md w-full p-8 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
            <h2 className="text-3xl font-bold mb-8 text-white tracking-tight relative z-10">{editingPerson ? 'Person bearbeiten' : 'Neue Person'}</h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-2">Name</label>
                <input 
                  required 
                  type="text" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:ring-2 focus:ring-white/30 outline-none transition-all" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-2">Notizen (optional)</label>
                <textarea 
                  value={formData.notes} 
                  onChange={e => setFormData({...formData, notes: e.target.value})} 
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:ring-2 focus:ring-white/30 outline-none transition-all" 
                  rows={3}
                ></textarea>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 pt-6">
                <button type="button" onClick={() => setShowModal(false)} className="w-full sm:flex-1 px-4 py-3 border border-white/10 text-white rounded-xl hover:bg-white/5 font-bold transition-colors">Abbrechen</button>
                <button type="submit" className="w-full sm:flex-1 px-4 py-3 bg-white text-black rounded-xl hover:bg-gray-200 font-bold transition-colors">Speichern</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {showBulkModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-2xl">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-[#111] border border-white/10 rounded-[2.5rem] shadow-2xl max-w-md w-full p-8 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
            <h2 className="text-3xl font-bold mb-6 flex items-center gap-3 text-white tracking-tight relative z-10">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                <CalendarPlus className="w-5 h-5 text-white" />
              </div>
              Alle einladen
            </h2>
            <p className="text-sm text-white/60 mb-6 font-medium">
              Wähle ein Aktion aus, um alle {persons.length} Personen aus dem Adressbuch dazu einzuladen. Personen, die bereits eingeladen sind, werden übersprungen.
            </p>
            <form onSubmit={handleBulkInvite} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-2">Aktion auswählen</label>
                <select 
                  required 
                  value={selectedAktionId} 
                  onChange={e => setSelectedAktionId(e.target.value)} 
                  className="w-full bg-black border border-white/10 rounded-xl p-3 text-white focus:ring-2 focus:ring-white/30 outline-none transition-all" 
                >
                  <option value="">Bitte wählen...</option>
                  {aktionen.map(aktion => (
                    <option key={aktion.id} value={aktion.id}>{aktion.title}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 pt-6">
                <button type="button" onClick={() => setShowBulkModal(false)} className="w-full sm:flex-1 px-4 py-3 border border-white/10 text-white rounded-xl hover:bg-white/5 font-bold transition-colors">Abbrechen</button>
                <button type="submit" disabled={isInviting || !selectedAktionId} className="w-full sm:flex-1 px-4 py-3 bg-white text-black rounded-xl hover:bg-gray-200 font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {isInviting ? 'Lädt...' : 'Jetzt einladen'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      <ConfirmModal 
        isOpen={deleteId !== null}
        title="Person löschen"
        message="Möchtest du diese Person wirklich löschen? Alle Einladungen dieser Person werden ebenfalls unwiderruflich gelöscht."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
