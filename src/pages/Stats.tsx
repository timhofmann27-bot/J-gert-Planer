import React, { useState, useEffect } from 'react';
import { BarChart, Calendar, Users, Mail } from 'lucide-react';

export default function Stats() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(res => res.json())
      .then(data => setStats(data));
  }, []);

  if (!stats) return <div className="p-8 text-center">Lade...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-2">
        <BarChart className="w-6 h-6 text-gray-900" />
        Statistik
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center shrink-0">
            <Calendar className="w-6 h-6 text-gray-900" />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500">Events gesamt</div>
            <div className="text-2xl font-bold text-gray-900">{stats.events}</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center shrink-0">
            <Users className="w-6 h-6 text-gray-900" />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500">Personen im Adressbuch</div>
            <div className="text-2xl font-bold text-gray-900">{stats.persons}</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center shrink-0">
            <Mail className="w-6 h-6 text-gray-900" />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500">Einladungen verschickt</div>
            <div className="text-2xl font-bold text-gray-900">{stats.invites}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
