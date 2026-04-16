import React, { useState, useEffect } from 'react';
import { BarChart as BarChartIcon, Calendar, Users, Mail, Archive, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Cell
} from 'recharts';

export default function Stats() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(res => res.json())
      .then(data => setStats(data));
  }, []);

  if (!stats) return <div className="p-8 text-center text-white/50 font-serif">Lade Statistik...</div>;

  const chartData = stats.eventBreakdown?.slice(0, 10).reverse().map((e: any) => ({
    name: e.title.length > 20 ? e.title.substring(0, 17) + '...' : e.title,
    fullTitle: e.title,
    Zusagen: e.yes_count,
    Absagen: e.no_count,
    Vielleicht: e.maybe_count,
    Offen: e.pending_count,
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0a0a0a] border border-white/10 p-4 rounded-2xl shadow-2xl backdrop-blur-xl">
          <p className="text-white font-serif font-bold mb-2">{payload[0].payload.fullTitle}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-white/40">{entry.name}:</span>
              <span className="text-white font-bold">{entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="pb-24">
      <div className="mb-16">
        <h1 className="text-4xl sm:text-5xl font-serif font-bold text-white mb-12 flex items-center gap-6 tracking-tight">
          <div className="w-16 h-16 bg-white/[0.02] border border-white/5 rounded-3xl flex items-center justify-center shadow-2xl">
            <BarChartIcon className="w-8 h-8 text-white/40" />
          </div>
          Statistik
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {[
            { label: 'Aktionen gesamt', value: stats.events, icon: Calendar, color: 'white' },
            { 
              label: 'Archiviert', 
              value: stats.archived_events, 
              icon: Archive, 
              color: 'white',
              sub: `${Math.round(stats.archived_pct)}% aller Aktionen`
            },
            { label: 'Personen', value: stats.persons, icon: Users, color: 'white' },
            { label: 'Einladungen', value: stats.invites, icon: Mail, color: 'white' }
          ].map((item, i) => (
            <motion.div 
              key={item.label}
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }} 
              className="bg-white/[0.02] p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem] shadow-2xl border border-white/5 flex flex-col gap-6 relative overflow-hidden group hover:bg-white/[0.04] transition-all duration-500"
            >
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center shrink-0 border border-white/5 group-hover:scale-110 transition-transform duration-500">
                  <item.icon className="w-6 h-6 text-white/20" />
                </div>
                {item.sub && (
                  <div className="text-[10px] font-bold text-white/40 bg-white/5 px-3 py-1.5 rounded-full border border-white/5 uppercase tracking-widest">
                    {item.sub}
                  </div>
                )}
              </div>
              <div>
                <div className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em] mb-2">{item.label}</div>
                <div className="text-4xl font-serif font-bold text-white tracking-tight">{item.value}</div>
              </div>
              <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Chart Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.6, delay: 0.4, ease: [0.22, 1, 0.36, 1] }} 
        className="bg-white/[0.02] p-6 sm:p-12 rounded-[2rem] sm:rounded-[3rem] shadow-2xl border border-white/5 mb-16 relative overflow-hidden"
      >
        <div className="flex items-center gap-4 mb-12">
          <div className="w-12 h-12 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-white/40" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-white tracking-tight">Antwort-Trends</h2>
            <p className="text-xs font-bold text-white/20 uppercase tracking-[0.2em]">Die letzten 10 Aktionen im Vergleich</p>
          </div>
        </div>
        
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
              barGap={8}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#ffffff30', fontSize: 10, fontWeight: 700 }}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#ffffff30', fontSize: 10, fontWeight: 700 }}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#ffffff05' }} />
              <Legend 
                verticalAlign="top" 
                align="right" 
                iconType="circle"
                wrapperStyle={{ paddingBottom: '40px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.2em' }}
              />
              <Bar 
                dataKey="Zusagen" 
                fill="#22c55e" 
                fillOpacity={0.6} 
                radius={[4, 4, 0, 0]} 
                animationDuration={1500} 
              />
              <Bar 
                dataKey="Vielleicht" 
                name="Vielleicht" 
                fill="#f59e0b" 
                fillOpacity={0.6} 
                radius={[4, 4, 0, 0]} 
                animationDuration={1500} 
              />
              <Bar 
                dataKey="Absagen" 
                fill="#ef4444" 
                fillOpacity={0.6} 
                radius={[4, 4, 0, 0]} 
                animationDuration={1500} 
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.6, delay: 0.5, ease: [0.22, 1, 0.36, 1] }} 
        className="bg-white/[0.02] rounded-[2rem] sm:rounded-[3rem] shadow-2xl border border-white/5 overflow-hidden"
      >
        <div className="p-6 sm:p-10 border-b border-white/5 bg-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-white tracking-tight">Detaillierte Aufschlüsselung</h2>
          <div className="text-[10px] font-bold text-white/20 uppercase tracking-widest bg-white/5 px-4 py-2 rounded-full border border-white/5">
            Alle Aktionen
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-black/50 text-[10px] font-bold text-white/20 uppercase tracking-[0.3em]">
                <th className="px-10 py-6">Aktion</th>
                <th className="px-10 py-6">Datum</th>
                <th className="px-10 py-6 text-center">Einladungen</th>
                <th className="px-10 py-6 text-center">Zusagen</th>
                <th className="px-10 py-6 text-center">Absagen</th>
                <th className="px-10 py-6 text-center">Vielleicht</th>
                <th className="px-10 py-6 text-center">Offen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {stats.eventBreakdown?.map((aktion: any) => (
                <tr key={aktion.id} className="hover:bg-white/[0.03] transition-colors group">
                  <td className="px-10 py-8 font-serif text-xl text-white group-hover:text-white transition-colors">{aktion.title}</td>
                  <td className="px-10 py-8 text-sm font-medium text-white/30">
                    {format(parseISO(aktion.date), 'dd.MM.yyyy', { locale: de })}
                  </td>
                  <td className="px-10 py-8 text-center text-xl font-serif font-bold text-white">
                    {aktion.total_invites}
                  </td>
                  <td className="px-10 py-8 text-center">
                    <span className="inline-flex items-center justify-center px-4 py-1.5 rounded-full text-[10px] font-bold bg-green-500/10 text-green-400 border border-green-500/10 uppercase tracking-widest">
                      {aktion.yes_count}
                    </span>
                  </td>
                  <td className="px-10 py-8 text-center">
                    <span className="inline-flex items-center justify-center px-4 py-1.5 rounded-full text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/10 uppercase tracking-widest">
                      {aktion.no_count}
                    </span>
                  </td>
                  <td className="px-10 py-8 text-center">
                    <span className="inline-flex items-center justify-center px-4 py-1.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/10 uppercase tracking-widest">
                      {aktion.maybe_count}
                    </span>
                  </td>
                  <td className="px-10 py-8 text-center">
                    <span className="inline-flex items-center justify-center px-4 py-1.5 rounded-full text-[10px] font-bold bg-white/5 text-white/20 border border-white/5 uppercase tracking-widest">
                      {aktion.pending_count}
                    </span>
                  </td>
                </tr>
              ))}
              {(!stats.eventBreakdown || stats.eventBreakdown.length === 0) && (
                <tr>
                  <td colSpan={7} className="px-10 py-24 text-center text-white/10 font-serif text-xl">
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

