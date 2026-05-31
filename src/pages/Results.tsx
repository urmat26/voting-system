import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend, ArcElement
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { fetchData, VotingData } from '../api';
import { CONFIG } from '../config';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const COLORS = ['#e8ff47','#3de8ff','#ff7a27','#ff3d6e'];

export default function Results() {
  const [data, setData] = useState<VotingData | null>(null);
  const [view, setView] = useState<'bar' | 'pie'>('bar');
  const [lastUpdate, setLastUpdate] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setData(await fetchData());
        setLastUpdate(new Date().toLocaleTimeString('ru-RU'));
      } catch (err) { console.error(err); }
    };
    load();
    const iv = setInterval(load, CONFIG.POLL_INTERVAL);
    return () => clearInterval(iv);
  }, []);

  const sorted = useMemo(() => data ? [...data.options].sort((a,b) => b.votes - a.votes) : [], [data]);
  const winner = sorted[0];
  const winnerPct = data && data.total_votes > 0 ? Math.round((winner.votes / data.total_votes) * 100) : 0;

  const chartData = useMemo(() => {
    if (!data) return null;
    return {
      labels: data.options.map(o => `${o.emoji} ${o.text}`),
      datasets: [{
        label: 'Голоса',
        data: data.options.map(o => o.votes),
        backgroundColor: COLORS.map(c => c + '33'),
        borderColor: COLORS,
        borderWidth: 2,
        borderRadius: view === 'bar' ? 8 : 0,
      }]
    };
  }, [data, view]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: (view === 'pie' ? 'bottom' : 'top') as 'bottom' | 'top',
        labels: { color: 'rgba(245,245,240,0.5)', font: { family: "'DM Sans', sans-serif", size: 12 } }
      }
    },
    scales: view === 'bar' ? {
      x: { ticks: { color: 'rgba(245,245,240,0.4)' }, grid: { color: 'rgba(255,255,255,0.04)' } },
      y: { ticks: { color: 'rgba(245,245,240,0.4)', stepSize: 1 }, grid: { color: 'rgba(255,255,255,0.04)' } }
    } : undefined
  };

  if (!data || !chartData) {
    return <div className="loader"><div className="spinner" /><span>Загружаем результаты…</span></div>;
  }

  return (
    <div className="container container--wide">
      {/* Nav */}
      <nav className="nav">
        <span className="nav-logo">
          <div className="nav-logo-mark">📊</div>
          <span className="nav-logo-text">Результаты</span>
        </span>
        <Link to="/" className="nav-link">← Голосовать</Link>
      </nav>

      {/* Top bar */}
      <div className="results-topbar">
        <h1 className="results-title">{data.question}</h1>
        <div className="results-meta-stack">
          <div className="live-pill"><span className="dot" />Live</div>
          <div className="votes-pill">Проголосовали: <span>{data.total_votes}</span></div>
        </div>
      </div>

      {/* Winner banner */}
      {data.total_votes > 0 && (
        <motion.div
          className="winner-banner"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="winner-label">🏆 Лидирует</div>
          <div className="winner-name">
            <span className="w-emoji">{winner.emoji}</span>{winner.text}
          </div>
          <div className="winner-stats">
            <div className="w-stat">
              <span className="w-stat-num">{winnerPct}%</span>
              <span className="w-stat-lbl">Доля голосов</span>
            </div>
            <div className="w-stat">
              <span className="w-stat-num">{winner.votes}</span>
              <span className="w-stat-lbl">Голосов</span>
            </div>
            <div className="w-stat">
              <span className="w-stat-num">{data.total_votes}</span>
              <span className="w-stat-lbl">Всего</span>
            </div>
          </div>
          <div className="winner-trophy">🏆</div>
        </motion.div>
      )}

      {/* Stats row */}
      <div className="stats-row">
        <div className="stat-box">
          <span className="stat-box-num">{data.total_votes}</span>
          <span className="stat-box-lbl">Голосов</span>
        </div>
        <div className="stat-box">
          <span className="stat-box-num">{data.options.length}</span>
          <span className="stat-box-lbl">Вариантов</span>
        </div>
        <div className="stat-box">
          <span className="stat-box-num">{winnerPct}%</span>
          <span className="stat-box-lbl">Доля лидера</span>
        </div>
      </div>

      {/* Chart */}
      <div className="tabs">
        <button className={`tab-btn${view === 'bar' ? ' active' : ''}`} onClick={() => setView('bar')}>Столбцы</button>
        <button className={`tab-btn${view === 'pie' ? ' active' : ''}`} onClick={() => setView('pie')}>Круговая</button>
      </div>

      <div className="chart-box">
        <div className="chart-inner">
          {view === 'bar' ? <Bar data={chartData} options={chartOptions} /> : <Doughnut data={chartData} options={chartOptions} />}
        </div>
      </div>

      {/* Detail bars */}
      <p className="result-title">Детальный разбор</p>
      <div className="result-list">
        <AnimatePresence>
          {sorted.map((opt, rank) => {
            const pct = data.total_votes > 0 ? Math.round((opt.votes / data.total_votes) * 100) : 0;
            const colorIdx = data.options.findIndex(o => o.id === opt.id);
            const color = COLORS[colorIdx] || COLORS[0];
            const isWinner = rank === 0 && data.total_votes > 0;

            return (
              <motion.div
                key={opt.id}
                layout
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 280, damping: 22, delay: rank * 0.06 }}
                className={`ritem${isWinner ? ' ritem--winner' : ''}`}
              >
                <div className="ritem-top">
                  <div className="ritem-label">
                    <span className="ritem-emoji">{opt.emoji}</span>
                    <span>{opt.text}</span>
                    {isWinner && <span className="ritem-crown">👑</span>}
                  </div>
                  <div className="ritem-right">
                    <span className="ritem-pct">{pct}%</span>
                    <span className="ritem-votes">{opt.votes} гол.</span>
                  </div>
                </div>
                <div className="ritem-track">
                  <motion.div
                    className="ritem-fill"
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.9, ease: [0.4,0,0.2,1] }}
                    style={{ background: color }}
                  />
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="page-footer">
        <span className="footer-update">Обновлено: {lastUpdate}</span>
        <div className="footer-nav">
          <Link to="/">🗳 Проголосовать</Link>
        </div>
      </div>
    </div>
  );
}
