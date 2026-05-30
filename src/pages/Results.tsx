import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { fetchData, VotingData } from '../api';
import { CONFIG } from '../config';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function Results() {
  const [data, setData] = useState<VotingData | null>(null);
  const [view, setView] = useState<'bar' | 'pie'>('bar');
  const [lastUpdate, setLastUpdate] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetchData();
        setData(res);
        setLastUpdate(new Date().toLocaleTimeString('ru-RU'));
      } catch (err) {
        console.error(err);
      }
    };
    load();
    const interval = setInterval(load, CONFIG.POLL_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  const chartData = useMemo(() => {
    if (!data) return null;
    return {
      labels: data.options.map(o => `${o.emoji} ${o.text}`),
      datasets: [
        {
          label: 'Голоса',
          data: data.options.map(o => o.votes),
          backgroundColor: CONFIG.OPTION_COLORS.map(c => c.bar + '40'),
          borderColor: CONFIG.OPTION_COLORS.map(c => c.bar),
          borderWidth: 2,
          borderRadius: view === 'bar' ? 10 : 0,
        }
      ]
    };
  }, [data, view]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: (view === 'pie' ? 'bottom' : 'top') as 'bottom' | 'top',
        labels: { color: 'rgba(240,240,255,0.7)', font: { family: "'Inter', sans-serif" } }
      }
    },
    scales: view === 'bar' ? {
      x: { ticks: { color: 'rgba(240,240,255,0.55)' }, grid: { color: 'rgba(255,255,255,0.05)' } },
      y: { ticks: { color: 'rgba(240,240,255,0.55)', stepSize: 1 }, grid: { color: 'rgba(255,255,255,0.05)' } }
    } : undefined
  };

  if (!data || !chartData) {
    return <div className="loader"><div className="spinner"></div>Загружаем результаты…</div>;
  }

  const sortedOptions = [...data.options].sort((a, b) => b.votes - a.votes);
  const leader = sortedOptions[0];
  const leaderPct = data.total_votes > 0 ? Math.round((leader.votes / data.total_votes) * 100) : 0;

  return (
    <div className="container container--wide">
      <div className="brand">
        <div className="brand-icon">📊</div>
        <span className="brand-text">Результаты голосования</span>
      </div>

      <div className="results-header">
        <div>
          <h1 className="results-title">{data.question}</h1>
        </div>
        <div className="results-meta">
          <div className="live-badge"><span className="dot"></span>Live</div>
          <div className="total-count">Проголосовали: <span>{data.total_votes}</span></div>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-num">{data.total_votes}</span>
          <span className="stat-label">Всего голосов</span>
        </div>
        <div className="stat-card" style={{ gridColumn: 'span 2' }}>
          <span className="stat-num" style={{ fontSize: 22 }}>{leader.emoji} {leader.text}</span>
          <span className="stat-label">Лидирует</span>
        </div>
        <div className="stat-card">
          <span className="stat-num">{leaderPct}%</span>
          <span className="stat-label">Доля лидера</span>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab-btn ${view === 'bar' ? 'active' : ''}`} onClick={() => setView('bar')}>📊 Столбчатая</button>
        <button className={`tab-btn ${view === 'pie' ? 'active' : ''}`} onClick={() => setView('pie')}>🥧 Круговая</button>
      </div>

      <div className="chart-wrapper">
        <div className="chart-canvas-wrap">
          {view === 'bar' ? <Bar data={chartData} options={chartOptions} /> : <Doughnut data={chartData} options={chartOptions} />}
        </div>
      </div>

      <h2 style={{ fontSize: 16, fontWeight: 700, color: 'rgba(240,240,255,0.6)', textTransform: 'uppercase', marginBottom: 16 }}>
        Детальный разбор
      </h2>
      
      <div className="result-bars">
        <AnimatePresence>
          {sortedOptions.map((opt) => {
            const pct = data.total_votes > 0 ? Math.round((opt.votes / data.total_votes) * 100) : 0;
            const colorIndex = data.options.findIndex(o => o.id === opt.id);
            const color = CONFIG.OPTION_COLORS[colorIndex]?.bar || '#6c63ff';

            return (
              <motion.div 
                key={opt.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 300, damping: 24 }}
                className="result-bar-item"
              >
                <div className="rbi-top">
                  <div className="rbi-label"><span className="rbi-emoji">{opt.emoji}</span><span>{opt.text}</span></div>
                  <div className="rbi-stats"><span className="rbi-votes">{opt.votes} голосов</span><span className="rbi-pct">{pct}%</span></div>
                </div>
                <div className="rbi-track">
                  <motion.div className="rbi-fill" animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }} style={{ background: color }} />
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <p className="last-update">Последнее обновление: {lastUpdate}</p>

      <div className="footer-link">
        <Link to="/">🗳️ Перейти к голосованию</Link>
      </div>
    </div>
  );
}
