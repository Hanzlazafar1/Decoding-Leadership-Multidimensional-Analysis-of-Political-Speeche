import React from 'react';
import {
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts';
import { motion } from 'framer-motion';
import { PieChart as PieChartIcon, BarChart2, Activity } from 'lucide-react';
import './AggregatedVisuals.css';

const COLORS = ['#a78bfa', '#2dd4a4', '#3d8ef0', '#f5c518', '#f87171', '#fb923c', '#d946ef', '#14b8a6'];

export default function AggregatedVisuals({
  agenda = [],
  agendaBreakdown = [],
  promises = [],
  achievements = [],
  sentiment = 'Neutral'
}) {
  // Safe parsing for pie chart fallback
  let pieData = [];
  if (agendaBreakdown?.length > 0) {
    pieData = agendaBreakdown.map(item => ({ name: item.topic, value: item.percentage || 1 }));
  } else if (agenda?.length > 0) {
    const weight = Math.round(100 / agenda.length);
    pieData = agenda.map(topic => ({ name: topic, value: weight }));
  } else {
    pieData = [{ name: 'No Agenda Detected', value: 100 }];
  }

  // Bar chart data
  const barData = [
    { name: 'Promises', count: promises?.length || 0, fill: '#3d8ef0' },
    { name: 'Achievements', count: achievements?.length || 0, fill: '#2dd4a4' },
  ];

  // Sentiment Half-Donut Gauge Data
  const sentimentColor = sentiment === 'Positive' ? '#2dd4a4' : sentiment === 'Negative' ? '#f87171' : '#f5c518';
  
  const sentimentData = [
    { name: 'Negative', value: 1, fill: sentiment === 'Negative' ? '#f87171' : 'rgba(255,255,255,0.05)' },
    { name: 'Neutral',  value: 1, fill: sentiment === 'Neutral'  ? '#f5c518' : 'rgba(255,255,255,0.05)' },
    { name: 'Positive', value: 1, fill: sentiment === 'Positive' ? '#2dd4a4' : 'rgba(255,255,255,0.05)' }
  ];

  return (
    <div className="agg-visuals-grid">
      {/* Agenda Pie Chart */}
      <div className="visual-card glass-card">
        <div className="visual-header">
          <PieChartIcon size={16} style={{ color: 'var(--accent-purple)' }} />
          <span>Agenda Breakdown</span>
        </div>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <RechartsTooltip
                contentStyle={{ backgroundColor: '#080c14', border: '1px solid rgba(167, 139, 250, 0.4)', borderRadius: '8px', color: '#fff' }}
                itemStyle={{ color: '#fff', textTransform: 'capitalize' }}
                formatter={(value) => [`${value}%`, 'Weight']}
              />
              <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'capitalize' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Promises vs Achievements Bar Chart */}
      <div className="visual-card glass-card">
        <div className="visual-header">
          <BarChart2 size={16} style={{ color: 'var(--accent-blue)' }} />
          <span>Policy Execution Ratio</span>
        </div>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData} layout="vertical" margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} width={90} />
              <RechartsTooltip
                cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                contentStyle={{ backgroundColor: '#080c14', border: '1px solid rgba(61, 142, 240, 0.4)', borderRadius: '8px', color: '#fff' }}
                itemStyle={{ color: '#fff' }}
                cursorStyle={{ color: '#fff' }}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={24} animationDuration={1500}>
                {barData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Sentiment Gauge (Half-Donut) */}
      <div className="visual-card glass-card">
        <div className="visual-header">
          <Activity size={16} style={{ color: sentimentColor }} />
          <span>Overall Sentiment Metric</span>
        </div>
        <div className="chart-container" style={{ position: 'relative' }}>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={sentimentData}
                cx="50%" cy="100%"
                startAngle={180} endAngle={0}
                innerRadius={65} outerRadius={90}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {sentimentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} style={{ filter: entry.fill.includes('rgba') ? 'none' : `drop-shadow(0 0 10px ${entry.fill})` }} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          
          <div style={{ position: 'absolute', bottom: '10px', width: '100%', display: 'flex', justifyContent: 'center' }}>
             <span style={{ fontSize: '20px', fontWeight: 'bold', color: sentimentColor, textTransform: 'uppercase', letterSpacing: '2px', textShadow: `0 0 10px ${sentimentColor}` }}>
               {sentiment}
             </span>
          </div>
        </div>
      </div>
    </div>
  );
}
