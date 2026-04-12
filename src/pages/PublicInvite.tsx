import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Calendar, MapPin, CheckCircle, XCircle, HelpCircle, Users } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

export default function PublicInvite() {
  const { token } = useParams();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const [status, setStatus] = useState('');
  const [comment, setComment] = useState('');
  const [guestsCount, setGuestsCount] = useState(0);

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
      alert('Bitte wähle eine Antwort aus.');
      return;
    }

    const res = await fetch(`/api/public/invite/${token}/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, comment, guests_count: guestsCount })
    });

    if (res.ok) {
      setSuccess(true);
    } else {
      const err = await res.json();
      alert(err.error || 'Fehler beim Speichern.');
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 text-center max-w-md w-full">
          <XCircle className="w-12 h-12 text-gray-900 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Link ungültig</h1>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return <div className="min-h-screen flex items-center justify-center">Lade...</div>;

  const { event, invitee } = data;
  const isDeadlinePassed = event.response_deadline && new Date() > new Date(event.response_deadline);

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 text-center max-w-md w-full">
          <CheckCircle className="w-16 h-16 text-gray-900 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Vielen Dank, {invitee.name}!</h1>
          <p className="text-gray-600 mb-6">Deine Antwort wurde erfolgreich gespeichert.</p>
          <div className="bg-gray-50 p-4 rounded-lg text-left text-sm text-gray-600">
            <p className="font-medium text-gray-900 mb-1">Deine aktuelle Antwort:</p>
            <p>
              {status === 'yes' && '✅ Ich bin dabei'}
              {status === 'no' && '❌ Ich kann leider nicht'}
              {status === 'maybe' && '❓ Ich weiß es noch nicht'}
            </p>
            {guestsCount > 0 && <p className="mt-1">👥 + {guestsCount} Begleitperson(en)</p>}
          </div>
          <button 
            onClick={() => setSuccess(false)}
            className="mt-6 text-gray-900 font-medium hover:underline text-sm"
          >
            Antwort noch einmal ändern
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6">
      <div className="max-w-xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6">
          <div className="bg-gray-900 p-6 text-white text-center">
            <h1 className="text-2xl font-bold mb-2">{event.title}</h1>
            <p className="text-gray-300">Hallo {invitee.name_snapshot || invitee.name}, du bist eingeladen!</p>
          </div>
          
          <div className="p-6 space-y-4">
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
              <div>
                <div className="font-medium text-gray-900">Wann?</div>
                <div className="text-gray-600">{format(parseISO(event.date), 'EEEE, dd. MMMM yyyy', { locale: de })}</div>
                <div className="text-gray-600">{format(parseISO(event.date), 'HH:mm', { locale: de })} Uhr</div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
              <div>
                <div className="font-medium text-gray-900">Wo?</div>
                <div className="text-gray-600">{event.location}</div>
                {event.meeting_point && (
                  <div className="text-sm text-gray-500 mt-1">Treffpunkt: {event.meeting_point}</div>
                )}
              </div>
            </div>

            {event.description && (
              <div className="pt-4 border-t border-gray-100 mt-4">
                <div className="font-medium text-gray-900 mb-1">Details</div>
                <p className="text-gray-600 text-sm whitespace-pre-wrap">{event.description}</p>
              </div>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Deine Antwort</h2>
          
          {isDeadlinePassed && (
            <div className="bg-gray-100 text-gray-900 border border-gray-300 p-4 rounded-xl mb-6 text-sm font-medium">
              Die Antwortfrist für dieses Event ist leider abgelaufen.
            </div>
          )}

          <div className={`grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6 ${isDeadlinePassed ? 'opacity-50 pointer-events-none' : ''}`}>
            <label className={`
              cursor-pointer border-2 rounded-xl p-4 text-center transition-all
              ${status === 'yes' ? 'border-gray-900 bg-gray-50 text-gray-900' : 'border-gray-200 hover:border-gray-300 text-gray-600'}
            `}>
              <input type="radio" name="status" value="yes" className="sr-only" checked={status === 'yes'} onChange={() => setStatus('yes')} disabled={isDeadlinePassed} />
              <CheckCircle className={`w-6 h-6 mx-auto mb-2 ${status === 'yes' ? 'text-gray-900' : 'text-gray-400'}`} />
              <span className="font-medium block">Bin dabei</span>
            </label>
            
            <label className={`
              cursor-pointer border-2 rounded-xl p-4 text-center transition-all
              ${status === 'no' ? 'border-gray-400 bg-gray-100 text-gray-700' : 'border-gray-200 hover:border-gray-300 text-gray-600'}
            `}>
              <input type="radio" name="status" value="no" className="sr-only" checked={status === 'no'} onChange={() => setStatus('no')} disabled={isDeadlinePassed} />
              <XCircle className={`w-6 h-6 mx-auto mb-2 ${status === 'no' ? 'text-gray-700' : 'text-gray-400'}`} />
              <span className="font-medium block">Kann nicht</span>
            </label>

            <label className={`
              cursor-pointer border-2 rounded-xl p-4 text-center transition-all
              ${status === 'maybe' ? 'border-gray-300 bg-white text-gray-600' : 'border-gray-200 hover:border-gray-300 text-gray-600'}
            `}>
              <input type="radio" name="status" value="maybe" className="sr-only" checked={status === 'maybe'} onChange={() => setStatus('maybe')} disabled={isDeadlinePassed} />
              <HelpCircle className={`w-6 h-6 mx-auto mb-2 ${status === 'maybe' ? 'text-gray-600' : 'text-gray-400'}`} />
              <span className="font-medium block">Vielleicht</span>
            </label>
          </div>

          {status === 'yes' && (
            <div className={`mb-6 ${isDeadlinePassed ? 'opacity-50 pointer-events-none' : ''}`}>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Users className="w-4 h-4" />
                Bringe ich Begleitpersonen mit?
              </label>
              <select 
                value={guestsCount} 
                onChange={e => setGuestsCount(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-md p-2.5 bg-white"
                disabled={isDeadlinePassed}
              >
                <option value={0}>Nein, ich komme alleine</option>
                <option value={1}>+ 1 Person</option>
                <option value={2}>+ 2 Personen</option>
                <option value={3}>+ 3 Personen</option>
                <option value={4}>+ 4 Personen</option>
              </select>
            </div>
          )}

          <div className={`mb-6 ${isDeadlinePassed ? 'opacity-50 pointer-events-none' : ''}`}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kommentar (optional)
            </label>
            <textarea 
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="z.B. Komme etwas später..."
              className="w-full border border-gray-300 rounded-md p-3 text-sm"
              rows={3}
              disabled={isDeadlinePassed}
            />
          </div>

          {!isDeadlinePassed && (
            <button 
              type="submit"
              className="w-full bg-gray-900 text-white font-bold py-3 px-4 rounded-xl hover:bg-black transition-colors"
            >
              Antwort speichern
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
