
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { WasteRecord } from '../types';

interface Props {
  data: WasteRecord[];
}

const COLORS = {
  Organic: '#10b981',    // Emerald 500
  Recyclable: '#3b82f6', // Blue 500
  Hazardous: '#ef4444',  // Red 500
  'E-Waste': '#8b5cf6',   // Violet 500
  General: '#64748b',    // Slate 500
  Unknown: '#cbd5e1',    // Slate 300
};

const WasteChart: React.FC<Props> = ({ data }) => {
  const aggregatedData = React.useMemo(() => {
    const counts: Record<string, number> = {};
    data.forEach(item => {
      counts[item.category] = (counts[item.category] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [data]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[400px]">
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
        <h3 className="text-sm font-semibold text-slate-500 mb-4 uppercase tracking-wider">Category Distribution</h3>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={aggregatedData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {aggregatedData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS] || COLORS.Unknown} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Legend verticalAlign="bottom" height={36}/>
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
        <h3 className="text-sm font-semibold text-slate-500 mb-4 uppercase tracking-wider">Total Waste Vol.</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={aggregatedData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px' }} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
               {aggregatedData.map((entry, index) => (
                <Cell key={`bar-${index}`} fill={COLORS[entry.name as keyof typeof COLORS] || COLORS.Unknown} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default WasteChart;
