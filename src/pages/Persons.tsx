import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Users } from 'lucide-react';

export default function Persons() {
  const [persons, setPersons] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingPerson, setEditingPerson] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '', notes: '' });

  useEffect(() => {
    fetchPersons();
  }, []);

  const fetchPersons = async () => {
    const res = await fetch('/api/admin/persons');
    if (res.ok) setPersons(await res.json());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingPerson ? `/api/admin/persons/${editingPerson.id}` : '/api/admin/persons';
    const method = editingPerson ? 'PUT' : 'POST';

    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    setShowModal(false);
    setEditingPerson(null);
    setFormData({ name: '', notes: '' });
    fetchPersons();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Person wirklich löschen? Alle Einladungen dieser Person werden ebenfalls gelöscht.')) return;
    await fetch(`/api/admin/persons/${id}`, { method: 'DELETE' });
    fetchPersons();
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
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Users className="w-6 h-6 text-gray-900" />
          Personen
        </h1>
        <button
          onClick={openNew}
          className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-md hover:bg-black transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Person anlegen
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="divide-y divide-gray-100">
          {persons.map(person => (
            <div key={person.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-gray-50 gap-4">
              <div>
                <div className="font-medium text-gray-900">{person.name}</div>
                {person.notes && <div className="text-sm text-gray-500 mt-1">{person.notes}</div>}
              </div>
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button 
                  onClick={() => openEdit(person)}
                  className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                  title="Bearbeiten"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleDelete(person.id)}
                  className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                  title="Löschen"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {persons.length === 0 && (
            <div className="p-8 text-center text-gray-500 text-sm">
              Noch keine Personen angelegt.
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">{editingPerson ? 'Person bearbeiten' : 'Neue Person'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input 
                  required 
                  type="text" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  className="w-full border border-gray-300 rounded-md p-2" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notizen (optional)</label>
                <textarea 
                  value={formData.notes} 
                  onChange={e => setFormData({...formData, notes: e.target.value})} 
                  className="w-full border border-gray-300 rounded-md p-2" 
                  rows={3}
                ></textarea>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50">Abbrechen</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-black">Speichern</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
