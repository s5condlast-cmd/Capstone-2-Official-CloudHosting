import React from 'react';
import { Card } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { Button } from '@/src/components/ui/Button';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  FileText, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  Download
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { ComposedChart, Line, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

export const Reports: React.FC = () => {
  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">System Reports</h1>
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mt-1">Analytics and overall performance metrics</p>
        </div>
        <Button icon={<Download size={16} />} variant="outline" className="border border-zinc-200/80 dark:border-zinc-800/80 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-900 dark:hover:bg-zinc-100 hover:text-white dark:hover:text-zinc-900 font-semibold uppercase tracking-wide text-[10px]">
          Export PDF
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 p-6 border-zinc-900 dark:border-zinc-100 flex flex-col gap-4 relative overflow-hidden group">
          <div className="flex items-center justify-between relative z-10">
            <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">Active Students</span>
            <Users size={16} className="text-zinc-400 dark:text-zinc-500" />
          </div>
          <div className="flex flex-col relative z-10">
            <span className="text-4xl font-semibold tracking-tighter">1,248</span>
            <div className="flex items-center gap-1 text-zinc-300 dark:text-zinc-600 mt-2">
              <TrendingUp size={12} />
              <span className="text-[10px] font-bold">+12.5% this semester</span>
            </div>
          </div>
        </Card>

        <Card className="bg-white dark:bg-zinc-950 p-6 border border-zinc-200/80 dark:border-zinc-800/80 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Documents Processed</span>
            <FileText size={16} className="text-zinc-400 dark:text-zinc-500" />
          </div>
          <div className="flex flex-col">
            <span className="text-4xl font-semibold tracking-tighter text-zinc-900 dark:text-zinc-100">8,401</span>
            <div className="flex items-center gap-1 text-zinc-900 dark:text-zinc-100 mt-2">
              <TrendingUp size={12} />
              <span className="text-[10px] font-bold">+5.2% this month</span>
            </div>
          </div>
        </Card>

        <Card className="bg-white dark:bg-zinc-950 p-6 border border-zinc-200/80 dark:border-zinc-800/80 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Avg Review Time</span>
            <Clock size={16} className="text-zinc-400 dark:text-zinc-500" />
          </div>
          <div className="flex flex-col">
            <span className="text-4xl font-semibold tracking-tighter text-zinc-900 dark:text-zinc-100">1.2<span className="text-xl text-zinc-500 dark:text-zinc-400 tracking-tight">d</span></span>
            <div className="flex items-center gap-1 text-zinc-900 dark:text-zinc-100 mt-2">
              <TrendingUp size={12} className="rotate-180" />
              <span className="text-[10px] font-bold">-0.4d improvement</span>
            </div>
          </div>
        </Card>

        <Card className="bg-white dark:bg-zinc-950 p-6 border border-zinc-200/80 dark:border-zinc-800/80 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Completion Rate</span>
            <CheckCircle2 size={16} className="text-zinc-400 dark:text-zinc-500" />
          </div>
          <div className="flex flex-col">
            <span className="text-4xl font-semibold tracking-tighter text-zinc-900 dark:text-zinc-100">92<span className="text-xl text-zinc-500 dark:text-zinc-400 tracking-tight">%</span></span>
            <div className="flex items-center gap-1 text-zinc-900 dark:text-zinc-100 mt-2">
              <TrendingUp size={12} />
              <span className="text-[10px] font-bold">+2.1% from last year</span>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card title="Section Performance & Backlog" className="lg:col-span-2">
          <div className="h-[280px] w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart 
                data={[
                  { name: 'BSIT401', rate: 94, pending: 12 },
                  { name: 'BSIT402', rate: 88, pending: 24 },
                  { name: 'BSIT403', rate: 76, pending: 45 },
                  { name: 'BSIT 404', rate: 85, pending: 112 },
                ]} 
                margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" strokeOpacity={0.5} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#71717a' }} dy={10} />
                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#71717a' }} domain={[0, 100]} />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#71717a' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e4e4e7', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold' }}
                  itemStyle={{ color: '#18181b' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', paddingTop: '10px' }} />
                <Bar yAxisId="left" dataKey="rate" name="Completion Rate (%)" fill="#18181b" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Line yAxisId="right" type="monotone" dataKey="pending" name="Pending Documents" stroke="#71717a" strokeWidth={3} dot={{ r: 4, fill: '#ffffff', stroke: '#71717a', strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Critical Bottlenecks">
          <div className="space-y-4">
            {[
              { doc: 'MOA Documents', delay: '4.2 days avg', status: 'critical' },
              { doc: 'Endorsement Letters', delay: '2.1 days avg', status: 'warning' },
              { doc: 'Monthly DTRs', delay: '1.1 days avg', status: 'normal' },
              { doc: 'Final Evaluations', delay: '0.5 days avg', status: 'normal' },
            ].map((b, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800/50">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                    b.status === 'critical' ? "bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100" : b.status === 'warning' ? "bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200" : "bg-zinc-200 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400"
                  )}>
                    {b.status === 'critical' ? <AlertTriangle size={14} /> : b.status === 'warning' ? <Clock size={14} /> : <FileText size={14} />}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{b.doc}</span>
                    <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">{b.delay}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
