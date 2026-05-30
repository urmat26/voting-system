import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { fetchData, updateData, VotingData } from '../api';
import { CONFIG } from '../config';

export default function Vote() {
  const [data, setData] = useState<VotingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('voted_graduation')) {
      setHasVoted(true);
    }
    loadData();
  }, []);

  async function loadData() {
    try {
      const res = await fetchData();
      setData(res);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки');
      setLoading(false);
    }
  }

  const fireConfetti = () => {
    const duration = 2500;
    const end = Date.now() + duration;

    (function frame() {
      confetti({ particleCount: 4, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#6c63ff', '#43e97b', '#f7971e', '#ff6584'] });
      confetti({ particleCount: 4, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#6c63ff', '#43e97b', '#f7971e', '#ff6584'] });
      if (Date.now() < end) requestAnimationFrame(frame);
    }());
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    const shareData = {
      title: 'Голосование за выпускной!',
      text: 'Я проголосовал за формат выпускного 2026. Выбери и ты!',
      url: window.location.origin
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        alert('Ссылка скопирована!');
      }
    } catch (err) {}
  };

  const submitVote = async () => {
    if (!selectedId || !data) return;
    setIsSubmitting(true);
    
    try {
      const freshData = await fetchData();
      const option = freshData.options.find(o => o.id === selectedId);
      if (option) {
        option.votes += 1;
        freshData.total_votes += 1;
        await updateData(freshData);
        localStorage.setItem('voted_graduation', selectedId.toString());
        setData(freshData);
        setHasVoted(true);
        fireConfetti();
      }
    } catch (err) {
      alert('Ошибка при отправке голоса');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loader"><div className="spinner"></div>Загружаем данные…</div>
      </div>
    );
  }

  if (error || !data) {
    return <div className="container"><div className="error-msg">{error}</div></div>;
  }

  return (
    <div className="container">
      <div className="brand">
        <div className="brand-icon">🗳️</div>
        <span className="brand-text">Школьное голосование</span>
      </div>

      {hasVoted ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="success-screen show">
          <div className="success-icon">✓</div>
          <h2 className="success-title">Голос принят!</h2>
          <p className="success-sub">Спасибо за участие. Текущие результаты:</p>
          
          <div className="card mini-results">
            {data.options.map((opt, i) => {
              const pct = data.total_votes > 0 ? Math.round((opt.votes / data.total_votes) * 100) : 0;
              const color = CONFIG.OPTION_COLORS[i]?.bar || '#6c63ff';
              return (
                <div key={opt.id} className="mini-bar-row">
                  <span className="mini-bar-label">{opt.emoji} {opt.text}</span>
                  <div className="mini-bar-track">
                    <motion.div 
                      className="mini-bar-fill" 
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 1, delay: i * 0.1 }}
                      style={{ background: color }} 
                    />
                  </div>
                  <span className="mini-bar-pct">{pct}%</span>
                </div>
              );
            })}
          </div>

          <p style={{ marginTop: 16, fontSize: 13, color: 'rgba(240,240,255,0.4)' }}>
            Всего проголосовало: <strong style={{ color: '#f0f0ff' }}>{data.total_votes}</strong>
          </p>

          <div className="footer-link" style={{ marginTop: 28, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link to="/results">📊 Полные результаты</Link>
            <a href="#" onClick={handleShare} style={{ background: 'rgba(255,255,255,0.08)' }}>📤 Поделиться</a>
          </div>
        </motion.div>
      ) : (
        <>
          <div className="hero">
            <div className="hero-badge"><span className="dot"></span>Голосование открыто</div>
            <h1 className="hero-title">{data.question}</h1>
            <p className="hero-subtitle">Выбери один вариант и нажми «Проголосовать». Голосовать можно только один раз.</p>
          </div>

          <div className="card">
            <div className="options-grid">
              {data.options.map((opt, i) => {
                const color = CONFIG.OPTION_COLORS[i] || CONFIG.OPTION_COLORS[0];
                const isSelected = selectedId === opt.id;
                
                return (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    key={opt.id}
                    className={`option-btn ${isSelected ? 'selected' : ''}`}
                    style={{ '--option-gradient': color.gradient } as any}
                    onClick={() => setSelectedId(opt.id)}
                  >
                    <span className="option-num">{i + 1}</span>
                    <span className="option-text">{opt.text}</span>
                    <span className="option-emoji">{opt.emoji}</span>
                  </motion.button>
                );
              })}
            </div>

            <button 
              className="btn-submit" 
              onClick={submitVote} 
              disabled={!selectedId || isSubmitting}
            >
              {isSubmitting ? 'Отправляем...' : selectedId ? 'Проголосовать →' : 'Выбери вариант выше ↑'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
