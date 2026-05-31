import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { fetchData, updateData, VotingData } from '../api';
import { CONFIG } from '../config';

const OPTION_COLORS = ['#e8ff47','#3de8ff','#ff7a27','#ff3d6e'];

export default function Vote() {
  const [data, setData] = useState<VotingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('voted_graduation')) setHasVoted(true);
    loadData();
  }, []);

  async function loadData() {
    try {
      setData(await fetchData());
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  }

  const fireConfetti = () => {
    const end = Date.now() + 2500;
    (function frame() {
      confetti({ particleCount: 4, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#e8ff47','#3de8ff','#ff7a27','#ff3d6e'] });
      confetti({ particleCount: 4, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#e8ff47','#3de8ff','#ff7a27','#ff3d6e'] });
      if (Date.now() < end) requestAnimationFrame(frame);
    }());
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Голосование!', text: 'Выбери и ты!', url: window.location.origin });
      } else {
        await navigator.clipboard.writeText(window.location.origin);
        alert('Ссылка скопирована!');
      }
    } catch {}
  };

  const submitVote = async () => {
    if (!selectedId || !data) return;
    setIsSubmitting(true);
    try {
      const fresh = await fetchData();
      const opt = fresh.options.find(o => o.id === selectedId);
      if (opt) {
        opt.votes += 1;
        fresh.total_votes += 1;
        await updateData(fresh);
        localStorage.setItem('voted_graduation', selectedId.toString());
        setData(fresh);
        setHasVoted(true);
        fireConfetti();
      }
    } catch {
      alert('Ошибка при отправке голоса');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loader"><div className="spinner" /><span>Загружаем…</span></div>
      </div>
    );
  }

  if (error || !data) {
    return <div className="container"><div className="error-box">{error}</div></div>;
  }

  return (
    <div className="container">
      {/* Nav */}
      <nav className="nav">
        <span className="nav-logo">
          <div className="nav-logo-mark">🗳</div>
          <span className="nav-logo-text">Голосование</span>
        </span>
        <Link to="/results" className="nav-link">Результаты →</Link>
      </nav>

      {hasVoted ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="success-wrap">
          <div className="success-badge">✓</div>
          <h2 className="success-title">Голос принят!</h2>
          <p className="success-sub">Спасибо за участие. Текущие результаты:</p>

          <div className="mini-results">
            {data.options.map((opt, i) => {
              const pct = data.total_votes > 0 ? Math.round((opt.votes / data.total_votes) * 100) : 0;
              return (
                <div key={opt.id} className="mini-row">
                  <span className="mini-name">{opt.emoji} {opt.text}</span>
                  <div className="mini-track">
                    <motion.div
                      className="mini-fill"
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.9, delay: i * 0.1 }}
                      style={{ background: OPTION_COLORS[i] }}
                    />
                  </div>
                  <span className="mini-pct">{pct}%</span>
                </div>
              );
            })}
            <p className="total-hint">Всего голосов: <strong>{data.total_votes}</strong></p>
          </div>

          <div className="action-links">
            <Link to="/results" className="primary">📊 Полные результаты</Link>
            <a href="#" onClick={handleShare}>📤 Поделиться</a>
          </div>
        </motion.div>
      ) : (
        <>
          <div className="hero">
            <div className="hero-tag"><span className="dot" />Голосование открыто</div>
            <h1 className="hero-title">
              {data.question.split(' ').map((word, i, arr) =>
                i === arr.length - 1 ? <em key={i}>{word}</em> : word + ' '
              )}
            </h1>
            <p className="hero-sub">Выбери один вариант и нажми кнопку. Голосовать можно только один раз.</p>
          </div>

          <div className="vote-card">
            <div className="options-list">
              {data.options.map((opt, i) => (
                <motion.button
                  key={opt.id}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className={`option-btn${selectedId === opt.id ? ' selected' : ''}`}
                  onClick={() => setSelectedId(opt.id)}
                >
                  <span className="option-idx">{i + 1}</span>
                  <span className="option-label">{opt.text}</span>
                  <span className="option-emoji">{opt.emoji}</span>
                </motion.button>
              ))}
            </div>

            <button
              className="btn-vote"
              onClick={submitVote}
              disabled={!selectedId || isSubmitting}
            >
              {isSubmitting ? 'Отправляем...' : selectedId ? 'Проголосовать' : 'Выбери вариант выше'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
