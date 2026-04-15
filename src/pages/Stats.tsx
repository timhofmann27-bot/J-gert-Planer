import React, { useState, useEffect } from 'react';
import { BarChart, Calendar, Users, Mail, CheckCircle2, XCircle, HelpCircle, Clock } from 'lucide-react';
import { motion } from 'motion/react';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

export default function Stats() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(res => res.json())
      .then(data => setStats(data));
  }, []);

  if (!stats) return <div className="p-8 text-center">Lade...</div>;

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold text-white mb-8 flex items-center gap-3 tracking-tight">
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
            <BarChart className="w-5 h-5 text-white" />
          </div>
          Statistik
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <motion.div 
            initial={{ opacity: 0, y: 30, scale: 0.95 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }} 
            whileHover={{ scale: 1.02, y: -5 }}
            className="bg-[#111] p-8 rounded-[2.5rem] shadow-xl border border-white/10 flex items-center gap-6 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center shrink-0 border border-white/10">
              <Calendar className="w-8 h-8 text-white/80" />
            </div>
            <div>
              <div className="text-xs font-black text-white/40 uppercase tracking-widest mb-1">Aktionen gesamt</div>
              <div className="text-4xl font-black text-white">{stats.aktionen}</div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 30, scale: 0.95 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            transition={{ duration: 0.5, delay: 0.15, ease: [0.22, 1, 0.36, 1] }} 
            whileHover={{ scale: 1.02, y: -5 }}
            className="bg-[#111] p-8 rounded-[2.5rem] shadow-xl border border-white/10 flex items-center gap-6 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center shrink-0 border border-white/10">
              <Users className="w-8 h-8 text-white/80" />
            </div>
            <div>
              <div className="text-xs font-black text-white/40 uppercase tracking-widest mb-1">Personen</div>
              <div className="text-4xl font-black text-white">{stats.persons}</div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 30, scale: 0.95 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }} 
            whileHover={{ scale: 1.02, y: -5 }}
            className="bg-[#111] p-8 rounded-[2.5rem] shadow-xl border border-white/10 flex items-center gap-6 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center shrink-0 border border-white/10">
              <Mail className="w-8 h-8 text-white/80" />
            </div>
            <div>
              <div className="text-xs font-black text-white/40 uppercase tracking-widest mb-1">Einladungen</div>
              <div className="text-4xl font-black text-white">{stats.invites}</div>
            </div>
          </motion.div>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 30, scale: 0.98 }} 
        animate={{ opacity: 1, y: 0, scale: 1 }} 
        transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }} 
        className="bg-[#111] rounded-[2.5rem] shadow-xl border border-white/10 overflow-hidden"
      >
        <div className="p-8 border-b border-white/10 bg-white/5">
          <h2 className="text-xl font-bold text-white">Antworten pro Aktion</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/50 text-xs font-black text-white/40 uppercase tracking-widest">
                <th className="px-8 py-4">Aktion</th>
                <th className="px-8 py-4">Datum</th>
                <th className="px-8 py-4 text-center">Einladungen</th>
                <th className="px-8 py-4 text-center">
                  <div className="flex items-center justify-center gap-2 text-green-400">
                    <CheckCircle2 className="w-4 h-4" />
                    Zusagen
                  </div>
                </th>
                <th className="px-8 py-4 text-center">
                  <div className="flex items-center justify-center gap-2 text-red-400">
                    <XCircle className="w-4 h-4" />
                    Absagen
                  </div>
                </th>
                <th className="px-8 py-4 text-center">
                  <div className="flex items-center justify-center gap-2 text-amber-400">
                    <HelpCircle className="w-4 h-4" />
                    Vielleicht
                  </div>
                </th>
                <th className="px-8 py-4 text-center">
                  <div className="flex items-center justify-center gap-2 text-white/40">
                    <Clock className="w-4 h-4" />
                    Offen
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {stats.aktionBreakdown?.map((aktion: any) => (
                <tr key={aktion.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-8 py-5 font-bold text-white">{aktion.title}</td>
                  <td className="px-8 py-5 text-sm font-medium text-white/50">
                    {format(parseISO(aktion.date), 'dd.MM.yyyy', { locale: de })}
                  </td>
                  <td className="px-8 py-5 text-center text-lg font-black text-white">
                    {aktion.total_invites}
                  </td>
                  <td className="px-8 py-5 text-center">
                    <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-black bg-green-500/20 text-green-400 border border-green-500/30">
                      {aktion.yes_count}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-black bg-red-500/20 text-red-400 border border-red-500/30">
                      {aktion.no_count}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-black bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      {aktion.maybe_count}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-black bg-white/10 text-white/50 border border-white/10">
                      {aktion.pending_count}
                    </span>
                  </td>
                </tr>
              ))}
              {(!stats.aktionBreakdown || stats.aktionBreakdown.length === 0) && (
                <tr>
                  <td colSpan={7} className="px-8 py-16 text-center text-white/40 font-medium text-lg">
                    Keine Aktionen gefunden.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
