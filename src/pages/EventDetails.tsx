import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Users, CheckCircle, XCircle, HelpCircle, Clock, Copy, Trash2, Plus, MapPin, Calendar, MessageSquare, UserPlus } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import toast from 'react-hot-toast';
import ConfirmModal from '../components/ConfirmModal';

export default function EventDetails() {
  const { id } = useParams();
  const [event, setEvent] = useState<any>(null);
  const [invites, setInvites] = useState<any[]>([]);
  const [persons, setPersons] = useState<any[]>([]);
  const [selectedPersonId, setSelectedPersonId] = useState('');
  const [filter, setFilter] = useState('all');
  
  const [deleteInviteeId, setDeleteInviteeId] = useState<number | null>(null);

  useEffect(() => {
    fetchEvent();
    fetchInvites();
    fetchPersons();
  }, [id]);

  const fetchEvent = async () => {
    try {
      const res = await fetch(`/api/admin/events/${id}`);
      if (res.ok) setEvent(await res.json());
    } catch (e) {
      toast.error('Fehler beim Laden des Events');
    }
  };

  const fetchInvites = async () => {
    try {
      const res = await fetch(`/api/admin/events/${id}/invites`);
      if (res.ok) setInvites(await res.json());
    } catch (e) {
      toast.error('Fehler beim Laden der Einladungen');
    }
  };

  const fetchPersons = async () => {
    try {
      const res = await fetch('/api/admin/persons');
      if (res.ok) setPersons(await res.json());
    } catch (e) {
      toast.error('Fehler beim Laden der Personen');
    }
  };

  const handleAddInvitee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPersonId) return;
    
    try {
      const res = await fetch(`/api/admin/events/${id}/invites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ person_id: Number(selectedPersonId) })
      });
      
      if (res.ok) {
        setSelectedPersonId('');
        toast.success('Person eingeladen');
        fetchInvites();
      } else {
        const err = await res.json();
        throw new Error(err.error || 'Fehler beim Hinzufügen');
      }
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleDeleteInvitee = async () => {
    if (!deleteInviteeId) return;
    try {
      const res = await fetch(`/api/admin/events/${id}/invites/${deleteInviteeId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Fehler beim Löschen');
      toast.success('Einladung gelöscht');
      fetchInvites();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setDeleteInviteeId(null);
    }
  };

  const copyLink = (token: string) => {
    const url = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(url);
    toast.success('Link kopiert!');
  };

  if (!event) return <div className="p-8 text-center">Lade...</div>;

  const stats = {
    yes: invites.filter((i: any) => i.status === 'yes').length,
    no: invites.filter((i: any) => i.status === 'no').length,
    maybe: invites.filter((i: any) => i.status === 'maybe').length,
    pending: invites.filter((i: any) => i.status === 'pending').length,
    total: invites.length
  };

  const filteredInvitees = invites.filter((i: any) => filter === 'all' || i.status === filter);

  // Filter out persons that are already invited
  const availablePersons = persons.filter(p => !invites.some(i => i.person_id === p.id));

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <Link to="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 text-sm font-medium transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Zurück zur Übersicht
      </Link>

      {/* Hero Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-8">
        <div className="h-32 bg-gradient-to-r from-gray-900 to-gray-700"></div>
        <div className="px-6 pb-6 -mt-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex-1">
              <div className="w-24 h-24 bg-white rounded-2xl shadow-md border-4 border-white flex items-center justify-center mb-4 overflow-hidden">
                <div className="bg-gray-50 w-full h-full flex flex-col items-center justify-center text-gray-900">
                  <span className="text-xs font-bold uppercase text-gray-400">{format(parseISO(event.date), 'MMM', { locale: de })}</span>
                  <span className="text-3xl font-black leading-none">{format(parseISO(event.date), 'dd')}</span>
                </div>
              </div>
              <h1 className="text-3xl font-black text-gray-900 mb-2">{event.title}</h1>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-gray-500 text-sm">
                <span className="flex items-center gap-1.5 font-medium"><Clock className="w-4 h-4 text-gray-400" /> {format(parseISO(event.date), 'EEEE, dd.MM.yyyy HH:mm', { locale: de })} Uhr</span>
                <span className="flex items-center gap-1.5 font-medium"><MapPin className="w-4 h-4 text-gray-400" /> {event.location}</span>
                {event.meeting_point && (
                  <span className="flex items-center gap-1.5 font-medium text-gray-900 bg-gray-100 px-2 py-0.5 rounded">
                    <span className="text-gray-500 font-normal">Treffpunkt:</span> {event.meeting_point}
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Link 
                to={`/events/${id}/edit`} 
                className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all shadow-sm"
              >
                Bearbeiten
              </Link>
            </div>
          </div>
          {event.description && (
            <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-100 text-gray-600 text-sm leading-relaxed">
              {event.description}
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <div className="text-gray-400 text-[10px] uppercase tracking-widest font-black mb-1">Eingeladen</div>
          <div className="text-3xl font-black text-gray-900">{stats.total}</div>
        </div>
        <div className="bg-green-50 p-5 rounded-2xl border border-green-100 shadow-sm">
          <div className="text-green-600/50 text-[10px] uppercase tracking-widest font-black mb-1">Zusagen</div>
          <div className="text-3xl font-black text-green-700 flex items-center gap-2">
            {stats.yes}
            <CheckCircle className="w-5 h-5 opacity-50" />
          </div>
        </div>
        <div className="bg-red-50 p-5 rounded-2xl border border-red-100 shadow-sm">
          <div className="text-red-600/50 text-[10px] uppercase tracking-widest font-black mb-1">Absagen</div>
          <div className="text-3xl font-black text-red-700 flex items-center gap-2">
            {stats.no}
            <XCircle className="w-5 h-5 opacity-50" />
          </div>
        </div>
        <div className="bg-amber-50 p-5 rounded-2xl border border-amber-100 shadow-sm">
          <div className="text-amber-600/50 text-[10px] uppercase tracking-widest font-black mb-1">Vielleicht</div>
          <div className="text-3xl font-black text-amber-700 flex items-center gap-2">
            {stats.maybe}
            <HelpCircle className="w-5 h-5 opacity-50" />
          </div>
        </div>
        <div className="bg-gray-50 p-5 rounded-2xl border border-gray-200 shadow-sm border-dashed">
          <div className="text-gray-400 text-[10px] uppercase tracking-widest font-black mb-1">Offen</div>
          <div className="text-3xl font-black text-gray-400 flex items-center gap-2">
            {stats.pending}
            <Clock className="w-5 h-5 opacity-50" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content: Invites List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                <Users className="w-6 h-6" />
                Teilnehmerliste
              </h2>
              <select 
                value={filter} 
                onChange={e => setFilter(e.target.value)}
                className="border border-gray-200 rounded-xl text-xs font-bold p-2 bg-gray-50 outline-none focus:ring-2 focus:ring-gray-900/10 transition-all"
              >
                <option value="all">Alle ({invites.length})</option>
                <option value="yes">Zusagen ({stats.yes})</option>
                <option value="no">Absagen ({stats.no})</option>
                <option value="maybe">Vielleicht ({stats.maybe})</option>
                <option value="pending">Offen ({stats.pending})</option>
              </select>
            </div>

            <div className="divide-y divide-gray-50">
              {filteredInvitees.length > 0 ? (
                filteredInvitees.map((invitee: any) => (
                  <div key={invitee.id} className="p-5 hover:bg-gray-50 transition-colors group">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-bold text-sm ${
                          invitee.status === 'yes' ? 'bg-green-100 text-green-700' :
                          invitee.status === 'no' ? 'bg-red-100 text-red-700' :
                          invitee.status === 'maybe' ? 'bg-amber-100 text-amber-700' :
                          'bg-gray-100 text-gray-500'
                        }`}>
                          {(invitee.name_snapshot || invitee.current_name || '?').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 flex items-center gap-2">
                            {invitee.name_snapshot || invitee.current_name}
                            {invitee.guests_count > 0 && (
                              <span className="text-[10px] bg-gray-900 text-white px-1.5 py-0.5 rounded-full">
                                +{invitee.guests_count}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            {invitee.status === 'yes' && <span className="text-[10px] font-black uppercase text-green-600 flex items-center gap-1"><CheckCircle className="w-3 h-3"/> Zugesagt</span>}
                            {invitee.status === 'no' && <span className="text-[10px] font-black uppercase text-red-600 flex items-center gap-1"><XCircle className="w-3 h-3"/> Abgesagt</span>}
                            {invitee.status === 'maybe' && <span className="text-[10px] font-black uppercase text-amber-600 flex items-center gap-1"><HelpCircle className="w-3 h-3"/> Vielleicht</span>}
                            {invitee.status === 'pending' && <span className="text-[10px] font-black uppercase text-gray-400 flex items-center gap-1"><Clock className="w-3 h-3"/> Ausstehend</span>}
                            {invitee.responded_at && (
                              <span className="text-[10px] text-gray-400">• {format(parseISO(invitee.responded_at), 'dd.MM. HH:mm')}</span>
                            )}
                          </div>
                          {invitee.comment && (
                            <div className="mt-2 flex gap-2 items-start bg-white p-2 rounded-lg border border-gray-100 shadow-sm italic text-sm text-gray-600">
                              <MessageSquare className="w-3.5 h-3.5 text-gray-300 shrink-0 mt-0.5" />
                              "{invitee.comment}"
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => copyLink(invitee.token)}
                          className="p-2 text-gray-400 hover:text-gray-900 hover:bg-white rounded-lg border border-transparent hover:border-gray-200 transition-all"
                          title="Link kopieren"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setDeleteInviteeId(invitee.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="Löschen"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-gray-300" />
                  </div>
                  <p className="text-gray-500 font-medium">Keine Teilnehmer in dieser Kategorie.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar: Actions & Info */}
        <div className="space-y-6">
          {/* Add Person Card */}
          <div className="bg-gray-900 rounded-2xl p-6 text-white shadow-lg shadow-gray-900/20">
            <h3 className="text-lg font-black mb-4 flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Person einladen
            </h3>
            <form onSubmit={handleAddInvitee} className="space-y-3">
              <select
                value={selectedPersonId}
                onChange={e => setSelectedPersonId(e.target.value)}
                className="w-full bg-gray-800 border-none rounded-xl p-3 text-sm text-white focus:ring-2 focus:ring-white/20 outline-none appearance-none"
              >
                <option value="" className="bg-gray-900">Person wählen...</option>
                {availablePersons.map(p => (
                  <option key={p.id} value={p.id} className="bg-gray-900">{p.name}</option>
                ))}
              </select>
              <button 
                type="submit" 
                disabled={!selectedPersonId}
                className="w-full bg-white text-gray-900 py-3 rounded-xl text-sm font-black hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Einladen
              </button>
            </form>
            {availablePersons.length === 0 && persons.length > 0 && (
              <p className="text-[10px] text-gray-400 mt-3 text-center uppercase tracking-wider font-bold">Alle Personen bereits eingeladen</p>
            )}
          </div>

          {/* Quick Info Card */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">Event Info</h3>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4 text-gray-400" />
                </div>
                <div>
                  <div className="text-[10px] font-black text-gray-400 uppercase">Erstellt am</div>
                  <div className="text-sm font-bold text-gray-900">{format(parseISO(event.created_at), 'dd.MM.yyyy')}</div>
                </div>
              </div>
              {event.response_deadline && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4 text-red-400" />
                  </div>
                  <div>
                    <div className="text-[10px] font-black text-red-400 uppercase">Antwortfrist</div>
                    <div className="text-sm font-bold text-gray-900">{format(parseISO(event.response_deadline), 'dd.MM.yyyy HH:mm')}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal 
        isOpen={deleteInviteeId !== null}
        title="Einladung löschen"
        message="Möchtest du diese Einladung wirklich löschen? Der Link wird ungültig und die Antwort der Person geht verloren."
        onConfirm={handleDeleteInvitee}
        onCancel={() => setDeleteInviteeId(null)}
      />
    </div>
  );
}
